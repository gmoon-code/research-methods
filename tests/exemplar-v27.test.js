
global.window={};
require("../assets/exemplar-projects.js");
window.RMSPathways={selected:p=>({name:p.pathway?.selected||"Unsure"})};
require("../assets/exemplar.js");
const X=window.RMSExemplar,bank=window.RMSExemplarProjects;
if(bank.projects.length!==1)process.exit(1);
const ex=bank.projects[0];
if(ex.stages.length!==18)process.exit(1);
for(let i=1;i<=18;i++){
  const s=ex.stages.find(x=>x.id===i);
  if(!s||!s.where||!s.changed||!s.reasoning?.length||!s.decision||!s.rejected||!s.notebook||!s.forward||!s.compare?.length)process.exit(1);
}
if(ex.status!=="synthetic_instructional_exemplar")process.exit(1);
if(ex.sources.length!==3||ex.sources.some(s=>!s.verified))process.exit(1);

let supports=[];
const C={recordSupport:(p,stage,level,source,detail)=>supports.push({stage,level,source,detail})};
let p={pathway:{selected:"observational"},competency:{independentCheckpoints:[],supportEvents:[]},exemplar:{}};
X.normalizeProject(p);
let w=X.stageWarning(p,10);
if(!w.needsConfirm||!/independent checkpoint/i.test(w.title+w.body))process.exit(1);
X.recordStageView(p,ex.id,10,C);
X.recordStageView(p,ex.id,10,C);
if(supports.length!==1||supports[0].level!==4||supports[0].stage!==10)process.exit(1);
if(!X.pathDifference("observational","experimental"))process.exit(1);

let p2={pathway:{selected:"experimental"},competency:{independentCheckpoints:[{stage:14,independentEligible:true}],supportEvents:[]},exemplar:{}};
X.normalizeProject(p2);
w=X.stageWarning(p2,14);
if(!/already preserved/i.test(w.title+w.body))process.exit(1);

let p3={pathway:{selected:"experimental"},competency:{independentCheckpoints:[],supportEvents:[]},exemplar:{}};
X.normalizeProject(p3);
X.recordBundleView(p3,ex.id,"data",C);
for(const s of [12,13,14,15])if(!p3.exemplar.viewedStages[String(s)])process.exit(1);
X.saveReflection(p3,13,"My unit differs.");
if(p3.exemplar.reflections["13"].text!=="My unit differs.")process.exit(1);
console.log("PASS v2.7 exemplar engine and support logging");
