# Evidence Check — verifiable interactive exercises for seven existing labs

The Evidence Check panel is a **feature inside each existing project**, not an eighth project or a certification. It turns a demonstration from an open-ended dashboard into a practical exercise with a specific pass/fail condition.

## How a reviewer uses it

1. Open one of the seven public-safe interactive labs.
2. Expand **Take a 60-second challenge** and review its three tasks.
3. Choose **Locate controls** to jump to the relevant workbench feature.
4. Perform the analysis using the fictional local data.
5. Choose **Verify current result**. The panel reads the *current in-browser state* and displays the result, expected next action, and an evidence observation.
6. For a modeled success, choose **Copy evidence note**. Browsers without clipboard access save a small Markdown note instead.

## Explicit outcomes

| Existing project | Demonstration completion condition |
| --- | --- |
| ControlTrace | A gap-status record is selected while the Gap filter is active |
| SignalHunt | At least one sample detection finding and one visible source-aware timeline |
| CloudGuard | All six modeled safeguards are enabled |
| RiskMatrix | A populated heatmap cell filters the risk register |
| ConfigLens | Hardened sample selected, no current findings, and at least one old finding genuinely re-evaluated as resolved |
| AttackPath | Initialized graph, zero modeled reachable targets and zero modeled routes |
| AssuranceFlow | RA-5 documented as implemented with no remaining issues under the illustrative completeness rubric |

## Architecture and trust boundaries

- The standalone dependency-free engine `labs/exercise-model.js` contains the seven clearly specified tasks and evaluation logic, testable with Node.js.
- The `labs/exercise-mode.js` adapter reads existing model engines and rendered UI via `BKLabData`, `BKConfigLensReport`, `BKAttackPathReport`, and `BKAssuranceReport` (no new external API calls).
- User-controlled inputs are presented through DOM `textContent`. No unsafe HTML execution is required.
- The pass/fail outcome is computed only when the user explicitly selects **Verify current result**. Copying a note never constitutes an attested result.
- No completion score is sent to a server or stored in an account, and checks don't require credentials.

## Engineering checks

`labs/tests/exercise-model.test.cjs` tests defined missions, absent evidence, false-positive prevention, completion criteria for each lab, and non-mutation. `tools/browser-smoke.py` opens the exercise interface on desktop and narrow touch sizes and checks real interactions in ConfigLens, AttackPath, and AssuranceFlow. The accessibility automation tests the same pages and captures responsive screenshots.

## Important limitations

These local exercises prove only that the demo UI and rule engines behave according to documented assumptions. They do **not** constitute penetration tests, risk acceptance, audit evidence, incident confirmation, cloud compliance reviews, OSCAL validation, FedRAMP authorization, or any externally assessed cybersecurity credential. They intentionally use fabricated data.
