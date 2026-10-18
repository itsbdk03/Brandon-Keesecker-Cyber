# Accessibility and reproducible visual review

This is a quality-assurance layer for the seven existing interactive cybersecurity projects, not a new project.

## Automated review

The GitHub Actions accessibility workflow runs Chromium against nine views—the main portfolio, ControlTrace, SignalHunt, CloudGuard, RiskMatrix, ConfigLens, AttackPath, AssuranceFlow, and Engineering Notes—at desktop (1440×900) and touch (390×844) viewport widths.

On each of 18 page/viewport combinations, it runs axe-core automatic WCAG 2.0, 2.1 and 2.2 A/AA-tagged checks, captures the rendered page, checks for uncaught browser errors, and verifies a keyboard Skip to main content link and destination. Serious or critical violations and page exceptions fail the job. Other violation severities remain visible in the report for remediation.

GitHub Actions retains a downloadable **visual-and-accessibility-evidence** artifact for 30 days. It includes 18 PNG screenshots, a concise SUMMARY.md and detailed accessibility.json. These images are not approved golden pixel-diff baselines.

## Local reproduction

Run these commands from the repository root:

```bash
python -m pip install playwright==1.56.0
npm install --no-save --ignore-scripts --no-audit --no-fund axe-core@4.10.3
python -m playwright install chromium
python tools/visual-accessibility.py
```

CI pins the same dependencies; see .github/workflows/accessibility-visual.yml.

## Validity and limits

Automated pass results do not establish full WCAG compliance. Manual keyboard and screen-reader testing, focus order across dynamic states, color review, zoom/reflow, and assistive technology testing are still necessary. Screenshots are review evidence rather than proof of accessibility or regression-free rendering. The tools use public-safe synthetic demo data and an isolated CI browser; no customer evidence is uploaded.