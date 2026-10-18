-- IncidentDesk database schema — synthetic-data incident workflow
-- Apply in a NEW Supabase project. PostgreSQL 15+, auth and storage schemas provided by Supabase.
-- All public tables use RLS. No anonymous data access. Never deploy service_role to a browser.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 100),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','analyst','viewer')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id);
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 160),
  description text not null default '' check (length(description) <= 10000),
  severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  status text not null default 'new' check (status in ('new','triage','investigating','contained','resolved')),
  assigned_to uuid null references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(id,workspace_id)
);
create index incidents_workspace_updated_idx on public.incidents(workspace_id,updated_at desc);
create table public.incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index comments_incident_created_idx on public.incident_comments(incident_id,created_at);
create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  workspace_id uuid not null,
  actor_id uuid null,
  event_type text not null check (event_type in ('created','updated','commented','evidence_added')),
  note text not null default '' check (length(note)<=500),
  created_at timestamptz not null default now()
);
create index incident_events_incident_idx on public.incident_events(incident_id,created_at desc);
create table public.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  workspace_id uuid not null,
  uploaded_by uuid not null references auth.users(id),
  storage_path text not null unique check (length(storage_path) between 20 and 500),
  original_name text not null check (length(original_name) between 1 and 150),
  size_bytes bigint not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);
create index evidence_incident_idx on public.incident_evidence(incident_id);

-- These small private security-definer helpers intentionally live outside the Data API schemas.
-- They read ONLY membership/incident IDs and use fixed search_path and auth.uid().
create or replace function private.member_of(wid uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists (
 select 1 from public.workspace_members m
 where m.workspace_id=wid and m.user_id=(select auth.uid())
) $$;
create or replace function private.can_edit(wid uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists (
 select 1 from public.workspace_members m
 where m.workspace_id=wid and m.user_id=(select auth.uid()) and m.role in ('admin','analyst')
) $$;
create or replace function private.is_admin(wid uuid) returns boolean
language sql stable security definer set search_path = ''
as $$ select (select auth.uid()) is not null and exists (
 select 1 from public.workspace_members m
 where m.workspace_id=wid and m.user_id=(select auth.uid()) and m.role='admin'
) $$;
create or replace function private.incident_workspace(iid uuid) returns uuid
language sql stable security definer set search_path = ''
as $$ select i.workspace_id from public.incidents i where i.id=iid $$;
revoke all on function private.member_of(uuid) from public;
revoke all on function private.can_edit(uuid) from public;
revoke all on function private.is_admin(uuid) from public;
revoke all on function private.incident_workspace(uuid) from public;
grant execute on function private.member_of(uuid),private.can_edit(uuid),private.is_admin(uuid),private.incident_workspace(uuid) to authenticated;

-- Create the first workspace member automatically, atomically.
create or replace function private.workspace_bootstrap() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.workspace_members(workspace_id,user_id,role)
 values(new.id,new.created_by,'admin');
 return new;
end $$;
create trigger workspace_bootstrap after insert on public.workspaces
for each row execute function private.workspace_bootstrap();

-- Validated, authenticated database audit history; clients have NO write permission.
create or replace function private.audit_incident() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='INSERT' then
   insert into public.incident_events(incident_id,workspace_id,actor_id,event_type,note)
   values(new.id,new.workspace_id,new.created_by,'created','Incident opened');
 else
   insert into public.incident_events(incident_id,workspace_id,actor_id,event_type,note)
   values(new.id,new.workspace_id,(select auth.uid()),'updated',
     left('Status: '||old.status||' → '||new.status||'; severity: '||old.severity||' → '||new.severity,500));
 end if;
 return new;
end $$;
create trigger audit_incident after insert or update on public.incidents
for each row execute function private.audit_incident();

create or replace function private.touch_incident() returns trigger
language plpgsql set search_path=''
as $$ begin new.updated_at=now();return new;end $$;
create trigger touch_incident before update on public.incidents
for each row execute function private.touch_incident();

create or replace function private.audit_comment() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.incident_events(incident_id,workspace_id,actor_id,event_type,note)
 values(new.incident_id,private.incident_workspace(new.incident_id),new.author_id,'commented','Analyst note added');
 return new;
end $$;
create trigger audit_comment after insert on public.incident_comments
for each row execute function private.audit_comment();

create or replace function private.audit_evidence() returns trigger
language plpgsql security definer set search_path=''
as $$
begin
 insert into public.incident_events(incident_id,workspace_id,actor_id,event_type,note)
 values(new.incident_id,new.workspace_id,new.uploaded_by,'evidence_added','Evidence metadata attached');
 return new;
end $$;
create trigger audit_evidence after insert on public.incident_evidence
for each row execute function private.audit_evidence();

-- Explicit Data API privileges; anon receives none.
revoke all on public.workspaces,public.workspace_members,public.incidents,
 public.incident_comments,public.incident_events,public.incident_evidence from anon,authenticated;
grant select,insert on public.workspaces to authenticated;
grant update(name) on public.workspaces to authenticated;
grant select,insert on public.workspace_members to authenticated;
grant update(role) on public.workspace_members to authenticated;
grant select,insert on public.incidents to authenticated;
grant update(title,description,severity,status,assigned_to) on public.incidents to authenticated;
grant select,insert on public.incident_comments to authenticated;
grant select on public.incident_events to authenticated;
grant select,insert on public.incident_evidence to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_comments enable row level security;
alter table public.incident_events enable row level security;
alter table public.incident_evidence enable row level security;

create policy workspaces_read on public.workspaces for select to authenticated
 using ((select private.member_of(id)));
create policy workspaces_insert on public.workspaces for insert to authenticated
 with check ((select auth.uid()) = created_by);
create policy workspaces_update on public.workspaces for update to authenticated
 using ((select private.is_admin(id))) with check ((select private.is_admin(id)));

create policy members_read on public.workspace_members for select to authenticated
 using ((select private.member_of(workspace_id)));
create policy members_insert on public.workspace_members for insert to authenticated
 with check ((select private.is_admin(workspace_id)) and user_id <> (select auth.uid()));
create policy members_update on public.workspace_members for update to authenticated
 using ((select private.is_admin(workspace_id)) and user_id <> (select auth.uid()))
 with check ((select private.is_admin(workspace_id)) and user_id <> (select auth.uid()));

create policy incidents_read on public.incidents for select to authenticated
 using ((select private.member_of(workspace_id)));
create policy incidents_insert on public.incidents for insert to authenticated
 with check ((select private.can_edit(workspace_id)) and created_by=(select auth.uid())
 and (assigned_to is null or exists (select 1 from public.workspace_members m
 where m.workspace_id=incidents.workspace_id and m.user_id=incidents.assigned_to)));
create policy incidents_update on public.incidents for update to authenticated
 using ((select private.can_edit(workspace_id)))
 with check ((select private.can_edit(workspace_id))
 and (assigned_to is null or exists(select 1 from public.workspace_members m
 where m.workspace_id=incidents.workspace_id and m.user_id=incidents.assigned_to)));

create policy comments_read on public.incident_comments for select to authenticated
 using ((select private.member_of(private.incident_workspace(incident_id))));
create policy comments_insert on public.incident_comments for insert to authenticated
 with check (author_id=(select auth.uid()) and (select private.can_edit(private.incident_workspace(incident_id))));

create policy events_read on public.incident_events for select to authenticated
 using ((select private.member_of(workspace_id)));

create policy evidence_read on public.incident_evidence for select to authenticated
 using ((select private.member_of(workspace_id)));
create policy evidence_insert on public.incident_evidence for insert to authenticated
 with check (uploaded_by=(select auth.uid())
 and (select private.can_edit(workspace_id))
 and workspace_id=private.incident_workspace(incident_id)
 and storage_path like workspace_id::text||'/'||incident_id::text||'/%');

-- Safe path parsing prevents malformed unrelated Storage keys from causing UUID cast errors.
create or replace function private.safe_path_uuid(object_name text,segment_no integer) returns uuid
language sql immutable set search_path=''
as $safepath$
 select case when split_part(object_name,'/',segment_no) ~*
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then split_part(object_name,'/',segment_no)::uuid else null::uuid end
$safepath$;
revoke all on function private.safe_path_uuid(text,integer) from public;
grant execute on function private.safe_path_uuid(text,integer) to authenticated;

-- Private object bucket: max 5 MB. No public link, no HTML, no executables.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('incidentdesk-evidence','incidentdesk-evidence',false,5242880,
 array['text/plain','application/json','text/csv','image/png','image/jpeg','application/pdf'])
on conflict(id) do nothing;

create policy incidentdesk_object_read on storage.objects for select to authenticated
 using (bucket_id='incidentdesk-evidence'
 and (select private.member_of(private.safe_path_uuid(name,1)))
 and private.incident_workspace(private.safe_path_uuid(name,2))=private.safe_path_uuid(name,1));
create policy incidentdesk_object_upload on storage.objects for insert to authenticated
 with check (bucket_id='incidentdesk-evidence'
 and (select private.can_edit(private.safe_path_uuid(name,1)))
 and private.incident_workspace(private.safe_path_uuid(name,2))=private.safe_path_uuid(name,1)
 and (select auth.uid()) is not null);

-- Only the authenticated tenant's authorized row changes may reach the Realtime client.
do $
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
     and schemaname='public' and tablename='incidents') then
    alter publication supabase_realtime add table public.incidents;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
     and schemaname='public' and tablename='incident_events') then
    alter publication supabase_realtime add table public.incident_events;
  end if;
 end if;
