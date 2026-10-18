# Command Center — faster navigation within seven existing security labs

This shared component improves the six-tab cybersecurity workspace and standalone AssuranceFlow. **It is not an eighth project.** It introduces no backend, API key, hosted search service, or activity tracking.

## How to use

- Open the **Explore projects** button, or press **Ctrl+K** (Windows/Linux) or **Command+K** (macOS).
- Search for project names, control concepts or tasks: `FedRAMP`, `OSCAL`, `risk`, `AWS JSON`, `incident`, or `report`.
- Choose a current lab or one of the available actions: guided walkthrough, Evidence Check, engineering architecture, executive report or copy a direct link.
- Use Up/Down to move among results, Enter to choose one, and Escape to dismiss. The native modal dialog keeps keyboard focus in the menu while open and returns focus on dismissal.
- On phone screens, select **Explore projects** and tap the matching project. All search and routing happens in the current browser.

## Under the hood

- `labs/command-model.js` is the pure, testable search model, with exactly seven project entries, known actions, query normalization, token-level ranking and predeclared local routes.
- `labs/command-menu.js` creates the accessible dialog, mounts on both the six-lab hub and standalone AssuranceFlow, routes to existing panels, and invokes already-implemented project features.
- `labs/command-menu.css` gives the same modal consistent keyboard focus indicators, touch targets and responsive formatting.
- `labs/tests/command-model.test.cjs` provides nine regression tests covering searches, ranking, strict seven-project limits, known routes and case normalization.
- `tools/browser-smoke.py` checks opening, search, project selection, keyboard navigation, Evidence Check actions and standalone AssuranceFlow access at desktop and mobile-sized widths.

## Safety and limitations

Only predeclared project names, descriptive keywords and safe local routes are searched. There is no indexing of client documentation or upload of private files. The command menu never runs a new security scan or modifies a real system. It calls the educational workflows that already exist in the public repository. Software and accessibility checks do not equal a complete security or WCAG assessment.
