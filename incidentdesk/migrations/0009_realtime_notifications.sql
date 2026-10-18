-- v9: Subscribe to authenticated, RLS-scoped in-app notification changes.
do $notify$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
 and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='incident_notifications') then
   alter publication supabase_realtime add table public.incident_notifications;
 end if;
end $notify$;
