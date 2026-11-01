global.window={};
require("../assets/analytics.js");
const A=window.RMSAnalytics;
function make(rows){const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];const p={analysis:{headers,rawData:rows},data:{},methods:{}};A.normalizeProject(p);return p}
const small=make([
 {group:"A",outcome:"yes"},{group:"A",outcome:"no"},
 {group:"B",outcome:"yes"},{group:"B",outcome:"yes"}]);
const sparse=A.runAnalysis(small,{structure:"categorical_assoc",x:"group",y:"outcome",fisher:"no"});
if(!sparse.error||!sparse.error.includes("Fisher exact"))process.exit(1);
const exact=A.runAnalysis(small,{structure:"categorical_assoc",x:"group",y:"outcome",fisher:"yes"});
if(exact.error||exact.output.test.indexOf("Fisher")<0)process.exit(1);
const binaryBad=make([{a:"1",b:"0"},{a:"0",b:"1"},{a:"1",b:"NA"}]);
const bad=A.runAnalysis(binaryBad,{structure:"paired_binary",x:"a",y:"b",success:"1"});
if(!bad.error||!bad.error.includes("missing-value code"))process.exit(1);
const binaryThree=make([{a:"yes",b:"no"},{a:"no",b:"maybe"},{a:"yes",b:"yes"}]);
const unexpected=A.runAnalysis(binaryThree,{structure:"paired_binary",x:"a",y:"b",success:"yes"});
if(!unexpected.error||!unexpected.error.includes("no more than two"))process.exit(1);
const paired=make([{a:"1",b:"0"},{a:"1",b:"0"},{a:"0",b:"1"},{a:"0",b:"0"}]);
const valid=A.runAnalysis(paired,{structure:"paired_binary",x:"a",y:"b",success:"1"});
if(valid.error||valid.output.discordant_b!==2||valid.output.discordant_c!==1)process.exit(1);
const repeated=make([{t1:"1",t2:"0",t3:"NA"},{t1:"0",t2:"1",t3:"0"}]);
if(!A.runAnalysis(repeated,{structure:"repeated_binary",columns:["t1","t2","t3"],success:"1"}).error)process.exit(1);
const wide=make([{t1:"1",t2:"0",t3:"1"},{t1:"0",t2:"1",t3:"0"},{t1:"1",t2:"1",t3:"0"}]);
const q=A.runAnalysis(wide,{structure:"repeated_binary",columns:["t1","t2","t3"],success:"1"});
if(q.error||q.output.test.indexOf("Cochran")<0)process.exit(1);
const record=A.analysisRecord(paired,valid);
if(record.calculation_guard_version!=="C-X3c10c"||!/independent review/.test(record.validation_scope))process.exit(1);
console.log("PASS contingency, paired binary coding and guarded records");
