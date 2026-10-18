# BK Cyber Lab — interactive security portfolio demos

Six independent, browser-based demos built for Brandon Keesecker's public cybersecurity portfolio. All files are static HTML, CSS, JavaScript, and fictional sample data. There is no backend, account, analytics collection, remote API, or external dependency.

## Projects

### 01 · ControlTrace (`index.html#controls`)

A documentation and security control evidence tracker, focused on the **workflow** of translating example NIST SP 800-53 security controls into implementation narratives, responsible owners, evidence, and actionable gaps.

- 9 curated example control entries: AC-02, AU-06, CA-02, CM-06, IA-02, IR-04, PL-02, RA-05, SC-07.
- Search and filter by evidence status; edit owner, evidence, narrative, and next action.
- Progress KPI and CSV export; persists changes in local browser storage.
- Analyst evidence-completeness review, prioritized gaps, and a downloadable audit brief.
- Dropdown context labels refer to FedRAMP Low/Moderate/High and DoD IL4/IL5/IL6 but **do not map or claim baseline applicability**. Actual implementation must consult the current government requirements and tailoring.

### 02 · SignalHunt (`index.html#hunt`)

A small explainable detection lab built around an entirely fabricated incident sequence.

- Repeated authentication failure bursts: 5+ failures in 10 minutes from the same user/source (MITRE T1110).
- Login after failure bursts: successful login following 3+ failures in 10 minutes (T1078, broad investigation reference; a match alone does not prove compromise).
- Scripting process telemetry review heuristic (T1059 context).
- Watchlist matching for specified outbound destination IPs.
- Parses JSON arrays or CSV with `timestamp,type,user,ip,status,process,destination,detail` fields; no upload is sent to a server.
- Activity chart, event filtering, severity-ranked findings, JSON exports.
- Identity-based multi-event correlation timeline and downloadable analyst case narrative.
- Download `samples/events-demo.csv` to validate your own import workflow.

### 03 · CloudGuard (`index.html#cloud`)

An interactive cloud architecture diagram for exploring defense in depth:

- Six toggles: phishing-resistant MFA, least privilege, restricted ingress, encryption and key governance, centralized logging, segmentation.
- Connected architecture illustration and risk observation cards update live.
- Three *context-only* labels (commercial, federal, DoD). This is not an IL determination, compliance evaluator, STIG verifier, ATO prediction, or FedRAMP certification mechanism.
- Downloadable architecture review and defense-in-depth insights.
- The risk score is a hand-crafted example: base 90 minus weighted enabled safeguards. It is **not a validated quantitative risk estimate**.

### 04 · RiskMatrix (`index.html#risk`)

A 5x5 likelihood–impact governance dashboard:

- Add and remove fictional risks with assigned owners, likelihood, and impact.
- Change mitigation maturity 0–5 and see residual scoring change.
- Click a matrix square to filter the register.
- CSV export, prioritized risk treatment insights, committee memo, and local browser persistence.
- **Illustrative formula:** `residual = round(likelihood × impact × (1 − 0.15 × mitigation maturity))`. This is not a standard mandated by NIST or any compliance framework.

### 05 · ConfigLens (`index.html#config`)

An explainable, local AWS configuration summary scanner, based on a deliberately narrow **JSON schema**. It is not an AWS API scanner, Terraform/HCL parser, or cloud compliance engine.

- `account.rootMfa`: missing root MFA (AWS-012).
- `s3Buckets`: Block Public Access, HTTPS policy expectations, explicit encryption settings (AWS-001 through 003).
- `iamPolicies`: full wildcard `Action:*` and `Resource:*` on an `Allow` statement (AWS-004).
- `securityGroups`: internet-wide ingress to SSH (22) or RDP (3389), including IPv6 `::/0` (AWS-005).
- `cloudTrail`: explicitly disabled trail, multi-Region trail, log-file integrity checks (AWS-006 through 008).
- `rdsInstances`: public accessibility and encryption flags (AWS-009 and 010).
- `ebsVolumes`: explicit encryption flag (AWS-011).

Only available properties are evaluated. Unavailable properties are unknown—not compliant. No code is executed from the supplied JSON. Two fictional samples are included under `samples/`, and the browser can download structured SARIF 2.1.0 findings or an analyst Markdown review.

### Engineering notes (`methodology.html`)

A public-safe browser-readable set of project case studies: design objectives, workflows, implementation choices, limitations and validation claims. This page is linked from the homepage and lab UI.

## Open / host

From the parent portfolio folder, open `index.html` and click Cyber Projects → Launch demo. Or open `labs/index.html` directly. On Netlify, upload the **entire parent** `brandon-cyber-portfolio` folder so that `labs/` deploys alongside the homepage. Relative internal links work without configuration.

## Public safety and reliability

- Synthetic reference data uses documentation/test-only IP ranges (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`) and example private IPs.
- The demos must **never** be advertised as production SOC tooling, regulatory determinations, security certification, or customer work.
- The local browser can store changes from ControlTrace, CloudGuard, and RiskMatrix; clear site data to remove them. Downloads are generated in the browser.
- For a live public demo, don't enter customer documents, CUI, PHI, secrets, or sensitive production data.

## Sources used for conceptual terminology

- FedRAMP official catalog: https://www.fedramp.gov/2026/reference/controls/
- NIST SP 800-53: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final
- MITRE ATT&CK Brute Force: https://attack.mitre.org/techniques/T1110/
- MITRE ATT&CK Valid Accounts: https://attack.mitre.org/techniques/T1078/
- NIST SP 800-30: https://www.nist.gov/publications/guide-conducting-risk-assessments
- AWS S3 best practices: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
- AWS CloudTrail best practices: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/best-practices-security.html
- AWS IAM best practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- DoD Cloud Computing Security Requirements Guide: https://dl.dod.cyber.mil/wp-content/uploads/cloud/SRG/index-old.html

## Future enhancements

OSCAL import/export, versioned control history, downloadable SSP control snippets, sample Sigma-rule export, granular IP enrichment, and a configurable risk-matrix method would all be worthwhile additions. They are **not** implemented in this version.


### AttackPath

- Access: `index.html#path`
- Files: `attackpath-engine.js`, `attackpath.js`, `attackpath.css`
- Tests: `node --test tests/attackpath.test.cjs` (run from the `labs` directory)
- Read: [`ATTACKPATH.md`](ATTACKPATH.md)
- Browser-only graph traversal with annotated routes, counterfactual defense ranking, tabletop report and JSON export.
