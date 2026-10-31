
global.window={};
require("../assets/response-examples.js");
const R=window.RMSResponseExamples;
if(R.field_count!==113)process.exit(1);
const keys=Object.keys(R.fields);
if(keys.length!==113)process.exit(1);
for(const k of keys){
  const x=R.fields[k];
  if(!x.expected_shape||!x.typical_length||!x.length_note||!x.too_vague||!x.good_working_response||!x.why_it_works){
    console.error("Incomplete response example",k,x);process.exit(1);
  }
}
for(const k of ["finalRQ","rqJustification","researchHyp","experimentalUnit","procedure","analysisChoice","resultsDraft","limitations","abstractDraft"]){
  const x=R.fields[k];
  if(!x.good_working_response||x.good_working_response.length<25)process.exit(1);
}
if(!R.fields.procedure.detailed_response || !R.fields.limitations.detailed_response || !R.fields.abstractDraft.detailed_response)process.exit(1);
// Stage C-X3c2a | response-example descriptors must match canonical field guidance.
const canonicalRescue=require("../assets/rescue-model-v2.5.json");
for(const [key,entry] of Object.entries(R.fields)){
 const field=canonicalRescue.fields[key];
 if(!field||entry.label!==field.label||entry.stage!==field.stage||entry.type!==field.type)process.exit(1);
}
if(!/quantitative target/.test(R.fields.primaryEstimand.expected_shape))process.exit(1);
if(!/mixed-methods/.test(R.fields.primaryEstimand.why_it_works))process.exit(1);
// Stage C-X3c2b | initial 25 responses retain bounded, task-specific examples.
const first25=Object.keys(R.fields).slice(0,25);
if(first25.join(",")!=="interest1,problem1,claim1,access1,ideaA,ideaB,ideaC,broadTopic,subtopic,phenomenon,contextPop,scope,timeLimit,resources,safety,topicChoice,concepts,synonyms,prelimSearch,known,methodsSeen,uncertain,questionShift,rq1,rq2")process.exit(1);
for(const key of first25){
 const v=R.fields[key],match=v.typical_length.match(/(\d+)[–-](\d+)/);
 if(!v.expected_shape||!v.good_working_response||!v.why_it_works||v.good_working_response.includes("—"))process.exit(1);
 if(match){const count=v.good_working_response.trim().split(/\s+/).length;if(count<Number(match[1])||count>Number(match[2]))process.exit(1)}
}
if(!/hypothetical classroom/.test(R.fields.problem1.good_working_response))process.exit(1);
if(!/ruler/.test(R.fields.resources.good_working_response))process.exit(1);
if(!/measurement occasion/.test(R.fields.synonyms.why_it_works))process.exit(1);
if(!/not yet run/.test(R.fields.prelimSearch.good_working_response))process.exit(1);
if(!/after execution/.test(R.fields.prelimSearch.expected_shape))process.exit(1);
if(!/before describing this pattern as established/.test(R.fields.known.good_working_response))process.exit(1);
if(!/rather than results from a completed search/.test(R.fields.methodsSeen.good_working_response))process.exit(1);
if(!/studies actually reviewed/.test(R.fields.uncertain.good_working_response))process.exit(1);
if(!/hypothetical reading exercise/.test(R.fields.questionShift.good_working_response))process.exit(1);
if(!/students in this class describe/.test(R.fields.rq2.good_working_response))process.exit(1);
if(R.fields.rq1.good_working_response===R.fields.rq2.good_working_response)process.exit(1);

// Stage C-X3c2c | response examples 26-50 keep distinct candidate questions and verified source status.
const second25=Object.keys(R.fields).slice(25,50);
if(second25.length!==25||second25[0]!=="rq3"||second25[24]!=="litDraft")process.exit(1);
for(const key of second25){
 const v=R.fields[key];if(!v.expected_shape||!v.good_working_response||!v.why_it_works||v.good_working_response.includes("—"))process.exit(1);
}
if(!/published research/.test(R.fields.rq3.why_it_works))process.exit(1);
if(R.fields.questionType.good_working_response!=="Correlational / observational")process.exit(1);
if(!/retention test/.test(R.fields.searchBlock2.good_working_response))process.exit(1);
if(!/Proposed ERIC query/.test(R.fields.searchStrings.good_working_response))process.exit(1);
if(!/regardless of whether findings/.test(R.fields.includeCriteria.good_working_response))process.exit(1);
if(!/unfavourable result is never an exclusion/.test(R.fields.excludeCriteria.why_it_works))process.exit(1);
if(!/placeholders, not citations/.test(R.fields.litDraft.detailed_response))process.exit(1);
if(R.fields.litDraft.detailed_response.trim().split(/\s+/).length<250)process.exit(1);

console.log("PASS v2.11 response-example coverage and depth");
