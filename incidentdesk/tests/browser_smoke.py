#!/usr/bin/env python3
"""IncidentDesk user journey smoke tests, no Supabase account required.
Validates only the fictional local demo and page functionality.
"""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright, expect

ROOT=pathlib.Path(__file__).resolve().parents[2]
ARTIFACTS=ROOT/"artifacts"/"incidentdesk"
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

def exercise(browser,url,width,height):
    context=browser.new_context(viewport={"width":width,"height":height},reduced_motion="reduce",accept_downloads=True)
    page=context.new_page();errors=[]
    page.on("pageerror",lambda error:errors.append(str(error)))
    page.goto(url,wait_until="load")
    expect(page.locator("#overviewTitle")).to_be_visible()
    expect(page.locator("#modeName")).to_have_text("Fictional demo environment")
    expect(page.locator("#kpiGrid .kpi")).to_have_count(4)
    ARTIFACTS.mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(ARTIFACTS/("overview-"+str(width)+".png")),full_page=True,animations="disabled")
    page.locator("#createOverview").click()
    expect(page.locator("#incidentDialog")).to_be_visible()
    page.locator("#incidentForm [name=title]").fill("Synthetic escalation workflow")
    page.locator("#incidentForm [name=description]").fill("Fictional identity change to examine.")
    page.locator("#incidentForm [name=severity]").select_option("high")
    page.locator("#incidentForm [name=status]").select_option("triage")
    page.locator("#incidentForm button[type=submit]").click()
    expect(page.locator("#incidentDialog")).to_be_hidden()
    if width < 900: page.locator("#mobileMenu").click()
    page.locator(".nav-item[data-view=incidents]").click()
    expect(page.locator("#view-incidents")).to_be_visible()
    page.locator("#search").fill("Synthetic escalation workflow")
    expect(page.locator("#caseRows tr")).to_have_count(1)
    page.locator("#search").fill("")
    page.screenshot(path=str(ARTIFACTS/("queue-"+str(width)+".png")),full_page=True,animations="disabled")
    page.locator("#search").fill("Synthetic escalation workflow")
    page.locator("#caseRows tr button").click()
    expect(page.locator("#detailDialog")).to_be_visible()
    expect(page.locator("#detailTitle")).to_have_text("Synthetic escalation workflow")
    page.locator("#noteText").fill("Fictional first responder note: assess source and preserve timeline.")
    page.locator("#noteForm button[type=submit]").click()
    expect(page.locator("#caseNotes")).to_contain_text("Fictional first responder note")
    page.locator(".detail-tab[data-detail=history]").click()
    expect(page.locator("#caseHistory")).to_contain_text("COMMENTED")
    page.screenshot(path=str(ARTIFACTS/("case-"+str(width)+".png")),full_page=True,animations="disabled")
    with page.expect_download() as download:
        page.locator("#exportIncident").click()
    assert download.value.suggested_filename.endswith(".md")
    payload=pathlib.Path(download.value.path()).read_text(encoding="utf-8")
    assert "Fictional first responder note" in payload
    assert "independent" in payload
    page.locator('[data-close=detailDialog]').click()
    if width < 900: page.locator("#mobileMenu").click()
    page.locator(".nav-item[data-view=team]").click()
    expect(page.locator("#memberList .member-row")).to_have_count(3)
    if width < 900: page.locator("#mobileMenu").click()
    page.locator(".nav-item[data-view=activity]").click()
    expect(page.locator("#activityList")).to_contain_text("COMMENTED")
    page.locator("#authButton").click()
    expect(page.locator("#authDialog")).to_be_visible()
    expect(page.locator("#authHint")).to_contain_text("not yet configured")
    page.locator('[data-close=authDialog]').click()
    assert not errors,"Uncaught page errors: "+" | ".join(errors)
    context.close()

def main():
    with http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Handler,directory=str(ROOT))) as server:
        threading.Thread(target=server.serve_forever,daemon=True).start()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True)
            try:
                for w,h in [(1440,900),(390,844)]:
                    exercise(browser,f"http://127.0.0.1:{server.server_port}/incidentdesk/index.html",w,h)
                    print(f"PASS: IncidentDesk synthetic operations browser flow at {w}x{h}",flush=True)
            finally:
                browser.close();server.shutdown()
if __name__=="__main__":main()
