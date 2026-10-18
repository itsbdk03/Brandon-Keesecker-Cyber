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
    # A live Supabase client must actually be loadable, even while no user is signed in.
    page.wait_for_function("typeof window.supabase?.createClient === 'function'",timeout=20000)
    assert page.evaluate("window.INCIDENTDESK_CONFIG.url.endsWith('.supabase.co')")
    assert page.evaluate("window.INCIDENTDESK_CONFIG.publishableKey.startsWith('sb_publishable_')")
    expect(page.locator("#modeName")).to_have_text("Fictional demo environment")
    expect(page.locator("#kpiGrid .kpi")).to_have_count(5)
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
    # A privileged analyst action changes severity and writes a separate event.
    page.locator("#escalateIncident").click()
    expect(page.locator("#detailMeta .pill.critical")).to_have_count(1)
    page.locator(".detail-tab[data-detail=history]").click()
    expect(page.locator("#caseHistory")).to_contain_text("UPDATED")
    page.locator(".detail-tab[data-detail=playbook]").click()
    expect(page.locator("#detail-playbook")).to_be_visible()
    page.locator("#playbookPick").select_option("identity")
    page.locator("#startPlaybook").click()
    expect(page.locator("#playbookChecklist .playbook-step")).to_have_count(5)
    page.locator("#playbookChecklist input[type=checkbox]").first.check()
    expect(page.locator("#playbookChecklist")).to_contain_text("1 of 5")
    page.locator(".detail-tab[data-detail=evidence]").click()
    with page.expect_download() as manifest:
        page.locator("#exportEvidenceManifest").click()
    assert "manifest_sha256" in pathlib.Path(manifest.value.path()).read_text(encoding="utf-8")
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
    expect(page.locator("#workspaceSelect")).to_be_disabled()
    expect(page.locator("#memberForm [name=email]")).to_have_count(1)
    expect(page.locator("#memberList .member-row")).to_have_count(3)
    if width < 900: page.locator("#mobileMenu").click()
    page.locator(".nav-item[data-view=activity]").click()
    expect(page.locator("#activityList")).to_contain_text("COMMENTED")
    if width < 900: page.locator("#mobileMenu").click()
    page.locator(".nav-item[data-view=analytics]").click()
    expect(page.locator("#socAnalytics .kpi")).to_have_count(6)
    expect(page.locator("#socAnalytics")).to_contain_text("MTTA")
    page.screenshot(path=str(ARTIFACTS/("analytics-"+str(width)+".png")),full_page=True,animations="disabled")
    page.locator("#notificationButton").click()
    expect(page.locator("#notificationDialog")).to_be_visible()
    expect(page.locator("#notificationList")).to_contain_text("no alerts")
    page.locator('[data-close=notificationDialog]').click()
    page.locator("#authButton").click()
    expect(page.locator("#authDialog")).to_be_visible()
    expect(page.locator("#authHint")).to_contain_text("magic link")
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
