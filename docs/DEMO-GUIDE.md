# Interactive Security Lab — Reviewer Walkthroughs

**Brandon Keesecker** · Seven browser-only cybersecurity demonstrations · All scenario data is fictional

> These projects illustrate workflow and engineering techniques. They are not client deliverables, live cloud scans, official FedRAMP / DoD determinations, full OSCAL validation, SOC monitoring products, or quantitative risk measurements. Do not enter CUI, PHI, real incident data, credentials, or confidential company documents.

## Getting started

1. Open the repository's `index.html` on a static web host or locally in a modern browser. Select **Cyber Projects**, then open the desired lab.
2. Six labs live inside `labs/index.html` with hash routes, such as `#config`. The seventh lives at `labs/assuranceflow.html`.
3. Run the no-dependency automated checks with `npm run check:js` and `npm run verify` (Node.js 20+). Review the latest GitHub Actions status in the repository.
4. Interpret every score, signal, or diagram as a demonstration of the *specific modeled assumptions*, not assurance about real systems.

## 01 · ControlTrace — security control evidence quality

**Try:** Select an example control, read the implementation narrative and evidence, change its status or document an open gap, and save. Check the completeness view and export the fictional audit brief.

**Observe:** The workbench maintains ownership, traceability, status, and a human-readable next action. The example controls are a curated subset only.

**Engineering discussion:** What evidence is necessary to demonstrate an implementation statement? How would control owners, inherited controls, assessment procedures, and official baseline applicability be modeled at scale?

**Boundary:** Program selection labels are contextual, not an authoritative FedRAMP or DoD control baseline crosswalk.

## 02 · SignalHunt — detection engineering

**Try:** Use the included sample events, review authentication failures and successful logins, then inspect the correlated activity timeline. Download the CSV, re-import it, and change the watchlist.

**Observe:** The initial authentication sequence requires matching *identity and source IP*, plus 3+ failures preceding a success within 10 minutes. Later script and network activity can be associated by identity and time—but the site does not claim causal or host-level proof.

**Engineering discussion:** How do time windows, source identities, event quality, and false-positive rates affect a detection? How would this be validated against a dedicated detection test corpus?

**Boundary:** Simplified rules and MITRE labels represent triage leads, not confirmed attacker behavior.

## 03 · CloudGuard — architectural safeguards

**Try:** Toggle MFA, least privilege, restricted ingress, encryption, centralized logging, and segmentation. Compare displayed architecture summaries and export the review.

**Observe:** The UI uses weighted illustrative assumptions to demonstrate how defenses interact. They are not independently evaluated AWS controls.

**Engineering discussion:** Why is an architecture diagram not enough to establish control effectiveness? What configuration or testing evidence would be required?

**Boundary:** The score is not a validated risk-reduction percentage.

## 04 · RiskMatrix — risk register prioritization

**Try:** Add a fictional risk, change likelihood and impact, adjust treatment maturity, filter the 5×5 grid, and export the prioritized risk committee memo.

**Observe:** Inherent and residual priorities update using a transparent demonstration formula.

**Engineering discussion:** How would asset criticality, existing mitigations, risk acceptance, expiry dates, and organizational risk appetite affect prioritization?

**Boundary:** The formula is not required or endorsed by NIST or any formal risk standard.

## 05 · ConfigLens — AWS JSON review and remediation evidence

**Try:** Select **Exposed environment**, inspect findings and the *Assessment coverage* panel, then select **Hardened environment**. Open **Remediation comparison** and download the change brief. For a harder test, capture a reviewed configuration as a baseline, edit the JSON, and run again.

**Observe:** Supported checks produce explainable observations and AWS guidance links. Crucially, missing fields are shown as **unassessed**, and completely omitted JSON sections are marked **not in scope**. A previously failing field that disappears does **not** count as successfully remediated unless the check can actually be re-evaluated.

**Engineering discussion:** Why must a detection distinguish “pass,” “fail,” and “unknown”? How does SARIF formatting differ from a validated live AWS scan?

**Boundary:** Only the defined JSON summary schema is supported. No AWS credentials, API integrations, or Terraform plans are processed.

## 06 · AttackPath — defensive graph modeling

**Try:** Select the exposed scenario, trace paths to fictional protected assets, then enable a safeguard. Compare target reachability, blocked transitions, and the ranked next actions. Download the analysis report.

**Observe:** The path counts are deterministic results of the provided nodes, directed edges, and conditions; not discoveries about an operating environment.

**Engineering discussion:** How do omitted attack techniques, lateral movement assumptions, privileged identities, and asset dependencies bias attack-path modeling?

**Boundary:** This is a synthetic tabletop model; a blocked modeled path does not prove an environment is secure.

## 07 · AssuranceFlow — documentation automation

**Try:** Edit a fictional control narrative or evidence reference, apply changes, review the computed documentation completeness, then export a Markdown reviewer report or JSON workpaper.

**Observe:** The workbench flags incomplete sample records. A limited OSCAL SSP `implemented-requirements` import reads control IDs and descriptions; its partial export is **not** a full SSP document.

**Engineering discussion:** How should evidence provenance, controls inheritance, reviewer approvals, and OSCAL schema validation be added to a real documentation platform?

**Boundary:** The quality score tests *record completeness by a transparent rubric*, not technical effectiveness, audit readiness, or authorization.

## Evidence for implementation quality

- The project engines have automated Node.js regression tests under `labs/tests/`.
- The CI workflow checks JavaScript syntax, static route integrity, and engine behavior after GitHub pushes.
- The repository separates demonstrative controls from official standards and avoids client evidence.
- Each lab is designed for browser-only demos without paid API keys or an external database.

## Engineering honesty

A strong security portfolio makes assumptions, limitations, and validation boundaries visible. A synthetic test success should never be described as enterprise production deployment, regulatory compliance, or an independently verified security result.
