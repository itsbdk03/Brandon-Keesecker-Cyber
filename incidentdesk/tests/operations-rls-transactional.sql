-- IncidentDesk v5-v9 operational RLS regression.
-- Run on STAGING only. All generated Auth users/rows are within a transaction and rolled back.
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
 ('33333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ops-test-a@example.invalid','',now(),now(),now()),
 ('44444444-4444-4444-8444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ops-test-b@example.invalid','',now(),now(),now());
insert into public.workspaces(id,name,created_by) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Operations A','33333333-3333-4333-8333-333333333333'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Operations B','44444444-4444-4444-8444-444444444444');
insert into public.incidents(id,workspace_id,title,description,severity,status,created_by,assigned_to)
values
 ('cccccccc-3333-4333-8333-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Synthetic operations A','rollback-only case','critical','new','33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333'),
 ('dddddddd-4444-4444-8444-dddddddddddd','dddddddd-dddd-4ddd-8ddd-dddddddddddd','Synthetic operations B','rollback-only case','high','new','44444444-4444-4444-8444-444444444444','44444444-4444-4444-8444-444444444444');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated","email":"ops-test-a@example.invalid"}',true);
insert into public.incident_playbook_steps
(incident_id,workspace_id,playbook_id,step_key,step_title,created_by)
values
('cccccccc-3333-4333-8333-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','identity','confirm','Validate fictional activity','33333333-3333-4333-8333-333333333333');
do $test$
declare status jsonb;
begin
 if (select count(*) from public.incident_playbook_steps)<>1 then raise exception 'Missing own playbook step';end if;
 if (select count(*) from public.incident_notifications)<>1 then raise exception 'Assignment notifications escaped own workspace';end if;
 status=public.incident_soc_metrics('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 if (status->>'cases')::integer<>1 then raise exception 'Incorrect own tenant analytics';end if;
 if has_table_privilege('authenticated','public.evidence_custody_events','INSERT') then raise exception 'Client may forge custody events';end if;
 if has_function_privilege('authenticated','private.queue_incident_alerts()','EXECUTE') then raise exception 'Client may run privileged background dispatcher';end if;
end $test$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated","email":"ops-test-b@example.invalid"}',true);
do $test$
declare affected integer; blocked boolean:=false; result jsonb;
begin
 if (select count(*) from public.incident_playbook_steps)<>0 then raise exception 'Cross-tenant playbook read';end if;
 if (select count(*) from public.incident_notifications)<>1 then raise exception 'Cross-tenant notification read';end if;
 if (select count(*) from public.evidence_custody_events)<>0 then raise exception 'Unexpected custody read';end if;
 result=public.incident_soc_metrics('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
 if (result->>'cases')::integer<>0 then raise exception 'Cross-tenant analytics aggregation';end if;
 update public.incident_playbook_steps set note='unauthorized' where incident_id='cccccccc-3333-4333-8333-cccccccccccc';
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-tenant playbook mutation succeeded';end if;
 begin
 insert into public.incident_playbook_steps(incident_id,workspace_id,playbook_id,step_key,step_title,created_by)
 values('cccccccc-3333-4333-8333-cccccccccccc','cccccccc-cccc-4ccc-8ccc-cccccccccccc','identity','scope','Forbidden','44444444-4444-4444-8444-444444444444');
 exception when others then blocked=true;
 end;
 if not blocked then raise exception 'Cross-tenant playbook insertion succeeded';end if;
end $test$;
rollback;
