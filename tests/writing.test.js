
global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
let p={data:{finalRQ:"What is the relationship between study time and score?",designType:"Correlational / observational",gapStatement:"Local evidence is limited."},sources:[
{id:"S01",authors:"Smith, A.",year:"2024",citation:"Smith, A. (2024). X"},
{id:"S02",authors:"Lee, B.",year:"2023",citation:"Lee, B. (2023). Y"}
],litOutline:[{claim:"Study time is often associated with achievement.",sourceIds:["S01","S02"]}],litClaims:[],methods:{protocolVersions:[{designType:"Correlational / observational",design:{experimentalUnit:"student"},sampling:{sample:"30 students"},constructs:[],conditions:[],measurements:[],procedureSteps:[],schema:[],analysisIntent:"Pearson correlation"}]},analysis:{runs:[{timestamp:new Date().toISOString(),structure:"correlation",output:{test:"Pearson correlation"},neutral_summary:"Pearson correlation: n = 30, r = .42, p = .02. This is an association, not a causal estimate.",assumption_notes:[],configuration:{x:"hours",y:"score"}}],fileName:"data.csv"},writing:{}};
W.normalizeProject(p);
let c=W.citationAudit("Prior work reported an association (Smith, 2024), while Lee (2023) reported a similar pattern.",p.sources);
if(c.unmatched.length!==0||c.found.length!==2)process.exit(1);
let r=W.sectionAudit("results","Study time caused higher scores, r = .42, p = .02.",p);
if(!r.issues.some(x=>/causal/i.test(x[1]+x[2])))process.exit(1);
let m=W.methodBlueprint(p);if(!m.locked||m.units!=="student")process.exit(1);
p.writing.sections.results="Study time was positively associated with score, r = .42, p = .02.";
p.writing.sections.discussion="The results suggest a positive association. Because this is correlational, causation cannot be inferred. A limitation is the local sample.";
p.writing.sections.introduction="Prior work reported associations (Smith, 2024; Lee, 2023). The present study asks the stated question.";
p.writing.sections.literature="Study time has been associated with achievement (Smith, 2024). A second study reported a similar pattern (Lee, 2023).";
p.writing.sections.method="A correlational design measured study time and score among students.";
p.writing.sections.conclusion="Study time was positively associated with score in this sample.";
p.writing.sections.abstract="This correlational study examined study time and score among students. Pearson correlation indicated a positive association, r = .42, p = .02. The result is limited to the studied sample and does not establish causation.";
let a=W.paperAudit(p);if(a.score<=0)process.exit(1);
console.log("PASS writing lab engine");
