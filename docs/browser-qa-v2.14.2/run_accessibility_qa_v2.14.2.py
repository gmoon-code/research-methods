from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re,sys,traceback,os,tempfile

ROOT=Path(__file__).resolve().parents[2]
OUT=Path(tempfile.mkdtemp(prefix="rms-a11y-qa-")) if os.getenv("RMS_QA_READ_ONLY")=="1" else Path(__file__).resolve().parent
SHOTS=OUT/'accessibility-screenshots'
SHOTS.mkdir(parents=True,exist_ok=True)

def project():
    return {
      'name':'Accessibility QA','context':'Research methods','currentStage':1,'ready':{},'data':{},
      'sources':[],'reviews':[],'schema':[],'searchLog':[],'litClaims':[],'litOutline':[],
      'methods':{'design':{},'sampling':{},'ethics':{},'constructs':[],'conditions':[],'controlled':[],'confounders':[],'measurements':[],'procedureSteps':[],'protocolVersions':[]},
      'analysis':{'rawData':[],'headers':[],'runs':[]},'writing':{'sections':{},'discussionMap':[]},
      'transfer':{},'competency':{},'journey':{},'pilot':{},'pathway':{'selected':'unsure'},'rescue':{},'aiHelper':{},
      'flow':{'onboarded':True,'activeTabByStage':{'1':'work'},'sectionByStage':{}},'created':'2026-09-09T00:00:00Z'
    }

def inline():
    html=(ROOT/'index.html').read_text(encoding='utf-8')
    css=(ROOT/'assets/style.css').read_text(encoding='utf-8')
    html=re.sub(r'<link rel="stylesheet" href="\./assets/style\.css">','<style>'+css+'</style>',html)
    html=html.replace('</head>','<script>window.__RMS_QA_SEED='+json.dumps(project())+';</script></head>')
    def repl(m):
        rel=m.group(1); js=(ROOT/rel).read_text(encoding='utf-8').replace('</script>','<\\/script>')
        pre=''
        if rel=='assets/app.js':
            pre="<script>RMSPilot.safeLoad=()=>({project:window.__RMS_QA_SEED,source:'primary',error:''});RMSPilot.safeSave=(k,p)=>({ok:true,time:new Date().toISOString()});RMSPilot.storageReport=()=>({available:true,error:'',lastSavedAt:''});RMSPilot.onboardingSeen=()=>true;RMSPilot.markOnboardingSeen=()=>true;</script>"
        return pre+'<script>'+js+'</script>'
    return re.sub(r'<script src="\./([^"]+)"></script>',repl,html)

def visible_control_audit(page):
    return page.evaluate("""()=>{const vis=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();if(e.hidden||s.display==='none'||s.visibility==='hidden'||r.width<=0||r.height<=0)return false;const closed=e.closest('details:not([open])');if(closed){const summary=closed.querySelector(':scope > summary');if(!summary||!summary.contains(e))return false;}return true};const controls=[...document.querySelectorAll('input,textarea,select')].filter(vis);const missing=controls.filter(e=>{if(e.closest('label'))return false;if(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby'))return false;if(e.id&&document.querySelector(`label[for="${CSS.escape(e.id)}"]`))return false;return true}).map(e=>({tag:e.tagName,id:e.id,name:e.name,placeholder:e.placeholder}));const buttons=[...document.querySelectorAll('button')].filter(vis);const nameless=buttons.filter(b=>!(b.innerText.trim()||b.getAttribute('aria-label')||b.getAttribute('aria-labelledby'))).map(b=>({id:b.id,class:b.className}));return{controls:controls.length,missing,buttons:buttons.length,nameless}}""")

def touch_audit(page):
    return page.evaluate("""()=>{const vis=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();if(e.hidden||s.display==='none'||s.visibility==='hidden'||r.width<=0||r.height<=0)return false;const closed=e.closest('details:not([open])');if(closed){const summary=closed.querySelector(':scope > summary');if(!summary||!summary.contains(e))return false;}return true};return [...document.querySelectorAll('button,a[href],summary,select,input:not([type=hidden])')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return{text:(e.innerText||e.getAttribute('aria-label')||e.id||'').trim().slice(0,60),tag:e.tagName,w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.h<40)}""")

