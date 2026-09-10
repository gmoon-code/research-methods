
window.RMSCompetencyUI = (() => {
  const C=window.RMSCompetency;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);
  const dl=(n,t,type="text/plain")=>{const b=new Blob([t],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

  function levelBar(v,max=3){
    const pct=v===null||v===undefined?0:Math.max(0,Math.min(100,v/max*100));
    return `<div class="competency-bar"><div style="width:${pct}%"></div></div>`;
  }
  function levelText(v){
    return v===null||v===undefined?"No evidence":`${Number(v).toFixed(2)} / 3 · ${esc(C.levelLabel(v))}`;
  }

  function overview(p){
    const s=C.snapshot(p),pm=C.processMetrics(p);
    return `<div class="competency-section">
      <div class="competency-warning"><strong>Interpret these as learning evidence, not grades.</strong><br>The model is provisional and unvalidated. Independent evidence, supported performance, scaffold exposure, and teacher ratings remain separate.</div>
      <div class="competency-summary">
        <div><span>Independent evidence</span><b>${s.independentCompetencies}/${s.totalCompetencies}</b><small>competencies covered</small></div>
        <div><span>Mean independent</span><b>${s.independentMean??"—"}</b><small>0–3 where evidence exists</small></div>
        <div><span>Mean supported/current</span><b>${s.supportedMean??"—"}</b><small>0–3 where reviewed</small></div>
        <div><span>Highest scaffold</span><b>${s.highestSupport}</b><small>0–5 observed</small></div>
        <div><span>Revision cycles</span><b>${s.revisionCycles}</b><small>review-to-review changes</small></div>
      </div>
      <h4>Competency profile</h4>
      <div class="competency-grid">${s.profiles.map(x=>`<div class="competency-card">
        <div class="comp-head"><span>${esc(x.id)}</span><b>${esc(x.name)}</b></div>
        <p>${esc(x.definition)}</p>
        <div class="comp-metric"><span>Independent</span><b>${levelText(x.independentLevel)}</b>${levelBar(x.independentLevel)}</div>
        <div class="comp-metric"><span>Supported/current</span><b>${levelText(x.supportedLevel)}</b>${levelBar(x.supportedLevel)}</div>
        <div class="comp-meta"><span>Independent coverage ${x.independentCoverage}/${x.opportunities}</span><span>Max scaffold ${x.supportMax}/5</span>${x.teacherRating?`<span>Teacher ${x.teacherRating.level}/3</span>`:""}</div>
      </div>`).join("")}</div>
      <div class="process-box"><h4>Process evidence</h4><div class="process-grid">
        <div><b>${pm.eligibleIndependentCount}</b><span>eligible independent checkpoints</span></div>
        <div><b>${pm.supportedFirstCount}</b><span>checkpoints after prior support</span></div>
        <div><b>${pm.supportEventCount}</b><span>support events</span></div>
        <div><b>${pm.positiveRevisionCycles}/${pm.revisionCycles}</b><span>positive revision cycles</span></div>
        <div><b>${pm.protocolVersions}</b><span>protocol versions</span></div>
        <div><b>${pm.teacherFeedbackItems}</b><span>teacher feedback items</span></div>
      </div></div>
    </div>`;
  }

  function details(p){
    const s=C.snapshot(p);
    return `<div class="competency-section"><h4>Evidence by competency</h4><p>Independent level uses the earliest eligible independent checkpoint for each mapped stage. Supported/current level uses the latest local diagnostic for each mapped stage.</p>
      ${s.profiles.map(x=>`<div class="competency-detail">
        <div class="comp-detail-head"><div><span>${esc(x.id)}</span><h4>${esc(x.name)}</h4></div><div><b>${x.independentLevel??"—"} IR</b><b>${x.supportedLevel??"—"} SP</b><b>${x.supportMax} SL</b></div></div>
        <p>${esc(x.definition)}</p>
        <div class="evidence-columns">
          <div><strong>Independent evidence</strong>${x.evidence.independent.map(e=>`<div class="evidence-row">Stage ${e.stage} · ${e.score}/100 → level ${e.level} · ${esc(new Date(e.time).toLocaleString())}</div>`).join("")||'<div class="evidence-empty">None captured before support.</div>'}</div>
          <div><strong>Latest local review evidence</strong>${x.evidence.reviews.map(e=>`<div class="evidence-row">Stage ${e.stage} · ${e.score}/100 → level ${e.level}</div>`).join("")||'<div class="evidence-empty">No local review evidence.</div>'}</div>
          <div><strong>Support exposure</strong>${x.evidence.support.slice(-6).map(e=>`<div class="evidence-row">L${e.level} · Stage ${e.stage} · ${esc(e.source)}</div>`).join("")||'<div class="evidence-empty">No support events recorded.</div>'}</div>
        </div>
        ${x.teacherRating?`<div class="teacher-rating"><strong>Latest teacher rating ${x.teacherRating.level}/3</strong><p>${esc(x.teacherRating.note||"No note")}</p><small>${esc(x.teacherRating.teacher||"")}</small></div>`:""}
      </div>`).join("")}</div>`;
  }

  function timeline(p){
    C.normalizeProject(p);
    const items=[
      ...p.competency.independentCheckpoints.map(x=>({...x,type:"Independent checkpoint",sort:x.time,levelText:x.level===null?"":`level ${x.level}`,detail:x.independentEligible?"Eligible independent evidence":`Captured after ${x.priorSupportCount} support event(s)`})),
      ...p.competency.reviewEvents.map(x=>({...x,type:x.kind==="local"?"Local review":"Chat review",sort:x.time,levelText:x.level===null?"":`level ${x.level}`,detail:x.score!==null?`${x.score}/100 · ${x.label}`:x.label})),
      ...p.competency.supportEvents.map(x=>({...x,type:"Support",sort:x.time,levelText:`L${x.level}`,detail:`${x.source}${x.detail?` · ${x.detail}`:""}`})),
      ...p.competency.teacherRatings.map(x=>({...x,type:"Teacher rating",sort:x.time,stage:"—",levelText:`${x.level}/3`,detail:`${C.model.competencies.find(c=>c.key===x.competency)?.name||x.competency}${x.note?` · ${x.note}`:""}`}))
    ].sort((a,b)=>new Date(b.sort)-new Date(a.sort));
    return `<div class="competency-section"><h4>Learning-evidence timeline</h4><p>This timeline separates attempts, feedback, scaffold use, and teacher judgment so later analysis can distinguish performance from support.</p>
      <div class="timeline-list">${items.map(x=>`<div class="timeline-item"><div><span>${esc(x.type)}</span><b>${esc(x.levelText||"")}</b></div><p>${esc(x.detail||"")}</p><small>${x.stage!=="—"?`Stage ${esc(x.stage)} · `:""}${esc(new Date(x.sort).toLocaleString())}</small></div>`).join("")||'<p class="muted tiny">No learning-evidence events yet.</p>'}</div></div>`;
  }

  function rubric(){
    return `<div class="competency-section"><h4>Provisional competency rubric</h4><p>This rubric is an instructional framework. It has not been validated for grading, psychometric interpretation, admissions decisions, or research claims about student ability.</p>
      <div class="rubric-table"><table><thead><tr><th>Level</th><th>Label</th><th>Interpretation</th></tr></thead><tbody>${Object.entries(C.model.rubric).map(([k,v])=>`<tr><td>${k}</td><td>${esc(v.label)}</td><td>${esc(v.description)}</td></tr>`).join("")}</tbody></table></div>
      <h4 style="margin-top:16px">Scaffold levels</h4><div class="rubric-table"><table><thead><tr><th>Level</th><th>Observed support</th></tr></thead><tbody>${Object.entries(C.model.scaffold_levels).map(([k,v])=>`<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>
      <div class="competency-warning" style="margin-top:12px"><strong>Important distinction</strong><br>A student can show strong supported performance while still having limited independent evidence. That is useful instructional information and should not be collapsed into one score.</div>
    </div>`;
  }

  function open(p,save,active="overview"){
    C.normalizeProject(p);
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="competencyBackdrop";
    const tabs=[["overview","Overview"],["details","Competencies"],["timeline","Evidence timeline"],["rubric","Rubric & interpretation"]];
    const content=active==="overview"?overview(p):active==="details"?details(p):active==="timeline"?timeline(p):rubric();
    wrap.innerHTML=`<div class="modal competency-modal"><div class="journey-head"><div><h3>Research Competency & Learning Analytics</h3><p>Track independent evidence, supported performance, scaffold use, revisions, and teacher-coded evidence without treating them as the same construct.</p></div><button class="ghost small" id="closeCompetency">Close</button></div>
      <div class="competency-tabs">${tabs.map(([k,l])=>`<button data-ctab="${k}" class="${active===k?"active":""}">${l}</button>`).join("")}</div>
      ${content}
      <div class="button-row"><button class="primary" id="exportCompetencyMD">Export learning-evidence report</button><button class="ghost" id="exportCompetencyJSON">Export analytics JSON</button></div>
    </div>`;
    document.body.appendChild(wrap);
    const rr=t=>{wrap.remove();open(p,save,t||active)};
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};id("closeCompetency").onclick=()=>wrap.remove();
    document.querySelectorAll("[data-ctab]").forEach(b=>b.onclick=()=>rr(b.dataset.ctab));
    id("exportCompetencyMD").onclick=()=>window.RMSWordExport.fromMarkdown("research-competency-learning-evidence.doc",C.reportMarkdown(p),"Research Competency Learning Evidence");
    id("exportCompetencyJSON").onclick=()=>dl("research-competency-learning-evidence.json",JSON.stringify({snapshot:C.snapshot(p),events:p.competency},null,2),"application/json");
  }

  return {open};
})();
