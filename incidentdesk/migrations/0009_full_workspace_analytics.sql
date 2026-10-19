-- IncidentDesk v9: full-workspace weekly and assignee summaries, never derived from a paginated UI slice.
create or replace function public.incident_soc_trends(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $soc$
select jsonb_build_object(
 'weekly', coalesce((
  select jsonb_agg(jsonb_build_object('period',weeks.period,'count',weeks.total) order by weeks.period) from (
   select (date_trunc('week',i.created_at at time zone 'UTC')::date)::text as period,count(*) as total
   from public.incidents i where i.workspace_id=wid and (select private.member_of(wid))
   group by 1 order by 1 desc limit 12
  ) weeks
 ),'[]'::jsonb),
 'workload',coalesce((
  select jsonb_agg(jsonb_build_object('assignee',assignees.assignee,'count',assignees.total) order by assignees.total desc) from (
   select coalesce(i.assigned_to::text,'Unassigned') as assignee,count(*) as total
   from public.incidents i where i.workspace_id=wid and (select private.member_of(wid))
    and i.status not in ('resolved')
   group by 1 order by 2 desc limit 20
  ) assignees
 ),'[]'::jsonb)
)
$soc$;
revoke all on function public.incident_soc_trends(uuid) from public,anon;
grant execute on function public.incident_soc_trends(uuid) to authenticated;
