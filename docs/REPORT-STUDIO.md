# Report Studio — Professional Report Design

**Applies to all seven existing labs.** Report Studio is a shared client-side reporting component, not an eighth project. The goal is to show engineering documentation and communication skills alongside the interactive models.

## How to use it

1. Open a project, run its normal workflow, and review its data.
2. Choose **Executive report** in the project toolbar.
3. The browser downloads a standalone HTML file. Open it in a browser and click **Print / Save as PDF** to produce a printable PDF; there is no server-side PDF generation.
4. Review and anonymize any content before distributing it. In the public demonstration all preloaded data is synthetic.

Each report includes a title, generated UTC timestamp, explicit demonstration notice, executive metrics, observed evidence, recommendations, and model limitations.

## Project-specific content

| Lab | Data included |
| --- | --- |
| ControlTrace | Control status, fictional evidence identifiers, ownership, action notes |
| SignalHunt | Event/findings counts, rule matches, identity/source context, triage actions |
| CloudGuard | Modeled safeguards and recommended verification |
| RiskMatrix | Inherent inputs, sample residual rankings and risk-treatment follow-up |
| ConfigLens | Evaluated findings, missing/unknown fields, unverified historical findings and scope gaps |
| AttackPath | Modeled reachability and single-safeguard counterfactual improvement opportunities |
| AssuranceFlow | Implementation documentation completeness, owner, evidence, and next actions |

The resulting standalone file contains static markup and CSS, with only a fixed print action. The report engine escapes user-controlled text before adding it to HTML. Imported text is *not* trusted as markup. Reports are generated locally without a database, third-party reporting API, or analytics service.

## How it's verified

- \`labs/report-engine.js\` exports pure \`normalize\`, \`html\`, and \`markdown\` functions.
- \`labs/tests/report-engine.test.cjs\` covers standalone structure, semantic content, no-finding handling, escaping of injected HTML, array limits, non-mutation, and input validation.
- \`tools/browser-smoke.py\` uses desktop and mobile Chromium to open all seven labs, download the corresponding standalone HTML reports, and check the report's demonstration and executive-overview sections.
- GitHub Actions runs fast JavaScript tests separately from actual browser interaction checks.

## Assessment boundaries

These reports do **not** constitute client audit deliverables, FedRAMP authorization packages, OSCAL schema validation, actual AWS scanning, independent assurance, security conclusions, or proof of regulatory conformance. The term “executive report” means an easily reviewed communication format, **not** an independently reviewed audit opinion.

## Further refinement opportunities (not shipped)

- Formal PDF generation with multi-page table continuation and document accessibility tests
- Digitally signed/versioned evidence manifests and provenance checks
- Scoped source-data review and explicit approval processes
- Automated screenshot regression comparisons and accessibility audits
