
global.window={};
require("../assets/curriculum.js");
require("../assets/pathway-model.js");
require("../assets/pathways.js");
require("../assets/research-snapshot.js");
require("../assets/ai-helper.js");

const H=window.RMSAIHelper,P=window.RMSPathways;
let project={
  name:"AI Helper Test",currentStage:4,ready:{},data:{
    broadTopic:"Sleep and learning",
    finalRQ:"",
    questionType:"Correlational / observational"
  },
  sources:[],schema:[],analysis:{runs:[]},writing:{sections:{}},pathway:{selected:"observational"},
  competency:{},aiHelper:{}
};
P.normalizeProject(project);H.normalizeProject(project);
H.setLastField(project,"finalRQ","Working research question");
const field=H.currentField(project);
if(!field||field.key!=="finalRQ"||field.has_attempt!==false)process.exit(1);

const payload=H.buildPayload(project,"Write my research question for me.",{reviewStage:()=>({messages:[{level:"warning",title:"Question incomplete",body:"Specify variables and population."}]})});
if(payload.request_version)process.exit(1); // adapter adds request_version
if(payload.project_context.stage.id!==4)process.exit(1);
if(payload.project_context.current_field.key!=="finalRQ")process.exit(1);
if(payload.project_context.current_field.has_attempt!==false)process.exit(1);
if(!payload.helper_policy.direct_completion_guard)process.exit(1);
if(!payload.project_context.accumulated_research_chain.some(x=>x.label==="Research path"))process.exit(1);


H.setLastField(project,"mdClaim","Maximum claim this design could support","Association only","textarea","workspace_control");
let labField=H.currentField(project);
if(!labField||labField.key!=="mdClaim"||labField.origin!=="workspace_control"||labField.has_attempt!==true)process.exit(1);

H.addMessage(project,"user","What is an experimental unit?");
H.addMessage(project,"assistant","It is the smallest unit independently assigned to a treatment.",{scaffold_level:1,counts_as_stage_support:false});
if(project.aiHelper.messages.length!==2)process.exit(1);
if(H.quickPrompts(project).length<4)process.exit(1);

project.aiHelper.includeProjectContext=false;
const minimal=H.buildPayload(project,"Explain correlation.",null).project_context;
if("accumulated_research_chain" in minimal)process.exit(1);
if(!minimal.stage||!minimal.research_path)process.exit(1);

H.clear(project);
if(project.aiHelper.messages.length!==0)process.exit(1);
console.log("PASS v2.12 AI helper context, authorship guard metadata, history, and context minimization");
