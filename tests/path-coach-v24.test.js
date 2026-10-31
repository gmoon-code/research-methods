global.window={};
window.RMSCoach={reviewStage:(s,p)=>({score:80,label:"Developing well",messages:[],details:{}})};
window.RMSPathways={selected:p=>({name:({qualitative:"Qualitative study",literature_review:"Literature review",observational:"Observational study",experimental:"Experimental study",descriptive_quantitative:"Descriptive study",meta_analysis:"Meta-analysis",mixed_methods:"Mixed methods",quasi_experimental:"Quasi-experimental study",unsure:"Unsure"})[p.pathway?.selected||"unsure"]}),label:(p,k,d)=>d};
window.RMSMethods={auditDesign:()=>({issues:[]}),auditReplication:()=>({issues:[["warning","Independent-unit count missing","x"]]}),auditSampling:()=>({issues:[["critical","Actual sample missing","x"]]}),auditMeasurements:()=>({issues:[["critical","No measurement plan","x"]]}),ethicsRoute:()=>({status:"clear",issues:[]}),procedureAudit:()=>({issues:[]}),dataSchemaAudit:()=>({issues:[]})};
require("../assets/path-coach-model.js");require("../assets/path-coach.js");const C=window.RMSPathCoach;
let q={data:{designType:"Qualitative",operationalDefs:"domains",experimentalUnit:"participant"},pathway:{selected:"qualitative",confirmed:true},methods:{constructs:[],measurements:[],procedureSteps:[]},schema:[]};let r=C.reviewStage(10,q);if(r.details.missing.length!==0)process.exit(1);if(r.messages.some(x=>/Outcome is missing|independent variable is missing/i.test(x.title)))process.exit(1);r=C.reviewStage(14,q);if(!r.details.missing.includes("analysisChoice")||!r.details.missing.includes("assumptionChecks"))process.exit(1);q.data.analysisChoice="thematic analysis";q.data.assumptionChecks="audit trail and discrepant cases";r=C.reviewStage(14,q);if(r.details.missing.length!==0)process.exit(1);
let l={data:{designType:"Literature review",operationalDefs:"eligibility concepts",experimentalUnit:"study",population:"target literature",samplingMethod:"documented search",sampleLimits:"coverage",instrument:"study matrix",measureQuality:"duplicate verification"},pathway:{selected:"literature_review",confirmed:true},methods:{constructs:[],measurements:[],procedureSteps:[]},schema:[]};r=C.reviewStage(11,l);if(r.details.missing.length!==0)process.exit(1);if(C.methodSection(l,"sampling").issues.some(x=>/Actual sample missing/i.test(x[1])))process.exit(1);
let o={data:{designType:"Correlational / observational",designWhy:"measure natural variables",comparisonStructure:"association",claimBoundary:"association only",predictorIV:"sleep",outcomeDV:"score",operationalDefs:"hours and points",experimentalUnit:"student",confounders:"study time",analysisSample:"n",result1:"r=.4",resultsDraft:"More sleep caused higher scores."},pathway:{selected:"observational",confirmed:true}};r=C.reviewStage(15,o);if(!r.messages.some(x=>x.level==="bad"&&/Causal language/i.test(x.title)))process.exit(1);
let d={data:{designType:"Descriptive",outcomeDV:"height",operationalDefs:"cm",experimentalUnit:"plant"},pathway:{selected:"descriptive_quantitative",confirmed:true}};r=C.reviewStage(10,d);if(r.details.missing.length!==0)process.exit(1);if(r.messages.some(x=>/hypothesis/i.test(x.title)&&x.level==="warn"))process.exit(1);
let quality={data:{rawLocation:"original records",descriptives:"frequencies by category"},pathway:{selected:"descriptive_quantitative",confirmed:true}};
let gate=C.stageGate(13,quality);
if(gate.canMarkReady)process.exit(1);
if(!gate.missing.includes("missingObserved")||!gate.missing.includes("errorsCorrections"))process.exit(1);
quality.data.missingObserved="No missing observations in the recorded set";
quality.data.errorsCorrections="No corrections or exclusions required";
gate=C.stageGate(13,quality);
if(!gate.canMarkReady||gate.missing.length!==0)process.exit(1);
const checks=C.readinessChecks(10,quality);
if(checks.length!==3||!checks.some(x=>x.includes("several records belong to the same unit")))process.exit(1);
// observational evidence-quality regression
let observed={data:{rawLocation:"original observation file",descriptives:"score and predictor summaries"},pathway:{selected:"observational",confirmed:true}};
let obsGate=C.stageGate(13,observed);
if(obsGate.canMarkReady||!obsGate.missing.includes("missingObserved")||!obsGate.missing.includes("errorsCorrections"))process.exit(1);
if(obsGate.missing.includes("plots"))process.exit(1);
observed.data.missingObserved="Two entries absent, handled by complete-case summary with limitations";
observed.data.errorsCorrections="No entry corrections; exclusions recorded";
obsGate=C.stageGate(13,observed);
if(!obsGate.canMarkReady||obsGate.missing.length!==0)process.exit(1);
if(C.recommended(13,observed).indexOf("plots")<0)process.exit(1);
if(C.recommended(12,observed).includes("replication"))process.exit(1);
if(!C.required(12,observed).includes("replication")||!C.required(12,observed).includes("methodControls"))process.exit(1);
let study={data:{designType:"Correlational / observational",designWhy:"measure association",comparisonStructure:"sampled pairs",claimBoundary:"no causal inference"},pathway:{selected:"observational",confirmed:true}};
if(!C.stageGate(9,study).canMarkReady)process.exit(1);
study.data.designType="Experimental";
if(C.stageGate(9,study).canMarkReady)process.exit(1);
if(!C.readinessChecks(10,observed).some(s=>s.includes("clustered records")))process.exit(1);

