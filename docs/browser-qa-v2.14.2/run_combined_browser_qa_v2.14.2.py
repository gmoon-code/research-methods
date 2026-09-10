#!/opt/pyvenv/bin/python
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys,traceback,os,tempfile

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(tempfile.mkdtemp(prefix="rms-combined-qa-")) if os.getenv("RMS_QA_READ_ONLY")=="1" else Path(__file__).resolve().parent
SHOTS=OUT/"screenshots"
SHOTS.mkdir(parents=True,exist_ok=True)
SHOTS.mkdir(parents=True,exist_ok=True)

def base_project(stage=1,path="unsure"):
    return {
      "name":"Student UX QA Project","context":"First-time research student","currentStage":stage,
      "ready":{},"data":{},"sources":[],"reviews":[],"schema":[],"searchLog":[],"litClaims":[],"litOutline":[],
      "methods":{"design":{},"sampling":{},"ethics":{},"constructs":[],"conditions":[],"controlled":[],"confounders":[],"measurements":[],"procedureSteps":[],"protocolVersions":[]},
      "analysis":{"rawData":[],"headers":[],"runs":[]},"writing":{"sections":{},"discussionMap":[]},
      "transfer":{},"competency":{},"journey":{},"pilot":{},"pathway":{"selected":path},"rescue":{},"aiHelper":{},
      "flow":{"onboarded":True,"activeTabByStage":{str(stage):"work"},"sectionByStage":{}},
      "created":"2026-09-08T00:00:00Z"
    }

def seed_stage4():
    p=base_project(4,"unsure")
    p["ready"]={str(i):True for i in range(1,4)}
    p["data"].update({
      "interest1":"Plant physiology; human memory and learning; freshwater ecosystem health.",
      "ideaA":"Explore whether sleep duration is associated with biology quiz performance.",
      "broadTopic":"Sleep and learning","topicChoice":"Sleep and biology learning",
      "phenomenon":"Students report different weekday sleep durations.",
      "contextPop":"Grade 11 biology students in one class","scope":"One class during one unit",
      "rq1":"Does sleep affect grades?","rq2":"Is sleep related to biology quiz performance?",
      "rq3":"How is weekday sleep associated with quiz performance?",
      "questionType":"Correlational / observational"
    })
    p["flow"]["sectionByStage"]={"4":1}
    return p

def seed_stage10():
    p=base_project(10,"observational")
    p["ready"]={str(i):True for i in range(1,11)}
    p["data"].update({
      "broadTopic":"Sleep and learning","topicChoice":"Sleep and biology learning",
      "finalRQ":"What is the association between reported weekday sleep duration and biology quiz score among students in one class?",
      "questionType":"Relationship / association",
      "gapStatement":"A local extension can test whether the relationship appears in this secondary biology context.",
      "designType":"Correlational / observational","designWhy":"Sleep will be measured, not assigned.",
      "claimBoundary":"Association only; no causal claim.",
      "researchHyp":"Students reporting longer weekday sleep will tend to have higher biology quiz scores.",
      "nullHyp":"There is no population association between reported weekday sleep and biology quiz score.",
      "predictorIV":"Reported weekday sleep duration","outcomeDV":"Biology quiz score",
      "operationalDefs":"Sleep is self-reported average Sunday–Thursday hours; performance is percent correct on one quiz.",
      "experimentalUnit":"One student contributes one independent observational case.",
      "population":"Students enrolled in Grade 11 biology at the school",
      "sample":"30 students from one available biology class",
      "samplingMethod":"Convenience sample","sampleLimits":"One class only"
    })
    p["methods"]["design"].update({"primaryOutcome":"Biology quiz score","experimentalUnit":"One student contributes one independent observational case.","claimCeiling":"Association only; no causal claim."})
    p["methods"]["sampling"].update({"population":p["data"]["population"],"sample":p["data"]["sample"],"method":"Convenience sample","generalization":"One class only"})
    p["flow"]["sectionByStage"]={"4":1,"10":0}
    return p

