global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
const project={data:{designType:"Experimental",finalRQ:"Does a proposed treatment affect growth?"},
 methods:{protocolVersions:[{lockedAt:"2026-10-01T09:00:00Z",designType:"Experimental",design:{experimentalUnit:"dish"},sampling:{sample:"18 dishes"},procedureSteps:[{action:"Measure shoot length"}]}]},analysis:{fileName:"later.csv",runs:[]},writing:{}};
W.normalizeProject(project);
if(project.writing.reportingMode!=="unconfirmed")process.exit(1);
if(!W.paperAudit(project).issues.some(x=>x[1]==="Manuscript reporting status unconfirmed"))process.exit(1);
project.writing.reportingMode="proposal";
const a=W.paperAudit(project);
if(a.issues.some(x=>/No linked Data Lab analysis|Results draft missing|Discussion draft missing/.test(x[1])))process.exit(1);
const abs=W.sectionAudit("abstract","This proposed experiment will assign dishes to conditions. Data collection will occur later.",project);
if(abs.issues.some(x=>x[1]==="Central finding is difficult to identify"))process.exit(1);
const invalidAbs=W.sectionAudit("abstract","Our proposed experiment results showed that seedlings grew faster.",project);
if(!invalidAbs.issues.some(x=>x[1]==="Proposal abstract describes completed findings"))process.exit(1);
const proposedPaper=W.paperMarkdown(project);
if(!proposedPaper.includes("**Research reporting status:** Proposal / planned work"))process.exit(1);
if(!proposedPaper.includes("## Planned Method")||!proposedPaper.includes("## Proposed analysis and reporting"))process.exit(1);
if(proposedPaper.includes("## Results\n")||!proposedPaper.includes("No observed finding has been supplied"))process.exit(1);
if(!proposedPaper.includes("No reference entries were generated."))process.exit(1);
const method=W.methodBlueprint(project);
if(!method.locked||method.protocolRecordedAt!=="2026-10-01T09:00:00Z")process.exit(1);
const methodText=W.methodOutlineMarkdown(project);
if(!methodText.includes("Most recently saved planning version")||!methodText.includes("verify what was actually done"))process.exit(1);
const qual={data:{designType:"Qualitative",finalRQ:"How do students explain a phenomenon?"},methods:{},analysis:{runs:[]},writing:{reportingMode:"completed"}};
W.normalizeProject(qual);
const quality=W.sectionAudit("results","Students' interview accounts described several distinct approaches, alongside discrepant cases.",qual);
if(quality.issues.some(x=>x[0]==="critical"&&/stored analysis/i.test(x[1])))process.exit(1);
if(quality.issues.some(x=>x[1]==="Result evidence is difficult to identify"))process.exit(1);
if(W.paperAudit(qual).issues.some(x=>x[0]==="critical"&&/linked Data Lab/i.test(x[1])))process.exit(1);
const completed={data:{finalRQ:"What is the outcome?",designType:"Descriptive"},methods:{},analysis:{fileName:"new.csv",runs:[
 {timestamp:"2025-01-01T00:00:00Z",structure:"correlation",output:{test:"Pearson correlation"},neutral_summary:"Prior result"},
 {timestamp:"2026-11-01T12:00:00Z",structure:"descriptive_numeric",output:{test:"Numerical descriptives"},neutral_summary:"n=3, missing=1",
 configuration:{structure:"descriptive_numeric",y:"score"},calculation_guard_version:"C-X3c10d",
 missingness:{tokens:["NA"]},assumption_notes:[["warning","Inspect data"]],traceability:{file:"original.csv",rows_used:3,rows_not_used:1,estimand:"mean score"}}]},writing:{reportingMode:"completed"}};
W.normalizeProject(completed);
const outline=W.resultsNotesMarkdown(completed);
if(!outline.includes("Historical record without current checks; review before use"))process.exit(1);
if(!outline.includes("Current automated checks; independent review still needed"))process.exit(1);
if(!outline.includes("Data file recorded for this calculation:** original.csv"))process.exit(1);
if(!outline.includes("Rows omitted for this calculation:** 1")||!outline.includes("Missing tokens applied:** NA"))process.exit(1);
if(!outline.includes("Estimand recorded with the calculation:** mean score")||!outline.includes('"y":"score"'))process.exit(1);
if(!outline.includes("Inspect data"))process.exit(1);
if(W.resultsBlueprint(completed).latest!==completed.analysis.runs[1])process.exit(1);
console.log("PASS proposal, qualitative and historical Writing Lab output fidelity");
