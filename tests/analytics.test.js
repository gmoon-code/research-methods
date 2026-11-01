global.window={};require('../assets/analytics.js');const S=window.RMSAnalytics;const near=(a,b,t=1e-5)=>Math.abs(a-b)<=t;let r=S.welchT([1,2,3,4,5],[2,3,4,5,6]);if(!near(r.t,-1)||!near(r.df,8)||Math.abs(r.p-.34659)>.002)process.exit(1);r=S.pearson([1,2,3,4,5],[2,4,6,8,10]);if(Math.abs(r.r-1)>1e-10||r.p>1e-8)process.exit(1);r=S.oneWayANOVA({A:[1,2,3],B:[4,5,6],C:[7,8,9]});if(Math.abs(r.F-27)>1e-8||r.df1!==2||r.df2!==6)process.exit(1);r=S.chiSquare({rows:['A','B'],cols:['Y','N'],table:[[10,20],[20,10]],n:60});if(Math.abs(r.chi2-6.6666667)>.001||Math.abs(r.p-.009823)>.002)process.exit(1);r=S.mcnemar(8,2);if(Math.abs(r.exact_p-.109375)>1e-9)process.exit(1);let csv=S.parseCSV('id,group,score\n1,A,5\n2,B,7\n');if(csv.data.length!==2||csv.headers.length!==3||csv.data[1].score!=='7')process.exit(1);let p={analysis:{rawData:csv.data,headers:csv.headers},data:{},methods:{}};S.normalizeProject(p);let q=S.runAnalysis(p,{structure:'descriptive_numeric',y:'score'});if(q.output.n!==2||!near(q.output.mean,6))process.exit(1);// Stage C-X3c10a | CSV import provenance and unique column names.
const unusual=S.parseCSV('score,score,score_2\n1,2,3\n\n4,5\n6,7,8,9\n');
if(unusual.headers.length!==3||new Set(unusual.headers).size!==3)process.exit(1);
if(unusual.headers[0]!=="score"||unusual.headers[1]!=="score_2"||unusual.headers[2]!=="score_2_2")process.exit(1);
if(unusual.data.length!==3||unusual.data[1].score_2_2!=="")process.exit(1);
if(!unusual.importWarnings.some(x=>x.includes("Header 2"))||!unusual.importWarnings.some(x=>x.includes("Header 3")))process.exit(1);
if(!unusual.importWarnings.some(x=>x.includes("completely blank"))||!unusual.importWarnings.some(x=>x.includes("fewer fields"))||!unusual.importWarnings.some(x=>x.includes("extra fields")))process.exit(1);
const zero=S.parseCSV('dish_id,shoot_length_cm\nD1,0\nD2,4.5\n');
if(zero.data[0].shoot_length_cm!=="0"||zero.importWarnings.length!==0)process.exit(1);
const imported={analysis:{rawData:unusual.data,headers:unusual.headers,importWarnings:unusual.importWarnings,rawRowCount:unusual.rawRowCount}};
S.normalizeProject(imported);
if(imported.analysis.importWarnings.length!==unusual.importWarnings.length||imported.analysis.rawRowCount!==unusual.rawRowCount)process.exit(1);
console.log('PASS statistics engine');
