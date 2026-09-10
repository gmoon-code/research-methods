from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys,traceback,os,tempfile

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(tempfile.mkdtemp(prefix="rms-chat-qa-")) if os.getenv("RMS_QA_READ_ONLY")=="1" else ROOT/"docs/browser-qa-v2.13.2"
SHOTS=OUT/"screenshots"

def project(stage=10):
    return {
      "name":"Chat QA","context":"Student research","currentStage":stage,
      "ready":{str(i):True for i in range(1,stage)},"data":{
        "finalRQ":"What is the association between reported weekday sleep duration and biology quiz score?",
        "questionType":"Relationship / association","designType":"Correlational / observational",
        "claimBoundary":"Association only","outcomeDV":"Biology quiz score",
        "experimentalUnit":"One student"
      },
      "sources":[],"reviews":[],"schema":[],"searchLog":[],"litClaims":[],"litOutline":[],
      "methods":{"design":{},"sampling":{},"ethics":{},"constructs":[],"conditions":[],"controlled":[],"confounders":[],"measurements":[],"procedureSteps":[],"protocolVersions":[]},
      "analysis":{"rawData":[],"headers":[],"runs":[]},"writing":{"sections":{},"discussionMap":[]},
      "transfer":{},"competency":{},"journey":{},"pilot":{},"pathway":{"selected":"observational"},
      "rescue":{},"aiHelper":{},"flow":{"onboarded":True,"activeTabByStage":{str(stage):"work"},"sectionByStage":{}},
      "created":"2026-09-08T00:00:00Z"
    }

def inline(seed=None):
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">',"<style>"+css+"</style>",html)
    html=html.replace("</head>",'<script>window.__RMS_QA_SEED='+json.dumps(seed)+';</script></head>')
    def repl(m):
        rel=m.group(1)
        js=(ROOT/rel).read_text(encoding="utf-8").replace("</script>","<\\/script>")
        pre=""
        if rel=="assets/app.js":
            pre="<script>RMSPilot.safeLoad=()=>({project:window.__RMS_QA_SEED,source:window.__RMS_QA_SEED?'primary':'none',error:''});RMSPilot.safeSave=(k,p)=>({ok:true,time:new Date().toISOString()});RMSPilot.storageReport=()=>({available:true,error:'',lastSavedAt:''});RMSPilot.onboardingSeen=()=>true;RMSPilot.markOnboardingSeen=()=>true;</script>"
        return pre+"<script>"+js+"</script>"
    return re.sub(r'<script src="\./([^"]+)"></script>',repl,html)

def main():
    checks=[];errors=[]
    def ck(n,o,d=""):
        checks.append({"name":n,"passed":bool(o),"detail":d});print(("PASS" if o else "FAIL"),n)
    with sync_playwright() as pw:
        b=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])

        p=b.new_page(viewport={"width":1440,"height":950});p.on("pageerror",lambda e:errors.append(str(e)));p.set_content(inline(None),wait_until="load");p.wait_for_timeout(120)
        ck("Welcome launcher is named Research Chat",p.locator("#aiHelperLauncher").inner_text().strip().endswith("Research Chat"),p.locator("#aiHelperLauncher").inner_text())
        p.click("#aiHelperLauncher");p.wait_for_timeout(40)
        txt=p.locator("#aiHelperPanel").inner_text()
        ck("Opened panel is branded as research chat","research chat" in txt.lower(),txt[:500])
        ck("Opened panel does not present itself as Research AI","research ai" not in txt.lower(),txt[:500])
        p.screenshot(path=str(SHOTS/"01-research-chat-welcome.png"),full_page=False);p.close()

        p=b.new_page(viewport={"width":1440,"height":950});p.on("pageerror",lambda e:errors.append(str(e)));p.set_content(inline(project()),wait_until="load");p.wait_for_timeout(120)
        ck("Stage launcher remains Research Chat","Research Chat" in p.locator("#aiHelperLauncher").inner_text())
        p.click("#helpMenuBtn");p.wait_for_timeout(30)
        ck("Structured Help names the conversational option Research Chat","Research Chat" in p.locator("#unifiedHelpBackdrop").inner_text())
        p.click("#closeUnifiedHelp");p.wait_for_timeout(20)
        detail=p.locator('details.stage-tool-drawer > summary').filter(has_text="Methods Lab")
        if detail.count():
            detail.click();p.get_by_role("button",name="Open Methods Lab").click();p.wait_for_timeout(40)
            ck("Research Chat remains visible over a Lab",p.locator("#aiHelperLauncher:visible").count()==1)
        p.screenshot(path=str(SHOTS/"02-research-chat-stage.png"),full_page=False);p.close()

        p=b.new_page(viewport={"width":360,"height":780});p.on("pageerror",lambda e:errors.append(str(e)));p.set_content(inline(project()),wait_until="load");p.wait_for_timeout(120)
        ck("Mobile keeps full Research Chat label","Research Chat" in p.locator("#aiHelperLauncher").inner_text())
        ck("Mobile has no page-level horizontal overflow",p.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")<=1)
        p.screenshot(path=str(SHOTS/"03-research-chat-mobile.png"),full_page=False);p.close()
        b.close()

    ck("No unexpected page errors",len(errors)==0,str(errors))
    report={"release":"v2.13.2","passed":sum(x["passed"] for x in checks),"total":len(checks),"checks":checks,"page_errors":errors}
    (OUT/"RESEARCH_CHAT_QA_RESULTS_v2.13.2.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print("RESULT",report["passed"],"/",report["total"])
    if report["passed"]!=report["total"]:sys.exit(2)

if __name__=="__main__":
    try:main()
    except Exception:
        traceback.print_exc();sys.exit(3)
