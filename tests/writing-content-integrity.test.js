global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
const sources=[
 {id:"I1",authors:"Smith, A.",year:"2024",screeningStatus:"Included",citation:"Smith (2024)"},
 {id:"P1",authors:"Lee, B.",year:"2023",screeningStatus:"Pending",citation:"Lee (2023)"},
 {id:"E1",authors:"Ray, C.",year:"2022",screeningStatus:"Excluded",citation:"Ray (2022)"},
 {id:"D1",authors:"Brown, A.",year:"2021",screeningStatus:"Included",citation:"Brown (2021) A"},
 {id:"D2",authors:"Brown, B.",year:"2021",screeningStatus:"Included",citation:"Brown (2021) B"}
];
const c=W.citationAudit("Previous findings (Smith, 2024; Lee, 2023) and Ray (2022) differ from Brown et al. (2021).",sources);
if(c.found.length!==4||c.unmatched.length!==0||c.ambiguous.length!==1||c.statusToCheck.length!==2)process.exit(1);
if(c.found.find(x=>x.surname==="smith").screeningStatus!=="Included")process.exit(1);
if(!c.ambiguous[0].text.includes("Brown")||c.ambiguous[0].candidateCount!==2)process.exit(1);
const missing=W.citationAudit("(Smith, 2024; Unknown, 2020)",sources);
if(missing.found.length!==2||missing.unmatched.length!==1||missing.unmatched[0].surname!=="unknown")process.exit(1);
const project={data:{finalRQ:"Is there an association?",designType:"Correlational / observational"},
 sources,methods:{protocolVersions:[{designType:"Correlational / observational"}]},analysis:{runs:[{output:{test:"Pearson correlation"},neutral_summary:"r=.4"}]},writing:{}};
W.normalizeProject(project);
const w=project.writing.sections;
w.results="The observed scores were positively associated within the measured sample.";
w.discussion="The results suggest a possible association. No causal inference can be made from this design.";
const paper=W.paperAudit(project);
if(paper.issues.some(x=>x[1]==="Results draft missing"||x[1]==="Discussion draft missing"))process.exit(1);
if(!paper.label||paper.label==="Strong alignment")process.exit(1);
if(W.resultsBlueprint(project).primary!==undefined||W.resultsBlueprint(project).latest!==project.analysis.runs[0])process.exit(1);
const causal=W.sectionAudit("results","Scores increased from one observation to another.",project);
if(causal.issues.some(x=>x[1]==="Causal wording exceeds the design"))process.exit(1);
const caused=W.sectionAudit("results","The intervention caused higher scores.",project);
if(!caused.issues.some(x=>x[1]==="Causal wording exceeds the design"))process.exit(1);
const compact=W.sectionAudit("conclusion","An association was observed.",project);
if(compact.issues.some(x=>x[1]==="Section is still very short"))process.exit(1);
const cited=W.sectionAudit("literature","The record is discussed (Lee, 2023; Brown, 2021).",project);
if(!cited.issues.some(x=>x[1]==="Cited source status needs review"))process.exit(1);
if(!cited.issues.some(x=>x[1]==="Citation matches more than one source record"))process.exit(1);
console.log("PASS writing citations, audit and evidence-boundary content");
