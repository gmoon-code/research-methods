
window.RMSPathwayUI=(()=>{
  const P=window.RMSPathways,F=window.RMSStudentFlow;
  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);
  function badge(status){return status==="core"?"Core for this path":status==="advanced"?"Advanced / usually later":"Supporting"}
  function pathCard(p,x,rec){
    const selected=p.pathway.selected===x.id;
    return `<button class="path-choice ${selected?"selected":""}" data-path-choice="${x.id}">
      <div class="path-choice-head"><span>${selected?"✓ ":""}${E(x.name)}</span>${rec===x.id?'<b>Recommended from your current question type family</b>':""}</div>
      <p>${E(x.summary)}</p><small><strong>Choose when</strong> ${E(x.choose_when)}</small><small><strong>Example</strong> ${E(x.example)}</small>
    </button>`;
  }
  function open(p,save,onChange){
    P.normalizeProject(p);
    const rec=P.recommendation(p),recommended=P.pathById(rec),current=P.selected(p),hasQuestion=String(p.data?.finalRQ||"").trim().length>5;
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="pathwayBackdrop";
    wrap.innerHTML=`<div class="modal pathway-modal">
      <div class="journey-head"><div><div class="guide-kicker">Research-path decision</div><h3>What kind of research are you doing?</h3><p>Your research path controls which method decisions the site emphasizes. Choosing a path never deletes your earlier work.</p></div><button class="ghost small" id="closePathway">Close</button></div>
      ${!hasQuestion?`<div class="pathway-principle"><strong>Write your working research question first.</strong><p>The recommendation becomes much more useful after the question says what evidence you want to understand.</p></div>`:""}
      <section class="recommended-path-card"><div><span>Recommended from your current question type</span><h4>${E(recommended.name)}</h4><p>${E(recommended.summary)}</p><small><b>Usually fits when</b> ${E(recommended.choose_when)}</small></div><button class="primary" id="useRecommendedPath" ${!hasQuestion?"disabled":""}>Use this research path</button></section>
      <div class="path-decision-help"><b>How to think about the choice</b>
        <div class="path-decision-grid">
          <span><strong>Describe</strong> Measure or document what exists.</span>
          <span><strong>Relationship</strong> Observe whether measured variables vary together.</span>
          <span><strong>Assigned change</strong> Deliberately assign an intervention or condition.</span>
          <span><strong>Experience / meaning</strong> Study explanations, experiences, or processes using qualitative evidence.</span>
          <span><strong>Existing research</strong> Synthesize published studies, with or without quantitative pooling.</span>
          <span><strong>More than one evidence type</strong> Integrate quantitative and qualitative strands.</span>
        </div>
      </div>
      <details class="path-alternatives"><summary>Compare other possible research paths</summary><div class="path-choice-grid">${P.model.paths.filter(x=>x.id!==rec).map(x=>pathCard(p,x,rec)).join("")}</div></details>
      <div class="pathway-footer"><button class="ghost" id="keepUnsure">I am still deciding</button><p><strong>Can I change this later?</strong> Yes. The site preserves your work and marks later stages for review when an earlier path-defining decision changes.</p></div>
    </div>`;
    document.body.appendChild(wrap);
    const choose=choice=>{
      const previous=p.pathway?.selected||"unsure",worked={};
      for(let stage=9;stage<=18;stage++)worked[stage]=!!p.ready?.[stage]||!!F?.stageHasWork?.(p,stage);
      P.select(p,choice,choice===rec?"question-family-confirmed":"student-choice");
      if(previous!==(p.pathway?.selected||"unsure")&&F){
        F.normalizeProject(p);
        for(let stage=9;stage<=18;stage++)if(worked[stage]){
          p.flow.needsReview[stage]=true;
          p.flow.reviewReasons[stage]=`Your research path changed from “${P.pathById(previous).name}” to “${P.selected(p).name}.” Your previous work is still saved. Review whether the terminology, units, method, analysis, and claim boundary still fit the new path.`;
        }
      }
      save();wrap.remove();if(onChange)onChange()
    };
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};id("closePathway").onclick=()=>wrap.remove();
    id("useRecommendedPath").onclick=()=>choose(rec);
    id("keepUnsure").onclick=()=>choose("unsure");
    document.querySelectorAll("[data-path-choice]").forEach(b=>b.onclick=()=>choose(b.dataset.pathChoice));
  }
  function stageBanner(p,stage,sections){
    P.normalizeProject(p);const path=P.selected(p),hidden=P.hiddenCountForStage(p,stage,(sections||[]).flatMap(s=>s.fields||[]).map(f=>f[0]));
    return `<div class="path-stage-banner"><div class="path-stage-top"><div><span>Your current research path</span><b>${E(path.name)}</b></div><button class="ghost small" data-open-pathway>${path.id==="unsure"?"Choose path":"Change path"}</button></div>${hidden&&p.pathway.showExtraByStage?.[stage]?`<button class="path-extra-toggle" data-toggle-path-extra="${stage}">Hide fields usually not needed for this path</button>`:""}</div>`;
  }
  function fieldBadge(mode){
    if(mode==="optional")return '<span class="field-path-badge optional">Optional for this path</span>';
    if(mode==="hide")return '<span class="field-path-badge cross">Usually not needed for this path</span>';
    return "";
  }
  function toolHint(p,tool){
    const rel=P.toolRelevance(p,tool);
    return `<span class="tool-path-badge ${rel}">${E(badge(rel))}</span>`;
  }
  function bind(p,save,rerender){
    if(document.documentElement.dataset.pathwayBound)return;
    document.documentElement.dataset.pathwayBound="1";
    document.addEventListener("click",e=>{
      const o=e.target.closest?.("[data-open-pathway]");if(o){e.preventDefault();open(p,save,rerender);return}
      const t=e.target.closest?.("[data-toggle-path-extra]");if(t){e.preventDefault();P.toggleExtras(p,Number(t.dataset.togglePathExtra));save();if(rerender)rerender();return}
    });
  }
  return {open,stageBanner,fieldBadge,toolHint,bind};
})();
