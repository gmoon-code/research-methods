
global.window={};
// Stage 1 rescue guidance consistency using the complete canonical runtime model.
require("../assets/rescue-model.js");
const fullRescueModel=window.RMSRescueModel;
const earlyKeys=["interest1","problem1","claim1","access1","ideaA","ideaB","ideaC"];
const examples=[],frames=[];
for(const k of earlyKeys){
  const f=fullRescueModel.fields[k];
  if(f.stage!==1||Object.keys(f.levels).length!==5)process.exit(1);
  if(!f.levels["4"].walkthrough?.thinking?.length||!f.levels["4"].walkthrough?.draft)process.exit(1);
  if(!f.levels["5"].frame||/\[your project-specific answer\]/.test(f.levels["5"].frame))process.exit(1);
  examples.push(f.levels["4"].walkthrough.draft);
  frames.push(f.levels["5"].frame);
}
if(new Set(examples).size!==earlyKeys.length||new Set(frames).size!==earlyKeys.length)process.exit(1);
if(new Set(earlyKeys.map(k=>fullRescueModel.fields[k].levels["1"].prompt)).size!==earlyKeys.length)process.exit(1);
if(new Set(["ideaA","ideaB","ideaC"].map(k=>fullRescueModel.fields[k].levels["3"].strong_example)).size!==3)process.exit(1);
if(!/three/i.test(fullRescueModel.fields.interest1.levels["1"].body))process.exit(1);
if(!/three/i.test(fullRescueModel.fields.interest1.levels["2"].body))process.exit(1);
if(!/three/i.test(fullRescueModel.fields.interest1.levels["5"].frame))process.exit(1);

window.RMSRescueModel={
 version:"2.5",
 scaffold_levels:{"1":"reflection","2":"concept","3":"structured","4":"parallel","5":"rescue"},
 fields:{
   finalRQ:{stage:4,label:"Question",type:"textarea",options:[],levels:{"5":{frame:"frame",path_frames:{}}}},
   questionType:{stage:4,label:"Question family",type:"select",options:["Descriptive","Qualitative"],levels:{"5":{frame:"",path_frames:{}}}}
 },
 labs:{methods:{design:{stage:9,title:"Design"}}}
};
require("../assets/rescue.js");
const R=window.RMSRescue;
let supports=[];
const C={recordSupport:(p,s,l,src,d)=>supports.push({s,l,src,d})};
let p={rescue:{}};
R.normalizeProject(p);
let st=R.fieldState(p,4,"finalRQ");
if(R.canOpen(st,2))process.exit(1);
let threw=false;try{R.useFieldLevel(p,4,"finalRQ",2,"draft","observational",C)}catch(e){threw=true}
if(!threw)process.exit(1);
R.useFieldLevel(p,4,"finalRQ",1,"draft","observational",C);
R.useFieldLevel(p,4,"finalRQ",1,"draft","observational",C);
if(p.rescue.attemptSnapshots.length!==1||supports.length!==1)process.exit(1);
for(let l=2;l<=4;l++)R.useFieldLevel(p,4,"finalRQ",l,"draft","observational",C);
if(R.fieldState(p,4,"finalRQ").maxLevel!==4)process.exit(1);
let ev=R.applyFieldRevision(p,4,"finalRQ","draft","better draft","fits evidence","observational",C);
if(ev.before!=="draft"||ev.after!=="better draft"||p.rescue.revisions.length!==1)process.exit(1);
if(R.fieldState(p,4,"finalRQ").maxLevel!==5)process.exit(1);

for(let l=1;l<=4;l++)R.useFieldLevel(p,4,"questionType",l,"","unsure",C);
threw=false;try{R.applyFieldRevision(p,4,"questionType","","Invalid","why","unsure",C)}catch(e){threw=true}
if(!threw)process.exit(1);
R.applyFieldRevision(p,4,"questionType","","Qualitative","because I need experience evidence","qualitative",C);

