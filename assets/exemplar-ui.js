
window.RMSExemplarUI=(()=>{
 const X=window.RMSExemplar,Paths=window.RMSPathways;
 const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const id=x=>document.getElementById(x);
 let ctx={p:null,save:null,C:null,currentStage:null};
 const close=()=>id("exemplarBackdrop")?.remove();
 const pathLabel=p=>({descriptive_quantitative:"Descriptive",observational:"Observational",experimental:"Experimental",quasi_experimental:"Quasi-experimental",qualitative:"Qualitative",literature_review:"Literature review",meta_analysis:"Meta-analysis",mixed_methods:"Mixed methods"}[p]||p);
 const statusPill=ex=>`<span class="exemplar-synthetic">${ex.status==="verified_source_mini_review_exemplar"?"Verified-source mini review":"Synthetic teaching exemplar"}</span>`;
 function card(ex,rec){
   const n=X.viewedCount(ctx.p,ex.id);
   return `<button class="exemplar-project-card ${rec?.id===ex.id?"recommended":""}" data-select-exemplar="${ex.id}">
     <div class="exemplar-project-head"><span>${E(pathLabel(ex.path))}</span>${rec?.id===ex.id?'<b>Recommended for your path</b>':""}</div>
     <h4>${E(ex.title)}</h4><p>${E(ex.subtitle||"")}</p><small>${E(ex.rq)}</small><div class="exemplar-card-foot"><span>${n}/18 stages viewed</span><span>${E(ex.status==="verified_source_mini_review_exemplar"?"real mini-corpus":"synthetic project evidence")}</span></div>
   </button>`;
 }
 function overview(){
   const rec=X.recommendedProject(ctx.p),wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="exemplarBackdrop";
   wrap.innerHTML=`<div class="modal exemplar-modal">
     <div class="journey-head"><div><div class="guide-kicker">Optional parallel research projects</div><h3>Multi-Path Exemplar Library</h3><p>Choose an exemplar that matches your research path, or deliberately compare a different path to see which decisions change.</p></div><button class="ghost small" id="closeExemplar">Close</button></div>
     <div class="exemplar-rule"><b>Worked-example rule</b><p>Opening a complete worked stage records Level 4 support for that stage. Save an independent checkpoint first if you want one. Exemplar answers are never copied into your project.</p></div>
     <div class="path-comparison-strip"><div><b>One research process</b><span>Question → evidence → analysis → claim</span></div><div><b>Different design logic</b><span>Variables, units, sampling, analysis, and claim ceilings change by path.</span></div><div><b>No experimental default</b><span>Every supported path now has its own 18-stage example.</span></div></div>
     <div class="exemplar-project-grid">${X.bank.projects.map(ex=>card(ex,rec)).join("")}</div>
     <details class="path-difference-table"><summary>See how the same stage changes across research paths</summary>
       <table><thead><tr><th>Path</th><th>Stage 10 focuses on</th><th>Stage 14 focuses on</th></tr></thead><tbody>
       ${X.bank.projects.map(ex=>`<tr><td>${E(pathLabel(ex.path))}</td><td>${E(ex.stages.find(s=>s.id===10).decision)}</td><td>${E(ex.stages.find(s=>s.id===14).decision)}</td></tr>`).join("")}</tbody></table>
     </details>
   </div>`;
   document.body.appendChild(wrap);id("closeExemplar").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
   document.querySelectorAll("[data-select-exemplar]").forEach(b=>b.onclick=()=>projectOverview(b.dataset.selectExemplar));
 }
 function projectOverview(projectId){
   const ex=X.byId(projectId),rec=X.recommendedProject(ctx.p),mismatch=X.pathDifference(ctx.p?.pathway?.selected,ex.path);close();
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="exemplarBackdrop";
   wrap.innerHTML=`<div class="modal exemplar-modal">
    <div class="journey-head"><div><div class="guide-kicker">${E(pathLabel(ex.path))} worked exemplar</div><h3>${E(ex.title)}</h3><p>${E(ex.subtitle||"")}</p></div><button class="ghost small" id="closeExemplar">Close</button></div>
    <div class="exemplar-disclaimer"><b>Exemplar status</b>${statusPill(ex)}<p>${E(ex.disclaimer)}</p></div>
    ${mismatch?`<div class="exemplar-path-warning"><b>This is not your currently selected path</b><p>${E(mismatch)}</p><button class="ghost small" id="openRecommendedExemplar">Open my recommended ${E(pathLabel(rec.path))} exemplar</button></div>`:""}
    <div class="exemplar-rq"><b>Research question</b><p>${E(ex.rq)}</p></div>
    <div class="exemplar-stage-grid">${ex.stages.map(s=>`<button data-exemplar-stage="${s.id}" data-project-id="${ex.id}" class="${X.wasViewed(ctx.p,ex.id,s.id)?"viewed":""}"><span>${s.id}</span><b>${E(s.title)}</b><small>${X.wasViewed(ctx.p,ex.id,s.id)?"L4 viewed":"worked reasoning"}</small></button>`).join("")}</div>
    <div class="button-row exemplar-bundles"><button class="secondary" data-exemplar-bundle="sources" data-project-id="${ex.id}">Source records</button><button class="secondary" data-exemplar-bundle="data" data-project-id="${ex.id}">Evidence & analysis</button><button class="secondary" data-exemplar-bundle="paper" data-project-id="${ex.id}">Complete paper map</button></div>
    <div class="button-row"><button class="ghost" id="backExemplarLibrary">Back to all paths</button></div>
   </div>`;
   document.body.appendChild(wrap);id("closeExemplar").onclick=close;id("backExemplarLibrary").onclick=()=>{close();overview()};if(id("openRecommendedExemplar"))id("openRecommendedExemplar").onclick=()=>projectOverview(rec.id);wrap.onclick=e=>{if(e.target===wrap)close()};bindCommon();
 }
 function confirmStage(projectId,stageId){
   const ex=X.byId(projectId),w=X.stageWarning(ctx.p,projectId,stageId);
   if(!w.needsConfirm){showStage(projectId,stageId,true);return}
   const layer=document.createElement("div");layer.className="modal-backdrop exemplar-confirm-layer";layer.id="exemplarConfirm";
   layer.innerHTML=`<div class="modal confirm-modal"><div class="guide-kicker">Level 4 worked-example support</div><h3>${E(w.title)}</h3><p>${E(w.body)}</p><div class="exemplar-rule"><b>If you continue</b><p>Stage ${stageId} will record worked-example support from the ${E(pathLabel(ex.path))} exemplar. The example cannot write into your notebook.</p></div><div class="button-row"><button class="ghost" id="cancelExemplarConfirm">Go back</button><button class="primary" id="continueExemplar">Continue</button></div></div>`;
   document.body.appendChild(layer);id("cancelExemplarConfirm").onclick=()=>layer.remove();id("continueExemplar").onclick=()=>{X.recordStageView(ctx.p,projectId,stageId,ctx.C);ctx.save();layer.remove();showStage(projectId,stageId,true)};
 }
 const notebookRows=obj=>Object.entries(obj||{}).map(([k,v])=>`<div class="exemplar-notebook-row"><b>${E(k.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase()))}</b><p>${E(v)}</p></div>`).join("");
 const sourceCards=ex=>(ex.sources||[]).map(s=>`<div class="exemplar-source-card"><div><b>${E(s.id)}</b><span>Verified record</span></div><p>${E(s.citation)}</p><small><strong>Use</strong> ${E(s.use)}</small><small><strong>Boundary</strong> ${E(s.boundary)}</small></div>`).join("");
 function showStage(projectId,stageId,recorded=false){
   const ex=X.byId(projectId),s=X.stage(projectId,stageId);if(!s)return;
   if(!recorded&&!X.wasViewed(ctx.p,projectId,stageId)){confirmStage(projectId,stageId);return}
   if(!X.wasViewed(ctx.p,projectId,stageId)){X.recordStageView(ctx.p,projectId,stageId,ctx.C);ctx.save()}
   close();const mismatch=X.pathDifference(ctx.p?.pathway?.selected,ex.path),reflection=ctx.p?.exemplar?.reflections?.[`${projectId}:${stageId}`]?.text||"";
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="exemplarBackdrop";
   wrap.innerHTML=`<div class="modal exemplar-modal exemplar-stage-modal">
    <div class="journey-head"><div><div class="guide-kicker">${E(pathLabel(ex.path))} exemplar · Stage ${s.id} of 18</div><h3>${E(s.title)}</h3><p>${E(ex.title)}</p></div><button class="ghost small" id="closeExemplar">Close</button></div>
    <div class="exemplar-stage-nav"><button class="ghost small" ${s.id===1?"disabled":""} data-exemplar-direct="${s.id-1}" data-project-id="${ex.id}">← Previous</button><div>${ex.stages.map(x=>`<button data-exemplar-stage="${x.id}" data-project-id="${ex.id}" class="${x.id===s.id?"active":""} ${X.wasViewed(ctx.p,ex.id,x.id)?"viewed":""}">${x.id}</button>`).join("")}</div><button class="ghost small" ${s.id===18?"disabled":""} data-exemplar-direct="${s.id+1}" data-project-id="${ex.id}">Next →</button></div>
    ${mismatch?`<div class="exemplar-path-warning"><b>Cross-path comparison</b><p>${E(mismatch)}</p></div>`:""}
    <div class="exemplar-disclaimer compact">${statusPill(ex)}<p>${E(ex.disclaimer)}</p></div>
    <div class="exemplar-chain">
      <section><div class="exemplar-label">Where the project is now</div><p>${E(s.where)}</p></section>
      <section><div class="exemplar-label">What changed</div><p>${E(s.changed)}</p></section>
      <section class="wide"><div class="exemplar-label">Reasoning sequence</div><ol>${s.reasoning.map(x=>`<li>${E(x)}</li>`).join("")}</ol></section>
      <section class="decision"><div class="exemplar-label">Decision kept</div><p>${E(s.decision)}</p></section>
      <section class="rejected"><div class="exemplar-label">Tempting alternative rejected</div><p>${E(s.rejected)}</p></section>
      <section class="wide"><div class="exemplar-label">Notebook after this stage</div><div class="exemplar-notebook">${notebookRows(s.notebook)}</div></section>
      <section class="wide forward"><div class="exemplar-label">How this constrains what comes next</div><p>${E(s.forward)}</p></section>
    </div>
    ${[3,5,6,7,8].includes(Number(s.id))?`<details class="exemplar-sources"><summary>Verified sources used by this exemplar</summary>${sourceCards(ex)}</details>`:""}
    <div class="exemplar-compare"><h4>Compare with your own project</h4><ul>${s.compare.map(x=>`<li>${E(x)}</li>`).join("")}</ul><label><span>My comparison note</span><textarea id="exemplarReflection">${E(reflection)}</textarea></label><button class="ghost small" id="saveExemplarReflection">Save note</button><span id="exemplarReflectionStatus"></span></div>
    <div class="button-row"><button class="ghost" id="backProjectOverview">Back to this exemplar</button><button class="ghost" id="backExemplarLibrary">All exemplar paths</button></div>
   </div>`;
   document.body.appendChild(wrap);id("closeExemplar").onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};id("saveExemplarReflection").onclick=()=>{X.saveReflection(ctx.p,projectId,s.id,id("exemplarReflection").value);ctx.save();id("exemplarReflectionStatus").textContent="Saved"};id("backProjectOverview").onclick=()=>projectOverview(projectId);id("backExemplarLibrary").onclick=overview;bindCommon();
 }
 function confirmBundle(projectId,bundle){
   const ex=X.byId(projectId),b=X.bundleWarning(ctx.p,projectId,bundle);
   if(!b.needsConfirm){showBundle(projectId,bundle,true);return}
   const layer=document.createElement("div");layer.className="modal-backdrop exemplar-confirm-layer";layer.id="exemplarConfirm";
   layer.innerHTML=`<div class="modal confirm-modal"><div class="guide-kicker">Multi-stage worked support</div><h3>Open ${E(bundle)} resource?</h3><p>This resource exposes worked decisions from multiple stages of “${E(ex.title)}.”</p><div class="exemplar-rule"><b>New L4 stage exposures</b><p>${b.newStages.map(s=>`Stage ${s}`).join(", ")||"None"}</p></div><div class="button-row"><button class="ghost" id="cancelExemplarConfirm">Cancel</button><button class="primary" id="continueExemplarBundle">Continue</button></div></div>`;
   document.body.appendChild(layer);id("cancelExemplarConfirm").onclick=()=>layer.remove();id("continueExemplarBundle").onclick=()=>{X.recordBundleView(ctx.p,projectId,bundle,ctx.C);ctx.save();layer.remove();showBundle(projectId,bundle,true)};
 }
 function showBundle(projectId,bundle,recorded=false){
   if(!recorded){confirmBundle(projectId,bundle);return}
   const ex=X.byId(projectId);close();let body="";
   if(bundle==="sources")body=`<div class="exemplar-disclaimer compact"><b>Verified source records</b><p>Each record includes the role it plays and a boundary on what it can support.</p></div>${sourceCards(ex)}`;
   if(bundle==="data")body=`<div class="exemplar-disclaimer"><b>Evidence / analysis status</b>${statusPill(ex)}<p>${E(ex.disclaimer)}</p></div><div class="exemplar-analysis-result"><h4>Evidence summary</h4><p>${E(ex.data_summary||"See the packaged exemplar files.")}</p></div><div class="exemplar-files"><b>Packaged files</b>${Object.entries(ex.files||{}).map(([k,v])=>`<p><code>${E(k)}</code> · ${E(v)}</p>`).join("")}</div>`;
   if(bundle==="paper")body=`<div class="exemplar-disclaimer"><b>Complete paper map</b>${statusPill(ex)}<p>${E(ex.disclaimer)}</p></div><div class="paper-chain">${["Introduction → literature and bounded rationale","Method → path-specific units, sampling, evidence structure","Results/findings → analysis appropriate to that evidence","Discussion → interpretation within design and coverage limits","Closing sections → same claim ceiling preserved"].map(x=>`<div>${E(x)}</div>`).join("")}</div><div class="exemplar-files"><p>The package contains the paper map under <code>examples/${E(ex.dir||"radish-salinity")}/</code>.</p></div>`;
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="exemplarBackdrop";wrap.innerHTML=`<div class="modal exemplar-modal"><div class="journey-head"><div><div class="guide-kicker">${E(pathLabel(ex.path))} exemplar resource</div><h3>${E(ex.title)}</h3></div><button class="ghost small" id="closeExemplar">Close</button></div>${body}<div class="button-row"><button class="ghost" id="backProjectOverview">Back to exemplar</button><button class="ghost" id="backExemplarLibrary">All paths</button></div></div>`;
   document.body.appendChild(wrap);id("closeExemplar").onclick=close;id("backProjectOverview").onclick=()=>projectOverview(projectId);id("backExemplarLibrary").onclick=overview;wrap.onclick=e=>{if(e.target===wrap)close()};
 }
 function bindCommon(){
   document.querySelectorAll("[data-exemplar-stage]").forEach(b=>b.onclick=()=>showStage(b.dataset.projectId,Number(b.dataset.exemplarStage),false));
   document.querySelectorAll("[data-exemplar-direct]").forEach(b=>b.onclick=()=>{if(!b.disabled)showStage(b.dataset.projectId,Number(b.dataset.exemplarDirect),false)});
   document.querySelectorAll("[data-exemplar-bundle]").forEach(b=>b.onclick=()=>confirmBundle(b.dataset.projectId,b.dataset.exemplarBundle));
 }
 function bind(p,save,C,currentStage){
   ctx={p,save,C,currentStage};X.normalizeProject(p);
   if(document.documentElement.dataset.exemplarBound)return;
   document.documentElement.dataset.exemplarBound="1";
   document.addEventListener("click",e=>{
     if(e.target.closest?.("[data-open-exemplar]")){e.preventDefault();overview();return}
     const s=e.target.closest?.("[data-open-exemplar-stage]");
     if(s){e.preventDefault();const ex=X.recommendedProject(ctx.p);showStage(ex.id,Number(s.dataset.openExemplarStage)||Number(ctx.currentStage?.())||1,false);return}
   });
 }
 return {bind,overview,projectOverview,showStage,confirmStage,confirmBundle,showBundle};
})();
