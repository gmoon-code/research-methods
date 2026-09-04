
global.window = {};
require("../assets/engine.js");
require("../assets/coach.js");
const C=window.RMSCoach;
let fails=0;
function ok(name,cond){if(!cond){console.error("FAIL",name);fails++}else console.log("PASS",name)}
let r=C.designRecommendation("associate","no","na","numbers");
ok("association design",r.design==="Correlational / observational");
r=C.designRecommendation("cause","yes","random","numbers");
ok("randomized manipulation",r.design==="Experimental");
r=C.designRecommendation("cause","yes","nonrandom","numbers");
ok("nonrandom manipulation",r.design==="Quasi-experimental");
r=C.designRecommendation("experience","no","na","words");
ok("qualitative",r.design==="Qualitative");
const q=C.makeBoolean(["retrieval practice, active recall","delayed memory, retention","high school students, adolescents"]);
ok("boolean AND",q.includes(" AND "));
ok("boolean OR",q.includes(" OR "));
const p={data:{finalRQ:"Does screen time cause worse sleep in students?",questionType:"Correlational / observational",rqJustification:"I can measure both variables."},sources:[]};
r=C.reviewStage(4,p);
ok("causal mismatch detected",r.messages.some(x=>/causal/i.test(x.title+x.body)));
r=C.riskScan("I want to sleep less for a week to see whether I remember more.");
ok("sleep risk",r.flagged);
if(fails)process.exit(1);