let lp={rescue:{}};for(let l=1;l<=4;l++)R.useLabLevel(lp,"methods","design",l,"experimental",C);
let note=R.saveLabNote(lp,"methods","design","Compare assigned conditions","matches experimental question","experimental",C);
if(note.supportLevel!==5||lp.rescue.notes.length!==1)process.exit(1);
// Rescue fields eight through twenty-five follow their distinct research tasks.
const secondKeys=["broadTopic","subtopic","phenomenon","contextPop","scope","timeLimit","resources","safety","topicChoice","concepts","synonyms","prelimSearch","known","methodsSeen","uncertain","questionShift","rq1","rq2"];
const nextExamples=[],nextFrames=[],nextPrompts=[];
for(const k of secondKeys){
  const f=fullRescueModel.fields[k];
  if(!f||Object.keys(f.levels).length!==5)process.exit(1);
  if(!f.levels["4"].walkthrough?.thinking?.length||!f.levels["4"].walkthrough?.draft)process.exit(1);
  if(!f.levels["1"].prompt||!f.levels["5"].frame)process.exit(1);
  if(f.levels["5"].frame.includes("[your project-specific answer]")||f.levels["5"].frame.includes("Why it fits:"))process.exit(1);
  nextExamples.push(f.levels["4"].walkthrough.draft);
  nextFrames.push(f.levels["5"].frame);
  nextPrompts.push(f.levels["1"].prompt);
}
if(new Set(nextExamples).size!==secondKeys.length||new Set(nextFrames).size!==secondKeys.length||new Set(nextPrompts).size!==secondKeys.length)process.exit(1);
if(!/two or three/i.test(fullRescueModel.fields.prelimSearch.levels["2"].body))process.exit(1);
if(!/Proposed searches/.test(fullRescueModel.fields.prelimSearch.levels["4"].walkthrough.draft))process.exit(1);
if(!/cited sources/.test(fullRescueModel.fields.known.levels["5"].frame))process.exit(1);
if(!/different evidence or method/.test(fullRescueModel.fields.rq2.levels["5"].frame))process.exit(1);
if(!/may differ/.test(fullRescueModel.fields.phenomenon.levels["4"].walkthrough.draft))process.exit(1);




// Stage C-X3a2 | fields 26–50 must retain independent pedagogical guidance.
const stageCX3a2Keys=["rq3","questionType","finalRQ","rqJustification","searchBlock1","searchBlock2","searchBlock3","searchStrings","databases","includeCriteria","excludeCriteria","searchLog","theme1","theme2","theme3","tensions","repeatedLimits","gapType","gapStatement","litToRQ","litIntroPlan","litThemePlan","litTensionPlan","litEndPlan","litDraft"];
for(const k of stageCX3a2Keys){
  const field=fullRescueModel.fields[k];
  if(!field||Object.keys(field.levels).length!==5)process.exit(1);
  if(!field.levels["1"].prompt||!field.levels["2"].body||!field.levels["3"].strong_example)process.exit(1);
  if(!field.levels["4"].walkthrough?.thinking?.length||!field.levels["4"].walkthrough?.draft)process.exit(1);
  if(field.levels["5"].frame.includes("[your project-specific answer]")||field.levels["5"].frame.includes("Why it fits:"))process.exit(1);
  if(JSON.stringify(field).includes("—"))process.exit(1);
}
for(const [level,read] of [["L1",f=>f.levels["1"].prompt],["L3",f=>f.levels["3"].strong_example],["L4",f=>f.levels["4"].walkthrough.draft],["L5",f=>f.levels["5"].frame]]){
  if(new Set(stageCX3a2Keys.map(k=>read(fullRescueModel.fields[k]))).size!==stageCX3a2Keys.length)process.exit(1);
}
if(!/Qualitative/.test(fullRescueModel.fields.questionType.levels["4"].walkthrough.draft))process.exit(1);
if(!/Neither is recorded as executed/.test(fullRescueModel.fields.searchStrings.levels["4"].walkthrough.draft))process.exit(1);
if(!/No date, retrieval count or inclusion count recorded/.test(fullRescueModel.fields.searchLog.levels["4"].walkthrough.draft))process.exit(1);
if(!/fictional/i.test(fullRescueModel.fields.litDraft.levels["4"].walkthrough.draft))process.exit(1);
if(!/optional/i.test(fullRescueModel.fields.theme3.levels["1"].prompt))process.exit(1);


