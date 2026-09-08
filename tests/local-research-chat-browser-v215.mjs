import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT=process.cwd();
const PORT=41715;
const ORIGIN=`http://127.0.0.1:${PORT}`;
const contentTypes={
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".mjs":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".json":"application/json; charset=utf-8"
};

function sendFile(req,res){
  let urlPath=decodeURIComponent(new URL(req.url,ORIGIN).pathname);
  if(urlPath==="/")urlPath="/index.html";
  const file=path.normalize(path.join(ROOT,urlPath));
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404,{"content-type":"text/plain"});res.end("not found");return;
  }
  res.writeHead(200,{"content-type":contentTypes[path.extname(file)]||"application/octet-stream","cache-control":"no-store"});
  fs.createReadStream(file).pipe(res);
}

function projectFixture(){
  return {
    name:"Browser QA Project",context:"Research Chat browser contract",currentStage:10,
    ready:{1:true,2:true,3:true,4:true,5:true,6:true,7:true,8:true,9:true},
    data:{
      broadTopic:"Sleep and learning",
      finalRQ:"What is the association between reported weekday sleep duration and biology quiz score among students in one class?",
      questionType:"Relationship / association",
      designType:"Observational / correlational",
      claimBoundary:"Association only; no causal claim.",
      predictorIV:"",
      outcomeDV:"Biology quiz score",
      operationalDefs:"Sleep will be reported as average Sunday–Thursday hours; quiz performance will be percent correct.",
      experimentalUnit:"One student contributes one observational case."
    },
    sources:[],reviews:[],schema:[],searchLog:[],litClaims:[],litOutline:[],
    methods:{design:{},sampling:{},ethics:{},constructs:[],conditions:[],controlled:[],confounders:[],measurements:[],procedureSteps:[],protocolVersions:[]},
    analysis:{rawData:[],headers:[],runs:[]},writing:{sections:{},discussionMap:[]},
    transfer:{},competency:{},journey:{},pilot:{},pathway:{selected:"observational"},rescue:{},
    created:"2026-09-09T00:00:00Z"
  };
}

function assert(condition,label,detail=""){
  if(!condition)throw new Error(`FAIL: ${label}${detail?` — ${detail}`:""}`);
  console.log(`PASS ${label}`);
}

const server=http.createServer(sendFile);
await new Promise(resolve=>server.listen(PORT,"127.0.0.1",resolve));

