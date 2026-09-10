from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys,traceback,tempfile,os

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(tempfile.mkdtemp(prefix="rms-word-qa-")) if os.getenv("RMS_QA_READ_ONLY")=="1" else ROOT/"docs/browser-qa-v2.13.3"

def project():
    return {
      "name":"Word Export QA Project","context":"Student research project","currentStage":10,
      "ready":{str(i):True for i in range(1,10)},
      "data":{
        "broadTopic":"Sleep and learning",
        "finalRQ":"What is the association between reported weekday sleep duration and biology quiz score?",
        "questionType":"Relationship / association",
        "designType":"Correlational / observational",
        "claimBoundary":"Association only",
        "outcomeDV":"Biology quiz score",
        "experimentalUnit":"One student"
      },
      "sources":[],"reviews":[],"schema":[],"searchLog":[],"litClaims":[],"litOutline":[],
      "methods":{"design":{},"sampling":{},"ethics":{},"constructs":[],"conditions":[],"controlled":[],"confounders":[],"measurements":[],"procedureSteps":[],"protocolVersions":[]},
      "analysis":{"rawData":[],"headers":[],"runs":[]},"writing":{"sections":{},"discussionMap":[]},
      "transfer":{},"competency":{},"journey":{},"pilot":{},"pathway":{"selected":"observational"},
      "rescue":{},"aiHelper":{},"flow":{"onboarded":True,"activeTabByStage":{"10":"work"},"sectionByStage":{}},
      "created":"2026-09-08T00:00:00Z"
    }

def inline():
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">',"<style>"+css+"</style>",html)
    html=html.replace("</head>",'<script>window.__RMS_QA_SEED='+json.dumps(project())+';</script></head>')
    def repl(m):
        rel=m.group(1)
        js=(ROOT/rel).read_text(encoding="utf-8").replace("</script>","<\\/script>")
        pre=""
        if rel=="assets/app.js":
            pre="<script>RMSPilot.safeLoad=()=>({project:window.__RMS_QA_SEED,source:'primary',error:''});RMSPilot.safeSave=(k,p)=>({ok:true,time:new Date().toISOString()});RMSPilot.storageReport=()=>({available:true,error:'',lastSavedAt:''});RMSPilot.onboardingSeen=()=>true;RMSPilot.markOnboardingSeen=()=>true;</script>"
        return pre+"<script>"+js+"</script>"
    return re.sub(r'<script src="\./([^"]+)"></script>',repl,html)

def main():
    checks=[];errors=[]
    def ck(name,ok,detail=""):
        checks.append({"name":name,"passed":bool(ok),"detail":detail})
        print(("PASS" if ok else "FAIL"),name)

    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])
        page=browser.new_page(viewport={"width":1440,"height":950},accept_downloads=True)
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content(inline(),wait_until="load")
        page.wait_for_timeout(150)

        page.click("#moreMenuBtn");page.wait_for_timeout(40)
        menu=page.locator("#moreBackdrop").inner_text()
        ck("Student More menu identifies the notebook as a Word download","Download Word notebook" in menu and ".doc" in menu,menu)

        with page.expect_download() as info:
            page.get_by_role("button",name="Download Word notebook").click()
        d=info.value
        ck("Notebook download uses .doc extension",d.suggested_filename=="research-notebook.doc",d.suggested_filename)
        target=OUT/"QA_research-notebook.doc"
        d.save_as(str(target))
        raw=target.read_bytes()
        txt=raw.decode("utf-8-sig",errors="ignore")
        ck("Downloaded .doc contains Word-compatible document markup","urn:schemas-microsoft-com:office:word" in txt and "<w:WordDocument>" in txt)
        ck("Downloaded Word notebook contains accumulated student work","Word Export QA Project" in txt and "association between reported weekday sleep duration" in txt)
        ck("Downloaded Word notebook is not Markdown text","text/markdown" not in txt and not txt.lstrip().startswith("# "))

        # Snapshot download also uses .doc.
        page.locator("[data-open-research-snapshot]").first.click();page.wait_for_timeout(50)
        with page.expect_download() as info2:
            page.click("#downloadResearchSnapshot")
        d2=info2.value
        ck("Research Snapshot also downloads as .doc",d2.suggested_filename=="current-research-snapshot.doc",d2.suggested_filename)

        browser.close()

    ck("No unexpected JavaScript page errors",len(errors)==0,str(errors))
    report={"release":"v2.13.3","passed":sum(x["passed"] for x in checks),"total":len(checks),"checks":checks,"page_errors":errors}
    (OUT/"WORD_EXPORT_QA_RESULTS_v2.13.3.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print("RESULT",report["passed"],"/",report["total"])
    if report["passed"]!=report["total"]:sys.exit(2)

if __name__=="__main__":
    try: main()
    except Exception:
        traceback.print_exc();sys.exit(3)
