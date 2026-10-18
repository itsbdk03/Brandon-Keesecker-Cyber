-- IncidentDesk v3 RLS regression: run ONLY in a controlled project.
-- All synthetic users, workspaces, incidents and invitations are rolled back.
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
('11111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','incidentdesk-test-a@example.invalid','',now(),now(),now()),
('22222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','incidentdesk-test-b@example.invalid','',now(),now(),now());
insert into public.workspaces(id,name,created_by) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','RLS Synthetic A','11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','RLS Synthetic B','22222222-2222-4222-8222-222222222222');
insert into public.incidents(id,workspace_id,title,description,severity,status,created_by) values
('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','RLS Test Case A','rollback synthetic','high','new','11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','RLS Test Case B','rollback synthetic','high','new','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","email":"incidentdesk-test-a@example.invalid"}',true);
do $test$
declare affected integer; blocked boolean:=false;
begin
 if (select count(*) from public.incidents where title like 'RLS Test Case%')<>1 then raise exception 'Cross-tenant incident read'; end if;
 if (select count(*) from public.workspace_members where user_id='22222222-2222-4222-8222-222222222222')<>0 then raise exception 'Cross-tenant membership read'; end if;
 update public.incidents set title='Unauthorized' where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-tenant modification succeeded'; end if;
 begin
  insert into public.incident_comments(incident_id,author_id,body) values('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','Forbidden');
 exception when others then blocked=true;
 end;
 if not blocked then raise exception 'Cross-tenant comment inserted'; end if;
 if has_table_privilege('authenticated','public.workspace_members','INSERT') then raise exception 'Direct member insertion granted'; end if;
end $test$;
insert into public.workspace_invitations(workspace_id,email,role,created_by)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','incidentdesk-test-b@example.invalid','viewer','11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","email":"incidentdesk-test-b@example.invalid"}',true);
do $test$
declare invite_id uuid; accepted uuid; affected integer;
begin
 if (select count(*) from public.incidents where title like 'RLS Test Case%')<>1 then raise exception 'Tenant B could see A before invite'; end if;
 select id into invite_id from public.my_pending_invitations() limit 1;
 if invite_id is null then raise exception 'Confirmed user missing pending invitation'; end if;
 accepted=public.accept_workspace_invitation(invite_id);
 if accepted<>'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid then raise exception 'Wrong invited workspace'; end if;
 if (select role from public.workspace_members where workspace_id=accepted and user_id='22222222-2222-4222-8222-222222222222')<>'viewer' then raise exception 'Viewer role not assigned'; end if;
 if (select count(*) from public.incidents where title like 'RLS Test Case%')<>2 then raise exception 'Invited viewer cannot read authorized workspace'; end if;
 update public.incidents set title='Unauthorized viewer edit' where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Invited viewer modified incident'; end if;
end $test$;
rollback;
