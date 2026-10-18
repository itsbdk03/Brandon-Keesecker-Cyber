-- IncidentDesk v3 / production-style hardening.
-- Apply after 0002_workflows.sql. This migration corresponds to the tested live DB changes.
-- Do not reapply blindly to a project where these changes already exist.
drop policy if exists members_insert on public.workspace_members;
revoke insert on public.workspace_members from authenticated;

alter table public.incident_evidence add column if not exists parent_evidence_id uuid;
alter table public.incident_evidence add constraint incident_evidence_same_case_key unique (id,incident_id);
alter table public.incident_evidence add constraint evidence_parent_same_case
 foreign key(parent_evidence_id,incident_id) references public.incident_evidence(id,incident_id);
create unique index if not exists evidence_one_successor_idx
 on public.incident_evidence(parent_evidence_id) where parent_evidence_id is not null;
create or replace function private.validate_evidence_revision()
returns trigger language plpgsql set search_path=''
as $fn$
declare predecessor public.incident_evidence%rowtype;
begin
 if new.parent_evidence_id is null then new.version=1;
 else
  select * into predecessor from public.incident_evidence
  where id=new.parent_evidence_id and incident_id=new.incident_id;
  if not found then raise exception 'Preceding evidence must belong to same incident'; end if;
  new.version=predecessor.version+1;
  if new.original_name<>predecessor.original_name then raise exception 'Evidence revision filename mismatch'; end if;
 end if;
 return new;
end
$fn$;
revoke all on function private.validate_evidence_revision() from public,anon,authenticated;
create trigger validate_evidence_revision before insert on public.incident_evidence
 for each row execute function private.validate_evidence_revision();

alter table public.incidents add column if not exists search_vector tsvector
 generated always as (to_tsvector('english'::regconfig,coalesce(title,'')||' '||coalesce(description,''))) stored;
create index if not exists incidents_search_idx on public.incidents using gin(search_vector);
create index if not exists incidents_workspace_deadline_idx on public.incidents(workspace_id,due_at)
 where status not in ('contained','resolved');

create or replace function public.workspace_incident_metrics(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $fn$
select jsonb_build_object(
 'total',count(*),'open',count(*) filter(where status<>'resolved'),
 'critical',count(*) filter(where severity='critical' and status<>'resolved'),
 'contained',count(*) filter(where status='contained'),
 'resolved',count(*) filter(where status='resolved'),
 'overdue',count(*) filter(where due_at<now() and status not in ('contained','resolved')),
 'bySeverity',jsonb_build_object(
  'critical',count(*) filter(where severity='critical'),
  'high',count(*) filter(where severity='high'),
  'medium',count(*) filter(where severity='medium'),
  'low',count(*) filter(where severity='low')),
 'byStatus',jsonb_build_object(
  'new',count(*) filter(where status='new'),
  'triage',count(*) filter(where status='triage'),
  'investigating',count(*) filter(where status='investigating'),
  'contained',count(*) filter(where status='contained'),
  'resolved',count(*) filter(where status='resolved'))
) from public.incidents where workspace_id=wid;
$fn$;
revoke all on function public.workspace_incident_metrics(uuid) from public,anon;
grant execute on function public.workspace_incident_metrics(uuid) to authenticated;