def seed_stage12():
    p=seed_stage10()
    p["currentStage"]=12
    p["ready"].update({"11":True})
    p["flow"]["activeTabByStage"]={"12":"work"}
    p["flow"]["sectionByStage"]["12"]=1
    p["data"].update({
      "instrument":"Short sleep survey plus existing biology quiz score",
      "measureQuality":"Same quiz for all students; sleep is self-reported and therefore imperfect.",
      "ethicsIssues":"Student privacy and voluntary participation require teacher/school review.",
      "procedure":"Collect sleep report, link to coded quiz score, remove identifiers before analysis.",
      "replication":"One observational case per participating student.","rowUnit":"One student",
      "columns":"student_id — identifier\nsleep_hours — numeric hours\nquiz_score — numeric percent",
      "missingRule":"Keep missing values as missing; do not invent values.",
      "exclusionRule":"Exclude only prespecified ineligible or unusable records.",
      "analysisIntent":"Estimate the association between sleep hours and quiz score."
    })
    p["methods"]["design"]["rowUnit"]="One student"
    return p

def seed_stage14():
    p=seed_stage12()
    p["currentStage"]=14
    p["ready"].update({"12":True,"13":True})
    p["flow"]["activeTabByStage"]={"14":"work"}
    p["flow"]["sectionByStage"]["14"]=0
    p["schema"]=[
      {"name":"student_id","type":"Identifier","role":"ID","definition":"Anonymous student code","missing":""},
      {"name":"sleep_hours","type":"Numeric","role":"Predictor","definition":"Average reported weekday sleep hours","missing":"NA"},
      {"name":"quiz_score","type":"Numeric","role":"Outcome","definition":"Biology quiz percent score","missing":"NA"}
    ]
    p["analysis"]["headers"]=["student_id","sleep_hours","quiz_score"]
    p["analysis"]["rawData"]=[
      {"student_id":"S01","sleep_hours":"6.5","quiz_score":"76"},
      {"student_id":"S02","sleep_hours":"7.0","quiz_score":"81"},
      {"student_id":"S03","sleep_hours":"7.5","quiz_score":"88"}
    ]
    p["data"].update({
      "rawLocation":"Original CSV stored in the teacher-approved project folder.",
      "missingObserved":"No missing values in the three-row QA fixture.",
      "errorsCorrections":"No corrections.","descriptives":"Inspect distributions and summarize sleep and quiz score.",
      "primaryEstimand":"Pearson correlation between reported weekday sleep hours and biology quiz score.",
      "analysisChoice":"Pearson correlation",
      "assumptionChecks":"Inspect scatterplot, linear form, extreme values, and independence.",
      "effectSizePlan":"Report r with a confidence interval when available.","multiplicity":"One primary association."
    })
    return p

def seed_stage16():
    p=seed_stage14()
    p["currentStage"]=16
    p["ready"].update({"14":True,"15":True})
    p["flow"]["activeTabByStage"]={"16":"work"}
    p["data"].update({
      "result1":"Reported weekday sleep was positively associated with biology quiz score, r = .43, p = .018.",
      "resultsDraft":"Thirty students were analyzed. Reported weekday sleep was positively associated with biology quiz score, r = .43, p = .018.",
      "directAnswer":"Students reporting longer weekday sleep tended to have higher biology quiz scores in this sample.",
      "claimBoundary":"Association only; no causal claim.",
      "discussionDraft":"Initial discussion draft from the Stage notebook."
    })
    p["writing"]["sections"]["results"]=p["data"]["resultsDraft"]
    p["writing"]["sections"]["discussion"]=p["data"]["discussionDraft"]
    return p

def inline_app(seed=None):
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">',"<style>"+css+"</style>",html)
    seed_json=json.dumps(seed,ensure_ascii=False) if seed is not None else "null"
    html=html.replace("</head>",'<script>window.__RMS_QA_SEED='+seed_json+';</script></head>')

    def repl(m):
        rel=m.group(1)
        js=(ROOT/rel).read_text(encoding="utf-8").replace("</script>","<\\/script>")
        prefix=""
        if rel=="assets/app.js":
            prefix = '''<script>
RMSPilot.safeLoad=()=>({project:window.__RMS_QA_SEED,source:window.__RMS_QA_SEED?"primary":"none",error:""});
RMSPilot.safeSave=(key,project)=>{window.__RMS_QA_SEED=JSON.parse(JSON.stringify(project));window.dispatchEvent(new CustomEvent("rms-save-status",{detail:{ok:true,time:new Date().toISOString(),message:"Saved on this browser"}}));return {ok:true,time:new Date().toISOString()};};
RMSPilot.storageReport=()=>({available:true,error:"",lastSavedAt:""});
RMSPilot.clearProjectStorage=()=>({primary:true,recovery:true,meta:true,onboarding:true});
RMSPilot.onboardingSeen=()=>true;RMSPilot.markOnboardingSeen=()=>true;
</script>'''
        return prefix+"<script>"+js+"</script>"
    return re.sub(r'<script src="\./([^"]+)"></script>',repl,html)

