# IncidentDesk — v5–v8 operational upgrade and release notes

**Scope:** Eight improvements within the existing IncidentDesk project. No other cybersecurity projects are changed. All incident data must remain fictional.

## Production and staging projects

| Environment | Supabase project reference | Purpose |
|---|---|---|
| Live | `oacafwldgglatzayqtro` | Current portfolio backend; browser config.js points here |
| Staging | `okarjtdmthfhfwvnjblr` | Separately provisioned $0/month quoted Supabase project for isolated test migrations |

Both environments were checked to contain 11 RLS-enabled application tables, 22 public policies, four fictional response playbook templates, and one scheduled in-app deadline scanner. Supabase security advisors returned no security findings. These results are not a security certification.

## Features

1. **Real authorization verification:** Transactional SQL tests in `tests/rls-transactional.sql` and `tests/rls-operations.sql` exercise simulated authenticated users in different workspaces, deny cross-tenant queries and writes, and guard notification/custody mutation privileges. These were executed against both environments and rolled back. Real email magic-link sign-in, two independent browser sessions, private Storage API access, and GitHub Pages deployment still require manual external acceptance testing.
2. **Scheduled SOC notifications:** Database schedule `incidentdesk-sla-alerts` runs every 15 minutes and inserts in-app SLA due/overdue records for the currently assigned analyst. Assignment changes trigger in-app notices. The inbox is restricted by tenant and `auth.uid()`, and users can mark their own alerts seen. **External SLA email/SMS alerts are not enabled**; a messaging provider and secure scheduled dispatcher would be necessary.
3. **Response playbooks:** Four predefined, synthetic incident response checklists are stored in `response_playbooks`. An analyst may attach one to a case and mark each step complete, with RLS enforcing workspace access. Playbook completion is a documentation assertion, not proof an action occurred.
4. **Evidence integrity:** SHA-256 hashes are checked during browser download, and an authenticated Edge Function can independently download an authorized object and compare its digest. Evidence metadata inserts create append-only, server-triggered custody registration rows. The browser can export a JSON evidence manifest with its own SHA-256. This is not malware scanning, independent cryptographic attestation of provenance, or a legally certified chain of custody.
5. **Staging and release gate:** Migrations `schema.sql`, `performance-indexes.sql`, and `migrations/0002` through `0010` are committed and reproduced in staging. A manually triggered GitHub Action `incidentdesk-staging.yml` can run actual PostgreSQL schema and rollback-only RLS checks. It **requires** a `INCIDENTDESK_STAGING_DATABASE_URL` repository secret. Without that secret, it fails explicitly rather than reporting a misleading pass. Production promotion should require reviewed GitHub changes, a validated staging run, and a fresh backup/recovery plan. No automated production migration has been configured.
6. **SOC analytics:** The tenant-scoped, security-invoker RPC `incident_soc_metrics` calculates acknowledgment time, resolution time, overdue incidents, and observed SLA compliance from server-generated timestamps. The existing dashboard renders full-workspace, tenant-scoped weekly totals and assignment aggregates from the same database RPC. Demo visualizations remain fictional; no metric is extrapolated from a single 25-record page. No sample means N/A, not 100% compliance.
7. **Foreign-key indexes:** Added the missing covering indexes in `0005`, `0006` and `0008`; migration `0010` removes a redundant invitation index while preserving coverage. On an empty project, unused-index notices are expected; do not drop indexes based solely on absent usage.
8. **Invitation email option:** The JWT-protected `incidentdesk-secure-workflows` Edge Function validates invitation ownership, admin status, expiry, resend interval, and provider settings, then optionally sends email and records provider acceptance. It **does not send real invitations until** `RESEND_API_KEY`, `INCIDENTDESK_MAIL_FROM`, and `INCIDENTDESK_APP_URL` are configured as server-side secrets. Never store them in `config.js`. An unconfigured sender returns a clear error and users may continue sharing the normal sign-in link manually.

## Operator checklist

- Verify the live IncidentDesk HTTPS URL resolves. GitHub source alone does not prove the site is hosted.
- Under Supabase Authentication URL Configuration, allowlist the exact deployed callback URL; then successfully sign in with two separate test accounts.
- Confirm that user A cannot access user B's incidents, notes, Storage downloads, custody events, or notifications via direct REST/Storage calls.
- Supply a verified sending domain and opt-in email provider configuration if external invitation delivery is desired; validate accepted provider IDs **and actual receipt**.
- Optionally add a GitHub repository secret `INCIDENTDESK_STAGING_DATABASE_URL` using a secure, non-public staging Postgres connection string. Never put the database password or Supabase service role key in commits, issue comments or screenshots.
- Run the manually triggered [staging gate](../.github/workflows/incidentdesk-staging.yml), inspect results, and confirm backup/recovery readiness before promoting future schema modifications.
- Observe Realtime connectivity and scheduled job history on test incidents. A successful cron installation alone does not establish delivery times or notification latency.

## Testing boundaries

GitHub's normal IncidentDesk verification uses fictional demo data in Chromium at desktop and mobile-sized viewports. SQL tests are transaction-scoped and create only synthetic temporary identities. Edge Functions are deployed with JWT verification enabled, but no actual signed-in user or external mail provider has been exercised. **This is still a portfolio application and must not accept live customer incidents, credentials or classified/CUI evidence.**

### Availability and deployment

The Supabase projects and database workflows are active, but the public GitHub Pages IncidentDesk URL was not independently confirmed reachable. A real hosted origin, Supabase Auth redirect allowlist, a pair of signed-in accounts, and cross-tenant Storage access tests remain outstanding. The browser tests simulate only the local demo. For automated invitation emails, configure a verified sender and the three Edge Function secrets listed above; absent those secrets the function deliberately returns an error instead of claiming delivery.
