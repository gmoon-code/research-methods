global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
const fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"../assets/writing-lab-ui.js"),"utf8");
const E=value=>String(value??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const extract=(a,b)=>{const start=code.indexOf(a),end=code.indexOf(b,start);if(start<0||end<=start)throw Error("UI section missing: "+a);return code.slice(start,end)};
const draftBox=()=>"<div>Draft controls</div>";
const intro=new Function("W","E","draftBox",extract("function intro(p){","function literature(p){")+"return intro;")(W,E,draftBox);
const citations=new Function("W","E",extract("function citations(p){","function finalAudit(p){")+"return citations;")(W,E);
const p={data:{finalRQ:"What is observed?",gapStatement:"Local comparison",designType:"Qualitative"},
 litOutline:[],litClaims:[],sources:[
 {id:"I1",authors:"Smith, A.",year:"2024",screeningStatus:"Included"},
 {id:"P1",authors:"Lee, B.",year:"2023",screeningStatus:"Pending"},
 {id:"D1",authors:"Brown, A.",year:"2021",screeningStatus:"Included"},
 {id:"D2",authors:"Brown, B.",year:"2021",screeningStatus:"Included"}],writing:{}};
W.normalizeProject(p);
p.writing.sections.introduction="Prior reports (Smith, 2024; Lee, 2023) discuss the setting.";
p.writing.sections.literature="Brown et al. (2021) described a different finding.";
const ci=citations(p),inHtml=intro(p);
if(!ci.includes("Unique bibliography matches")||!ci.includes("Unmatched or ambiguous"))process.exit(1);
if(!ci.includes("Multiple matching source records")||!ci.includes("Source status requires review"))process.exit(1);
if(!ci.includes("A record match does not verify"))process.exit(1);
if(!ci.includes("Brown")||!ci.includes("Pending"))process.exit(1);
if(!inHtml.includes("Introduction evidence plan")||!inHtml.includes("Possible focus"))process.exit(1);
if(!inHtml.includes("paragraph boundaries can change"))process.exit(1);
if(!code.includes("The newest saved calculation is not automatically the prespecified primary analysis."))process.exit(1);
if(!code.includes("The student still writes the prose." )&&code.includes("Latest locked protocol"))process.exit(1);
console.log("PASS Writing Lab rendered source and voice guidance");
