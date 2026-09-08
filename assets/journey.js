
window.RMSJourney = (() => {
  const present=v=>String(v??"").trim().length>0;

  function normalizeProject(p){
    p.journey=p.journey||{};
    const j=p.journey;
    j.studentAlias=j.studentAlias||"";
    j.courseSection=j.courseSection||"";
    j.checkpoints=j.checkpoints||{};
    j.teacherFeedback=j.teacherFeedback||[];
    j.revisionLog=j.revisionLog||[];
    j.packetVersion="1.7";
    return p;
  }

  const milestoneDefs=[
    {id:"M1",title:"Question Ready",phase:"Discover",stages:[1,2,3,4],teacher:true,
     description:"Interest, feasible topic, preliminary background scan, and a research question that is answerable with evidence."},
    {id:"M2",title:"Evidence Base Ready",phase:"Literature",stages:[5,6,7,8],teacher:false,
     description:"Search strategy, screened/evaluated sources, cross-study synthesis, and a defensible study rationale."},
    {id:"M3",title:"Method Approved",phase:"Design",stages:[9,10,11,12],teacher:true,
     description:"Question-design alignment, variables/constructs, units, sampling, measurement, ethics, procedure, data dictionary, and a locked protocol."},
    {id:"M4",title:"Analysis Ready",phase:"Evidence",stages:[13,14,15],teacher:true,
     description:"Raw-data integrity, descriptive exploration, justified analysis, assumption checks, and a stored primary Results record."},
    {id:"M5",title:"Paper Ready for Final Review",phase:"Writing",stages:[16,17,18],teacher:true,
     description:"Discussion, closing sections, citation audit, and whole-paper alignment review."}
  ];

  function checkpoint(p,id){
    normalizeProject(p);
    p.journey.checkpoints[id]=p.journey.checkpoints[id]||{
      status:"not_requested",requestedAt:"",reviewedAt:"",teacher:"",comment:"",conditions:[]
    };
    return p.journey.checkpoints[id];
  }

  function methodStatus(p){
    let out={available:false,score:null,label:"Not assessed",critical:null,warning:null,ethicsStatus:"unknown",locked:false};
    try{
      if(window.RMSMethods){
        const r=window.RMSPathCoach?window.RMSPathCoach.methodsReadiness(p):window.RMSMethods.readiness(p);
        const versions=p.methods?.protocolVersions||[], latest=versions[versions.length-1];
        const currentPath=p.pathway?.selected||"unsure";
        const locked=!!latest && !p.pathway?.protocolReviewRequired && (!latest.researchPath || latest.researchPath===currentPath);
        out={available:true,score:r.score,label:r.label,critical:r.critical,warning:r.warning,ethicsStatus:r.ethicsStatus,locked};
      }
    }catch{}
    return out;
  }

  function paperStatus(p){
    let out={available:false,score:null,label:"Not assessed",issues:0};
    try{
      if(window.RMSWriting){
        const r=window.RMSWriting.paperAudit(p);
        out={available:true,score:r.score,label:r.label,issues:(r.issues||[]).length};
      }
    }catch{}
    return out;
  }

  function stageDiagnostic(p,id){
    try{return window.RMSCoach?.reviewStage(id,p)||null}catch{return null}
  }

  function milestoneStatus(p,def){
    normalizeProject(p);
    const readyStages=def.stages.filter(s=>!!p.ready?.[s]);
    const cp=checkpoint(p,def.id);
    let blockers=[],warnings=[];

    def.stages.forEach(s=>{
      if(!p.ready?.[s]) blockers.push(`Stage ${s} is not marked ready.`);
    });

    if(def.id==="M1"){
      if(!present(p.data?.finalRQ)) blockers.push("Final research question is missing.");
      if(!present(p.data?.questionType)) warnings.push("Question family is not recorded.");
      const d=stageDiagnostic(p,4);
      if(d && d.score<70) warnings.push(`Research-question local diagnostic is ${d.score}/100.`);
    }

    if(def.id==="M2"){
      const included=(p.sources||[]).filter(s=>(s.screeningStatus||"Included")==="Included");
      if(included.length<3) blockers.push("Fewer than 3 sources are currently marked Included.");
      const themes=window.RMSLiterature?.uniqueThemes ? window.RMSLiterature.uniqueThemes(p) : [];
      if(themes.length<1) warnings.push("No cross-study theme evidence is recorded.");
      if(!present(p.data?.gapStatement)) warnings.push("Study rationale/gap statement is not recorded.");
    }

    if(def.id==="M3"){
      const m=methodStatus(p);
      if(m.available){
        if(m.critical>0) blockers.push(`${m.critical} critical Methods Lab issue(s) remain.`);
        if(m.ethicsStatus==="do_not_facilitate") blockers.push("Methods Lab ethics/safety status is DO NOT FACILITATE.");
        if(m.ethicsStatus==="teacher_review") warnings.push("Teacher/institutional review is required for the proposed method.");
        if(!m.locked) blockers.push("No protocol version is locked.");
      }else warnings.push("Methods Lab audit is unavailable.");
    }

    if(def.id==="M4"){
      if(!(p.analysis?.rawData||[]).length) blockers.push("No dataset is currently imported.");
      if(!(p.analysis?.runs||[]).length) blockers.push("No stored analysis record exists.");
      if(!present(p.data?.primaryEstimand)) warnings.push("Primary estimand is not recorded.");
      if(!present(p.data?.result1)) warnings.push("Primary Results record is not linked into the project.");
    }

    if(def.id==="M5"){
      const w=p.writing?.sections||{};
      ["discussion","conclusion","abstract"].forEach(s=>{if(!present(w[s])) blockers.push(`${s[0].toUpperCase()+s.slice(1)} draft is missing.`)});
      const ps=paperStatus(p);
      if(ps.available && ps.score<70) warnings.push(`Whole-paper local alignment audit is ${ps.score}/100.`);
    }

    let state="blocked";
    if(blockers.length===0) state="student_ready";
    if(def.teacher && cp.status==="submitted") state="awaiting_teacher";
    if(def.teacher && cp.status==="revise") state="revision_requested";
    if(def.teacher && cp.status==="approved" && blockers.length===0) state="approved";
    if(!def.teacher && blockers.length===0) state="complete";

    return {def,readyStages,totalStages:def.stages.length,blockers,warnings,checkpoint:cp,state};
  }

  function allMilestones(p){return milestoneDefs.map(d=>milestoneStatus(p,d))}

  function phaseProgress(p){
    const milestones=allMilestones(p);
    return {
      stagesReady:Object.values(p.ready||{}).filter(Boolean).length,
      stagesTotal:18,
      milestones,
      approved:milestones.filter(m=>["approved","complete"].includes(m.state)).length
    };
  }

  function currentFocus(p){
    const ms=allMilestones(p);
    for(const m of ms){
      if(m.state==="revision_requested") return {kind:"teacher_revision",milestone:m.def.id,title:`Revise ${m.def.title}`,detail:m.checkpoint.comment||"Teacher requested revision."};
      if(m.state==="awaiting_teacher") return {kind:"waiting",milestone:m.def.id,title:`Awaiting review · ${m.def.title}`,detail:"Continue only with work that does not depend on this approval."};
      if(m.blockers.length){
        const firstStage=m.def.stages.find(s=>!p.ready?.[s]);
        return {kind:"work",milestone:m.def.id,stage:firstStage||m.def.stages[0],title:firstStage?`Complete Stage ${firstStage}`:`Resolve ${m.def.title}`,detail:m.blockers[0]};
      }
      if(m.def.teacher && m.checkpoint.status!=="approved"){
        return {kind:"submit",milestone:m.def.id,title:`Submit ${m.def.title}`,detail:"Student requirements are complete. Send this checkpoint for teacher review."};
      }
    }
    return {kind:"complete",title:"Project pathway complete",detail:"Run the final paper audit, verify references against original sources, and follow course submission requirements."};
  }

  function requestCheckpoint(p,id){
    const cp=checkpoint(p,id);
    cp.status="submitted";
    cp.requestedAt=new Date().toISOString();
    cp.reviewedAt="";
    return cp;
  }

  function applyTeacherFeedback(p,packet){
    normalizeProject(p);
    if(!packet || packet.packet_type!=="rms_teacher_feedback" || packet.version!=="1.7")
      throw new Error("This is not a Research Methods Studio v1.7 teacher feedback packet.");
    if(packet.project_id && packet.project_id!==projectId(p))
      throw new Error("This feedback packet belongs to a different project.");
    (packet.checkpoints||[]).forEach(x=>{
      const cp=checkpoint(p,x.id);
      cp.status=x.status||cp.status;
      cp.reviewedAt=x.reviewedAt||new Date().toISOString();
      cp.teacher=x.teacher||"";
      cp.comment=x.comment||"";
      cp.conditions=Array.isArray(x.conditions)?x.conditions:[];
    });
    (packet.feedback||[]).forEach(f=>p.journey.teacherFeedback.push({...f,importedAt:new Date().toISOString()}));
    if(window.RMSCompetency) window.RMSCompetency.importTeacherRatings(p,packet.competency_ratings||[]);
    p.journey.revisionLog.push({time:new Date().toISOString(),type:"teacher_feedback_import",detail:`Imported ${packet.feedback?.length||0} teacher feedback item(s) and ${packet.competency_ratings?.length||0} competency rating(s).`});
  }

  function projectId(p){
    const raw=[p.created||"",p.name||"",p.data?.finalRQ||""].join("|");
    let h=2166136261;
    for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}
    return "RMS-"+(h>>>0).toString(16).padStart(8,"0").toUpperCase();
  }

  function exportStudentPacket(p){
    normalizeProject(p);
    const m=methodStatus(p),pa=paperStatus(p),milestones=allMilestones(p);
    return {
      packet_type:"rms_student_review",
      version:"1.7",
      exported_at:new Date().toISOString(),
      project_id:projectId(p),
      student_alias:p.journey.studentAlias||"",
      course_section:p.journey.courseSection||"",
      project_name:p.name||"",
      context:p.context||"",
      research_question:p.data?.finalRQ||"",
      question_type:p.data?.questionType||"",
      design:p.data?.designType||"",
      topic:p.data?.topicChoice||p.data?.broadTopic||"",
      stage_ready:p.ready||{},
      milestones:milestones.map(x=>({
        id:x.def.id,title:x.def.title,state:x.state,blockers:x.blockers,warnings:x.warnings,
        checkpoint:x.checkpoint
      })),
      sources:{
        total:(p.sources||[]).length,
        included:(p.sources||[]).filter(s=>(s.screeningStatus||"Included")==="Included").length,
        verified:(p.sources||[]).filter(s=>s.verified).length,
        themes:window.RMSLiterature?.uniqueThemes?window.RMSLiterature.uniqueThemes(p):[]
      },
      methods:m,
      analysis:{
        dataset_file:p.analysis?.fileName||"",
        imported_rows:p.analysis?.rawData?.length||0,
        stored_runs:(p.analysis?.runs||[]).length,
        primary_estimand:p.data?.primaryEstimand||"",
        primary_result:p.data?.result1||""
      },
      writing:{
        paper_audit:pa,
        section_words:Object.fromEntries(Object.entries(p.writing?.sections||{}).map(([k,v])=>[k,(String(v||"").match(/\b[\w’'-]+\b/g)||[]).length]))
      },
      teacher_feedback:p.journey.teacherFeedback||[],
      competency_snapshot:window.RMSCompetency?window.RMSCompetency.snapshot(p):null,
      privacy_note:"This review packet intentionally omits the imported raw dataset and full paper/source text. It contains project status, selected summaries, and provisional learning-evidence analytics only."
    };
  }

  function makeTeacherFeedbackPacket(studentPacket,review){
    return {
      packet_type:"rms_teacher_feedback",
      version:"1.7",
      created_at:new Date().toISOString(),
      project_id:studentPacket.project_id,
      student_alias:studentPacket.student_alias||"",
      checkpoints:review.checkpoints||[],
      feedback:review.feedback||[],
      competency_ratings:review.competency_ratings||[]
    };
  }

  function upsertStudentPacket(packets,packet){
    if(!packet||packet.packet_type!=="rms_student_review"||packet.version!=="1.7")return {ok:false,replaced:false};
    const i=packets.findIndex(x=>x.project_id===packet.project_id);
    if(i>=0){packets[i]=packet;return {ok:true,replaced:true,index:i}}
    packets.push(packet);return {ok:true,replaced:false,index:packets.length-1};
  }
  function classSummary(packets){
    const valid=(packets||[]).filter(x=>x?.packet_type==="rms_student_review"&&x?.version==="1.7");
    const checkpointCounts={};
    milestoneDefs.forEach(d=>checkpointCounts[d.id]={approved:0,awaiting:0,blocked:0,revision:0,complete:0});
    valid.forEach(p=>{
      (p.milestones||[]).forEach(m=>{
        const c=checkpointCounts[m.id];if(!c)return;
        if(m.state==="approved")c.approved++;
        else if(m.state==="awaiting_teacher")c.awaiting++;
        else if(m.state==="revision_requested")c.revision++;
        else if(m.state==="complete")c.complete++;
        else c.blocked++;
      })
    });
    return {
      n:valid.length,
      checkpointCounts,
      ethicsReview:valid.filter(p=>p.methods?.ethicsStatus==="teacher_review").length,
      ethicsStop:valid.filter(p=>p.methods?.ethicsStatus==="do_not_facilitate").length,
      protocolLocked:valid.filter(p=>p.methods?.locked).length,
      analysisRun:valid.filter(p=>(p.analysis?.stored_runs||0)>0).length
    };
  }

  return {
    normalizeProject,milestoneDefs,checkpoint,methodStatus,paperStatus,milestoneStatus,allMilestones,
    phaseProgress,currentFocus,requestCheckpoint,applyTeacherFeedback,projectId,exportStudentPacket,
    makeTeacherFeedbackPacket,upsertStudentPacket,classSummary
  };
})();
