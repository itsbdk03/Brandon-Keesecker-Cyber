#!/usr/bin/env python3
"""Reproducible desktop/mobile screenshots and WCAG accessibility checks.

Usage:
  python -m pip install playwright==1.56.0
  npm install --no-save --ignore-scripts --no-audit --no-fund axe-core@4.10.3
  python -m playwright install chromium
  python tools/visual-accessibility.py

This program does not assert WCAG conformance; it finds only automatically
detectable issues in the exercised fictional/static scenarios.
"""
import functools
import http.server
import json
import pathlib
import threading
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).resolve().parents[1]
AXE = ROOT / "node_modules" / "axe-core" / "axe.min.js"
DEST = ROOT / "artifacts" / "visual-review"
VIEWS = [
    ("portfolio", "/index.html", "body"),
    ("controltrace", "/labs/index.html#controls", "#panel-controls"),
    ("signalhunt", "/labs/index.html#hunt", "#panel-hunt"),
    ("cloudguard", "/labs/index.html#cloud", "#panel-cloud"),
    ("riskmatrix", "/labs/index.html#risk", "#panel-risk"),
    ("configlens", "/labs/index.html#config", "#panel-config"),
    ("attackpath", "/labs/index.html#path", "#panel-path"),
    ("assuranceflow", "/labs/assuranceflow.html", "#rows"),
    ("engineering-notes", "/labs/methodology.html", ".method-section"),
]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def audit(browser, base, label, dims):
    width, height = dims
    context = browser.new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce",
        has_touch=(label == "touch"),
        is_mobile=False,
    )
    results = []
    for name, uri, visible in VIEWS:
        # Fresh document/focus state for every hash-routed workbench.
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(base + uri, wait_until="load")
        if errors:
            print(f"JS exception while loading {name}: {errors[:3]}", flush=True)
        expect(page.locator(visible).first).to_be_visible()
        if name in {"controltrace", "signalhunt", "cloudguard", "riskmatrix", "configlens", "attackpath"}:
            # Hash navigation must expose only the selected project workbench.
            slug = uri.split("#")[-1]
            expect(page.locator("#panel-" + slug)).to_be_visible()
        # A keyboard user must be able to bypass navigation.
        skip = page.locator("a.bk-skip-link").first
        assert skip.count() == 1, f"Skip-to-content link missing on {name}"
        target = skip.get_attribute("href")
        assert target and target.startswith("#"), f"Skip destination invalid on {name}"
        assert page.locator(target).count() == 1, f"Skip target missing on {name}"
        page.keyboard.press("Tab")
        expect(skip).to_be_focused()
        page.add_script_tag(path=str(AXE))
        detail = page.evaluate(
            """async () => {
                const r = await axe.run(document, {
                    runOnly: {type:'tag', values:[
                        'wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'
                    ]},
                });
                return {
                    passes: r.passes.length,
                    incomplete: r.incomplete.length,
                    violations: r.violations.map(v=>({
                        id:v.id,impact:v.impact,description:v.description,
                        help:v.help,helpUrl:v.helpUrl,
                        nodes:v.nodes.slice(0,8).map(n=>({
                            target:n.target,summary:n.failureSummary
                        })),
                        nodesCount:v.nodes.length
                    }))
                };
            }"""
        )
        # Capture the exact UI state audited, for manual review or recruiting
        # evidence. Screenshots are CI artifacts, not approved pixel baselines.
        page.evaluate("window.scrollTo(0,0)")
        page.screenshot(path=str(DEST / f"{label}-{name}.png"), full_page=True, animations="disabled")
        issues = [v for v in detail["violations"] if v["impact"] in ("serious", "critical")]
        results.append(
            {
                "view": name,
                "viewport": {"width": width, "height": height},
                "url": uri,
                "pass_rules": detail["passes"],
                "incomplete_rules": detail["incomplete"],
                "violations": detail["violations"],
                "serious_or_critical": len(issues),
                "javascript_errors": list(errors),
            }
        )
        print(
            f'{label:7} {name:18} | {len(detail["violations"]):2} '
            f'accessibility issue types ({len(issues)} serious/critical); '
            f'{len(errors)} page exceptions',
            flush=True,
        )
        page.close()
    context.close()
    return results


def main():
    if not AXE.is_file():
        raise RuntimeError("axe-core missing; run npm install --no-save --ignore-scripts axe-core@4.10.3")
    DEST.mkdir(parents=True, exist_ok=True)
    with http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT))
    ) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_port}"
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            try:
                output = []
                for label, dims in [("desktop", (1440, 900)), ("touch", (390, 844))]:
                    output.extend(audit(browser, base, label, dims))
            finally:
                browser.close()
                server.shutdown()
    issues = [
        (r["viewport"]["width"], r["view"], v)
        for r in output for v in r["violations"]
        if v["impact"] in ("serious", "critical")
    ]
    js_errors = [(r["view"], error) for r in output for error in r["javascript_errors"]]
    report = {
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "scope": "Automated axe-core WCAG rule checks only; not full WCAG conformance",
        "views_reviewed": len(output),
        "serious_or_critical_issue_types": len(issues),
        "js_errors": len(js_errors),
        "view_results": output,
    }
    (DEST / "accessibility.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    lines = [
        "# Accessibility and visual QA",
        "",
        f"- Views and viewports reviewed: **{len(output)}**",
        f"- Serious/critical rule violations: **{len(issues)}**",
        f"- Browser JavaScript errors: **{len(js_errors)}**",
        "- Screenshots: each of seven labs, the homepage, and methodology at desktop and touch widths",
        "",
        "> This is automated inspection, not a claim of WCAG AA conformance, "
        "full accessibility coverage, or pixel-perfect regression testing.",
        "",
        "| View | Width | Rule violations | Serious / critical | JS errors |",
        "|---|---:|---:|---:|---:|",
    ]
    for r in output:
        lines.append(
            f'| {r["view"]} | {r["viewport"]["width"]} | '
            f'{len(r["violations"])} | {r["serious_or_critical"]} | '
            f'{len(r["javascript_errors"])} |'
        )
    if issues:
        lines += ["", "## Serious or critical accessibility issues", ""]
        for width, name, item in issues:
            lines.append(
                f'- **{name} ({width}px):** {item["id"]} — {item["help"]}, '
                f'{item["nodesCount"]} affected element(s).'
            )
    (DEST / "SUMMARY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    if issues or js_errors:
        for width, name, item in issues[:25]:
            print(
                f'FAIL {name} @ {width}px: {item["id"]} ({item["impact"]}) '
                f'{[n["target"] for n in item["nodes"][:3]]}',
                flush=True,
            )
        for name, err in js_errors[:5]:
            print(f"JS ERROR {name}: {err}", flush=True)
        raise SystemExit(1)
    print(f"PASS: {len(output)} viewport/page evaluations, no serious/critical automatic WCAG findings", flush=True)


if __name__ == "__main__":
    main()
