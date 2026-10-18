# AttackPath — Defensive Threat Modeling Simulator

An interactive graph-analysis laboratory for **fictional** threat-modeling scenarios. It illustrates how a chain of modeled security weaknesses can make protected assets reachable, and how defensive safeguards can interrupt those modeled paths. No scanning, exploitation or cloud credentials.

## Use

Open `index.html#path` in a browser. Choose **Exposed**, **Identity-focused** or **Hardened**. Toggle individual safeguards, read the route trace, and review ranked defenses. Export a structured JSON analysis or a Markdown tabletop report.

## Technical architecture

- `attackpath-engine.js`: pure, dependency-free graph traversal module, usable from Node tests and browsers.
- `attackpath.js`: UI integration, escaped DOM rendering and export handlers.
- `attackpath.css`: responsive layout, animated graph edges and reduced-motion fallback.
- Graph: eight nodes, ten directed edges, three terminal targets, seven boolean weakness assumptions.
- A path is counted when all required weaknesses for its edges are present. A target is reachable if at least one path reaches it.
- A safeguard's score is the **counterfactual reduction in modeled reachable targets**, then number of interrupted modeled paths, if applied in isolation. It is not a quantitative risk score.

## Verify

From the site root run:

```sh
node --test labs/tests/attackpath.test.cjs
```

The Node built-in test runner requires no packages.

## Constraints and responsible use

This is an independently authored portfolio exercise containing fabricated assets. It is not an official FedRAMP, DoD or other authorization determination, risk assessment, real red-team engagement, threat intelligence feed, or penetration test. The graph intentionally omits unknown routes and probabilities. For real environments, use authorized assessment procedures, validate evidence, and review the applicable authoritative guidance.