def main():
    checks=[];errors=[]
    def ck(name,ok,detail=''):
        checks.append({'name':name,'passed':bool(ok),'detail':detail});print(('PASS' if ok else 'FAIL'),name)
        if not ok and detail: print(detail)
    with sync_playwright() as pw:
        b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
        p=b.new_page(viewport={'width':1440,'height':950})
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.set_content(inline(),wait_until='load');p.wait_for_timeout(180)
        ck('Skip link is present and keyboard focusable',p.locator('.skip-link').count()==1)
        p.locator('.skip-link').focus();p.keyboard.press('Enter');p.wait_for_timeout(30)
        ck('Skip link moves focus to main content',p.evaluate("document.activeElement===document.querySelector('#mainContent')"))
        audit=visible_control_audit(p)
        ck('Visible current-stage form controls have accessible labels',not audit['missing'],str(audit['missing']))
        ck('Visible buttons have accessible names',not audit['nameless'],str(audit['nameless']))

        p.locator('#helpMenuBtn').focus();p.keyboard.press('Enter');p.wait_for_timeout(60)
        dialog=p.locator('#unifiedHelpBackdrop .modal')
        ck('Help modal has dialog semantics',dialog.get_attribute('role')=='dialog' and dialog.get_attribute('aria-modal')=='true' and bool(dialog.get_attribute('aria-labelledby')))
        ck('Keyboard focus enters the Help modal',p.evaluate("document.querySelector('#unifiedHelpBackdrop .modal').contains(document.activeElement)"),p.evaluate("document.activeElement?.outerHTML"))
        trapped=True
        for _ in range(20):
            p.keyboard.press('Tab')
            if not p.evaluate("document.querySelector('#unifiedHelpBackdrop .modal')?.contains(document.activeElement)"):
                trapped=False;break
        ck('Tab focus remains inside the active Help modal',trapped)
        p.keyboard.press('Escape');p.wait_for_timeout(50)
        ck('Escape closes Help and restores focus to its opener',p.locator('#unifiedHelpBackdrop').count()==0 and p.evaluate("document.activeElement?.id==='helpMenuBtn'"),p.evaluate("document.activeElement?.outerHTML"))

        p.locator('#aiHelperLauncher').focus();p.keyboard.press('Enter');p.wait_for_timeout(40)
        panel=p.locator('#aiHelperPanel')
        ck('Research Chat drawer has a labelled nonmodal dialog role',panel.get_attribute('role')=='dialog' and panel.get_attribute('aria-modal')=='false' and panel.get_attribute('aria-labelledby')=='aiHelperTitle')
        ck('Research Chat exposes its context toggle and privacy text',p.locator('#aiHelperUseContext').count()==1 and 'Raw datasets' in panel.inner_text())
        p.keyboard.press('Escape');p.wait_for_timeout(40)
        ck('Escape closes Research Chat and returns focus to launcher',panel.is_hidden() and p.evaluate("document.activeElement?.id==='aiHelperLauncher'"))

        for width,height in [(430,900),(360,800),(320,800)]:
            p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(80)
            ov=p.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
            ck(f'{width}px has no page-level horizontal overflow',ov<=1,str(ov))
            ck(f'{width}px keeps Route, Help, and Research Chat reachable',p.locator('#routeBtn:visible').count()==1 and p.locator('#helpMenuBtn:visible').count()==1 and p.locator('#aiHelperLauncher:visible').count()==1)
        touch=touch_audit(p)
        ck('Visible narrow-mobile interactive controls meet a 40px minimum height',len(touch)==0,str(touch[:20]))
        p.screenshot(path=str(SHOTS/'mobile-320.png'),full_page=False)

        p.set_viewport_size({'width':1280,'height':900})
        p.evaluate("document.documentElement.style.fontSize='200%'");p.wait_for_timeout(100)
        ov=p.evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth')
        ck('200% root text enlargement has no page-level horizontal overflow',ov<=1,str(ov))
        p.evaluate("document.documentElement.style.fontSize=''")
        css=(ROOT/'assets/style.css').read_text(encoding='utf-8')
        ck('Reduced-motion support is present','prefers-reduced-motion:reduce' in css)
        ck('Forced-colors support is present','forced-colors:active' in css)
        ck('No unexpected JavaScript page errors occurred',len(errors)==0,str(errors))
        b.close()
    report={'release':'v2.14.2','passed':sum(c['passed'] for c in checks),'total':len(checks),'checks':checks,'page_errors':errors}
    (OUT/'ACCESSIBILITY_QA_RESULTS_v2.14.2.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('RESULT',report['passed'],'/',report['total'])
    if report['passed']!=report['total']:sys.exit(2)

if __name__=='__main__':
    try: main()
    except Exception:
        traceback.print_exc();sys.exit(3)
