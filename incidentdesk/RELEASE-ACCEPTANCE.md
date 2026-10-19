# IncidentDesk release and operational acceptance

IncidentDesk has two Supabase projects:
- **Live:** `oacafwldgglatzayqtro` (US East)
- **Staging:** `okarjtdmthfhfwvnjblr` (US East, quoted project cost $0/month)

The staging database has been independently provisioned from `schema.sql`, `performance-indexes.sql`, and the ordered migrations 0002–0008. Its test records were created and rolled back by `tests/rls-transactional.sql`. Both environments have zero current Supabase security-advisor findings. They have no real registered users, incident rows, or invitations.

## Scope of the current build

- In-app SLA reminders are **automatic**: PostgreSQL cron evaluates response deadlines every 15 minutes and enqueues tenant-scoped notices; incident assignment triggers also create notices.
- The application now has an in-app notification inbox with unread state, incident response playbooks, evidence custody history, a SHA-256 manifest export, and SOC analytics using real acknowledgment/resolution milestone timestamps (not guessed response times).
- Four standard, fictional investigation playbooks are preloaded. Analysts can check off steps, which are persisted under tenant-enforced RLS after signing in.
- Evidence upload metadata is registered by a database trigger. A JWT-protected Edge Function performs an additional independent file hash verification and writes an audit event using a server-side service credential, never exposing it to the browser.
- Email invitations call the JWT-protected `incidentdesk-secure-workflows` function. If the email service is not configured, the invitation still exists in the database and the frontend clearly says email was **not sent**.
- The original incident register, role management and browser-local fictional demonstration remain available.

## Required settings for outbound email

At **Supabase Dashboard → Edge Functions → Secrets**, set the following for the *live* project. Set separate test credentials for staging:

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend transactional email provider API token |
| `INCIDENTDESK_MAIL_FROM` | Verified domain sender, e.g. `IncidentDesk <no-reply@yourdomain.example>` |
| `INCIDENTDESK_APP_URL` | Exact HTTPS IncidentDesk webpage, after its publication is confirmed |

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. The function keeps the server credential in its runtime only. **Never put these secrets into `config.js`, a public GitHub repository, or this chat.** Configuring Resend can incur provider costs; review those before enabling outbound email.

Email delivery is not live until these secrets, a sender domain, and a reachable HTTPS application are configured. The function has been deployed with **JWT verification enabled**. It enforces authenticated workspace-admin ownership, prevents accepted/expired invitations from sending, and enforces a one-hour per-invitation cooldown. Its response reports provider acceptance rather than asserting mailbox delivery.

## Staging acceptance

1. Verify the latest version of the repository's SQL files is present in staging; **do not blindly rerun non-idempotent migrations**.
2. Review each new migration and run `tests/rls-transactional.sql` on staging with transaction rollback. This has already passed using simulated authenticated identities.
3. Create two **real** staging accounts via the Supabase Auth settings and independently sign in through a working, allowlisted HTTPS callback.
4. Confirm A cannot view, modify, upload to, or download Storage objects belonging to B's workspace, and that Viewer roles cannot perform Analyst actions.
5. Test the email-invitation sender with a verified test domain and test recipient, never an unapproved real-world address.
6. Check Edge Function logs for operational exceptions; run a server-side hash verification of a harmless fictional text file.
7. Test app behavior with Realtime disconnected, an invalid JWT, an expired invitation, and a mismatched file hash.
8. Promote only changes that pass staged security and browser checks.

## Production readiness gaps

- **No actual end-to-end multi-account test yet** (there are zero registered users). SQL tests that simulate JWT subjects do not fully test Auth redirects, bearer-token lifetime or live Storage API rules.
- **No email provider configured**, therefore no invitation email has actually been sent. Scheduled in-app notifications are active; scheduled outbound SLA email delivery is not.
- **GitHub Pages hosting/redirect allowlisting** has not been independently verified from an unauthenticated public browser.
- **Evidence hash is an integrity check, not a certified chain of custody.** Database owners and Edge Function service roles can modify server records.
- **Recovery plans** require backups and restore exercises, not just schema migration files. Maintain verified backups before destructive changes.

## Reproducibility

Automated frontend testing: `.github/workflows/incidentdesk.yml`.
Database migrations: `schema.sql` then `performance-indexes.sql`, then migrations `0002` through `0010` in numeric order.
Transactional authorization test: `tests/rls-transactional.sql` (do not run on production with existing sensitive data).
Server code: `functions/secure-workflows/index.ts` (staging and live deployed with JWT verification enabled).

Current non-security performance warnings about *unused indexes* are expected on empty datasets. Monitor real workloads before removing indexes solely based on unused statistics.

## Controlled deployment and current limitations

The repository includes .github/workflows/incidentdesk-staging-gate.yml and .github/workflows/incidentdesk-controlled-release.yml. Both require the protected GitHub Actions secret INCIDENTDESK_STAGING_DATABASE_URL and run the rollback-only RLS suites in tests/rls-transactional.sql and tests/operations-rls-transactional.sql. No connection string should be committed or posted in chat.

The Supabase Edge Function incidentdesk-secure-workflows is deployed in live and staging with JWT verification enabled. Invitation email requires Resend credentials and a verified sender domain in Supabase Edge Functions Secrets. Required keys: RESEND_API_KEY, INCIDENTDESK_MAIL_FROM and INCIDENTDESK_APP_URL. Without these, sending is disabled, and the browser correctly reports that the email has not been sent. The database's scheduled in-app SLA checks are active, but scheduled outbound SLA emails are not yet connected.

