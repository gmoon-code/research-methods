
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
console.log("PASS methods lab engine");
