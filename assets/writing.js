
window.RMSWriting=(()=>{
  const present=v=>String(v??"").trim().length>0;
  const words=s=>(String(s||"").match(/\b[\w’'-]+\b/g)||[]).length;
  const sentences=s=>(String(s||"").match(/[^.!?]+[.!?]+/g)||[]).length;
  const causal=/\b(caused?|causes?|led to|resulted in|produced|was responsible for|effect of)\b/i;
  const overclaim=/\b(proves?|proved|definitively|guarantees?|establishes beyond doubt|clearly demonstrates)\b/i;
  const discussWords=/\b(because|may be due to|could reflect|suggests that|important|implication|recommend|future research)\b/i;
  const resultWords=/\b(p\s*[<=>]|confidence interval|CI\b|mean\b|median\b|SD\b|standard deviation|t\(|F\(|χ²|chi-square|correlation|r\s*=|rho|odds ratio|effect size|theme)\b/i;

  function normalizeProject(p){
    p.writing=p.writing||{};
    const w=p.writing;
    w.sections=w.sections||{introduction:"",literature:"",method:"",results:"",discussion:"",conclusion:"",abstract:""};
    w.introPlan=w.introPlan||{};
    w.methodPlan=w.methodPlan||{};
    w.resultsPlan=w.resultsPlan||{tables:[],figures:[]};
    w.discussionMap=w.discussionMap||[];
    w.conclusionPlan=w.conclusionPlan||{};
    w.abstractPlan=w.abstractPlan||{};
    w.title=w.title||p.data?.titleDraft||"";
    w.keywords=w.keywords||p.data?.keywords||"";
    w.auditHistory=w.auditHistory||[];
    return p;
  }

  function sourceKey(s){
    let year=String(s.year||"").match(/\b(19|20)\d{2}[a-z]?\b/i)?.[0]||"";
    let auth=String(s.authors||s.citation||"").trim();
    let first=auth.split(/[,;&]/)[0].trim().split(/\s+/).filter(Boolean);
    let surname=first.length?first[first.length-1].replace(/[().]/g,""):"";
    if(!surname && s.citation)surname=String(s.citation).split(/[,(]/)[0].trim();
    return {surname,year,key:(surname&&year)?`${surname.toLowerCase()}|${year.toLowerCase()}`:""};
  }

  function citationAudit(text,sources){
    const sourceKeys=new Map();
    (sources||[]).forEach(source=>{const k=sourceKey(source);if(k.key){if(!sourceKeys.has(k.key))sourceKeys.set(k.key,[]);sourceKeys.get(k.key).push(source)}});
    const found=[],input=String(text||"");
    const make=(fragment,surname,year)=>{
      const key=`${surname.toLowerCase()}|${year.toLowerCase()}`,candidates=sourceKeys.get(key)||[],record=candidates.length===1?candidates[0]:null;
      found.push({text:fragment,surname:surname.toLowerCase(),year:year.toLowerCase(),matched:!!record,ambiguous:candidates.length>1,
        source:record,candidateCount:candidates.length,screeningStatus:record?.screeningStatus||"Not recorded"});
    };
    const parentheses=/\(([^()]{1,350})\)/g;
    for(const group of input.matchAll(parentheses)){
      for(const item of group[1].split(";")){
        const match=item.trim().match(/^([\p{Lu}][\p{L}'’\-]+)(?:\s+et al\.)?(?:\s*&\s*[\p{Lu}][\p{L}'’\-]+)?,\s*((?:19|20)\d{2}[a-z]?)$/u);
        if(match)make(`(${item.trim()})`,match[1],match[2]);
      }
    }
    const narrative=/\b([\p{Lu}][\p{L}'’\-]+)(?:\s+et al\.)?\s+\(((?:19|20)\d{2}[a-z]?)\)/gu;
    for(const match of input.matchAll(narrative))make(match[0],match[1],match[2]);
    const matchedKeys=new Set(found.filter(x=>x.matched).map(x=>`${x.surname}|${x.year}`));
    const unused=(sources||[]).filter(source=>{const key=sourceKey(source).key;return key&&!matchedKeys.has(key)});
    return {found,unmatched:found.filter(x=>!x.matched&&!x.ambiguous),ambiguous:found.filter(x=>x.ambiguous),
      statusToCheck:found.filter(x=>x.matched&&["Pending","Excluded"].includes(x.screeningStatus)),unused};
  }

  function introBlueprint(p){
    const d=p.data||{},map=p.litOutline||[],claims=p.litClaims||[];
    return [
      {job:"Establish the problem and define the central construct(s).",evidence:d.broadTopic||d.topicChoice||d.phenomenon||"",sourceIds:[]},
      {job:"Synthesize what the strongest prior research establishes and where evidence is qualified.",evidence:(map.slice(0,2).map(x=>x.claim).filter(Boolean).join(" | ")||claims.slice(0,3).map(x=>x.text).join(" | ")),sourceIds:[...new Set(map.slice(0,2).flatMap(x=>x.sourceIds||[]))]},
      {job:"Explain a defensible study rationale, such as an unresolved question, methodological limitation, replication need or local context. Do not assume that a literature-wide gap exists.",evidence:d.gapStatement||"",sourceIds:String(d.gapSourceIds||"").split(",").map(x=>x.trim()).filter(Boolean)},
      {job:"State the study purpose, research question, and hypothesis only if appropriate.",evidence:[d.finalRQ,d.researchHyp].filter(Boolean).join(" | "),sourceIds:[]}
    ];
  }

  function methodBlueprint(p){
    const m=p.methods||{},d=p.data||{},v=m.protocolVersions||[],locked=v[v.length-1]||null;
    const x=locked||{
      designType:d.designType,constructs:m.constructs,conditions:m.conditions,design:m.design,sampling:m.sampling,
      measurements:m.measurements,ethics:m.ethics,procedureSteps:m.procedureSteps,schema:p.schema,
      missingRule:d.missingRule,exclusionRule:d.exclusionRule,analysisIntent:d.analysisIntent
    };
    return {
      locked:!!locked,
      design:x.designType||d.designType||"",
      units:x.design?.experimentalUnit||d.experimentalUnit||"",
      sampling:x.sampling||{},
      constructs:x.constructs||[],
      conditions:x.conditions||[],
      measurements:x.measurements||[],
      ethics:x.ethics||{},
      procedure:x.procedureSteps||[],
      schema:x.schema||[],
      missingRule:x.missingRule||"",
      exclusionRule:x.exclusionRule||"",
      analysisIntent:x.analysisIntent||d.analysisChoice||""
    };
  }

  function resultsBlueprint(p){
    const runs=p.analysis?.runs||[];
    return {
      dataset:p.analysis?.fileName||"",
      sample:p.data?.analysisSample||"",
      runs:runs.map((r,i)=>({id:`A${i+1}`,test:r.output?.test||r.structure,summary:r.neutral_summary||"",assumptions:r.assumption_notes||[],config:r.configuration||{}})),
      latest:runs[runs.length-1]||null
    };
  }

  function discussionRequirements(p){
    const type=p.data?.designType||p.data?.questionType||"";
    const req=["Answer the research question within the design and available evidence","Interpret findings that bear on the answer without imposing an arbitrary count","Link interpretations to verifiable results","Compare relevant findings with checked literature","Explain consequential limitations where they affect particular claims","State interpretation boundaries","Offer implications only where the evidence supports them","Close without introducing unsupported new findings"];
    if(/Correlational|observational/i.test(type))req.push("Address plausible confounding, reverse causation, and the non-causal boundary");
    if(/Experimental|Quasi/i.test(type))req.push("Address internal-validity threats, implementation/adherence, and external-validity limits");
    if(/Qualitative/i.test(type))req.push("Address sampling, coding/interpretive decisions, discrepant cases, and transferability");
    return req;
  }

  function sectionAudit(section,text,p){
    const t=String(text||""),issues=[],type=p.data?.designType||"";
    if(present(t)&&words(t)<20)issues.push(["info","Brief draft warrants a content check",`Approximately ${words(t)} words. Check whether the section fulfils its specific purpose; length alone does not determine adequacy.`]);
    if(overclaim.test(t))issues.push(["critical","Overclaiming language detected","Terms such as prove/definitively/guarantee usually exceed what a student study can establish."]);
    if(section==="introduction"){
      if(!present(p.data?.finalRQ))issues.push(["critical","Research question is not locked","The Introduction should end by leading to the actual study question."]);
      const ca=citationAudit(t,p.sources);if(ca.found.length<2)issues.push(["warning","Very few source citations detected","The Introduction normally needs evidence for background and prior-research claims."]);
      if(ca.unmatched.length)issues.push(["critical","Citation(s) do not match the source workspace",ca.unmatched.map(x=>x.text).join(", ")]);
      if(ca.ambiguous.length)issues.push(["warning","Citation matches more than one source record","Verify the exact publication for "+ca.ambiguous.map(x=>x.text).join(", ")]);
      if(ca.statusToCheck.length)issues.push(["info","Cited source status needs review","A pending or excluded source may be appropriate as background, but must not silently enter the included synthesis."]);
    }
    if(section==="literature"){
      const ca=citationAudit(t,p.sources);if(ca.found.length<3)issues.push(["warning","Literature review has few detectable citations","Check that important synthesis claims are supported by the source matrix."]);
      if(ca.unmatched.length)issues.push(["critical","Unmatched literature citation(s)",ca.unmatched.map(x=>x.text).join(", ")]);
      if(ca.ambiguous.length)issues.push(["warning","Citation matches more than one source record","Verify the exact publication for "+ca.ambiguous.map(x=>x.text).join(", ")]);
      if(ca.statusToCheck.length)issues.push(["info","Cited source status needs review","A pending or excluded source may be appropriate as background, but must not silently enter the included synthesis."]);
      const authorOpeners=(t.match(/(?:^|\n)\s*[A-Z][A-Za-z'’\-]+\s+(?:et al\.\s+)?\(\d{4}\)/g)||[]).length;
      if(authorOpeners>=3)issues.push(["warning","Possible source-by-source organization","Several paragraph/sentence starts appear author-led. Check whether paragraphs are organized around ideas and synthesize multiple studies."]);
    }
    if(section==="method"){
      if(/\bwe found|results showed|significant|p\s*[<=>]\b/i.test(t))issues.push(["critical","Results language appears in Method","Method should explain what was planned/done, not what the results were."]);
      const bp=methodBlueprint(p);if(!bp.locked)issues.push(["warning","No saved protocol version","The Method draft is being compared with the live plan. Describe completed work from actual records and report deviations; a dated prospective plan can help distinguish earlier decisions from later changes."]);
    }
    if(section==="results"){
      if(discussWords.test(t))issues.push(["warning","Possible Discussion language in Results","Explanations, importance, mechanisms, recommendations, and future research generally belong in Discussion."]);
      if(!resultWords.test(t))issues.push(["warning","Little statistical/qualitative result language detected","A Results section should report the analyzed evidence, not only general statements."]);
      if(/Correlational|Descriptive/.test(type)&&causal.test(t))issues.push(["critical","Causal wording exceeds the design","Use association, distribution, or difference language unless the design supports causal inference."]);
      if(!(p.analysis?.runs||[]).length)issues.push(["critical","No stored analysis record","Results should be traceable to the Data & Statistics Lab output."]);
    }
    if(section==="discussion"){
      if(!present(p.data?.directAnswer)&&!t.match(/research question|results (suggest|indicate|show)/i))issues.push(["warning","Direct answer is unclear","The Discussion should state the answer to the research question near the beginning."]);
      if(/Correlational|Descriptive/.test(type)&&causal.test(t))issues.push(["critical","Causal interpretation exceeds the design","Statistical significance cannot raise a nonexperimental study to a causal claim."]);
      const ca=citationAudit(t,p.sources);if(p.sources?.length&&ca.unmatched.length)issues.push(["critical","Unmatched literature citation(s) in Discussion",ca.unmatched.map(x=>x.text).join(", ")]);
      if(ca.ambiguous.length)issues.push(["warning","Citation matches more than one source record","Verify the exact publication for "+ca.ambiguous.map(x=>x.text).join(", ")]);
      if(ca.statusToCheck.length)issues.push(["info","Cited source status needs review","A pending or excluded source may be appropriate as background, but must not silently enter the included synthesis."]);
      if(!/\blimit|confound|uncertain|cannot|boundary|generaliz/i.test(t))issues.push(["warning","Interpretive limitations are difficult to find","Explain how specific design features restrict the claims."]);
    }
    if(section==="conclusion"){
      if(/\([A-Z][A-Za-z'’\-]+.*\d{4}\)/.test(t))issues.push(["info","Conclusion contains literature citation(s)","A short empirical-paper conclusion often closes from the paper's own evidence. Check your assignment conventions."]);
      if(overclaim.test(t))issues.push(["critical","Conclusion overclaims certainty","Calibrate the answer to design, sample, measurement, and uncertainty."]);
    }
    if(section==="abstract"){
      if(/\([A-Z][A-Za-z'’\-]+.*\d{4}\)/.test(t))issues.push(["info","Abstract contains citation(s)","Many empirical abstracts omit citations unless a discipline or assignment requires them."]);
      if(!/\b(method|design|sample|participants?|data|analysis|survey|experiment|interview|review)\b/i.test(t))issues.push(["warning","Method information is difficult to find","A stand-alone empirical abstract normally identifies what was done."]);
      if(!resultWords.test(t))issues.push(["warning","Central result is difficult to find","Include the most important result in summarized form."]);
    }
    return {wordCount:words(t),sentenceCount:sentences(t),issues};
  }

  function paperAudit(p){
    normalizeProject(p);const w=p.writing.sections,d=p.data||{},m=p.methods||{},runs=p.analysis?.runs||[],issues=[];
    const sectionNames=["introduction","literature","method","results","discussion","conclusion","abstract"];
    const sectionAudits={};sectionNames.forEach(s=>sectionAudits[s]=sectionAudit(s,w[s],p));
    if(!present(d.finalRQ))issues.push(["critical","Research question missing","The paper cannot be aligned without a final research question."]);
    if(!present(d.designType))issues.push(["critical","Design missing","The Method and claim ceiling depend on the study design."]);
    if(!(m.protocolVersions||[]).length)issues.push(["warning","No saved protocol version","Check the actual procedure and whether a dated plan documents decisions made before evidence collection or analysis."]);
    if(!runs.length)issues.push(["critical","No stored analysis","Results cannot be traced to an analysis record."]);
    if(!present(w.sections.results))issues.push(["critical","Results draft missing","Report what the evidence showed before interpreting it."]);
    if(!present(w.sections.discussion))issues.push(["critical","Discussion draft missing","The paper still needs interpretation, limitations, literature comparison, and implications."]);
    if(/Correlational|Descriptive/.test(d.designType||"")&&causal.test(w.discussion+" "+w.conclusion+" "+w.abstract))issues.push(["critical","Causal claim ceiling violation","Nonexperimental designs should not be described as establishing that X caused Y."]);
    const ca=citationAudit([w.introduction,w.literature,w.discussion].join("\n"),p.sources);
    if(ca.unmatched.length)issues.push(["critical","Paper contains citation(s) without a matching bibliographic record",ca.unmatched.map(x=>x.text).join(", ")]);
    if(ca.ambiguous.length)issues.push(["warning","Citation(s) match more than one source record","Clarify the exact publication for "+ca.ambiguous.map(x=>x.text).join(", ")]);
    if(ca.statusToCheck.length)issues.push(["warning","Cited records require eligibility review","Confirm whether pending or excluded records are being used appropriately as background rather than included synthesis evidence."]);
    const score=Math.max(0,100-issues.filter(x=>x[0]==="critical").length*12-issues.filter(x=>x[0]==="warning").length*5-
      Object.values(sectionAudits).flatMap(x=>x.issues).filter(x=>x[0]==="critical").length*4);
    return {score,label:score>=90?"Few automated concerns identified":score>=75?"Some automated concerns identified":score>=55?"Several areas need review":"Substantial checks remain",issues,sectionAudits,citations:ca};
  }

  function titleAudit(title,p){
    const issues=[],t=String(title||"");
    if(words(t)<5)issues.push(["warning","Title may be too vague","Include the central phenomenon/variables and useful context."]);
    if(words(t)>25)issues.push(["info","Title is long","Check whether every phrase is needed."]);
    if(/Correlational|Descriptive/.test(p.data?.designType||"")&&causal.test(t))issues.push(["critical","Title implies causation","Use relationship/association/descriptive wording for a nonexperimental study."]);
    if(overclaim.test(t))issues.push(["critical","Title overclaims certainty","Avoid proof-like language."]);
    return {issues,wordCount:words(t)};
  }

  function methodOutlineMarkdown(p){
    const b=methodBlueprint(p),lines=["# Method Section Evidence Outline","",`**Design:** ${b.design||""}`,`**Independent/analytic unit:** ${b.units||""}`,""];
    lines.push("## Participants / units and sampling");
    Object.entries(b.sampling||{}).forEach(([k,v])=>{if(present(v))lines.push(`- **${k}:** ${v}`)});
    lines.push("","## Variables / constructs and operational definitions");
    b.constructs.forEach(x=>lines.push(`- **${x.name||"Unnamed"}** — ${x.role||""}: ${x.operational||""}`));
    lines.push("","## Conditions / comparison");b.conditions.forEach(x=>lines.push(`- **${x.name||"Condition"}:** ${x.definition||""}`));
    lines.push("","## Measures / instruments");b.measurements.forEach(x=>lines.push(`- **${x.construct||"Measure"}:** ${x.instrument||""}; ${x.operational||""}; ${x.scale||""}; ${x.timing||""}`));
    lines.push("","## Procedure");b.procedure.forEach((x,i)=>lines.push(`${i+1}. ${x.action||""}${x.record?` Record: ${x.record}.`:""}`));
    lines.push("","## Data handling and analysis",`- Missing-data rule: ${b.missingRule}`,`- Exclusion/outlier rule: ${b.exclusionRule}`,`- Analysis plan: ${b.analysisIntent}`);
    return lines.join("\n");
  }

  function resultsNotesMarkdown(p){
    const b=resultsBlueprint(p),lines=["# Results Evidence Outline","",`**Dataset:** ${b.dataset}`,""];
    b.runs.forEach(x=>{lines.push(`## ${x.id} — ${x.test}`,x.summary,"",...(x.assumptions||[]).map(a=>`- ${a[1]}${a[2]?`: ${a[2]}`:""}`),"")});
    return lines.join("\n");
  }

  function paperMarkdown(p){
    const w=p.writing.sections;
    return [
      `# ${p.writing.title||p.data?.titleDraft||p.name||"Research Paper"}`,"",
      p.writing.keywords?`**Keywords:** ${p.writing.keywords}`:"","",
      "## Abstract","",w.abstract||"","",
      "## Introduction","",w.introduction||"","",
      "## Literature Review","",w.literature||"","",
      "## Method","",w.method||"","",
      "## Results","",w.results||"","",
      "## Discussion","",w.discussion||"","",
      "## Conclusion","",w.conclusion||"","",
      "## Reference verification note","","References should be generated from verified bibliographic records in the source workspace and checked against the required style guide."
    ].join("\n");
  }

  return {normalizeProject,sourceKey,citationAudit,introBlueprint,methodBlueprint,resultsBlueprint,discussionRequirements,sectionAudit,paperAudit,titleAudit,methodOutlineMarkdown,resultsNotesMarkdown,paperMarkdown};
})();