Neither public GitHub Pages publishing nor live email redirect allowlisting has been verified. The controlled release workflow is staged but has not executed, since the protected connection secret and Pages settings must be supplied. Two independently signed-in users have not yet been created: SQL-authenticated, rolled-back policy tests are not a substitute for Auth redirects and live Storage API penetration testing.

Migration 0010 implements whole-workspace weekly and assignment aggregates using security-invoker SQL with RLS. The operational SQL test was extended to reject cross-tenant reads of this RPC and was executed with rollback on staging and live.


## October 19, 2026 — implementation checkpoint

- **IncidentDesk source:** The live and staging frontend now share an authenticated, admin-only "Load fictional cases and evidence" operation that uses normal Supabase RLS-protected browser calls. It is *not* automatic; the account owner must sign in, create a workspace, and click the action. Four fictional cases, one note and one tiny synthetic text evidence file are prepared for creation.
- **Evidence verification:** v2 of `incidentdesk-secure-workflows` is deployed to both Supabase projects with JWT verification. On verification, the service now checks file size plus SHA-256 and requires a successful custody write; failures cannot return a verified result. The browser also fails closed instead of falling back to a browser-only hash.
- **Security tests:** `tests/rls-transactional.sql`, `tests/operations-rls-transactional.sql` and `tests/extended-rls-transactional.sql` passed on staging with transaction rollback. The expanded tests cover simulated tenant-separated users, incident updates, analyst notes, assignment rejection, Storage metadata isolation, evidence custody metadata, invitations and viewer write denial. This is **not** a genuine magic-link or binary Storage API test.
- **Schema:** Production/staging columns and all 22 RLS policies produced identical fingerprints prior to the index cleanup. Duplicate `workspace_invites_workspace_cover_idx` was removed in both environments; the equivalent `workspace_invitations_workspace_id_cover_idx` remains. The cleanup SQL is checked in under `migrations/0011_remove_duplicate_invitation_index.sql`.
- **SLA scheduling:** `incidentdesk-sla-alerts` is active on both projects, and each has recorded successful cron runs. Actual user-level alert timings and live Realtime reconnection still need HTTP/browser verification.
- **Browser checks:** Automated demo-mode tests cover desktop 1440px and mobile 390px. Staging mobile initialization was added to the browser suite. The run result of the newest CI workflow is not independently verified here.
- **Security advisor:** The current Supabase advisor reports the non-RLS `auth_leaked_password_protection` warning in both projects. Review [password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) if password authentication is enabled. Never describe the current security advisor as having zero warnings.
- **Outbound email:** Resend registration, domain verification, provider secret configuration and real inbox delivery have **not** been completed. Email invitation creation falls back to manual sharing. Outbound SLA email is not implemented.
- **GitHub release gate:** Workflows now include the expanded SQL suite, but cannot run remote integration tests until the owner adds `INCIDENTDESK_STAGING_DATABASE_URL` as a protected GitHub Actions repository secret and manually invokes the gate.
- **Disaster recovery:** The GitHub repository contains schema/migration reproducibility materials; this does **not** constitute a data backup, Storage object backup or successful full restore test. Free plan users should export off-site logical database backups separately and back up actual Storage objects. [Supabase Database Backups guidance](https://supabase.com/docs/guides/platform/backups).
- **Final acceptance still required:** A second signed-in test account; actual Storage upload/download, cross-tenant and Viewer checks via independent real sessions; server SHA-256 and custody verification on a real fictional file; GitHub CI results; browser Realtime disconnection/reconnect; a staging restoration drill.

### Owner-only account configurations

1. **GitHub:** [Repository Actions secrets](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/settings/secrets/actions) → New repository secret → `INCIDENTDESK_STAGING_DATABASE_URL`. Paste the *staging* Postgres connection string in GitHub only. Do not put passwords into the repository or any chat. Then use [staging-gate Actions workflow](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/incidentdesk-staging-gate.yml) → Run workflow. Inspect the run and only approve a release after success.
2. **Optional invitation email:** Create and verify a sender domain with [Resend](https://resend.com/domains). In each Supabase project's Edge Functions → Secrets, configure `RESEND_API_KEY`, `INCIDENTDESK_MAIL_FROM`, and `INCIDENTDESK_APP_URL`. The production app URL is `https://itsbdk03.github.io/Brandon-Keesecker-Cyber/incidentdesk/index.html`; staging uses `https://itsbdk03.github.io/Brandon-Keesecker-Cyber/incidentdesk/staging.html`. Use separate provider/test credentials where appropriate. Review any applicable provider fees, and send only to consented test recipients.
3. **Signed-in samples:** Sign in to staging, create your own workspace, visit Team & access, and click **Load fictional cases and evidence**. Verify the new case list, analyst note, evidence manifest, server-verified download and analytics. Repeat in production only after reviewing the staging results.
4. **Recovery:** Export a logical production dump via `supabase db dump` or `pg_dump` using private local credentials; store it outside GitHub. Back up Storage objects separately. Restore into an isolated staging/temporary environment and repeat rollback-only authorization tests. Do not overwrite active staging or production until the restore has been tested and approved.
