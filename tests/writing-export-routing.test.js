global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
const fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"../assets/writing-lab-ui.js"),"utf8");
const start=code.indexOf("function bind(p,save,rr,active){"),end=code.indexOf("\n return{open};",start);
if(start<0||end<=start)process.exit(1);
const controls={exportMethodOutline:{},exportResultsOutline:{},exportPaper:{},saveAudit:{}};
const id=name=>controls[name]||null;
const document={querySelectorAll:()=>[]},documents=[],navigate=[];
window.RMSWordExport={fromMarkdown:(name,body,title)=>documents.push({name,body,title})};
const bind=new Function("id","document","W","window",code.slice(start,end)+"\nreturn bind;")(id,document,W,window);
const p={data:{designType:"Qualitative",finalRQ:"What are the participants' explanations?"},methods:{
 protocolVersions:[{lockedAt:"2026-09-20T10:00:00Z",designType:"Qualitative",design:{experimentalUnit:"participant"},procedureSteps:[{action:"Discuss drawings"}]}]},
 analysis:{fileName:"current.csv",runs:[
 {timestamp:"2026-09-20T12:00:00Z",structure:"correlation",output:{test:"Pearson"},neutral_summary:"Earlier result"},
 {timestamp:"2026-10-01T12:00:00Z",structure:"descriptive_numeric",output:{test:"Numerical descriptives"},neutral_summary:"n=3",
 calibration:"none",calculation_guard_version:"C-X3c10d",configuration:{y:"outcome"},
 missingness:{tokens:["NA"]},traceability:{file:"original.csv",rows_used:3,rows_not_used:1,estimand:"mean outcome"}}]},
 writing:{reportingMode:"proposal"}};
W.normalizeProject(p);
p.writing.sections.abstract="The proposed study will examine explanations.";
p.writing.sections.method="Participants will discuss drawings if approved.";
bind(p,()=>{},section=>navigate.push(section),"audit");
if(["exportMethodOutline","exportResultsOutline","exportPaper","saveAudit"].some(name=>typeof controls[name].onclick!=="function"))process.exit(1);
controls.exportMethodOutline.onclick();
controls.exportResultsOutline.onclick();
controls.exportPaper.onclick();
if(documents.length!==3)process.exit(1);
const method=documents.find(x=>x.name==="method-evidence-outline.doc")?.body||"";
const results=documents.find(x=>x.name==="results-evidence-outline.doc")?.body||"";
const paper=documents.find(x=>x.name==="research-paper-draft.doc")?.body||"";
if(!method.includes("Saved at:** 2026-09-20T10:00:00Z")||!method.includes("A saved protocol documents a plan."))process.exit(1);
if(!results.includes("Historical record without current checks")||!results.includes("Data file recorded for this calculation:** original.csv"))process.exit(1);
if(!results.includes("Rows omitted for this calculation:** 1")||!results.includes("Missing tokens applied:** NA"))process.exit(1);
if(!paper.includes("**Research reporting status:** Proposal / planned work"))process.exit(1);
if(!paper.includes("## Proposed analysis and reporting")||paper.includes("## Results\n"))process.exit(1);
if(!paper.includes("No reference entries were generated."))process.exit(1);
controls.saveAudit.onclick();
if(p.writing.auditHistory.length!==1||!p.writing.auditHistory[0].timestamp||navigate[0]!=="audit")process.exit(1);
console.log("PASS Writing Lab method, results and manuscript export handlers");
