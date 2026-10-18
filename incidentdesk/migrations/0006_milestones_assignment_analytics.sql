-- IncidentDesk 0006: accurate SOC milestones, assignment alerts and remaining FK indexes.
-- Requires 0005, runs without operational incidents. No user data is deleted.
create index if not exists custody_workspace_cover_idx on public.evidence_custody_events(workspace_id);
create index if not exists playbook_steps_playbook_cover_idx on public.incident_playbook_steps(playbook_id);
create index if not exists playbook_steps_workspace_cover_idx on public.incident_playbook_steps(workspace_id);
create index if not exists playbook_steps_incident_workspace_cover_idx on public.incident_playbook_steps(incident_id,workspace_id);

alter table public.incidents add column if not exists acknowledged_at timestamptz;
alter table public.incidents add column if not exists resolved_at timestamptz;

create or replace function private.track_incident_milestones()
returns trigger language plpgsql set search_path=''
as $fn$
begin
 if tg_op='INSERT' then
  if new.status<>'new' then new.acknowledged_at:=now();end if;
  if new.status='resolved' then new.resolved_at:=now();end if;
 else
  if new.status<>'new' and new.acknowledged_at is null then new.acknowledged_at:=now();end if;
  if new.status='resolved' and old.status is distinct from 'resolved' then new.resolved_at:=now();end if;
  if new.status<>'resolved' and old.status='resolved' then new.resolved_at:=null;end if;
 end if;
 return new;
end
$fn$;
revoke all on function private.track_incident_milestones() from public,anon,authenticated;
drop trigger if exists incident_milestones on public.incidents;
create trigger incident_milestones before insert or update on public.incidents
for each row execute function private.track_incident_milestones();

create or replace function private.notify_assignment()
returns trigger language plpgsql security definer set search_path=''
as $fn$
begin
 if new.assigned_to is not null and (tg_op='INSERT' or old.assigned_to is distinct from new.assigned_to) then
  insert into public.incident_notifications(workspace_id,incident_id,recipient_id,type,title,detail)
  values(new.workspace_id,new.id,new.assigned_to,'assigned','Incident assigned',
   'New incident assignment: '||left(new.title,130))
  on conflict(incident_id,recipient_id,type) do update set
   created_at=now(),seen_at=null,title=excluded.title,detail=excluded.detail,
   email_status='unconfigured',email_attempts=0,last_attempt_at=null;
 end if;
 return new;
end
$fn$;
revoke all on function private.notify_assignment() from public,anon,authenticated;
drop trigger if exists incident_assignment_notice on public.incidents;
create trigger incident_assignment_notice after insert or update of assigned_to on public.incidents
for each row execute function private.notify_assignment();

create or replace function public.incident_soc_metrics(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $fn$
select jsonb_build_object(
 'cases', count(*),
 'resolved', count(*) filter(where status='resolved'),
 'overdue_open', count(*) filter(where due_at<now() and status not in ('contained','resolved')),
 'unassigned', count(*) filter(where assigned_to is null),
 'avg_ack_minutes',round(avg(extract(epoch from (acknowledged_at-created_at))/60) filter(where acknowledged_at is not null)::numeric,1),
 'avg_resolution_hours',round(avg(extract(epoch from (resolved_at-created_at))/3600) filter(where resolved_at is not null)::numeric,1),
 'response_sla_percent',
 case when count(*) filter(where acknowledged_at is not null)=0 then null
 else round(100.0*count(*) filter(where acknowledged_at is not null and acknowledged_at<=due_at)
 /count(*) filter(where acknowledged_at is not null),1) end,
 'acknowledged_sample', count(*) filter(where acknowledged_at is not null),
 'resolved_sample',count(*) filter(where resolved_at is not null)
) from public.incidents
where workspace_id=wid and (select private.member_of(wid))
$fn$;
revoke all on function public.incident_soc_metrics(uuid) from public,anon;
grant execute on function public.incident_soc_metrics(uuid) to authenticated;
