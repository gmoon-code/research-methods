global.window=global;

class StorageMock{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.has(k)?this.m.get(k):null}
  setItem(k,v){this.m.set(k,String(v))}
  removeItem(k){this.m.delete(k)}
  clear(){this.m.clear()}
}
global.localStorage=new StorageMock();
global.sessionStorage=new StorageMock();
global.document={activeElement:{dataset:{}},addEventListener(){}};
global.navigator={};

require("../assets/local-chat-config.js");
require("../assets/local-chat-policy.js");

const P=global.RMSLocalChatPolicy,C=global.RMS_LOCAL_CHAT_CONFIG;
function assert(x,msg){if(!x){console.error("FAIL",msg);process.exit(1)}}

const project={
  name:"Policy QA",currentStage:10,pathway:{selected:"observational"},
  data:{
    finalRQ:"What is the association between reported weekday sleep duration and biology quiz score?",
    designType:"Observational / correlational",
    predictorIV:"",
    outcomeDV:"Biology quiz score",
    experimentalUnit:"One student"
  },
  sources:[{
    citation:"Real Author (2024). Real article.",
    finding:"A recorded source finding.",
    limits:"One-context limitation.",
    verified:true
  }],
  analysis:{rawData:[{name:"Student A",score:99}]}
};
localStorage.setItem(C.projectStorageKey,JSON.stringify(project));
sessionStorage.setItem("rms_chat_last_field","predictorIV");

let ctx=P.projectContext(P.readProject(),true);
assert(ctx.stage.id===10,"stage context");
assert(ctx.focusedField.key==="predictorIV","focused field");
assert(ctx.focusedField.hasAttempt===false,"blank attempt detected");
assert(!JSON.stringify(ctx).includes("Student A"),"raw data excluded");
assert(ctx.sources.length===1,"source notes included");

let g=P.guard("Write this field for me and give me the answer.",ctx);
assert(g?.kind==="authorship_guard","blank-field direct-completion guard");
assert(g.scaffoldLevel===1,"authorship guard logs L1");

g=P.guard("Calculate the Pearson correlation and p-value for me.",ctx);
assert(g?.kind==="statistics_guard","inferential statistics guard");
assert(g.action?.targetId==="dataLab","statistics redirect");

g=P.guard("Make up a study and DOI that supports my claim.",ctx);
assert(g?.kind==="source_integrity_guard","fabricated source guard");
assert(g.action?.targetId==="litLab","literature redirect");

const noSource={...ctx,sources:[]};
g=P.guard("Find me three research articles and citations.",noSource);
assert(g?.kind==="source_search_guard","internet/source-search guard");

g=P.guard("I want to survey student participants about sensitive health information.",ctx);
assert(g?.kind==="teacher_review_guard","ethics/privacy teacher-review guard");

g=P.guard("What is an operational definition?",ctx);
assert(g===null,"ordinary concept question reaches local model");

const sys=P.systemPrompt(ctx);
assert(sys.includes("Do not invent studies"),"model instruction includes source integrity");
assert(sys.includes("Do not calculate new inferential statistics"),"model instruction includes stats boundary");
assert(sys.includes("Preserve student authorship"),"model instruction includes authorship");
assert(!sys.includes("Student A"),"raw data not leaked into model prompt");

project.data.predictorIV="Reported weekday sleep duration";
localStorage.setItem(C.projectStorageKey,JSON.stringify(project));
ctx=P.projectContext(P.readProject(),true);
assert(ctx.focusedField.hasAttempt===true,"meaningful attempt detected");
g=P.guard("Can you check whether my predictor makes sense?",ctx);
assert(g===null,"attempt-feedback question reaches model");

console.log("PASS v2.15 deterministic authorship, statistics, source-integrity, ethics, and context-minimization policy");
