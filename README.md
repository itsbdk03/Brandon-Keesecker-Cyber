# Brandon Keesecker | Cybersecurity Engineering & Public Sector Advisory

[![Portfolio verification](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/verify.yml/badge.svg)](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/verify.yml)
[![Browser tests](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/browser-smoke.yml/badge.svg)](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/browser-smoke.yml)
[![IncidentDesk verification](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/incidentdesk.yml/badge.svg)](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/incidentdesk.yml)
[![Accessibility reviews](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/accessibility-visual.yml/badge.svg)](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/accessibility-visual.yml)

**Eight interactive cybersecurity projects · Eight reference architectures · Public-safe demonstrations · Source code and automated tests**

[**View my live portfolio**](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/) · [**Explore projects**](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/#cyber-projects) · [**Explore reference architectures**](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/) · [**LinkedIn**](https://www.linkedin.com/in/brandon-keesecker-i-ccsk-aws-ccp-24463b242/)

![Cybersecurity project gallery](docs/images/portfolio-projects.webp)

## Professional focus

I'm a public-sector cybersecurity consultant with work spanning **FedRAMP Low, Moderate, and High**, **DoD IL4, IL5, and IL6**, **CMMC Level 2**, and technical security documentation development. My advisory experience also includes consulting involving the **NIST AI Risk Management Framework (AI RMF)**, along with extensive knowledge of **Zero Trust Architecture** and NIST SP 800-207.

I work with requirements, control implementation narratives, risk analysis, scope and evidence quality, assessment readiness, and technical security architecture. My broader governance and assurance experience includes HITRUST, HIPAA, and SOC 2. My academic background includes a cybersecurity-focused master's degree from **West Virginia University**, and I hold the **Certificate of Cloud Security Knowledge (CCSK)**.

This repository showcases my technical interests and engineering work alongside public-safe explanations of professional focus areas. It contains original portfolio exercises and **no customer deliverables or private engagement records**.

## Interactive cybersecurity projects

Each of these **eight projects** has working source files and a browser-accessible demonstration. The first seven operate locally in the browser with fictional datasets. IncidentDesk additionally includes an optional authenticated Supabase-backed experience; visitors can explore its fictional demo without creating an account.

| Live project | Area | What the demonstration does | Code |
|---|---|---|---|
| **[ControlTrace](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/index.html#controls)** | GRC / Control Evidence | Track synthetic NIST control implementation narratives, evidence links, owners, and remediation gaps. | [Source](labs/index.html) |
| **[SignalHunt](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/index.html#hunt)** | Detection Engineering | Correlate fabricated authentication, process, and network events; inspect explainable alerts and export findings. | [Source](labs/index.html) |
| **[CloudGuard](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/index.html#cloud)** | Cloud Defense Modeling | Simulate cloud safeguards and compare security posture and trust boundaries. | [Source](labs/index.html) |
| **[RiskMatrix](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/index.html#risk)** | Risk Engineering | Prioritize synthetic security risks and explore treatment options in an interactive risk register. | [Source](labs/index.html) |
| **[ConfigLens](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/index.html#config)** | AWS Configuration Analysis | Evaluate sample AWS JSON configurations, compare exposure, and export SARIF-compatible findings. | [Source](labs/index.html) |
| **[AttackPath](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/index.html#path)** | Threat Modeling | Explore modeled attack routes, apply defensive safeguards, and export tabletop analysis. | [Source](labs/index.html) |
| **[AssuranceFlow](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/assuranceflow.html)** | Security Documentation | Review synthetic SSP narratives, map evidence quality, triage gaps, and export workpapers. | [Source](labs/assuranceflow.html) |
| **[IncidentDesk](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/incidentdesk/index.html)** | Full-Stack Security Operations | Explore the fictional SOC demo or sign in to an isolated Supabase workspace with incidents, audit history, private evidence and playbooks. | [Source](incidentdesk/index.html) |

### Featured: IncidentDesk — Supabase-backed SOC workbench

[**Launch IncidentDesk**](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/incidentdesk/index.html) · [Technical architecture](incidentdesk/README.md) · [Security acceptance and test boundaries](incidentdesk/RELEASE-ACCEPTANCE.md)

- **Interface:** incident intake and status tracking, assignments, notes, incident history, response playbooks, analytics, and in-app notifications.
- **Backend:** Supabase Auth, PostgreSQL with workspace-scoped row-level security, private object storage, Realtime, scheduled operations and JWT-protected Edge Functions.
- **Evidence integrity:** recorded SHA-256 digests and server-side verification with custody-event audit writes; verification fails closed on integrity or audit registration errors.
- **Verification:** portable tests and rollback-only SQL security suites for role-based access and simulated tenant separation. A separate staging environment supports authorization regression testing.

IncidentDesk is a **portfolio-scale reference implementation**, not a certified SOC product. Database security tests do not substitute for complete independent multi-account, Storage API, recovery, or penetration testing; the current acceptance notes define what has been verified.

### Reference architecture gallery

The [interactive architecture library](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/) includes **all eight illustrated posters** and companion vector system diagrams. Each example describes boundary controls, identity, logging, segmentation, recovery, third-party service choices, and assessment considerations.

[FedRAMP Moderate](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#fedramp-moderate) · [FedRAMP High](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#fedramp-high) · [DoD IL4](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#dod-il4) · [DoD IL5](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#dod-il5) · [CMMC Level 2 Enclave](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#cmmc-l2) · [HITRUST CSF](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#hitrust) · [HIPAA Security Rule](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#hipaa) · [SOC 2](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/#soc2)

These diagrams represent **illustrative reference designs**, not deployed client environments or accredited FedRAMP, DoD, HITRUST, HIPAA, CMMC or SOC 2 systems. Product names are examples; eligibility and authorizations depend on the selected offering, scope and implementation evidence.

## Engineering practices

| Practice | Public implementation |
|---|---|
| Explainable decisions | Transparent security rules, risk models, evidence scores and scenario assumptions |
| Repeatable tests | Node.js unit tests, source syntax checks, automated browser exercises, and accessible UI reviews |
| Reproducible investigations | Fictional inputs, downloadable workpapers, analytic exports and reviewer walkthroughs |
| Secure-by-design boundaries | Browser-local handling for the seven labs; scoped RLS, private storage and audited functions for IncidentDesk |
| Security hygiene | No private API credentials in frontend code; limited-scope public keys where required; automated repository secret-pattern checks |
| Technical documentation | [Lab engineering notes](labs/methodology.html), [project demonstration guide](docs/DEMO-GUIDE.md), [architecture overview](docs/ARCHITECTURE.md), [security statement](SECURITY.md) |

The repository's GitHub Actions workflows perform code checks and browser exercises on relevant changes. Tests and implementation notes document their actual boundaries rather than presenting simulations as live infrastructure audits.

## Technology and structure

- **Frontend:** HTML, responsive CSS, JavaScript and browser-native APIs.
- **Security labs:** dependency-light Node.js-testable modules and synthetic JSON/CSV evidence.
- **IncidentDesk:** JavaScript, Supabase Auth, PostgreSQL RLS, private Storage, Edge Functions and Realtime.
- **Testing:** Node.js built-in test runner, GitHub Actions, Chromium/Playwright, and separate staging SQL authorization scripts.

```text
/
├── index.html               Professional portfolio
├── architectures/           Eight framework tabs, vector diagrams, illustrated posters
├── labs/                    Seven working browser-first security labs
├── incidentdesk/            Full-stack fictional incident-response application
├── docs/                    Architecture, methodology and demonstration records
├── tools/                   Source validation and security hygiene checks
└── .github/workflows/       Automated verification and controlled staging workflows
```

### Local verification

Requires Node.js 20 or newer. No application secrets are required to run the local-first portfolio checks.

```bash
npm run check:js
npm run audit:security
npm run verify
```

IncidentDesk production and staging service credentials belong exclusively in their designated secret stores; **service-role keys and database passwords are never frontend configuration**. The optional live environment is distinct from the static website. See [IncidentDesk's documentation](incidentdesk/README.md) for design details.

## Security, provenance and responsible use

This is a **personal, publicly shareable security engineering portfolio**. All embedded incident logs, example cloud accounts, evidence files, data flows, network scenarios and architectures are synthetic. None imply access to customer systems or formal assessment results.

- Do not submit CUI, PHI, credentials, internal client records, or production data to these demonstrations.
- A portfolio lab result is **not** proof of compliance, authorization, a comprehensive vulnerability assessment, or production readiness.
- Security reports and responsible disclosure contact details are in [SECURITY.md](SECURITY.md).
- Professional descriptions intentionally omit client names, confidential engagement architectures and unpublished findings.

**[Open the portfolio →](https://itsbdk03.github.io/Brandon-Keesecker-Cyber/)**
