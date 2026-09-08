import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {Readable} from "node:stream";
import {pipeline as streamPipeline} from "node:stream/promises";

const ROOT=process.cwd();
const SITE=path.join(ROOT,"_site");
const CACHE=path.join(ROOT,".cache","rms-model");

const MODEL={
  repo:"onnx-community/SmolLM2-135M-Instruct-ONNX",
  revision:"b8a5c0f183b78c55955a5364f610c36668b5e681",
  localId:"smollm2-135m-instruct",
  q4Sha256:"eb0d67c7e3b7d40f42d681b5f2eff4cef78968afe3f76c954f987dd870327a2a",
  files:[
    "config.json",
    "generation_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "merges.txt",
    "vocab.json",
    "onnx/model_q4.onnx"
  ]
};

function log(...x){console.log("[build-pages]",...x)}
async function exists(p){try{await fsp.access(p);return true}catch{return false}}
async function copyDir(src,dst){
  await fsp.mkdir(dst,{recursive:true});
  for(const ent of await fsp.readdir(src,{withFileTypes:true})){
    const s=path.join(src,ent.name),d=path.join(dst,ent.name);
    if(ent.isDirectory())await copyDir(s,d);
    else if(ent.isFile())await fsp.copyFile(s,d);
  }
}
async function sha256(file){
  return await new Promise((resolve,reject)=>{
    const h=crypto.createHash("sha256"),s=fs.createReadStream(file);
    s.on("data",x=>h.update(x));s.on("end",()=>resolve(h.digest("hex")));s.on("error",reject);
  });
}
async function download(url,dest){
  await fsp.mkdir(path.dirname(dest),{recursive:true});
  const tmp=dest+".part";
  await fsp.rm(tmp,{force:true});
  log("Downloading",url);
  const res=await fetch(url,{redirect:"follow",headers:{"user-agent":"Research-Methods-Studio-GitHub-Pages-Build/2.15"}});
  if(!res.ok||!res.body)throw new Error(`Download failed ${res.status} ${url}`);
  await streamPipeline(Readable.fromWeb(res.body),fs.createWriteStream(tmp));
  await fsp.rename(tmp,dest);
}
async function ensureModelFile(rel){
  const cached=path.join(CACHE,rel);
  const url=`https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}/${rel}?download=true`;
  if(!(await exists(cached)))await download(url,cached);
  if(rel==="onnx/model_q4.onnx"){
    const got=await sha256(cached);
    if(got!==MODEL.q4Sha256){
      await fsp.rm(cached,{force:true});
      throw new Error(`Pinned q4 model SHA-256 mismatch. Expected ${MODEL.q4Sha256}, got ${got}`);
    }
  }
  const dest=path.join(SITE,"models",MODEL.localId,rel);
  await fsp.mkdir(path.dirname(dest),{recursive:true});
  await fsp.copyFile(cached,dest);
}

await fsp.rm(SITE,{recursive:true,force:true});
await fsp.mkdir(SITE,{recursive:true});

for(const rel of ["index.html","404.html",".nojekyll"]){
  const src=path.join(ROOT,rel);
  if(await exists(src))await fsp.copyFile(src,path.join(SITE,rel));
}
for(const rel of ["assets","prompts","examples"]){
  const src=path.join(ROOT,rel);
  if(await exists(src))await copyDir(src,path.join(SITE,rel));
}

const tfDist=path.join(ROOT,"node_modules","@huggingface","transformers","dist","transformers.min.js");
if(!(await exists(tfDist)))throw new Error("Transformers.js 4.2.0 is not installed. Run npm install first.");
const vendor=path.join(SITE,"vendor","transformers");
await fsp.mkdir(path.join(vendor,"wasm"),{recursive:true});
await fsp.copyFile(tfDist,path.join(vendor,"transformers.min.js"));

const wasmRoots=[
  path.join(ROOT,"node_modules","onnxruntime-web","dist"),
  path.join(ROOT,"node_modules","@huggingface","transformers","node_modules","onnxruntime-web","dist")
];
let wasmCount=0;
for(const dir of wasmRoots){
  if(!(await exists(dir)))continue;
  for(const name of await fsp.readdir(dir)){
    if(!name.endsWith(".wasm"))continue;
    await fsp.copyFile(path.join(dir,name),path.join(vendor,"wasm",name));
    wasmCount++;
  }
}
if(!wasmCount)throw new Error("No ONNX Runtime Web .wasm files were found after installing Transformers.js.");
log("Vendored",wasmCount,"ONNX Runtime WebAssembly binaries.");

for(const rel of MODEL.files)await ensureModelFile(rel);

const manifest=[];
async function walk(dir){
  for(const ent of await fsp.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())await walk(p);
    else if(ent.isFile()){
      const st=await fsp.stat(p);
      manifest.push({
        path:path.relative(SITE,p).split(path.sep).join("/"),
        bytes:st.size,
        sha256:await sha256(p)
      });
    }
  }
}
await walk(SITE);
manifest.sort((a,b)=>a.path.localeCompare(b.path));
const total=manifest.reduce((n,x)=>n+x.bytes,0);
const max=950*1024*1024;
if(total>max)throw new Error(`Pages artifact is ${(total/1024/1024).toFixed(1)} MB, above the 950 MB release guard.`);

const buildManifest={
  release:"v2.15",
  builtAt:new Date().toISOString(),
  transformersVersion:"4.2.0",
  model:{
    repository:MODEL.repo,
    revision:MODEL.revision,
    localId:MODEL.localId,
    dtype:"q4",
    q4Sha256:MODEL.q4Sha256
  },
  totalBytes:total,
  totalMB:Number((total/1024/1024).toFixed(1)),
  files:manifest
};
await fsp.writeFile(path.join(SITE,"BUILD_MANIFEST_v2.15.json"),JSON.stringify(buildManifest,null,2));
log(`Complete. ${manifest.length} files, ${(total/1024/1024).toFixed(1)} MB.`);
