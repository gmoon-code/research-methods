
window.RMSNoviceGuard=(()=>{
  const Base=window.RMSPathCoach, Paths=window.RMSPathways;
  const present=v=>String(v??"").trim().length>0;
  const msg=(level,code,title,body,next="",field="")=>({level,code,title,body,next,field,source:"novice_friction_guard"});
  const pathId=p=>p.pathway?.selected||"unsure";
  const pathName=p=>Base.pathName(p);

  const placeholderExact=/^(?:idk|i\s*(?:do not|don't)\s*know|not sure|unsure|tbd|todo|fill(?:\s+this)?\s+later|help|unknown|\?{2,}|same as above)$/i;
  const scaffoldToken=/\[[^\]]*[A-Za-z][^\]]*\]/;
  const copiedPrompt=/^(?:your answer|write here|answer here|example|sample answer)$/i;

  function lowInformation(value){
    const t=String(value??"").trim();
    if(!t)return false;
    if(placeholderExact.test(t)||copiedPrompt.test(t))return true;
    if(scaffoldToken.test(t))return true;
    return false;
  }

  function friction(stage,p){
    stage=Number(stage);const d=p.data||{},path=pathId(p),out=[];
    const required=Base.required(stage,p)||[];

    // Required fields that merely contain a placeholder must not satisfy readiness.
    for(const key of required){
      const v=d[key];
      if(present(v)&&lowInformation(v)){
        out.push(msg("bad","NG-PLACEHOLDER",`${Paths.label(p,key,key)} is still an unfinished response`,
          `“${String(v).trim()}” does not communicate the research decision. The field is technically nonblank, but a first-time researcher still has no usable reasoning recorded.`,
          "Open Progressive help for this field. Start at Level 1 and use only as much support as you need.",key));
      }
    }

    if(stage===7 && present(d.gapStatement)){
      const global=/\b(no\s+(?:research|studies|literature)\s+(?:exists?|has been done|is available)|never\s+(?:been\s+)?studied|first\s+(?:ever\s+)?study|nothing\s+is\s+known)\b/i.test(d.gapStatement);
      if(global){
        const sourceCount=(p.sources||[]).filter(s=>String(s.screeningStatus||"").toLowerCase()==="included").length;
        const searches=(p.searchLog||[]).length;
        const level=(sourceCount<10||searches<2)?"bad":"warn";
        out.push(msg(level,"NG-GAP-OVERCLAIM","The gap statement makes a global absence claim",
          `A claim such as “no research exists” requires much stronger search evidence than a small preliminary set normally provides. Current project record: ${sourceCount} included source(s), ${searches} logged search route(s).`,
          "Use a bounded rationale such as replication, extension, inconsistent findings, method comparison, or a local/context-specific question unless the search can defend a broader claim.","gapStatement"));
      }
    }

    if(stage===10){
      if(path==="observational" && /\bmanipulat(?:e|ed|ion)|assigned\s+(?:the\s+)?(?:predictor|exposure)\b/i.test(d.predictorIV||"")){
        out.push(msg("bad","NG-OBS-MANIPULATION","Observational predictor language contradicts the selected path",
          "The project is currently observational, but the predictor/exposure description says it is manipulated or assigned.",
          "Decide whether the factor is truly assigned. If yes, reconsider the design path. If no, describe it as measured/observed exposure.","predictorIV"));
      }
      if(present(d.experimentalUnit) && /\b(each\s+)?(?:measurement|reading|trial|data point)\b/i.test(d.experimentalUnit)){
        out.push(msg("warn","NG-UNIT-MEASUREMENT","A measurement may have been mistaken for the independent unit",
          "Repeated readings or trials can come from the same underlying person, plant, dish, specimen, classroom, study, or other unit.",
          "Ask which underlying unit could independently receive a different condition or contribute an independent case. Preserve repeated readings with an ID.","experimentalUnit"));
      }
    }

    if(stage===11 && present(d.samplingMethod)){
      const s=String(d.samplingMethod);
      if(/\brandom\b/i.test(s) && /\b(convenience|available|whoever|volunteer|my class|friends?|easy to reach)\b/i.test(s)){
        out.push(msg("bad","NG-RANDOM-CONVENIENCE","Random sampling and convenience sampling are being mixed",
          "Selecting whoever is available is convenience sampling even if the researcher informally describes the choice as random.",
          "Describe the actual selection procedure. Use “random” only when a probability/random mechanism really selects units.","samplingMethod"));
      }
      if(/\brandom sample|random sampling\b/i.test(s) && !/\b(draw|generator|lottery|random number|probability|sampling frame|every .* chance|selected at random)\b/i.test(s)){
        out.push(msg("warn","NG-RANDOM-UNEXPLAINED","The sampling method says random, but the random mechanism is not explained",
          "A reader should be able to tell how units had a probability-based chance of selection.",
          "State the sampling frame and the actual random selection procedure, or relabel the sample honestly.","samplingMethod"));
      }
    }

    if(stage===12 && present(d.columns)){
      const c=String(d.columns);
      if(/\bbinary\b/i.test(c) && /\bcontinuous\b/i.test(c)){
        out.push(msg("bad","NG-BINARY-TYPE","Binary and continuous have been treated as the same data type",
          "Binary data have exactly two categories. They may be coded 0 and 1, but that coding does not turn the underlying variable into a continuous measurement.",
          "Define the two categories explicitly and keep the variable type as binary/categorical.","columns"));
      }
    }

    if(stage===14 && present(d.analysisChoice)){
      const a=String(d.analysisChoice),structure=String(d.comparisonStructure||"");
      if(/\b(independent|unpaired)\b.*\bt[- ]?test\b|\bt[- ]?test\b.*\b(independent|unpaired)\b/i.test(a) &&
         /\b(same|paired|before.{0,20}after|pre.{0,20}post|repeated)\b/i.test(structure)){
        out.push(msg("bad","NG-PAIRING-LOST","The planned analysis appears to discard pairing",
          "The comparison structure says the same units contribute more than once, but the planned analysis is an independent/unpaired t-test.",
          "Preserve the pairing. Revisit the analysis wizard and choose a paired/repeated method appropriate to the outcome type.","analysisChoice"));
      }
      if(/\b0\s*(?:and|&)\s*1\b.{0,50}\b(?:numbers?|numeric)\b.{0,60}\b(t[- ]?test|anova|continuous)\b/i.test(a) ||
         /\b(binary)\b.{0,40}\b(?:therefore|so)\b.{0,30}\b(?:continuous|t[- ]?test|anova)\b/i.test(a)){
        out.push(msg("bad","NG-BINARY-NUMERIC-CODE","The analysis treats binary coding as continuous measurement",
          "Coding two categories as 0 and 1 is convenient, but the outcome is still binary. Analysis must respect the two-category outcome and the study structure.",
          "Identify whether the binary observations are independent, paired, or repeated, then choose a method for that structure.","analysisChoice"));
      }
      if(path==="meta_analysis" && /\baverage\s+(?:the\s+)?p[- ]?values?|mean\s+p[- ]?value/i.test(a)){
        out.push(msg("bad","NG-META-PVALUE-AVERAGE","Averaging p-values is not the planned meta-analytic effect synthesis",
          "A meta-analysis normally pools comparable effect estimates with their uncertainty under an explicit model. P-values are not effect sizes.",
          "Define the effect metric, variance/standard error information, dependence rules, pooled estimand, and meta-analytic model.","analysisChoice"));
      }
    }

    if([15,16,17].includes(stage)){
      const text=[d.resultsDraft,d.discussionDraft,d.directAnswer,d.conclusionDraft,d.abstractDraft].filter(Boolean).join(" ");
      if(/\bp\s*[<=>]\s*\.?\d+.{0,100}\b(?:chance|probability)\b.{0,70}\b(?:hypothesis|null|true|false)\b|\b(?:chance|probability)\b.{0,70}\b(?:hypothesis|null)\b.{0,70}\bp\s*[<=>]/i.test(text)){
        out.push(msg("bad","NG-PVALUE-PROBABILITY","The p-value is being interpreted as the probability that a hypothesis is true",
          "A p-value is calculated under a specified null model. It is not the probability that the null hypothesis is true and is not the probability that the research hypothesis is correct.",
          "Report the estimate, uncertainty, test result, and design boundary without converting p into a probability that a hypothesis is true.","resultsDraft"));
      }
      if(/\bstatistically significant\b.{0,60}\b(?:large|important|meaningful|practically important|strong effect)\b|\b(?:large|important|meaningful)\b.{0,60}\bstatistically significant\b/i.test(text)){
        out.push(msg("warn","NG-SIGNIFICANCE-MAGNITUDE","Statistical significance is being used as a magnitude or importance claim",
          "A significance decision does not tell you how large, useful, important, or causal the result is.",
          "Use the raw estimate/effect size, uncertainty interval, design, and context to discuss magnitude or practical importance.","resultsDraft"));
      }
      if(/\b(?:not|non)[- ]?significant\b.{0,90}\b(?:proves?|means?)\b.{0,50}\b(?:no effect|no relationship|no difference|the same)\b|\bproves?\s+(?:there is\s+)?no\s+(?:effect|relationship|difference)\b/i.test(text)){
        out.push(msg("bad","NG-NONSIG-NO-EFFECT","A non-significant result is being treated as proof of no effect",
          "Failure to cross a significance threshold can reflect uncertainty, imprecision, small effects, low information, or compatibility with several effect sizes.",
          "Report the estimate and uncertainty. Describe what the data are compatible with instead of claiming that non-significance proves no effect.","resultsDraft"));
      }
      if(/\b95%\s+(?:confidence interval|CI)\b.{0,80}\b95%\s+(?:chance|probability)\b/i.test(text)){
        out.push(msg("warn","NG-CI-PROBABILITY","The confidence interval is being described as a 95% probability statement about the fixed parameter",
          "A conventional frequentist confidence interval should be interpreted through the procedure/model and repeated-sampling coverage, not as a direct posterior probability unless a Bayesian model is being used.",
          "Describe the interval as an uncertainty range produced by the stated method and avoid adding a probability interpretation it does not provide.","resultsDraft"));
      }
    }

    if(stage===16 && path==="observational"){
      const t=[d.directAnswer,d.discussionDraft,d.implications].join(" ");
      if(/\btherefore\b.{0,40}\b(?:should|must)\b|\bproves?\b/i.test(t) && !present(d.alternatives)){
        out.push(msg("warn","NG-OBS-ACTION","The observational conclusion moves quickly from association to action",
          "An observational association may still reflect confounding, reverse direction, measurement error, or selection.",
          "Discuss plausible alternative explanations before making an action recommendation.","implications"));
      }
    }

    return out;
  }

  function reviewStage(stage,p){
    const r=Base.reviewStage(stage,p);
    const extra=friction(stage,p);
    const existingCodes=new Set((r.messages||[]).map(x=>x.code).filter(Boolean));
    const add=extra.filter(x=>!existingCodes.has(x.code));
    const bad=add.filter(x=>x.level==="bad").length, warn=add.filter(x=>x.level==="warn").length;
    const score=Math.max(0,Math.min(100,Math.round((r.score??0)-bad*12-warn*4)));
    return {...r,score,label:score>=85?"Strong":score>=70?"Developing well":score>=50?"Needs revision":"Not ready",
      messages:[...(r.messages||[]),...add],details:{...(r.details||{}),noviceFriction:add}};
  }

  function stageGate(stage,p){
    const r=reviewStage(stage,p);
    const missing=r.details?.missing||[];
    const blockingMessages=(r.messages||[]).filter(x=>x.level==="bad");
    return {canMarkReady:missing.length===0&&blockingMessages.length===0,missing,blockingMessages,review:r};
  }

  return {
    reviewStage,stageGate,friction,lowInformation,
    readinessChecks:(...a)=>Base.readinessChecks(...a),
    required:(...a)=>Base.required(...a),
    recommended:(...a)=>Base.recommended(...a),
    methodsReadiness:(...a)=>Base.methodsReadiness(...a),
    methodSection:(...a)=>Base.methodSection(...a),
    pathName:(...a)=>Base.pathName(...a),
    compatibleDesign:(...a)=>Base.compatibleDesign(...a)
  };
})();
