
window.RMSPathwayUI=(()=>{
  const P=window.RMSPathways;
  const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);
  function badge(status){return status==="core"?"Core for this path":status==="advanced"?"Advanced / usually later":"Supporting"}
  function pathCard(p,x,rec){
    const selected=p.pathway.selected===x.id;
    return `<button class="path-choice ${selected?"selected":""}" data-path-choice="${x.id}">
      <div class="path-choice-head"><span>${selected?"✓ ":""}${E(x.name)}</span>${rec===x.id?'<b>Recommended from your current question family</b>':""}</div>
      <p>${E(x.summary)}</p><small><strong>Choose when</strong> ${E(x.choose_when)}</small><small><strong>Example</strong> ${E(x.example)}</small>
    </button>`;
  }
  function open(p,save,onChange){
    P.normalizeProject(p);
    const rec=P.recommendation(p),current=P.selected(p),wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="pathwayBackdrop";
    wrap.innerHTML=`<div class="modal pathway-modal">
      <div class="journey-head"><div><h3>Choose your research path</h3><p>The path changes which decisions are shown first. It never deletes your work, and you can change paths later if the question changes.</p></div><button class="ghost small" id="closePathway">Close</button></div>
      <div class="path-status"><div><span>Current path</span><b>${E(current.name)}</b></div><div><span>Question family</span><b>${E(p.data?.questionType||"Not chosen yet")}</b></div><div><span>Suggested route</span><b>${E(P.pathById(rec).name)}</b></div></div>
      <div class="pathway-principle"><strong>Why this matters</strong><p>A qualitative project should not be forced through independent-variable and p-value decisions. A literature review should not be forced through participant sampling or experimental-unit language. Your path keeps relevant decisions in front of you and moves cross-design fields behind an optional reveal.</p></div>
      <div class="path-choice-grid">${P.model.paths.map(x=>pathCard(p,x,rec)).join("")}</div>
      <div class="pathway-footer"><p><strong>Unsure?</strong> Keep “I am still deciding.” The full decision set remains visible until the design becomes clearer.</p></div>
    </div>`;
    document.body.appendChild(wrap);
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};id("closePathway").onclick=()=>wrap.remove();
    document.querySelectorAll("[data-path-choice]").forEach(b=>b.onclick=()=>{
      P.select(p,b.dataset.pathChoice,b.dataset.pathChoice===rec?"question-family-confirmed":"student-choice");
      save();wrap.remove();if(onChange)onChange();
    });
  }
  function stageBanner(p,stage,sections){
    P.normalizeProject(p);const path=P.selected(p),focus=P.focus(p,stage),all=(sections||[]).flatMap(s=>s.fields||[]).map(f=>f[0]),hidden=P.hiddenCountForStage(p,stage,all),comp=P.completion(p,stage,sections);
    return `<div class="path-stage-banner">
      <div class="path-stage-top"><div><span>Your research path</span><b>${E(path.name)}</b></div><button class="ghost small" data-open-pathway>Change path</button></div>
      ${focus?`<p>${E(focus)}</p>`:""}
      <div class="path-progress-line"><span>${comp.total?`${comp.done}/${comp.total} core pathway fields currently completed`:"No required pathway fields in this stage"}</span>${hidden?`<span>${hidden} cross-design field(s) hidden</span>`:""}</div>
      ${hidden?`<button class="path-extra-toggle" data-toggle-path-extra="${stage}">${p.pathway.showExtraByStage?.[stage]?"Hide fields usually not needed":"Show fields usually not needed for this path"}</button>`:""}
    </div>`;
  }
  function fieldBadge(mode){
    if(mode==="optional")return '<span class="field-path-badge optional">Conditional</span>';
    if(mode==="hide")return '<span class="field-path-badge cross">Cross-design</span>';
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
