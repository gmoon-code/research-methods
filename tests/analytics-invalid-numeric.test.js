global.window={};
require("../assets/analytics.js");
const A=window.RMSAnalytics;
const project={analysis:{headers:["id","group","score","later"],rawData:[
{id:"1",group:"A",score:"2",later:"3"},{id:"2",group:"B",score:"oops",later:"5"},
{id:"3",group:"B",score:"4",later:"6"}]},data:{},methods:{}};
A.normalizeProject(project);
const malformed=A.runAnalysis(project,{structure:"descriptive_numeric",y:"score"});
if(!malformed.error||!malformed.error.includes("1 nonblank value(s)")||!malformed.error.includes("not valid numbers"))process.exit(1);
const grouped=A.runAnalysis(project,{structure:"independent_two",group:"group",y:"score"});
if(!grouped.error||!grouped.error.includes("not valid numbers"))process.exit(1);
project.analysis.missingTokens="oops";
const recovered=A.runAnalysis(project,{structure:"descriptive_numeric",y:"score"});
if(recovered.error||recovered.output.n!==2||recovered.output.missing!==1||recovered.output.mean!==3)process.exit(1);
if(project.analysis.rawData[1].score!=="oops")process.exit(1);
if(!A.runAnalysis(project,{structure:"correlation",x:"score",y:"score"}).error)process.exit(1);
if(!A.runAnalysis(project,{structure:"paired_two",x:"score",y:"score"}).error)process.exit(1);
if(!A.runAnalysis(project,{structure:"independent_two",group:"score",y:"score"}).error)process.exit(1);
const good=A.runAnalysis(project,{structure:"correlation",x:"score",y:"later"});
if(good.error||good.output.n!==2)process.exit(1);
const repeated={data:{},methods:{},analysis:{headers:["a","b"],rawData:[{a:"1",b:"0"},{a:"0",b:"1"}]}};
A.normalizeProject(repeated);
const duplicate=A.runAnalysis(repeated,{structure:"repeated_binary",columns:["a","b","a"],success:"1"});
if(!duplicate.error||!duplicate.error.includes("distinct recorded columns"))process.exit(1);
console.log("PASS malformed numeric and duplicate-column guards");
