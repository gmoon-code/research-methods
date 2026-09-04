
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
    const type=d.designType||m.design.type||"Undecided";
    const isExp=/^Experimental$/i.test(type);
    const isQuasi=/Quasi-experimental/i.test(type);
    const isObs=/Correlational|observational/i.test(type);
    const isDesc=/Descriptive/i.test(type);
    const isQual=/Qualitative/i.test(type);
    const isReview=/Literature review|Meta-analysis/i.test(type);
    return {type,isExp,isQuasi,isObs,isDesc,isQual,isReview,human:!!m.ethics.humanParticipants};
  }

  function roleOptions(project){
    const p=designProfile(project);
    if(p.isExp || p.isQuasi) return ["Manipulated independent variable","Outcome / dependent variable","Covariate","Blocking/stratification variable","Process/fidelity measure","Identifier","Other"];
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
    else if(/random/i.test(assigned)) structure="Randomized between-unit";
    else if(/nonrandom|natural|existing/i.test(assigned)) structure="Nonrandom between-unit / observational";
    return {structure,unit};
  }

  function auditDesign(project){
    const m=project.methods||{}, d=m.design||{}, p=designProfile(project), issues=[], good=[];
    const constructs=m.constructs||[];
    const roles=constructs.map(x=>x.role||"");
    if(p.isExp || p.isQuasi){
      if(!roles.includes("Manipulated independent variable")) issues.push(["critical","Manipulated factor missing","An experimental or quasi-experimental design needs a clearly identified factor that is deliberately varied."]);
      if(!roles.includes("Outcome / dependent variable")) issues.push(["critical","Outcome missing","The study needs a measured response that answers the research question."]);
      if(!present(d.experimentalUnit)) issues.push(["critical","Experimental unit missing","Without the independently assigned unit, replication and independence cannot be evaluated."]);
      if(d.sameUnitAllConditions==="yes" && !present(d.orderPlan)) issues.push(["warning","Order/carryover plan missing","When the same unit receives multiple conditions, order, practice, fatigue, and carryover need consideration."]);
      if(d.sameUnitAllConditions!=="yes" && d.assignment==="") issues.push(["warning","Assignment process not specified","State how units reach conditions. Random assignment, nonrandom assignment, and naturally occurring exposure support different claims."]);
      if((m.conditions||[]).length<2) issues.push(["critical","Comparison structure incomplete","A causal comparison requires at least two levels/conditions or a justified baseline/reference structure."]);
    }
    if(p.isObs){
      if(roles.includes("Manipulated independent variable")) issues.push(["critical","Role terminology mismatch","The selected design is observational, so a measured predictor/exposure should not be labeled as a manipulated independent variable."]);
      if(!roles.includes("Predictor / exposure")) issues.push(["warning","Predictor/exposure missing","Identify the measured explanatory variable if the question concerns an association."]);
      if(!roles.includes("Outcome")) issues.push(["warning","Outcome missing","Identify what response is measured for the same observational unit."]);
    }
    if(p.isDesc && roles.some(x=>/Outcome|independent|Predictor/.test(x))) issues.push(["warning","Descriptive design may be over-structured","A purely descriptive question does not require causal predictor/outcome roles."]);
    if(p.isQual && roles.some(x=>/independent|Outcome \/ dependent/.test(x))) issues.push(["warning","Qualitative work is being forced into IV/DV language","Use participant/context descriptors, prompts, observations, codes, and units of qualitative analysis instead."]);
    if(present(d.experimentalUnit)) good.push("Unit of assignment/analysis is explicitly recorded.");
    if(present(d.assignment)) good.push("Assignment/exposure process is recorded.");
    if(present(d.primaryOutcome)) good.push("Primary outcome is identified before analysis.");
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
    if(!present(s.sample)) issues.push(["critical","Actual sample missing","State exactly who or what will actually be studied."]);
    if(!present(s.method)) issues.push(["warning","Sampling method missing","Convenience, probability, purposive, census, or another method affects the scope of generalization."]);
    if(!present(s.frame) && /random|stratified|systematic/i.test(s.method||"")) issues.push(["warning","Sampling frame missing","Probability-style sampling requires a defined list/frame or mechanism from which units can actually be sampled."]);
    if(!present(s.inclusion)) issues.push(["info","Inclusion criteria not recorded","State which units qualify before seeing outcomes."]);
    if(!present(s.exclusion)) issues.push(["info","Exclusion criteria not recorded","Separate eligibility exclusions from later data-quality exclusions."]);
    if(!present(s.recruitment) && (project.methods?.ethics?.humanParticipants==="yes")) issues.push(["warning","Recruitment route missing","Human-participant recruitment can introduce coercion or selection bias."]);
    if(present(s.generalization)) good.push("Generalization boundary is explicitly stated.");
    else issues.push(["warning","Generalization boundary missing","Explain what the sample can reasonably represent and what it cannot."]);
    if(/convenience/i.test(s.method||"")) issues.push(["info","Convenience sampling","This may be appropriate for a student project, but broad population generalization should be limited."]);
    return {issues,good};
  }

  function auditMeasurements(project){
    const ms=(project.methods||{}).measurements||[], issues=[];
    if(!ms.length) issues.push(["critical","No measurement plan","Every construct central to the research question must have a measurement, scoring, observation, or manipulation rule."]);
    ms.forEach((x,i)=>{
      const lab=x.construct||`Measure ${i+1}`;
      if(!present(x.operational)) issues.push(["critical",`${lab}: operational definition missing`,"State exactly what will be counted, scored, measured, coded, or manipulated."]);
      if(!present(x.instrument)) issues.push(["warning",`${lab}: instrument/procedure missing`,"State the tool, rubric, sensor, survey, test, interview, observation rule, or data source."]);
      if(!present(x.scale)) issues.push(["warning",`${lab}: unit/scale missing`,"Give units, score range, response categories, or coding structure."]);
      if(!present(x.timing)) issues.push(["info",`${lab}: timing/frequency missing`,"State when and how often the measurement occurs."]);
      if(!present(x.reliability)) issues.push(["warning",`${lab}: reliability/consistency plan missing`,"Explain repeated calibration, scorer agreement, standardized administration, internal consistency evidence, or another relevant consistency check."]);
      if(!present(x.validity)) issues.push(["warning",`${lab}: validity evidence missing`,"Explain why this measurement supports the interpretation required by the research question."]);
    });
    return {issues,count:ms.length};
  }

  function ethicsRoute(project){
    const e=(project.methods||{}).ethics||{}, issues=[], status="clear";
    let level=status;
    const elevate=x=>{ if(x==="do_not_facilitate") level=x; else if(level==="clear") level=x; };
    if(e.humanParticipants==="yes"){
      elevate("teacher_review");
      if(!present(e.consent)) issues.push(["critical","Consent/permission plan missing","Human-participant research generally requires an appropriate consent/permission route before collection."]);
      if(e.minors==="yes" && !present(e.assent)) issues.push(["critical","Minor participant assent/permission plan missing","Student projects involving minors require teacher/institutional guidance on assent and parent/guardian permission requirements."]);
      if(e.identifiable==="yes" && !present(e.deidentification)) issues.push(["critical","Identifiable data protection missing","Collect the least identifying information necessary and define access/storage/deidentification rules."]);
      if(e.sensitive==="yes") {elevate("teacher_review"); issues.push(["warning","Sensitive information","The project requires heightened privacy, necessity, and approval review."]); }
      if(e.intervention==="yes" && !present(e.authority)) issues.push(["critical","Authority to implement intervention not documented","A student cannot assume authority to assign classmates or alter school procedures."]);
    }
    const text=[e.risks,e.procedureRisk,project.data.finalRQ].join(" ");
    if(/\b(sleep deprivation|sleep less|skip sleep|self[- ]harm|injury|pain induction|medication dose|prescription|dangerous exercise)\b/i.test(text)){
      level="do_not_facilitate";
      issues.push(["critical","Unsafe manipulation route","Do not facilitate a student experiment that deliberately creates harmful or medically sensitive exposure. Use safe observation, secondary data, or literature instead."]);
    }
    if(!present(e.withdrawal) && e.humanParticipants==="yes") issues.push(["warning","Withdrawal/voluntariness plan missing","Explain that participation is voluntary and how withdrawal will be handled without penalty where applicable."]);
    if(!present(e.storage)) issues.push(["info","Data storage plan missing","State where data will be stored, who can access them, and when identifiers/files will be deleted or archived."]);
    return {status:level,issues};
  }

  function procedureAudit(project){
    const steps=(project.methods||{}).procedureSteps||[], issues=[];
    if(steps.length<3) issues.push(["warning","Procedure is under-specified","A replicable procedure usually needs enough ordered steps to cover preparation, assignment/setup, collection, recording, deviations, and storage."]);
    steps.forEach((s,i)=>{
      if(!present(s.action)) issues.push(["critical",`Step ${i+1} has no action`,"State exactly what occurs."]);
      if(!present(s.record)) issues.push(["info",`Step ${i+1} does not say what is recorded`,"If this step produces data or a protocol decision, name the record."]);
    });
    const hasConsent=steps.some(s=>/consent|assent|permission/i.test(s.action||""));
    if(project.methods?.ethics?.humanParticipants==="yes" && !hasConsent) issues.push(["warning","Human-participant procedure has no consent/permission step","The procedure should show when approval/consent occurs before research data collection."]);
    return {issues,count:steps.length};
  }

  function dataSchemaAudit(project){
    const schema=project.schema||[], d=(project.methods||{}).design||{}, issues=[];
    if(!schema.length) issues.push(["critical","No data dictionary columns","Design the data table before final collection."]);
    const names=schema.map(x=>String(x.name||"").trim()).filter(Boolean);
    if(new Set(names).size!==names.length) issues.push(["critical","Duplicate column names","Each variable should have a unique machine-readable column name."]);
    schema.forEach((x,i)=>{
      if(!present(x.name)) issues.push(["critical",`Column ${i+1} has no name`,"Give every field a unique variable name."]);
      if(!present(x.definition)) issues.push(["warning",`${x.name||`Column ${i+1}`}: definition missing`,"Record units/categories, coding rule, allowed values, and missing-value representation."]);
    });
    if(!present(d.rowUnit)) issues.push(["critical","Row unit missing","State exactly what one row represents."]);
    if(present(d.rowUnit) && present(d.experimentalUnit) && d.rowUnit!==d.experimentalUnit){
      issues.push(["warning","Rows are nested/repeated within the independent unit","Your later analysis must preserve unit IDs so repeated rows are not treated as independent samples."]);
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
      label: critical ? "Not ready to collect" : warning ? "Revise before collection" : "Method plan ready for teacher review",
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
      `**Pre-collection readiness:** ${r.score}/100 — ${r.label}`,"",
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
