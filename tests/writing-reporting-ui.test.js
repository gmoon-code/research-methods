global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../assets/writing-lab-ui.js"),"utf8");
const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slice=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i);if(i<0||j<=i)throw Error("Missing "+a);return source.slice(i,j)};
const draftBox=()=>"<div>Draft input</div>";
const method=new Function("W","E","draftBox",slice("function method(p){","function results(p){")+"return method;")(W,E,draftBox);
const results=new Function("W","E","draftBox",slice("function results(p){","function discussion(p){")+"return results;")(W,E,draftBox);
const discussion=new Function("W","E","draftBox",slice("function discussion(p){","function row(x=")+"return discussion;")(W,E,draftBox);
const p={data:{designType:"Qualitative",finalRQ:"How are explanations developed?"},
 methods:{protocolVersions:[{lockedAt:"2026-10-30T15:00:00Z",design:{experimentalUnit:"student"}}]},
 analysis:{runs:[],fileName:""},writing:{reportingMode:"proposal"}};
W.normalizeProject(p);
if(!method(p).includes("Saved 2026-10-30T15:00:00Z"))process.exit(1);
if(!results(p).includes('id="writingReportingMode"')||!results(p).includes("Proposal or planned work"))process.exit(1);
if(!results(p).includes("No linked Data Lab calculation.")||!results(p).includes("qualitative evidence"))process.exit(1);
if(!discussion(p).includes("Anticipated interpretation and limitations"))process.exit(1);
p.writing.reportingMode="completed";
if(!results(p).includes("Completed research, student-reported"))process.exit(1);
if(!discussion(p).includes("Discussion claim"))process.exit(1);
if(!source.includes('id("writingReportingMode").onchange'))process.exit(1);
if(!source.includes('W.resultsNotesMarkdown(p)')||!source.includes('W.paperMarkdown(p)'))process.exit(1);
console.log("PASS Writing Lab proposal status and rendered export routing");
