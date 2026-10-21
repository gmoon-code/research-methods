/* Local interactive review of the draft Admin UI.
 *
 * Only binds to 127.0.0.1, serves allowlisted static files, supplies a
 * browser-only simulated teacher session, and blocks every external request.
 * No live authentication, remote publication or student data collection.
 *
 * This is a developer/test launcher. It is never imported by the website.
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root=resolve(process.cwd());
const mime=Object.freeze({
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".mjs":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".webp":"image/webp",
  ".ico":"image/x-icon",
  ".woff2":"font/woff2"
});
const teacherStub=[
  "window.RMSTeacherSession=Object.freeze({",
  "verify:async()=>true,",
  "isActive:()=>true,",
  "hasStoredSession:()=>true,",
  "leave:()=>{},",
  "login:async()=>({ok:false,error:'Local preview does not support login.'})",
  "});"
].join("\n");

function safeRelativePath(requestUrl){
  let path;
  try{path=decodeURIComponent(new URL(requestUrl,"http://127.0.0.1").pathname);}
  catch{return null;}
  if(path.includes("\\")||path.includes("\0")||path.split("/").includes(".."))
    return null;
  const allowed=path==="/admin-workspace.html"||
    /^\/assets\/[a-zA-Z0-9_.\/-]+$/.test(path);
  if(!allowed)return null;
  const file=resolve(root,path.slice(1));
  if(!file.startsWith(root+sep))return null;
  if(path.split("/").some(part=>part.startsWith(".")))return null;
  if(!Object.hasOwn(mime,extname(file).toLowerCase()))return null;
  return file;
}
async function serve(req,res){
  if(req.method!=="GET"&&req.method!=="HEAD"){
    res.writeHead(405,{"Cache-Control":"no-store"});res.end();return;
  }
  const file=safeRelativePath(req.url);
  if(!file){res.writeHead(404,{"Cache-Control":"no-store"});res.end("Not found");return;}
  try{
    const content=await readFile(file);
    res.writeHead(200,{
      "Content-Type":mime[extname(file).toLowerCase()],
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer"
    });
    res.end(req.method==="HEAD"?undefined:content);
  }catch{
    res.writeHead(404,{"Cache-Control":"no-store"});res.end("Not found");
  }
}

export async function startAdminPreview({headless=false}={}){
  const server=http.createServer((req,res)=>{void serve(req,res);});
  await new Promise((ok,fail)=>{
    server.once("error",fail);
    server.listen(0,"127.0.0.1",ok);
  });
  const address=server.address();
  const origin="http://127.0.0.1:"+address.port;
  let browser=null;
  let closed=false;
  async function close(){
    if(closed)return;
    closed=true;
    if(browser)await browser.close().catch(()=>{});
    await new Promise(done=>server.close(()=>done()));
  }
  try{
    browser=await chromium.launch({headless});
    const context=await browser.newContext({
      viewport:{width:1440,height:900},
      serviceWorkers:"block",
      acceptDownloads:true
    });
    // One route handles both the intentionally simulated client session and
    // all other requests. Nothing from workers.dev or any other external
    // origin can leave this browser context.
    await context.route("**/*",async route=>{
      const url=new URL(route.request().url());
      if(url.origin!==origin){
        await route.abort("blockedbyclient");
        return;
      }
      if(url.pathname==="/assets/teacher-session.js"){
        await route.fulfill({
          status:200,
          contentType:"application/javascript",
          body:teacherStub
        });
        return;
      }
      await route.continue();
    });
    await context.addInitScript(()=>{
      window.addEventListener("DOMContentLoaded",()=>{
        const notice=document.createElement("div");
        notice.id="rms-local-preview-warning";
        notice.setAttribute("role","note");
        notice.textContent=
          "LOCAL DRAFT PREVIEW · Simulated Admin access · External connections blocked · Cannot publish";
        Object.assign(notice.style,{
          position:"fixed",zIndex:"2147483647",left:"8px",right:"8px",
          bottom:"8px",padding:"10px 14px",
          background:"#161616",color:"#fff",font:"600 12px system-ui",
          lineHeight:"1.4",textAlign:"center",border:"1px solid #fff",
          borderRadius:"8px",boxShadow:"0 5px 20px #0005",
          pointerEvents:"none"
        });
        document.body.append(notice);
      },{once:true});
    });
    const page=await context.newPage();
    await page.goto(origin+"/admin-workspace.html",{waitUntil:"domcontentloaded"});
    await page.locator("#adminWorkspace:not([hidden])").waitFor({timeout:15000});
    return {origin,browser,context,page,close};
  }catch(error){
    await close();
    throw error;
  }
}

const scriptUrl=process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href;
if(scriptUrl===import.meta.url){
  try{
    const preview=await startAdminPreview();
    console.log("\nResearch Methods Studio draft Admin preview");
    console.log("Simulated access is ON. All external connections are BLOCKED.");
    console.log("The browser shows local branch files. No backend changes are made.");
    console.log("Close the preview browser to stop the local server.\n");
    await new Promise(done=>preview.browser.once("disconnected",done));
    await preview.close();
  }catch(error){
    console.error("Could not open local Admin preview.");
    console.error(error.message||String(error));
    console.error("Install Playwright and Chromium first:");
    console.error("  npm install --no-save playwright@1.56.1");
    console.error("  npx playwright install chromium");
    process.exitCode=1;
  }
}
