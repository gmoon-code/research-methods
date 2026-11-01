
global.window={};
require("../assets/student-guidance.js");
const G=window.RMSStudentGuidance;
if(Object.keys(G.stages).length!==18)process.exit(1);
if(Object.keys(G.fields).length!==113)process.exit(1);
if(Object.keys(G.glossary).length<80)process.exit(1);
for(const k of ["binary","experimental unit","estimand","paired data","confounder","p-value","effect size"])if(!G.glossary[k])process.exit(1);
for(let i=1;i<=18;i++){const s=G.stages[i];if(!s||s.steps.length<4||s.examples.length<1||s.stuck.length<2||s.terms.length<2)process.exit(1);}
for(const h of Object.values(G.fields))if(!h.meaning||!h.write||!h.example||!h.questions?.length||!h.avoid)process.exit(1);
for(const lab of ["literature","methods","data","writing"])if(!G.labs[lab]||Object.keys(G.labs[lab]).length<7)process.exit(1);
// Stage C-X3c3a | first 30 glossary definitions and methodological boundaries.
const firstThirty=Object.keys(G.glossary).slice(0,30);
if(firstThirty.length!==30||firstThirty[0]!=="analysis"||firstThirty[29]!=="Fisher exact test")process.exit(1);
for(const term of firstThirty)if(!G.glossary[term]?.trim()||G.glossary[term].includes("—"))process.exit(1);
if(!/organising evidence/.test(G.glossary.analysis))process.exit(1);
if(!/related terms when justified/.test(G.glossary["boolean search"]))process.exit(1);
if(!/labelling passages/.test(G.glossary.coding))process.exit(1);
if(!/repeated studies/.test(G.glossary["confidence interval"]))process.exit(1);
if(!/standardised/.test(G.glossary["controlled condition"]))process.exit(1);
if(!/carryover may still require/.test(G.glossary.counterbalancing))process.exit(1);
if(!/The numerical value calculated/.test(G.glossary.estimand))process.exit(1);
if(!/independently assigned/.test(G.glossary["experimental unit"]))process.exit(1);
if(!/In observational research, exposure is recorded/.test(G.glossary.exposure))process.exit(1);

// Stage C-X3c3b | glossary definitions 31-60 retain inferential distinctions.
const middleThirty=Object.keys(G.glossary).slice(30,60);
if(middleThirty.length!==30||middleThirty[0]!=="generalization"||middleThirty[29]!=="predictor")process.exit(1);
for(const term of middleThirty)if(!G.glossary[term]?.trim()||G.glossary[term].includes("—"))process.exit(1);
if(!/generalisation/.test(G.glossary.generalization))process.exit(1);
if(!/re-identified/.test(G.glossary.identifier))process.exit(1);
if(!/matched pairs/.test(G.glossary["independent groups"]))process.exit(1);
if(!/population or model parameter/.test(G.glossary["interval estimate"]))process.exit(1);
if(!/a brief scan cannot establish/.test(G.glossary["literature gap"]))process.exit(1);
if(!/dependence between estimates/.test(G.glossary["meta-analysis"]))process.exit(1);
if(!/observed zero/.test(G.glossary["missing data"]))process.exit(1);
if(!/categorical data/.test(G.glossary.numerical))process.exit(1);
if(!/test statistic at least as extreme/.test(G.glossary["p-value"]))process.exit(1);
if(!/census/.test(G.glossary.population))process.exit(1);
if(!/observed or assigned/.test(G.glossary.predictor))process.exit(1);

// Stage C-X3c3c | final 30 glossary definitions.
const finalThirty=Object.keys(G.glossary).slice(60);
if(finalThirty.length!==30||finalThirty[0]!=="protocol"||finalThirty[29]!=="identifiable data")process.exit(1);
for(const term of finalThirty)if(!G.glossary[term]?.trim()||G.glossary[term].includes("—"))process.exit(1);
if(!/later changes, which should be dated/.test(G.glossary.protocol))process.exit(1);
if(!/diagrams, models and observed interactions/.test(G.glossary["qualitative data"]))process.exit(1);
if(!/chance imbalances may remain/.test(G.glossary["random assignment"]))process.exit(1);
if(!/actually contribute evidence/.test(G.glossary.sample))process.exit(1);
if(!/probabilistic or non-probabilistic/.test(G.glossary["sampling frame"]))process.exit(1);
if(!/pairs whose classifications differ/.test(G.glossary["McNemar test"]))process.exit(1);
if(!/without identifying which conditions differ/.test(G.glossary["Cochran Q"]))process.exit(1);
if(!/does not automatically represent a causal effect/.test(G.glossary.regression))process.exit(1);

// Stage C-X3c4a | first 25 student-help entries and source-status boundaries.
const firstFieldKeys=Object.keys(G.fields).slice(0,25);
if(firstFieldKeys.length!==25||firstFieldKeys[0]!=="interest1"||firstFieldKeys[24]!=="rq2")process.exit(1);
for(const k of firstFieldKeys){
 const v=G.fields[k];
 if(!v.meaning||!v.write||!v.example||!v.questions?.length||!v.avoid||JSON.stringify(v).includes("—"))process.exit(1);
}
if(!/still require confirmation/.test(G.fields.access1.example))process.exit(1);
if(!/Radish seeds/.test(G.fields.contextPop.example))process.exit(1);
if(!/analysing records/.test(G.fields.timeLimit.meaning))process.exit(1);
if(!/18 labelled dishes/.test(G.fields.resources.example))process.exit(1);
if(!/actually run/.test(G.fields.prelimSearch.meaning))process.exit(1);
if(!/label the claim as something to investigate/.test(G.fields.known.write))process.exit(1);
if(!/For a proposed review/.test(G.fields.methodsSeen.write))process.exit(1);
if(!/based on source evidence already read/.test(G.fields.uncertain.write))process.exit(1);
if(!/hypothetical reading exercise/.test(G.fields.questionShift.example))process.exit(1);
if(!/describe the study practices/.test(G.fields.rq2.example))process.exit(1);

// Stage C-X3c4b | literature-help content checkpoints.
const k25=Object.keys(G.fields).slice(25,50);
if(k25.length!==25||k25[0]!=="rq3"||k25[24]!=="litDraft")process.exit(1);
for(const key of k25){const v=G.fields[key];if(!v.meaning||!v.write||!v.example||!v.questions?.length||!v.avoid||JSON.stringify(v).includes("—"))process.exit(1)}
if(!G.fields.rqJustification.example.includes("would not be anonymous"))process.exit(1);
if(!G.fields.searchLog.example.includes("not an executed search"))process.exit(1);
if(!G.fields.litThemePlan.write.includes("as many sections as the actual evidence needs"))process.exit(1);
if(!G.fields.litDraft.example.includes("Fictional drafting illustration only"))process.exit(1);
console.log("PASS student guidance coverage");
