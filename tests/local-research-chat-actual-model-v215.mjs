import fs from "node:fs/promises";
import path from "node:path";
import { pipeline, env } from "@huggingface/transformers";

const ROOT=process.cwd();
const MODEL_ROOT=path.join(ROOT,"_site","models")+path.sep;
const MODEL_ID="smollm2-360m-instruct";
const OUT=path.join(ROOT,"ACTUAL_MODEL_SMOKE_v2.15.json");

// Exercise the actual pinned q4 model downloaded by the Pages build.
env.allowRemoteModels=false;
env.allowLocalModels=true;
env.localModelPath=MODEL_ROOT;
env.useBrowserCache=false;

const system=`You are Research Chat inside a secondary-school Research Methods Studio.
Explain research concepts accurately and in plain English. Preserve student authorship. Do not invent sources, data, statistics, or web searches. Do not overclaim causation. Keep answers concise. If a premise is wrong, correct it clearly.`;

const cases=[
  {id:1,question:"What is an operational definition?"},
  {id:2,question:"What is the difference between a population and a sample?"},
  {id:3,question:"Why does correlation not prove causation?"},
  {id:4,question:"If my p-value is below .05, does that mean my hypothesis is probably true?"},
  {id:5,question:"If my result is not statistically significant, can I conclude there is no effect?"},
  {id:6,question:"What is the difference between random sampling and random assignment?"},
  {id:7,question:"Does every research study need an independent and dependent variable?"},
  {id:8,question:"A p-value of .03 means there is a 97% chance my hypothesis is true. Explain why."}
];

function answerFromOutput(output){
  const generated=output?.[0]?.generated_text;
  if(Array.isArray(generated)){
    const last=generated[generated.length-1];
    return String(last?.content||"").trim();
  }
  if(typeof generated==="string")return generated.trim();
  return "";
}

const started=new Date().toISOString();
const generator=await pipeline("text-generation",MODEL_ID,{dtype:"q4",device:"wasm"});
const results=[];
for(const item of cases){
  const t0=Date.now();
  const output=await generator([
    {role:"system",content:system},
    {role:"user",content:item.question}
  ],{
    max_new_tokens:140,
    do_sample:false,
    repetition_penalty:1.08
  });
  const answer=answerFromOutput(output).replace(/<\|(?:im_start|im_end|endoftext)\|>/g,"").trim();
  if(answer.length<15)throw new Error(`Actual model returned an unusably short response for case ${item.id}: ${JSON.stringify(answer)}`);
  results.push({id:item.id,question:item.question,answer,latency_ms:Date.now()-t0});
  console.log(`\n[${item.id}] ${item.question}\n${answer}\n`);
}
try{await generator.dispose?.()}catch{}

const report={
  release:"v2.15",
  model:"SmolLM2 360M Instruct",
  model_variant:"q4",
  execution:"Transformers.js Node/WASM smoke using the exact Pages model files",
  started_at:started,
  completed_at:new Date().toISOString(),
  note:"These outputs require human methodological review. This smoke test establishes that the actual pinned model executes and preserves representative outputs for the release decision; it is not a validation study.",
  results
};
await fs.writeFile(OUT,JSON.stringify(report,null,2));
console.log(`Wrote ${OUT}`);
