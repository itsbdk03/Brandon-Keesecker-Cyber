-- IncidentDesk: apply AFTER ../schema.sql to a NEW project.
-- v2 foundations. Existing live project already has equivalent structures installed.
create table if not exists public.workspace_invitations(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 email text not null check(email=lower(trim(email)) and length(email) between 5 and 254),
 role text not null check(role in ('admin','analyst','viewer')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default(now()+interval '7 days'),
 accepted_at timestamptz,
 accepted_by uuid references auth.users(id),
 check(expires_at>created_at),
 check((accepted_at is null and accepted_by is null) or (accepted_at is not null and accepted_by is not null))
);
alter table public.workspace_invitations enable row level security;
revoke all on public.workspace_invitations from anon,authenticated;
grant select,insert on public.workspace_invitations to authenticated;
create policy invitations_admin_read on public.workspace_invitations for select to authenticated
 using((select private.is_admin(workspace_id)));
create policy invitations_admin_create on public.workspace_invitations for insert to authenticated
 with check((select private.is_admin(workspace_id)) and created_by=(select auth.uid())
 and accepted_at is null and accepted_by is null
 and expires_at>now() and expires_at<=now()+interval '8 days');
create index if not exists invitations_email_idx on public.workspace_invitations(email);

create or replace function public.my_pending_invitations()
returns table(id uuid,workspace_name text,role text,expires_at timestamptz)
language plpgsql stable security definer set search_path=''
as $fn$
declare recipient text;
begin
 if auth.uid() is null then return; end if;
 select lower(email) into recipient from auth.users where auth.users.id=auth.uid() and email_confirmed_at is not null;
 if recipient is null then return; end if;
 return query
 select i.id,w.name,i.role,i.expires_at from public.workspace_invitations i
 join public.workspaces w on w.id=i.workspace_id
 where i.email=recipient and i.accepted_at is null and i.expires_at>now()
 order by i.created_at desc limit 30;
end
$fn$;
revoke all on function public.my_pending_invitations() from public,anon;
grant execute on function public.my_pending_invitations() to authenticated;

create or replace function public.accept_workspace_invitation(invitation_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $fn$
declare recipient text; inv public.workspace_invitations%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select lower(email) into recipient from auth.users
 where auth.users.id=auth.uid() and email_confirmed_at is not null;
 if recipient is null then raise exception 'Confirmed email required'; end if;
 select * into inv from public.workspace_invitations i where i.id=invitation_id for update;
 if not found or inv.email<>recipient or inv.accepted_at is not null or inv.expires_at<=now()
 then raise exception 'Invitation unavailable'; end if;
 insert into public.workspace_members(workspace_id,user_id,role)
 values(inv.workspace_id,auth.uid(),inv.role)
 on conflict(workspace_id,user_id) do nothing;
 update public.workspace_invitations set accepted_at=now(),accepted_by=auth.uid()
 where id=invitation_id;
 return inv.workspace_id;
end
$fn$;
revoke all on function public.accept_workspace_invitation(uuid) from public,anon;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;

alter table public.incidents add column if not exists due_at timestamptz;
create or replace function private.enforce_incident_sla()
returns trigger language plpgsql set search_path=''
as $fn$
begin
 if tg_op='UPDATE' then
  if old.status<>new.status and not (
   (old.status='new' and new.status in ('triage','investigating','contained','resolved')) or
   (old.status='triage' and new.status in ('investigating','contained','resolved')) or
   (old.status='investigating' and new.status in ('contained','resolved','triage')) or
   (old.status='contained' and new.status in ('investigating','resolved')) or
   (old.status='resolved' and new.status='investigating')
  ) then raise exception 'Invalid incident lifecycle transition: % to %',old.status,new.status; end if;
 end if;
 if tg_op='INSERT' or new.severity is distinct from old.severity then
  new.due_at=coalesce(new.created_at,now())+case new.severity
   when 'critical' then interval '2 hours' when 'high' then interval '8 hours'
   when 'medium' then interval '24 hours' else interval '72 hours' end;
 end if;
 return new;
end
$fn$;
revoke all on function private.enforce_incident_sla() from public,anon,authenticated;
create trigger incident_sla before insert or update on public.incidents
for each row execute function private.enforce_incident_sla();

alter table public.incident_evidence
 add column if not exists sha256 text,
 add column if not exists content_type text,
 add column if not exists version integer not null default 1;
alter table public.incident_evidence
 add constraint evidence_sha256_valid check(sha256 ~ '^[0-9a-f]{64}$'),
 add constraint evidence_content_type_valid check(content_type in ('text/plain','text/csv','application/json','image/png','image/jpeg','application/pdf')),
 add constraint evidence_version_valid check(version between 1 and 100000);
-- Safe on a fresh empty installation. Existing data must be backfilled before NOT NULL.
alter table public.incident_evidence alter column sha256 set not null;
alter table public.incident_evidence alter column content_type set not null;

create or replace function public.workspace_incident_metrics(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $fn$
 select jsonb_build_object('total',count(*),'open',count(*) filter(where status<>'resolved'),
 'critical',count(*) filter(where severity='critical' and status<>'resolved'),
 'contained',count(*) filter(where status='contained'),
 'resolved',count(*) filter(where status='resolved'),
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
  'resolved',count(*) filter(where status='resolved')))
 from public.incidents where workspace_id=wid;
$fn$;
revoke all on function public.workspace_incident_metrics(uuid) from public,anon;
grant execute on function public.workspace_incident_metrics(uuid) to authenticated;
