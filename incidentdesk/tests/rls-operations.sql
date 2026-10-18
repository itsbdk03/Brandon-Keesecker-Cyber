-- IncidentDesk operational RLS regression. Run against isolated staging first.
-- Everything is inside a transaction and rolled back. Fake Auth identities never persist.
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('33333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','incidentdesk-ops-a@example.invalid','',now(),now(),now()),
('44444444-4444-4444-8444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','incidentdesk-ops-b@example.invalid','',now(),now(),now());
insert into public.workspaces(id,name,created_by) values
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Ops Sandbox A','33333333-3333-4333-8333-333333333333'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Ops Sandbox B','44444444-4444-4444-8444-444444444444');
insert into public.incidents(id,workspace_id,title,description,severity,status,created_by,assigned_to) values
('cccccccc-1111-4111-8111-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Synthetic investigation A','Test only','high','new','33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333'),
('dddddddd-2222-4222-8222-dddddddddddd','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Synthetic investigation B','Test only','low','new','44444444-4444-4444-8444-444444444444','44444444-4444-4444-8444-444444444444');
insert into public.incident_playbook_steps(incident_id,workspace_id,playbook_id,step_key,step_title,created_by) values
('cccccccc-1111-4111-8111-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','identity','confirm','Validate A','33333333-3333-4333-8333-333333333333'),
('dddddddd-2222-4222-8222-dddddddddddd','dddddddd-dddd-4ddd-8ddd-dddddddddddd','identity','confirm','Validate B','44444444-4444-4444-8444-444444444444');
-- Assignment trigger creates per-user notifications for both tenants.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","email":"incidentdesk-ops-a@example.invalid"}',true);
do $test$
declare blocked boolean:=false; affected integer;
begin
 if (select count(*) from public.incident_playbook_steps)<>1 then raise exception 'Cross-tenant playbook read exposed';end if;
 if (select count(*) from public.incident_notifications)<>1 then raise exception 'Cross-tenant notification read exposed';end if;
 if (select count(*) from public.response_playbooks)<4 then raise exception 'Response catalog unavailable to authenticated user';end if;
 if (select public.incident_soc_metrics('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid)->>'cases')::integer <>0 then raise exception 'Cross-tenant metrics exposed';end if;
 begin
  insert into public.incident_playbook_steps(incident_id,workspace_id,playbook_id,step_key,step_title,created_by)
  values('dddddddd-2222-4222-8222-dddddddddddd','dddddddd-dddd-4ddd-8ddd-dddddddddddd','identity','identity','Unauthorized B step','33333333-3333-4333-8333-333333333333');
 exception when others then blocked=true;end;
 if not blocked then raise exception 'Cross-tenant playbook insert succeeded';end if;
 if has_table_privilege('authenticated','public.incident_notifications','INSERT') then raise exception 'Client may forge notifications';end if;
 if has_table_privilege('authenticated','public.evidence_custody_events','INSERT') then raise exception 'Client may forge custody history';end if;
end $test$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","email":"incidentdesk-ops-b@example.invalid"}',true);
do $test$
begin
 if (select count(*) from public.incident_playbook_steps)<>1 then raise exception 'Tenant B playbook RLS failed';end if;
 if (select count(*) from public.incident_notifications)<>1 then raise exception 'Tenant B notification RLS failed';end if;
end $test$;
rollback;
