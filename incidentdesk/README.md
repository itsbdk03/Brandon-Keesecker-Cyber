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

## Six security-hardening improvements — October 2026

These features extend IncidentDesk, not the original seven independent security labs.

1. **Authorization and cross-tenant regression testing.** [Transactional RLS tests](tests/rls-transactional.sql) exercised two temporary SQL-authenticated identities, different workspaces, denied cross-tenant reads/edits/comments, invitation acceptance and Viewer write denial against the real database. All test users and records were rolled back. This verifies database policy behavior under simulated JWT claims, not end-to-end magic-link authentication.
2. **Email invitations, roles and multiple workspaces.** Admins create 7-day invitations for email addresses; recipients use their confirmed account to accept. Direct membership insertion by normal authenticated API users has been revoked. Accounts can create and switch workspaces. Invitations are not separately emailed; the existing sign-in link must be shared.
3. **Versioned evidence integrity.** SHA-256 is computed by the browser before private upload. Metadata includes the hash, version, MIME type, and prior-version link. PostgreSQL enforces same-incident revision lineage and downloads verify hashes. This is not an independent server-side file attestation or a legally complete chain-of-custody system.
4. **Server-side incident SLAs and manual escalation.** PostgreSQL computes response due dates and enforces lifecycle transitions. The fifth dashboard metric counts overdue cases. Analysts can escalate a case to Critical severity, which generates an auditable change. Scheduled email/SMS alerts are not configured.
5. **Database search and pagination.** The PostgreSQL incident table has GIN-indexed English full-text search. Live filters and 25-row pagination are handled by the database, along with a workspace-scoped metrics RPC, rather than preloading every case into the browser.
6. **Operational monitoring and verification.** Realtime connection state is visible, interruptions generate a warning, and reconnect/visibility-based refreshes plus limited fallback polling improve recoverability. Domain tests, SQL policy checks, browser tests, and Supabase security advisors provide defense in depth.

### Database reproduction — new empty project only

Apply [initial schema](schema.sql), then [v2 workflows](migrations/0002_workflows.sql), [v3 security and scaling](migrations/0003_security_scale.sql), and finally [v4 private RPC hardening](migrations/0004_private_rpc_implementations.sql). The connected project already includes these capabilities. Do not rerun setup files blindly on the live database.

### Activation and remaining checks

The live backend is provisioned. An actual email magic-link sign-in, the deployed HTTPS origin/redirect allowlist, two independently signed-in users, and end-to-end cross-tenant Storage API tests remain to be verified. The SQL tests use simulated JWT identities and rolled-back fixtures, not delivered emails or production sessions. Keep all evidence fictional.

### Additional RPC hardening

The membership and invitation operations are exposed through restricted `SECURITY INVOKER` public wrappers; the privileged implementations reside in the unexposed `private` database schema. The change was applied and the Supabase security advisor rechecked with zero findings. The public function signatures are unchanged, so browser RPC calls do not need new names. Authorization still depends on the internal authenticated identity and workspace permissions; this is not an unrestricted API.

## Operational additions — staging and migrations v5–v9

- Staging: A second independent Supabase project was created at the quoted $0/month project cost. Project: https://supabase.com/dashboard/project/okarjtdmthfhfwvnjblr. Original schema through v9 has been applied; rolled-back staging and live SQL authorization tests passed.
- In-app alerts: PostgreSQL Cron checks response deadlines every 15 minutes, assignment events create notices and the RLS-protected inbox refreshes through Realtime. Outbound SLA emails are not yet enabled.
- Playbooks: Four response checklists are available inside each case, with RLS-protected completion and ownership.
- Evidence verification: An authenticated Supabase Edge Function independently downloads private evidence, hashes the bytes, and records a custody event. Explicit server-side mismatches block download. Browser verification is labeled separately.
- Analytics: Accurate acknowledgment/resolution milestone timestamps, workspace-scoped measures and N/A for insufficient sample sizes.
- Invitation email: JWT-protected Edge Function, admin checks, sender restriction and one-hour cooldown; needs a configured Resend provider. Invitations remain available for manual sharing when provider credentials are absent.
- Performance: Missing foreign-key index findings have been addressed. Unused-index notices on empty data are not evidence of a problem.
- Release gate: A manual GitHub Actions staging authorization gate and controlled Pages release are committed. Protected staging database secret and GitHub Pages configuration are still needed for activation.

See RELEASE-ACCEPTANCE.md for the remaining email-provider, two-real-user, HTTPS redirect and Storage API checks. No production-security certification is claimed.