def overflow(page,selector="html"):
    return page.locator(selector).evaluate("(e)=>e.scrollWidth-e.clientWidth")

def new_page(browser,seed=None,width=1440,height=1000):
    page=browser.new_page(viewport={"width":width,"height":height})
    errs=[];console=[]
    page.on("pageerror",lambda e:errs.append(str(e)))
    page.on("console",lambda m:console.append(m.text) if m.type=="error" else None)
    page.set_content(inline_app(seed),wait_until="load")
    page.wait_for_timeout(180)
    return page,errs,console

def main():
    result={"release":"v2.14.2","checks":[],"page_errors":[],"console_errors":[],"screenshots":[],"measurements":{}}
    def ck(name,ok,detail=None):
        result["checks"].append({"name":name,"passed":bool(ok),"detail":detail})
        print(("PASS" if ok else "FAIL"),name)

    with sync_playwright() as pw:
      browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])

      # 1. First-time welcome and Stage 1 orientation.
      page,errs,cons=new_page(browser,None)
      result["page_errors"]+=errs;result["console_errors"]+=cons
      ck("Welcome keeps one primary start action while Research Chat remains available",page.locator("#beginProject:visible").count()==1 and page.locator("#aiHelperLauncher:visible").count()==1,page.locator("button:visible").all_inner_texts())
      ck("Operational/teacher tools are absent from student welcome",page.locator("#teacherBtn:visible,#pilotBtn:visible,#competencyBtn:visible,#aiSettings:visible").count()==0)
      ck("Research Chat remains available before Stage 1 without replacing the start action",page.locator("#aiHelperLauncher:visible").count()==1 and "Research Chat" in page.locator("#aiHelperLauncher").inner_text())
      page.screenshot(path=str(SHOTS/"01-welcome-clean-student-start.png"),full_page=False);result["screenshots"].append("screenshots/01-welcome-clean-student-start.png")

      page.fill("#projectName","My First Research Project");page.fill("#projectContext","Biology research methods");page.click("#beginProject");page.wait_for_timeout(80)
      ck("First-run onboarding is short and student-facing",page.locator("#studentOnboarding").count()==1 and "Your route stays visible" in page.locator("#studentOnboarding").inner_text())
      onboard=page.locator("#studentOnboarding").inner_text().lower()
      ck("Onboarding explains browser-local saving and safe earlier revision","saves on this browser" in onboard and "do not erase later work" in onboard)
      page.click("#finishOnboarding");page.wait_for_timeout(80)

      ck("Full welcome hero disappears after project start",page.locator(".hero:visible").count()==0)
      ck("Student toolbar is reduced to Snapshot/Help/More on desktop",page.locator(".student-top-actions button:visible").all_inner_texts()==["My Research Snapshot","Help","More"],page.locator(".student-top-actions button:visible").all_inner_texts())
      ck("Desktop keeps the complete five-phase route visible",page.locator(".route-phase").count()==5)
      ck("Only the current phase is expanded by default",page.locator(".route-phase-steps:visible").count()==1)
      ck("Current-work panel remains visible beside the task",page.locator(".rightbar:visible").count()==1 and "My project right now" in page.locator(".rightbar").inner_text())
      ck("Stage explicitly shows FROM EARLIER / NOW / NEXT",all(x in page.locator("#stageView").inner_text() for x in ["FROM EARLIER","NOW","NEXT"]))
      learn_height=page.locator("#stageView").bounding_box()["height"]
      result["measurements"]["stage1_learn_height_px"]=round(learn_height)
      ck("Stage 1 Learn fits within roughly one desktop viewport",learn_height<1050,round(learn_height))
      page.screenshot(path=str(SHOTS/"02-stage1-route-orientation-desktop.png"),full_page=False);result["screenshots"].append("screenshots/02-stage1-route-orientation-desktop.png")

      page.locator('[data-go-tab="work"]:visible').first.click();page.wait_for_timeout(70)
      first_y=page.locator("[data-field]:visible").first.bounding_box()["y"]
      result["measurements"]["stage1_first_work_field_y_px"]=round(first_y)
      result["measurements"]["stage1_work_visible_stage_buttons"]=page.locator("#stageView button:visible").count()
      ck("The first Stage 1 work field appears in the first desktop viewport",first_y<1000,round(first_y))
      ck("Only the current Stage subsection fields are shown",page.locator("[data-field]:visible").count()==4,page.locator("[data-field]:visible").evaluate_all("(xs)=>xs.map(x=>x.dataset.field)"))
      ck("The whole Stage outline remains visible while only one subsection is open",page.locator(".stage-section-outline button:visible").count()==2 and "Generate possibilities" in page.locator(".stage-section-outline").inner_text())
      ck("Field scaffolding is compact until requested",page.locator(".guided-field:visible").first.locator("button:visible").all_inner_texts()==["Example","Help"])
      ck("Work footer has one dominant forward action",page.locator(".stage-bottom-nav:visible .primary").count()==1 and "Next part" in page.locator(".stage-bottom-nav:visible .primary").inner_text())
      page.screenshot(path=str(SHOTS/"03-stage1-focused-work-desktop.png"),full_page=False);result["screenshots"].append("screenshots/03-stage1-focused-work-desktop.png")

      page.locator(".guided-field:visible").first.get_by_role("button",name="Example").click();page.wait_for_timeout(60)
      htxt=page.locator("#unifiedHelpBackdrop").inner_text()
      ck("Example opens in one contextual Help surface",all(x in htxt for x in ["Too vague","Good working response","Help me get unstuck","Research Chat"]))
      page.click("#closeUnifiedHelp");page.wait_for_timeout(50)

      # The full route is persistently visible on desktop. Expand a future phase directly.
      page.locator('[data-route-phase="analyze"]').click();page.wait_for_timeout(30)
      ck("Desktop route can reveal future stages without leaving the current task",page.locator('[data-route-stage="14"]:visible').count()==1)
      page.locator('[data-route-stage="14"]').click();page.wait_for_timeout(50)
      ck("Future-stage navigation previews the road ahead instead of opening advanced work","You do not need to complete this yet" in page.locator("#futureStagePreview").inner_text())
      ck("Future-stage preview explains prior/current/next continuity",all(x in page.locator("#futureStagePreview").inner_text() for x in ["FROM EARLIER","IN THIS STAGE","NEXT"]))
      page.screenshot(path=str(SHOTS/"04-future-stage-preview.png"),full_page=False);result["screenshots"].append("screenshots/04-future-stage-preview.png")
      page.click("#returnCurrentStage");page.wait_for_timeout(30)
      page.close()

      # 2. Stage 4 question → path recommendation.
      page,errs,cons=new_page(browser,seed_stage4());result["page_errors"]+=errs;result["console_errors"]+=cons
      ck("Stage 4 opens directly on the current working subsection",page.locator(".current-form-section h4").inner_text()=="Lock the working question")
      ck("Research-path decision appears after the question-building subsection",page.locator(".path-suggestion").count()==1)
      page.fill('[data-field="finalRQ"]',"What is the association between reported weekday sleep duration and biology quiz score among students in one class?")
      if not page.locator(".path-suggestion").evaluate("(e)=>e.open"): page.locator(".path-suggestion summary").click()
      page.locator(".path-suggestion [data-open-pathway]").click();page.wait_for_timeout(50)
      ptxt=page.locator("#pathwayBackdrop").inner_text()
      ck("Path chooser is recommendation-first","recommended from your current question type" in ptxt.lower() and "observational / correlational study" in ptxt.lower() and "use this research path" in ptxt.lower(),ptxt)
      ck("Alternative methodologies are hidden behind comparison disclosure",page.locator("#pathwayBackdrop .path-alternatives").evaluate("(e)=>!e.open"))
      ck("Path chooser explicitly says changing path does not delete earlier work","never deletes your earlier work" in ptxt.lower())
      page.screenshot(path=str(SHOTS/"05-recommendation-first-research-path.png"),full_page=False);result["screenshots"].append("screenshots/05-recommendation-first-research-path.png")
      page.close()

      # 3. Stage 10 methods, carry-forward, synchronization, dependency review.
      page,errs,cons=new_page(browser,seed_stage10());result["page_errors"]+=errs;result["console_errors"]+=cons
      stext=page.locator("#stageView").inner_text()
      ck("Stage 10 keeps earlier question/design decisions visible",all(x in stext.lower() for x in ["research question","design","claim limit"]),page.locator(".stage-context-compact").inner_text())
      ck("Stage 10 shows only the current subsection before revealing variables",page.locator("[data-field]:visible").evaluate_all("(xs)=>xs.map(x=>x.dataset.field)")==["hypothesisNeeded","researchHyp","nullHyp","hypReason"])
      page.locator(".stage-bottom-nav:visible .primary").click();page.wait_for_timeout(60)
      labels=page.locator(".current-form-section label>span").all_inner_texts()
      ck("High-jargon Stage 10 labels lead with plain-language questions",any("What factor are you changing or measuring first?" in x for x in labels) and any("What result will you measure or observe?" in x for x in labels),labels)

      tool=page.locator(".stage-tool-drawer").filter(has_text="Methods Lab")
      tool.locator("summary").click();tool.get_by_role("button",name="Open Methods Lab").click();page.wait_for_timeout(70)
      ck("Methods Lab shows one sequential step with the full route available on demand",page.locator("#methodsBackdrop .lab-stepper").count()==1 and page.locator("#methodsBackdrop .methods-tabs:visible").count()==0)
      page.get_by_role("button",name="← Design").click();page.wait_for_timeout(60)
      page.fill("#mdPrimaryOutcome","Revised biology quiz percent score")
      page.click("#closeMethods");page.wait_for_timeout(40)
      # Re-render current stage through route.
      page.locator(".route-step.current").click();page.wait_for_timeout(50)
      if page.locator('[data-field="outcomeDV"]:visible').count()==0:
          page.locator(".stage-section-outline button").nth(1).click();page.wait_for_timeout(40)
      ck("Methods Lab and Stage share one outcome value",page.locator('[data-field="outcomeDV"]').input_value()=="Revised biology quiz percent score",page.locator('[data-field="outcomeDV"]').input_value())

      # Navigate back to Stage 4 through the left route.
      phase1=page.locator('[data-route-phase="discover"]')
      if phase1.get_attribute("aria-expanded")!="true": phase1.click();page.wait_for_timeout(30)
      page.locator('[data-route-stage="4"]').click();page.wait_for_timeout(50)
      if page.locator('[data-field="finalRQ"]:visible').count()==0 and page.locator('[data-go-tab="work"]:visible').count():
          page.locator('[data-go-tab="work"]:visible').first.click();page.wait_for_timeout(40)
      if page.locator('[data-field="finalRQ"]:visible').count()==0:
          page.locator(".stage-section-outline button:visible").nth(1).click();page.wait_for_timeout(40)
      old=page.locator('[data-field="finalRQ"]').input_value()
      page.fill('[data-field="finalRQ"]',old.replace("among students in one class","among Grade 11 biology students in one class"));page.wait_for_timeout(50)
      # The desktop route remains visible while editing earlier work.
      p3=page.locator('[data-route-phase="design"]')
      if p3.get_attribute("aria-expanded")!="true": p3.click();page.wait_for_timeout(30)
      stage10=page.locator('[data-route-stage="10"]')
      ck("Changing an earlier research question preserves later work but marks Stage 10 for review","Needs review" in stage10.inner_text(),stage10.inner_text())
      page.screenshot(path=str(SHOTS/"06-route-needs-review-after-earlier-change.png"),full_page=False);result["screenshots"].append("screenshots/06-route-needs-review-after-earlier-change.png")
      page.close()

      # 4. Stage 12 structured data plan.
      page,errs,cons=new_page(browser,seed_stage12());result["page_errors"]+=errs;result["console_errors"]+=cons
      ck("Stage 12 data-column plan is presented as one structured source of truth",page.locator(".structured-field").count()==1 and "Build data columns" in page.locator(".structured-field").inner_text())
      ck("Older text-only data plan is preserved during migration","Earlier text plan preserved" in page.locator(".structured-field").inner_text())
      page.locator("[data-open-schema-builder]").click();page.wait_for_timeout(60)
      ck("Structured data plan opens the Methods Lab data-table step","Data table & dictionary" in page.locator("#methodsBackdrop").inner_text())
      page.close()

      # 5. Stage 14 and Data Lab carry-forward.
      page,errs,cons=new_page(browser,seed_stage14());result["page_errors"]+=errs;result["console_errors"]+=cons
      ctx14=page.locator(".stage-context-compact").inner_text().lower()
      ck("Stage 14 keeps the research question, design, unit, and outcome visible",all(x in ctx14 for x in ["research question","design","independent case / unit","outcome"]),ctx14)
      page.locator('details.stage-tool-drawer > summary').filter(has_text="Data & Statistics Lab").click()
      page.get_by_role("button",name="Open Data & Statistics Lab").click();page.wait_for_timeout(70)
      ck("Data Lab is sequential rather than seven equally prominent tabs",page.locator("#dataBackdrop .lab-stepper").count()==1 and page.locator("#dataBackdrop .data-tabs:visible").count()==0)
      page.locator("#dataBackdrop .lab-stepper details summary").click();page.locator('#dataBackdrop [data-dtab="setup"]').click();page.wait_for_timeout(60)
      dtxt=page.locator("#dataBackdrop").inner_text()
      ck("Analysis setup reuses earlier project decisions instead of relying on memory","choose the analysis that matches your existing research plan" in dtxt.lower() and "research question" in dtxt.lower() and "outcome" in dtxt.lower(),dtxt[:1200])
      page.screenshot(path=str(SHOTS/"07-data-lab-carry-forward-context.png"),full_page=False);result["screenshots"].append("screenshots/07-data-lab-carry-forward-context.png")
      page.close()

      # 6. Stage 16 and Writing Lab single source of truth.
      page,errs,cons=new_page(browser,seed_stage16());result["page_errors"]+=errs;result["console_errors"]+=cons
      page.locator('details.stage-tool-drawer > summary').filter(has_text="Writing Lab").click()
      page.get_by_role("button",name="Open Writing Lab").click();page.wait_for_timeout(70)
      ck("Writing Lab is a sequential route rather than eight competing tabs",page.locator("#writingBackdrop .lab-stepper").count()==1 and page.locator("#writingBackdrop .writing-tabs:visible").count()==0)
      disc=page.locator('#writingBackdrop [data-paper-section="discussion"]')
      ck("Writing Lab opens the same Discussion draft saved in the Stage notebook",disc.input_value()=="Initial discussion draft from the Stage notebook.",disc.input_value())
      disc.fill("Revised discussion written in the Writing Lab.");page.click("#closeWriting");page.wait_for_timeout(40)
      page.locator(".route-step.current").click();page.wait_for_timeout(50)
      ck("Writing Lab edits synchronize back to the Stage Discussion field",page.locator('[data-field="discussionDraft"]').input_value()=="Revised discussion written in the Writing Lab.",page.locator('[data-field="discussionDraft"]').input_value())
      page.close()

      # 7. Literature source progressive disclosure.
      p=seed_stage4();p["currentStage"]=6;p["ready"].update({"4":True,"5":True});p["pathway"]={"selected":"observational"};p["flow"]["activeTabByStage"]={"6":"work"}
      page,errs,cons=new_page(browser,p);result["page_errors"]+=errs;result["console_errors"]+=cons
      page.locator('details.stage-tool-drawer > summary').filter(has_text="Literature Workspace").click()
      page.get_by_role("button",name="Open Literature Workspace").click();page.wait_for_timeout(60)
      lit=page.locator(".lit-modal")
      if lit.get_by_role("button",name="Add source").count(): lit.get_by_role("button",name="Add source").click();page.wait_for_timeout(50)
      ck("Source evaluation is split into three progressive passes",page.locator(".source-pass").count()==3)
      ck("Only source-identification pass is open initially",page.locator(".source-pass[open]").count()==1 and "Identify the source" in page.locator(".source-pass[open]").inner_text())
      page.screenshot(path=str(SHOTS/"08-three-pass-source-evaluation.png"),full_page=False);result["screenshots"].append("screenshots/08-three-pass-source-evaluation.png")
      page.close()

      # 8. Student More menu and Research Chat fallback/privacy.
      page,errs,cons=new_page(browser,seed_stage4());result["page_errors"]+=errs;result["console_errors"]+=cons
      page.click("#moreMenuBtn");page.wait_for_timeout(40)
      mtxt=page.locator("#moreBackdrop").inner_text()
      ck("Student More menu contains backup/project actions but hides teacher operations","Download backup" in mtxt and "Teacher/setup tools are hidden in student mode" in mtxt and "Teacher Dashboard" not in mtxt)
      page.click("#closeMore");page.wait_for_timeout(30)
      page.click("#aiHelperLauncher");page.wait_for_timeout(40)
      atxt=page.locator("#aiHelperPanel").inner_text()
      ck("Disconnected Research Chat uses student-friendly fallback language","Research Chat is unavailable right now" in atxt and "server-side" not in atxt.lower())
      ck("Research Chat explains what is sent and when project context is used",all(x in atxt for x in ["Privacy","recent Research Chat messages","Use my current project context","Raw datasets"]))
      ck("Research Chat has no student-facing Research AI label","Research AI" not in atxt and "Ask Research AI" not in atxt)
      page.close()

      # 9. Secure Research Chat configuration surface and session-only class code.
      page,errs,cons=new_page(browser,seed_stage4());result["page_errors"]+=errs;result["console_errors"]+=cons
      page.evaluate("window.RMS_RUNTIME_CONFIG=Object.freeze({...window.RMS_RUNTIME_CONFIG,researchChatEndpoint:'https://rms-research-chat-free.example.workers.dev/'}); window.RMSAIHelperUI.refresh()")
      page.click("#aiHelperLauncher");page.wait_for_timeout(40)
      ctext=page.locator("#aiHelperPanel").inner_text()
      ck("Configured Chat asks for the class code without exposing endpoint editing", "Research Chat needs the class code" in ctext and page.locator("#aiHelperAccessCode").count()==1)
      page.evaluate("document.getElementById('aiSettings').click()");page.wait_for_timeout(40)
      stxt=page.locator(".modal-backdrop .modal").last.inner_text()
      ck("Teacher Chat settings show the owner-controlled endpoint as read-only", "rms-research-chat-free.example.workers.dev/" in stxt and page.locator("#aiEndpoint,#aiChatEndpoint").count()==0,stxt[:900])
      ck("Teacher Chat settings explain session-only class-code handling", "browser session" in stxt.lower() and "not saved in the research-project backup" in stxt.lower())
      test_code="classroom-chat-code-2468"
      page.evaluate("code=>RMSAI.setAccessCode(code)",test_code)
      packet=page.evaluate("RMSPilot.backupEnvelope(window.__RMS_QA_SEED,'full')")
      ck("Class Chat code is absent from full project backup",test_code not in json.dumps(packet))
      page.locator(".modal-backdrop").last.locator("#closeAI").click();page.close()

      # 10. Mobile 360 px.
      page,errs,cons=new_page(browser,seed_stage10(),360,780);result["page_errors"]+=errs;result["console_errors"]+=cons
      ck("Mobile keeps compact Route / Snapshot / Help / More controls",page.locator(".student-top-actions button:visible").all_inner_texts()==["Route","My Research Snapshot","Help","More"],page.locator(".student-top-actions button:visible").all_inner_texts())
      ck("Mobile has no horizontally scrolling global tool strip",overflow(page)<=1,overflow(page))
      ck("Mobile current task still shows Stage number and title immediately","Stage 10 of 18" in page.locator("#stageView").inner_text() and page.locator(".stage-header h2").bounding_box()["y"]<250)
      ck("Mobile retains explicit Route access while desktop sidebar is hidden",page.locator("#routeBtn:visible").count()==1 and page.locator(".sidebar:visible").count()==0)
      ck("Mobile Research Chat launcher keeps the full understandable label","Research Chat" in page.locator("#aiHelperLauncher").inner_text())
      page.click("#routeBtn");page.wait_for_timeout(40)
      ck("Mobile Route still exposes all five research phases",page.locator("#routeBackdrop .route-phase").count()==5)
      page.click("#closeRoute");page.wait_for_timeout(30)
      page.screenshot(path=str(SHOTS/"09-mobile-stage10-route-and-task.png"),full_page=False);result["screenshots"].append("screenshots/09-mobile-stage10-route-and-task.png")
      page.close()

      browser.close()

    result["page_errors"]=list(dict.fromkeys(result["page_errors"]))
    result["console_errors"]=list(dict.fromkeys(result["console_errors"]))
    ck("No unexpected JavaScript page errors occurred",len(result["page_errors"])==0,result["page_errors"])
    result["passed"]=all(x["passed"] for x in result["checks"])
    (OUT/"BROWSER_QA_RESULTS_v2.14.2.json").write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    print("RESULT",sum(x["passed"] for x in result["checks"]),"/",len(result["checks"]))
    if not result["passed"]:sys.exit(2)

if __name__=="__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(3)
