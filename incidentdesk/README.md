# IncidentDesk — full-stack security incident management

**Portfolio project 08 — Brandon Keesecker**

Current status: Synthetic demonstration complete; Supabase project **ACTIVE_HEALTHY**, with all six database tables, RLS policies, private evidence bucket and Realtime publication created. The frontend is configured with a publishable key. Email redirect allowlisting, real user sign-in, and two-user cross-tenant access tests still need to be completed. Do not claim production readiness.

## Demo mode and live mode

IncidentDesk runs as a polished browser-only fictional SOC workspace without requiring any API key. In demo mode, seven synthetic cases, status and severity KPIs, priority queue, detailed incident timelines, notes, case edits, fictional evidence metadata, filtered register, access overview and downloadable case reports all work within one browser session. The demonstration never uploads files.

The live-mode adapter is connected to the provisioned Supabase project. It switches from local demo data into tenant-scoped records only after a successful user sign-in. It supports Supabase email magic-link authentication, tenant-specific PostgreSQL records, notes, private evidence uploads/downloads, case updates, membership roles and tenant-filtered Realtime event refreshes. Only authenticated admins and analysts may write incident records; viewers are read-only at the database layer.

## Security-first architecture

Frontend: HTML/CSS/JavaScript, pinned Supabase JS client 2.118.0, no mandatory build system.

Database: Supabase PostgreSQL with public.workspaces, public.workspace_members, public.incidents, public.incident_comments, public.incident_events and public.incident_evidence.

Tenancy: user membership in a workspace is checked on every protected table through Row Level Security. Helper functions reside in an unexposed private schema and inspect the authenticated user ID; restricted SECURITY DEFINER membership checks avoid recursive RLS. The browser receives a publishable key only. Server-secret and service-role keys are never safe to include in a public client.

Events: database triggers record incident creation, updates, new notes and evidence metadata. Client roles have no insert/update privileges on the audit table. This is not an immutable forensic evidence ledger.

Storage: private incidentdesk-evidence bucket, 5 MB object limit, permitted document/image types and workspace/incident path verification. Not malware-scanned or suitable for sensitive production evidence.

Realtime: database changes for incidents and events are limited to workspace-filtered subscriptions. Session revocation and access changes require additional operational testing.

## Connect a new Supabase project

1. **Completed:** Supabase project created in us-east-1 at the approved project cost of $0/month. Project reference: oacafwldgglatzayqtro.
2. **Completed:** SQL schema and the separate incidentdesk/performance-indexes.sql migration have been applied to the new project. They should not be reapplied blindly.
3. **Verified:** Six public tables with RLS, 14 policies, a private Storage bucket and two Realtime publication tables. Supabase security advisors returned no findings. Unused-index performance notices are expected until records and query activity exist. Run manual two-account authorization tests before handling anything other than fictional data.
4. In Supabase Auth URL settings allowlist the hosted /incidentdesk/index.html callback URL and your intended local development URL.
5. **Completed:** incidentdesk/config.js contains only the public project URL and a public publishable key. Never insert a service_role or secret key.
6. **Remaining:** Publish the site to an HTTPS origin, allowlist its exact /incidentdesk/index.html address under Supabase Authentication → URL Configuration, then sign in through **Connect account** and create a fictional workspace.
7. **Remaining:** Test two independent authenticated identities in different workspaces: verify cross-workspace reads, writes, downloads, and assignment attempts are rejected. Exercise admin, analyst, and viewer roles with actual sessions.

Supabase project: https://supabase.com/dashboard/project/oacafwldgglatzayqtro

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
