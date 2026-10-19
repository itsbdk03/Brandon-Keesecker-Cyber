-- Rollback-only simulated JWT RLS integration test; staging only.
-- Metadata-only Storage rows; no bytes or real Auth sessions.
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
('55555555-5555-4555-8555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-sim-a@example.invalid','',now(),now(),now()),
('66666666-6666-4666-8666-666666666666','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-sim-b@example.invalid','',now(),now(),now()),
('77777777-7777-4777-8777-777777777777','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-sim-viewer@example.invalid','',now(),now(),now());
insert into public.workspaces(id,name,created_by) values
('55555555-aaaa-4555-8555-aaaaaaaaaaaa','Synthetic workspace A','55555555-5555-4555-8555-555555555555'),
('66666666-bbbb-4666-8666-bbbbbbbbbbbb','Synthetic workspace B','66666666-6666-4666-8666-666666666666');
insert into public.incidents(id,workspace_id,title,description,severity,status,created_by,assigned_to) values
('55555555-cccc-4555-8555-cccccccccccc','55555555-aaaa-4555-8555-aaaaaaaaaaaa','Synthetic incident A','fictional only','high','new','55555555-5555-4555-8555-555555555555','55555555-5555-4555-8555-555555555555'),
('66666666-dddd-4666-8666-dddddddddddd','66666666-bbbb-4666-8666-bbbbbbbbbbbb','Synthetic incident B','fictional only','medium','new','66666666-6666-4666-8666-666666666666','66666666-6666-4666-8666-666666666666');
insert into storage.objects(bucket_id,name,owner,owner_id) values
('incidentdesk-evidence','55555555-aaaa-4555-8555-aaaaaaaaaaaa/55555555-cccc-4555-8555-cccccccccccc/evidence-a/sample-a.txt','55555555-5555-4555-8555-555555555555','55555555-5555-4555-8555-555555555555'),
('incidentdesk-evidence','66666666-bbbb-4666-8666-bbbbbbbbbbbb/66666666-dddd-4666-8666-dddddddddddd/evidence-b/sample-b.txt','66666666-6666-4666-8666-666666666666','66666666-6666-4666-8666-666666666666');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","email":"rls-sim-a@example.invalid"}',true);
do $a$
declare n integer; rejected boolean:=false;
begin
 if (select count(*) from public.incidents where title like 'Synthetic incident %')<>1 then raise exception 'Incident isolation failed';end if;
 if (select count(*) from storage.objects where name like '%/sample-%.txt')<>1 then raise exception 'Storage metadata isolation failed';end if;
 insert into public.incident_comments(incident_id,author_id,body) values ('55555555-cccc-4555-8555-cccccccccccc','55555555-5555-4555-8555-555555555555','Fictional note');
 update public.incidents set status='triage',assigned_to='55555555-5555-4555-8555-555555555555' where id='55555555-cccc-4555-8555-cccccccccccc';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'Own status/assignment update failed';end if;
 insert into public.incident_evidence(incident_id,workspace_id,uploaded_by,storage_path,original_name,size_bytes,sha256,content_type)
 values ('55555555-cccc-4555-8555-cccccccccccc','55555555-aaaa-4555-8555-aaaaaaaaaaaa','55555555-5555-4555-8555-555555555555','55555555-aaaa-4555-8555-aaaaaaaaaaaa/55555555-cccc-4555-8555-cccccccccccc/evidence-a/sample-a.txt','sample-a.txt',35,repeat('a',64),'text/plain');
 if (select count(*) from public.evidence_custody_events where workspace_id='55555555-aaaa-4555-8555-aaaaaaaaaaaa')<>1 then raise exception 'Custody registration missing';end if;
 begin
  update public.incidents set assigned_to='66666666-6666-4666-8666-666666666666' where id='55555555-cccc-4555-8555-cccccccccccc';
  get diagnostics n=row_count;
  if n<>0 then raise exception 'Cross-workspace assignment accepted';end if;
 exception when insufficient_privilege or check_violation then rejected=true;
 end;
 if not rejected then raise exception 'Assignment rejection did not raise expected error';end if;
 update public.incidents set title='Forbidden' where id='66666666-dddd-4666-8666-dddddddddddd';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-workspace edit succeeded';end if;
end $a$;
insert into public.workspace_invitations(workspace_id,email,role,created_by)
values ('55555555-aaaa-4555-8555-aaaaaaaaaaaa','rls-sim-viewer@example.invalid','viewer','55555555-5555-4555-8555-555555555555');
select set_config('request.jwt.claims','{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated","email":"rls-sim-viewer@example.invalid"}',true);
do $v$
declare invited uuid; changed int; rejected boolean:=false;
begin
 select id into invited from public.my_pending_invitations() limit 1;
 if invited is null then raise exception 'Invitation unseen';end if;
 perform public.accept_workspace_invitation(invited);
 if (select count(*) from public.incidents where title like 'Synthetic incident %')<>1 then raise exception 'Viewer access scope wrong';end if;
 if (select count(*) from storage.objects where name like '%/sample-%.txt')<>1 then raise exception 'Viewer Storage metadata scope wrong';end if;
 update public.incidents set title='Forbidden viewer edit' where id='55555555-cccc-4555-8555-cccccccccccc';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Viewer modified incident';end if;
 begin
  insert into public.incident_comments(incident_id,author_id,body) values ('55555555-cccc-4555-8555-cccccccccccc','77777777-7777-4777-8777-777777777777','Forbidden viewer note');
 exception when others then rejected=true;
 end;
 if not rejected then raise exception 'Viewer wrote note';end if;
end $v$;
rollback;
