# Visual inspection upgrades for existing security labs

These refinements deepen two **existing** cybersecurity applications; no new project or paid service has been added.

## AttackPath — inspect the graph, not just look at it

- Click a fictional asset in the SVG graph, or select it by name from a native dropdown. Graph assets can also be reached by keyboard and selected with Enter or Space.
- The details panel describes whether the asset lies on a target-reaching route, shows modeled incoming/outgoing transitions, identifies which switches interrupt them, and states that these are not observed network events.
- On narrow screens the graph can be fitted to the available width instead of forcing horizontal scrolling; turn fitting off to explore the more readable full-width graph.
- The new `AttackPathEngine.inspectNode` pure function leaves scenario state unchanged and is covered by regression tests for target route membership, intervened edges, invalid asset IDs, and eight valid assets.

## SignalHunt — interrogate each timeline observation

- Each stage of the original identity/source-aware authentication timeline is now a focusable, selected-state button.
- Select a stage to view its timestamp, signal context, and the evidence still needed before establishing an incident or causal relationship.
- Arrow-left and arrow-right keys move between stages, supporting keyboard-based investigation.
- On narrow viewports stages reflow into two columns or a vertical sequence rather than cramming four tiny boxes onto a phone.

## Quality validation

- The existing `tools/browser-smoke.py` uses Playwright Chromium to verify AttackPath's asset picker, keyboard selection, graph fit control, and SignalHunt timeline stage selection on both desktop and narrow touch viewports.
- The existing accessibility workflow continues checking the real rendered projects, including ARIA and keyboard semantics.
- All data is synthetic, and no live infrastructure, customer evidence, external API or tracking is involved.

These modeled observations do **not** establish exploitability, incident causation, compliance, or a security assessment. They demonstrate transparent, verifiable reasoning inside educational applications.
