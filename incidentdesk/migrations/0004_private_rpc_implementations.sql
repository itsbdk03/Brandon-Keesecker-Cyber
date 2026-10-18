-- v4: Keep privileged membership/invitation implementations out of the exposed API schema.
-- Run after v3 on new installations; public RPC signatures are preserved as invoker wrappers.
-- Tested against the live project with transactional rollback before deployment.
alter function public.accept_workspace_invitation(uuid) set schema private;
alter function public.my_pending_invitations() set schema private;
alter function public.remove_workspace_member(uuid,uuid) set schema private;
alter function public.set_workspace_member_role(uuid,uuid,text) set schema private;

create function public.accept_workspace_invitation(invitation_id uuid)
returns uuid language sql security invoker set search_path=''
as $b$ select private.accept_workspace_invitation(invitation_id) $b$;
create function public.my_pending_invitations()
returns table(id uuid,workspace_name text,role text,expires_at timestamptz)
language sql stable security invoker set search_path=''
as $b$ select * from private.my_pending_invitations() $b$;
create function public.remove_workspace_member(wid uuid,target_user uuid)
returns void language sql security invoker set search_path=''
as $b$ select private.remove_workspace_member(wid,target_user) $b$;
create function public.set_workspace_member_role(wid uuid,target_user uuid,new_role text)
returns void language sql security invoker set search_path=''
as $b$ select private.set_workspace_member_role(wid,target_user,new_role) $b$;

revoke all on function public.accept_workspace_invitation(uuid),public.my_pending_invitations(),public.remove_workspace_member(uuid,uuid),public.set_workspace_member_role(uuid,uuid,text) from public,anon;
grant execute on function public.accept_workspace_invitation(uuid),public.my_pending_invitations(),public.remove_workspace_member(uuid,uuid),public.set_workspace_member_role(uuid,uuid,text) to authenticated;
revoke all on function private.accept_workspace_invitation(uuid),private.my_pending_invitations(),private.remove_workspace_member(uuid,uuid),private.set_workspace_member_role(uuid,uuid,text) from public,anon;
grant execute on function private.accept_workspace_invitation(uuid),private.my_pending_invitations(),private.remove_workspace_member(uuid,uuid),private.set_workspace_member_role(uuid,uuid,text) to authenticated;
