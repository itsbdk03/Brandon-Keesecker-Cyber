-- IncidentDesk: remove one of two verified identical, non-unique B-tree indexes
-- on public.workspace_invitations(workspace_id).
-- Keep workspace_invitations_workspace_id_cover_idx for the invitation FK and lookups.
drop index if exists public.workspace_invites_workspace_cover_idx;