let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:950}});
  const pageErrors=[];const consoleErrors=[];
  page.on("pageerror",e=>pageErrors.push(String(e)));
  page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text())});

  await page.addInitScript(project=>{
    localStorage.setItem("research_methods_studio_v1",JSON.stringify(project));
    window.__rmsWorkerMessages=[];
    window.__rmsToolClicks={data:0,lit:0};
    class FakeWorker{
      constructor(url,options){this.url=String(url);this.options=options;this.onmessage=null;this.onerror=null}
      postMessage(message){
        window.__rmsWorkerMessages.push(JSON.parse(JSON.stringify(message)));
        if(message.type==="load"){
          setTimeout(()=>this.onmessage?.({data:{type:"loading",device:"webgpu",dtype:"q4f16"}}),5);
          setTimeout(()=>this.onmessage?.({data:{type:"ready",device:"webgpu",dtype:"q4f16"}}),20);
        }
        if(message.type==="generate"){
          setTimeout(()=>this.onmessage?.({data:{type:"generating",requestId:message.requestId,device:"webgpu",dtype:"q4f16"}}),4);
          setTimeout(()=>this.onmessage?.({data:{
            type:"result",requestId:message.requestId,device:"webgpu",dtype:"q4f16",
            text:"An operational definition states exactly how a variable will be measured, counted, scored, or classified so another researcher could apply the same rule."
          }}),18);
        }
      }
      terminate(){}
    }
    window.Worker=FakeWorker;
    Object.defineProperty(navigator,"gpu",{value:{},configurable:true});
    Object.defineProperty(navigator,"deviceMemory",{value:8,configurable:true});
    if(!navigator.storage)Object.defineProperty(navigator,"storage",{value:{},configurable:true});
    navigator.storage.estimate=async()=>({quota:2_000_000_000,usage:100_000_000});
  },projectFixture());

  await page.goto(ORIGIN,{waitUntil:"load"});
  await page.waitForSelector("#researchChatLauncher",{state:"visible",timeout:8000});
  assert(await page.locator("#researchChatLauncher").isVisible(),"persistent Research Chat launcher");

  await page.click("#researchChatLauncher");
  await page.waitForSelector(".rms-chat-panel",{state:"visible"});
  let panel=await page.locator(".rms-chat-panel").innerText();
  assert(panel.includes("no API key")&&panel.includes("no per-message fee"),"free/no-secret disclosure");
  assert(panel.includes("SmolLM2 360M Instruct"),"model disclosure");
  assert(panel.includes("About 280 MB"),"WebGPU first-download disclosure");
  assert(panel.includes("additional q4 fallback")||panel.includes("additional q4"),"fallback-download disclosure");
  assert(panel.includes("Small-model limitation")&&panel.includes("inaccurate"),"small-model limitation disclosure");

  await page.click("#rmsChatLoadModel");
  await page.waitForFunction(()=>window.__rmsWorkerMessages.some(x=>x.type==="load"));
  await page.waitForSelector("#rmsChatInput",{state:"visible",timeout:4000});
  panel=await page.locator(".rms-chat-panel").innerText();
  assert(panel.includes("Ready on this device")&&panel.includes("WebGPU q4f16"),"ready state reports actual execution variant");

  await page.fill("#rmsChatInput","What is an operational definition?");
  await page.locator("#rmsChatForm button").click();
  await page.waitForFunction(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").length===1);
  await page.waitForFunction(()=>document.querySelector("#rmsChatMessages")?.innerText.includes("An operational definition states exactly"));
  assert(true,"ordinary research-method question reaches local model contract");

  const predictor=page.locator('[data-field="predictorIV"]');
  assert(await predictor.count()===1,"Stage 10 predictor field exists in actual app");
  await predictor.focus();
  const beforeGuard=await page.evaluate(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").length);
  await page.fill("#rmsChatInput","Write this field for me and give me the answer.");
  await page.locator("#rmsChatForm button").click();
  await page.waitForFunction(()=>document.querySelector("#rmsChatMessages")?.innerText.includes("should not make that research decision before you try"));
  const afterGuard=await page.evaluate(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").length);
  assert(beforeGuard===afterGuard,"blank-field direct-completion guard runs before model");

  await page.fill("#rmsChatInput","Calculate the Pearson correlation and p-value for me.");
  await page.locator("#rmsChatForm button").click();
  await page.waitForFunction(()=>document.querySelector("#rmsChatMessages")?.innerText.includes("Data & Statistics Lab"));
  const afterStats=await page.evaluate(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").length);
  assert(afterStats===afterGuard,"inferential-statistics guard runs before model");

  await page.fill("#rmsChatInput","Make up a study and DOI that supports my claim.");
  await page.locator("#rmsChatForm button").click();
  await page.waitForFunction(()=>document.querySelector("#rmsChatMessages")?.innerText.includes("cannot invent a citation"));
  const afterSource=await page.evaluate(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").length);
  assert(afterSource===afterGuard,"fabricated-source guard runs before model");

  await predictor.fill("Reported weekday sleep duration");
  await predictor.focus();
  await page.uncheck("#rmsChatContext");
  await page.fill("#rmsChatInput","Can you explain predictor and outcome?");
  await page.locator("#rmsChatForm button").click();
  await page.waitForFunction(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").length===2);
  const last=await page.evaluate(()=>window.__rmsWorkerMessages.filter(x=>x.type==="generate").at(-1));
  assert(last.system.includes("No accumulated decisions supplied."),"project-context toggle removes project decisions from prompt");

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("rms_research_chat_v215")||"{}"));
  assert(Array.isArray(saved.messages)&&saved.messages.some(x=>x.role==="assistant"),"Research Chat conversation persists separately in browser storage");
  assert(!JSON.stringify(await page.evaluate(()=>JSON.parse(localStorage.getItem("research_methods_studio_v1")))).includes("SmolLM2"),"chat runtime metadata is not injected into student project data");

  await page.click("#rmsChatClose");
  const aiSettings=page.locator("#aiSettings");
  if(await aiSettings.count()){
    await aiSettings.click();
    await page.waitForSelector(".rms-chat-panel",{state:"visible"});
    assert(await page.locator(".rms-chat-panel").isVisible(),"legacy AI settings affordance is captured by local Research Chat");
  }

  const mobile=await browser.newPage({viewport:{width:360,height:760}});
  await mobile.addInitScript(()=>{
    class FakeWorker{postMessage(){} terminate(){}}
    window.Worker=FakeWorker;
    Object.defineProperty(navigator,"gpu",{value:{},configurable:true});
    Object.defineProperty(navigator,"deviceMemory",{value:8,configurable:true});
  });
  await mobile.goto(ORIGIN,{waitUntil:"load"});
  await mobile.waitForSelector("#researchChatLauncher",{state:"visible",timeout:8000});
  assert(await mobile.locator("#researchChatLauncher").isVisible(),"mobile Research Chat launcher");
  assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),"no mobile horizontal page overflow");
  await mobile.click("#researchChatLauncher");
  const box=await mobile.locator(".rms-chat-panel").boundingBox();
  assert(box&&box.width<=348,"mobile Research Chat panel fits viewport",JSON.stringify(box));
  await mobile.close();

  const allowedConsoleErrors=consoleErrors.filter(x=>!x.includes("favicon"));
  assert(pageErrors.length===0,"no JavaScript page errors",pageErrors.join(" | "));
  assert(allowedConsoleErrors.length===0,"no unexpected console errors",allowedConsoleErrors.join(" | "));
  console.log("PASS v2.15 rendered browser contract completed");
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
