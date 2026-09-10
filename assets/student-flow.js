
window.RMSStudentFlow=(()=>{
  const C=window.RMSCurriculum,Paths=window.RMSPathways;

  const phaseNames={
    discover:"Phase 1 · Build the question",
    literature:"Phase 2 · Build the evidence",
    design:"Phase 3 · Design the study",
    analyze:"Phase 4 · Analyze the evidence",
    write:"Phase 5 · Write and audit"
  };

  const transition={
    1:{from:"You are starting with interests, problems, claims, and patterns that genuinely matter to you.",now:"Generate several possible directions before choosing one.",next:"You will narrow one direction into a feasible topic."},
    2:{from:"You generated possible research directions.",now:"Narrow one idea by specifying what, who or what system, where, and how much you can realistically study.",next:"You will do a quick background scan to learn the language and evidence around the topic."},
    3:{from:"You have a narrower topic and a realistic scope.",now:"Do a quick background scan so you can identify useful concepts, search terms, methods, and uncertainties.",next:"You will turn that background into a focused research question."},
    4:{from:"You have a topic, scope, and preliminary background.",now:"Write a research question that clearly identifies the evidence you need.",next:"You will use the important concepts in this question to search for research evidence."},
    5:{from:"You have a working research question.",now:"Turn its important concepts into a documented literature-search plan.",next:"You will evaluate the sources you find and record the evidence they contribute."},
    6:{from:"You have begun searching for literature.",now:"Decide which sources belong in your project and extract the evidence you will need later.",next:"You will compare sources to identify agreements, differences, limitations, and a justified reason for your study."},
    7:{from:"You have source records and extracted evidence.",now:"Synthesize what the literature collectively says and define a bounded study rationale.",next:"You will organize that synthesis into a literature review."},
    8:{from:"You have themes, tensions, and a study rationale.",now:"Build and draft a literature review that leads logically to your research question.",next:"You will choose a design that can generate evidence for that question."},
    9:{from:"Your question and literature rationale are now established.",now:"Choose a study or review design and state the strongest claim it could support.",next:"You will define the variables, constructs, evidence units, or review concepts that the design requires."},
    10:{from:"You chose a research design.",now:"Define exactly what will be changed, measured, observed, coded, compared, or synthesized.",next:"You will decide who or what provides the evidence and how measurements or records will be obtained."},
    11:{from:"You defined the main constructs, variables, and evidence units.",now:"Specify the population or system, actual sample or corpus, measurement plan, and ethics or safety needs.",next:"You will assemble those decisions into a reproducible method and data structure."},
    12:{from:"You have design, unit, sample, and measurement decisions.",now:"Create a reproducible method and define what each row or evidence record will contain.",next:"You will collect or import evidence and document data-quality decisions."},
    13:{from:"Your method and data structure are defined.",now:"Preserve the raw evidence, document missingness or corrections, and create descriptive summaries.",next:"You will choose and justify the analysis that answers your exact research question."},
    14:{from:"Your evidence is organized and its structure is known.",now:"Choose an analysis that matches the question, unit structure, outcome type, and claim boundary.",next:"You will turn validated output into a traceable Results section."},
    15:{from:"Your primary analysis is defined and validated output is available.",now:"Report the findings without adding explanations that belong in the Discussion.",next:"You will interpret the findings, compare them with literature, and define limitations and implications."},
    16:{from:"You have reported the findings.",now:"Answer the research question, interpret the findings, consider alternatives, and state what the evidence cannot establish.",next:"You will write the conclusion and abstract using the same evidence and claim boundary."},
    17:{from:"Your Discussion has established the interpretation and limitations.",now:"Write the closing sections and a compact abstract that accurately represents the completed study.",next:"You will audit the entire paper for alignment, citations, and unfinished decisions."},
    18:{from:"All major paper sections have been drafted.",now:"Audit the complete question → evidence → method → analysis → result → conclusion chain.",next:"Your project is ready for final teacher review and submission when the audit is resolved."}
  };

  const contextMap={
    1:["broadTopic"],
    2:["interest1","ideaA"],
    3:["topicChoice","phenomenon","contextPop"],
    4:["topicChoice","phenomenon","contextPop","scope"],
    5:["finalRQ","questionType"],
    6:["finalRQ","searchStrings"],
    7:["finalRQ","theme1","theme2"],
    8:["finalRQ","gapStatement","theme1"],
    9:["finalRQ","gapStatement"],
    10:["finalRQ","designType","claimBoundary"],
    11:["finalRQ","designType","experimentalUnit","outcomeDV"],
    12:["finalRQ","designType","experimentalUnit","population","sample"],
    13:["finalRQ","designType","rowUnit","sample"],
    14:["finalRQ","designType","__unit__","outcomeDV","primaryEstimand"],
    15:["finalRQ","analysisChoice","primaryEstimand","claimBoundary"],
    16:["finalRQ","result1","result2","claimBoundary"],
    17:["finalRQ","directAnswer","result1","limitations"],
    18:["finalRQ","designType","analysisChoice","directAnswer","claimBoundary"]
  };

  const contextLabels={
    broadTopic:"Topic",interest1:"Interest",ideaA:"Working direction",topicChoice:"Topic",
    phenomenon:"Phenomenon",contextPop:"Context / population",scope:"Scope",
    finalRQ:"Research question",questionType:"Question type",searchStrings:"Search plan",
    theme1:"Literature theme",theme2:"Literature theme",gapStatement:"Study rationale",
    designType:"Design",claimBoundary:"Claim limit",experimentalUnit:"Independent case / unit","__unit__":"Independent case / unit",
    outcomeDV:"Outcome",population:"Population / system",sample:"Sample / corpus",rowUnit:"One data row",
    primaryEstimand:"Exact quantity of interest",analysisChoice:"Analysis",result1:"Main result",
    result2:"Additional result",directAnswer:"Current answer to RQ",limitations:"Main limitations"
  };

  const labelOverrides={
    questionType:"What kind of question are you asking? (question type)",
    researchHyp:"What do you predict will happen? (research hypothesis)",
    nullHyp:"What would 'no difference or no relationship' mean? (null hypothesis)",
    predictorIV:"What factor are you changing or measuring first? (predictor, exposure, or independent variable)",
    outcomeDV:"What result will you measure or observe? (outcome or dependent variable)",
    controlCondition:"What will you compare against? (control or comparison condition)",
    controlledConditions:"What will you keep consistent? (controlled conditions)",
    confounders:"What other factors could help explain the result? (potential confounders)",
    experimentalUnit:"What counts as one independent case in your study? (experimental or observational unit)",
    operationalDefs:"How exactly will each important variable or construct be measured, changed, coded, or identified? (operational definitions)",
    population:"Who or what do you want the results to describe? (target population or system)",
    sample:"Who or what will actually provide your evidence? (sample or corpus)",
    samplingMethod:"How will cases, participants, or sources enter the study? (sampling or selection method)",
    sampleLimits:"Who or what should you avoid generalizing beyond? (generalization boundary)",
    measureQuality:"Why is this measurement good enough for the interpretation you want to make? (measurement quality)",
    rowUnit:"What does ONE row in your dataset represent?",
    primaryEstimand:"What exact difference, relationship, or quantity will answer your question? (primary estimand)",
    analysisChoice:"What analysis will answer that exact question?",
    assumptionChecks:"What conditions or model checks will you examine before interpreting the analysis? (assumptions)",
    effectSizePlan:"How will you describe the size of the pattern or difference? (effect size or magnitude)",
    multiplicity:"Are you making several statistical comparisons? If so, how will you handle that?",
    result1:"What is your first main result? Include the estimate or pattern and its evidence.",
    result2:"What is your second main result, if your question needs one?",
    directAnswer:"What is the clearest answer to your research question that your evidence supports?",
    limitations:"What specific features of the study limit what you can conclude?",
    gapStatement:"Why is this study or review worth doing after considering the existing evidence? (rationale or gap)",
    repeatedLimits:"What limitations appear across several of your sources?",
    litCompare:"How do your findings compare with the literature you reviewed?",
    alternatives:"What other explanations could reasonably account for the findings?",
    implications:"What practical or research implication follows from these findings without exceeding the evidence?"
  };

  const dependencyRules=[
    {keys:["finalRQ","questionType"],from:5},
    {keys:["gapStatement","litToRQ"],from:9},
    {keys:["designType","designWhy","claimBoundary"],from:10},
    {keys:["researchHyp","nullHyp","predictorIV","outcomeDV","operationalDefs","controlCondition","controlledConditions","confounders","experimentalUnit"],from:11},
    {keys:["population","sample","samplingMethod","sampleLimits","instrument","measureQuality","ethicsIssues","ethicsPlan"],from:12},
    {keys:["procedure","replication","rowUnit","columns","missingRule","exclusionRule","analysisIntent"],from:13},
    {keys:["rawLocation","missingObserved","errorsCorrections","plots","descriptives"],from:14},
    {keys:["analysisChoice","assumptionChecks","effectSizePlan","multiplicity","analysisSample","primaryEstimand"],from:15},
    {keys:["result1","result2","unexpected","resultsDraft"],from:16},
    {keys:["directAnswer","interpret1","interpret2","litCompare","alternatives","limitations","implications","discussionDraft"],from:17},
    {keys:["conclusionDraft","abstractDraft","titleDraft","keywords"],from:18}
  ];

  const writingMap={
    litDraft:"literature",resultsDraft:"results",discussionDraft:"discussion",
    conclusionDraft:"conclusion",abstractDraft:"abstract"
  };

  const methodPairs={
    outcomeDV:["design","primaryOutcome"],
    experimentalUnit:["design","experimentalUnit"],
    claimBoundary:["design","claimCeiling"],
    rowUnit:["design","rowUnit"],
    population:["sampling","population"],
    sample:["sampling","sample"],
    samplingMethod:["sampling","method"],
    sampleLimits:["sampling","generalization"]
  };

  const stageTools={
    5:{id:"literature",label:"Literature Workspace",description:"Record searches, sources, screening, synthesis, and your literature-review plan."},
    6:{id:"literature",label:"Literature Workspace",description:"Evaluate, screen, and extract source evidence."},
    7:{id:"literature",label:"Literature Workspace",description:"Compare source evidence and build your synthesis."},
    8:{id:"literature",label:"Literature Workspace",description:"Use the evidence map while building the literature review."},
    9:{id:"methods",label:"Methods Lab",description:"Map the design and its claim boundary."},
    10:{id:"methods",label:"Methods Lab",description:"Define constructs, roles, independent units, controls, and confounders."},
    11:{id:"methods",label:"Methods Lab",description:"Build sampling, measurement, ethics, and recruitment details."},
    12:{id:"methods",label:"Methods Lab",description:"Finalize procedure, data structure, and pre-collection audit."},
    13:{id:"data",label:"Data & Statistics Lab",description:"Import evidence, document quality decisions, and explore summaries."},
    14:{id:"data",label:"Data & Statistics Lab",description:"Use the known data structure to choose and run the analysis."},
    15:{id:"data-writing",label:"Results tools",description:"Use validated analysis output and draft the Results section."},
    16:{id:"writing",label:"Writing Lab",description:"Build the Discussion from your findings and literature evidence."},
    17:{id:"writing",label:"Writing Lab",description:"Draft the conclusion and abstract from the same evidence chain."},
    18:{id:"writing",label:"Writing Lab",description:"Run the final paper and citation audit."}
  };

  const present=v=>String(v??"").trim().length>0;
  const getStage=id=>C.stages.find(x=>Number(x.id)===Number(id));

  function normalizeProject(p){
    p.flow=p.flow||{};
    const f=p.flow;
    f.visited=f.visited||{};
    f.sectionByStage=f.sectionByStage||{};
    f.activeTabByStage=f.activeTabByStage||{};
    f.needsReview=f.needsReview||{};
    f.reviewReasons=f.reviewReasons||{};
    f.expandedPhases=f.expandedPhases||{};
    f.undoLog=f.undoLog||[];
    f.onboarded=!!f.onboarded;
    f.version="2.13";
    return p;
  }

  function visibleFields(p,stageId){
    const s=getStage(stageId),out=[];
    for(const sec of s?.sections||[])for(const f of sec.fields||[]){
      if(Paths.shouldShowField && !Paths.shouldShowField(p,f[0],stageId))continue;
      out.push(f);
    }
    return out;
  }

  function stageHasWork(p,stageId){
    if(visibleFields(p,stageId).some(f=>present(p.data?.[f[0]])))return true;
    if(stageId===5 && (p.searchLog||[]).length)return true;
    if(stageId===6 && (p.sources||[]).length)return true;
    if(stageId===7 && ((p.litClaims||[]).length||(p.data?.theme1)||(p.data?.gapStatement)))return true;
    if(stageId===8 && (p.litOutline||[]).length)return true;
    if(stageId>=9&&stageId<=12){
      const m=p.methods||{};
      if((m.constructs||[]).length||(m.conditions||[]).length||(m.measurements||[]).length||(m.procedureSteps||[]).length)return true;
    }
    if(stageId>=13&&stageId<=15){
      if((p.analysis?.runs||[]).length||(p.analysis?.rawData||[]).length)return true;
    }
    if(stageId>=15&&stageId<=18){
      const map={15:"results",16:"discussion",17:"conclusion",18:"abstract"};
      if(p.writing?.sections?.[map[stageId]])return true;
    }
    return false;
  }

  function phaseStatus(p,phase){
    const ids=phase.steps,done=ids.filter(id=>p.ready?.[id]).length;
    const review=ids.filter(id=>p.flow?.needsReview?.[id]).length;
    return {done,total:ids.length,review};
  }

  function recommendedStage(p){
    normalizeProject(p);
    const review=C.stages.find(s=>p.flow.needsReview?.[s.id]);
    if(review)return review.id;
    const unfinished=C.stages.find(s=>!p.ready?.[s.id]);
    return unfinished?.id||18;
  }

  function canWorkStage(p,id){
    normalizeProject(p);
    if(Number(id)===Number(p.currentStage))return true;
    if(p.ready?.[id]||p.flow.needsReview?.[id]||p.flow.visited?.[id]||stageHasWork(p,id))return true;
    const next=recommendedStage(p);
    return Number(id)<=Number(next);
  }

  function routeState(p,id){
    if(p.flow?.needsReview?.[id])return"review";
    if(Number(p.currentStage)===Number(id))return"current";
    if(p.ready?.[id])return"done";
    if(canWorkStage(p,id))return"available";
    return"future";
  }

  function stageProgress(p,id){
    const fields=visibleFields(p,id),done=fields.filter(f=>present(p.data?.[f[0]])).length;
    return {done,total:fields.length,ready:!!p.ready?.[id],needsReview:!!p.flow?.needsReview?.[id]};
  }

  function contextItems(p,stageId){
    const keys=contextMap[stageId]||["finalRQ"];
    const out=[];
    for(const key of keys){
      const v=key==="__unit__"?(p.data?.experimentalUnit||p.data?.rowUnit):p.data?.[key];
      if(present(v))out.push({key,label:contextLabels[key]||key,value:String(v).trim()});
      if(out.length>=4)break;
    }
    return out;
  }

  function fieldLabel(p,key,fallback){
    return labelOverrides[key]||fallback;
  }

  function sectionIndex(p,stageId,max){
    normalizeProject(p);
    let i=Number(p.flow.sectionByStage?.[stageId]??0);
    if(!Number.isFinite(i)||i<0)i=0;
    if(max>0)i=Math.min(i,max-1);
    return i;
  }
  function setSection(p,stageId,index){
    normalizeProject(p);p.flow.sectionByStage[stageId]=Math.max(0,Number(index)||0);
  }

  function sectionStatus(p,stageId,section){
    const fields=(section?.fields||[]).filter(f=>!Paths.shouldShowField||Paths.shouldShowField(p,f[0],stageId));
    const done=fields.filter(f=>present(p.data?.[f[0]])).length;
    return {done,total:fields.length,complete:fields.length>0&&done===fields.length};
  }

  function noteFieldChange(p,key,oldValue,newValue){
    normalizeProject(p);
    const old=String(oldValue??"").trim(),next=String(newValue??"").trim();
    if(old===next)return [];
    const rule=dependencyRules.find(r=>r.keys.includes(key));
    if(!rule)return [];
    const affected=[];
    for(let id=rule.from;id<=18;id++){
      if(id===Number(p.currentStage))continue;
      if(p.ready?.[id]||stageHasWork(p,id)){
        p.ready[id]=false;
        p.flow.needsReview[id]=true;
        const label=fieldLabel(p,key,contextLabels[key]||key);
        p.flow.reviewReasons[id]=`Your earlier answer for “${label}” changed. Your work is still saved, but this stage should be checked against the revised decision.`;
        affected.push(id);
      }
    }
    if(affected.length){
      p.flow.undoLog.push({time:new Date().toISOString(),type:"dependency_invalidation",field:key,stages:affected});
      if(p.flow.undoLog.length>50)p.flow.undoLog=p.flow.undoLog.slice(-50);
    }
    return affected;
  }

  function markVisited(p,id){
    normalizeProject(p);p.flow.visited[id]=new Date().toISOString();
  }
  function clearReview(p,id){
    normalizeProject(p);delete p.flow.needsReview[id];delete p.flow.reviewReasons[id];
  }

  function getNested(obj,path){
    let cur=obj;for(const k of path){if(cur==null)return"";cur=cur[k]}return cur;
  }
  function setNested(obj,path,value){
    let cur=obj;for(let i=0;i<path.length-1;i++){cur[path[i]]=cur[path[i]]||{};cur=cur[path[i]]}cur[path[path.length-1]]=value;
  }

  function syncCanonical(p){
    normalizeProject(p);
    p.methods=p.methods||{};p.writing=p.writing||{};p.writing.sections=p.writing.sections||{};
    for(const [dataKey,section] of Object.entries(writingMap)){
      const d=String(p.data?.[dataKey]??""),w=String(p.writing.sections?.[section]??"");
      if(d&&!w)p.writing.sections[section]=d;
      else if(w&&!d)p.data[dataKey]=w;
      else if(d!==w && d && w){
        p.flow.versionArchive=p.flow.versionArchive||[];
        const exists=p.flow.versionArchive.some(x=>x.kind==="writing_conflict"&&x.key===dataKey&&x.stageValue===d&&x.labValue===w);
        if(!exists)p.flow.versionArchive.push({time:new Date().toISOString(),kind:"writing_conflict",key:dataKey,stageValue:d,labValue:w});
        p.writing.sections[section]=d;
      }
    }
    for(const [dataKey,path] of Object.entries(methodPairs)){
      const d=String(p.data?.[dataKey]??""),m=String(getNested(p.methods,path)??"");
      if(d&&!m)setNested(p.methods,path,d);
      else if(m&&!d)p.data[dataKey]=m;
      else if(d!==m && d && m){
        p.flow.versionArchive=p.flow.versionArchive||[];
        const exists=p.flow.versionArchive.some(x=>x.kind==="method_conflict"&&x.key===dataKey&&x.stageValue===d&&x.labValue===m);
        if(!exists)p.flow.versionArchive.push({time:new Date().toISOString(),kind:"method_conflict",key:dataKey,stageValue:d,labValue:m});
        setNested(p.methods,path,d);
      }
    }
    return p;
  }

  function syncDataField(p,key,value){
    p.data[key]=value;
    if(writingMap[key]){
      p.writing=p.writing||{};p.writing.sections=p.writing.sections||{};
      p.writing.sections[writingMap[key]]=value;
    }
    if(methodPairs[key]){
      p.methods=p.methods||{};setNested(p.methods,methodPairs[key],value);
    }
  }


  function schemaSummary(p){
    const rows=p.schema||[];
    return rows.map((x,i)=>{
      const name=String(x.name||`column_${i+1}`).trim();
      const type=String(x.type||"unspecified type").trim();
      const role=String(x.role||"").trim();
      const def=String(x.definition||"").trim();
      const missing=String(x.missing||"").trim();
      return `${name} — ${type}${role?` — ${role}`:""}${def?` — ${def}`:""}${missing?` — missing: ${missing}`:""}`;
    }).join("\n");
  }
  function syncSchemaSummary(p){
    p.data=p.data||{};
    if((p.schema||[]).length)p.data.columns=schemaSummary(p);
    return p.data.columns||"";
  }

  function syncWritingFromLab(p,section,value){
    p.writing=p.writing||{};p.writing.sections=p.writing.sections||{};
    p.writing.sections[section]=value;
    const key=Object.entries(writingMap).find(([,sec])=>sec===section)?.[0];
    if(key)p.data[key]=value;
  }

  function syncMethodFromLab(p,group,key,value){
    p.methods=p.methods||{};p.methods[group]=p.methods[group]||{};p.methods[group][key]=value;
    const pair=Object.entries(methodPairs).find(([,path])=>path[0]===group&&path[1]===key);
    if(pair)p.data[pair[0]]=value;
  }

  function stageTool(stageId){return stageTools[stageId]||null}
  function phaseLabel(id){return phaseNames[id]||C.phases.find(x=>x.id===id)?.label||id}
  function transitionFor(id){return transition[id]||{from:"Your earlier work is saved.",now:getStage(id)?.purpose||"",next:"Continue when this decision is clear."}}

  return {
    normalizeProject,phaseNames,phaseLabel,transitionFor,contextItems,contextLabels,fieldLabel,
    visibleFields,stageHasWork,phaseStatus,recommendedStage,canWorkStage,routeState,stageProgress,
    sectionIndex,setSection,sectionStatus,noteFieldChange,markVisited,clearReview,stageTool,
    syncCanonical,syncDataField,syncWritingFromLab,syncMethodFromLab,schemaSummary,syncSchemaSummary,writingMap,methodPairs
  };
})();
