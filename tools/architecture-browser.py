#!/usr/bin/env python3
"""Test the shipped portfolio architecture gallery at 1440px and 390px.

Uses only fictional local files and the GitHub Pages-equivalent static routes.
The image-poster and SVG controls are exercised across every framework tab.
"""
import functools
import http.server
import pathlib
import threading

from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
FRAMEWORKS = [
    "fedramp-moderate", "fedramp-high", "dod-il4", "dod-il5",
    "cmmc-l2", "hitrust", "hipaa", "soc2"
]


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def run_case(browser, url, width):
    context = browser.new_context(
        viewport={"width": width, "height": 850},
        reduced_motion="reduce",
        accept_downloads=True,
    )
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url, wait_until="load")
    expect(page.locator("a.skip-link")).to_have_attribute("href", "#main-content")
    expect(page.locator("#architectureTabs [role=tab]")).to_have_count(8)
    expect(page.locator("#architectureCards .preview")).to_have_count(8)

    desired_orientation = "horizontal" if width < 1090 else "vertical"
    expect(page.locator("#architectureTabs")).to_have_attribute("aria-orientation", desired_orientation)

    for slug in FRAMEWORKS:
        page.locator(f"#tab-{slug}").click()
        expect(page.locator(f"#tab-{slug}")).to_have_attribute("aria-selected", "true")
        expect(page.locator("#architecturePanel")).to_have_attribute("aria-labelledby", f"tab-{slug}")
        assert page.url.endswith("#" + slug), "Deep link did not update for " + slug
        expect(page.locator("#referenceDiagram")).to_have_count(1)
        expect(page.locator("#posterMode")).to_be_enabled(timeout=12000)
        page.locator("#posterMode").click()  # Poster/vector preference intentionally persists across tabs.
        expect(page.locator("#posterImage")).to_have_js_property("complete", True)
        dimensions = page.locator("#posterImage").evaluate("(img)=>({w:img.naturalWidth,h:img.naturalHeight})")
        assert dimensions["w"] > 600 and dimensions["h"] > 400, f"Poster broken for {slug}"
        expect(page.locator("#posterContainer")).to_be_visible()
        expect(page.locator("#openPoster")).to_have_attribute("href", f"posters/{slug}.webp")
        if width < 1090:
            viewport = page.locator("#diagramViewport")
            poster = page.locator("#posterImage")
            assert poster.evaluate("(el)=>el.getBoundingClientRect().width") <= viewport.evaluate("(el)=>el.getBoundingClientRect().width")+1, "Poster overflows mobile viewer"

        page.locator("#vectorMode").click()
        expect(page.locator("#architectureGraphic")).to_be_visible()
        expect(page.locator("#posterContainer")).to_be_hidden()

    with page.expect_download() as artifact:
        page.locator("#downloadSvg").click()
    assert artifact.value.suggested_filename == "soc2-sample-reference-architecture.svg"
    page.locator("#posterMode").click()
    with page.expect_download() as artifact:
        page.locator("#downloadPoster").click()
    assert artifact.value.suggested_filename == "soc2-illustrated-poster.webp"

    page.goto(url + "#fedramp-moderate", wait_until="load")
    expect(page.locator("#tab-fedramp-moderate")).to_have_attribute("aria-selected","true")
    page.keyboard.press("Tab")
    expect(page.locator("a.skip-link")).to_be_focused()
    assert not errors, "Architecture JavaScript exceptions: " + " | ".join(errors)
    context.close()
    print(f"PASS: {len(FRAMEWORKS)} architecture tabs, illustrated posters, SVGs, mobile fit and downloads at width {width}", flush=True)


def main():
    with http.server.ThreadingHTTPServer(
        ("127.0.0.1", 0), functools.partial(Handler, directory=str(ROOT))
    ) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f"http://127.0.0.1:{server.server_port}/architectures/index.html"
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                for width in (1440, 390):
                    run_case(browser, url, width)
            finally:
                browser.close()


if __name__ == "__main__":
    main()
