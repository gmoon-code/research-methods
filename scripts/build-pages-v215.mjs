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
  repo:"onnx-community/SmolLM2-360M-Instruct-ONNX",
  revision:"fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9",
  localId:"smollm2-360m-instruct",
  files:[
    {path:"config.json"},
    {path:"generation_config.json"},
    {path:"tokenizer.json"},
    {path:"tokenizer_config.json"},
    {path:"special_tokens_map.json"},
    {path:"merges.txt"},
    {path:"vocab.json"},
    {path:"onnx/model_q4.onnx",sha256:"77b81bc8d2cb60c23a3399acba67dfa241d073764a4d1bdcce479747fb794aa6",bytes:386495938},
    {path:"onnx/model_q4f16.onnx",sha256:"ce4a145ce32435411a296289d93b2c33334e6876ffba05373c9aa829c28e2026",bytes:272353302}
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
async function verifyModelFile(spec,cached){
  if(spec.bytes){
    const st=await fsp.stat(cached);
    if(st.size!==spec.bytes)throw new Error(`${spec.path} size mismatch. Expected ${spec.bytes}, got ${st.size}`);
  }
  if(spec.sha256){
    const got=await sha256(cached);
    if(got!==spec.sha256)throw new Error(`${spec.path} SHA-256 mismatch. Expected ${spec.sha256}, got ${got}`);
  }
}
async function ensureModelFile(spec){
  const rel=spec.path,cached=path.join(CACHE,rel);
  const url=`https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}/${rel}?download=true`;
  if(!(await exists(cached)))await download(url,cached);
  try{await verifyModelFile(spec,cached)}catch(err){
    await fsp.rm(cached,{force:true});
    throw err;
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

const tfPackage=JSON.parse(await fsp.readFile(path.join(ROOT,"node_modules","@huggingface","transformers","package.json"),"utf8"));
if(tfPackage.version!=="4.2.0")throw new Error(`Expected @huggingface/transformers 4.2.0, installed ${tfPackage.version}`);
const ortPackage=JSON.parse(await fsp.readFile(path.join(ROOT,"node_modules","onnxruntime-web","package.json"),"utf8"));
if(ortPackage.version!=="1.26.0-dev.20260416-b7804b056c")throw new Error(`Unexpected onnxruntime-web version ${ortPackage.version}`);

const tfDist=path.join(ROOT,"node_modules","@huggingface","transformers","dist","transformers.min.js");
if(!(await exists(tfDist)))throw new Error("Transformers.js browser bundle is missing after npm install.");
const vendor=path.join(SITE,"vendor","transformers");
await fsp.mkdir(path.join(vendor,"wasm"),{recursive:true});
await fsp.copyFile(tfDist,path.join(vendor,"transformers.min.js"));

const wasmDir=path.join(ROOT,"node_modules","onnxruntime-web","dist");
let wasmCount=0;
if(await exists(wasmDir)){
  for(const name of await fsp.readdir(wasmDir)){
    if(!name.endsWith(".wasm"))continue;
    await fsp.copyFile(path.join(wasmDir,name),path.join(vendor,"wasm",name));
    wasmCount++;
  }
}
if(!wasmCount)throw new Error("No ONNX Runtime Web .wasm files were found after installing Transformers.js.");
log("Vendored",wasmCount,"ONNX Runtime WebAssembly binaries.");

for(const spec of MODEL.files)await ensureModelFile(spec);

const manifest=[];
async function walk(dir){
  for(const ent of await fsp.readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())await walk(p);
    else if(ent.isFile()){
      const st=await fsp.stat(p);
      manifest.push({path:path.relative(SITE,p).split(path.sep).join("/"),bytes:st.size,sha256:await sha256(p)});
    }
  }
}
await walk(SITE);
manifest.sort((a,b)=>a.path.localeCompare(b.path));
const total=manifest.reduce((n,x)=>n+x.bytes,0);
const max=900*1024*1024;
if(total>max)throw new Error(`Pages artifact is ${(total/1024/1024).toFixed(1)} MB, above the 900 MB release guard.`);

const buildManifest={
  release:"v2.15",
  builtAt:new Date().toISOString(),
  transformersVersion:tfPackage.version,
  onnxruntimeWebVersion:ortPackage.version,
  model:{repository:MODEL.repo,revision:MODEL.revision,localId:MODEL.localId,variants:MODEL.files.filter(x=>x.sha256)},
  totalBytes:total,
  totalMB:Number((total/1024/1024).toFixed(1)),
  githubPagesPublishedSiteLimitMB:1024,
  files:manifest
};
await fsp.writeFile(path.join(SITE,"BUILD_MANIFEST_v2.15.json"),JSON.stringify(buildManifest,null,2));
log(`Complete. ${manifest.length} files, ${(total/1024/1024).toFixed(1)} MB.`);
