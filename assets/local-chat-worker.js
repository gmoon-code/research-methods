import { pipeline, env } from "../vendor/transformers/transformers.min.js";

const CFG={
  modelId:"smollm2-360m-instruct",
  dtype:"q4",
  maxNewTokens:140
};

env.allowRemoteModels=false;
env.allowLocalModels=true;
env.localModelPath=new URL("../models/",import.meta.url).href;
env.useBrowserCache=true;
env.useWasmCache=true;
env.backends.onnx.wasm.wasmPaths=new URL("../vendor/transformers/wasm/",import.meta.url).href;

let generator=null;
let device="wasm";
let loading=null;

function post(type,data={}){self.postMessage({type,...data})}
function progress(p){
  const value=Number.isFinite(p?.progress)?Math.max(0,Math.min(100,p.progress)):null;
  post("progress",{
    status:p?.status||"",
    file:p?.file||"",
    progress:value,
    loaded:p?.loaded||0,
    total:p?.total||0
  });
}

async function loadModel(){
  if(generator)return {device};
  if(loading)return loading;
  loading=(async()=>{
    const wantWebGPU=Boolean(self.navigator?.gpu);
    const attempts=wantWebGPU?["webgpu","wasm"]:["wasm"];
    let lastError=null;
    for(const candidate of attempts){
      try{
        post("loading",{device:candidate});
        generator=await pipeline("text-generation",CFG.modelId,{
          dtype:CFG.dtype,
          device:candidate,
          progress_callback:progress
        });
        device=candidate;
        post("ready",{device});
        return {device};
      }catch(err){
        lastError=err;
        generator=null;
        post("load-warning",{device:candidate,message:String(err?.message||err)});
      }
    }
    throw lastError||new Error("Research Chat model could not be loaded.");
  })();
  try{return await loading}
  finally{loading=null}
}

function answerFromOutput(output){
  const generated=output?.[0]?.generated_text;
  if(Array.isArray(generated)){
    const last=generated[generated.length-1];
    return String(last?.content||"").trim();
  }
  if(typeof generated==="string")return generated.trim();
  return "";
}

self.onmessage=async event=>{
  const msg=event.data||{};
  try{
    if(msg.type==="load"){
      await loadModel();
      return;
    }
    if(msg.type==="generate"){
      await loadModel();
      post("generating",{requestId:msg.requestId,device});
      const messages=[
        {role:"system",content:String(msg.system||"")},
        ...(Array.isArray(msg.history)?msg.history.slice(-12):[]),
        {role:"user",content:String(msg.question||"")}
      ];
      const output=await generator(messages,{
        max_new_tokens:Math.min(Number(msg.maxNewTokens||CFG.maxNewTokens),180),
        do_sample:false,
        repetition_penalty:1.08
      });
      post("result",{requestId:msg.requestId,text:answerFromOutput(output),device});
      return;
    }
    if(msg.type==="dispose"){
      try{await generator?.dispose?.()}catch{}
      generator=null;
      post("disposed");
    }
  }catch(err){
    post("error",{requestId:msg.requestId||"",message:String(err?.message||err),stack:String(err?.stack||"").slice(0,1000)});
  }
};
