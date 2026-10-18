-- Supporting indexes for authenticated tenant queries and PostgreSQL foreign keys.
create index if not exists incident_comments_author_idx on public.incident_comments(author_id);
create index if not exists incident_evidence_uploader_idx on public.incident_evidence(uploaded_by);
create index if not exists incidents_assigned_idx on public.incidents(assigned_to) where assigned_to is not null;
create index if not exists incidents_creator_idx on public.incidents(created_by);
create index if not exists workspaces_creator_idx on public.workspaces(created_by);
