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

  // A formatting click must preserve the selection and create only
  // markup permitted by the existing six-field guidance validator.
  await page.locator('[data-visual-field="learn_html"]').evaluate(element=>{
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    let current=walker.nextNode();
    while(current&&!current.textContent.trim())current=walker.nextNode();
    if(!current)throw new Error("No teaching text to format");
    const start=current.textContent.search(/\S/);
    const range=document.createRange();
    range.setStart(current,start);
    range.setEnd(current,Math.min(current.length,start+Math.min(8,current.length-start)));
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.locator('[data-guidance-format="strong"]').click();
  assert.match(await page.locator("#contentLearnHtml").inputValue(),/<strong>/,
    "Formatting must update the authoritative text field");
  assert.equal(await page.evaluate(()=>{
    const api=window.RMSAdminContentStudio;
    return api.validateValue({
      title:document.querySelector("#contentTitle").value,
      nav:document.querySelector("#contentNav").value,
      purpose:document.querySelector("#contentPurpose").value,
      learn_html:document.querySelector("#contentLearnHtml").value,
      example_html:document.querySelector("#contentExampleHtml").value,
      warning_html:document.querySelector("#contentWarningHtml").value
    }).ok;
  }),true,"Formatting must remain valid under the production content schema");

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

  // The block inspector uses the existing guidance draft schema.
  // Adding and moving blocks must update the authoritative source field
  // without retaining any visual-editor selection attributes.
  const content=page.locator('[data-visual-field="learn_html"]');
  await content.locator(":scope > p").first().click();
  assert.equal(await page.locator("#visualAddParagraph").isEnabled(),true);
  assert.equal(await page.locator("#visualAddListItem").isDisabled(),true);
  await page.locator("#visualBlockText").fill("A new structured paragraph for testing.");
  await page.locator("#visualAddParagraph").click();
  const newParagraph=content.locator(":scope > p")
    .filter({hasText:"A new structured paragraph for testing."});
  assert.equal(await newParagraph.count(),1);
  assert.match(await page.locator("#contentLearnHtml").inputValue(),
    /A new structured paragraph for testing/);
  assert.equal(await page.locator("#visualMoveBlockUp").isEnabled(),true);
  await page.locator("#visualMoveBlockUp").click();
  assert.equal(await page.locator("#visualMoveBlockDown").isEnabled(),true);
  const selectedText=await content.locator(":scope > [data-visual-selected]").textContent();
  assert.match(selectedText,/A new structured paragraph for testing/);

  await page.locator("#visualBlockText").fill("First new list item");
  await page.locator("#visualAddList").click();
  assert.equal(await content.locator(":scope > ul")
    .filter({hasText:"First new list item"}).count(),1);
  assert.equal(await page.locator("#visualAddListItem").isEnabled(),true);
  await page.locator("#visualBlockText").fill("Second new list item");
  await page.locator("#visualAddListItem").click();
  assert.equal(await content.locator(":scope > ul[data-visual-selected] > li").count(),2);
  assert(!((await page.locator("#contentLearnHtml").inputValue())
    .includes("data-visual-selected")), "Selection highlights must never enter the saved content");
  await page.locator("#visualRemoveBlock").click();
  assert(!((await page.locator("#contentLearnHtml").inputValue())
    .includes("First new list item")), "Removing a list must update the draft");
  assert.match(await page.locator("#contentLearnHtml").inputValue(),
    /A new structured paragraph for testing/);
  assert.equal(await page.evaluate(()=>{
    const fields=["title","nav","purpose","learn_html","example_html","warning_html"];
    const ids=["contentTitle","contentNav","contentPurpose","contentLearnHtml",
      "contentExampleHtml","contentWarningHtml"];
    return window.RMSAdminContentStudio.validateValue(Object.fromEntries(
      fields.map((key,i)=>[key,document.getElementById(ids[i]).value])
    )).ok;
  }),true,"After structural operations the unchanged production schema must still validate");
  await content.locator(":scope > h3").first().click();
  assert.equal(await page.locator("#visualMoveBlockUp").isDisabled(),true,
    "The first block cannot move above the field boundary");

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