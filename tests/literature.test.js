
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
console.log("PASS literature workspace engine");
