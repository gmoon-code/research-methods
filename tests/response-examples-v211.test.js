
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
console.log("PASS v2.11 response-example coverage and depth");
