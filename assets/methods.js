
window.RMSMethods = (() => {
  function normalizeProject(project){
    project.methods = project.methods || {};
    const m=project.methods;
    m.constructs = m.constructs || [];
    m.conditions = m.conditions || [];
    m.controlled = m.controlled || [];
    m.confounders = m.confounders || [];
    m.measurements = m.measurements || [];
    m.procedureSteps = m.procedureSteps || [];
    m.protocolVersions = m.protocolVersions || [];
    m.audit = m.audit || {};
    m.sampling = m.sampling || {};
    m.ethics = m.ethics || {};
    m.design = m.design || {};
    return project;
  }

  const present=v=>String(v??"").trim().length>0;

  function designProfile(project){
    const d=project.data||{}, m=project.methods||{};
    const type=d.designType||m.design?.type||"Undecided";
    const isExp=/^Experimental$/i.test(type);
    const isQuasi=/Quasi-experimental/i.test(type);
    const isObs=/Correlational|observational/i.test(type);
    const isDesc=/Descriptive/i.test(type);
    const isQual=/Qualitative/i.test(type);
    const isReview=/Literature review|Meta-analysis/i.test(type);
    return {type,isExp,isQuasi,isObs,isDesc,isQual,isReview,human:m.ethics?.humanParticipants==="yes"};
  }

  function roleOptions(project){
    const p=designProfile(project);
    if(p.isExp) return ["Manipulated independent variable","Outcome / dependent variable","Covariate","Blocking/stratification variable","Process/fidelity measure","Identifier","Other"];
    if(p.isQuasi) return ["Intervention / evaluated exposure","Manipulated independent variable","Outcome / dependent variable","Covariate","Blocking/stratification variable","Process/fidelity measure","Identifier","Other"];
    if(p.isObs) return ["Predictor / exposure","Outcome","Covariate / potential confounder","Moderator","Identifier","Other"];
    if(p.isDesc) return ["Descriptive variable","Grouping/context variable","Identifier","Other"];
    if(p.isQual) return ["Participant/context descriptor","Interview/observation domain","Identifier","Other"];
    return ["Variable / construct","Identifier","Other"];
  }

  function inferStructure(project){
    const m=project.methods||{}, d=m.design||{};
    const sameUnit=d.sameUnitAllConditions==="yes";
    const assigned=d.assignment||"";
    const unit=d.experimentalUnit||project.data.experimentalUnit||"";
    let structure="Not yet determined";
    if(sameUnit) structure="Repeated-measures / within-unit";
    else if(/nonrandom|non-random/i.test(assigned)) structure="Nonrandom assigned between-unit";
    else if(/naturally|observed|existing/i.test(assigned)) structure="Observed exposure; no researcher assignment";
    else if(/random/i.test(assigned)) structure="Randomized between-unit";
    else if(/single-group|no assignment/i.test(assigned)) structure="Single-group / no assignment";
    else if(/not applicable/i.test(assigned)) structure="Not applicable";
    return {structure,unit};
  }

  function auditDesign(project){
    const m=project.methods||{}, d=m.design||{}, p=designProfile(project), issues=[], good=[];
    const constructs=m.constructs||[];
    const roles=constructs.map(x=>x.role||"");
    if(p.isExp || p.isQuasi){
      if(p.isExp && !roles.includes("Manipulated independent variable")) issues.push(["critical","Manipulated factor missing","An experiment needs a clearly identified factor assigned or manipulated by the researcher."]);
      if(p.isQuasi && !roles.some(role=>["Intervention / evaluated exposure","Manipulated independent variable"].includes(role))) issues.push(["critical","Intervention or exposure missing","Identify the intervention or policy change being evaluated. Quasi-experimental comparisons do not require random assignment, but need an appropriate comparison or time structure."]);
      if(!roles.includes("Outcome / dependent variable")) issues.push(["critical","Outcome missing","The study needs a measured response that answers the research question."]);
      if(!present(d.experimentalUnit)) issues.push(["critical","Experimental unit missing","Without the independently assigned unit, replication and independence cannot be evaluated."]);
      if(d.sameUnitAllConditions==="yes" && !present(d.orderPlan)) issues.push(["warning","Order/carryover plan missing","When the same unit receives multiple conditions, order, practice, fatigue, and carryover need consideration."]);
      if(d.sameUnitAllConditions!=="yes" && !present(d.assignment)) issues.push(["warning","Assignment process not specified","State how units reach conditions. Random assignment, nonrandom assignment, and naturally occurring exposure support different claims."]);
      if((m.conditions||[]).length<2) issues.push(["critical","Comparison structure incomplete","A causal comparison requires at least two levels/conditions or a justified baseline/reference structure."]);
    }
    if(p.isObs){
      if(roles.includes("Manipulated independent variable")) issues.push(["critical","Role terminology mismatch","The selected design is observational, so a measured predictor/exposure should not be labelled as a manipulated independent variable."]);
      if(!roles.includes("Predictor / exposure")) issues.push(["warning","Predictor/exposure missing","Identify the measured explanatory variable if the question concerns an association."]);
      if(!roles.includes("Outcome")) issues.push(["warning","Outcome missing","Identify what response is measured for the same observational unit."]);
    }
    if(p.isDesc && roles.some(x=>/Outcome|independent|Predictor/.test(x))) issues.push(["warning","Descriptive design may be over-structured","A purely descriptive question does not require causal predictor/outcome roles."]);
    if(p.isQual && roles.some(x=>/independent|Outcome \/ dependent/.test(x))) issues.push(["warning","Qualitative work is being forced into IV/DV language","Use participant/context descriptors, prompts, observations, codes, and units of qualitative analysis instead."]);
    if(present(d.experimentalUnit)) good.push("A primary study unit is recorded; confirm whether it is assigned to conditions, measured, or analysed.");
    if(present(d.assignment)) good.push("Assignment/exposure process is recorded.");
    if(present(d.primaryOutcome)) good.push("Primary outcome is recorded; check whether it was specified before the outcomes were examined.");
    return {issues,good,profile:p,structure:inferStructure(project)};
  }

  function auditReplication(project){
    const m=project.methods||{}, d=m.design||{}, issues=[];
    const nUnits=Number(d.independentUnits||0), repeats=Number(d.repeatsPerUnit||0), subs=Number(d.subsamplesPerUnit||0);
    if(nUnits<=0) issues.push(["warning","Independent-unit count missing","Record how many independent units are assigned/observed."]);
    if((repeats>1 || subs>1) && nUnits>0){
      issues.push(["info","Repeated/subsample observations detected",`${repeats||1} repeated measurement(s) and ${subs||1} subsample(s) per unit do not automatically multiply the number of independent units beyond ${nUnits}.`]);
    }
    if(d.rowUnit && d.experimentalUnit && d.rowUnit.trim()!==d.experimentalUnit.trim()){
      issues.push(["warning","Spreadsheet row may not equal independent unit","That can be correct, but the analysis must preserve the nesting/repeated structure rather than treating every row as independent."]);
    }
    if(d.sameUnitAllConditions==="yes" && nUnits>0) issues.push(["info","Within-unit design",`The same ${d.experimentalUnit||"unit"} contributes observations under multiple conditions. Pairing/repeated structure must be retained in the analysis.`]);
    return {issues,nUnits,repeats,subs};
  }

  function auditSampling(project){
    const s=(project.methods||{}).sampling||{}, issues=[], good=[];
    if(!present(s.population)) issues.push(["warning","Target population/system missing","State the broader population or system the research question refers to."]);
    if(!present(s.sample)) issues.push(["critical","Planned or observed sample missing","For proposed work, specify the planned sample or corpus. For completed work, report the people, organisms, records or documents actually studied."]);
    if(!present(s.method)) issues.push(["warning","Sampling method missing","Convenience, probability, purposive or census sampling can support different claims about the wider population."]);
    if(!present(s.frame) && /random|stratified|systematic/i.test(s.method||"") && !/nonrandom|non-random/i.test(s.method||"")) issues.push(["warning","Sampling frame missing","Probability-style sampling requires a defined list/frame or mechanism from which units can actually be sampled."]);
    if(!present(s.inclusion)) issues.push(["info","Inclusion criteria not recorded","State which units qualify before seeing outcomes."]);
    if(!present(s.exclusion)) issues.push(["info","Exclusion criteria not recorded","Separate eligibility exclusions from later data-quality exclusions."]);
    if(!present(s.recruitment) && (project.methods?.ethics?.humanParticipants==="yes")) issues.push(["warning","Recruitment route missing","Human-participant recruitment can introduce coercion or selection bias."]);
    if(present(s.generalization)) good.push("A generalisation or transferability boundary is recorded for review.");
    else issues.push(["warning","Scope of conclusions missing","Explain which populations, settings or cases the evidence may inform and where generalisation or transferability remains uncertain."]);
    if(/convenience/i.test(s.method||"")) issues.push(["info","Convenience sampling","This may be appropriate for a student project, but broad population generalisation should be limited."]);
    return {issues,good};
  }

  function auditMeasurements(project){
    const ms=(project.methods||{}).measurements||[], issues=[];
    if(!ms.length){
      const p=designProfile(project);
      if(p.isReview) issues.push(["info","Review evidence plan to check","Specify how sources will be selected, information extracted and evidence synthesised in the appropriate review fields; participant measurements are not automatically required."]);
      else if(p.isQual) issues.push(["warning","Qualitative evidence procedure missing","Describe how interviews, observations, documents or other qualitative records will be collected and interpreted, without forcing them into numerical measurement categories."]);
      else issues.push(["critical","No measurement plan","Describe how each central outcome or construct will be measured, scored or recorded."]);
    }
    ms.forEach((x,i)=>{
      const lab=x.construct||`Measure ${i+1}`;
      if(!present(x.operational)) issues.push(["critical",`${lab}: operational definition missing`,"State exactly what will be counted, scored, measured, coded, or manipulated."]);
      if(!present(x.instrument)) issues.push(["warning",`${lab}: instrument/procedure missing`,"State the tool, rubric, sensor, survey, test, interview, observation rule, or data source."]);
      if(!present(x.scale)) issues.push(["warning",`${lab}: unit/scale missing`,"Give units, score range, response categories, or coding structure."]);
      if(!present(x.timing)) issues.push(["info",`${lab}: timing/frequency missing`,"State when and how often the measurement occurs."]);
      if(!present(x.reliability)) issues.push(["warning",`${lab}: reliability/consistency plan missing`,"Explain repeated calibration, scorer agreement, standardised administration, internal consistency evidence, or another relevant consistency check."]);
      if(!present(x.validity)) issues.push(["warning",`${lab}: validity evidence missing`,"Explain why this measurement supports the interpretation required by the research question."]);
    });
    return {issues,count:ms.length};
  }

  function ethicsRoute(project){
    const e=(project.methods||{}).ethics||{}, issues=[], status="clear";
    let level=status;
    const elevate=x=>{ if(x==="do_not_facilitate") level=x; else if(level==="clear") level=x; };
    if(!["yes","no"].includes(e.humanParticipants)) {
      elevate("teacher_review");
      issues.push(["warning","Human participation not classified","Determine whether the project involves people or linkable human records before deciding which permissions and privacy protections apply."]);
    }
    if(e.humanParticipants==="yes"){
      elevate("teacher_review");
      if(!present(e.consent)) issues.push(["critical","Consent/permission plan missing","Document the required school or institutional review and consent or permission process before recruitment or collection. A written plan is not evidence that approval was granted."]);
      if(e.minors==="yes" && !present(e.assent)) issues.push(["critical","Minor participant assent/permission plan missing","Before recruitment, check the required student assent and parent/guardian permission arrangements with the responsible school or institution. A completed text field is not proof of approval."]);
      if(e.identifiable==="yes" && !present(e.deidentification)) issues.push(["critical","Identifiable data protection missing","Collect the least identifying information necessary and define access/storage/deidentification rules."]);
      if(e.sensitive==="yes") {elevate("teacher_review"); issues.push(["warning","Sensitive information","The project requires heightened privacy, necessity, and approval review."]); }
      if(e.intervention==="yes" && !present(e.authority)) issues.push(["critical","Authority to implement intervention not documented","Do not begin a participant intervention merely because classroom access is available. Identify who may authorise the intervention and what review must occur first."]);
    }
    const text=[e.risks,e.procedureRisk,project.data.finalRQ].join(" ");
    if(/\b(sleep deprivation|sleep less|skip sleep|self[- ]harm|injury|pain induction|medication dose|prescription|dangerous exercise)\b/i.test(text)){
      level="do_not_facilitate";
      issues.push(["critical","Unsafe manipulation route","Do not facilitate a student experiment that deliberately creates harmful or medically sensitive exposure. Use safe observation, secondary data, or literature instead."]);
    }
    if(!present(e.withdrawal) && e.humanParticipants==="yes") issues.push(["warning","Withdrawal/voluntariness plan missing","Explain that participation is voluntary and how withdrawal will be handled without penalty where applicable."]);
    if(!present(e.storage)) issues.push(["info","Data storage plan missing","State where records will be stored, who can access them, and how retention, deletion or secure archiving will be managed."]);
    return {status:level,issues};
  }

  function procedureAudit(project){
    const steps=(project.methods||{}).procedureSteps||[], issues=[];
    if(steps.length<3) issues.push(["warning","Procedure may be under-specified","Describe the selection or setup, evidence collection, recording and handling decisions in enough detail to follow them. An exact number of steps does not establish reproducibility."]);
    steps.forEach((s,i)=>{
      if(!present(s.action)) issues.push(["critical",`Step ${i+1} has no action`,"State exactly what occurs."]);
      if(!present(s.record)) issues.push(["info",`Step ${i+1} does not say what is recorded`,"If this step produces data or a protocol decision, name the record."]);
    });
    const hasConsent=steps.some(s=>/consent|assent|permission/i.test(s.action||""));
    if(project.methods?.ethics?.humanParticipants==="yes"){
      if(!hasConsent) issues.push(["warning","Human-participant procedure has no consent/permission step","Show required review, consent and permission before recruitment or research collection, following the applicable school or institutional rules."]);
      const firstPermission=steps.findIndex(step=>/consent|assent|permission|approval/i.test(step.action||""));
      const firstCollection=steps.findIndex(step=>/interview|survey|measure|record responses|collect data|extract grade|assign treatment/i.test(step.action||""));
      if(firstCollection>=0 && firstPermission>=0 && firstPermission>firstCollection) issues.push(["critical","Permission appears after research collection","The listed procedure places collection before a permission or review step. Confirm the correct order and required approvals before approaching participants."]);
    }
    return {issues,count:steps.length};
  }

  function dataSchemaAudit(project){
    const schema=project.schema||[], d=(project.methods||{}).design||{}, issues=[];
    const profile=designProfile(project);
    if(!schema.length){
      if(profile.isQual) issues.push(["warning","Qualitative record structure missing","Define how interviews, observations, documents, codes or other evidence will be identified and linked to interpretations. A spreadsheet is not mandatory."]);
      else issues.push(["critical","No data dictionary columns","Define the recorded variables or extraction fields before data collection or review extraction."]);
    }
    const names=schema.map(x=>String(x.name||"").trim()).filter(Boolean);
    if(new Set(names).size!==names.length) issues.push(["critical","Duplicate column names","Each variable should have a unique machine-readable column name."]);
    schema.forEach((x,i)=>{
      if(!present(x.name)) issues.push(["critical",`Column ${i+1} has no name`,"Give every field a unique variable name."]);
      if(!present(x.definition)) issues.push(["warning",`${x.name||`Column ${i+1}`}: definition missing`,"Record the operational meaning, units or categories, allowable codes and any missing-value rule."]);
      if(["0","0.0"].includes(String(x.missing||"").trim()) && /Numeric|Count|Binary|Ordinal/i.test(String(x.type||""))) issues.push(["warning",`${x.name||`Column ${i+1}`}: zero used as a missing code`,"Check whether zero is a valid observed value. Preserve missing status separately when zero can represent a genuine measurement or category."]);
    });
    if(!present(d.rowUnit)){
      if(profile.isQual && !schema.length) issues.push(["info","Evidence-record unit not described","Describe how each interview, observation, document or excerpt will be identified and linked, even when there is no data table."]);
      else issues.push(["critical","Row unit missing","Define the meaning of one row or extracted record, including how it links to a participant, study, occasion or assigned unit."]);
    }
    if(present(d.rowUnit) && present(d.experimentalUnit) && d.rowUnit!==d.experimentalUnit){
      issues.push(["warning","Row and study unit differ","This may be correct. Explain how row IDs link observations to the assigned or observed unit, including repeated or nested records, before choosing an analysis."]);
    }
    return {issues,count:schema.length};
  }

  function readiness(project){
    normalizeProject(project);
    const sections = {
      design:auditDesign(project),
      replication:auditReplication(project),
      sampling:auditSampling(project),
      measurement:auditMeasurements(project),
      ethics:ethicsRoute(project),
      procedure:procedureAudit(project),
      data:dataSchemaAudit(project)
    };
    const all=Object.values(sections).flatMap(x=>x.issues||[]);
    const critical=all.filter(x=>x[0]==="critical").length;
    const warning=all.filter(x=>x[0]==="warning").length;
    const info=all.filter(x=>x[0]==="info").length;
    const score=Math.max(0,100-critical*15-warning*6-info*2);
    return {
      score,
      label: sections.ethics.status==="do_not_facilitate" ? "Unsafe procedure requires a safer design" : critical ? "Critical issues remain in the method plan" : sections.ethics.status==="teacher_review" ? "Institutional or teacher review required" : warning ? "Review the method plan's warnings" : "No issues detected by this rule set",
      critical,warning,info,sections,
      ethicsStatus:sections.ethics.status
    };
  }

  function protocolSnapshot(project){
    const d=project.data||{}, m=project.methods||{};
    return {
      lockedAt:new Date().toISOString(),
      researchQuestion:d.finalRQ||"",
      designType:d.designType||"",
      hypothesis:d.researchHyp||"",
      constructs:m.constructs||[],
      conditions:m.conditions||[],
      design:m.design||{},
      controlled:m.controlled||[],
      confounders:m.confounders||[],
      sampling:m.sampling||{},
      measurements:m.measurements||[],
      ethics:m.ethics||{},
      procedureSteps:m.procedureSteps||[],
      schema:project.schema||[],
      missingRule:d.missingRule||"",
      exclusionRule:d.exclusionRule||"",
      analysisIntent:d.analysisIntent||""
    };
  }

  function csvTemplate(project){
    const schema=project.schema||[];
    const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;
    return schema.map(x=>quote(x.name)).join(",")+"\n";
  }

  function dictionaryCSV(project){
    const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;
    const rows=[["Variable","Type","Role","Definition / unit / coding","Missing code"]];
    (project.schema||[]).forEach(x=>rows.push([x.name,x.type,x.role||"",x.definition,x.missing||""]));
    return rows.map(r=>r.map(quote).join(",")).join("\n");
  }

  function methodMarkdown(project){
    const d=project.data||{},m=project.methods||{}, r=readiness(project);
    const lines=[
      "# Method Planning Record","",
      d.finalRQ?`**Research question:** ${d.finalRQ}`:"",
      d.designType?`**Design:** ${d.designType}`:"",
      `**Planning diagnostic (not research approval):** ${r.score}/100 — ${r.label}`,"",
      "## Constructs and variables"
    ];
    (m.constructs||[]).forEach(x=>lines.push(`- **${x.name||"Unnamed"}** — ${x.role||""}. ${x.operational||""}`));
    lines.push("","## Conditions / comparison");
    (m.conditions||[]).forEach(x=>lines.push(`- ${x.name||"Condition"}: ${x.definition||""}`));
    lines.push("","## Design structure");
    Object.entries(m.design||{}).forEach(([k,v])=>{if(present(v))lines.push(`- **${k}:** ${v}`)});
    lines.push("","## Sampling");
    Object.entries(m.sampling||{}).forEach(([k,v])=>{if(present(v))lines.push(`- **${k}:** ${v}`)});
    lines.push("","## Measurement plan");
    (m.measurements||[]).forEach(x=>lines.push(`### ${x.construct||"Measure"}\n- Instrument: ${x.instrument||""}\n- Operational definition: ${x.operational||""}\n- Scale/unit: ${x.scale||""}\n- Timing: ${x.timing||""}\n- Reliability/consistency: ${x.reliability||""}\n- Validity evidence: ${x.validity||""}\n`));
    lines.push("## Ethics and safety");
    Object.entries(m.ethics||{}).forEach(([k,v])=>{if(present(v))lines.push(`- **${k}:** ${v}`)});
    lines.push("","## Procedure");
    (m.procedureSteps||[]).forEach((x,i)=>lines.push(`${i+1}. **${x.phase||"Step"}** — ${x.action||""} ${x.record?`Record: ${x.record}.`:""} ${x.deviation?`Deviation rule: ${x.deviation}.`:""}`));
    lines.push("","## Data dictionary");
    (project.schema||[]).forEach(x=>lines.push(`- **${x.name}** (${x.type}${x.role?`, ${x.role}`:""}): ${x.definition||""}`));
    lines.push("","## Planned data handling",`- Missing data: ${d.missingRule||""}`,`- Exclusion/outlier rule: ${d.exclusionRule||""}`,`- Analysis intent: ${d.analysisIntent||""}`);
    return lines.filter(Boolean).join("\n");
  }

  return {
    normalizeProject,designProfile,roleOptions,inferStructure,auditDesign,auditReplication,
    auditSampling,auditMeasurements,ethicsRoute,procedureAudit,dataSchemaAudit,readiness,
    protocolSnapshot,csvTemplate,dictionaryCSV,methodMarkdown
  };
})();
