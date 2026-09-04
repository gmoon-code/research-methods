
window.RMSCoach = (() => {
  const stop = new Set("a an the and or but of in on at to for from with without about into by as is are was were be been being do does did how what why when where which who whom whose this that these those my your our their it its i we you they".split(" "));
  const vagueTerms = ["better","worse","good","bad","effective","successful","impact","affect","focus","engagement","happiness","stress","healthy","smart","productive","performance","learning","memory","attention"];
  const risky = [
    ["sleep restriction", /\b(sleep less|reduce sleep|skip sleep|sleep deprivation|stay awake|all[- ]nighter)\b/i],
    ["caffeine or stimulant manipulation", /\b(caffeine|energy drink|stimulant)\b/i],
    ["medication or supplement manipulation", /\b(medication|medicine|prescription|dose|supplement)\b/i],
    ["harm or pain", /\b(pain|injury|self[- ]harm|hurt myself|dangerous exercise)\b/i],
    ["sensitive mental-health data", /\b(depression|suicid|self[- ]harm|trauma|diagnos|mental health)\b/i],
    ["sensitive personal data", /\b(sexual|sexuality|income|religion|political|medical record)\b/i]
  ];

  const wc = s => (String(s||"").trim().match(/\b[\w’'-]+\b/g)||[]).length;
  const present = v => String(v||"").trim().length > 0;
  const countPresent = (...vals) => vals.filter(present).length;
  const sentenceCount = s => (String(s||"").match(/[.!?]+(?:\s|$)/g)||[]).length;
  const citations = s => (String(s||"").match(/\([A-Z][A-Za-z'’-]+(?:\s+et al\.)?(?:\s*&\s*[A-Z][A-Za-z'’-]+)?,\s*\d{4}[a-z]?\)/g)||[]).length;

  function keywords(text, max=8){
    const words=(String(text||"").toLowerCase().match(/[a-z][a-z'-]{2,}/g)||[])
      .filter(w=>!stop.has(w) && !vagueTerms.includes(w));
    const f={}; for(const w of words) f[w]=(f[w]||0)+1;
    return Object.entries(f).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,max).map(x=>x[0]);
  }

  function riskScan(text){
    const hits = risky.filter(([,rx])=>rx.test(String(text||""))).map(x=>x[0]);
    return {hits, flagged:hits.length>0};
  }

  function msg(level,title,body,next){
    return {level,title,body,next:next||""};
  }
  function result(score,messages,details={}){
    score=Math.max(0,Math.min(100,Math.round(score)));
    return {score, label:score>=85?"Strong":score>=70?"Developing well":score>=50?"Needs revision":"Not ready", messages, details};
  }

  function review1(d){
    let score=20, m=[];
    const ideas=countPresent(d.ideaA,d.ideaB,d.ideaC);
    score += ideas*12;
    if(ideas<3) m.push(msg("warn","Generate alternatives","Researchers make better topic decisions when they compare several possible directions.","Add enough distinct possibilities that you can compare interest, relevance, feasibility, and evidence access."));
    if(present(d.access1)) score+=18; else m.push(msg("warn","Evidence access is missing","A topic can be interesting and still be impossible to investigate in your setting.","List tools, datasets, organisms, settings, or sources you could realistically access."));
    if(countPresent(d.interest1,d.problem1,d.claim1)>=2) score+=18;
    else m.push(msg("info","Broaden the interest inventory","Try more than one way of entering a topic: curiosity, observed problem, disputed claim, or unexplained pattern.","Write at least two different starting points before choosing."));
    return result(score,m,{keywords:keywords([d.interest1,d.problem1,d.claim1].join(" "))});
  }

  function review2(d){
    let score=10,m=[];
    for(const [k,lab,pts] of [["broadTopic","broad area",12],["subtopic","subtopic",12],["phenomenon","specific phenomenon/problem",18],["contextPop","population/system/context",14],["scope","manageable scope",18],["topicChoice","working topic",16]]){
      if(present(d[k])) score+=pts; else m.push(msg("warn",`Define the ${lab}`,`The current topic map is missing the ${lab}.`,"Add this boundary before locking the topic."));
    }
    const risk=riskScan([d.phenomenon,d.topicChoice,d.safety].join(" "));
    if(risk.flagged) m.push(msg("bad","Teacher/safety review required",`This topic mentions ${risk.hits.join(", ")}. The question may still be studied observationally or through existing literature, but a student-directed intervention may be inappropriate.`,"Do not design a manipulation until a teacher has reviewed the topic and route."));
    if(present(d.topicChoice) && wc(d.topicChoice)<3) m.push(msg("warn","Topic may still be too broad","A one- or two-word topic is usually a field rather than a bounded project.","Name the phenomenon plus a context, system, population, or measurable angle."));
    return result(score-(risk.flagged?8:0),m,{risk});
  }

  function review3(d){
    let score=10,m=[];
    if(present(d.concepts)) score+=15; else m.push(msg("warn","Extract the core concepts","Search quality improves when the question is separated into concept blocks.","Write the 2–4 ideas that must appear in a relevant paper."));
    if(present(d.synonyms)) score+=15; else m.push(msg("warn","Build a synonym bank","Researchers may use different terminology than you use in class.","Add broader terms, formal terms, acronyms, and close synonyms."));
    if(present(d.prelimSearch)){
      score+=20;
      if(!/\bAND\b|\bOR\b/i.test(d.prelimSearch)) m.push(msg("info","Make the search logic explicit","Your search may work, but Boolean structure will make it easier to revise and reproduce.","Combine synonyms with OR and different concepts with AND."));
    } else m.push(msg("warn","Run preliminary searches","The question should not be locked before you learn how the field describes and measures the topic.","Record at least two preliminary search routes."));
    if(present(d.methodsSeen)) score+=15; else m.push(msg("warn","Read Methods, not only abstracts","You need to know how researchers operationalize the concepts before designing your own study.","Record at least two measurement or design approaches you saw."));
    if(present(d.uncertain)) score+=15;
    if(present(d.questionShift)) score+=10;
    return result(score,m);
  }

  function questionDimensions(q,type){
    const t=String(q||"").trim(), dims=[];
    dims.push(["Explicit question", t.endsWith("?"), "Write the final research question as an explicit question."]);
    const n=wc(t);
    dims.push(["Manageable scope", n>=8 && n<=45, n<8?"The wording is probably too broad to determine a study.":"The question may contain too many conditions or clauses for one project."]);
    const vague=vagueTerms.filter(v=>new RegExp(`\\b${v}\\b`,"i").test(t));
    dims.push(["Operational clarity", vague.length===0, vague.length?`Define or replace vague term(s): ${vague.join(", ")}.`:""]);
    const hasPop=/\b(students?|adolescents?|adults?|plants?|seeds?|participants?|schools?|classrooms?|studies|articles|samples?|cells?|organisms?|water|soil|people|workers?|teachers?)\b/i.test(t);
    dims.push(["Unit/context is inferable", hasPop || /\bin\b|\bamong\b|\bunder\b|\bacross\b/i.test(t), "Add the population, organism, system, setting, or context if it limits the claim."]);
    const causal=/\b(effect|cause|causes|caused|increase|decrease|improve|reduce|lead to|makes?)\b/i.test(t);
    const observational=/Correlational|Descriptive|Qualitative|Literature review/i.test(type||"");
    dims.push(["Causal language matches design", !(causal&&observational), "The wording implies causation while the selected question family is nonexperimental. Use association/pattern/experience wording unless the design can support a causal comparison."]);
    const leading=/\b(obviously|clearly|harmful|best|worst|destroy|amazing|lazy)\b/i.test(t);
    dims.push(["Neutral wording", !leading, "Remove wording that assumes the answer or judges the participants/phenomenon."]);
    return dims;
  }

  function review4(d){
    const q=d.finalRQ||"", dims=questionDimensions(q,d.questionType);
    let score=dims.filter(x=>x[1]).length/dims.length*75;
    let m=dims.filter(x=>!x[1]).map(x=>msg("warn",x[0],x[2],"Revise the question and run the coach again."));
    if(present(d.rqJustification)) score+=15; else m.push(msg("warn","Justify answerability","A grammatically good question can still be unanswerable with the resources you have.","Explain what evidence could answer it and why that evidence is feasible."));
    if(present(d.questionType)) score+=10; else m.push(msg("warn","Identify the question family","The design cannot be selected until you know what kind of answer the question seeks.","Choose descriptive, observational, experimental, qualitative, review, or another defensible family."));
    const risk=riskScan(q);
    if(risk.flagged) m.push(msg("bad","Safety/ethics route needs review",`The question includes ${risk.hits.join(", ")}.`,"A teacher should decide whether the project must be observational, literature-based, or otherwise restricted."));
    return result(score-(risk.flagged?8:0),m,{dimensions:dims,risk});
  }

  function review5(d){
    let score=10,m=[];
    const blocks=countPresent(d.searchBlock1,d.searchBlock2,d.searchBlock3);
    score+=Math.min(30,blocks*10);
    if(blocks<2) m.push(msg("warn","Build at least two concept blocks","A single keyword list tends to return broad or biased results.","Separate the major concepts and give each one synonyms."));
    if(present(d.searchStrings)){
      score+=20;
      if(!/\bAND\b/i.test(d.searchStrings)) m.push(msg("warn","Connect concept blocks with AND","Your search should show how different ideas must occur together.","Use OR inside synonym groups and AND between concepts."));
      if(!/\bOR\b/i.test(d.searchStrings)) m.push(msg("info","Add synonym alternatives","Using only one word for each concept can miss relevant studies.","Use OR to join credible synonyms."));
    } else m.push(msg("warn","No final search strings yet","The search cannot be reproduced without a recorded query.","Write at least two search strings."));
    if(present(d.databases)) score+=15; else m.push(msg("warn","Choose search sources","Use at least one broad scholarly search route and an appropriate discipline-specific database when available.","Record the databases/search systems you will use."));
    if(present(d.includeCriteria)&&present(d.excludeCriteria)) score+=20; else m.push(msg("warn","Define screening rules","Without inclusion/exclusion rules, source selection can drift toward papers you happen to like.","State population/topic/method/date/language or other criteria that actually matter."));
    if(present(d.searchLog)) score+=5;
    return result(score,m);
  }

  function review6(d,sources){
    let score=15,m=[];
    const n=sources.length;
    score += Math.min(30,n*5);
    if(n===0) m.push(msg("warn","No studies have been extracted","A literature review cannot be synthesized from search results alone.","Add source records with study design, sample/context, measures, finding, and limitations."));
    else if(n<5) m.push(msg("info","Evidence base is still thin",`You currently have ${n} source record(s). This may be enough for preliminary exploration but is usually thin for a full student literature review.`,"Continue searching until additional papers stop changing the major themes, subject to your assignment requirements."));
    const fields=["design","sample","measures","finding","limits","relevance"];
    let complete=0;
    sources.forEach(s=>{if(fields.filter(k=>present(s[k])).length>=5) complete++});
    if(n) score += 35*(complete/n);
    if(n && complete<n) m.push(msg("warn","Some extraction records are incomplete",`${complete} of ${n} source records contain at least five of the six core evidence fields.`,"Complete design, sample/context, measures, finding, limitations, and relevance before synthesis."));
    const included=sources.filter(s=>(s.screeningStatus||"Included")==="Included");
    const evaluated=sources.filter(s=>s.trapp && ["timeframe","relevance","authority","accuracy","purpose"].filter(k=>present(s.trapp[k])).length===5).length;
    if(n){score += 10*(evaluated/n); if(evaluated<n)m.push(msg("info","Source evaluation is incomplete",`${evaluated} of ${n} source records have all five TRAPP dimensions recorded.`,"Use the Literature Workspace to evaluate Timeframe, Relevance, Authority, Accuracy, and Purpose."));}
    const withThemes=sources.filter(s=>(Array.isArray(s.themeEvidence)&&s.themeEvidence.length)||(Array.isArray(s.themes)&&s.themes.length)).length;
    score += n?10*(withThemes/n):0;
    if(n && withThemes<n) m.push(msg("info","Tag source contributions to themes","The synthesis matrix works best when each important source is tagged as supporting, conflicting, mixed, or background evidence for a theme.","Use the Literature Workspace to record theme evidence and stance."));
    if(included.length<3)m.push(msg("warn","Few sources are currently included",`Only ${included.length} source(s) are marked Included.`,"Continue screening before making broad synthesis or research-gap claims."));
    return result(score,m,{sourceCount:n,included:included.length,complete,evaluated,withThemes});
  }

  function review7(d,sources){
    let score=10,m=[];
    const themes=countPresent(d.theme1,d.theme2,d.theme3);
    score+=themes*12;
    if(themes<2) m.push(msg("warn","Synthesis needs more than one organizing idea","A literature review should usually show more than a single repeated claim.","Identify at least two recurring patterns, mechanisms, methodological groupings, or findings."));
    if(present(d.tensions)) score+=15; else m.push(msg("info","Look for boundaries and disagreement","Strong synthesis includes places where findings differ or depend on method/context.","Record at least one tension, contradiction, or boundary condition."));
    if(present(d.repeatedLimits)) score+=12;
    if(present(d.gapStatement)) score+=20; else m.push(msg("warn","Study justification is missing","The reader needs to know why this study follows from the evidence base.","State a supported gap, replication rationale, extension, local question, or other honest justification."));
    if(present(d.litToRQ)) score+=7;
    const tags=[...new Set(sources.flatMap(s=>s.themes||[]).map(x=>x.trim()).filter(Boolean))];
    if(sources.length && tags.length<2) m.push(msg("info","Use the source tags to test your synthesis","The source matrix currently has very few theme tags.","Tag sources, then check whether each proposed theme is supported by multiple studies."));
    return result(score,m,{themeTags:tags});
  }

  function review8(d){
    let score=10,m=[];
    if(present(d.litIntroPlan)) score+=12;
    if(present(d.litThemePlan)) score+=18;
    if(present(d.litTensionPlan)) score+=10;
    if(present(d.litEndPlan)) score+=10;
    const draft=d.litDraft||"";
    if(wc(draft)>=250) score+=25; else m.push(msg("warn","The literature review draft is still very short",`Current draft length is about ${wc(draft)} words.`,"Develop theme-based paragraphs that compare multiple sources and lead toward the research question."));
    const c=citations(draft);
    if(c>=3) score+=15; else m.push(msg("warn","Citation density may be too low",`The simple checker detected ${c} APA-style parenthetical citation(s). This is only a formatting heuristic.`,"Verify that major claims are supported by real sources and that citations are distributed where evidence is used."));
    const oneSourceOpeners=(draft.match(/\b[A-Z][A-Za-z'’-]+\s+\(\d{4}\)/g)||[]).length;
    if(oneSourceOpeners>=4) m.push(msg("info","Check for source-by-source summary","Many paragraphs that begin with an author name can signal annotated-bibliography style.","Try organizing paragraphs around a claim/theme and bringing several sources into the same paragraph."));
    return result(score,m,{wordCount:wc(draft),detectedCitations:c});
  }

  function designAlignment(rq,type){
    const q=String(rq||"").toLowerCase();
    const map=[];
    if(/\brelationship|association|correlation|predict|linked\b/.test(q) && !/Correlational|observational/i.test(type||"")) map.push("The question uses association language but the selected design is not observational/correlational.");
    if(/\bhow do|experience|describe|perceive|explain\b/.test(q) && /Experimental|Correlational/i.test(type||"")) map.push("The question appears experience/meaning-focused; a qualitative component may be needed.");
    if(/\beffect|affect|cause|increase|decrease|reduce|improve\b/.test(q) && /Correlational|Descriptive|Literature review/i.test(type||"")) map.push("The question uses causal wording but the selected design does not provide a clear manipulation/causal comparison.");
    return map;
  }

  function review9(d){
    let score=20,m=[];
    if(present(d.designType)&&d.designType!=="Undecided") score+=25; else m.push(msg("warn","Choose a design family","The Method section cannot be planned until the evidence structure is known.","Select the design that directly answers the research question."));
    if(present(d.designWhy)) score+=20; else m.push(msg("warn","Explain why the design fits","Naming a design is not enough.","Connect the wording of the research question to the evidence the design will produce."));
    if(present(d.comparisonStructure)) score+=15;
    if(present(d.claimBoundary)) score+=20; else m.push(msg("warn","Set the claim boundary now","Design decisions determine which conclusions are possible.","Write what the design can and cannot establish before collecting data."));
    designAlignment(d.finalRQ,d.designType).forEach(x=>m.push(msg("bad","Question–design mismatch",x,"Revise the question or design so they describe the same inferential goal.")));
    return result(score-m.filter(x=>x.level==="bad").length*12,m);
  }

  function review10(d){
    let score=10,m=[];
    const design=d.designType||"";
    if(present(d.hypothesisNeeded)) score+=10;
    if(d.hypothesisNeeded==="Yes"){
      if(present(d.researchHyp)) score+=12; else m.push(msg("warn","Prediction is missing","You indicated that a hypothesis is appropriate.","Write a testable prediction grounded in prior evidence or theory."));
      if(present(d.hypReason)) score+=8;
    } else score+=10;
    if(/Experimental/i.test(design)){
      if(present(d.predictorIV)) score+=15; else m.push(msg("warn","Manipulated independent variable is missing","An experiment needs a clearly defined factor that is deliberately varied.","Specify the IV and its levels."));
      if(present(d.controlCondition)) score+=8;
      if(present(d.controlledConditions)) score+=8;
    } else {
      if(present(d.predictorIV) || /Descriptive|Qualitative|Literature review/.test(design)) score+=12;
      if(/Correlational/i.test(design) && !present(d.predictorIV)) m.push(msg("warn","Measured predictor/exposure is missing","Observational work needs the variable that is measured, not manipulated.","Name the predictor/exposure using observational language."));
    }
    if(present(d.outcomeDV)) score+=12; else if(!/Qualitative|Literature review/.test(design)) m.push(msg("warn","Outcome is missing","The analysis cannot be planned without a clearly measured outcome.","Define the dependent/outcome variable."));
    if(present(d.operationalDefs)) score+=10; else m.push(msg("warn","Operational definitions are missing","Construct names do not tell a reader exactly what was measured.","State the scoring rule, unit, instrument, category definition, or manipulation."));
    if(present(d.experimentalUnit)) score+=10; else m.push(msg("warn","Unit of analysis is not defined","Without the unit, replication and independence cannot be evaluated.","State what one independently analyzed unit represents."));
    if(present(d.confounders)) score+=5;
    return result(score,m);
  }

  function review11(d){
    let score=10,m=[];
    for(const [k,lab,pts] of [["population","target population/system",10],["sample","actual sample",12],["samplingMethod","sampling method",12],["sampleLimits","generalization limit",10],["instrument","measurement instrument/procedure",15],["measureQuality","measurement quality plan",15],["ethicsIssues","ethics/safety assessment",8],["ethicsPlan","ethics handling/approval plan",8]]){
      if(present(d[k]))score+=pts;else m.push(msg("warn",`${lab} is missing`,`A defensible Method section needs the ${lab}.`,"Add the missing decision and explain why it fits the research question."));
    }
    const risk=riskScan([d.finalRQ,d.ethicsIssues,d.instrument].join(" "));
    if(risk.flagged) m.push(msg("bad","Elevated ethics/safety review",`The project includes ${risk.hits.join(", ")}.`,"Do not begin data collection until the appropriate teacher/institutional review has determined a safe and permitted route."));
    return result(score-(risk.flagged?8:0),m,{risk});
  }

  function review12(d){
    let score=10,m=[];
    for(const [k,lab,pts] of [["materials","materials/data sources",8],["procedure","replicable procedure",20],["replication","replication/sample structure",10],["methodControls","validity protections",10],["rowUnit","row/observation unit",12],["columns","data columns and units/categories",15],["missingRule","missing-data rule",8],["exclusionRule","exclusion/outlier rule",7],["analysisIntent","analysis intent",10]]){
      if(present(d[k]))score+=pts;else m.push(msg("warn",`${lab} not recorded`,`The protocol is missing ${lab}.`,"Define it before collecting final data."));
    }
    if(present(d.rowUnit)&&present(d.experimentalUnit)&&d.rowUnit!==d.experimentalUnit){
      m.push(msg("info","Row unit and experimental unit may differ","That can be correct, but repeated/nested observations must be represented explicitly in the analysis.","Explain how rows are clustered within the independent unit."));
    }
    return result(score,m);
  }

  function review13(d){
    let score=10,m=[];
    if(present(d.rawLocation))score+=20;else m.push(msg("warn","Raw-data preservation not documented","Keep an unchanged source dataset separate from cleaned/derived files.","Record where the immutable raw data are stored."));
    if(present(d.missingObserved))score+=15;
    if(present(d.errorsCorrections))score+=15;
    if(present(d.plots))score+=20;else m.push(msg("warn","Visual inspection is missing","Researchers should see the data structure before reducing it to a p-value.","Create plots that preserve groups, pairs, time, or other design structure."));
    if(present(d.descriptives))score+=20;else m.push(msg("warn","Descriptive summary is missing","Inferential analysis should be accompanied by a basic description of the observed evidence.","Record counts/proportions, mean/SD, median/IQR, or corpus/theme summaries as appropriate."));
    return result(score,m);
  }

  function review14(d){
    let score=10,m=[];
    if(present(d.primaryEstimand))score+=20;else m.push(msg("warn","Define the estimand","Do not begin with the name of a test. Begin with the quantity that answers the question.","State the mean difference, paired change, proportion difference, association, slope, theme pattern, or other target."));
    if(present(d.analysisChoice))score+=25;else m.push(msg("warn","Analysis not justified","Use the design and data structure to choose the analysis.","Run the analysis decision wizard, then explain why the recommendation fits your data."));
    if(present(d.assumptionChecks))score+=20;else m.push(msg("warn","Assumptions/design checks are missing","Statistical assumptions are tied to the model and study design.","Record independence/repeated structure, distribution/model-form checks, outliers, expected counts, or other relevant checks."));
    if(present(d.effectSizePlan))score+=15;else m.push(msg("warn","Magnitude/uncertainty plan is missing","A p-value alone cannot answer how large or precise a result is.","State the raw effect, effect size, and interval estimate you will report when appropriate."));
    if(present(d.multiplicity))score+=10;
    return result(score,m);
  }

  function review15(d){
    let score=10,m=[];
    if(present(d.analysisSample))score+=15;
    if(present(d.result1))score+=25;else m.push(msg("warn","Primary result is missing","The Results section must directly answer the primary research question.","Record the estimate/statistic/theme and the exact table, figure, or output that supports it."));
    if(present(d.result2))score+=10;
    if(present(d.unexpected))score+=10;
    const draft=d.resultsDraft||"";
    if(wc(draft)>=150)score+=20;else m.push(msg("warn","Results draft is very short",`Current draft is about ${wc(draft)} words.`,"Report sample/corpus, descriptive evidence, primary analysis, and relevant secondary/null findings."));
    if(/\b(because|therefore this means|important because|recommend|should)\b/i.test(draft)) m.push(msg("info","Check Results–Discussion separation","The draft contains explanatory or recommendation language.","Move mechanisms, explanations, importance, and recommendations to Discussion unless your required format combines sections."));
    if(/\bcaused|led to|increased|decreased|effect\b/i.test(draft) && /Correlational|Descriptive/.test(d.designType||"")) m.push(msg("bad","Causal language exceeds the design","The Results draft uses causal wording in a nonexperimental study.","Use association, difference, distribution, or descriptive language."));
    return result(score-m.filter(x=>x.level==="bad").length*10,m,{wordCount:wc(draft)});
  }

  function review16(d){
    let score=5,m=[];
    for(const [k,lab,pts] of [["directAnswer","direct answer",15],["interpret1","anchor finding 1 interpretation",12],["interpret2","anchor finding 2 interpretation",8],["litCompare","comparison with literature",10],["alternatives","alternative explanations/mechanisms",10],["limitations","limitations linked to claim boundaries",15],["implications","implications",8],["future","future research",7]]){
      if(present(d[k]))score+=pts;else m.push(msg("warn",`${lab} is missing`,`The Discussion is missing the ${lab}.`,"Complete this reasoning before polishing prose."));
    }
    const draft=d.discussionDraft||"";
    if(wc(draft)>=300)score+=10;else m.push(msg("info","Discussion draft is still brief",`Current draft is about ${wc(draft)} words.`,"Develop the reasoning around the strongest findings, literature, alternatives, limitations, and implications."));
    if(/Correlational|Descriptive/.test(d.designType||"") && /\bcaused|proved|demonstrated that .* causes|led to\b/i.test(draft))
      m.push(msg("bad","Claim calibration problem","The Discussion contains causal language that exceeds a nonexperimental design.","Revise the claim to match what the design can support."));
    return result(score-m.filter(x=>x.level==="bad").length*10,m);
  }

  function review17(d){
    let score=10,m=[];
    if(wc(d.conclusionDraft)>=70)score+=20;else m.push(msg("warn","Conclusion is incomplete","A conclusion should close the evidence chain, not simply repeat the title.","Include the answer, strongest evidence, main limitation/boundary, and realistic implication."));
    const abs=d.abstractDraft||"";
    if(wc(abs)>=120 && wc(abs)<=350)score+=30;else m.push(msg("warn","Abstract length/content needs review",`Current abstract is about ${wc(abs)} words. Assignment requirements control the final length.`,"Make sure the abstract contains purpose/question, method/design, key result, and bounded conclusion."));
    if(present(d.titleDraft))score+=15;else m.push(msg("warn","Title is missing","A research title should identify the main phenomenon/variables and useful context.","Draft an informative title without promising causality the study cannot support."));
    if(present(d.keywords))score+=10;
    if(/\([A-Z][A-Za-z'’-]+.*\d{4}\)/.test(abs)) m.push(msg("info","Abstract contains a citation","Many empirical abstracts omit citations unless the assignment or discipline requires them.","Check your required format before keeping literature citations in the abstract."));
    if(/\bprove|proved|definitively|guarantee|clearly demonstrates\b/i.test(abs+" "+d.conclusionDraft)) m.push(msg("bad","Overclaiming language","The abstract or conclusion uses certainty language that is rarely justified by a student study.","State what the evidence supports within its design and sample."));
    return result(score-m.filter(x=>x.level==="bad").length*10,m,{abstractWords:wc(abs)});
  }

  function review18(d,project){
    let score=20,m=[];
    if(present(d.citationStyle))score+=10;
    const a=window.RMSEngine?.alignment?window.RMSEngine.alignment(project):[];
    const ok=a.filter(r=>r[2]).length;
    score+=a.length?45*(ok/a.length):0;
    if(a.length && ok<a.length) m.push(msg("warn","The evidence chain has missing links",`${ok} of ${a.length} alignment items are currently recorded.`,"Review the alignment audit and fill or justify missing links."));
    const refs=project.sources||[];
    if(refs.length>=3)score+=15;else m.push(msg("info","Reference verification remains limited","The local source matrix contains very few records.","Verify every cited source against the original publication and ensure each in-text citation has a matching reference."));
    if(present(d.citationAudit))score+=5;
    if(present(d.finalEdits))score+=5;
    return result(score,m,{alignmentRecorded:ok,alignmentTotal:a.length,sourceCount:refs.length});
  }

  const reviewers={1:review1,2:review2,3:review3,4:review4,5:review5,6:review6,7:review7,8:review8,9:review9,10:review10,11:review11,12:review12,13:review13,14:review14,15:review15,16:review16,17:review17,18:review18};
  function reviewStage(stageId,project){
    const fn=reviewers[Number(stageId)];
    if(!fn) return result(0,[msg("info","No coach rule","This stage does not yet have a local review rule.")]);
    return fn(project.data||{},project.sources||[],project);
  }

  function designRecommendation(goal, manipulation, assignment, evidence){
    let design="Undecided", why="", ceiling="";
    if(goal==="describe"){design="Descriptive";why="The goal is to characterize what exists or how it is distributed without estimating a causal effect.";ceiling="Description of the observed sample/system."}
    if(goal==="associate"){design="Correlational / observational";why="The goal is to estimate a relationship between measured variables without assigning the exposure.";ceiling="Association/prediction within the observed data; causal inference is limited."}
    if(goal==="experience"){design="Qualitative";why="The goal concerns meaning, experience, explanation, or process that is best represented in participants' words or observations.";ceiling="Contextual interpretation of experiences/themes, not statistical population causation."}
    if(goal==="review"){design="Literature review";why="The evidence will come from existing research and be synthesized without quantitative pooling.";ceiling="Synthesis bounded by the search, included studies, and their quality."}
    if(goal==="pool"){design="Meta-analysis";why="The goal is to combine comparable quantitative effects from multiple studies.";ceiling="Pooled estimate bounded by study comparability, bias, heterogeneity, and synthesis model."}
    if(goal==="cause"){
      if(manipulation==="yes" && assignment==="random"){design="Experimental";why="The exposure is manipulated and units can be randomly assigned, supporting the strongest causal comparison among the available routes.";ceiling="Causal inference for the tested conditions, subject to adherence, measurement, attrition, implementation, and external-validity limits."}
      else if(manipulation==="yes"){design="Quasi-experimental";why="An intervention/manipulation occurs but random assignment is not available.";ceiling="A causal interpretation may be considered cautiously, but selection/confounding threats require explicit analysis."}
      else {design="Correlational / observational";why="The proposed cause is only observed, not assigned. The study can test association or prediction but cannot isolate the causal effect by design alone.";ceiling="Association/prediction, not a direct causal effect."}
    }
    if(evidence==="words" && !["Qualitative","Literature review"].includes(design)) why += " Because the primary evidence is textual, consider whether a qualitative or mixed-method component is needed.";
    return {design,why,ceiling};
  }

  function interestDirections(text, curiosity){
    const keys=keywords(text,5);
    const topic=keys.slice(0,3).join(" ") || "your topic";
    const out=[];
    if(curiosity==="describe"||!curiosity) out.push(`Descriptive path: What patterns, categories, frequencies, or distributions within ${topic} could be observed systematically?`);
    if(curiosity==="relationship"||!curiosity) out.push(`Association path: Which two measurable features of ${topic} might vary together, and what alternative explanations would remain?`);
    if(curiosity==="cause"||!curiosity) out.push(`Experimental path: Is there one safe factor related to ${topic} that could be deliberately varied while measuring a clearly defined outcome?`);
    if(curiosity==="experience"||!curiosity) out.push(`Qualitative path: Whose experiences, reasoning, or explanations about ${topic} would help answer a meaningful question?`);
    if(curiosity==="literature"||!curiosity) out.push(`Review path: What disagreement, boundary condition, or recurring explanation about ${topic} could be mapped across existing studies?`);
    return {keywords:keys,directions:out};
  }

  function makeBoolean(blocks){
    const b=blocks.map(x=>String(x||"").split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean))
      .filter(x=>x.length).map(arr=>`(${arr.map(x=>x.includes(" ")?`"${x}"`:x).join(" OR ")})`);
    return b.join(" AND ");
  }

  return {reviewStage,designRecommendation,interestDirections,makeBoolean,questionDimensions,riskScan};
})();
