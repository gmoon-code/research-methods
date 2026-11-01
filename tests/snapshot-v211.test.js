
global.window={};
require("../assets/curriculum.js");
require("../assets/pathway-model.js");
require("../assets/pathways.js");
require("../assets/research-snapshot.js");

const S=window.RMSResearchSnapshot;
const P=window.RMSPathways;

let p={
  name:"Test Project",context:"Research Methods",currentStage:14,ready:{4:true,9:true},
  data:{
    broadTopic:"Sleep and learning",
    finalRQ:"What is the association between reported weekday sleep duration and biology quiz score among students in one class?",
    designType:"Correlational / observational",
    predictorIV:"Reported weekday sleep duration",
    outcomeDV:"Biology quiz score",
    population:"Students in the class",
    sample:"30 students",
    analysisChoice:"Pearson correlation",
    result1:"r = .43, p = .018",
    claimBoundary:"Association only; no causal claim.",
    researchHyp:"More reported sleep will be associated with higher quiz score."
  },
  pathway:{selected:"observational"},sources:[
    {id:"S01",citation:"Example source",screeningStatus:"Included",verified:true,finding:"Sleep and performance are associated.",limits:"Observational evidence."}
  ],
  searchLog:[{date:"2026-09-08",database:"ERIC",query:"sleep AND academic performance",filters:"peer reviewed",results:"25",kept:"4",notes:"Initial search"}],
  schema:[{name:"student_id",type:"identifier",unit:"",definition:"Anonymous student code"}],
  analysis:{runs:[{neutral_summary:"Reported sleep was positively associated with score.",output:{test:"Pearson correlation"},timestamp:"2026-09-08"}]},
  writing:{sections:{introduction:"Intro draft",literature:"",method:"",results:"",discussion:"",conclusion:"",abstract:""}},
  methods:{design:{assignment:"observed exposure"},sampling:{method:"convenience"},ethics:{humanParticipants:"yes"},constructs:[],conditions:[],measurements:[],procedureSteps:[],protocolVersions:[]},
  journey:{teacherFeedback:[{comment:"Clarify the generalization boundary."}]}
};
P.normalizeProject(p);

const core=S.coreChain(p);
if(!core.some(x=>x.label==="Research question" && x.value.includes("reported weekday sleep")))process.exit(1);
if(!core.some(x=>x.label==="Primary analysis" && x.value==="Pearson correlation"))process.exit(1);

const sections=S.sectionData(p,false);
const stage4=sections.flatMap(g=>g.stages).find(x=>x.id===4);
if(!stage4.fields.some(x=>x.key==="finalRQ"))process.exit(1);

const ws=S.workspaceData(p);
if(ws.sources.length!==1||ws.searchLog.length!==1||ws.schema.length!==1||ws.runs.length!==1||ws.writing.length!==1||ws.feedback.length!==1)process.exit(1);

// A filled hypothesis can be retained as cross-path work if the selected path later hides it.
const all=S.markdown(p,false);
for(const phrase of ["Current Research Snapshot","Research question","Pearson correlation","Source workspace","Search history","Current data schema","Stored analysis runs","Writing Lab drafts","Teacher feedback"]){
  if(!all.includes(phrase))process.exit(1);
}
console.log("PASS v2.11 current research snapshot engine");


// Stage C-X3c12m | Source and search provenance must agree between the
// snapshot's visible workspace and its Markdown export.
const provenanceProject={
  ...p,
  sources:[{id:"S01",citation:"Student record",screeningStatus:"Included",verified:true,finding:"Student-reported study finding"}],
  searchLog:[
    {date:"2026-11-01",database:"ERIC",query:"confirmed query",filters:"none",results:"0",executed:true},
    {date:"2026-11-01",database:"ERIC",query:"unconfirmed query",filters:"none",results:"3",executed:false},
    {date:"",database:"ERIC",query:"incomplete query",filters:"none",results:"4",executed:true}
  ],
  methods:{...p.methods,protocolVersions:[{id:"v1"}]}
};
const provenanceMarkdown=S.markdown(provenanceProject);
for(const phrase of ["Student-confirmed execution","Execution not confirmed","Incomplete record","Student-recorded finding / contribution","bibliography record(s) marked checked by student"]){
  if(!provenanceMarkdown.includes(phrase))process.exit(1);
}
if(provenanceMarkdown.includes("—"))process.exit(1);
const snapshotUI=require("node:fs").readFileSync(require("node:path").join(__dirname,"../assets/research-snapshot-ui.js"),"utf8");
const wsBegin=snapshotUI.indexOf("function workspaceHTML(p)");
const wsEnd=snapshotUI.indexOf("\n function renderBody(p)",wsBegin);
if(wsBegin<0||wsEnd<wsBegin)process.exit(1);
const escSnapshot=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const renderWorkspace=new Function("S","E",snapshotUI.slice(wsBegin,wsEnd)+";return workspaceHTML;")(S,escSnapshot);
const provenanceHTML=renderWorkspace(provenanceProject);
for(const phrase of ["3 records","Student-confirmed execution","Execution not confirmed","Incomplete record","Student-recorded finding / contribution","bibliography checked by student","1 saved protocol version"]){
  if(!provenanceHTML.includes(phrase))process.exit(1);
}
if(provenanceHTML.includes("locked protocol version"))process.exit(1);
console.log("PASS snapshot display/export provenance parity");

// Stage C-X3c12n | Historical analysis records retain calculation provenance.
const analysisProvenanceProject={
  ...provenanceProject,
  analysis:{runs:[
    {neutral_summary:"Current-guard calculation",output:{test:"Welch comparison"},calculation_guard_version:"C-X3c10d",traceability:{file:"source-rows.csv",rows_used:18}},
    {neutral_summary:"Legacy calculation",output:{test:"Correlation"},traceability:{file:"legacy.csv",rows_used:12}}
  ]}
};
const analysisRuns=S.workspaceData(analysisProvenanceProject).runs;
if(analysisRuns[0].guardVersion!=="C-X3c10d"||analysisRuns[1].guardVersion!=="")process.exit(1);
if(analysisRuns[0].sourceFile!=="source-rows.csv"||analysisRuns[0].rowsUsed!==18)process.exit(1);
const analysisMarkdown=S.markdown(analysisProvenanceProject);
const analysisHTML=renderWorkspace(analysisProvenanceProject);
for(const fragment of ["Recorded automated safeguards","Earlier or unversioned calculation","source-rows.csv","legacy.csv","not necessarily independent study units"]){
  if(!analysisMarkdown.includes(fragment)||!analysisHTML.includes(fragment))process.exit(1);
}
console.log("PASS snapshot stored-analysis provenance");