// experiment with no formal hypothesis is not penalised for unwritten prediction fields
let e={data:{hypothesisNeeded:"No",designType:"Experimental",predictorIV:"assigned light",outcomeDV:"growth",operationalDefs:"lux and cm",controlCondition:"standard light",controlledConditions:"water and soil",experimentalUnit:"plant",confounders:"placement"},pathway:{selected:"experimental",confirmed:true}};
let er=C.reviewStage(10,e);
if(er.details.missing.length!==0||er.details.recommended.includes("researchHyp")||er.details.recommended.includes("hypReason"))process.exit(1);
if(!C.stageGate(10,e).canMarkReady)process.exit(1);
e.data.hypothesisNeeded="Yes";
er=C.reviewStage(10,e);
if(C.stageGate(10,e).canMarkReady||!er.messages.some(x=>x.level==="bad"&&/hypothesis/i.test(x.title)))process.exit(1);
e.data.researchHyp="Assigned higher light will increase growth";
if(!C.stageGate(10,e).canMarkReady||!C.recommended(10,e).includes("hypReason"))process.exit(1);
// experiment needs a data-quality record even if a plot was not useful
let exdata={data:{rawLocation:"original unit-level observations",descriptives:"treatment-wise means and spread"},pathway:{selected:"experimental",confirmed:true}};
let egate=C.stageGate(13,exdata);
if(egate.canMarkReady||!egate.missing.includes("missingObserved")||!egate.missing.includes("errorsCorrections")||egate.missing.includes("plots"))process.exit(1);
exdata.data.missingObserved="None found";
exdata.data.errorsCorrections="No errors or deviations recorded";
egate=C.stageGate(13,exdata);
if(!egate.canMarkReady||egate.missing.length!==0||!C.recommended(13,exdata).includes("plots"))process.exit(1);
if(!C.readinessChecks(10,e).some(x=>x.includes("repeated measurements or subsamples")))process.exit(1);

