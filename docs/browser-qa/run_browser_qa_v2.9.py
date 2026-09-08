#!/opt/pyvenv/bin/python
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, re, sys, traceback

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
SHOTS=OUT/"screenshots"
SHOTS.mkdir(parents=True,exist_ok=True)

def inline_app():
    html=(ROOT/"index.html").read_text(encoding="utf-8")
    css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">',"<style>"+css+"</style>",html)
    def repl(m):
        rel=m.group(1)
        js=(ROOT/rel).read_text(encoding="utf-8").replace("</script>","<\\/script>")
        return "<script>"+js+"</script>"
    html=re.sub(r'<script src="\./([^"]+)"></script>',repl,html)
    return html

def layout_metrics(page,label):
    return page.evaluate("""label=>({
      label,
      innerWidth:window.innerWidth,
      rootClientWidth:document.documentElement.clientWidth,
      rootScrollWidth:document.documentElement.scrollWidth,
      bodyScrollWidth:document.body.scrollWidth,
      height:document.documentElement.scrollHeight,
      hOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      topActionsDisplay:getComputedStyle(document.querySelector('.top-actions')).display,
      topActionsScrollWidth:document.querySelector('.top-actions').scrollWidth,
      topActionsClientWidth:document.querySelector('.top-actions').clientWidth
    })""",label)

def visible_control_audit(page):
    return page.evaluate("""()=>{
      const visible=el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return !el.hidden && s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0;
      };
      const controls=[...document.querySelectorAll('input,textarea,select')].filter(visible);
      const missing=controls.filter(el=>{
        if(el.closest('label')) return false;
        if(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
        if(el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
        return true;
      }).map(el=>({tag:el.tagName,id:el.id,name:el.name,placeholder:el.placeholder}));
      const buttons=[...document.querySelectorAll('button')].filter(visible);
      const nameless=buttons.filter(b=>!(b.innerText.trim()||b.getAttribute('aria-label')||b.getAttribute('aria-labelledby')))
        .map(b=>({id:b.id,cls:b.className}));
      return {visibleControls:controls.length,missingLabels:missing,visibleButtons:buttons.length,namelessButtons:nameless};
    }""")

def touch_audit(page):
    return page.evaluate("""()=>{
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
      return [...document.querySelectorAll('button,a[href],summary,select,input:not([type="hidden"])')]
        .filter(visible)
        .map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,text:(el.innerText||el.getAttribute('aria-label')||el.id||'').trim().slice(0,60),w:r.width,h:r.height}})
        .filter(x=>x.h<40 || (x.tag!=='A' && x.h<44));
    }""")

def contrast_audit(page):
    return page.evaluate(r"""()=>{
      const parse=s=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(',').map(x=>parseFloat(x));return [p[0],p[1],p[2],p.length>3?p[3]:1]};
      const lum=rgb=>{const a=rgb.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]};
      const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
      const bgFor=el=>{let n=el;while(n&&n!==document.documentElement){const s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none')return null;const c=parse(s.backgroundColor);if(c&&c[3]>=.95)return c;n=n.parentElement}return parse(getComputedStyle(document.body).backgroundColor)};
      const nodes=[...document.querySelectorAll('p,li,span,small,label,b,strong,button,summary,td,th')].filter(visible).filter(el=>el.childElementCount===0 || ['BUTTON','SUMMARY','TD','TH'].includes(el.tagName));
      const fails=[];
      for(const el of nodes){
        const text=(el.innerText||el.textContent||'').trim();if(!text)continue;
        const s=getComputedStyle(el),fg=parse(s.color),bg=bgFor(el);if(!fg||!bg||fg[3]<.95)continue;
        const fs=parseFloat(s.fontSize),fw=parseInt(s.fontWeight)||400,large=fs>=24||(fs>=18.66&&fw>=700);
        const min=large?3:4.5,r=ratio(fg,bg);
        if(r+0.01<min)fails.push({text:text.slice(0,70),tag:el.tagName,class:el.className,ratio:+r.toFixed(2),required:min,color:s.color,bg:`rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`,fontSize:fs,fontWeight:fw});
      }
      return fails.slice(0,40);
    }""")

