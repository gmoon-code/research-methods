
global.window={};
require("../assets/methods.js");
const M=window.RMSMethods;
let p={data:{designType:"Experimental",finalRQ:"How does light affect plant growth?"},schema:[],methods:{}};
M.normalizeProject(p);
p.methods.constructs=[
 {name:"light",role:"Manipulated independent variable",operational:"8 vs 16 h light"},
 {name:"growth",role:"Outcome / dependent variable",operational:"height change in cm"}
];
p.methods.conditions=[{name:"8h",definition:"8 h light/day"},{name:"16h",definition:"16 h light/day"}];
p.methods.design={experimentalUnit:"plant",assignment:"Random assignment",sameUnitAllConditions:"no",primaryOutcome:"height change",independentUnits:"20",repeatsPerUnit:"4",subsamplesPerUnit:"2",rowUnit:"measurement"};
let a=M.auditDesign(p);
if(a.issues.some(x=>x[0]==="critical")) process.exit(1);
let r=M.auditReplication(p);
if(!r.issues.some(x=>/do not automatically/i.test(x[2]))) process.exit(1);
p.methods.ethics={humanParticipants:"no",storage:"local encrypted school drive"};
if(M.ethicsRoute(p).status!=="clear") process.exit(1);
p.methods.measurements=[{construct:"growth",instrument:"ruler",operational:"change in height",scale:"cm",timing:"daily",reliability:"same protocol",validity:"height is direct growth indicator"}];
p.schema=[{name:"plant_id",type:"ID",role:"identifier",definition:"anonymous plant id",missing:"NA"},{name:"height_cm",type:"Numeric",role:"outcome",definition:"height in cm",missing:"NA"}];
p.methods.sampling={population:"plants of this species",sample:"20 seedlings",method:"Convenience sample",generalization:"only similar seedlings"};
p.methods.procedureSteps=[{phase:"setup",action:"randomly assign plants",record:"assignment",deviation:"record deviations"},{phase:"treatment",action:"apply light",record:"hours",deviation:"flag missed exposure"},{phase:"measure",action:"measure height",record:"height_cm",deviation:"repeat only if transcription error"}];
let rd=M.readiness(p);
if(rd.score<=0) process.exit(1);
// Stage C-X3c9a | design profiles, assignment, sample-status and evidence routes.
p.methods.ethics={humanParticipants:"no"};
if(M.designProfile(p).human)process.exit(1);
p.methods.ethics={humanParticipants:"yes"};
if(!M.designProfile(p).human)process.exit(1);
p.methods.design.assignment="Nonrandom assignment";
if(M.inferStructure(p).structure!=="Nonrandom assigned between-unit")process.exit(1);
p.methods.design.assignment="Naturally occurring / observed exposure";
if(M.inferStructure(p).structure!=="Observed exposure; no researcher assignment")process.exit(1);
p.methods.design.assignment="Random assignment";
if(M.inferStructure(p).structure!=="Randomized between-unit")process.exit(1);
p.methods.design.sameUnitAllConditions="yes";
if(M.inferStructure(p).structure!=="Repeated-measures / within-unit")process.exit(1);
p.methods.design.sameUnitAllConditions="no";
const qp={data:{designType:"Quasi-experimental"},methods:{
  constructs:[{role:"Intervention / evaluated exposure"},{role:"Outcome / dependent variable"}],
  design:{experimentalUnit:"classroom",assignment:"Nonrandom assignment",sameUnitAllConditions:"no"},
  conditions:[{name:"baseline"},{name:"after intervention"}]}};
if(!M.roleOptions(qp).includes("Intervention / evaluated exposure"))process.exit(1);
if(M.auditDesign(qp).issues.some(x=>x[0]==="critical"&&/Intervention|Manipulated/.test(x[1])))process.exit(1);
const prop={methods:{sampling:{population:"secondary classrooms",method:"Convenience sample",generalization:"one local school"}}};
const sampleAudit=M.auditSampling(prop);
if(!sampleAudit.issues.some(x=>x[1]==="Planned or observed sample missing"))process.exit(1);
const reviewOnly={data:{designType:"Literature review"},methods:{measurements:[]}};
if(M.auditMeasurements(reviewOnly).issues.some(x=>x[0]==="critical"))process.exit(1);
const qualitativeOnly={data:{designType:"Qualitative"},methods:{measurements:[]}};
if(M.auditMeasurements(qualitativeOnly).issues.some(x=>x[0]==="critical"))process.exit(1);
const quantitative={data:{designType:"Experimental"},methods:{measurements:[]}};
if(!M.auditMeasurements(quantitative).issues.some(x=>x[0]==="critical"))process.exit(1);
const assignmentMissing={data:{designType:"Experimental"},methods:{
 constructs:[{role:"Manipulated independent variable"},{role:"Outcome / dependent variable"}],
 design:{experimentalUnit:"dish",sameUnitAllConditions:"no",primaryOutcome:"length"},
 conditions:[{name:"control"},{name:"salt"}]}};
