-- Transactional IncidentDesk v9 full-workspace trend RLS regression.
-- All fake identities, workspaces and incidents are rolled back.
begin;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values
 ('55555555-5555-4555-8555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','incidentdesk-trend-a@example.invalid','',now(),now(),now()),
 ('66666666-6666-4666-8666-666666666666','00000000-0000-0000-0000-000000000000','authenticated','authenticated','incidentdesk-trend-b@example.invalid','',now(),now(),now());
insert into public.workspaces(id,name,created_by) values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Trend Tenant A','55555555-5555-4555-8555-555555555555'),
 ('ffffffff-ffff-4fff-8fff-ffffffffffff','Trend Tenant B','66666666-6666-4666-8666-666666666666');
insert into public.incidents(id,workspace_id,title,description,severity,status,created_by,assigned_to)
values
 ('eeeeeeee-1111-4111-8111-eeeeeeeeeeee','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Synthetic trend A first','Fictional only','high','new','55555555-5555-4555-8555-555555555555','55555555-5555-4555-8555-555555555555'),
 ('eeeeeeee-2222-4222-8222-eeeeeeeeeeee','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Synthetic trend A second','Fictional only','low','new','55555555-5555-4555-8555-555555555555','55555555-5555-4555-8555-555555555555'),
 ('ffffffff-1111-4111-8111-ffffffffffff','ffffffff-ffff-4fff-8fff-ffffffffffff','Synthetic trend B','Fictional only','low','new','66666666-6666-4666-8666-666666666666','66666666-6666-4666-8666-666666666666');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated","email":"incidentdesk-trend-a@example.invalid"}',true);
do $test$
declare own jsonb; alien jsonb;
begin
 own:=public.incident_soc_trends('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
 alien:=public.incident_soc_trends('ffffffff-ffff-4fff-8fff-ffffffffffff');
 if jsonb_array_length(own->'weekly')<>1 then raise exception 'Expected one distinct calendar week for tenant A';end if;
 if (own->'weekly'->0->>'count')::integer<>2 then raise exception 'Weekly aggregation did not count all tenant A records';end if;
 if jsonb_array_length(own->'workload')<>1 then raise exception 'Expected one assigned investigator';end if;
 if (own->'workload'->0->>'count')::integer<>2 then raise exception 'Workload aggregation lost records';end if;
 if jsonb_array_length(alien->'weekly')<>0 or jsonb_array_length(alien->'workload')<>0 then
  raise exception 'Cross-tenant aggregate data leaked';end if;
end
$test$;
rollback;
