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
Database migrations: `schema.sql` then `performance-indexes.sql`, then migrations `0002` through `0008` in numeric order.
Transactional authorization test: `tests/rls-transactional.sql` (do not run on production with existing sensitive data).
Server code: `functions/secure-workflows/index.ts` (staging and live deployed with JWT verification enabled).

Current non-security performance warnings about *unused indexes* are expected on empty datasets. Monitor real workloads before removing indexes solely based on unused statistics.
