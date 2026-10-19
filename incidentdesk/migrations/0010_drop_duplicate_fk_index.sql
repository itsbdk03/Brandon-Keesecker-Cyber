-- Remove redundant btree index; retain equivalent workspace_invites_workspace_cover_idx.
-- Both indexes cover workspace_invitations(workspace_id), as verified by the performance advisor.
drop index if exists public.workspace_invitation_tenant_fk_idx;
