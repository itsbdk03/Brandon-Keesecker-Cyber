-- Cover final workspace invitation foreign key noted by staging performance advisor.
create index if not exists workspace_invitation_tenant_fk_idx on public.workspace_invitations(workspace_id);
