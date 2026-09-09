window.RMSLocalChatPolicy = (() => {
  "use strict";
  const CFG = window.RMS_LOCAL_CHAT_CONFIG;

  const trim=(x,n=900)=>String(x??"").trim().slice(0,n);
  const present=x=>trim(x).length>0;

  const DIRECT_COMPLETION = /\b(write|fill|complete|do|answer|generate|make)\b.{0,55}\b(for me|my answer|this field|the response|the whole|everything)\b|\bgive me (?:the|an|a) (?:answer|response|research question|hypothesis|method|discussion|conclusion)\b/i;
  const STAT_CALC = /\b(calculate|compute|run|solve|give me)\b.{0,80}\b(p[\s-]?value|pearson|spearman|correlation|t[\s-]?test|anova|chi[\s-]?square|fisher|mcnemar|cochran|regression|confidence interval|effect size)\b/i;
  const FAKE_SOURCE = /\b(make up|invent|fabricate|fake|create)\b.{0,60}\b(citations?|dois?|sources?|articles?|stud(?:y|ies)|references?|papers?)\b/i;
  const FIND_SOURCE = /\b(find|give|provide|search for|recommend)\b.{0,60}\b(citations?|dois?|sources?|articles?|stud(?:y|ies)|references?|papers?)\b/i;
  const SAFETY_REVIEW = /\b(minors?|student participants?|human participants?|interview.{0,20}students?|survey.{0,20}students?|collect.{0,20}names?|medical|health records?|sensitive information|sexual|self[- ]?harm|drugs?|hazardous|pathogens?|blood|body fluids?|strong acids?|strong bases?|fire|flame)\b/i;

  function readProject(){
    try {
      const raw=localStorage.getItem(CFG.projectStorageKey);
      return raw?JSON.parse(raw):null;
    } catch { return null; }
  }

  function focusedField(){
    const el=document.activeElement;
    if(el?.dataset?.field)return el.dataset.field;
    const saved=sessionStorage.getItem("rms_chat_last_field");
    return saved||"";
  }

  function watchFocus(){
    document.addEventListener("focusin",e=>{
      const key=e.target?.dataset?.field;
      if(key)sessionStorage.setItem("rms_chat_last_field",key);
    },true);
  }

  const stageLabels={
    1:"Find a direction",2:"Narrow the topic",3:"Define the problem",4:"Build the research question",
    5:"Plan the literature search",6:"Screen and extract sources",7:"Synthesize the literature",8:"Justify the study",
    9:"Choose the design",10:"Define predictions and variables",11:"Plan sampling and measurement",12:"Lock the method and data plan",
    13:"Collect and organize data",14:"Choose and run analysis",15:"Write Results",16:"Interpret in Discussion",
    17:"Build the full paper",18:"Audit and finalize"
  };

  function fieldLabel(key){
    const labels={
      finalRQ:"research question",questionType:"question type",designType:"research design",
      researchHyp:"research hypothesis",nullHyp:"null hypothesis",predictorIV:"predictor / exposure / independent variable",
      outcomeDV:"outcome / dependent variable",operationalDefs:"operational definitions",
      experimentalUnit:"independent experimental / observational unit",population:"target population or system",
      sample:"actual sample or corpus",samplingMethod:"sampling / selection method",
      analysisChoice:"analysis choice",primaryEstimand:"primary estimand",result1:"main result",
      resultsDraft:"Results draft",discussionDraft:"Discussion draft",conclusionDraft:"Conclusion draft"
    };
    return labels[key]||key||"current field";
  }

  function projectContext(project,includeProject=true){
    if(!includeProject||!project)return {
      stage:{id:null,label:"No current project context"},
      focusedField:null,decisions:[],sources:[]
    };
    const d=project.data||{}, stageId=Number(project.currentStage)||1, key=focusedField();
    const decisions=[
      ["Topic",d.topicChoice||d.broadTopic],
      ["Research question",d.finalRQ],
      ["Question type",d.questionType],
      ["Design",d.designType],
      ["Claim boundary",d.claimBoundary],
      ["Predictor / exposure",d.predictorIV],
      ["Outcome",d.outcomeDV],
      ["Independent unit",d.experimentalUnit],
      ["Population / system",d.population],
      ["Sample / corpus",d.sample],
      ["Sampling / selection",d.samplingMethod],
      ["Primary estimand",d.primaryEstimand],
      ["Analysis",d.analysisChoice],
      ["Main result",d.result1],
      ["Current direct answer",d.directAnswer]
    ].filter(([,v])=>present(v)).slice(0,12).map(([label,value])=>({label,value:trim(value,700)}));

    const sources=(project.sources||[]).slice(0,8).map(s=>({
      citation:trim(s.citation||s.title,350),
      finding:trim(s.finding,450),
      limitations:trim(s.limits,350),
      verified:!!s.verified
    })).filter(s=>s.citation);

    return {
      stage:{id:stageId,label:stageLabels[stageId]||`Stage ${stageId}`},
      focusedField:key?{
        key,label:fieldLabel(key),value:trim(d[key],1200),hasAttempt:present(d[key])
      }:null,
      decisions,sources
    };
  }

  function guard(question,context){
    const q=trim(question,5000);
    const field=context?.focusedField;

    if(STAT_CALC.test(q)){
      return {
        kind:"statistics_guard",scaffoldLevel:0,
        message:"I can help you choose an analysis or interpret an output, but numerical inferential calculations should come from the Data & Statistics Lab so the project has one reproducible calculation record. Open the Data & Statistics Lab, run the analysis there, then bring the output back here if you want help interpreting it.",
        action:{label:"Open Data & Statistics Lab",targetId:"dataLab"}
      };
    }

    if(FAKE_SOURCE.test(q)){
      return {
        kind:"source_integrity_guard",scaffoldLevel:0,
        message:"I cannot invent a citation, DOI, article, or study. Use the Literature Workspace to record a real source. If you already have a source, I can help you understand or evaluate the information you recorded from it.",
        action:{label:"Open Literature Workspace",targetId:"litLab"}
      };
    }

    if(FIND_SOURCE.test(q) && !context?.sources?.length){
      return {
        kind:"source_search_guard",scaffoldLevel:0,
        message:"This local Research Chat does not search the internet, so I should not pretend to find or verify sources. Use your class-approved literature-search tools, then add the real source to the Literature Workspace. I can help you build search terms or evaluate a source you have.",
        action:{label:"Open Literature Workspace",targetId:"litLab"}
      };
    }

    if(field && !field.hasAttempt && DIRECT_COMPLETION.test(q)){
      return {
        kind:"authorship_guard",scaffoldLevel:1,
        message:`You have not recorded an attempt yet for “${field.label}.” I can help you build it, but I should not make that research decision before you try. Write your best first attempt, even if it feels incomplete. Then ask me to check it. If you are completely stuck, ask “What questions should I answer to build this?”`
      };
    }

    if(SAFETY_REVIEW.test(q)){
      return {
        kind:"teacher_review_guard",scaffoldLevel:0,
        message:"This question may involve participants, privacy, sensitive information, or a potentially hazardous procedure. Keep the idea in planning mode and ask your teacher to review the ethics, authority, privacy, and safety requirements before collecting data or carrying out the procedure."
      };
    }

    return null;
  }

  function systemPrompt(context){
    const stage=context?.stage?.id?`The student is in Stage ${context.stage.id}, ${context.stage.label}.`:"No project stage is supplied.";
    const field=context?.focusedField
      ? `The focused field is ${context.focusedField.label}. The current response is ${context.focusedField.hasAttempt?JSON.stringify(context.focusedField.value):"blank"}.`
      : "No specific field is focused.";

    const decisions=(context?.decisions||[]).map(x=>`${x.label}: ${x.value}`).join("\n")||"No accumulated decisions supplied.";
    const sources=(context?.sources||[]).map((s,i)=>`Source ${i+1}: ${s.citation}\nRecorded finding: ${s.finding||"not recorded"}\nRecorded limitation: ${s.limitations||"not recorded"}\nBibliographic record checked: ${s.verified?"yes":"no"}`).join("\n\n")||"No source records supplied.";

    return `You are Research Chat inside a secondary-school Research Methods Studio.\n\nYour role is to explain research concepts, clarify instructions, ask useful reasoning questions, summarize recorded decisions, and give bounded feedback on student attempts.\n\nRules you must follow\n- Preserve student authorship. If a current research decision is blank, teach the decision and ask questions. Do not produce a submission-ready answer for the student.\n- If an attempt exists, you may identify strengths, gaps, and specific revisions.\n- Do not invent studies, citations, authors, DOIs, quotations, findings, sample sizes, data, or statistical results.\n- You cannot search the web.\n- Do not calculate new inferential statistics. Explain concepts and interpretation only.\n- Do not strengthen causal claims beyond the recorded design.\n- Treat source records below as notes supplied by the student. Use only those records for source-specific claims and state when evidence is missing.\n- If human participants, sensitive information, authority, or hazardous procedures are involved, tell the student teacher/school review is required.\n- Define unfamiliar research terminology in plain English.\n- Keep the answer concise and actionable, normally under 180 words.\n- Do not pretend to be authoritative. This is a small local model and the student should check consequential method decisions against the deterministic Studio guidance and their teacher.\n\n${stage}\n${field}\n\nRecorded project decisions\n${decisions}\n\nRecorded literature notes\n${sources}`;
  }

  function sanitizeModelText(text){
    let x=trim(text,5000);
    x=x.replace(/<\|(?:im_start|im_end|endoftext)\|>/g,"").trim();
    x=x.replace(/^(assistant|research chat)\s*:\s*/i,"");
    return x||"I could not produce a useful answer. Try asking a shorter, more specific research-method question.";
  }

  watchFocus();
  return {readProject,focusedField,projectContext,guard,systemPrompt,sanitizeModelText,fieldLabel};
})();
