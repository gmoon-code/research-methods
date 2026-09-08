
global.window={};
window.RMSRescueModel={
 version:"2.5",
 scaffold_levels:{"1":"reflection","2":"concept","3":"structured","4":"parallel","5":"rescue"},
 fields:{
   finalRQ:{stage:4,label:"Question",type:"textarea",options:[],levels:{"5":{frame:"frame",path_frames:{}}}},
   questionType:{stage:4,label:"Question family",type:"select",options:["Descriptive","Qualitative"],levels:{"5":{frame:"",path_frames:{}}}}
 },
 labs:{methods:{design:{stage:9,title:"Design"}}}
};
require("../assets/rescue.js");
const R=window.RMSRescue;
let supports=[];
const C={recordSupport:(p,s,l,src,d)=>supports.push({s,l,src,d})};
let p={rescue:{}};
R.normalizeProject(p);
let st=R.fieldState(p,4,"finalRQ");
if(R.canOpen(st,2))process.exit(1);
let threw=false;try{R.useFieldLevel(p,4,"finalRQ",2,"draft","observational",C)}catch(e){threw=true}
if(!threw)process.exit(1);
R.useFieldLevel(p,4,"finalRQ",1,"draft","observational",C);
R.useFieldLevel(p,4,"finalRQ",1,"draft","observational",C);
if(p.rescue.attemptSnapshots.length!==1||supports.length!==1)process.exit(1);
for(let l=2;l<=4;l++)R.useFieldLevel(p,4,"finalRQ",l,"draft","observational",C);
if(R.fieldState(p,4,"finalRQ").maxLevel!==4)process.exit(1);
let ev=R.applyFieldRevision(p,4,"finalRQ","draft","better draft","fits evidence","observational",C);
if(ev.before!=="draft"||ev.after!=="better draft"||p.rescue.revisions.length!==1)process.exit(1);
if(R.fieldState(p,4,"finalRQ").maxLevel!==5)process.exit(1);

for(let l=1;l<=4;l++)R.useFieldLevel(p,4,"questionType",l,"","unsure",C);
threw=false;try{R.applyFieldRevision(p,4,"questionType","","Invalid","why","unsure",C)}catch(e){threw=true}
if(!threw)process.exit(1);
R.applyFieldRevision(p,4,"questionType","","Qualitative","because I need experience evidence","qualitative",C);

let lp={rescue:{}};for(let l=1;l<=4;l++)R.useLabLevel(lp,"methods","design",l,"experimental",C);
let note=R.saveLabNote(lp,"methods","design","Compare assigned conditions","matches experimental question","experimental",C);
if(note.supportLevel!==5||lp.rescue.notes.length!==1)process.exit(1);
console.log("PASS v2.5 progressive rescue state and logging");
