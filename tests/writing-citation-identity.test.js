global.window={};
require("../assets/writing.js");
const W=window.RMSWriting;
const sources=[
 {id:"S1",authors:"Smith, A., & Brown, B.",year:"2024",screeningStatus:"Included"},
 {id:"S2",authors:"Lee, B.",year:"2023",screeningStatus:"Included"},
 {id:"S3",authors:"Émile, C.",year:"2022",screeningStatus:"Included"},
 {id:"S4",authors:"Park, J.",year:"2020",screeningStatus:"Included"},
 {id:"S5",authors:"John Smith",year:"2021",screeningStatus:"Pending"},
 {id:"S6",authors:"World Health Organization",year:"2024",screeningStatus:"Pending"},
 {id:"S7",authors:"Kim, J.",year:"",screeningStatus:"Pending"}
];
if(W.sourceKey(sources[0]).surname!=="Smith")process.exit(1);
if(W.sourceKey(sources[2]).key!=="émile|2022")process.exit(1);
if(W.sourceKey(sources[4]).key!==""||W.sourceKey(sources[5]).key!=="")process.exit(1);
const a=W.citationAudit("Several studies (see Smith, 2024; e.g., Lee, 2023) were followed by Émile (2022) and Park and Lee (2020).",sources);
if(a.found.length!==4||a.unmatched.length||a.ambiguous.length)process.exit(1);
if(a.found.some(x=>!x.matched))process.exit(1);
if(a.unindexable.length!==3||a.unused.length!==0)process.exit(1);
const unsupported=W.citationAudit("World Health Organization (2024) reported a study.",sources);
if(unsupported.found.some(x=>x.matched))process.exit(1);
const p={data:{designType:"Qualitative",finalRQ:"How did explanations change?"},sources,methods:{},writing:{reportingMode:"completed"}};
W.normalizeProject(p);
if(!W.paperAudit(p).issues.some(x=>x[1]==="Some source records lack an unambiguous author–year key"))process.exit(1);
const fs=require("node:fs"),path=require("node:path");
const code=fs.readFileSync(path.join(__dirname,"../assets/writing-lab-ui.js"),"utf8");
const start=code.indexOf("function citations(p){"),end=code.indexOf("function finalAudit(p){",start);
if(start<0||end<=start)process.exit(1);
const E=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ui=new Function("W","E",code.slice(start,end)+"return citations;")(W,E);
p.writing.sections.introduction="Prior work (see Smith, 2024; e.g., Lee, 2023) was considered.";
const html=ui(p);
if(!html.includes("Records without a reliable author–year key")||!html.includes(">3</b>"))process.exit(1);
if(!html.includes("Some source records require manual identification"))process.exit(1);
if(!html.includes("Multi-author identity, organisational authors"))process.exit(1);
console.log("PASS conservative bibliography identification and citation variants");
