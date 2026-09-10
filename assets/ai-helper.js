
window.RMSAIHelper=(()=>{
  const Snapshot=window.RMSResearchSnapshot,Paths=window.RMSPathways,C=window.RMSCurriculum;

  function normalizeProject(p){
    p.aiHelper=p.aiHelper||{};
    const h=p.aiHelper;
    h.messages=Array.isArray(h.messages)?h.messages:[];
    h.events=Array.isArray(h.events)?h.events:[];
    h.includeProjectContext=h.includeProjectContext!==false;
    h.lastField=h.lastField||null;
    h.conversationId=h.conversationId||`aih_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
    return p;
  }

  function stage(project){
    return C.stages.find(x=>Number(x.id)===Number(project.currentStage))||C.stages[0];
  }
  function stageTitle(project){
    const s=stage(project);
    return Paths.stageTitle?Paths.stageTitle(project,s.id,s.title||s.nav):s.title;
  }
  function trim(v,n=1600){
    v=String(v??"").trim();
    return v.length>n?v.slice(0,n)+"…":v;
  }
  function stageFields(project){
    const s=stage(project),out=[];
    for(const sec of s.sections||[])for(const f of sec.fields||[]){
      const [key,label,type]=f;
      if(Paths.shouldShowField && !Paths.shouldShowField(project,key,s.id))continue;
      const v=String(project.data?.[key]??"").trim();
      out.push({key,label:Paths.label?Paths.label(project,key,label):label,type,value:trim(v,1200),has_attempt:v.length>=3});
    }
    return out;
  }
  function coreContext(project){
    return Snapshot.coreChain(project).map(x=>({label:x.label,value:trim(x.value,900),stage:x.stage})).slice(0,18);
  }
  function sourceContext(project,question=""){
    const s=stage(project).id,q=String(question||"").toLowerCase();
    if(!(s>=5&&s<=8) && !/(source|literature|citation|reference|article|study|evidence|doi)/.test(q))return[];
    return (project.sources||[]).slice(0,8).map(x=>({
      id:x.id||"",citation:trim(x.citation||x.title,500),screening_status:x.screeningStatus||"",
      design:trim(x.design,300),population_or_context:trim(x.sample,300),
      finding:trim(x.finding,700),limitations:trim(x.limits,500),verified:!!x.verified
    }));
  }
  function analysisContext(project,question=""){
    const s=stage(project).id,q=String(question||"").toLowerCase();
    if(!(s>=12&&s<=16) && !/(data|statistic|analysis|test|anova|correlation|regression|p-value|p value|confidence interval|effect size|mean|median|binary|paired|independent)/.test(q))return{};
    return {
      schema:(project.schema||[]).slice(0,20).map(x=>({name:x.name,type:x.type,unit:x.unit||"",definition:trim(x.definition,300)})),
      stored_runs:(project.analysis?.runs||[]).slice(-4).map((x,i)=>({id:`A${Math.max(1,(project.analysis?.runs||[]).length-3+i)}`,summary:trim(x.neutral_summary,900),test:x.output?.test||x.structure||""}))
    };
  }
  function writingContext(project,question=""){
    const s=stage(project).id,q=String(question||"").toLowerCase();
    if(!(s>=15&&s<=18) && !/(write|writing|abstract|introduction|literature review|method|results|discussion|conclusion|paragraph|sentence|citation)/.test(q))return[];
    return Object.entries(project.writing?.sections||{}).filter(([,v])=>String(v||"").trim()).map(([section,text])=>({section,text:trim(text,1200)})).slice(0,4);
  }
  function currentField(project){
    normalizeProject(project);
    const f=project.aiHelper.lastField;
    if(!f)return null;
    const current=stageFields(project).find(x=>x.key===f.key);
    if(current)return {...current,stage_id:stage(project).id,origin:"stage_notebook"};
    if(Number(f.stage_id)!==Number(stage(project).id))return null;
    const value=String(f.value??"").trim();
    return {key:f.key,label:f.label||f.key,type:f.type||"text",value:trim(value,1200),has_attempt:value.length>=3,stage_id:stage(project).id,origin:f.origin||"workspace_control"};
  }
  function conversation(project){
    normalizeProject(project);
    return project.aiHelper.messages.slice(-12).filter(m=>m.role==="user"||m.role==="assistant").map(m=>({role:m.role,content:trim(m.content,1800),scaffold_level:m.scaffold_level??null,counts_as_stage_support:!!m.counts_as_stage_support}));
  }
  function deterministicFlags(project,PathCoach){
    try{
      const r=PathCoach?.reviewStage?.(stage(project).id,project);
      return (r?.messages||[]).slice(0,8).map(x=>({level:x.level,title:x.title,body:trim(x.body,500)}));
    }catch{return[]}
  }
  function contextPacket(project,PathCoach,question=""){
    normalizeProject(project);
    return {
      stage:{id:stage(project).id,title:stageTitle(project)},
      research_path:{id:project.pathway?.selected||"unsure",name:Paths.selected?Paths.selected(project).name:(project.pathway?.selected||"Unsure")},
      current_field:currentField(project),
      current_stage_fields:stageFields(project),
      accumulated_research_chain:coreContext(project),
      literature_sources:sourceContext(project,question),
      analysis_context:analysisContext(project,question),
      writing_context:writingContext(project,question),
      deterministic_flags:deterministicFlags(project,PathCoach)
    };
  }
  function buildPayload(project,question,PathCoach){
    normalizeProject(project);
    const include=project.aiHelper.includeProjectContext!==false;
    return {
      conversation_id:project.aiHelper.conversationId,
      question:String(question||"").trim(),
      conversation_history:conversation(project),
      project_context:include?contextPacket(project,PathCoach,question):{
        stage:{id:stage(project).id,title:stageTitle(project)},
        research_path:{id:project.pathway?.selected||"unsure",name:Paths.selected?Paths.selected(project).name:(project.pathway?.selected||"Unsure")},
        current_field:currentField(project)
      },
      helper_policy:{
        audience:"secondary student / novice researcher",
        answer_clarification_directly:true,
        preserve_student_authorship:true,
        direct_completion_guard:true,
        do_not_invent_sources:true,
        do_not_invent_data:true,
        do_not_calculate_statistics_from_raw_data:true,
        statistics_rule:"Explain validated statistical outputs and analysis-selection reasoning. Numerical calculations belong to deterministic statistical code.",
        literature_rule:"Do not make source-specific factual claims unless supported by supplied verified source context or a backend retrieval system that returns verifiable citations.",
        writing_rule:"Explain, critique, compare, and provide parallel examples. Do not generate a complete submission-ready section before substantive student work. Direct rescue must be marked Level 5 and require adaptation/justification.",
        decision_rule:"If the student asks you to choose or write a current unfinished research decision for them, first ask targeted reasoning questions or use a parallel example. If a substantive student attempt exists, critique and help revise it.",
        privacy_rule:"Use only supplied minimized project context. Do not request names or unnecessary personal information."
      }
    };
  }
  function addMessage(project,role,content,meta={}){
    normalizeProject(project);
    const m={id:`m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,time:new Date().toISOString(),role,content:String(content||""),...meta};
    project.aiHelper.messages.push(m);
    if(project.aiHelper.messages.length>60)project.aiHelper.messages=project.aiHelper.messages.slice(-60);
    return m;
  }
  function clear(project){
    normalizeProject(project);
    project.aiHelper.messages=[];
    project.aiHelper.events.push({time:new Date().toISOString(),type:"chat_cleared"});
    project.aiHelper.conversationId=`aih_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  }
  function setLastField(project,key,label="",value="",type="text",origin="workspace_control"){
    normalizeProject(project);
    project.aiHelper.lastField=key?{key,label,value:String(value??""),type,origin,stage_id:stage(project).id,time:new Date().toISOString()}:null;
  }
  function quickPrompts(project){
    const s=stage(project),path=Paths.selected?Paths.selected(project).name:"your current path";
    const f=currentField(project);
    return [
      {label:"Explain this stage",prompt:`Explain what Stage ${s.id} is asking me to accomplish in beginner-friendly language. Do not write my answers for me.`},
      ...(f?[{label:"Help with this field",prompt:`I am working on the field "${f.label}". Explain what it is asking for, what a strong response needs to include, and ask me one question to help me decide what to write.`}]:[]),
      {label:"Check my thinking",prompt:"Look at my current project context and tell me whether any of my major research decisions seem inconsistent. Explain the issue and ask me what I want to revise."},
      {label:"Summarize my project",prompt:"Summarize the research decisions I have already made so far in plain language. Separate what is decided from what is still missing."},
      {label:`Why ${path}?`,prompt:`Explain why my current research path is "${path}" using the decisions already recorded in my project. If the path may not fit, explain what evidence would change it.`}
    ].slice(0,5);
  }
  return {normalizeProject,stage,stageTitle,stageFields,currentField,coreContext,contextPacket,buildPayload,addMessage,clear,setLastField,quickPrompts};
})();
