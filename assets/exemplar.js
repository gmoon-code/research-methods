
window.RMSExemplar=(()=>{
  const BANK=window.RMSExemplarProjects;
  const byId=id=>BANK.projects.find(x=>x.id===id)||BANK.projects[0];
  const byPath=path=>BANK.projects.find(x=>x.path===path)||null;
  function normalizeProject(p){
    p.exemplar=p.exemplar||{};
    const e=p.exemplar;
    e.viewed=e.viewed||{};
    e.bundleViews=e.bundleViews||{};
    e.reflections=e.reflections||{};
    e.events=e.events||[];
    e.lastProjectId=e.lastProjectId||"";
    // Preserve v2.7 legacy stage history if present.
    if(e.viewedStages && !e._legacyMigrated){
      const legacyProject=BANK.projects.find(x=>x.path==="experimental")||BANK.projects[0];
      e.viewed[legacyProject.id]=e.viewed[legacyProject.id]||{};
      for(const [stage,ev] of Object.entries(e.viewedStages))e.viewed[legacyProject.id][stage]=ev;
      e._legacyMigrated=true;
    }
    return p;
  }
  function recommendedProject(p){
    normalizeProject(p);
    const path=p.pathway?.selected||"unsure";
    return byPath(path)||byId(p.exemplar.lastProjectId)||BANK.projects[0];
  }
  const stage=(projectId,stageId)=>byId(projectId)?.stages?.find(x=>Number(x.id)===Number(stageId))||null;
  const wasViewed=(p,projectId,stageId)=>!!(normalizeProject(p).exemplar.viewed?.[projectId]?.[String(stageId)]);
  function checkpointStatus(p,stageId){
    const rows=p.competency?.independentCheckpoints||[];
    const s=rows.filter(x=>Number(x.stage)===Number(stageId));
    return {any:s.length>0,eligible:s.some(x=>x.independentEligible),count:s.length};
  }
  function supportStatus(p,stageId){
    const rows=(p.competency?.supportEvents||[]).filter(x=>Number(x.stage)===Number(stageId));
    return {any:rows.length>0,count:rows.length,max:rows.length?Math.max(...rows.map(x=>Number(x.level)||0)):0};
  }
  function stageWarning(p,projectId,stageId){
    const ex=byId(projectId),cp=checkpointStatus(p,stageId),sup=supportStatus(p,stageId),already=wasViewed(p,projectId,stageId);
    if(already)return {needsConfirm:false,title:"This worked stage is already recorded",body:`You already viewed Stage ${stageId} in “${ex.title}.”`};
    if(cp.eligible)return {needsConfirm:true,title:"Your independent checkpoint is already preserved",body:"Viewing this worked stage will add Level 4 support without changing the eligible checkpoint saved earlier."};
    if(sup.any)return {needsConfirm:true,title:"This stage already contains recorded support",body:`This exemplar adds another Level 4 worked-example exposure. The stage already contains ${sup.count} recorded support event(s).`};
    return {needsConfirm:true,title:"Save an independent checkpoint first if you want one",body:"A complete worked stage is Level 4 support. If you view it first, a later checkpoint for this stage should be treated as supported."};
  }
  function recordStageView(p,projectId,stageId,Competency){
    normalizeProject(p);const ex=byId(projectId),key=String(stageId);
    p.exemplar.viewed[projectId]=p.exemplar.viewed[projectId]||{};
    if(p.exemplar.viewed[projectId][key])return p.exemplar.viewed[projectId][key];
    const ev={time:new Date().toISOString(),type:"worked_exemplar_stage",projectId,projectPath:ex.path,stage:Number(stageId),level:4,title:ex.title};
    p.exemplar.viewed[projectId][key]=ev;p.exemplar.events.push(ev);p.exemplar.lastProjectId=projectId;
    if(Competency?.recordSupport)Competency.recordSupport(p,stageId,4,`Worked exemplar · ${ex.title}`,`Viewed Stage ${stageId} in the ${ex.path} exemplar.`);
    return ev;
  }
  const bundleStages={sources:[3,5,6,7,8],data:[12,13,14,15],paper:[8,12,15,16,17,18]};
  function bundleWarning(p,projectId,bundle){
    const stages=bundleStages[bundle]||[],fresh=stages.filter(s=>!wasViewed(p,projectId,s));
    return {bundle,stages,newStages:fresh,needsConfirm:fresh.length>0};
  }
  function recordBundleView(p,projectId,bundle,Competency){
    normalizeProject(p);for(const s of bundleStages[bundle]||[])recordStageView(p,projectId,s,Competency);
    const k=`${projectId}:${bundle}`,ev={time:new Date().toISOString(),type:"worked_exemplar_bundle",projectId,bundle,stages:bundleStages[bundle]||[]};
    p.exemplar.bundleViews[k]=ev;p.exemplar.events.push(ev);return ev;
  }
  function saveReflection(p,projectId,stageId,text){
    normalizeProject(p);const k=`${projectId}:${stageId}`;
    p.exemplar.reflections[k]={time:new Date().toISOString(),projectId,stage:Number(stageId),text:String(text||"")};return p.exemplar.reflections[k];
  }
  function pathDifference(studentPath,exemplarPath){
    if(!studentPath||studentPath==="unsure"||studentPath===exemplarPath)return"";
    const names={descriptive_quantitative:"descriptive quantitative",observational:"observational / correlational",experimental:"experimental",quasi_experimental:"quasi-experimental",qualitative:"qualitative",literature_review:"literature review",meta_analysis:"meta-analysis",mixed_methods:"mixed methods"};
    return `Your project follows a ${names[studentPath]||studentPath} path, while this exemplar follows ${names[exemplarPath]||exemplarPath}. Study the reasoning role of each decision, but use the terminology, units, analysis, and claim ceiling required by your own path.`;
  }
  function viewedCount(p,projectId){return Object.keys(normalizeProject(p).exemplar.viewed?.[projectId]||{}).length}
  return {bank:BANK,normalizeProject,byId,byPath,recommendedProject,stage,wasViewed,viewedCount,checkpointStatus,supportStatus,stageWarning,recordStageView,bundleStages,bundleWarning,recordBundleView,saveReflection,pathDifference};
})();