// Stage C-X3a3 | fields 51–75 have five relevant, independently worded scaffolds.
const stageCX3a3Keys=["designType","designWhy","comparisonStructure","claimBoundary","hypothesisNeeded","researchHyp","nullHyp","hypReason","predictorIV","outcomeDV","operationalDefs","controlCondition","controlledConditions","confounders","experimentalUnit","population","sample","samplingMethod","sampleLimits","instrument","measureQuality","ethicsIssues","ethicsPlan","materials","procedure"];
for(const key of stageCX3a3Keys){
 const f=fullRescueModel.fields[key];
 if(!f||Object.keys(f.levels).length!==5)process.exit(1);
 if(!f.levels["1"].prompt||!f.levels["2"].body||!f.levels["3"].strong_example)process.exit(1);
 if(!f.levels["4"].walkthrough?.thinking?.length||!f.levels["4"].walkthrough?.draft)process.exit(1);
 if(!f.levels["5"].frame||/your project-specific answer|Why it fits:/.test(f.levels["5"].frame))process.exit(1);
 if(JSON.stringify(f).includes("—"))process.exit(1);
}
for(const get of [f=>f.levels["1"].prompt,f=>f.levels["3"].strong_example,f=>f.levels["4"].walkthrough.draft,f=>f.levels["5"].frame]){
 if(new Set(stageCX3a3Keys.map(k=>get(fullRescueModel.fields[k]))).size!==stageCX3a3Keys.length)process.exit(1);
}
if(!/Pre-existing groups/.test(fullRescueModel.fields.designType.levels["3"].choice.options["Quasi-experimental"]))process.exit(1);
if(!/dish/.test(fullRescueModel.fields.experimentalUnit.levels["4"].walkthrough.draft))process.exit(1);
if(!/remains to be determined/.test(fullRescueModel.fields.sample.levels["4"].walkthrough.draft))process.exit(1);
if(!/other settings/.test(fullRescueModel.fields.sampleLimits.levels["4"].walkthrough.draft))process.exit(1);
if(!/sensor/.test(fullRescueModel.fields.instrument.levels["4"].walkthrough.draft))process.exit(1);
if(!/safety/.test(fullRescueModel.fields.ethicsIssues.levels["1"].prompt))process.exit(1);
if(!/Before collecting/.test(fullRescueModel.fields.ethicsPlan.levels["5"].frame))process.exit(1);




// Stage C-X3a4 | independently tailored methods, integrity and results fields.
const stageCX3a4Keys=["replication","methodControls","rowUnit","columns","missingRule","exclusionRule","analysisIntent","rawLocation","missingObserved","errorsCorrections","plots","descriptives","primaryEstimand","analysisChoice","assumptionChecks","effectSizePlan","multiplicity","analysisSample","result1","result2","unexpected","resultsDraft","directAnswer","interpret1","interpret2"];
for(const k of stageCX3a4Keys){
 const f=fullRescueModel.fields[k];
 if(!f||Object.keys(f.levels).length!==5)process.exit(1);
 if(!f.levels["1"].prompt||!f.levels["2"].body||!f.levels["3"].strong_example)process.exit(1);
 if(!f.levels["4"].walkthrough?.thinking?.length||!f.levels["4"].walkthrough?.draft)process.exit(1);
 if(!f.levels["5"].frame||/your project-specific answer|Why it fits:/.test(f.levels["5"].frame))process.exit(1);
 if(JSON.stringify(f).includes("—"))process.exit(1);
}
for(const get of [f=>f.levels["1"].prompt,f=>f.levels["3"].strong_example,f=>f.levels["4"].walkthrough.draft,f=>f.levels["5"].frame]){
 if(new Set(stageCX3a4Keys.map(k=>get(fullRescueModel.fields[k]))).size!==25)process.exit(1);
}
if(!/independently assigned dishes/.test(fullRescueModel.fields.replication.levels["4"].walkthrough.draft))process.exit(1);
if(!/missing/.test(fullRescueModel.fields.missingRule.levels["4"].walkthrough.draft))process.exit(1);
if(!/remain pending/.test(fullRescueModel.fields.analysisSample.levels["4"].walkthrough.draft))process.exit(1);
if(!/paired binary/.test(fullRescueModel.fields.analysisChoice.levels["4"].walkthrough.draft))process.exit(1);
if(!/not establish equivalence/.test(fullRescueModel.fields.unexpected.levels["4"].walkthrough.draft))process.exit(1);
if(!/did not measure/.test(fullRescueModel.fields.interpret1.levels["4"].walkthrough.draft))process.exit(1);

console.log("PASS v2.5 progressive rescue state and logging");
