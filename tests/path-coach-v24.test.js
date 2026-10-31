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

console.log("PASS pathway-specific coach");