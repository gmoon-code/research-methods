
global.window={};
global.crypto={randomUUID:()=>"1234"};
window.RMSTransferBank={version:"1.9",status:"candidate_public_classroom_bank_unvalidated",tasks:[
{id:"A",title:"A",domain:"x",keywords:["plant"],scenario:"s",prompts:["p"],competencies:["design_validity"],criteria:{design_validity:"c"},cue:"q"},
{id:"B",title:"B",domain:"y",keywords:["memory"],scenario:"s",prompts:["p"],competencies:["statistical_reasoning"],criteria:{statistical_reasoning:"c"},cue:"q"},
{id:"C",title:"C",domain:"z",keywords:["chemistry"],scenario:"s",prompts:["p"],competencies:["data_reasoning"],criteria:{data_reasoning:"c"},cue:"q"}
]};
require("../assets/transfer.js");
const T=window.RMSTransfer;
let p={created:"x",name:"project",data:{topicChoice:"plant growth"},transfer:{}};
T.normalizeProject(p);let s=T.startSet(p,2);if(s.taskIds.length!==2)process.exit(1);
T.submitIndependent(p,s.id,s.taskIds[0],"answer");
if(!s.responses[s.taskIds[0]].independent)process.exit(1);
T.useCue(p,s.id,s.taskIds[0]);T.saveRevision(p,s.id,s.taskIds[0],"revised");
let pack=T.responsePacket(p,s.id);if(pack.tasks[0].support_level!==2)process.exit(1);
let A={ratings:[
{task_id:"A",competency:"x",level:0,response_type:"independent"},
{task_id:"B",competency:"x",level:1,response_type:"independent"},
{task_id:"C",competency:"x",level:2,response_type:"independent"},
{task_id:"D",competency:"x",level:3,response_type:"independent"}]};
let B={ratings:[
{task_id:"A",competency:"x",level:0,response_type:"independent"},
{task_id:"B",competency:"x",level:1,response_type:"independent"},
{task_id:"C",competency:"x",level:2,response_type:"independent"},
{task_id:"D",competency:"x",level:3,response_type:"independent"}]};
let ag=T.agreement(T.alignedRatings(A,B));if(ag.n!==4||Math.abs(ag.agreement-1)>1e-12||Math.abs(ag.kappa-1)>1e-12||Math.abs(ag.weightedKappa-1)>1e-12)process.exit(1);
B.ratings[3].level=2;ag=T.agreement(T.alignedRatings(A,B));if(!(ag.agreement<1&&ag.weightedKappa>0))process.exit(1);
console.log("PASS transfer and agreement engine");
