
window.RMSJourneyUI=(()=>{
  const J=window.RMSJourney;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const id=x=>document.getElementById(x);
  const dl=(name,text,type="application/json")=>{const b=new Blob([text],{type}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

  function stateLabel(s){
    return {
      blocked:"Blocked / incomplete",student_ready:"Ready to submit",awaiting_teacher:"Awaiting teacher",
      revision_requested:"Revision requested",approved:"Approved",complete:"Complete"
    }[s]||s;
  }

  function openJourney(p,save,goStage){
    J.normalizeProject(p);
    const ms=J.allMilestones(p),focus=J.currentFocus(p),progress=J.phaseProgress(p);
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="journeyBackdrop";
    wrap.innerHTML=`<div class="modal journey-modal">
      <div class="journey-head"><div><h3>Student Research Journey</h3><p>A single route through the full research process. Milestones are checkpoints, not one-way doors. Research can return to earlier stages when evidence changes the plan.</p></div><button class="ghost small" id="closeJourney">Close</button></div>
      <div class="journey-profile"><label><span>Student alias / project code</span><input id="jAlias" value="${esc(p.journey.studentAlias)}" placeholder="Use a non-sensitive alias if preferred"></label><label><span>Course / section</span><input id="jSection" value="${esc(p.journey.courseSection)}"></label><div><span>Project ID</span><b>${esc(J.projectId(p))}</b></div></div>
      <div class="next-focus"><span>Next best action</span><h4>${esc(focus.title)}</h4><p>${esc(focus.detail)}</p>${focus.stage?`<button class="primary small" id="goFocus">Open Stage ${focus.stage}</button>`:""}</div>
      <div class="journey-progress"><div><b>${progress.stagesReady}/18</b><span>stages ready</span></div><div><b>${progress.approved}/${J.milestoneDefs.length}</b><span>milestones complete/approved</span></div><div><b>${esc(p.data?.designType||"—")}</b><span>working design</span></div></div>
      <div class="milestone-list">${ms.map(m=>milestoneCard(m)).join("")}</div>
      <div class="journey-actions"><button class="primary" id="exportStudentPacket">Export teacher review packet</button><label class="ghost file-button">Import teacher feedback<input id="teacherFeedbackFile" type="file" accept=".json,application/json" hidden></label></div>
      <div class="teacher-feedback-list"><h4>Teacher feedback history</h4>${(p.journey.teacherFeedback||[]).slice().reverse().map(f=>`<div class="feedback-item"><b>${esc(f.milestone||f.stage||"Feedback")}</b><p>${esc(f.comment||f.message||"")}</p><small>${esc(f.teacher||"")} ${f.createdAt?`· ${esc(new Date(f.createdAt).toLocaleString())}`:""}</small></div>`).join("")||'<p class="muted tiny">No imported teacher feedback yet.</p>'}</div>
    </div>`;
    document.body.appendChild(wrap);
    wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};id("closeJourney").onclick=()=>wrap.remove();
    id("jAlias").oninput=()=>{p.journey.studentAlias=id("jAlias").value;save()};
    id("jSection").oninput=()=>{p.journey.courseSection=id("jSection").value;save()};
    if(id("goFocus"))id("goFocus").onclick=()=>{wrap.remove();goStage(focus.stage)};
    document.querySelectorAll("[data-open-stage]").forEach(b=>b.onclick=()=>{wrap.remove();goStage(+b.dataset.openStage)});
    document.querySelectorAll("[data-submit-milestone]").forEach(b=>b.onclick=()=>{J.requestCheckpoint(p,b.dataset.submitMilestone);save();wrap.remove();openJourney(p,save,goStage)});
    id("exportStudentPacket").onclick=()=>dl(`${J.projectId(p)}-student-review.json`,JSON.stringify(J.exportStudentPacket(p),null,2));
    id("teacherFeedbackFile").onchange=async()=>{const f=id("teacherFeedbackFile").files?.[0];if(!f)return;try{const packet=JSON.parse(await f.text());J.applyTeacherFeedback(p,packet);save();wrap.remove();openJourney(p,save,goStage)}catch(err){alert(err.message)}};
  }

  function milestoneCard(m){
    const cp=m.checkpoint,submit=m.def.teacher&&m.blockers.length===0&&!["submitted","approved"].includes(cp.status);
    return `<div class="milestone-card state-${m.state}">
      <div class="milestone-top"><div><span>${esc(m.def.id)} · ${esc(m.def.phase)}</span><h4>${esc(m.def.title)}</h4></div><b>${esc(stateLabel(m.state))}</b></div>
      <p>${esc(m.def.description)}</p>
      <div class="stage-dots">${m.def.stages.map(s=>`<button data-open-stage="${s}" class="${m.readyStages.includes(s)?"done":""}">${m.readyStages.includes(s)?"✓":s}</button>`).join("")}</div>
      ${m.blockers.length?`<div class="journey-blockers"><strong>Resolve</strong>${m.blockers.map(x=>`<div>• ${esc(x)}</div>`).join("")}</div>`:""}
      ${m.warnings.length?`<div class="journey-warnings"><strong>Review</strong>${m.warnings.map(x=>`<div>• ${esc(x)}</div>`).join("")}</div>`:""}
      ${cp.comment?`<div class="checkpoint-comment"><strong>Teacher comment</strong><p>${esc(cp.comment)}</p>${(cp.conditions||[]).map(x=>`<div>□ ${esc(x)}</div>`).join("")}</div>`:""}
      ${submit?`<button class="secondary small" data-submit-milestone="${m.def.id}">Submit checkpoint for teacher review</button>`:""}
    </div>`;
  }

  function openTeacherDashboard(){
    let packets=[];
    const wrap=document.createElement("div");wrap.className="modal-backdrop";wrap.id="teacherBackdrop";
    function render(){
      const s=J.classSummary(packets);
      wrap.innerHTML=`<div class="modal teacher-modal">
        <div class="journey-head"><div><h3>Teacher Dashboard</h3><p>Import student review packets exported from Research Methods Studio. Files are processed locally in this browser and are not uploaded by this static site.</p></div><button class="ghost small" id="closeTeacher">Close</button></div>
        <div class="teacher-import"><label class="primary file-button">Import student review packets<input id="studentPackets" type="file" multiple accept=".json,application/json" hidden></label><button class="ghost small" id="clearPackets">Clear dashboard</button></div>
        <div class="teacher-cards"><div><span>Students/projects</span><b>${s.n}</b></div><div><span>Ethics teacher review</span><b>${s.ethicsReview}</b></div><div><span>Do not facilitate</span><b>${s.ethicsStop}</b></div><div><span>Protocols locked</span><b>${s.protocolLocked}</b></div><div><span>Analysis records</span><b>${s.analysisRun}</b></div></div>
        <div class="checkpoint-overview"><h4>Milestone overview</h4><div class="table-wrap"><table><thead><tr><th>Milestone</th><th>Approved/complete</th><th>Awaiting</th><th>Revision</th><th>Blocked</th></tr></thead><tbody>${J.milestoneDefs.map(d=>{const c=s.checkpointCounts[d.id];return`<tr><td>${esc(d.id)} · ${esc(d.title)}</td><td>${c.approved+c.complete}</td><td>${c.awaiting}</td><td>${c.revision}</td><td>${c.blocked}</td></tr>`}).join("")}</tbody></table></div></div>
        <div class="teacher-projects"><h4>Imported projects</h4>${packets.map((p,i)=>projectCard(p,i)).join("")||'<p class="muted tiny">Import one or more student review packets.</p>'}</div>
      </div>`;
      id("closeTeacher").onclick=()=>wrap.remove();wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
      id("studentPackets").onchange=async()=>{for(const f of [...id("studentPackets").files]){try{const x=JSON.parse(await f.text());J.upsertStudentPacket(packets,x)}catch{}}render()};
      id("clearPackets").onclick=()=>{packets=[];render()};
      document.querySelectorAll("[data-review-project]").forEach(b=>b.onclick=()=>openReview(+b.dataset.reviewProject));
    }
    function projectCard(p,i){
      const pending=(p.milestones||[]).filter(m=>m.state==="awaiting_teacher"||m.state==="revision_requested");
      const blocked=(p.milestones||[]).find(m=>m.blockers?.length);
      return `<div class="teacher-project-card">
        <div class="teacher-project-head"><div><b>${esc(p.student_alias||p.project_id)}</b><span>${esc(p.course_section||"")}</span></div><button class="secondary small" data-review-project="${i}">Review</button></div>
        <p><strong>Question</strong> ${esc(p.research_question||"Not recorded")}</p>
        <div class="project-flags"><span>${esc(p.design||"No design")}</span><span class="${p.methods?.ethicsStatus==="do_not_facilitate"?"danger-flag":p.methods?.ethicsStatus==="teacher_review"?"warn-flag":""}">ethics ${esc(p.methods?.ethicsStatus||"unknown")}</span><span>protocol ${p.methods?.locked?"locked":"not locked"}</span><span>${p.analysis?.stored_runs||0} analysis run(s)</span></div>
        ${pending.length?`<p class="pending-line">Pending review: ${esc(pending.map(x=>x.id).join(", "))}</p>`:""}${blocked?`<p class="blocked-line">First blocker: ${esc(blocked.blockers[0])}</p>`:""}
      </div>`;
    }
    function openReview(i){
      const p=packets[i],ms=p.milestones||[];
      const rw=document.createElement("div");rw.className="modal-backdrop nested";rw.id="reviewBackdrop";
      rw.innerHTML=`<div class="modal review-modal"><div class="journey-head"><div><h3>Review · ${esc(p.student_alias||p.project_id)}</h3><p>${esc(p.research_question||"")}</p></div><button class="ghost small" id="closeReview">Close</button></div>
        <div class="review-summary"><span>Design <b>${esc(p.design||"—")}</b></span><span>Ethics <b>${esc(p.methods?.ethicsStatus||"—")}</b></span><span>Method audit <b>${p.methods?.score??"—"}</b></span><span>Paper audit <b>${p.writing?.paper_audit?.score??"—"}</b></span><span>Independent competencies <b>${p.competency_snapshot?.independentCompetencies??"—"}/${p.competency_snapshot?.totalCompetencies??"—"}</b></span></div>
        <div class="review-checkpoints">${ms.filter(x=>["awaiting_teacher","revision_requested","student_ready","approved"].includes(x.state)).map(x=>`<div class="review-checkpoint"><h4>${esc(x.id)} · ${esc(x.title)}</h4><p>${esc((x.blockers||[]).join(" | ")||"No student-side blocker reported.")}</p><p class="muted tiny">${esc((x.warnings||[]).join(" | "))}</p><div class="form-grid two"><label><span>Decision</span><select data-rdecision="${x.id}"><option value="">No change</option><option value="approved">Approve</option><option value="revise">Request revision</option></select></label><label><span>Teacher name/initials</span><input data-rteacher="${x.id}"></label><label><span>Comment</span><textarea data-rcomment="${x.id}"></textarea></label><label><span>Conditions / required revisions, one per line</span><textarea data-rconditions="${x.id}"></textarea></label></div></div>`).join("")}</div>
        ${window.RMSCompetency?`<details class="competency-review"><summary>Optional competency rubric ratings</summary><p class="muted tiny">Use only when you have reviewed enough student evidence to justify a rating. These provisional 0–3 ratings are separate from the software's heuristic indicators.</p>${window.RMSCompetency.model.competencies.map(c=>`<div class="teacher-comp-row"><span>${esc(c.id)} · ${esc(c.name)}</span><select data-comp-rating="${c.key}"><option value="">No rating</option><option value="0">0 · Emerging</option><option value="1">1 · Supported</option><option value="2">2 · Developing independence</option><option value="3">3 · Independent reasoning</option></select><input data-comp-note="${c.key}" placeholder="Evidence note"></div>`).join("")}</details>`:""}
        <div class="review-general"><label><span>General feedback</span><textarea id="generalFeedback"></textarea></label></div>
        <button class="primary" id="exportTeacherFeedback">Export feedback packet</button></div>`;
      document.body.appendChild(rw);id("closeReview").onclick=()=>rw.remove();rw.onclick=e=>{if(e.target===rw)rw.remove()};
      id("exportTeacherFeedback").onclick=()=>{
        const checkpoints=[];
        ms.forEach(x=>{
          const dec=document.querySelector(`[data-rdecision="${x.id}"]`)?.value;if(!dec)return;
          checkpoints.push({id:x.id,status:dec,reviewedAt:new Date().toISOString(),teacher:document.querySelector(`[data-rteacher="${x.id}"]`)?.value||"",comment:document.querySelector(`[data-rcomment="${x.id}"]`)?.value||"",conditions:(document.querySelector(`[data-rconditions="${x.id}"]`)?.value||"").split("\n").map(v=>v.trim()).filter(Boolean)});
        });
        const gf=id("generalFeedback").value.trim(),feedback=gf?[{milestone:"General",comment:gf,createdAt:new Date().toISOString()}]:[];
        const competency_ratings=[];
        if(window.RMSCompetency){
          document.querySelectorAll("[data-comp-rating]").forEach(el=>{
            if(el.value==="")return;
            const key=el.dataset.compRating;
            competency_ratings.push({competency:key,level:Number(el.value),teacher:"",note:document.querySelector(`[data-comp-note="${key}"]`)?.value||"",time:new Date().toISOString()});
          });
        }
        const out=J.makeTeacherFeedbackPacket(p,{checkpoints,feedback,competency_ratings});
        dl(`${p.project_id}-teacher-feedback.json`,JSON.stringify(out,null,2));
      };
    }
    document.body.appendChild(wrap);render();
  }

  return {openJourney,openTeacherDashboard};
})();
