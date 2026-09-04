
global.window={};
require("../assets/literature.js");
const L=window.RMSLiterature;
let p={sources:[
  {id:"S01",citation:"A",screeningStatus:"Included",design:"Experiment",sample:"Students",measures:"Test",finding:"Higher recall",limits:"Small n",relevance:"retrieval",trapp:{timeframe:"ok",relevance:"ok",authority:"ok",accuracy:"ok",purpose:"ok"},themeEvidence:[{theme:"retrieval benefit",stance:"supports",note:"positive"}]},
  {id:"S02",citation:"B",screeningStatus:"Included",design:"Experiment",sample:"Adults",measures:"Recall",finding:"No difference",limits:"Short delay",relevance:"retrieval",trapp:{},themeEvidence:[{theme:"retrieval benefit",stance:"conflicts",note:"null"}]}
],searchLog:[],litClaims:[{text:"Results vary",sourceIds:["S01","S02"],type:"Difference"}],litOutline:[],data:{}};
L.normalizeProject(p);
if(L.themeMap(p)[0].supporting.length!==1)process.exit(1);
if(L.themeMap(p)[0].conflicting.length!==1)process.exit(1);
if(!L.claimAudit(p)[0].synthesis)process.exit(1);
if(!L.makeStudyMatrixCSV(p).includes("S01"))process.exit(1);
console.log("PASS literature workspace engine");
