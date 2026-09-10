from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys,traceback

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/"docs/browser-qa-v2.13.1"
SHOTS=OUT/"screenshots"

def base_project(stage=10):
    return {
      "name":"AI Visibility QA","context":"First-time research student","currentStage":stage,
      "ready":{str(i):True for i in range(1,stage)},"data":{
        "finalRQ":"What is the association between reported weekday sleep duration and biology quiz score among students in one class?",
        "questionType":"Relationship / association","designType":"Correlational / observational",
        "claimBoundary":"Association only; no causal claim.","outcomeDV":"Biology quiz score",
        "experimentalUnit":"One student contributes one independent observational case."
      },
      "sources":[],"reviews":[],"schema":[],"searchLog":[],"litClaims":[],"litOutline":[],
      "methods":{"design":{},"sampling":{},"ethics":{},"constructs":[],"conditions":[],"controlled":[],"confounders":[],"measurements":[],"procedureSteps":[],"protocolVersions":[]},
      "analysis":{"rawData":[],"headers":[],"runs":[]},"writing":{"sections":{},"discussionMap":[]},
      "transfer":{},"competency":{},"journey":{},"pilot":{},"pathway":{"selected":"observational"},
      "rescue":{},"aiHelper":{},"flow":{"onboarded":True,"activeTabByStage":{str(stage):"work"},"sectionByStage":{}},
      "created":"2026-09-08T00:00:00Z"
    }

def inline_app(seed=None):
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">',"<style>"+css+"</style>",html)
    seed_json=json.dumps(seed) if seed is not None else "null"
    html=html.replace("</head>",'<script>window.__RMS_QA_SEED='+seed_json+';</script></head>')
    def repl(m):
        rel=m.group(1)
        js=(ROOT/rel).read_text(encoding="utf-8").replace("</script>","<\\/script>")
        prefix=""
        if rel=="assets/app.js":
            prefix="<script>RMSPilot.safeLoad=()=>({project:window.__RMS_QA_SEED,source:window.__RMS_QA_SEED?'primary':'none',error:''});RMSPilot.safeSave=(key,project)=>{window.__RMS_QA_SEED=JSON.parse(JSON.stringify(project));return {ok:true,time:new Date().toISOString()};};RMSPilot.storageReport=()=>({available:true,error:'',lastSavedAt:''});RMSPilot.clearProjectStorage=()=>({primary:true,recovery:true,meta:true,onboarding:true});RMSPilot.onboardingSeen=()=>true;RMSPilot.markOnboardingSeen=()=>true;</script>"
        return prefix+"<script>"+js+"</script>"
    return re.sub(r'<script src="\./([^"]+)"></script>',repl,html)

def make_page(browser,seed=None,width=1440,height=950):
    p=browser.new_page(viewport={"width":width,"height":height})
    errors=[]
    p.on("pageerror",lambda e:errors.append(str(e)))
    p.set_content(inline_app(seed),wait_until="load")
    p.wait_for_timeout(180)
    return p,errors

def main():
    results=[]
    errors=[]
    def ck(name,ok,detail=""):
        results.append({"name":name,"passed":bool(ok),"detail":detail})
        print(("PASS" if ok else "FAIL"),name)

    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])

        page,e=make_page(browser,None);errors+=e
        ck("Ask Research AI is visible before Stage 1",page.locator("#aiHelperLauncher:visible").count()==1)
        ck("Launcher uses the full Ask Research AI label","Ask Research AI" in page.locator("#aiHelperLauncher").inner_text(),page.locator("#aiHelperLauncher").inner_text())
        page.click("#aiHelperLauncher");page.wait_for_timeout(50)
        ck("AI conversation panel opens from welcome","always available research help" in page.locator("#aiHelperPanel").inner_text().lower())
        page.screenshot(path=str(SHOTS/"01-ai-visible-on-welcome.png"),full_page=False)
        page.close()

        page,e=make_page(browser,base_project());errors+=e
        ck("Ask Research AI remains visible during Stage work",page.locator("#aiHelperLauncher:visible").count()==1)
        page.click("#helpMenuBtn");page.wait_for_timeout(30)
        ck("Structured Help still includes Ask Research AI","Ask Research AI" in page.locator("#unifiedHelpBackdrop").inner_text())
        page.click("#closeUnifiedHelp");page.wait_for_timeout(30)

        detail=page.locator('details.stage-tool-drawer > summary').filter(has_text="Methods Lab")
        if detail.count():
            detail.click();page.get_by_role("button",name="Open Methods Lab").click();page.wait_for_timeout(50)
            ck("Ask Research AI remains visible above a major Lab modal",page.locator("#methodsBackdrop").count()==1 and page.locator("#aiHelperLauncher:visible").count()==1)
            page.click("#aiHelperLauncher");page.wait_for_timeout(40)
            ck("AI panel can open while a Lab is still open",page.locator("#methodsBackdrop").count()==1 and page.locator("#aiHelperPanel:visible").count()==1)
        page.screenshot(path=str(SHOTS/"02-ai-visible-over-methods-lab.png"),full_page=False)
        page.close()

        page,e=make_page(browser,base_project(),360,780);errors+=e
        ck("Mobile keeps the full Ask Research AI label","Ask Research AI" in page.locator("#aiHelperLauncher").inner_text())
        ck("Mobile launcher is visible without page-level horizontal overflow",
           page.locator("#aiHelperLauncher:visible").count()==1 and page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")<=1)
        page.screenshot(path=str(SHOTS/"03-ai-visible-mobile.png"),full_page=False)
        page.close()

        browser.close()

    ck("No unexpected JavaScript page errors occurred",len(errors)==0,str(errors))
    report={"release":"v2.13.1","passed":sum(x["passed"] for x in results),"total":len(results),"checks":results,"page_errors":errors}
    (OUT/"AI_VISIBILITY_QA_RESULTS_v2.13.1.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print("RESULT",report["passed"],"/",report["total"])
    if report["passed"]!=report["total"]:
        sys.exit(2)

if __name__=="__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(3)
