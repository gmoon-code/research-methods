
global.window={};
require("../assets/student-guidance.js");
const G=window.RMSStudentGuidance;
if(Object.keys(G.stages).length!==18)process.exit(1);
if(Object.keys(G.fields).length!==113)process.exit(1);
for(const [k,h] of Object.entries(G.fields)){
  if((h.meaning||"").startsWith("This box records"))process.exit(1);
  if(!h.meaning||!h.write||!h.example||!h.questions?.length||!h.avoid)process.exit(1);
}
for(let i=1;i<=18;i++){
  const w=G.stages[i]?.walkthrough;
  if(!w||!w.situation||!Array.isArray(w.thinking)||w.thinking.length<3||!w.draft)process.exit(1);
}
for(const k of ["questionType","gapType","designType","hypothesisNeeded","mdAssignment","mdSameUnit","msMethod","meHuman","meIdent","sourceType","screeningStatus","themeStance","analysisStructure","outcomeType","correlationCoefficient","anovaModel","fisherChoice"]){
  if(!G.choices[k]||Object.keys(G.choices[k].options||{}).length<2)process.exit(1);
}
if(!G.novicePromise||G.novicePromise.length<80)process.exit(1);
console.log("PASS v2.2 novice guidance model");
