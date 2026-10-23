// Production-safe negative access test. Every external request is blocked.
// No valid teacher token is ever supplied, and no release is published.
import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=process.env.ADMIN_TEST_URL||"http://127.0.0.1:8765";
const origin=new URL(base).origin;
const browser=await chromium.launch({headless:true});
const failures=[];
async function contextWithNoExternalNetwork(initScript){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  if(initScript)await context.addInitScript(initScript);
  await context.route("**/*",route=>{
    const url=new URL(route.request().url());
    return url.origin===origin?route.continue():route.abort("blockedbyclient");
  });
  return context;
}
async function waitForTeacherGate(page){
  await page.waitForURL(url=>url.pathname.endsWith("/teacher.html"),{timeout:12000});
  assert.equal(await page.locator("#teacherAccessCode").getAttribute("type"),"password");
  assert.equal(await page.locator("#teacherAccessCode").isVisible(),true);
  assert.equal(await page.locator("#adminWorkspace").count(),0,
    "The sign-in page must never expose Admin Workspace controls");
}
try{
  // The public editor bookmark leads to sign-in, even when the URL includes
  // the allowlisted Content Studio fragment.
  const unsigned=await contextWithNoExternalNetwork();
  const page=await unsigned.newPage();
  page.on("pageerror",err=>failures.push("signed-out: "+err.message));
  await page.goto(base+"/editor.html",{waitUntil:"domcontentloaded"});
  await waitForTeacherGate(page);
  assert.equal(new URL(page.url()).hash,"#visualGuidanceEditor");
  await page.goto(base+"/admin-workspace.html#visualGuidanceEditor",
    {waitUntil:"domcontentloaded"});
  await waitForTeacherGate(page);

  // Deliberately malformed/expired locally stored values cannot bypass the
  // signed backend verification to reveal the workspace.
  await unsigned.close();
  const expired=await contextWithNoExternalNetwork(()=>{
    if(window!==window.top)return; // Sandboxed child frames cannot use sessionStorage.
    sessionStorage.setItem("rms_teacher_session_token_v1","local.invalid");
    sessionStorage.setItem("rms_teacher_session_expires_v1",
      "2000-01-01T00:00:00.000Z");
  });
  const expiredPage=await expired.newPage();
  expiredPage.on("pageerror",err=>failures.push("expired: "+err.message));
  await expiredPage.goto(base+"/admin-workspace.html#visualGuidanceEditor",
    {waitUntil:"domcontentloaded"});
  await waitForTeacherGate(expiredPage);
  await expired.close();

  // Even a plausible unexpired local token has no authority: an external
  // verification call is blocked and the workspace fails closed.
  const unverified=await contextWithNoExternalNetwork(()=>{
    if(window!==window.top)return; // Only prime the top-level teacher session.
    sessionStorage.setItem("rms_teacher_session_token_v1","local.invalid");
    sessionStorage.setItem("rms_teacher_session_expires_v1",
      "2099-01-01T00:00:00.000Z");
  });
  const unverifiedPage=await unverified.newPage();
  unverifiedPage.on("pageerror",err=>failures.push("unverified: "+err.message));
  await unverifiedPage.goto(base+"/admin-workspace.html#visualGuidanceEditor",
    {waitUntil:"domcontentloaded"});
  await waitForTeacherGate(unverifiedPage);
  assert.equal(await unverifiedPage.locator("#adminWorkspace").count(),0);
  await unverified.close();

  assert.deepEqual(failures,[],"The signed-out release gate should not throw browser errors");
  console.log("PASS: signed-out, expired and unverified sessions cannot open Admin Workspace");
} finally{
  await browser.close();
}
