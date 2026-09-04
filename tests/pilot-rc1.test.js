
global.window={dispatchEvent:()=>{}};global.CustomEvent=function(){};
let store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.Blob=class{constructor(a){this.size=String(a[0]||"").length}};
require("../assets/pilot.js");const P=window.RMSPilot;
let p={name:"Alpha",pilot:{}};P.normalizeProject(p);
P.safeSave("k",p);store["k_recovery_v2"]=store["k"];store["k_pilot_meta_v2"]="{}";store["rms_v2_onboarding_seen"]="1";
P.clearProjectStorage("k",{clearOnboarding:true});if(store["k"]||store["k_recovery_v2"]||store["k_pilot_meta_v2"]||store["rms_v2_onboarding_seen"])process.exit(1);
let full=P.backupEnvelope({name:"A",pilot:{}},"full"),privacy=P.backupEnvelope({name:"A",analysis:{rawData:[{x:1}]},writing:{sections:{results:"text"}},pilot:{}},"privacy");
if(!P.validateBackup(full).restorable)process.exit(1);let pv=P.validateBackup(privacy);if(pv.restorable||!pv.ok)process.exit(1);
let q={pilot:{baselineId:P.BASELINE_ID,config:{aiPolicy:"disabled",transferPolicy:"private-evaluation-bank"}}};if(P.featureAccess(q,"ai").allowed||P.featureAccess(q,"public-transfer").allowed)process.exit(1);
q.pilot.config.aiPolicy="secure-approved-backend";q.pilot.config.transferPolicy="classroom-practice";if(!P.featureAccess(q,"ai").allowed||!P.featureAccess(q,"public-transfer").allowed)process.exit(1);
let fn=P.backupFilename({name:"My Project"},"full");if(!fn.startsWith("my-project-full-backup-"))process.exit(1);
console.log("PASS RC1 pilot hardening");
