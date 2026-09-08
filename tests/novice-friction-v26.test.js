
global.window={};
window.RMSPathCoach={
 reviewStage:(s,p)=>({score:90,label:"Strong",messages:[],details:{missing:[]}}),
 required:(s,p)=>s===14?["analysisChoice"]:[],
 readinessChecks:()=>[],recommended:()=>[],methodsReadiness:()=>({}),methodSection:()=>({}),pathName:p=>p.pathway?.selected||"unsure",compatibleDesign:()=>true
};
window.RMSPathways={label:(p,k,d)=>d};
require("../assets/novice-friction.js");
const G=window.RMSNoviceGuard;
let p={data:{analysisChoice:"idk"},pathway:{selected:"qualitative"}};
let r=G.reviewStage(14,p);
if(!r.messages.some(x=>x.code==="NG-PLACEHOLDER"))process.exit(1);
if(G.stageGate(14,p).canMarkReady)process.exit(1);
p={data:{comparisonStructure:"same students before and after",analysisChoice:"independent t-test",primaryEstimand:"change"},pathway:{selected:"observational"}};
r=G.reviewStage(14,p);
if(!r.messages.some(x=>x.code==="NG-PAIRING-LOST"))process.exit(1);
p={data:{resultsDraft:"p = .03 means there is a 97% probability that the hypothesis is true"},pathway:{selected:"observational"}};
r=G.reviewStage(15,p);
if(!r.messages.some(x=>x.code==="NG-PVALUE-PROBABILITY"))process.exit(1);
console.log("PASS v2.6 novice friction guard");
