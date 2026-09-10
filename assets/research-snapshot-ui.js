
window.RMSResearchSnapshotUI=(()=>{
 const S=window.RMSResearchSnapshot,Paths=window.RMSPathways;
 const E=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const id=x=>document.getElementById(x);
 let ctx={getProject:null,save:null,go:null};
 let showEmpty=false;

 function project(){return ctx.getProject?ctx.getProject():null}
 function close(){id("researchSnapshotBackdrop")?.remove()}
 function shortened(v,n=170){v=String(v||"").replace(/\s+/g," ").trim();return v.length>n?v.slice(0,n-1)+"…":v}

 function compactHTML(p){
   if(!p)return"";
   const core=S.coreChain(p),rq=core.find(x=>x.label==="Research question"),path=Paths.selected?Paths.selected(p).name:(p.pathway?.selected||"Unsure");
   const keyItems=[
     ["Research question",rq?.value],
     ["Research path",path],
     ["Design",p.data?.designType],
     ["Analysis",p.data?.analysisChoice]
   ].filter(x=>String(x[1]||"").trim());
   return `${keyItems.length?keyItems.map(([l,v])=>`<div class="snap-item"><span>${E(l)}</span><b>${E(shortened(v,120))}</b></div>`).join(""):`<p class="empty-snap">Your major decisions will appear here as the project develops.</p>`}
     <button type="button" class="secondary snapshot-open-button" data-open-research-snapshot>Open full research snapshot</button>`;
 }

 function coreCards(p){
   const rows=S.coreChain(p);
   if(!rows.length)return `<div class="snapshot-empty-state"><b>Your research chain will build here.</b><p>As you complete stages, your question, design, evidence, analysis, and current claim will appear together.</p></div>`;
   return rows.map(x=>`<article class="snapshot-core-card"><div><span>${E(x.label)}</span><button class="ghost small" data-snapshot-go="${x.stage}">Stage ${x.stage}</button></div><p>${E(x.value)}</p></article>`).join("");
 }

 function stageBlock(st){
   const has=st.fields.length>0;
   return `<article class="snapshot-stage ${has?"has-work":"empty-work"}" id="snapshot-stage-${st.id}">
     <header><div><span>Stage ${st.id}</span><h4>${E(st.title)}</h4></div><div class="snapshot-stage-status"><b>${st.status.done}/${st.status.total}</b><small>${st.status.ready?"marked ready":"working"}</small><button class="ghost small" data-snapshot-go="${st.id}">Open stage</button></div></header>
     ${has?`<div class="snapshot-stage-fields">${st.fields.map(f=>`<div class="snapshot-field"><div class="snapshot-field-label">${E(f.label)}</div><div class="snapshot-field-value">${f.value?E(f.value):'<em>Not yet completed</em>'}</div></div>`).join("")}</div>`:`<p class="snapshot-no-work">No current response in this stage${showEmpty?".":" that needs to be shown."}</p>`}
   </article>`;
 }

 function workspaceHTML(p){
   const w=S.workspaceData(p),parts=[];
   if(w.searchLog.length)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Search history</h3><p>The searches you have already documented in the Literature Workspace.</p></div><span>${w.searchLog.length} search${w.searchLog.length===1?"":"es"}</span></div><div class="snapshot-search-list">${w.searchLog.map((x,i)=>`<article><b>Search ${i+1}${x.database?` · ${E(x.database)}`:""}</b><p>${E(x.query||"No query recorded")}</p>${x.date||x.filters||x.results||x.kept?`<small>${E([x.date,x.filters?`Filters: ${x.filters}`:"",x.results?`Results: ${x.results}`:"",x.kept?`Kept: ${x.kept}`:""].filter(Boolean).join(" · "))}</small>`:""}${x.notes?`<p><strong>Notes</strong> ${E(x.notes)}</p>`:""}</article>`).join("")}</div></section>`);
   if(w.sources.length)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Source records</h3><p>Your extracted source evidence without leaving the snapshot.</p></div><span>${w.sources.length} record${w.sources.length===1?"":"s"}</span></div><div class="snapshot-source-list">${w.sources.map(s=>`<article><header><b>${E(s.id||"Source")}</b><span>${E(s.status||"No screening status")}${s.verified?" · bibliography verified":""}</span></header><p class="snapshot-citation">${E(s.citation||"No citation recorded")}</p>${s.design||s.sample?`<p><strong>Design/context</strong> ${E([s.design,s.sample].filter(Boolean).join(" · "))}</p>`:""}${s.finding?`<p><strong>Finding / contribution</strong> ${E(s.finding)}</p>`:""}${s.limits?`<p><strong>Limitations / boundary</strong> ${E(s.limits)}</p>`:""}</article>`).join("")}</div></section>`);
   const mr=w.methodRecords||{},hasMethods=(mr.design?.length||mr.sampling?.length||mr.ethics?.length||mr.constructs?.length||mr.conditions?.length||mr.measurements?.length||mr.procedureSteps?.length||mr.protocolVersions);
   if(hasMethods)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Structured Methods Lab records</h3><p>Additional method decisions saved in the Methods Lab, including records that may be more detailed than the stage notebook.</p></div>${mr.protocolVersions?`<span>${mr.protocolVersions} locked protocol version${mr.protocolVersions===1?"":"s"}</span>`:""}</div>
     ${mr.constructs?.length?`<details class="snapshot-method-detail"><summary>Constructs / variables · ${mr.constructs.length}</summary>${mr.constructs.map(x=>`<div>${Object.entries(x).filter(([,v])=>String(v??"").trim()).map(([k,v])=>`<p><b>${E(k)}</b> ${E(v)}</p>`).join("")}</div>`).join("")}</details>`:""}
     ${mr.conditions?.length?`<details class="snapshot-method-detail"><summary>Conditions / comparison structure · ${mr.conditions.length}</summary>${mr.conditions.map(x=>`<div>${Object.entries(x).filter(([,v])=>String(v??"").trim()).map(([k,v])=>`<p><b>${E(k)}</b> ${E(v)}</p>`).join("")}</div>`).join("")}</details>`:""}
     ${mr.measurements?.length?`<details class="snapshot-method-detail"><summary>Measurements · ${mr.measurements.length}</summary>${mr.measurements.map(x=>`<div>${Object.entries(x).filter(([,v])=>String(v??"").trim()).map(([k,v])=>`<p><b>${E(k)}</b> ${E(v)}</p>`).join("")}</div>`).join("")}</details>`:""}
     ${mr.procedureSteps?.length?`<details class="snapshot-method-detail"><summary>Procedure steps · ${mr.procedureSteps.length}</summary>${mr.procedureSteps.map((x,i)=>`<div><b>Step ${i+1}</b>${Object.entries(x).filter(([,v])=>String(v??"").trim()).map(([k,v])=>`<p><b>${E(k)}</b> ${E(v)}</p>`).join("")}</div>`).join("")}</details>`:""}
     ${mr.design?.length?`<details class="snapshot-method-detail"><summary>Design details</summary>${mr.design.map(x=>`<p><b>${E(x.key)}</b> ${E(x.value)}</p>`).join("")}</details>`:""}
     ${mr.sampling?.length?`<details class="snapshot-method-detail"><summary>Sampling details</summary>${mr.sampling.map(x=>`<p><b>${E(x.key)}</b> ${E(x.value)}</p>`).join("")}</details>`:""}
     ${mr.ethics?.length?`<details class="snapshot-method-detail"><summary>Ethics / safety details</summary>${mr.ethics.map(x=>`<p><b>${E(x.key)}</b> ${E(x.value)}</p>`).join("")}</details>`:""}
   </section>`);
   if(w.schema.length)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Current data schema</h3><p>What one row and each planned column currently mean.</p></div><span>${w.schema.length} column${w.schema.length===1?"":"s"}</span></div><div class="snapshot-schema-list">${w.schema.map(x=>`<div><b>${E(x.name||"Unnamed column")}</b><span>${E([x.type,x.unit].filter(Boolean).join(" · ")||"Type/unit not yet recorded")}</span><p>${E(x.definition||"No definition recorded.")}</p></div>`).join("")}</div></section>`);
   if(w.runs.length)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Stored analysis runs</h3><p>Neutral analysis summaries currently stored in the Data & Statistics Lab.</p></div><span>${w.runs.length} run${w.runs.length===1?"":"s"}</span></div>${w.runs.map(x=>`<article class="snapshot-analysis-run"><b>${E(x.id)}${x.test?` · ${E(x.test)}`:""}</b><p>${E(x.summary||"No neutral summary stored.")}</p></article>`).join("")}</section>`);
   if(w.writing.length)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Writing Lab drafts</h3><p>Current section drafts saved outside the stage notebook.</p></div></div>${w.writing.map(x=>`<details class="snapshot-writing"><summary>${E(x.section)} · ${x.words} words</summary><p>${E(x.text)}</p></details>`).join("")}</section>`);
   if(w.feedback.length)parts.push(`<section class="snapshot-workspace-block"><div class="snapshot-section-head"><div><h3>Teacher feedback</h3><p>Imported feedback currently attached to this project.</p></div></div>${w.feedback.map(x=>`<div class="snapshot-feedback">${E(x.comment)}</div>`).join("")}</section>`);
   if(w.crossPath?.length)parts.push(`<section class="snapshot-workspace-block snapshot-cross-path"><div class="snapshot-section-head"><div><h3>Earlier or cross-path responses</h3><p>These responses are still stored even though they do not belong to your currently selected research path. They are shown here so changing paths never makes earlier work feel lost.</p></div><span>${w.crossPath.length} saved response${w.crossPath.length===1?"":"s"}</span></div>${w.crossPath.map(x=>`<div class="snapshot-field"><div class="snapshot-field-label">Stage ${x.stage} · ${E(x.label)}</div><div class="snapshot-field-value">${E(x.value)}</div></div>`).join("")}</section>`);
   if(w.versionArchive?.length)parts.push(`<section class="snapshot-workspace-block snapshot-version-archive"><div class="snapshot-section-head"><div><h3>Earlier duplicate versions preserved during upgrade</h3><p>An older project contained different versions of the same decision in the Stage notebook and a Lab. v2.13 keeps the Stage/notebook version as the current value and preserves the earlier Lab version here so no previous work disappears silently.</p></div><span>${w.versionArchive.length} preserved</span></div>${w.versionArchive.map(x=>`<details class="snapshot-method-detail"><summary>${E(x.key)} · ${E(x.kind.replaceAll("_"," "))}</summary><p><b>Current Stage/notebook version</b> ${E(x.stageValue||"Blank")}</p><p><b>Earlier Lab version</b> ${E(x.labValue||"Blank")}</p></details>`).join("")}</section>`);
   return parts.length?`<section class="snapshot-group" id="snapshot-workspaces"><div class="snapshot-section-head"><div><h3>6 · Connected workspace records</h3><p>Important work stored in Literature, Methods/Data, Analysis, Writing, or teacher-review tools.</p></div></div>${parts.join("")}</section>`:"";
 }
 function renderBody(p){
   const stats=S.summaryStats(p),groups=S.sectionData(p,showEmpty),path=Paths.selected?Paths.selected(p).name:(p.pathway?.selected||"Unsure");
   return `<div class="snapshot-hero">
      <div><p>This page gathers the work you have already entered across the entire research process. It updates from your notebook, so you do not need to click backward through stages just to remember an earlier decision.</p></div>
      <div class="snapshot-hero-meta"><span>Path</span><b>${E(path)}</b><span>Current stage</span><b>${Number(p.currentStage)||1} of 18</b></div>
    </div>
    <div class="snapshot-metrics">
      <div><b>${stats.filled}</b><span>filled visible notebook fields</span></div>
      <div><b>${stats.ready}/18</b><span>stages marked ready</span></div>
      <div><b>${stats.sources.total}</b><span>source records</span></div>
      <div><b>${stats.sources.included}</b><span>sources marked included</span></div>
    </div>
    <section class="snapshot-core"><div class="snapshot-section-head"><div><h4>At-a-glance research chain</h4><p>These are the decisions students most often need to remember while working later in the project.</p></div></div><div class="snapshot-core-grid">${coreCards(p)}</div></section>
    <nav class="snapshot-jump" aria-label="Snapshot sections">${groups.map(g=>`<a href="#snapshot-${g.id}">${E(g.title.replace(/^\d+\s*·\s*/,""))}</a>`).join("")}<a href="#snapshot-workspaces">Workspace records</a></nav>
    ${groups.map(g=>`<section class="snapshot-group" id="snapshot-${g.id}"><div class="snapshot-section-head"><div><h3>${E(g.title)}</h3><p>${E(g.subtitle)}</p></div></div>${g.stages.map(stageBlock).join("")}</section>`).join("")}
    ${workspaceHTML(p)}
    <section class="snapshot-meaning"><h4>How to use this snapshot</h4><ul><li>Use it while writing later sections so you can keep your research question, design, unit, analysis, and claim boundary consistent.</li><li>If a later decision conflicts with an earlier one, go back to that stage and revise the notebook. The snapshot will update automatically.</li><li>The snapshot summarizes your own recorded work. It does not replace your source files, raw data, statistical output, or full manuscript.</li></ul></section>`;
 }

 function open(){
   const p=project();if(!p)return;
   const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="researchSnapshotBackdrop";
   wrap.innerHTML=`<div class="modal research-snapshot-modal"><div class="snapshot-modal-top"><div><div class="guide-kicker">Live project context</div><h3>My Research Snapshot</h3></div><div class="snapshot-actions"><button class="ghost small" id="snapshotToggleEmpty">${showEmpty?"Hide empty fields":"Show empty fields"}</button><button class="ghost small" id="copyResearchSnapshot">Copy as text</button><button class="ghost small" id="downloadResearchSnapshot">Download .md</button><button class="ghost small" id="closeResearchSnapshot">Close</button></div></div><div id="researchSnapshotBody">${renderBody(p)}</div></div>`;
   document.body.appendChild(wrap);
   id("closeResearchSnapshot").onclick=close;
   wrap.onclick=e=>{if(e.target===wrap)close()};
   id("snapshotToggleEmpty").onclick=()=>{showEmpty=!showEmpty;id("researchSnapshotBody").innerHTML=renderBody(project());id("snapshotToggleEmpty").textContent=showEmpty?"Hide empty fields":"Show empty fields";bindInside()};
   id("copyResearchSnapshot").onclick=async()=>{const text=S.markdown(project(),showEmpty);try{await navigator.clipboard.writeText(text);id("copyResearchSnapshot").textContent="Copied";setTimeout(()=>{if(id("copyResearchSnapshot"))id("copyResearchSnapshot").textContent="Copy as text"},1000)}catch(_){alert("Copy was blocked by the browser. Use Download .md instead.")}};
   id("downloadResearchSnapshot").onclick=()=>window.RMSWordExport.fromMarkdown("current-research-snapshot.doc",S.markdown(project(),showEmpty),"Current Research Snapshot");
   bindInside();
 }
 function bindInside(){
   document.querySelectorAll("#researchSnapshotBackdrop [data-snapshot-go]").forEach(b=>b.onclick=()=>{const stage=Number(b.dataset.snapshotGo);close();ctx.go?.(stage)});
 }
 function bind(getProject,save,goToStage){
   ctx={getProject,save,go:goToStage};
   if(document.documentElement.dataset.snapshotBound)return;
   document.documentElement.dataset.snapshotBound="1";
   document.addEventListener("click",e=>{
     const b=e.target.closest?.("[data-open-research-snapshot]");
     if(b){e.preventDefault();open()}
   });
 }
 return {bind,open,compactHTML};
})();
