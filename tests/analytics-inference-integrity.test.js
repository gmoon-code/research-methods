global.window={};
require("../assets/analytics.js");
const A=window.RMSAnalytics;
const rows=[];
for(let dish=1;dish<=6;dish++)for(let seed=1;seed<=5;seed++)rows.push({
  dish_id:"D"+dish,seed_id:"S"+seed,treatment:dish<=3?"control":"salt",
  shoot_length_cm:String(dish+seed/10)
});
const project={data:{designType:"Experimental"},methods:{design:{experimentalUnit:"dish",rowUnit:"seed",independentUnits:6,subsamplesPerUnit:5}},
analysis:{rawData:rows,headers:["dish_id","seed_id","treatment","shoot_length_cm"]}};
A.normalizeProject(project);
const wrongUnit=A.runAnalysis(project,{structure:"independent_two",group:"treatment",y:"shoot_length_cm"});
if(!wrongUnit.error||!wrongUnit.error.includes("nested or repeated rows"))process.exit(1);
const descriptive=A.runAnalysis(project,{structure:"descriptive_numeric",y:"shoot_length_cm"});
if(descriptive.error||descriptive.output.n!==30)process.exit(1);
project.methods.design.rowUnit="dish";
const mismatchCount=A.runAnalysis(project,{structure:"independent_two",group:"treatment",y:"shoot_length_cm"});
if(!mismatchCount.error||!mismatchCount.error.includes("6 independent units"))process.exit(1);
const independent={data:{},methods:{design:{experimentalUnit:"student",rowUnit:"student",independentUnits:5}},
analysis:{rawData:[1,2,3,4,5].map(x=>({before:String(x),after:String(x+2),group:x>2?"B":"A"})),headers:["before","after","group"]}};
A.normalizeProject(independent);
const constantDifference=A.runAnalysis(independent,{structure:"paired_two",x:"before",y:"after"});
if(!constantDifference.error||!constantDifference.error.includes("identical"))process.exit(1);
const onlyTwo=A.runAnalysis(independent,{structure:"groups_three",group:"group",y:"after"});
if(!onlyTwo.error||!onlyTwo.error.includes("three observed groups"))process.exit(1);
const spearman=A.runAnalysis(independent,{structure:"correlation",x:"before",y:"after",correlation:"spearman"});
if(spearman.error||spearman.output.rho<0.999||spearman.output.p!==null||"ci" in spearman.output)process.exit(1);
if(!A.neutralSummary(spearman).includes("p-value withheld"))process.exit(1);
if(!A.assumptionAudit(independent,spearman).issues.some(x=>x[0]==="warning"&&x[1].includes("permutation")))process.exit(1);
if(A.toNum("1,2")!==null||A.toNum("1,200")!==1200||A.toNum("0")!==0||A.toNum("NA")!==null)process.exit(1);
const broken={analysis:{rawData:[{x:"1",y:"2"}],importWarnings:["1 data row(s) had extra fields beyond the header; those extra values were not imported."]},data:{},methods:{}};
if(!A.runAnalysis(broken,{structure:"descriptive_numeric",y:"y"}).error)process.exit(1);
console.log("PASS Data Lab inferential integrity guards");
