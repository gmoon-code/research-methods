#!/opt/pyvenv/bin/python
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys,traceback

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
SHOTS=OUT/"screenshots"
SHOTS.mkdir(parents=True,exist_ok=True)

def inline_app():
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">',"<style>"+css+"</style>",html)
    def repl(m):
        js=(ROOT/m.group(1)).read_text(encoding="utf-8").replace("</script>","<\\/script>")
        return "<script>"+js+"</script>"
    return re.sub(r'<script src="\./([^"]+)"></script>',repl,html)

def overflow(page):
    return page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")

def main():
    result={"release":"v2.11","checks":[],"page_errors":[],"console_errors":[],"screenshots":[]}
    def ck(name,ok,detail=None):
        result["checks"].append({"name":name,"passed":bool(ok),"detail":detail})
        print(("PASS" if ok else "FAIL"),name)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])
        page=browser.new_page(viewport={"width":1440,"height":1000})
        page.on("pageerror",lambda e:result["page_errors"].append(str(e)))
        page.on("console",lambda m:result["console_errors"].append(m.text) if m.type=="error" else None)
        page.set_content(inline_app(),wait_until="load")
        page.wait_for_timeout(450)

        # Dismiss first-run onboarding if present.
        if page.locator(".modal-backdrop").count():
            page.keyboard.press("Escape");page.wait_for_timeout(120)

        ck("Initial app renders without page errors",page.locator(".app-shell").count()==1 and not result["page_errors"],result["page_errors"])
        ck("My Research Snapshot is a top-level tool",page.locator("[data-open-research-snapshot]").count()>=1)

        page.fill("#projectName","Snapshot QA Project")
        page.fill("#projectContext","Beginner research methods")
        page.click("#beginProject")
        page.wait_for_timeout(120)

        # Stage 1 response cue and model examples.
        page.click('[data-tab="work"]')
        page.wait_for_timeout(80)
        cue=page.locator('[data-response-cue="interest1"]')
        ck("Stage field shows expected response length before typing",cue.count()==1 and "Typical working response" in cue.inner_text(),cue.inner_text() if cue.count() else "")
        page.fill('[data-field="interest1"]',"Plant growth, environmental stress, and seed germination")
        page.wait_for_timeout(60)
        ck("Live response word count updates","7 words currently" in cue.inner_text(),cue.inner_text())
        helpbox=page.locator('[data-field="interest1"]').locator("xpath=ancestor::div[contains(@class,'guided-field')]").locator("details.field-help")
        helpbox.locator("summary").click()
        htxt=helpbox.inner_text()
        ck("Field guidance includes explicit amount-to-write guidance","How much should I write?" in htxt)
        ck("Field guidance contrasts too-vague and good responses","Too vague" in htxt and "Good working response" in htxt)
        ck("Field guidance gives an actual concrete example","Plant physiology; human memory and learning; freshwater ecosystem health." in htxt,htxt[:500])
        page.screenshot(path=str(SHOTS/"03-response-example-guidance.png"),full_page=False);result["screenshots"].append("screenshots/03-response-example-guidance.png")

        # Fill a research question later, then open full snapshot without going backward.
        page.locator('[data-stage="4"]').click();page.wait_for_timeout(80);page.click('[data-tab="work"]')
        rq="What is the association between reported weekday sleep duration and biology quiz score among students in this class?"
        page.fill('[data-field="finalRQ"]',rq);page.wait_for_timeout(80)
        ck("Current context strip shows the accumulated research question",rq in page.locator(".current-context-strip").inner_text())

        # Add a Stage 10 response as accumulated work.
        page.locator('[data-stage="10"]').click();page.wait_for_timeout(80);page.click('[data-tab="work"]')
        if page.locator('[data-field="researchHyp"]').count():
            page.fill('[data-field="researchHyp"]',"Students reporting longer weekday sleep will tend to have higher biology quiz scores.")
        if page.locator('[data-field="experimentalUnit"]').count():
            page.fill('[data-field="experimentalUnit"]',"One student contributes one independent observational case.")
        page.wait_for_timeout(60)

        page.locator("[data-open-research-snapshot]").first.click()
        page.wait_for_selector("#researchSnapshotBackdrop")
        page.wait_for_timeout(100)
        snap=page.locator("#researchSnapshotBody").inner_text()
        ck("Full snapshot contains the research question entered in Stage 4",rq in snap)
        ck("Full snapshot contains earlier Stage 1 work","Plant growth, environmental stress, and seed germination" in snap)
        ck("Full snapshot is organized into the five research phases",all(x in snap for x in ["Question & Direction","Literature & Evidence Base","Study Design & Method","Data, Analysis & Results","Discussion & Paper"]))
        ck("Snapshot provides at-a-glance research chain","At-a-glance research chain" in snap)
        ck("Snapshot explains that it updates from the notebook","updates" in snap.lower())
        ck("Snapshot has no desktop horizontal overflow",overflow(page)<=1,overflow(page))
        page.screenshot(path=str(SHOTS/"01-full-research-snapshot-desktop.png"),full_page=False);result["screenshots"].append("screenshots/01-full-research-snapshot-desktop.png")

        # Jump back to Stage 4 from the snapshot.
        page.locator('#researchSnapshotBackdrop [data-snapshot-go="4"]').first.click();page.wait_for_timeout(120)
        ck("Snapshot can jump directly back to a source stage",page.locator(".stage-count").inner_text().startswith("Stage 4"))

        # Mobile snapshot access remains available when right sidebar is hidden.
        page.set_viewport_size({"width":360,"height":800});page.wait_for_timeout(120)
        ck("Mobile top tools still expose My Research Snapshot",page.locator(".top-actions [data-open-research-snapshot]").count()==1)
        page.locator(".top-actions [data-open-research-snapshot]").click();page.wait_for_selector("#researchSnapshotBackdrop");page.wait_for_timeout(80)
        ck("Full snapshot has no 360px horizontal page overflow",overflow(page)<=1,overflow(page))
        page.screenshot(path=str(SHOTS/"02-full-research-snapshot-mobile-360.png"),full_page=False);result["screenshots"].append("screenshots/02-full-research-snapshot-mobile-360.png")
        page.keyboard.press("Escape");page.wait_for_timeout(100)

        # Concrete detailed examples on a high-risk field.
        page.set_viewport_size({"width":1200,"height":900})
        page.locator('[data-stage="16"]').click();page.wait_for_timeout(80);page.click('[data-tab="work"]')
        lim=page.locator('[data-field="limitations"]').locator("xpath=ancestor::div[contains(@class,'guided-field')]").locator("details.field-help")
        lim.locator("summary").click()
        ltxt=lim.inner_text()
        ck("High-risk guidance includes a fuller detailed model","More detailed response" in ltxt and "Self-reported sleep" in ltxt,ltxt[:500])

        result["passed"]=all(x["passed"] for x in result["checks"])
        browser.close()
    (OUT/"BROWSER_QA_RESULTS_v2.11.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print("RESULT",sum(x["passed"] for x in result["checks"]),"/",len(result["checks"]))
    if not result["passed"]:sys.exit(2)

if __name__=="__main__":
    try: main()
    except Exception:
        traceback.print_exc();sys.exit(3)
