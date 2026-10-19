-- Equalize invitation FK coverage across staging and main without changing user data.
create index if not exists workspace_invitations_workspace_id_cover_idx on public.workspace_invitations(workspace_id);
