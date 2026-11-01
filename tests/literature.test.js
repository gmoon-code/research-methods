
global.window={};
require("../assets/literature.js");
const L=window.RMSLiterature;
let p={sources:[
  {id:"S01",citation:"A",screeningStatus:"Included",design:"Experiment",sample:"Students",measures:"Test",finding:"Higher recall",limits:"Small n",relevance:"retrieval",trapp:{timeframe:"ok",relevance:"ok",authority:"ok",accuracy:"ok",purpose:"ok"},themeEvidence:[{theme:"retrieval benefit",stance:"supports",note:"positive"}]},
  {id:"S02",citation:"B",screeningStatus:"Included",design:"Experiment",sample:"Adults",measures:"Recall",finding:"Lower delayed recall",limits:"Short delay",relevance:"retrieval",trapp:{},themeEvidence:[{theme:"retrieval benefit",stance:"conflicts",note:"null"}]}
],searchLog:[],litClaims:[{text:"Results vary",sourceIds:["S01","S02"],type:"Difference"}],litOutline:[],data:{}};
L.normalizeProject(p);
if(L.themeMap(p)[0].supporting.length!==1)process.exit(1);
if(L.themeMap(p)[0].conflicting.length!==1)process.exit(1);
if(!L.claimAudit(p)[0].synthesis)process.exit(1);
if(!L.makeStudyMatrixCSV(p).includes("S01"))process.exit(1);
// Stage C-X3c8a | eligibility is explicit and legacy theme tags are not evidence.
const review={sources:[
 {id:"S10",citation:"unscreened",themeEvidence:[{theme:"candidate",stance:"supports",note:"unverified"}]},
 {id:"S11",citation:"excluded",screeningStatus:"Excluded",themeEvidence:[{theme:"candidate",stance:"supports",note:"not eligible"}]},
 {id:"S12",citation:"included",screeningStatus:"Included",themes:["legacy theme"],design:"Experiment",sample:"School",measures:"Recall",finding:"Documented finding"}
],searchLog:[],litClaims:[],litOutline:[],data:{}};
L.normalizeProject(review);
if(review.sources[0].screeningStatus!=="Pending")process.exit(1);
if(review.sources[1].screeningStatus!=="Excluded"||review.sources[2].screeningStatus!=="Included")process.exit(1);
const map=L.themeMap(review);
if(map.some(t=>t.theme==="candidate"))process.exit(1);
if(map.length!==1||map[0].theme!=="legacy theme"||map[0].supporting.length!==0||map[0].background.length!==1)process.exit(1);
if(L.makeStudyMatrixCSV(review).includes("S10")||L.makeStudyMatrixCSV(review).includes("S11"))process.exit(1);
if(L.makeThemeCSV(review).includes("candidate"))process.exit(1);
if(L.gapReadiness(review).safeToClaimGlobalGap)process.exit(1);
const many={sources:Array.from({length:12},(_,i)=>({id:"X"+i,screeningStatus:"Included",measures:"test",sample:"school",limits:"observational"})),searchLog:[],data:{}};
if(L.gapReadiness(many).safeToClaimGlobalGap)process.exit(1);
// Stage C-X3c8b | source links, evidence status and unclassified themes.
review.litClaims=[{text:"Claim needs checking",sourceIds:["S10","S11","S12","S12","UNKNOWN"]}];
const checked=L.claimAudit(review)[0];
if(checked.sourceCount!==1||checked.includedIds.join(",")!=="S12")process.exit(1);
if(checked.pendingIds.join(",")!=="S10"||checked.excludedIds.join(",")!=="S11")process.exit(1);
if(checked.missingIds.join(",")!=="UNKNOWN"||checked.synthesis)process.exit(1);
const background={sources:[
 {id:"B01",screeningStatus:"Included",themeEvidence:[{theme:"context",stance:"background",note:"not direct evidence"}]},
 {id:"B02",screeningStatus:"Included",themeEvidence:[{theme:"context",stance:"background",note:"not direct evidence"}]},
 {id:"B03",screeningStatus:"Included",themeEvidence:[{theme:"unclassified",note:"no stance entered"}]}
],litClaims:[],searchLog:[],data:{}};
L.normalizeProject(background);
if(L.gapReadiness(background).multiSourceThemes!==0)process.exit(1);
const unclassified=L.themeMap(background).find(t=>t.theme==="unclassified");
if(!unclassified||unclassified.supporting.length||unclassified.background.length||unclassified.sources.length!==1)process.exit(1);
// Stage C-X3c8c | search records retain their provenance and legacy status.
const fullSearch={date:"2026-11-01",database:"ERIC",query:"retrieval practice AND science",filters:"none",results:0,kept:"",notes:""};
if(L.searchLogStatus(fullSearch).confirmed)process.exit(1);
if(L.searchLogStatus(fullSearch).label!=="Execution not confirmed")process.exit(1);
fullSearch.executed=true;
if(!L.searchLogStatus(fullSearch).confirmed)process.exit(1);
const partialSearch={date:"2026-11-01",database:"ERIC",query:"retrieval practice",filters:"",results:"0",executed:true};
if(L.searchLogStatus(partialSearch).complete||L.searchLogStatus(partialSearch).label!=="Incomplete record")process.exit(1);
const historical={searchLog:[{...fullSearch,executed:undefined},fullSearch,partialSearch]};
L.normalizeProject(historical);
if(historical.searchLog[0].executed!==undefined||historical.searchLog[1].executed!==true)process.exit(1);
const csv=L.makeSearchLogCSV(historical);
if(!csv.includes("Documentation status")||!csv.includes("Execution not confirmed")||!csv.includes("Execution confirmed by student")||!csv.includes("Incomplete record"))process.exit(1);
// Stage C-X3c8d | correcting legacy search entries preserves evidence and resets confirmation.
const legacy={searchLog:[{date:"",database:"ERIC",query:"salinity AND germination",filters:"none",results:0,notes:"archived record",legacyFlag:"retain",executed:true}]};
const prev=JSON.stringify(legacy.searchLog[0]);
let errorCount=0;
try{L.reviseSearchLog(legacy,0,{date:"2026-10-31"},"","2026-11-01T09:30:00Z")}catch(e){errorCount++}
if(errorCount!==1||JSON.stringify(legacy.searchLog[0])!==prev)process.exit(1);
const correction=L.reviseSearchLog(legacy,0,{date:"2026-10-31"},"Recovered recorded search date from notes","2026-11-01T09:31:00Z");
if(!correction.requiresConfirmation||legacy.searchLog[0].executed!==false)process.exit(1);
if(legacy.searchLog[0].date!=="2026-10-31"||legacy.searchLog[0].results!=="0"||legacy.searchLog[0].legacyFlag!=="retain")process.exit(1);
if(legacy.searchLog[0].revisions.length!==1||legacy.searchLog[0].revisions[0].before.date!==""||legacy.searchLog[0].revisions[0].before.executed!==true)process.exit(1);
legacy.searchLog[0].executed=true;
const second=L.reviseSearchLog(legacy,0,{notes:"Corrected transcription in note"},"Checked source annotation","2026-11-01T09:32:00Z");
if(second.requiresConfirmation||!legacy.searchLog[0].executed||legacy.searchLog[0].revisions.length!==2)process.exit(1);
if(!L.makeSearchRevisionCSV(legacy).includes("Recovered recorded search date from notes"))process.exit(1);
if(!L.makeSearchRevisionCSV(legacy).includes("Checked source annotation"))process.exit(1);
if(!L.makeSearchLogCSV(legacy).includes("Documentation status"))process.exit(1);
let unchanged=false;
try{L.reviseSearchLog(legacy,0,{},"No actual difference","2026-11-01T09:33:00Z")}catch(e){unchanged=true}
if(!unchanged||legacy.searchLog[0].revisions.length!==2)process.exit(1);
// Stage C-X3c8d outline | linked source IDs do not imply verified evidence.
const outlineSample={sources:[{id:"I01",screeningStatus:"Included"},{id:"P01",screeningStatus:"Pending"},{id:"E01",screeningStatus:"Excluded"}],
  litOutline:[{theme:"Methods",sourceIds:["I01","P01","E01","MISSING","I01"],job:"Compare records",claim:"Working claim",transition:""}],data:{}};
const outlineText=L.outlineMarkdown(outlineSample);
if(!outlineText.includes("Linked source IDs (verify claim support)")||outlineText.includes("**Supporting sources:**"))process.exit(1);
if(!outlineText.includes("P01 (Pending)")||!outlineText.includes("E01 (Excluded)")||!outlineText.includes("MISSING (unknown ID)"))process.exit(1);
if(outlineText.includes("**Transition / implication:**"))process.exit(1);
console.log("PASS literature workspace engine");
