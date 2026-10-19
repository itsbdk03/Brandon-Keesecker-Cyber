# Security policy and responsible use

This public repository contains my cybersecurity portfolio, seven local-first laboratory applications, the Supabase-backed IncidentDesk reference application, and illustrative compliance architecture diagrams.

## Responsible disclosure

Please report suspected vulnerabilities involving this repository or its public demonstrations **privately** to [brandondkeesecker@gmail.com](mailto:brandondkeesecker@gmail.com?subject=Portfolio%20security%20report). Include the affected public URL or file, a minimal reproduction and a description of the expected security boundary. Avoid supplying passwords, tokens, confidential datasets or exploit details through public GitHub issues.

A responsible report is a security observation, not authorization to test a third-party service. Please do not run destructive tests, denial of service, automated credential attacks or probes against other accounts, providers or networks.

## Data classification and intended scope

- **Browser-only labs:** ControlTrace, SignalHunt, CloudGuard, RiskMatrix, ConfigLens, AttackPath and AssuranceFlow are educational examples using synthetic data. Their exports and heuristics are not formal audit reports, production vulnerability scans or independent compliance determinations.
- **IncidentDesk:** The public demo uses fictional scenarios; an optional Supabase-backed live mode supports authenticated workspaces with PostgreSQL row-level security, private evidence storage, scoped authorization and audited evidence verification. Portfolio demonstrations are not approved for live incident-response evidence or customer records.
- **Architecture gallery:** Sample trust boundaries and named commercial products are illustrative; no diagram represents an authorized or certified client system or automatically authorized third-party offering.

**Do not upload or paste** CUI, classified information, ePHI/PHI, employer or customer records, internal vulnerability reports, identity credentials, tokens, or other sensitive information to any demonstration.

## Authentication, credentials and storage

- Public Supabase publishable keys used in browser configuration are not secrets; a publishable key is not sufficient authorization and must be restricted by proper database and Storage access policies.
- Supabase privileged keys, staging PostgreSQL URLs, email-provider credentials and other operational secrets belong exclusively in secure backend secret stores or protected GitHub Actions secrets. They must never be hard-coded into public files.
- The repository's [automated verification](.github/workflows/verify.yml) runs a local credential-hygiene scanner against tracked source and tests its detection behavior. This is a limited, preventive check; it does **not** establish the absence of every kind of secret, credential compromise, historical leak or application vulnerability.
- Signed-in IncidentDesk workflows depend on user authentication and correct RLS/Storage policies. [Implementation notes](incidentdesk/README.md) and [staging acceptance boundaries](incidentdesk/RELEASE-ACCEPTANCE.md) document the testing scope, operational caveats and remaining production-readiness limitations.

## Verification boundaries

The public codebase receives automated syntax, unit, browser and selected accessibility checks. Some security tests model tenant separation using synthetic identities and rolled-back SQL transactions. These tests are useful but do not replace multi-account end-to-end testing, independent penetration testing, formal government authorization, an SOC 2 examination, a HITRUST assessment or a HIPAA compliance determination.

There are no guarantees of production uptime, forensic-grade chain of custody, complete threat detection or regulatory compliance. Software and diagrams are made available for portfolio demonstration, technical discussion and educational inspection.