end $;
-- Trigger procedures have no reason to be invoked directly by API roles.
revoke all on function private.workspace_bootstrap(),private.audit_incident(),
 private.audit_comment(),private.audit_evidence(),private.touch_incident() from public,anon,authenticated;

-- Defense-in-depth assertions (automated SQL catalog checks are in tests).
-- Caution: integration testing with 2 users and different organizations is required before production.

 then split_part(object_name,'/',segment_no)::uuid else null::uuid end
$;
revoke all on function private.safe_path_uuid(text,integer) from public;
grant execute on function private.safe_path_uuid(text,integer) to authenticated;

-- Private object bucket: max 5 MB. No public link, no HTML, no executables.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('incidentdesk-evidence','incidentdesk-evidence',false,5242880,
 array['text/plain','application/json','text/csv','image/png','image/jpeg','application/pdf'])
on conflict(id) do nothing;

create policy incidentdesk_object_read on storage.objects for select to authenticated
 using (bucket_id='incidentdesk-evidence'
 and (select private.member_of(private.safe_path_uuid(name,1)))
 and private.incident_workspace(private.safe_path_uuid(name,2))=private.safe_path_uuid(name,1));
create policy incidentdesk_object_upload on storage.objects for insert to authenticated
 with check (bucket_id='incidentdesk-evidence'
 and (select private.can_edit(private.safe_path_uuid(name,1)))
 and private.incident_workspace(private.safe_path_uuid(name,2))=private.safe_path_uuid(name,1)
 and (select auth.uid()) is not null);

-- Defense-in-depth assertions (automated SQL catalog checks are in tests).
-- Caution: integration testing with 2 users and different organizations is required before production.
