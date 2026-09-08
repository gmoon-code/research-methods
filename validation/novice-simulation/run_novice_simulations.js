
const fs=require("fs"),path=require("path");
global.window={};

require("../../assets/pathway-model.js");
require("../../assets/pathways.js");
require("../../assets/coach.js");
require("../../assets/methods.js");
require("../../assets/path-coach-model.js");
require("../../assets/path-coach.js");
require("../../assets/novice-friction.js");
require("../../assets/rescue-model.js");
require("../../assets/rescue.js");

const Paths=window.RMSPathways, Guard=window.RMSNoviceGuard, Rescue=window.RMSRescue;
const personas=JSON.parse(fs.readFileSync(path.join(__dirname,"NOVICE_PERSONAS_v2.6.json"),"utf8"));
function base(x){
  const p={name:x.name,data:{...(x.data||{})},sources:[],searchLog:[],ready:{},methods:{},schema:[],pathway:{},rescue:{}};
  Paths.normalizeProject(p);Paths.select(p,x.path,"simulation");
  for(let i=0;i<(x.sources||0);i++)p.sources.push({id:`S${i+1}`,screeningStatus:"Included"});
  for(let i=0;i<(x.searches||0);i++)p.searchLog.push({id:`Q${i+1}`,query:"test"});
  return p;
}
let rows=[],failed=0;
for(const x of personas){
  const p=base(x),r=Guard.reviewStage(x.stage,p),codes=(r.messages||[]).map(m=>m.code).filter(Boolean),gate=Guard.stageGate(x.stage,p);
  const missing=x.expected_codes.filter(c=>!codes.includes(c));
  const expectedBlocking=(r.messages||[]).some(m=>x.expected_codes.includes(m.code)&&m.level==="bad");
  const passed=missing.length===0 && (!expectedBlocking || gate.canMarkReady===false);
  if(!passed)failed++;
  rows.push({id:x.id,name:x.name,path:x.path,stage:x.stage,expected:x.expected_codes,observed:codes,gate_ready:gate.canMarkReady,passed});
}

// Rescue escalation with a genuinely stuck qualitative novice.
let p={data:{analysisChoice:"idk"},ready:{},methods:{},pathway:{},rescue:{}};
Paths.normalizeProject(p);Paths.select(p,"qualitative","simulation");
let support=[];
const C={recordSupport:(proj,stage,level,source,detail)=>support.push({stage,level,source,detail})};
let earlyBlocked=false;try{Rescue.useFieldLevel(p,14,"analysisChoice",2,"idk","qualitative",C)}catch(e){earlyBlocked=true}
for(let l=1;l<=4;l++)Rescue.useFieldLevel(p,14,"analysisChoice",l,"idk","qualitative",C);
let noRationaleBlocked=false;try{Rescue.applyFieldRevision(p,14,"analysisChoice","idk","thematic analysis","","qualitative",C)}catch(e){noRationaleBlocked=true}
const ev=Rescue.applyFieldRevision(p,14,"analysisChoice","idk","thematic analysis with an audit trail","The question asks how participants describe experiences, so a qualitative thematic approach fits.","qualitative",C);
const snap=p.rescue.attemptSnapshots[0];
const rescuePass=earlyBlocked&&noRationaleBlocked&&snap?.value==="idk"&&ev.before==="idk"&&ev.after.includes("thematic")&&support.some(x=>x.level===5);

const output={release:"v2.6",persona_results:rows,rescue_result:{passed:rescuePass,early_escalation_blocked:earlyBlocked,no_rationale_blocked:noRationaleBlocked,first_attempt:snap,supported_revision:ev,support_levels:support.map(x=>x.level)},passed:failed===0&&rescuePass};
fs.writeFileSync(path.join(__dirname,"SIMULATION_RESULTS_v2.6.json"),JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
if(!output.passed)process.exit(1);
