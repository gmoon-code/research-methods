window.RMSJourneyUI=(()=>{
  const J=window.RMSJourney;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);

  function stateLabel(s){
    return {
      blocked:"Needs attention",
      complete:"Complete",
      student_ready:"Ready",
      awaiting_teacher:"Ready",
      revision_requested:"Needs attention",
      approved:"Complete"
    }[s]||s;
  }

  function openJourney(p,save,goStage){
    J.normalizeProject(p);
    const ms=J.allMilestones(p);
    const focus=J.currentFocus(p);
    const progress=J.phaseProgress(p);
    const included=(p.sources||[]).filter(s=>(s.screeningStatus||"Included")==="Included").length;
    const wrap=document.createElement("div");
    wrap.className="modal-backdrop";
    wrap.id="journeyBackdrop";

    wrap.innerHTML=`<div class="modal journey-modal">
      <div class="journey-head">
        <div>
          <span class="journey-kicker">Project progress</span>
          <h3>My Research Journey</h3>
          <p>Use this overview to see what is complete, what still needs attention, and where to work next. You can return to earlier stages whenever new evidence changes your plan.</p>
        </div>
        <button class="ghost small" id="closeJourney" type="button">Close</button>
      </div>

      <div class="journey-profile">
        <div><span>Project</span><b>${esc(p.name||"Untitled project")}</b></div>
        <div><span>Current stage</span><b>Stage ${Number(p.currentStage)||1} of 18</b></div>
        <div><span>Working design</span><b>${esc(p.data?.designType||"Not selected yet")}</b></div>
      </div>

      <div class="next-focus">
        <span>Next best action</span>
        <h4>${esc(focus.title)}</h4>
        <p>${esc(focus.detail)}</p>
        ${focus.stage?`<button class="primary small" id="goFocus" type="button">Open Stage ${focus.stage}</button>`:""}
      </div>

      <div class="journey-progress">
        <div><b>${progress.stagesReady}/18</b><span>stages ready</span></div>
        <div><b>${progress.approved}/${J.milestoneDefs.length}</b><span>milestones complete</span></div>
        <div><b>${included}</b><span>included sources</span></div>
      </div>

      <div class="milestone-list">${ms.map(m=>milestoneCard(m)).join("")}</div>
    </div>`;

    document.body.appendChild(wrap);
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
    id("closeJourney").onclick=()=>wrap.remove();

    if(id("goFocus")){
      id("goFocus").onclick=()=>{
        wrap.remove();
        goStage(focus.stage);
      };
    }

    document.querySelectorAll("[data-open-stage]").forEach(b=>{
      b.onclick=()=>{
        wrap.remove();
        goStage(+b.dataset.openStage);
      };
    });
  }

  function milestoneCard(m){
    return `<div class="milestone-card state-${m.state}">
      <div class="milestone-top">
        <div>
          <span>${esc(m.def.id)} · ${esc(m.def.phase)}</span>
          <h4>${esc(m.def.title)}</h4>
        </div>
        <b>${esc(stateLabel(m.state))}</b>
      </div>
      <p>${esc(m.def.description)}</p>
      <div class="stage-dots">${m.def.stages.map(s=>`<button type="button" data-open-stage="${s}" class="${m.readyStages.includes(s)?"done":""}">${m.readyStages.includes(s)?"✓":s}</button>`).join("")}</div>
      ${m.blockers.length?`<div class="journey-blockers"><strong>Resolve</strong>${m.blockers.map(x=>`<div>• ${esc(x)}</div>`).join("")}</div>`:""}
      ${m.warnings.length?`<div class="journey-warnings"><strong>Review</strong>${m.warnings.map(x=>`<div>• ${esc(x)}</div>`).join("")}</div>`:""}
    </div>`;
  }

  return {openJourney};
})();
