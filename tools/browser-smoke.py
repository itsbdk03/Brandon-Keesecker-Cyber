#!/usr/bin/env python3
"""Desktop and mobile Chromium smoke tests of existing security workbenches."""
import contextlib, functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright, expect
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_): pass
def check(browser,base,width,height,mobile):
    # Test narrow responsive layout with touch input, without Chrome's device
    # viewport auto-scaling (which enlarges its layout viewport in CI).
    context=browser.new_context(viewport={"width":width,"height":height},is_mobile=False,has_touch=mobile,
                                reduced_motion="reduce",accept_downloads=True)
    page=context.new_page();errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(base+"/labs/index.html",wait_until="load")
    expect(page.locator(".bk-reviewer-launch")).to_be_visible()
    assert page.locator(".lab-nav[data-panel]").count()==6
    if mobile:
        assert page.locator(".workspace > .bk-reviewer-launch").count()==1, "Mobile tour should live within content, not offscreen"
    page.locator(".bk-reviewer-launch").click()
    expect(page.locator(".bk-tour-count")).to_have_text("STEP 1 OF 4")
    page.locator(".bk-tour-primary").click()
    expect(page.locator(".bk-tour-count")).to_have_text("STEP 2 OF 4")
    page.keyboard.press("Escape")
    expect(page.locator(".bk-reviewer-tour")).to_be_hidden()
    for name in ["controls","hunt","cloud","risk","config","path"]:
        page.locator('.lab-nav[data-panel="'+name+'"]').click()
        expect(page.locator("#panel-"+name)).to_be_visible()
        # Architecture is part of the existing panel, not another project.
        dossier=page.locator("#panel-"+name+" .bk-engineering-lens")
        expect(dossier).to_have_count(1)
        dossier.locator("summary").click()
        expect(dossier.locator(".bk-eng-stage")).to_have_count(4)
        assert dossier.locator(".bk-eng-source").count()>=2
        with page.expect_download() as export:
            dossier.locator(".bk-eng-download").click()
        notes=pathlib.Path(export.value.path()).read_text(encoding="utf-8")
        assert "Security Engineering Case Study" in notes and "## Known limitations" in notes
        dossier.locator("summary").click()
        report=page.locator("#panel-"+name+" .bk-print-report")
        expect(report).to_be_visible()
        with page.expect_download() as export:
            report.click()
        downloaded=export.value
        assert downloaded.suggested_filename.endswith("-print-ready-report.html")
        document=pathlib.Path(downloaded.path()).read_text(encoding="utf-8")
        assert "Demonstration boundary" in document and "<h2>Executive overview</h2>" in document
    page.locator('.lab-nav[data-panel="config"]').click()
    expect(page.locator("#configFindings")).not_to_have_text("0")
    page.locator("#configPreset").select_option("hardened")
    expect(page.locator("#configFindings")).to_have_text("0")
    assert int(page.locator("#configResolved").inner_text())>=8
    with page.expect_download() as download: page.locator("#configDeltaExport").click()
    assert download.value.suggested_filename.endswith(".md")
    page.locator("#configInput").fill('{"account":{}}')
    page.locator("#configScan").click()
    expect(page.locator("#configUnknown")).to_have_text("1")
    assert int(page.locator("#configUnverified").inner_text())>=1
    page.locator('.lab-nav[data-panel="hunt"]').click()
    assert page.locator(".v6-timeline-card").count()>=1
    with page.expect_download() as download: page.locator("#huntBrief").click()
    assert download.value.suggested_filename.endswith(".md")
    page.goto(base+"/labs/assuranceflow.html",wait_until="load")
    expect(page.locator("#rows button")).to_have_count(8)
    dossier=page.locator(".bk-engineering-lens")
    expect(dossier).to_have_count(1)
    dossier.locator("summary").click()
    expect(dossier.locator(".bk-eng-stage")).to_have_count(4)
    with page.expect_download() as export:
        dossier.locator(".bk-eng-download").click()
    assert "AssuranceFlow" in pathlib.Path(export.value.path()).read_text(encoding="utf-8")
    dossier.locator("summary").click()
    report=page.locator(".bk-print-report")
    expect(report).to_be_visible()
    with page.expect_download() as export:
        report.click()
    html=pathlib.Path(export.value.path()).read_text(encoding="utf-8")
    assert "AssuranceFlow" in html and "Demonstration boundary" in html
    page.locator(".bk-reviewer-launch").click()
    expect(page.locator(".bk-tour-count")).to_have_text("STEP 1 OF 4")
    page.locator(".bk-tour-close").click()
    page.locator("#rows button").filter(has_text="RA-5").click()
    page.locator("#narrative").fill("Fictional vulnerability management procedures define scanning ownership, frequency and remediation tracking.")
    page.locator("#owner").fill("Synthetic security owner")
    page.locator("#status").select_option("implemented")
    page.locator("#evidence").fill("DEMO-RA5-001")
    page.locator("#gap").fill("")
    page.locator("#form button[type=submit]").click()
    assert int(page.locator("#quality").inner_text())>0
    with page.expect_download() as download: page.locator("#exportReport").click()
    assert download.value.suggested_filename.endswith(".md")
    page.goto(base+"/labs/methodology.html",wait_until="load")
    expect(page.locator(".method-section")).to_have_count(7)
    expect(page.locator(".bk-method-architecture")).to_have_count(7)
    for section in ["controltrace","signalhunt","cloudguard","riskmatrix","configlens","attackpath","assuranceflow"]:
        expect(page.locator("#"+section+" .bk-eng-stage")).to_have_count(4)
    assert not errors,"Page JS errors: "+"; ".join(errors)
    context.close()
def main():
    with http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Handler,directory=str(ROOT))) as server:
        threading.Thread(target=server.serve_forever,daemon=True).start()
        base=f"http://127.0.0.1:{server.server_port}"
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True)
            try:
                for label,args in [("Desktop",(1366,820,False)),("Mobile",(390,844,True))]:
                    check(browser,base,*args)
                    print("PASS:",label,"seven existing lab routes, tours, remediation and exports")
            finally: browser.close()
            server.shutdown()
if __name__=="__main__": main()
