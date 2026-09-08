
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
console.log("PASS student guidance coverage");
