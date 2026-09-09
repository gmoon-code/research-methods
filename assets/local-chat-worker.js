import { pipeline, env } from "../vendor/transformers/transformers.min.js";

const CFG={
  modelId:"smollm2-360m-instruct",
  webgpuDtype:"q4f16",
  wasmDtype:"q4",
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
let dtype=CFG.wasmDtype;
let loading=null;

function post(type,data={}){self.postMessage({type,...data})}

async function loadModel(){
  if(generator)return {device,dtype};
  if(loading)return loading;
  loading=(async()=>{
    const wantWebGPU=Boolean(self.navigator?.gpu);
    const attempts=wantWebGPU
      ? [
          {device:"webgpu",dtype:CFG.webgpuDtype},
          {device:"webgpu",dtype:CFG.wasmDtype},
          {device:"wasm",dtype:CFG.wasmDtype}
        ]
      : [{device:"wasm",dtype:CFG.wasmDtype}];
    let lastError=null;
    for(const candidate of attempts){
      try{
        post("loading",candidate);
        generator=await pipeline("text-generation",CFG.modelId,{
          dtype:candidate.dtype,
          device:candidate.device
        });
        device=candidate.device;
        dtype=candidate.dtype;
        post("ready",{device,dtype});
        return {device,dtype};
      }catch(err){
        lastError=err;
        generator=null;
        post("load-warning",{device:candidate.device,dtype:candidate.dtype,message:String(err?.message||err)});
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
      post("generating",{requestId:msg.requestId,device,dtype});
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
      post("result",{requestId:msg.requestId,text:answerFromOutput(output),device,dtype});
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
