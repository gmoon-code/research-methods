
window.RMSCompetency = (() => {
  const MODEL = {"version":"1.8","status":"provisional_unvalidated_instructional_model","rubric":{"0":{"label":"Emerging","description":"The relevant research decision is absent, substantially mismatched, or cannot yet be justified."},"1":{"label":"Supported","description":"The student identifies part of the decision with substantial structure or prompting, but important reasoning gaps remain."},"2":{"label":"Developing independence","description":"The decision is mostly defensible and explained, with limited gaps or support still needed."},"3":{"label":"Independent reasoning","description":"The student makes a defensible decision, explains why it fits the evidence/design, and recognizes important limits with little or no direct support."}},"scaffold_levels":{"0":"No recorded support","1":"Diagnostic feedback or reflection prompt","2":"Conceptual cue or explanation","3":"Structured decision tool, checklist, or guided alternative set","4":"Worked parallel example from a different context","5":"Direct rescue/modelled option requiring student adaptation or justification"},"competencies":[{"id":"C1","key":"question_formulation","name":"Research question formulation","definition":"Moves from interest to a bounded, answerable, neutral research question whose wording matches the type of evidence and feasible design.","stages":[1,2,3,4]},{"id":"C2","key":"literature_search_evaluation","name":"Literature search and source evaluation","definition":"Builds reproducible searches, screens sources using explicit criteria, and evaluates source relevance, authority, accuracy, purpose, and methodological usefulness.","stages":[5,6]},{"id":"C3","key":"literature_synthesis","name":"Literature synthesis and study justification","definition":"Coordinates evidence across studies, identifies convergence, disagreement, methodological boundaries, and supports an honest gap, replication, extension, or local rationale.","stages":[7,8]},{"id":"C4","key":"operationalization_measurement","name":"Operationalization and measurement","definition":"Translates constructs into manipulable or measurable variables, scoring/coding rules, instruments, timing, units, and validity/reliability considerations.","stages":[3,4,10,11,12]},{"id":"C5","key":"design_validity","name":"Study design and validity reasoning","definition":"Matches design to the research question, identifies units and comparison structure, recognizes confounding and repeated/nested structure, and calibrates the causal claim ceiling.","stages":[9,10,11,12]},{"id":"C6","key":"sampling_ethics","name":"Sampling, ethics, and research responsibility","definition":"Distinguishes population from sample, evaluates sampling/generalization, and plans consent, privacy, safety, authority, and appropriate oversight.","stages":[11,12]},{"id":"C7","key":"data_reasoning","name":"Data integrity and descriptive reasoning","definition":"Preserves raw evidence, defines rows/columns, documents missingness and exclusions, visualizes the design structure, and describes patterns before inference.","stages":[12,13]},{"id":"C8","key":"statistical_reasoning","name":"Statistical reasoning and uncertainty","definition":"Defines the estimand, matches analysis to design and data structure, checks relevant assumptions, reports magnitude and uncertainty, and avoids p-value overinterpretation.","stages":[14,15]},{"id":"C9","key":"evidence_claims","name":"Evidence coordination and claim calibration","definition":"Connects results to the research question, distinguishes evidence from explanation, evaluates alternatives and limitations, and keeps causal/generalization claims within design boundaries.","stages":[15,16,17]},{"id":"C10","key":"scholarly_communication","name":"Scholarly communication and citation integrity","definition":"Builds coherent research sections, synthesizes sources, keeps Method/Results/Discussion roles distinct, traces claims to verified sources, and maintains whole-paper alignment.","stages":[8,15,16,17,18]}]};
  const present=v=>String(v??"").trim().length>0;

  function normalizeProject(p){
    p.competency=p.competency||{};
    const c=p.competency;
    c.independentCheckpoints=c.independentCheckpoints||[];
    c.supportEvents=c.supportEvents||[];
    c.reviewEvents=c.reviewEvents||[];
    c.teacherRatings=c.teacherRatings||[];
    c.reflections=c.reflections||[];
    c.processEvents=c.processEvents||[];
    return p;
  }

  function hashString(str){
    let h=2166136261;
    str=String(str||"");
    for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(16).padStart(8,"0");
  }

  function scoreToLevel(score){
    const s=Number(score);
    if(!Number.isFinite(s))return null;
    if(s<50)return 0;
    if(s<70)return 1;
    if(s<85)return 2;
    return 3;
  }

  function competenciesForStage(stage){
    return MODEL.competencies.filter(c=>c.stages.includes(Number(stage))).map(c=>c.key);
  }

  function workFingerprint(work){
    const text=JSON.stringify(work||{});
    return {hash:hashString(text),characters:text.length,fields:Object.keys(work||{}).length};
  }

  function priorSupportForStage(p,stage,time=null){
    normalizeProject(p);
    const cutoff=time?new Date(time).getTime():Infinity;
    return p.competency.supportEvents.filter(e=>Number(e.stage)===Number(stage)&&new Date(e.time).getTime()<=cutoff);
  }

  function captureIndependent(p,stage,diagnostic,work){
    normalizeProject(p);
    const fp=workFingerprint(work),time=new Date().toISOString();
    const previous=p.competency.independentCheckpoints.filter(x=>Number(x.stage)===Number(stage));
    const supports=priorSupportForStage(p,stage,time);
    const event={
      stage:Number(stage),time,score:diagnostic?.score??null,level:scoreToLevel(diagnostic?.score),
      label:diagnostic?.label||"",fingerprint:fp,
      independentEligible:supports.length===0,
      priorSupportCount:supports.length,
      priorMaxSupport:supports.length?Math.max(...supports.map(x=>Number(x.level)||0)):0,
      attemptNumber:previous.length+1,
      competencies:competenciesForStage(stage)
    };
    p.competency.independentCheckpoints.push(event);
    p.competency.processEvents.push({time,type:"independent_checkpoint",stage:Number(stage),detail:`Independent checkpoint ${event.attemptNumber} saved.`});
    return event;
  }

  function recordReview(p,stage,diagnostic,kind="local"){
    normalizeProject(p);
    const time=new Date().toISOString(),prior=p.competency.reviewEvents.filter(x=>Number(x.stage)===Number(stage)&&x.kind===kind);
    const event={
      stage:Number(stage),time,kind,score:diagnostic?.score??null,level:scoreToLevel(diagnostic?.score),
      label:diagnostic?.label||diagnostic?.verdict||"",competencies:competenciesForStage(stage),
      reviewNumber:prior.length+1
    };
    p.competency.reviewEvents.push(event);
    if(prior.length){
      const before=prior[prior.length-1].score;
      if(Number.isFinite(before)&&Number.isFinite(event.score)&&event.score!==before){
        p.competency.processEvents.push({
          time,type:"revision_cycle",stage:Number(stage),
          detail:`Stage ${stage} review changed from ${before} to ${event.score}.`,
          delta:event.score-before
        });
      }
    }
    return event;
  }

  function recordSupport(p,stage,level,source,detail=""){
    normalizeProject(p);
    const lv=Math.max(0,Math.min(5,Number(level)||0));
    const event={time:new Date().toISOString(),stage:Number(stage),level:lv,source:String(source||"support"),detail:String(detail||""),competencies:competenciesForStage(stage)};
    p.competency.supportEvents.push(event);
    return event;
  }

  function importTeacherRatings(p,ratings){
    normalizeProject(p);
    (ratings||[]).forEach(r=>{
      if(!MODEL.competencies.some(c=>c.key===r.competency))return;
      const level=Number(r.level);
      if(!Number.isInteger(level)||level<0||level>3)return;
      p.competency.teacherRatings.push({
        time:r.time||new Date().toISOString(),competency:r.competency,level,
        teacher:r.teacher||"",note:r.note||"",milestone:r.milestone||""
      });
    });
  }

  function independentEventsForCompetency(p,key){
    normalizeProject(p);
    return p.competency.independentCheckpoints.filter(e=>e.competencies.includes(key)&&e.independentEligible&&e.level!==null);
  }
  function reviewEventsForCompetency(p,key){
    normalizeProject(p);
    return p.competency.reviewEvents.filter(e=>e.competencies.includes(key)&&e.kind==="local"&&e.level!==null);
  }
  function supportForCompetency(p,key){
    normalizeProject(p);
    return p.competency.supportEvents.filter(e=>e.competencies.includes(key));
  }
  function latestTeacherRating(p,key){
    normalizeProject(p);
    const a=p.competency.teacherRatings.filter(x=>x.competency===key);
    return a.length?a[a.length-1]:null;
  }

  function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
  function round2(x){return x===null?null:Math.round(x*100)/100}

  function competencyProfile(p,comp){
    normalizeProject(p);
    const indep=independentEventsForCompetency(p,comp.key);
    const reviews=reviewEventsForCompetency(p,comp.key);
    const supports=supportForCompetency(p,comp.key);
    const teacher=latestTeacherRating(p,comp.key);

    // One independent checkpoint per mapped stage contributes the earliest eligible attempt.
    const firstByStage=new Map();
    indep.forEach(e=>{if(!firstByStage.has(e.stage))firstByStage.set(e.stage,e)});
    const irLevels=[...firstByStage.values()].map(e=>e.level);

    // Latest local diagnostic for each mapped stage is supported/current project performance.
    const latestByStage=new Map();
    reviews.forEach(e=>latestByStage.set(e.stage,e));
    const spLevels=[...latestByStage.values()].map(e=>e.level);

    const maxSupport=supports.length?Math.max(...supports.map(x=>x.level)):0;
    const avgSupport=supports.length?mean(supports.map(x=>x.level)):0;
    const coveredIndependent=new Set([...firstByStage.keys()]).size;
    const coveredSupported=new Set([...latestByStage.keys()]).size;

    return {
      id:comp.id,key:comp.key,name:comp.name,definition:comp.definition,stages:comp.stages,
      independentLevel:round2(mean(irLevels)),
      supportedLevel:round2(mean(spLevels)),
      independentCoverage:coveredIndependent,
      supportedCoverage:coveredSupported,
      opportunities:comp.stages.length,
      supportMax:maxSupport,
      supportMean:round2(avgSupport),
      supportCount:supports.length,
      teacherRating:teacher,
      evidence:{
        independent:[...firstByStage.values()],
        reviews:[...latestByStage.values()],
        support:supports
      }
    };
  }

  function snapshot(p){
    normalizeProject(p);
    const profiles=MODEL.competencies.map(c=>competencyProfile(p,c));
    const ir=profiles.map(x=>x.independentLevel).filter(x=>x!==null);
    const sp=profiles.map(x=>x.supportedLevel).filter(x=>x!==null);
    const teacher=profiles.map(x=>x.teacherRating?.level).filter(x=>Number.isFinite(x));
    const revisions=p.competency.processEvents.filter(x=>x.type==="revision_cycle");
    return {
      modelVersion:MODEL.version,
      status:MODEL.status,
      generatedAt:new Date().toISOString(),
      independentMean:round2(mean(ir)),
      supportedMean:round2(mean(sp)),
      teacherMean:round2(mean(teacher)),
      independentCompetencies:ir.length,
      supportedCompetencies:sp.length,
      totalCompetencies:MODEL.competencies.length,
      highestSupport:p.competency.supportEvents.length?Math.max(...p.competency.supportEvents.map(x=>x.level)):0,
      supportEvents:p.competency.supportEvents.length,
      revisionCycles:revisions.length,
      independentCheckpoints:p.competency.independentCheckpoints.length,
      independentEligible:p.competency.independentCheckpoints.filter(x=>x.independentEligible).length,
      profiles
    };
  }

  function processMetrics(p){
    normalizeProject(p);
    const checkpoints=p.competency.independentCheckpoints||[];
    const eligible=checkpoints.filter(x=>x.independentEligible);
    const support=p.competency.supportEvents||[];
    const revisions=p.competency.processEvents.filter(x=>x.type==="revision_cycle");
    const positive=revisions.filter(x=>(x.delta||0)>0);
    return {
      independentCheckpointCount:checkpoints.length,
      eligibleIndependentCount:eligible.length,
      supportedFirstCount:checkpoints.length-eligible.length,
      supportEventCount:support.length,
      highestSupport:support.length?Math.max(...support.map(x=>x.level)):0,
      revisionCycles:revisions.length,
      positiveRevisionCycles:positive.length,
      protocolVersions:p.methods?.protocolVersions?.length||0,
      teacherFeedbackItems:p.journey?.teacherFeedback?.length||0
    };
  }

  function levelLabel(v){
    if(v===null||v===undefined)return "No evidence";
    const n=Math.round(v);
    return MODEL.rubric[String(Math.max(0,Math.min(3,n)))]?.label||"";
  }

  function reportMarkdown(p){
    const s=snapshot(p),pm=processMetrics(p);
    const lines=[
      "# Research Competency Learning-Evidence Report","",
      `**Model:** v${MODEL.version} — provisional, unvalidated instructional analytics`,
      `**Generated:** ${s.generatedAt}`,"",
      "## Interpretation warning","",
      "These indicators summarize evidence captured inside this software. They are not validated psychometric scores, grades, or proof of general research competence. Independent evidence, supported performance, support exposure, and teacher ratings should be interpreted separately.","",
      "## Summary","",
      `- Competencies with independent evidence: ${s.independentCompetencies}/${s.totalCompetencies}`,
      `- Mean independent level where evidence exists: ${s.independentMean??"—"} / 3`,
      `- Competencies with supported/current review evidence: ${s.supportedCompetencies}/${s.totalCompetencies}`,
      `- Mean supported/current level where evidence exists: ${s.supportedMean??"—"} / 3`,
      `- Highest scaffold level observed: ${s.highestSupport} / 5`,
      `- Revision cycles detected: ${s.revisionCycles}`,"",
      "## Competency profiles",""
    ];
    s.profiles.forEach(x=>{
      lines.push(`### ${x.id} — ${x.name}`,
        x.definition,"",
        `- Independent level: ${x.independentLevel??"—"} / 3 (${x.independentCoverage}/${x.opportunities} mapped stage opportunities captured)`,
        `- Supported/current level: ${x.supportedLevel??"—"} / 3 (${x.supportedCoverage}/${x.opportunities} mapped stage opportunities reviewed)`,
        `- Highest support level used: ${x.supportMax} / 5 across ${x.supportCount} support event(s)`,
        `- Latest teacher rating: ${x.teacherRating?`${x.teacherRating.level}/3${x.teacherRating.note?` — ${x.teacherRating.note}`:""}`:"—"}`,"");
    });
    lines.push("## Process indicators","",
      `- Independent checkpoints saved: ${pm.independentCheckpointCount}`,
      `- Eligible independent checkpoints: ${pm.eligibleIndependentCount}`,
      `- Checkpoints captured after prior support: ${pm.supportedFirstCount}`,
      `- Support events: ${pm.supportEventCount}`,
      `- Positive revision cycles: ${pm.positiveRevisionCycles}/${pm.revisionCycles}`,
      `- Locked protocol versions: ${pm.protocolVersions}`,
      `- Imported teacher feedback items: ${pm.teacherFeedbackItems}`,"");
    return lines.join("\n");
  }

  return {
    model:MODEL,normalizeProject,scoreToLevel,competenciesForStage,workFingerprint,
    captureIndependent,recordReview,recordSupport,importTeacherRatings,competencyProfile,
    snapshot,processMetrics,levelLabel,reportMarkdown
  };
})();