def dialog_metrics(page):
    return page.evaluate("""()=>{
      const backs=[...document.querySelectorAll('.modal-backdrop')].filter(x=>getComputedStyle(x).display!=='none');
      const top=backs[backs.length-1],dialog=top?.querySelector('.modal');
      const active=document.activeElement;
      return {
        count:backs.length,
        role:dialog?.getAttribute('role'),
        ariaModal:dialog?.getAttribute('aria-modal'),
        labelledby:dialog?.getAttribute('aria-labelledby'),
        titleText:dialog?.querySelector('h1,h2,h3,h4')?.innerText||'',
        activeTag:active?.tagName,
        activeText:(active?.innerText||active?.getAttribute('aria-label')||active?.id||'').trim().slice(0,80),
        activeInside:!!(dialog&&active&&dialog.contains(active)),
        appInert:!!document.querySelector('.app-shell')?.inert,
        underlyingInert:backs.length>1 ? !!backs[backs.length-2].inert : null
      };
    }""")

def main():
    html=inline_app()
    result={
      "release":"v2.9",
      "engine":"Playwright using system Chromium with page.set_content",
      "note":"The managed system Chromium blocks local/file navigation. The QA therefore loads the exact packaged HTML/CSS/JS into an about:blank page with Playwright set_content. Rendering, CSS, JavaScript, keyboard events, focus, and responsive viewport behavior are exercised; HTTP navigation itself is covered separately by static server smoke tests.",
      "checks":[],
      "console_errors":[],
      "page_errors":[],
      "screenshots":[]
    }
    def check(name,passed,detail=None):
        result["checks"].append({"name":name,"passed":bool(passed),"detail":detail})
        if not passed:
            print("FAIL",name,detail)
        else:
            print("PASS",name)

    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-gpu"])
        page=browser.new_page(viewport={"width":1440,"height":1000})
        page.on("console",lambda m: result["console_errors"].append(m.text) if m.type=="error" else None)
        page.on("pageerror",lambda e: result["page_errors"].append(str(e)))

        page.set_content(html,wait_until="load")
        page.wait_for_timeout(500)
        check("App shell renders",page.locator(".app-shell").count()==1 and page.locator("h1").count()==1,page.title())
        check("No JavaScript page errors on initial render",len(result["page_errors"])==0,list(result["page_errors"]))
        check("Skip link exists",page.locator(".skip-link").count()==1)

        # First-run Pilot & Recovery onboarding may open automatically. Test it as part of the real novice flow.
        if page.locator(".modal-backdrop").count():
            first_modal=dialog_metrics(page)
            check("First-run onboarding modal has dialog semantics and initial focus",first_modal["role"]=="dialog" and first_modal["activeInside"],first_modal)
            page.keyboard.press("Escape")
            page.wait_for_timeout(180)
            check("First-run onboarding can be dismissed with Escape",page.locator(".modal-backdrop").count()==0)

        desktop=layout_metrics(page,"desktop-1440")
        check("Desktop has no page-level horizontal overflow",desktop["hOverflow"]<=1,desktop)
        page.screenshot(path=str(SHOTS/"01-desktop-welcome.png"),full_page=True)
        result["screenshots"].append("screenshots/01-desktop-welcome.png")

        # Keyboard skip link.
        page.locator(".skip-link").focus()
        page.keyboard.press("Enter")
        page.wait_for_timeout(100)
        skip_focus=page.evaluate("document.activeElement===document.querySelector('#mainContent')")
        check("Skip link moves focus to main content",skip_focus)

        # Begin a real stage.
        page.fill("#projectName","Browser QA Project")
        page.fill("#projectContext","Novice usability test")
        page.click("#beginProject")
        page.wait_for_selector("#stageView:not([hidden])")
        page.click('[data-tab="work"]')
        page.wait_for_timeout(150)
        controls=visible_control_audit(page)
        check("Visible Stage 1 form controls have accessible labels",not controls["missingLabels"],controls)
        check("Visible buttons have accessible names",not controls["namelessButtons"],controls)
        contrast=contrast_audit(page)
        check("Sampled solid-background instructional text meets WCAG AA contrast thresholds",not contrast,contrast)

        # Progressive help dialog accessibility.
        first_help=page.locator("[data-progressive-help]").first
        check("Progressive help entry point is visible",first_help.count()==1)
        first_help.focus()
        page.keyboard.press("Enter")
        page.wait_for_selector(".modal-backdrop")
        page.wait_for_timeout(100)
        dm=dialog_metrics(page)
        check("Progressive-help modal has dialog semantics",dm["role"]=="dialog" and dm["ariaModal"]=="true" and bool(dm["labelledby"]),dm)
        check("Focus enters progressive-help dialog",dm["activeInside"],dm)
        # Tab cycle remains in dialog.
        trapped=True
        for _ in range(24):
            page.keyboard.press("Tab")
            if not page.evaluate("document.querySelector('.modal-backdrop:last-of-type .modal')?.contains(document.activeElement)"):
                trapped=False;break
        check("Tab key remains trapped inside active modal",trapped,dialog_metrics(page))
        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        check("Escape closes progressive-help modal",page.locator(".modal-backdrop").count()==0)
        restored=page.evaluate("document.activeElement?.hasAttribute('data-progressive-help')")
        check("Focus returns to progressive-help opener",restored,page.evaluate("document.activeElement?.outerHTML"))

        # Exemplar library and nested confirmation.
        opener=page.locator("[data-open-exemplar]")
        opener.focus();page.keyboard.press("Enter")
        page.wait_for_selector(".exemplar-modal")
        page.wait_for_timeout(100)
        dm=dialog_metrics(page)
        check("Exemplar library receives dialog semantics and focus",dm["activeInside"] and dm["role"]=="dialog",dm)
        page.screenshot(path=str(SHOTS/"02-exemplar-library.png"),full_page=False)
        result["screenshots"].append("screenshots/02-exemplar-library.png")

        rec=page.locator(".exemplar-project-card.recommended").first
        if rec.count()==0: rec=page.locator(".exemplar-project-card").first
        rec.click()
        page.wait_for_timeout(120)
        page.locator("[data-exemplar-stage='1']").first.click()
        page.wait_for_timeout(120)
        nested=dialog_metrics(page)
        check("Nested exemplar confirmation opens above project modal",nested["count"]==2 and nested["underlyingInert"] is True,nested)
        check("Nested confirmation owns keyboard focus",nested["activeInside"],nested)
        page.keyboard.press("Escape")
        page.wait_for_timeout(180)
        after_nested=dialog_metrics(page)
        check("Escape closes only the nested confirmation",after_nested["count"]==1,after_nested)
        check("Focus restores into underlying exemplar modal",after_nested["activeInside"],after_nested)
        page.keyboard.press("Escape")
        page.wait_for_timeout(180)
        check("Second Escape closes exemplar modal",page.locator(".modal-backdrop").count()==0)
        check("Focus returns to Exemplar Project opener",page.evaluate("document.activeElement?.hasAttribute('data-open-exemplar')"))

        # Path-specific browser sweep at the first strongly design-dependent stage.
        path_expect={
          "descriptive_quantitative":"Descriptive",
          "observational":"Observational",
          "experimental":"Experimental",
          "quasi_experimental":"Quasi-experimental",
          "qualitative":"Qualitative",
          "literature_review":"Literature review",
          "meta_analysis":"Meta-analysis",
          "mixed_methods":"Mixed methods"
        }
        page.set_viewport_size({"width":1440,"height":1000})
        for path_id,path_label in path_expect.items():
            page.locator("#pathwayBtn").focus();page.keyboard.press("Enter")
            page.wait_for_selector("#pathwayBackdrop")
            page.locator(f'[data-path-choice="{path_id}"]').click()
            page.wait_for_timeout(120)
            page.locator('[data-stage="10"]').click()
            page.wait_for_timeout(100)
            page.click('[data-tab="work"]')
            page.wait_for_timeout(80)
            audit=visible_control_audit(page)
            check(f"{path_label} Stage 10 controls are labelled",not audit["missingLabels"],audit)
            metric=layout_metrics(page,f"path-{path_id}-stage10")
            check(f"{path_label} Stage 10 has no page-level horizontal overflow",metric["hOverflow"]<=1,metric)
            page.locator('[data-open-exemplar-stage="10"]').focus();page.keyboard.press("Enter")
            page.wait_for_selector("#exemplarConfirm")
            confirm_text=page.locator("#exemplarConfirm").inner_text()
            check(f"{path_label} Worked Stage 10 routes to matching exemplar",path_label.lower() in confirm_text.lower(),confirm_text[:300])
            page.keyboard.press("Escape")
            page.wait_for_timeout(80)

        # Responsive viewports.
        for width,height,name in [(768,1024,"tablet-768"),(430,900,"mobile-430"),(360,800,"mobile-360"),(320,800,"mobile-320")]:
            page.set_viewport_size({"width":width,"height":height})
            page.wait_for_timeout(180)
            metric=layout_metrics(page,name)
            check(f"{name} has no page-level horizontal overflow",metric["hOverflow"]<=1,metric)
            if width<=430:
                check(f"{name} exposes top tools rather than hiding them",metric["topActionsDisplay"]=="flex",metric)
            if width in (430,320):
                page.screenshot(path=str(SHOTS/f"03-{name}.png"),full_page=True)
                result["screenshots"].append(f"screenshots/03-{name}.png")
        touch=touch_audit(page)
        check("Narrow-mobile interactive controls meet 40px minimum and most button controls meet 44px target",len(touch)==0,touch[:20])

        # Work-stage mobile rendering.
        page.screenshot(path=str(SHOTS/"04-mobile-stage-work.png"),full_page=True)
        result["screenshots"].append("screenshots/04-mobile-stage-work.png")

        # Text enlargement simulation.
        page.set_viewport_size({"width":1280,"height":900})
        page.evaluate("document.activeElement?.blur();document.documentElement.classList.add('text-zoom-200')")
        page.wait_for_timeout(250)
        skip_hidden=page.evaluate("document.querySelector('.skip-link').getBoundingClientRect().bottom<=0")
        check("Skip link stays fully off-screen at 200% text unless focused",skip_hidden,page.evaluate("document.querySelector('.skip-link').getBoundingClientRect().toJSON()"))
        zoom=layout_metrics(page,"text-zoom-200")
        check("200% text enlargement has no page-level horizontal overflow",zoom["hOverflow"]<=1,zoom)
        page.screenshot(path=str(SHOTS/"05-text-zoom-200.png"),full_page=True)
        result["screenshots"].append("screenshots/05-text-zoom-200.png")
        page.evaluate("document.documentElement.classList.remove('text-zoom-200')")

        # Reduced motion query is represented in CSS.
        css=(ROOT/"assets/style.css").read_text(encoding="utf-8")
        check("Reduced-motion media query is present","prefers-reduced-motion:reduce" in css)
        check("Forced-colors media query is present","forced-colors:active" in css)

        # Dynamic tables gain keyboard access and labels.
        page.locator("#litLab").focus();page.keyboard.press("Enter")
        page.wait_for_timeout(180)
        table_info=page.evaluate("""()=>{
          const tables=[...document.querySelectorAll('.modal-backdrop:last-of-type table')];
          return tables.map(t=>({tabindex:t.getAttribute('tabindex'),label:t.getAttribute('aria-label'),labelledby:t.getAttribute('aria-labelledby')}));
        }""")
        check("Dynamic laboratory tables are keyboard focusable and labelled",all(x["tabindex"]=="0" and (x["label"] or x["labelledby"]) for x in table_info),table_info)
        page.keyboard.press("Escape")

        browser.close()

    result["passed"]=all(x["passed"] for x in result["checks"])
    (OUT/"BROWSER_QA_RESULTS_v2.9.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(f"RESULT {sum(x['passed'] for x in result['checks'])}/{len(result['checks'])} passed")
    if not result["passed"]:
        sys.exit(2)

if __name__=="__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(3)
