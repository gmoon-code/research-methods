global.window={};
require("../assets/analytics.js");
const A=window.RMSAnalytics;
const p={data:{finalRQ:"Salinity study"},analysis:{
 fileName:"dish.csv",importedAt:"2026-11-01T00:00:00Z",headers:["dish","treatment","shoot_cm"],missingTokens:"99, NA",
 importWarnings:["Original file had a header rename."],decisionLog:{structure:"descriptive_numeric",estimand:"mean shoot length"},
 rawData:[{dish:"D1",treatment:"control",shoot_cm:"0"},{dish:"D2",treatment:"control",shoot_cm:"2"},
 {dish:"D3",treatment:"salt",shoot_cm:"99"},{dish:"D4",treatment:"salt",shoot_cm:"NA"},
 {dish:"D5",treatment:"salt",shoot_cm:"4"}]},methods:{design:{experimentalUnit:"dish",rowUnit:"dish",independentUnits:5}}};
A.normalizeProject(p);
const codes=A.missingTokenAudit(p);
if(codes.replacements!==2||codes.counts.shoot_cm!==2||codes.rows[0].shoot_cm!=="0")process.exit(1);
if(p.analysis.rawData[2].shoot_cm!=="99"||p.analysis.rawData[3].shoot_cm!=="NA")process.exit(1);
const quality=A.qualityReport(p);
const length=quality.columnReports.find(x=>x.col==="shoot_cm");
if(length.blank!==0||length.configuredMissing!==2||length.missing!==2||length.desc.n!==3)process.exit(1);
const desc=A.runAnalysis(p,{structure:"descriptive_numeric",y:"shoot_cm"});
if(desc.error||desc.output.n!==3||desc.output.mean!==2||desc.output.missing!==2)process.exit(1);
const rec=A.analysisRecord(p,desc);
if(rec.traceability.rows_used!==3||rec.traceability.rows_not_used!==2||rec.missingness.convertedCells!==2)process.exit(1);
if(rec.traceability.estimand!=="mean shoot length"||rec.traceability.file!=="dish.csv")process.exit(1);
p.analysis.runs=[rec];
p.analysis.fileName="new-file.csv";p.analysis.missingTokens="missing";
const note=A.resultsMarkdown(p);
if(!note.includes("Dataset file recorded for this analysis  dish.csv")||!note.includes("Rows used for selected calculation  3"))process.exit(1);
if(!note.includes("Rows omitted for selected calculation  2")||!note.includes("Import note recorded with analysis  Original file had a header rename."))process.exit(1);
if(!note.includes("Missing tokens used for this analysis  99, NA")||!note.includes("Estimand recorded when this analysis was stored  mean shoot length"))process.exit(1);
const binary={analysis:{headers:["before","after"],missingTokens:"NA",rawData:[{before:"1",after:"1"},{before:"0",after:"0"},{before:"1",after:"NA"}]},data:{},methods:{}};
A.normalizeProject(binary);
const m=A.runAnalysis(binary,{structure:"paired_binary",x:"before",y:"after",success:"1"});
if(m.error||m.output.n_pairs!==2||m.output.exact_p!==1||!m.output.no_discordant_pairs)process.exit(1);
const mr=A.analysisRecord(binary,m);
if(mr.traceability.rows_used!==2||mr.traceability.rows_not_used!==1)process.exit(1);
const categorical={data:{},methods:{},analysis:{missingTokens:"NA",headers:["category"],rawData:[{category:"A"},{category:"NA"},{category:"A"},{category:"B"}]}};
A.normalizeProject(categorical);
const cat=A.runAnalysis(categorical,{structure:"descriptive_categorical",y:"category"});
if(cat.error||cat.output.n!==3||cat.output.missing!==1||cat.output.rows.find(x=>x.value==="A").percent!==200/3)process.exit(1);
if(!A.neutralSummary(cat).includes("1 missing"))process.exit(1);
const zero={analysis:{headers:["result"],rawData:[{result:"0"},{result:"1"}],missingTokens:"0"}};
A.normalizeProject(zero);
if(!A.runAnalysis(zero,{structure:"descriptive_numeric",y:"result"}).error)process.exit(1);
if(A.missingTokenAudit(zero).rows[0].result!=="0")process.exit(1);
console.log("PASS analysis missing tokens, denominators and export provenance");