// Quasi-experimental comparison and evidence-integrity regressions.
let quasi={data:{predictorIV:"school timetable change",outcomeDV:"quiz score",operationalDefs:"recorded points",experimentalUnit:"class",confounders:"cohort timing",hypothesisNeeded:"No"},pathway:{selected:"quasi_experimental",confirmed:true}};
let qr=C.reviewStage(10,quasi);
if(qr.details.missing.length!==0||qr.details.recommended.includes("researchHyp")||qr.details.recommended.includes("hypReason"))process.exit(1);
if(!C.stageGate(10,quasi).canMarkReady)process.exit(1);
quasi.data.hypothesisNeeded="Yes";
if(C.stageGate(10,quasi).canMarkReady||!C.reviewStage(10,quasi).messages.some(x=>x.level==="bad"&&/prediction/i.test(x.title)))process.exit(1);
quasi.data.researchHyp="Scores will change after the timetable adjustment";
if(!C.stageGate(10,quasi).canMarkReady||!C.recommended(10,quasi).includes("hypReason"))process.exit(1);
let qdata={data:{rawLocation:"unaltered original observations",descriptives:"counts and period summaries"},pathway:{selected:"quasi_experimental",confirmed:true}};
let qgate=C.stageGate(13,qdata);
if(qgate.canMarkReady||!qgate.missing.includes("missingObserved")||!qgate.missing.includes("errorsCorrections")||qgate.missing.includes("plots"))process.exit(1);
qdata.data.missingObserved="No missing records found";
qdata.data.errorsCorrections="No corrections or protocol deviations";
qgate=C.stageGate(13,qdata);
if(!qgate.canMarkReady||qgate.missing.length!==0||!C.recommended(13,qdata).includes("plots"))process.exit(1);
if(!C.readinessChecks(14,qdata).some(s=>s.includes("time trends")))process.exit(1);
let wrongDesign={data:{designType:"Experimental",designWhy:"evaluating change",comparisonStructure:"pre and post series",claimBoundary:"limited attribution"},pathway:{selected:"quasi_experimental",confirmed:true}};
if(C.stageGate(9,wrongDesign).canMarkReady)process.exit(1);
wrongDesign.data.designType="Quasi-experimental";
if(!C.stageGate(9,wrongDesign).canMarkReady)process.exit(1);

// qualitative corpus integrity and method-appropriate analysis regressions
let qualitativeCorpus={data:{rawLocation:"original interview audio and notes",descriptives:"five interview sessions and transcripts"},pathway:{selected:"qualitative",confirmed:true}};
let qualitativeGate=C.stageGate(13,qualitativeCorpus);
if(qualitativeGate.canMarkReady||!qualitativeGate.missing.includes("missingObserved")||!qualitativeGate.missing.includes("errorsCorrections"))process.exit(1);
qualitativeCorpus.data.missingObserved="One unavailable excerpt documented; others available";
qualitativeCorpus.data.errorsCorrections="Transcript corrections recorded alongside originals";
qualitativeGate=C.stageGate(13,qualitativeCorpus);
if(!qualitativeGate.canMarkReady||qualitativeGate.missing.length!==0)process.exit(1);
if(C.recommended(13,qualitativeCorpus).includes("errorsCorrections"))process.exit(1);
if(!C.required(12,qualitativeCorpus).includes("methodControls")||!C.required(14,qualitativeCorpus).includes("assumptionChecks"))process.exit(1);
const interpretiveChecks=C.readinessChecks(14,qualitativeCorpus);
if(!interpretiveChecks.some(s=>s.includes("coding, close reading or another justified process")))process.exit(1);
if(!interpretiveChecks.some(s=>s.includes("suited to the method")))process.exit(1);

// literature-review record integrity and distinct study/report accounting
let litEvidence={data:{rawLocation:"original source and extraction register",descriptives:"included study characteristics"},pathway:{selected:"literature_review",confirmed:true}};
let litGate=C.stageGate(13,litEvidence);
if(litGate.canMarkReady||!litGate.missing.includes("missingObserved")||!litGate.missing.includes("errorsCorrections"))process.exit(1);
if(litGate.missing.includes("plots")||C.recommended(13,litEvidence).includes("errorsCorrections"))process.exit(1);
litEvidence.data.missingObserved="Unreported setting information retained as unclear";
litEvidence.data.errorsCorrections="Duplicate report linkage corrected in the extraction log";
litGate=C.stageGate(13,litEvidence);
if(!litGate.canMarkReady||litGate.missing.length!==0||!C.recommended(13,litEvidence).includes("plots"))process.exit(1);
if(C.recommended(12,litEvidence).includes("replication"))process.exit(1);
if(!C.required(12,litEvidence).includes("methodControls")||!C.required(14,litEvidence).includes("assumptionChecks"))process.exit(1);
if(!C.readinessChecks(13,litEvidence).some(x=>x.includes("records, reports and studies")))process.exit(1);
if(!C.readinessChecks(14,litEvidence).some(x=>x.includes("pooled estimate")))process.exit(1);
let reviewDesign={data:{designType:"Literature review",designWhy:"synthesis of available evidence",claimBoundary:"bounded by searched literature"},pathway:{selected:"literature_review",confirmed:true}};
if(!C.stageGate(9,reviewDesign).canMarkReady)process.exit(1);
reviewDesign.data.designType="Meta-analysis";
if(C.stageGate(9,reviewDesign).canMarkReady)process.exit(1);

