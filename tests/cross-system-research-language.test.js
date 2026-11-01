global.window={};
require("../assets/curriculum.js");
require("../assets/student-guidance.js");
require("../assets/methods.js");
require("../assets/analytics.js");
require("../assets/writing.js");
const fs=require("node:fs"),path=require("node:path");
const R=JSON.parse(fs.readFileSync(path.join(__dirname,"../assets/rescue-model-v2.5.json"),"utf8"));
const C=window.RMSCurriculum,G=window.RMSStudentGuidance,M=window.RMSMethods,A=window.RMSAnalytics,W=window.RMSWriting;
const stage=id=>C.stages.find(s=>s.id===id),field=(id,key)=>stage(id).sections.flatMap(x=>x.fields||[]).find(x=>x[0]===key);
const s11=stage(11),s12=stage(12),s13=stage(13),s16=stage(16);
if(!field(11,"sample")[1].includes("Planned sample or actual sample"))process.exit(1);
if(!R.fields.sample.label.includes("Planned or actual sample")||!R.fields.sample.levels["3"].avoid.includes("completed recruitment"))process.exit(1);
if(!G.stages["11"].steps[0].includes("proposed sample")||!G.stages["11"].walkthrough.thinking.some(s=>s.includes("actual sample will depend")))process.exit(1);
if(!s12.title.includes("save a dated data plan")||!/saving a plan does not establish/.test(s12.learn))process.exit(1);
if(!R.fields.rowUnit.levels["2"].body.includes("interviews, documents"))process.exit(1);
if(!G.stages["12"].plain.includes("tabular dataset")||!/qualitative interviews/i.test(s12.learn))process.exit(1);
if(!field(12,"rowUnit")[1].includes("evidence record"))process.exit(1);
if(!R.fields.missingRule.levels["2"].body.includes("separately in the Data Lab"))process.exit(1);
if(!G.stages["12"].steps.some(s=>s.includes("explicit missing tokens separately")))process.exit(1);
if(!s12.learn.includes("prose plan does not automatically recode imported values"))process.exit(1);
if(!R.fields.analysisIntent.levels["1"].body.includes("when a later method was selected"))process.exit(1);
if(!field(12,"analysisIntent")[1].includes("specified before evidence review"))process.exit(1);
if(!s13.checks.some(s=>s.includes("without retroactively presenting decisions as prespecified")))process.exit(1);
if(/At least two/i.test(field(16,"limitations")[1])||/At least two/i.test(R.fields.limitations.levels["2"].body))process.exit(1);
if(!field(16,"limitations")[1].includes("Consequential limitations"))process.exit(1);
if(!W.discussionRequirements({writing:{reportingMode:"completed"},data:{designType:"Qualitative"}}).some(s=>s.includes("limitations")))process.exit(1);
// Saving a protocol stores a version of a plan, not evidence of implementation.
const p={data:{finalRQ:"How do conditions differ?",designType:"Experimental"},methods:{
 design:{experimentalUnit:"dish",rowUnit:"seed",independentUnits:6},ethics:{humanParticipants:"no"},
 procedureSteps:[{action:"record measurements"}]}};
M.normalizeProject(p);const snap=M.protocolSnapshot(p);
p.methods.design.experimentalUnit="seed";
if(snap.design.experimentalUnit!=="dish"||!snap.lockedAt)process.exit(1);
// Original zeros must survive declared missing-code treatment.
const q={analysis:{headers:["dish","value"],missingTokens:"99",rawData:[
 {dish:"D1",value:"0"},{dish:"D2",value:"2"},{dish:"D3",value:"99"}]},data:{},methods:{design:{experimentalUnit:"dish",rowUnit:"dish",independentUnits:3}}};
A.normalizeProject(q);const d=A.runAnalysis(q,{structure:"descriptive_numeric",y:"value"});
if(d.error||d.output.n!==2||d.output.mean!==1||q.analysis.rawData[2].value!=="99"||q.analysis.rawData[0].value!=="0")process.exit(1);
const proposal={data:{designType:"Qualitative",finalRQ:"How are explanations described?"},writing:{reportingMode:"proposal"},methods:{},analysis:{runs:[]}};
W.normalizeProject(proposal);
if(W.paperAudit(proposal).issues.some(x=>x[1]==="No linked Data Lab analysis"||x[1]==="Results draft missing"))process.exit(1);
if(!W.paperMarkdown(proposal).includes("## Planned Method"))process.exit(1);
console.log("PASS curriculum, Rescue and Methods/Data/Writing research-status consistency");
