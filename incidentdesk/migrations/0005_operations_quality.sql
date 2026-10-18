-- IncidentDesk v5: operations, evidence custody, metrics, secure in-app alerts.
-- New public tables use RLS and explicit grants; no client-issued audit/custody writes.
-- Baseline: migrations 0001-0004 already applied on the existing production project.

-- Foreign-key performance findings, without removing unused indexes on empty tables.
create index if not exists evidence_parent_case_cover_idx on public.incident_evidence(parent_evidence_id,incident_id);
create index if not exists invitations_accepted_by_idx on public.workspace_invitations(accepted_by);
create index if not exists invitations_created_by_idx on public.workspace_invitations(created_by);

-- Existing synthetic-safe response playbooks; only platform administrators can edit templates.
create table if not exists public.response_playbooks(
 id text primary key check(id ~ '^[a-z0-9_]{3,40}$'),
 title text not null check(length(title) between 5 and 100),
 description text not null,
 steps jsonb not null check(jsonb_typeof(steps)='array' and jsonb_array_length(steps) between 2 and 15),
 created_at timestamptz not null default now()
);
insert into public.response_playbooks(id,title,description,steps) values
 ('identity','Suspicious sign-in','Validate an account incident before attribution.',
  '[{"key":"confirm","title":"Validate alert provenance and sign-in timestamps"},{"key":"identity","title":"Confirm identity and MFA challenge records"},{"key":"session","title":"Review session and device context"},{"key":"contain","title":"Document containment decisions"},{"key":"report","title":"Record outcome and residual risk"}]'),
 ('endpoint','Endpoint execution','Examine the fictional endpoint without assuming malware.',
  '[{"key":"scope","title":"Record process tree and execution timestamps"},{"key":"artifact","title":"Verify hashes and software signing"},{"key":"network","title":"Correlate associated network events"},{"key":"decision","title":"Document isolation decision"},{"key":"close","title":"Capture findings and owner sign-off"}]'),
 ('cloud','Cloud policy drift','Investigate misconfiguration and validate correction evidence.',
  '[{"key":"resource","title":"Identify affected cloud resource"},{"key":"baseline","title":"Compare to approved policy baseline"},{"key":"scope","title":"Determine modeled affected scope"},{"key":"fix","title":"Record change and independent recheck"},{"key":"review","title":"Document review and unresolved exposure"}]'),
 ('exposure','Potential data exposure','Scope the potential exposure without making unsupported claims.',
  '[{"key":"source","title":"Validate alert source and timeline"},{"key":"scope","title":"Identify assets and data classifications"},{"key":"access","title":"Review access logs and object permissions"},{"key":"preserve","title":"Preserve fictional investigation artifacts"},{"key":"notify","title":"Document escalation and legal-review decision"}]')
on conflict(id) do nothing;
alter table public.response_playbooks enable row level security;
revoke all on public.response_playbooks from anon,authenticated;
grant select on public.response_playbooks to authenticated;
create policy playbook_catalog_read on public.response_playbooks for select to authenticated using((select auth.uid()) is not null);

create table if not exists public.incident_playbook_steps(
 id uuid primary key default gen_random_uuid(),
 incident_id uuid not null references public.incidents(id) on delete cascade,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 playbook_id text not null references public.response_playbooks(id),
 step_key text not null check(length(step_key) between 2 and 40),
 step_title text not null check(length(step_title) between 3 and 160),
 note text not null default '' check(length(note)<=1500),
 completed_at timestamptz,
 completed_by uuid references auth.users(id),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(incident_id,playbook_id,step_key),
 constraint step_matches_incident foreign key(incident_id,workspace_id)
  references public.incidents(id,workspace_id)
);
create index if not exists incident_playbook_incident_idx on public.incident_playbook_steps(incident_id);
create index if not exists incident_playbook_creator_idx on public.incident_playbook_steps(created_by);
create index if not exists incident_playbook_completer_idx on public.incident_playbook_steps(completed_by);
alter table public.incident_playbook_steps enable row level security;
revoke all on public.incident_playbook_steps from anon,authenticated;
grant select,insert on public.incident_playbook_steps to authenticated;
grant update(note,completed_at,completed_by) on public.incident_playbook_steps to authenticated;
create policy incident_steps_read on public.incident_playbook_steps for select to authenticated
 using((select private.member_of(workspace_id)));
create policy incident_steps_insert on public.incident_playbook_steps for insert to authenticated
 with check((select private.can_edit(workspace_id)) and created_by=(select auth.uid())
 and completed_by is null and completed_at is null);
create policy incident_steps_update on public.incident_playbook_steps for update to authenticated
 using((select private.can_edit(workspace_id)))
 with check((select private.can_edit(workspace_id))
 and (completed_by is null or completed_by=(select auth.uid()))
 and ((completed_by is null and completed_at is null) or (completed_by is not null and completed_at is not null)));

