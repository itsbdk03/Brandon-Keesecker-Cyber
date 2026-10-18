-- IncidentDesk v10: tenant-scoped SOC breakdown across ALL cases, not only the current UI page.
create or replace function public.incident_soc_breakdown(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $fn$
select jsonb_build_object(
 'workload',coalesce((
   select jsonb_object_agg(label,case_count)
   from(
    select case when assigned_to is null then 'Unassigned' else 'Assigned' end as label,
      count(*) as case_count
    from public.incidents
    where workspace_id=wid and (select private.member_of(wid))
    group by case when assigned_to is null then 'Unassigned' else 'Assigned' end
   ) owners
 ),'{}'::jsonb),
 'weekly',coalesce((
   select jsonb_object_agg(week_name,case_count)
   from(
     select to_char(date_trunc('week',created_at),'IYYY-"W"IW') as week_name,
       count(*) as case_count
     from public.incidents
     where workspace_id=wid and (select private.member_of(wid))
       and created_at>=now()-interval '8 weeks'
     group by date_trunc('week',created_at)
     order by date_trunc('week',created_at)
   ) weeks
 ),'{}'::jsonb)
)
$fn$;
revoke all on function public.incident_soc_breakdown(uuid) from public,anon;
grant execute on function public.incident_soc_breakdown(uuid) to authenticated;
