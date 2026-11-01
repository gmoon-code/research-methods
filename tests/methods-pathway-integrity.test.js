global.window={};
window.RMSCoach={reviewStage:(stage,project)=>({score:80,label:"Developing",messages:[],details:{missing:[]}})};
window.RMSPathways={selected:p=>({name:({experimental:"Experimental study",literature_review:"Literature review",qualitative:"Qualitative study"})[p.pathway?.selected]||"Unsure"}),label:(p,k,d)=>d};
require("../assets/methods.js");
require("../assets/path-coach-model.js");
require("../assets/path-coach.js");
const M=window.RMSMethods,C=window.RMSPathCoach;
const p={data:{designType:"Experimental"},pathway:{selected:"experimental"},schema:[
  {name:"dish_id",type:"ID",definition:"dish ID",missing:"NA"}],methods:{
  constructs:[{role:"Manipulated independent variable"},{role:"Outcome / dependent variable"}],
  conditions:[{name:"0 mM"},{name:"100 mM"}],
  design:{experimentalUnit:"dish",rowUnit:"dish",assignment:"Random assignment",sameUnitAllConditions:"no",independentUnits:12,primaryOutcome:"Day 7 mean shoot length"},
  sampling:{population:"radish seedlings",sample:"twelve dishes",method:"Convenience sample",generalization:"similar settings",inclusion:"intact dishes",exclusion:"document damaged dishes"},
  measurements:[{construct:"shoot length",operational:"length from substrate surface",instrument:"ruler",scale:"cm",timing:"Day 7",reliability:"consistent procedure",validity:"visible shoot measure"}],
  ethics:{humanParticipants:"yes",minors:"no",identifiable:"no",sensitive:"no",intervention:"no",consent:"school permission plan",withdrawal:"voluntary",storage:"restricted"},
  procedureSteps:[{action:"Obtain consent and permission",record:"permission"},{action:"Assign dishes",record:"assignment"},{action:"Measure shoot length",record:"dish outcome"}]
}};
const ready=C.methodsReadiness(p);
if(ready.ethicsStatus!=="teacher_review")process.exit(1);
if(ready.critical!==0)process.exit(1);
if(ready.label!=="Institutional or teacher review required")process.exit(1);
const review={pathway:{selected:"literature_review"},data:{designType:"Literature review"},methods:{sampling:{}}};
if(C.methodSection(review,"sampling").issues.some(x=>/sample missing/i.test(x[1])))process.exit(1);
if(C.methodSection({pathway:{selected:"qualitative"},data:{designType:"Qualitative"},methods:{design:{}}},"data").issues.some(x=>x[0]==="critical"))process.exit(1);
const sourceCode=require("node:fs").readFileSync(require("node:path").join(__dirname,"../assets/app.js"),"utf8");
if(!sourceCode.includes("Saving a protocol version does not grant research approval."))process.exit(1);
if(!sourceCode.includes("No issue detected by these automatic checks."))process.exit(1);
if(sourceCode.includes('(x.issues||[]).slice(0,5)'))process.exit(1);
console.log("PASS methods pathway and ethics source consistency");
