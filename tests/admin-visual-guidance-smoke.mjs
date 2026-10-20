import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";

const origin=process.env.ADMIN_TEST_URL||"http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:920}});
const page=await context.newPage();
const errors=[];
page.on("pageerror",error=>errors.push(error.message));
await mkdir("/tmp/visual-guidance-artifacts",{recursive:true});

try {
  // Bypass remote authentication only within this test browser. This
  // replaces the network response, never repository production code.
  await page.route("**/assets/teacher-session.js",route=>route.fulfill({
    status:200,contentType:"application/javascript",
    body:"window.RMSTeacherSession={verify:async()=>true,isActive:()=>true,leave:()=>{}};"
  }));
  await page.goto(origin+"/admin-workspace.html",{waitUntil:"domcontentloaded"});
  await page.locator("#adminWorkspace:not([hidden])").waitFor();
  await page.locator('[data-admin-panel="content-studio"]').click();
  await page.locator("#visualGuidanceEditor [data-visual-field=title]").waitFor();

  assert.equal(await page.locator("#contentBrowserList button").count(),18);
  assert.equal(await page.locator("#visualGuidanceEditor [data-visual-field]").count(),6);
  const originalTitle=await page.locator("#contentTitle").inputValue();
  assert(originalTitle.trim(),"Stage title should be present");

  const visualTitle=page.locator('[data-visual-field="title"]');
  await visualTitle.fill("New visual draft title");
  assert.equal(await page.locator("#contentTitle").inputValue(),"New visual draft title");
  assert.match(await page.locator("#contentStudioStatus").textContent(),/draft updated/);
  assert.equal(await page.locator("#contentDraftState").textContent()!=="Matches bundled seed",true);

  const sourcePurpose=page.locator("#contentPurpose");
  await sourcePurpose.fill("Updated purpose from source controls");
  assert.equal((await page.locator('[data-visual-field="purpose"]').textContent()).trim(),
    "Updated purpose from source controls");

  const rich=page.locator('[data-visual-field="example_html"]');
  await rich.click();
  await rich.evaluate(element=>{
    const dt=new DataTransfer();
    dt.setData("text/html",'<img src="x" onerror="alert(1)">');
    dt.setData("text/plain","Pasted as plain text");
    element.dispatchEvent(new ClipboardEvent("paste",{
      bubbles:true,cancelable:true,clipboardData:dt
    }));
  });
  assert.equal(await page.locator("#visualGuidanceEditor img").count(),0);
  assert((await page.locator("#contentExampleHtml").inputValue()).includes("Pasted as plain text"));

  await page.locator("#contentBrowserList button").nth(1).click();
  await page.locator("#visualGuidanceRecord").waitFor();
  assert.match(await page.locator("#visualGuidanceRecord").textContent(),/Stage 2/);
  assert.notEqual(await page.locator("#contentTitle").inputValue(),"New visual draft title");
  assert.equal((await page.locator('[data-visual-field="title"]').textContent()).trim(),
    await page.locator("#contentTitle").inputValue());
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-visual-guidance-desktop.png",fullPage:true});
  assert.deepEqual(errors,[],"Admin visual guidance should not produce runtime errors");
  console.log("PASS: admin mount, 18 stages, direct editing, source sync, safe paste and navigation");
}finally{
  await browser.close();
}