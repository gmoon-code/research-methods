
global.window={};
require("../assets/exemplar-projects.js");
window.RMSPathways={selected:p=>({name:p.pathway?.selected||"Unsure"})};
require("../assets/exemplar.js");
const X=window.RMSExemplar,bank=window.RMSExemplarProjects;
const expected=["descriptive_quantitative","observational","experimental","quasi_experimental","qualitative","literature_review","meta_analysis","mixed_methods"];
if(bank.projects.length!==8)process.exit(1);
for(const path of expected){
  const ex=bank.projects.find(x=>x.path===path);
  if(!ex||ex.stages.length!==18)process.exit(1);
  for(let i=1;i<=18;i++){
    const s=ex.stages.find(x=>x.id===i);
    if(!s||!s.decision||!s.rejected||!s.forward||!s.reasoning?.length||!s.notebook)process.exit(1);
  }
  if(ex.sources?.some(s=>!s.verified))process.exit(1);
}
let p={pathway:{selected:"qualitative"},competency:{independentCheckpoints:[],supportEvents:[]},exemplar:{}};
X.normalizeProject(p);
if(X.recommendedProject(p).path!=="qualitative")process.exit(1);
let support=[];
const C={recordSupport:(p,stage,level,source,detail)=>support.push({stage,level,source,detail})};
const q=X.recommendedProject(p);
X.recordStageView(p,q.id,14,C);
if(support.length!==1||support[0].level!==4||support[0].stage!==14)process.exit(1);
const obs=bank.projects.find(x=>x.path==="observational");
X.recordStageView(p,obs.id,14,C);
if(support.length!==2)process.exit(1);
if(X.viewedCount(p,q.id)!==1||X.viewedCount(p,obs.id)!==1)process.exit(1);
if(!X.pathDifference("qualitative","observational"))process.exit(1);
console.log("PASS v2.8 multi-path exemplar engine");
