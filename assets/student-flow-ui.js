
window.RMSStudentFlowUI=(()=>{
  const F=window.RMSStudentFlow,C=window.RMSCurriculum,Paths=window.RMSPathways;
  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);
  let ctx={project:null,save:null,render:null,download:null};

  function phaseIcon(state){return state==="done"?"✓":state==="review"?"!":state==="current"?"→":"○"}
  function routeHTML(p,compact=false){
    F.normalizeProject(p);
    return C.phases.map(ph=>{
      const ps=F.phaseStatus(p,ph),current=ph.steps.includes(Number(p.currentStage));
      const expanded=current||!!p.flow.expandedPhases?.[ph.id];
      return `<section class="route-phase ${current?"current":""}">
        <button type="button" class="route-phase-head" data-route-phase="${ph.id}" aria-expanded="${expanded}">
          <div><b>${E(F.phaseLabel(ph.id))}</b><span>${ps.done}/${ps.total}${ps.review?` · ${ps.review} needs review`:""}</span></div><span>${expanded?"−":"+"}</span>
        </button>
        <div class="route-phase-steps" ${expanded?"":"hidden"}>
          ${ph.steps.map(stageId=>{
            const s=C.stages.find(x=>x.id===stageId),state=F.routeState(p,stageId),progress=F.stageProgress(p,stageId);
            const why=p.flow.reviewReasons?.[stageId]||"";
            return `<button type="button" class="route-step ${state}" data-route-stage="${stageId}" data-route-state="${state}" title="${E(why)}">
              <span class="route-step-icon">${phaseIcon(state)}</span>
              <span class="route-step-main"><b>${stageId}. ${E(Paths.stageTitle(p,stageId,s.nav||s.title))}</b><small>${state==="done"?"Done for now":state==="current"?"Working now":state==="review"?"Needs review after an earlier change":state==="future"?"Coming later":progress.total?`${progress.done}/${progress.total} current fields filled`:"Available"}</small></span>
            </button>`;
          }).join("")}
        </div>
      </section>`;
    }).join("");
  }

  function previewStage(stageId){
    const p=ctx.project,s=C.stages.find(x=>x.id===Number(stageId)),t=F.transitionFor(stageId);
    const sections=(s.sections||[]).map((x,i)=>`<li>${E(x.title)}</li>`).join("")||"<li>Complete the main evidence or tool workflow for this stage.</li>";
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="futureStagePreview";
    wrap.innerHTML=`<div class="modal future-stage-preview"><div class="journey-head"><div><div class="guide-kicker">Coming later · Stage ${stageId} of 18</div><h3>${E(Paths.stageTitle(p,stageId,s.title))}</h3></div><button class="ghost small" id="closeFuturePreview">Close</button></div>
      <div class="future-preview-note"><b>You do not need to complete this yet.</b><p>This preview shows where the research route is heading without opening the full advanced form early.</p></div>
      <div class="flow-transition"><div><span>FROM EARLIER</span><p>${E(t.from)}</p></div><div class="current"><span>IN THIS STAGE</span><p>${E(t.now)}</p></div><div><span>NEXT</span><p>${E(t.next)}</p></div></div>
      <div class="future-preview-outline"><h4>What this stage will involve</h4><ol>${sections}</ol></div>
      <div class="button-row"><button class="primary" id="returnCurrentStage">Return to Stage ${p.currentStage}</button></div>
    </div>`;
    document.body.appendChild(wrap);id("closeFuturePreview").onclick=()=>wrap.remove();id("returnCurrentStage").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
  }

  function openRoute(){
    const p=ctx.project,wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="routeBackdrop";
    wrap.innerHTML=`<div class="modal route-modal"><div class="journey-head"><div><div class="guide-kicker">Your complete research route</div><h3>My Research Route</h3><p>See what you have completed, what you are working on, and what comes later.</p></div><button class="ghost small" id="closeRoute">Close</button></div><div class="route-modal-progress"><b>Stage ${p.currentStage} of 18</b><span>${Object.values(p.ready||{}).filter(Boolean).length} stages done for now</span></div><div id="routeModalList">${routeHTML(p)}</div></div>`;
    document.body.appendChild(wrap);id("closeRoute").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};bindRoute(wrap);
  }

  function bindRoute(scope=document){
    scope.querySelectorAll?.("[data-route-phase]").forEach(b=>b.onclick=()=>{
      const ph=b.dataset.routePhase,p=ctx.project;p.flow.expandedPhases[ph]=!p.flow.expandedPhases[ph];ctx.save?.();
      const target=scope.id==="routeBackdrop"?id("routeModalList"):id("phaseNav");if(target)target.innerHTML=routeHTML(p);bindRoute(scope.id==="routeBackdrop"?scope:document);
    });
    scope.querySelectorAll?.("[data-route-stage]").forEach(b=>b.onclick=()=>{
      const stage=Number(b.dataset.routeStage),state=b.dataset.routeState;
      if(state==="future"){previewStage(stage);return}
      const routeModal=id("routeBackdrop");if(routeModal)routeModal.remove();
      ctx.project.currentStage=stage;F.markVisited(ctx.project,stage);ctx.save?.();ctx.render?.();window.scrollTo({top:0,behavior:"smooth"});
    });
  }

  function openMore(){
    const teacherMode=new URLSearchParams(location.search).get("mode")==="teacher";
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="moreBackdrop";
    wrap.innerHTML=`<div class="modal more-menu-modal"><div class="journey-head"><div><h3>Project options</h3><p>Secondary actions live here so the main workspace stays focused.</p></div><button class="ghost small" id="closeMore">Close</button></div>
      <div class="more-menu-grid">
        <button data-proxy-click="exportMd"><b>Download Word notebook</b><span>Download your current research notebook as a Microsoft Word-compatible .doc file.</span></button>
        <button data-proxy-click="exportJson"><b>Download backup</b><span>Create a full recovery copy before switching devices or making major changes.</span></button>
        <button data-open-research-snapshot><b>Open My Research Snapshot</b><span>See your accumulated work in one organized view.</span></button>
        <button data-proxy-click="resetProject" class="destructive-option"><b>Start a different project</b><span>Your current project will stay only if you download a backup first.</span></button>
      </div>
      ${teacherMode?`<details class="teacher-mode-tools" open><summary>Teacher / setup tools</summary><div class="more-menu-grid">
        <button data-proxy-click="pilotBtn"><b>Pilot & Recovery</b><span>Operational recovery and pilot controls.</span></button>
        <button data-proxy-click="teacherBtn"><b>Teacher Dashboard</b><span>Import review packets and manage feedback.</span></button>
        <button data-proxy-click="competencyBtn"><b>Learning Analytics</b><span>Research/teacher-facing competency evidence.</span></button>
        <button data-proxy-click="transferBtn"><b>Transfer Lab</b><span>Transfer-assessment tools.</span></button>
        <button data-proxy-click="aiSettings"><b>Chat settings</b><span>View the owner-controlled endpoint, manage the session class code, and test the approved secure backend.</span></button>
      </div></details>`:`<div class="teacher-mode-note"><b>Teacher/setup tools are hidden in student mode.</b><span>Open this site with <code>?mode=teacher</code> when teacher operations are needed.</span></div>`}
    </div>`;
    document.body.appendChild(wrap);id("closeMore").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    wrap.querySelectorAll("[data-proxy-click]").forEach(b=>b.onclick=()=>{const target=id(b.dataset.proxyClick);wrap.remove();target?.click()});
  }

  function maybeOnboard(p,save){
    F.normalizeProject(p);if(p.flow.onboarded)return;
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="studentOnboarding";
    wrap.innerHTML=`<div class="modal student-onboarding"><div class="guide-kicker">Before you start</div><h3>Your research work stays organized as you go</h3>
      <div class="onboarding-points">
        <div><b>Your route stays visible.</b><span>You can always see where you are, what is done, and what comes next.</span></div>
        <div><b>Your work saves on this browser.</b><span>You can return to earlier answers. Download a backup before switching devices.</span></div>
        <div><b>Earlier changes do not erase later work.</b><span>If an earlier decision changes, later stages may be marked “Needs review” while your answers remain saved.</span></div>
        <div><b>Help is always available.</b><span>Examples, explanations, progressive help, Research Terms, and Research Chat are available when you need them.</span></div>
      </div>
      <button class="primary" id="finishOnboarding">Start Stage ${p.currentStage||1}</button>
    </div>`;
    document.body.appendChild(wrap);id("finishOnboarding").onclick=()=>{p.flow.onboarded=true;save?.();wrap.remove()};
  }

  function offerUndo(label,fn){
    id("flowUndoToast")?.remove();const t=document.createElement("div");t.id="flowUndoToast";t.className="flow-undo-toast";t.setAttribute("role","status");
    t.innerHTML=`<span>${E(label)}</span><button type="button">Undo</button>`;document.body.appendChild(t);
    const timer=setTimeout(()=>t.remove(),9000);
    t.querySelector("button").onclick=()=>{clearTimeout(timer);try{fn?.()}finally{t.remove()}};
  }

  function labStepper(tabs,active,attr){
    const i=Math.max(0,tabs.findIndex(x=>x[0]===active)),cur=tabs[i],prev=tabs[i-1],next=tabs[i+1];
    return `<div class="lab-stepper">
      <div class="lab-stepper-top"><div><span>Step ${i+1} of ${tabs.length}</span><b>${E(cur?.[1]?.replace(/^\d+\s*·\s*/,"")||"Current step")}</b></div><details><summary>View full lab route</summary><div class="lab-route-list">${tabs.map(([k,l],j)=>`<button data-${attr}="${k}" class="${active===k?"active":j<i?"done":""}"><span>${j<i?"✓":j+1}</span>${E(l.replace(/^\d+\s*·\s*/,""))}</button>`).join("")}</div></details></div>
      <div class="lab-stepper-nav">${prev?`<button class="ghost small" data-${attr}="${prev[0]}">← ${E(prev[1].replace(/^\d+\s*·\s*/,""))}</button>`:"<span></span>"}${next?`<button class="secondary small" data-${attr}="${next[0]}">${E(next[1].replace(/^\d+\s*·\s*/,""))} →</button>`:"<span></span>"}</div>
    </div>`;
  }

  function init(project,save,render){
    ctx={project,save,render};F.normalizeProject(project);
  }

  return {init,routeHTML,bindRoute,openRoute,previewStage,openMore,maybeOnboard,offerUndo,labStepper};
})();
