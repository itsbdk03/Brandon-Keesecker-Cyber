# Portfolio deployment and release verification

**Live portfolio:** https://itsbdk03.github.io/Brandon-Keesecker-Cyber/  
**Source:** https://github.com/itsbdk03/Brandon-Keesecker-Cyber  
**Published from:** GitHub Pages, `main` branch, repository root.

This repository contains the deployed public website and its eight linked applications. The Pages workflow publishes committed static assets; the verification workflows validate source, test logic, and browser behavior. The homepage, project hub, and architecture gallery are public portfolio deliverables rather than installation examples.

## Published destinations

| Surface | URL |
|---|---|
| Professional homepage | https://itsbdk03.github.io/Brandon-Keesecker-Cyber/ |
| Cybersecurity project gallery | https://itsbdk03.github.io/Brandon-Keesecker-Cyber/#cyber-projects |
| Integrated security lab | https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/ |
| AssuranceFlow studio | https://itsbdk03.github.io/Brandon-Keesecker-Cyber/labs/assuranceflow.html |
| IncidentDesk demo | https://itsbdk03.github.io/Brandon-Keesecker-Cyber/incidentdesk/index.html |
| Architecture gallery | https://itsbdk03.github.io/Brandon-Keesecker-Cyber/architectures/ |

## Verification and release process

- **[Portfolio verification](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/verify.yml):** static route checks, JavaScript syntax, portable unit tests, and tracked-file credential hygiene.
- **[Browser smoke tests](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/browser-smoke.yml):** Chromium desktop and mobile exercise of the browser-based labs.
- **[Accessibility and visual QA](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/accessibility-visual.yml):** automated WCAG checks and screenshot artifacts.
- **[IncidentDesk application checks](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/incidentdesk.yml):** application code checks and separate UI smoke tests.
- **[Staging authorization gate](https://github.com/itsbdk03/Brandon-Keesecker-Cyber/actions/workflows/incidentdesk-staging-gate.yml):** protected, manually started SQL regression tests against staging when its database URL is configured as an Actions secret. A normal website deployment does not imply this gate has run.

Successful automated checks establish the scope tested by those workflows, not independent certification, penetration-test coverage, accessibility certification or validation of all live backend paths.

## Public-safe operation

- The portfolio and seven browser-based labs use fictional examples without privileged API credentials.
- IncidentDesk supports a public fictional demo and optional signed-in access to its separately hosted Supabase environment.
- The frontend's Supabase publishable key is public by design; service-role keys, database passwords and outbound email provider credentials must remain in private service secret stores.
- No source file is intended to contain employer/client documentation, CUI, PHI, internal infrastructure details, private keys, or production customer datasets.
- `npm run audit:security` checks tracked source for high-confidence credential patterns and sensitive filenames. Its patterns complement rather than replace GitHub secret scanning and careful manual review.
- Source and test descriptions preserve the difference between finished portfolio demonstrations and production-approved security systems.

## Reproducibility

The source is maintained in this repository. Code checks use Node.js 20+:

```bash
npm run check:js
npm run audit:security
npm run verify
```

The static site uses no build stage. Its HTML, JavaScript, CSS and compressed architecture posters are published with the repository; back-end service authorization, storage access and email configuration are documented separately under [IncidentDesk](../incidentdesk/README.md).
