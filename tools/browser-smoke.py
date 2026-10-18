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
    # The command palette searches the existing seven workbenches, with no new project.
    launch=page.locator(".bk-command-trigger")
    expect(launch).to_be_visible()
    launch.click()
    palette=page.locator(".bk-command-dialog")
    expect(palette).to_be_visible()
    expect(palette.locator(".bk-command-result[data-command^='project:']")).to_have_count(7)
    query=palette.locator(".bk-command-search")
    query.fill("AttackPath")
    expect(palette.locator(".bk-command-result[data-command='project:path']")).to_have_count(1)
    query.press("Enter")
    expect(palette).to_be_hidden()
    expect(page.locator("#panel-path")).to_be_visible()
    page.keyboard.press("Control+k")
    expect(palette).to_be_visible()
    query.fill("Evidence Check")
    palette.locator("[data-command='action:exercise']").click()
    expect(palette).to_be_hidden()
    expect(page.locator("#panel-path .bk-proof")).to_have_attribute("open","")
    page.locator("#panel-path .bk-proof summary").click()
    page.keyboard.press("Control+k")
    expect(palette).to_be_visible()
    query.fill("risk")
    query.press("ArrowDown")
    expect(palette.locator("[data-command='project:risk']")).to_be_focused()
    page.keyboard.press("Enter")
    expect(page.locator("#panel-risk")).to_be_visible()
    expect(palette).to_be_hidden()
    assert page.locator('a.lab-nav[href="assuranceflow.html"]').get_attribute("aria-pressed") is None, "Standalone project link must not be given button-only ARIA state"
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
        proof=page.locator("#panel-"+name+" .bk-proof")
        expect(proof).to_have_count(1)
        proof.locator("summary").click()
        expect(proof.locator(".bk-proof-steps li")).to_have_count(3)
        expect(proof.locator(".bk-proof-verify")).to_be_visible()
        proof.locator("summary").click()
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
        print("REPORT AUDIT", name, "JS exceptions:", errors, flush=True)
        with page.expect_download(timeout=8000) as export:
            report.click()
        downloaded=export.value
        assert downloaded.suggested_filename.endswith("-print-ready-report.html")
        document=pathlib.Path(downloaded.path()).read_text(encoding="utf-8")
        assert "Demonstration boundary" in document and "<h2>Executive overview</h2>" in document
    page.locator('.lab-nav[data-panel="config"]').click()
    expect(page.locator("#configFindings")).not_to_have_text("0")
    config_proof=page.locator("#panel-config .bk-proof")
    config_proof.locator("summary").click()
    config_proof.locator(".bk-proof-verify").click()
    expect(config_proof.locator(".bk-proof-feedback strong")).to_have_text("Not yet verified")
    page.locator("#configPreset").select_option("hardened")
    expect(page.locator("#configFindings")).to_have_text("0")
    assert int(page.locator("#configResolved").inner_text())>=8
    config_proof.locator(".bk-proof-verify").click()
    expect(config_proof.locator(".bk-proof-feedback strong")).to_have_text("Modeled outcome verified ✓")
    expect(config_proof.locator(".bk-proof-actions button").last).to_be_enabled()
    config_proof.locator("summary").click()
    with page.expect_download() as download: page.locator("#configDeltaExport").click()
    assert download.value.suggested_filename.endswith(".md")
    page.locator("#configInput").fill('{"account":{}}')
    page.locator("#configScan").click()
    expect(page.locator("#configUnknown")).to_have_text("1")
    assert int(page.locator("#configUnverified").inner_text())>=1
    page.locator('.lab-nav[data-panel="path"]').click()
    path_proof=page.locator("#panel-path .bk-proof")
    path_proof.locator("summary").click()
    # A selected asset shows actual topology edge states without inventing a scan.
    page.locator("#pathAssetSelect").select_option("database")
    expect(page.locator("#pathAssetInspector .path-inspector-head strong")).to_have_text("Data Store")
    assert page.locator("#pathAssetInspector .path-inspector-list li").count()>0
    node=page.locator('#pathDiagram [data-asset="backup"]')
    node.focus()
    node.press("Enter")
    expect(page.locator("#pathAssetInspector .path-inspector-head strong")).to_have_text("Backup Vault")
    expect(page.locator("#pathAssetSelect")).to_have_value("backup")
    page.locator("#pathFit").check()
    assert "path-fit" in (page.locator("#pathDiagram").get_attribute("class") or "")
    page.locator("#pathHarden").click()
    path_proof.locator(".bk-proof-verify").click()
    expect(path_proof.locator(".bk-proof-feedback strong")).to_have_text("Modeled outcome verified ✓")
    path_proof.locator("summary").click()
    page.locator('.lab-nav[data-panel="hunt"]').click()
    assert page.locator(".v6-timeline-card").count()>=1
    timeline=page.locator(".v6-timeline-card").first
    steps=timeline.locator("button.v6-timeline-step")
    assert steps.count()>=2
    steps.nth(1).click()
    expect(timeline.locator(".v6-timeline-inspector h4")).to_have_text("Successful authentication")
    expect(steps.nth(1)).to_have_attribute("aria-pressed","true")
    steps.first.focus()
    steps.first.press("ArrowRight")
    expect(steps.nth(1)).to_have_attribute("aria-pressed","true")
    with page.expect_download() as download: page.locator("#huntBrief").click()
    assert download.value.suggested_filename.endswith(".md")
    page.goto(base+"/labs/assuranceflow.html",wait_until="load")
    # Same command palette exists on the standalone seventh project.
    expect(page.locator(".bk-command-trigger")).to_be_visible()
    page.locator(".bk-command-trigger").click()
    expect(page.locator(".bk-command-dialog")).to_be_visible()
    page.locator(".bk-command-search").fill("ControlTrace")
    expect(page.locator("[data-command='project:controls']")).to_have_count(1)
    page.locator(".bk-command-close").click()
    expect(page.locator(".bk-command-dialog")).to_be_hidden()
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
    assurance_proof=page.locator(".bk-proof")
    assurance_proof.locator("summary").click()
    expect(assurance_proof.locator(".bk-proof-steps li")).to_have_count(3)
    assurance_proof.locator(".bk-proof-verify").click()
    expect(assurance_proof.locator(".bk-proof-feedback strong")).to_have_text("Modeled outcome verified ✓")
    assurance_proof.locator("summary").click()
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
