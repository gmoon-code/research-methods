
global.window={};
require("../assets/curriculum.js");
require("../assets/pathway-model.js");
require("../assets/pathways.js");
require("../assets/student-flow.js");
const F=window.RMSStudentFlow,P=window.RMSPathways;
let p={currentStage:11,ready:{},data:{},pathway:{},flow:{},
  methods:{design:{},sampling:{},ethics:{},constructs:[],conditions:[],measurements:[],procedureSteps:[],protocolVersions:[]},
  writing:{sections:{}},sources:[],schema:[],analysis:{runs:[]}};
P.normalizeProject(p);F.normalizeProject(p);

const pairs=[
 ["outcomeDV","design","primaryOutcome","Biology quiz score"],
 ["experimentalUnit","design","experimentalUnit","One student"],
 ["claimBoundary","design","claimCeiling","Association only"],
 ["rowUnit","design","rowUnit","One student"],
 ["population","sampling","population","Grade 11 biology students"],
 ["sample","sampling","sample","30 students"],
 ["samplingMethod","sampling","method","Convenience sample"],
 ["sampleLimits","sampling","generalization","One class only"]
];
for(const [key,g,k,val] of pairs){
  F.syncDataField(p,key,val);
  if(p.methods[g][k]!==val){console.error("stage->method failed",key);process.exit(1)}
  const changed=val+" revised";
  F.syncMethodFromLab(p,g,k,changed);
  if(p.data[key]!==changed){console.error("method->stage failed",key);process.exit(1)}
}
const wpairs=[["litDraft","literature"],["resultsDraft","results"],["discussionDraft","discussion"],["conclusionDraft","conclusion"],["abstractDraft","abstract"]];
for(const [key,section] of wpairs){
  F.syncDataField(p,key,`Stage ${section}`);
  if(p.writing.sections[section]!==`Stage ${section}`)process.exit(1);
  F.syncWritingFromLab(p,section,`Lab ${section}`);
  if(p.data[key]!==`Lab ${section}`)process.exit(1);
}
console.log("PASS v2.13 Stage/Lab canonical value synchronization");
