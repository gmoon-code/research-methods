
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

console.log("PASS student guidance coverage");
