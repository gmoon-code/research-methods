global.window={};
require("../assets/rescue-model.js");
const fs=require("node:fs"),path=require("node:path");
const canonical=JSON.parse(fs.readFileSync(path.join(__dirname,"../assets/rescue-model-v2.5.json"),"utf8"));
const live=window.RMSRescueModel;
if(canonical.version!==live.version)process.exit(1);
if(Object.keys(canonical.fields).length!==113||Object.keys(live.fields).length!==113)process.exit(1);
if(JSON.stringify(canonical)!==JSON.stringify(live))process.exit(1);
for(const id of ["sample","rowUnit","missingRule","analysisIntent","limitations"]){
 const f=live.fields[id];
 if(!f||Object.keys(f.levels).length!==5)process.exit(1);
}
if(!live.fields.sample.label.includes("Planned or actual sample"))process.exit(1);
if(!live.fields.rowUnit.levels["2"].body.includes("interviews, documents"))process.exit(1);
if(!live.fields.missingRule.levels["2"].body.includes("separately in the Data Lab"))process.exit(1);
if(!live.fields.analysisIntent.levels["2"].body.includes("prospective"))process.exit(1);
if(/At least two/i.test(live.fields.limitations.label)||/at least two/i.test(live.fields.limitations.levels["2"].body))process.exit(1);
console.log("PASS complete canonical/runtime Rescue v2.5 parity");
