-- Server-aggregated tenant metrics: avoid charting only the current 25-case UI page.
create or replace function public.incident_soc_metrics(wid uuid)
returns jsonb language sql stable security invoker set search_path=''
as $fn$
select jsonb_build_object(
 'cases',count(*),
 'resolved',count(*) filter(where status='resolved'),
 'overdue_open',count(*) filter(where due_at<now() and status not in ('contained','resolved')),
 'unassigned',count(*) filter(where assigned_to is null),
 'avg_ack_minutes',round(avg(extract(epoch from (acknowledged_at-created_at))/60) filter(where acknowledged_at is not null)::numeric,1),
 'avg_resolution_hours',round(avg(extract(epoch from (resolved_at-created_at))/3600) filter(where resolved_at is not null)::numeric,1),
 'response_sla_percent',
 case when count(*) filter(where acknowledged_at is not null)=0 then null
 else round(100.0*count(*) filter(where acknowledged_at is not null and acknowledged_at<=due_at)
 / count(*) filter(where acknowledged_at is not null),1) end,
 'acknowledged_sample',count(*) filter(where acknowledged_at is not null),
 'resolved_sample',count(*) filter(where resolved_at is not null),
 'workload',coalesce((select jsonb_object_agg(ownership,n) from (
  select case when assigned_to is null then 'Unassigned' else 'Assigned' end ownership,count(*) n
  from public.incidents where workspace_id=wid and (select private.member_of(wid))
  group by 1
 ) x),'{}'::jsonb),
 'weekly',coalesce((select jsonb_object_agg(week,n) from (
  select to_char(created_at at time zone 'UTC','IYYY-"W"IW') week,count(*) n
  from public.incidents where workspace_id=wid and (select private.member_of(wid))
  group by 1 order by 1 desc limit 12
 ) x),'{}'::jsonb)
)
from public.incidents where workspace_id=wid and (select private.member_of(wid))
$fn$;
revoke all on function public.incident_soc_metrics(uuid) from public,anon;
grant execute on function public.incident_soc_metrics(uuid) to authenticated;
