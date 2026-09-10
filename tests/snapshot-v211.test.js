
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
