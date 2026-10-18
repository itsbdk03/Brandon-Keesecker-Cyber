-- Invitation send status is server-managed only (no UPDATE column grant to browser).
alter table public.workspace_invitations add column if not exists email_sent_at timestamptz;
alter table public.workspace_invitations add column if not exists email_delivery_id text;
create index if not exists workspace_invitation_sent_idx on public.workspace_invitations(email_sent_at)
where email_sent_at is not null;
