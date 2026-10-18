# IncidentDesk — full-stack security incident management

**Portfolio project 08 — Brandon Keesecker**

Current status: Interactive fictional demonstration is implemented and tested. Supabase project provisioning and live database activation are pending. Live claims require actual authentication and cross-tenant tests.

## Demo mode and live mode

IncidentDesk runs as a polished browser-only fictional SOC workspace without requiring any API key. In demo mode, seven synthetic cases, status and severity KPIs, priority queue, detailed incident timelines, notes, case edits, fictional evidence metadata, filtered register, access overview and downloadable case reports all work within one browser session. The demonstration never uploads files.

The live-mode adapter is implemented but inactive until Supabase is provisioned and configured. It supports Supabase email magic-link authentication, tenant-specific PostgreSQL records, notes, private evidence uploads/downloads, case updates, membership roles and tenant-filtered Realtime event refreshes. Only authenticated admins and analysts may write incident records; viewers are read-only at the database layer.

## Security-first architecture

Frontend: HTML/CSS/JavaScript, pinned Supabase JS client 2.118.0, no mandatory build system.

Database: Supabase PostgreSQL with public.workspaces, public.workspace_members, public.incidents, public.incident_comments, public.incident_events and public.incident_evidence.

Tenancy: user membership in a workspace is checked on every protected table through Row Level Security. Helper functions reside in an unexposed private schema and inspect the authenticated user ID; restricted SECURITY DEFINER membership checks avoid recursive RLS. The browser receives a publishable key only. Server-secret and service-role keys are never safe to include in a public client.

Events: database triggers record incident creation, updates, new notes and evidence metadata. Client roles have no insert/update privileges on the audit table. This is not an immutable forensic evidence ledger.

Storage: private incidentdesk-evidence bucket, 5 MB object limit, permitted document/image types and workspace/incident path verification. Not malware-scanned or suitable for sensitive production evidence.

Realtime: database changes for incidents and events are limited to workspace-filtered subscriptions. Session revocation and access changes require additional operational testing.

## Connect a new Supabase project

1. Review and accept the Supabase project creation cost in your organization. A connected project is not yet provisioned.
2. Create a NEW project in us-east-1. Carefully review incidentdesk/schema.sql, then apply it in the Supabase SQL Editor or through a deployment migration.
3. Verify table RLS, security/performance advisors, policies, trigger privileges and the private Storage bucket. Do not assume that a syntactically valid schema proves isolation.
4. In Supabase Auth URL settings allowlist the hosted /incidentdesk/index.html callback URL and your intended local development URL.
5. Populate incidentdesk/config.js with the new project URL and publishable key. Never insert a service_role or secret key.
6. Open the deployed IncidentDesk page over HTTPS, select Connect account, sign in via email magic link, and create your workspace.
7. Test with at least two genuinely independent authenticated users in different workspaces: cross-workspace reads, writes, downloads and user-assignment attempts must be blocked. Check that admin/analyst/viewer policies behave as intended.

## Development and verification

- incidentdesk/model.js: independently testable sample data, validation, filters, KPIs, case changes, evidence metadata and export.
- incidentdesk/app.js: responsive user interface and Supabase adapter.
- incidentdesk/schema.sql: authorization-centered database schema and storage policies.
- incidentdesk/tests/model.test.cjs: domain unit tests.
- incidentdesk/tests/browser_smoke.py: Playwright Chromium desktop and mobile-width demo workflow.
- .github/workflows/incidentdesk.yml: automated syntax, unit and browser checks.

Local unit test command: node --test incidentdesk/tests/*.test.cjs

The CI suite exercises the fictional demo, not the live Supabase backend. It cannot certify real RLS, storage privacy, delivery of email links or tenant isolation.

## Threat model and limitations

The app is a portfolio showcase, not a managed production incident response service. Never store CUI, actual company incidents, secrets, real malware or confidential logs here. File type and size checks do not provide malware detection. An audit history stored in a normal database is not a tamper-proof forensic chain of custody. Browser-side restrictions are supplemental; database RLS and least-privilege grants are the real security boundary.

The primary engineering talking points are tenant isolation, auth-scoped data access, private object storage, explainable audit provenance, and disciplined differences between modeled sample data and production security evidence.
