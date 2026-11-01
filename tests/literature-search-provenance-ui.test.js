const fs=require("node:fs");
const source=fs.readFileSync(require("node:path").join(__dirname,"../assets/app.js"),"utf8");
const from=source.indexOf("  function searchCorrectionPanel(record,i){");
const to=source.indexOf("  function searchWorkspace(){",from);
if(from<0||to<=from)process.exit(1);
const escape=s=>String(s??"").replace(/[&<>"\u0027]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\u0027":"&#39;"}[c]));
const panel=new Function("esc",source.slice(from,to)+"\nreturn searchCorrectionPanel;")(escape);
const record={date:"",database:"ERIC",query:"biology <science>",filters:"none",results:0,notes:"Unconfirmed historical record",
  revisions:[{at:"2026-11-01T09:30:00Z",reason:"Rechecked export",changed:["date"],before:{date:"",query:"biology <science>",executed:false}}]};
const html=panel(record,2);
if(!html.includes('data-search-edit-record="2"')||!html.includes('data-save-search-correction="2"'))process.exit(1);
for(const name of ["date","database","query","filters","results","kept","notes"])if(!html.includes('data-search-edit="'+name+'"'))process.exit(1);
if(!html.includes("Earlier corrections (1)")||!html.includes("Rechecked export"))process.exit(1);
if(!html.includes("biology &lt;science&gt;")||html.includes("biology <science>"))process.exit(1);
if(!source.includes("Lit.reviseSearchLog(project,index,updates,reason,new Date().toISOString())"))process.exit(1);
if(!source.includes("Lit.makeSearchRevisionCSV(project)")||!source.includes("Lit.makeSearchLogCSV(project)"))process.exit(1);
console.log("PASS literature search provenance UI content");

