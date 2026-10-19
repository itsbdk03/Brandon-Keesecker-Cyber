-- Read-only staging release readiness assertions. These validate catalog shape, not real user login or mail.
do $check$
declare secured integer; policies integer; templates integer; jobs integer;
begin
 select count(*) into secured from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in ('workspaces','workspace_members','incidents','incident_comments','incident_events','incident_evidence','workspace_invitations','response_playbooks','incident_playbook_steps','evidence_custody_events','incident_notifications') and c.relrowsecurity;
 if secured<>11 then raise exception 'Expected 11 RLS-enabled tables, got %',secured;end if;
 select count(*) into policies from pg_policies where schemaname='public';
 if policies<22 then raise exception 'Expected at least 22 policies, got %',policies;end if;
 select count(*) into templates from public.response_playbooks;
 if templates<>4 then raise exception 'Expected 4 synthetic playbook templates, got %',templates;end if;
 select count(*) into jobs from cron.job where jobname='incidentdesk-sla-alerts' and active;
 if jobs<>1 then raise exception 'Expected exactly one active 15-minute in-app SLA queue, got %',jobs;end if;
 if has_table_privilege('anon','public.incidents','SELECT') then raise exception 'Anonymous user has incident read grant';end if;
 if has_table_privilege('authenticated','public.incident_notifications','INSERT') then raise exception 'Browser role can forge notifications';end if;
 if has_table_privilege('authenticated','public.evidence_custody_events','INSERT') then raise exception 'Browser role can forge evidence custody';end if;
end
$check$;