// meta-analysis dependence and single-parameter synthesis checks
let metaParameter={data:{outcomeDV:"estimated prevalence",operationalDefs:"proportion and sampling variance",experimentalUnit:"independent source sample"},pathway:{selected:"meta_analysis",confirmed:true}};
let mp=C.stageGate(10,metaParameter);
if(!mp.canMarkReady||mp.missing.includes("predictorIV")||C.recommended(10,metaParameter).includes("predictorIV")||C.reviewStage(10,metaParameter).score!==100)process.exit(1);
metaParameter.data.outcomeDV="";
mp=C.stageGate(10,metaParameter);
if(mp.canMarkReady||!mp.missing.includes("outcomeDV"))process.exit(1);
let metaRecords={data:{rawLocation:"unaltered effect extraction source records",descriptives:"source and estimate counts"},pathway:{selected:"meta_analysis",confirmed:true}};
let mr=C.stageGate(13,metaRecords);
if(mr.canMarkReady||!mr.missing.includes("missingObserved")||!mr.missing.includes("errorsCorrections")||mr.missing.includes("plots"))process.exit(1);
metaRecords.data.missingObserved="Two studies lacked uncertainty measures; retained in the decision log";
metaRecords.data.errorsCorrections="A duplicate effect was linked to its original sample";
mr=C.stageGate(13,metaRecords);
if(!mr.canMarkReady||mr.missing.length||!C.recommended(13,metaRecords).includes("plots"))process.exit(1);
if(!C.required(12,metaRecords).includes("methodControls"))process.exit(1);
const metaChecks=C.readinessChecks(14,metaRecords);
if(!metaChecks.some(s=>s.includes("dependent estimates"))||!metaChecks.some(s=>s.includes("prediction interval")))process.exit(1);
let metaDesign={data:{designType:"Meta-analysis",designWhy:"combine comparable estimates",claimBoundary:"pooled results limited to samples"},pathway:{selected:"meta_analysis",confirmed:true}};
if(!C.stageGate(9,metaDesign).canMarkReady)process.exit(1);
metaDesign.data.designType="Literature review";
if(C.stageGate(9,metaDesign).canMarkReady)process.exit(1);

// mixed-methods integration and evidence-integrity regression checks
let mixedRecords={data:{rawLocation:"unaltered survey responses and interview audio",descriptives:"numeric summary and corpus account"},pathway:{selected:"mixed_methods",confirmed:true}};
let mixedGate=C.stageGate(13,mixedRecords);
if(mixedGate.canMarkReady||!mixedGate.missing.includes("missingObserved")||!mixedGate.missing.includes("errorsCorrections"))process.exit(1);
mixedRecords.data.missingObserved="Two unavailable interview segments logged";
mixedRecords.data.errorsCorrections="Original coding and correction decision retained";
mixedGate=C.stageGate(13,mixedRecords);
if(!mixedGate.canMarkReady||mixedGate.missing.length)process.exit(1);
if(C.recommended(10,mixedRecords).includes("predictorIV")||C.recommended(10,mixedRecords).includes("hypothesisNeeded"))process.exit(1);
if(!C.readinessChecks(9,mixedRecords).some(s=>s.includes("together or in sequence")))process.exit(1);
if(!C.readinessChecks(14,mixedRecords).some(s=>s.includes("connected, compared or combined")))process.exit(1);
if(!C.readinessChecks(16,mixedRecords).some(s=>s.includes("jointly contribute")))process.exit(1);
if(!C.required(12,mixedRecords).includes("methodControls")||!C.required(14,mixedRecords).includes("assumptionChecks"))process.exit(1);
let mixedDesign={data:{designType:"Mixed methods",designWhy:"paired complementary evidence",comparisonStructure:"quantitative then qualitative",claimBoundary:"bounded to these sites"},pathway:{selected:"mixed_methods",confirmed:true}};
if(!C.stageGate(9,mixedDesign).canMarkReady)process.exit(1);
mixedDesign.data.designType="Experimental";
if(C.stageGate(9,mixedDesign).canMarkReady)process.exit(1);

console.log("PASS pathway-specific coach");