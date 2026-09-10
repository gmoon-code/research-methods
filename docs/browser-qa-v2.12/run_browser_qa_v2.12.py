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

def main():
    result={"release":"v2.12","checks":[],"page_errors":[],"console_errors":[],"screenshots":[]}
    def ck(name,ok,detail=None):
        result["checks"].append({"name":name,"passed":bool(ok),"detail":detail})
        print(("PASS" if ok else "FAIL"),name)

    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])
        page=browser.new_page(viewport={"width":1280,"height":900})
        page.on("pageerror",lambda e:result["page_errors"].append(str(e)))
        page.on("console",lambda m:result["console_errors"].append(m.text) if m.type=="error" else None)
        page.set_content(inline_app(),wait_until="load")
        page.wait_for_timeout(400)
        if page.locator(".modal-backdrop").count():
            page.keyboard.press("Escape");page.wait_for_timeout(100)

        ck("App renders with no initial JavaScript page error",not result["page_errors"],result["page_errors"])
        ck("Persistent Ask Research AI launcher is visible",page.locator("#aiHelperLauncher").is_visible())
        ck("Launcher is available before any particular stage tool is opened","Ask Research AI" in page.locator("#aiHelperLauncher").inner_text())

        # Mock the secure backend and support logging for deterministic browser QA.
        page.evaluate("""()=>{
          window.__aiPayloads=[];window.__supportCalls=[];
          RMSAI.chatEnabled=()=>true;
          RMSAI.chat=async payload=>{
            window.__aiPayloads.push(payload);
            if(payload.question.includes("Write my research question")){
              return {
                message:"I can help you build it without choosing it for you. Tell me the two variables you want to relate and exactly which students your question is about.",
                response_kind:"guided_reasoning",scaffold_level_used:2,counts_as_stage_support:true,stage_id:4,
                questions_for_student:["What is the measured predictor?","What is the outcome?","Which students are in scope?"],
                direct_completion_guard:{student_attempt_present:false,direct_answer_withheld:true,reason:"Your current research-question field is still unfinished, so a completed question would replace the decision you are meant to make."},
                citations:[],safety:{status:"clear",reason:""},
                prohibited_completion:{did_not_replace_student_work:true,did_not_invent_sources:true,did_not_invent_data:true,did_not_calculate_unvalidated_statistics:true}
              };
            }
            return {
              message:"An experimental unit is the smallest unit that can be independently assigned to a treatment condition. For example, if an entire Petri dish receives one salt concentration, the dish is the experimental unit even when several seeds are measured inside it.",
              response_kind:"concept_explanation",scaffold_level_used:1,counts_as_stage_support:false,stage_id:1,
              questions_for_student:[],
              direct_completion_guard:{student_attempt_present:false,direct_answer_withheld:false,reason:"This was a concept clarification, not a request to complete the student's current field."},
              citations:[],safety:{status:"clear",reason:""},
              prohibited_completion:{did_not_replace_student_work:true,did_not_invent_sources:true,did_not_invent_data:true,did_not_calculate_unvalidated_statistics:true}
            };
          };
          const original=RMSCompetency.recordSupport;
          RMSCompetency.recordSupport=(...args)=>{window.__supportCalls.push(args.slice(1));return original(...args)};
          window.dispatchEvent(new CustomEvent("rms-ai-config-changed"));
        }""")

        page.fill("#projectName","AI Helper QA")
        page.fill("#projectContext","Novice research methods")
        page.click("#beginProject");page.wait_for_timeout(100)

        # General explanation can be answered directly and should not count as stage support.
        page.click("#aiHelperLauncher");page.wait_for_selector("#aiHelperPanel:not([hidden])")
        panel_text=page.locator("#aiHelperPanel").inner_text()
        ck("Chat panel identifies itself as available across the research process","Ask Research AI" in panel_text and "anything in your research process" in panel_text,panel_text[:500])
        ck("Chat panel provides project-context toggle",page.locator("#aiHelperUseContext").count()==1)
        ck("Chat panel displays privacy warning","Do not enter student names" in page.locator("#aiHelperPanel").inner_text())
        page.fill("#aiHelperInput","What is an experimental unit?")
        page.locator("#aiHelperForm").evaluate("f=>f.requestSubmit()")
        page.wait_for_timeout(180)
        conv=page.locator("#aiHelperConversation").inner_text()
        ck("AI helper renders a direct concept clarification","smallest unit that can be independently assigned" in conv,conv)
        ck("General clarification is labelled without a stage-support penalty","Explanation only" not in conv and "Scaffold L1" in conv and "stage support" not in conv,conv)
        support_count=page.evaluate("window.__supportCalls.length")
        ck("General clarification did not create a competency support event",support_count==0,support_count)
        payload=page.evaluate("window.__aiPayloads[0]")
        ck("Helper request sends the current stage and path",payload["project_context"]["stage"]["id"]==1 and bool(payload["project_context"]["research_path"]["name"]),payload["project_context"])
        def has_raw_key(obj):
            if isinstance(obj,dict):
                return any(k in {"rawData","raw_data","raw_dataset","rawDataset"} or has_raw_key(v) for k,v in obj.items())
            if isinstance(obj,list): return any(has_raw_key(v) for v in obj)
            return False
        ck("Helper request does not send raw datasets by default",not has_raw_key(payload.get("project_context",{})),payload.get("project_context",{}))
        page.screenshot(path=str(SHOTS/"01-ai-helper-concept-question.png"),full_page=False);result["screenshots"].append("screenshots/01-ai-helper-concept-question.png")

        # Close, go to Stage 4, focus unfinished field, and ask for a direct answer.
        page.click("#closeAIHelper");page.wait_for_timeout(70)
        page.locator('[data-stage="4"]').click();page.wait_for_timeout(80);page.click('[data-tab="work"]')
        rq=page.locator('[data-field="finalRQ"]')
        rq.focus();page.wait_for_timeout(50)
        page.click("#aiHelperLauncher");page.wait_for_timeout(80)
        ck("Field-aware quick help appears after focusing a notebook field","Help with this field" in page.locator(".ai-helper-quick").inner_text())
        page.fill("#aiHelperInput","Write my research question for me.")
        page.locator("#aiHelperForm").evaluate("f=>f.requestSubmit()")
        page.wait_for_timeout(180)
        conv=page.locator("#aiHelperConversation").inner_text()
        ck("Unfinished decision triggers guided reasoning rather than a completed answer","Tell me the two variables" in conv,conv)
        ck("Authorship guard explains why the direct answer was withheld","Why I did not write the answer for you" in conv and "unfinished" in conv,conv)
        ck("Guided research-decision help is visibly logged as stage support","Scaffold L2 · stage support" in conv,conv)
        support=page.evaluate("window.__supportCalls")
        ck("Guided decision help records the returned scaffold level in competency analytics",len(support)==1 and support[0][0]==4 and support[0][1]==2,support)
        payload2=page.evaluate("window.__aiPayloads[1]")
        ck("Question about 'this field' includes the focused field and empty-attempt status",payload2["project_context"]["current_field"]["key"]=="finalRQ" and payload2["project_context"]["current_field"]["has_attempt"] is False,payload2["project_context"]["current_field"])
        ck("Project-aware chat receives accumulated research context",isinstance(payload2["project_context"].get("accumulated_research_chain"),list))
        ck("Direct-completion guard policy is sent to the backend",payload2["helper_policy"]["direct_completion_guard"] is True)
        page.screenshot(path=str(SHOTS/"02-ai-helper-authorship-guard.png"),full_page=False);result["screenshots"].append("screenshots/02-ai-helper-authorship-guard.png")

        # Context-off mode.
        page.uncheck("#aiHelperUseContext")
        page.fill("#aiHelperInput","What does correlation mean?")
        page.locator("#aiHelperForm").evaluate("f=>f.requestSubmit()")
        page.wait_for_timeout(160)
        payload3=page.evaluate("window.__aiPayloads[2]")
        ck("Student can disable accumulated project context for a question","accumulated_research_chain" not in payload3["project_context"],payload3["project_context"])
        ck("Context-off request still includes stage/path and current field",all(k in payload3["project_context"] for k in ["stage","research_path","current_field"]))

        # Chat history persists while moving between stages.
        page.click("#closeAIHelper");page.wait_for_timeout(60)
        page.locator('[data-stage="10"]').click();page.wait_for_timeout(80)
        page.click("#aiHelperLauncher");page.wait_for_timeout(80)
        ck("Conversation persists across stage navigation","experimental unit" in page.locator("#aiHelperConversation").inner_text().lower())
        ck("Chat header updates to the new current stage","Stage 10" in page.locator(".ai-helper-context-row").inner_text())

        # Mobile.
        page.set_viewport_size({"width":360,"height":780});page.wait_for_timeout(100)
        ck("Chatbot remains available on a 360px mobile viewport",page.locator("#aiHelperPanel").is_visible() and page.locator("#aiHelperLauncher").is_visible())
        overflow=page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        ck("Open mobile chatbot does not create page-level horizontal overflow",overflow<=1,overflow)
        page.screenshot(path=str(SHOTS/"03-ai-helper-mobile-360.png"),full_page=False);result["screenshots"].append("screenshots/03-ai-helper-mobile-360.png")

        # The helper remains usable above major laboratory modals.
        page.click("#closeAIHelper");page.wait_for_timeout(60)
        page.set_viewport_size({"width":1200,"height":850});page.wait_for_timeout(50)
        page.click("#methodsLab");page.wait_for_selector(".modal-backdrop .modal");page.wait_for_timeout(80)
        lab_control=page.locator(".modal-backdrop .modal textarea, .modal-backdrop .modal input, .modal-backdrop .modal select").first
        lab_control.focus();page.wait_for_timeout(40)
        ck("Ask Research AI launcher remains clickable above a major lab modal",page.locator("#aiHelperLauncher").is_visible())
        page.click("#aiHelperLauncher");page.wait_for_timeout(80)
        ck("Chatbot opens while the Methods Lab remains open",page.locator("#aiHelperPanel").is_visible() and page.locator(".modal-backdrop .modal").count()>=1)
        page.keyboard.press("Escape");page.wait_for_timeout(80)
        ck("Escape closes the chatbot without closing the underlying lab",page.locator("#aiHelperPanel").is_hidden() and page.locator(".modal-backdrop .modal").count()>=1)
        page.keyboard.press("Escape");page.wait_for_timeout(80)

        # Offline state is understandable.
        page.click("#aiHelperLauncher");page.wait_for_timeout(60)
        page.evaluate("""()=>{RMSAI.chatEnabled=()=>false;window.dispatchEvent(new CustomEvent("rms-ai-config-changed"))}""")
        page.wait_for_timeout(80)
        txt=page.locator("#aiHelperPanel").inner_text()
        ck("Disconnected chatbot explains that a secure server-side endpoint is required","AI helper not connected" in txt and "secure server-side AI endpoint" in txt,txt)

        result["passed"]=all(x["passed"] for x in result["checks"])
        browser.close()

    (OUT/"BROWSER_QA_RESULTS_v2.12.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print("RESULT",sum(x["passed"] for x in result["checks"]),"/",len(result["checks"]))
    if not result["passed"]:sys.exit(2)

if __name__=="__main__":
    try:main()
    except Exception:
        traceback.print_exc();sys.exit(3)