const missingAudit=M.auditDesign(assignmentMissing);
if(!missingAudit.issues.some(x=>x[1]==="Assignment process not specified"))process.exit(1);
if(!missingAudit.good.some(x=>x.includes("check whether it was specified before")))process.exit(1);
const nonrandomSample={methods:{sampling:{population:"school",sample:"one class",method:"Nonrandom selection",generalization:"local class"}}};
if(M.auditSampling(nonrandomSample).issues.some(x=>x[1]==="Sampling frame missing"))process.exit(1);
// Stage C-X3c9b | consent, permission, procedure order, schema and version integrity.
const unset={data:{finalRQ:"What is measured?"},methods:{ethics:{}}};
if(M.ethicsRoute(unset).status!=="teacher_review")process.exit(1);
if(!M.ethicsRoute(unset).issues.some(x=>x[1]==="Human participation not classified"))process.exit(1);
const ethicsStudy={data:{designType:"Qualitative"},methods:{ethics:{humanParticipants:"yes",minors:"yes",consent:"review school policy",assent:"",withdrawal:"voluntary",storage:"restricted"}}};
if(M.ethicsRoute(ethicsStudy).status!=="teacher_review")process.exit(1);
if(!M.ethicsRoute(ethicsStudy).issues.some(x=>x[1]==="Minor participant assent/permission plan missing"))process.exit(1);
ethicsStudy.methods.procedureSteps=[
 {action:"Interview students",record:"recorded answer"},
 {action:"Obtain school approval and consent",record:"signed permission"},
 {action:"Protect files",record:"restricted folder"}];
if(!M.procedureAudit(ethicsStudy).issues.some(x=>x[1]==="Permission appears after research collection"))process.exit(1);
ethicsStudy.methods.procedureSteps=[ethicsStudy.methods.procedureSteps[1],ethicsStudy.methods.procedureSteps[0],ethicsStudy.methods.procedureSteps[2]];
if(M.procedureAudit(ethicsStudy).issues.some(x=>x[1]==="Permission appears after research collection"))process.exit(1);
const hazardous={data:{finalRQ:"Does sleep deprivation affect learning?"},methods:{ethics:{humanParticipants:"yes",consent:"ask school",withdrawal:"can stop",storage:"restricted"}}};
if(M.ethicsRoute(hazardous).status!=="do_not_facilitate")process.exit(1);
const qualitativeNoTable={data:{designType:"Qualitative"},methods:{design:{},ethics:{humanParticipants:"no"}}};
const qualIssues=M.dataSchemaAudit(qualitativeNoTable).issues;
if(qualIssues.some(x=>x[0]==="critical"))process.exit(1);
if(!qualIssues.some(x=>x[1]==="Qualitative record structure missing"))process.exit(1);
const nested={data:{designType:"Experimental"},methods:{design:{experimentalUnit:"dish",rowUnit:"seed per dish"}},schema:[
 {name:"dish_id",type:"ID",definition:"dish identifier",missing:"NA"},
 {name:"shoot_length_cm",type:"Numeric",definition:"cm from substrate surface to visible tip",missing:"0"}
]};
const nestedIssues=M.dataSchemaAudit(nested).issues;
if(!nestedIssues.some(x=>x[1]==="Row and study unit differ"))process.exit(1);
if(!nestedIssues.some(x=>x[1].includes("zero used as a missing code")))process.exit(1);
const readyLabel=M.readiness({data:{},methods:{ethics:{humanParticipants:"yes",consent:"planned",withdrawal:"planned",storage:"restricted"}}}).label;
if(/ready for teacher review|approved/i.test(readyLabel))process.exit(1);
const snapshotProject={data:{finalRQ:"Seed response"},schema:[{name:"dish_id",definition:"dish key"}],methods:{
 design:{experimentalUnit:"dish"},constructs:[{name:"shoot length",role:"Outcome / dependent variable"}],
 ethics:{humanParticipants:"no"},procedureSteps:[{action:"record Day 7 status"}]
}};
const saved=M.protocolSnapshot(snapshotProject);
snapshotProject.methods.design.experimentalUnit="seed";
snapshotProject.methods.constructs[0].name="changed";
snapshotProject.schema[0].name="changed";
snapshotProject.methods.procedureSteps[0].action="changed";
if(saved.design.experimentalUnit!=="dish"||saved.constructs[0].name!=="shoot length"||saved.schema[0].name!=="dish_id"||saved.procedureSteps[0].action!=="record Day 7 status")process.exit(1);
if(!M.methodMarkdown(snapshotProject).includes("not research approval"))process.exit(1);
console.log("PASS methods lab engine");