-- Append-only, server-triggered log for evidence access and metadata events.
create table if not exists public.evidence_custody_events(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 incident_id uuid not null references public.incidents(id) on delete cascade,
 evidence_id uuid not null references public.incident_evidence(id) on delete cascade,
 actor_id uuid references auth.users(id),
 action text not null check(action in ('registered','versioned','download_verified','download_failed')),
 sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 description text not null default '' check(length(description)<=300),
 occurred_at timestamptz not null default now()
);
create index if not exists custody_case_time_idx on public.evidence_custody_events(incident_id,occurred_at desc);
create index if not exists custody_actor_idx on public.evidence_custody_events(actor_id);
create index if not exists custody_evidence_idx on public.evidence_custody_events(evidence_id);
alter table public.evidence_custody_events enable row level security;
revoke all on public.evidence_custody_events from anon,authenticated;
grant select on public.evidence_custody_events to authenticated;
create policy custody_read on public.evidence_custody_events for select to authenticated
 using((select private.member_of(workspace_id)));
create or replace function private.log_evidence_registration()
returns trigger language plpgsql security definer set search_path=''
as $fn$
begin
 insert into public.evidence_custody_events(workspace_id,incident_id,evidence_id,actor_id,action,sha256,description)
 values(new.workspace_id,new.incident_id,new.id,new.uploaded_by,
 case when new.parent_evidence_id is null then 'registered' else 'versioned' end,
 new.sha256,'Metadata registered; digest provided by uploader, not independently verified');
 return new;
end
$fn$;
revoke all on function private.log_evidence_registration() from public,anon,authenticated;
drop trigger if exists record_evidence_custody on public.incident_evidence;
create trigger record_evidence_custody after insert on public.incident_evidence
for each row execute function private.log_evidence_registration();

-- Viewers can inspect their own in-app alerts, but cannot forge server-generated alerts.
create table if not exists public.incident_notifications(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 incident_id uuid not null references public.incidents(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 type text not null check(type in ('assigned','sla_due','sla_overdue','invite')),
 title text not null check(length(title) between 3 and 180),
 detail text not null default '' check(length(detail)<=600),
 created_at timestamptz not null default now(),
 seen_at timestamptz,
 email_status text not null default 'unconfigured' check(email_status in ('unconfigured','queued','delivered','failed')),
 email_attempts integer not null default 0 check(email_attempts>=0),
 last_attempt_at timestamptz,
 unique(incident_id,recipient_id,type)
);
create index if not exists notifications_recipient_time_idx on public.incident_notifications(recipient_id,created_at desc);
create index if not exists notifications_workspace_idx on public.incident_notifications(workspace_id);
alter table public.incident_notifications enable row level security;
revoke all on public.incident_notifications from anon,authenticated;
grant select on public.incident_notifications to authenticated;
grant update(seen_at) on public.incident_notifications to authenticated;
create policy notifications_read on public.incident_notifications for select to authenticated
 using(recipient_id=(select auth.uid()) and (select private.member_of(workspace_id)));
create policy notifications_seen on public.incident_notifications for update to authenticated
 using(recipient_id=(select auth.uid()) and (select private.member_of(workspace_id)))
 with check(recipient_id=(select auth.uid()) and (select private.member_of(workspace_id)));

create or replace function private.queue_incident_alerts() returns integer
language plpgsql security definer set search_path=''
as $fn$
declare inserted_count integer := 0;
begin
 -- This scheduled routine is strictly limited to current, assigned incidents in genuine workspaces.
 insert into public.incident_notifications(workspace_id,incident_id,recipient_id,type,title,detail)
 select i.workspace_id,i.id,i.assigned_to,
 case when i.due_at<now() then 'sla_overdue' else 'sla_due' end,
 case when i.due_at<now() then 'Response overdue' else 'Response due soon' end,
 'Illustrative response deadline for case '||i.id::text
 from public.incidents i
 join public.workspace_members m on m.workspace_id=i.workspace_id and m.user_id=i.assigned_to
 where i.assigned_to is not null and i.status not in ('contained','resolved')
 and i.due_at is not null and i.due_at<=now()+interval '30 minutes'
 on conflict(incident_id,recipient_id,type) do nothing;
 get diagnostics inserted_count = row_count;
 return inserted_count;
end
$fn$;
revoke all on function private.queue_incident_alerts() from public,anon,authenticated;

-- Expose an RLS-invoker analytics function, no cross-workspace aggregation.
create or replace function public.incident_soc_metrics(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $fn$
 select jsonb_build_object(
 'cases',count(*),
 'resolved',count(*) filter(where status='resolved'),
 'response_sla_percent',
 case when count(*)=0 then null else round(100.0*count(*) filter(where status not in ('new') and (due_at is null or updated_at<=due_at))/count(*),1) end,
 'avg_age_hours',round(coalesce(avg(extract(epoch from (coalesce(updated_at,now())-created_at))/3600.0),0)::numeric,1),
 'overdue_open',count(*) filter(where due_at<now() and status not in ('contained','resolved')),
 'unassigned',count(*) filter(where assigned_to is null)
 ) from public.incidents
 where workspace_id=wid and (select private.member_of(wid))
$fn$;
revoke all on function public.incident_soc_metrics(uuid) from public,anon;
grant execute on function public.incident_soc_metrics(uuid) to authenticated;

-- Regularly enqueue in-app warnings (no email deliveries or external network requests).
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('incidentdesk-sla-alerts','*/15 * * * *',
 'select private.queue_incident_alerts()');
