import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,readFile} from "node:fs/promises";

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
  // Keyboard focus also establishes a block selection. Caret navigation must
  // not require the teacher to use a mouse.
  await content.evaluate(element=>{
    element.focus();
    const node=element.querySelector(":scope > p")?.firstChild;
    if(!node)return;
    const selection=window.getSelection(),range=document.createRange();
    range.setStart(node,0);range.collapse(true);
    selection.removeAllRanges();selection.addRange(range);
    element.dispatchEvent(new KeyboardEvent("keyup",{key:"ArrowDown",bubbles:true}));
  });
  assert.equal(await page.locator("#visualAddParagraph").isEnabled(),true);
  assert.match(await page.locator("#visualBlockStatus").textContent(),/Selected learn block/);
  await page.locator("#contentBrowserList button").nth(1).click();
  assert.equal(await page.locator("#visualAddParagraph").isDisabled(),true,
    "Block actions must reset when changing to a different stage");
  await page.locator("#visualGuidanceRecord").waitFor();
  assert.match(await page.locator("#visualGuidanceRecord").textContent(),/Stage 2/);
  assert.notEqual(await page.locator("#contentTitle").inputValue(),"New visual draft title");
  assert.equal((await page.locator('[data-visual-field="title"]').textContent()).trim(),
    await page.locator("#contentTitle").inputValue());
  // The curriculum activity author is proposal-only. Exercise visible
  // wording edits, field-key preservation, validation and safe JSON export.
  const activityBaseline=await page.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages));
  assert.equal(await page.locator("#activityStage option").count(),18);
  assert.equal(await page.locator("#activityExport").isDisabled(),true);
  await page.locator('[data-activity-path="s.0.f.0.label"]').click();
  assert.match(await page.locator("#activitySelectedLabel").textContent(),/interest1 label/);
  const revisedLabel="Three science areas I would like to explore further";
  await page.locator("#activityEditText").fill(revisedLabel);
  assert.equal(await page.locator('[data-activity-path="s.0.f.0.label"]').textContent(),revisedLabel);
  assert.equal(await page.locator("#activityExport").isEnabled(),true);
  await page.locator('[data-activity-path="c.0"]').click();
  await page.locator("#activityEditText").fill("I explored several possible research directions before choosing one.");
  await page.locator("#activityStage").selectOption("2");
  assert.match(await page.locator("#activityStageHeading").textContent(),/Stage 2/);
  assert.equal(await page.locator("#activityInspector").isHidden(),true);
  await page.locator('[data-activity-path="s.0.desc"]').click();
  await page.locator("#activityEditText").fill("Describe the scope of the possible investigation.");
  await page.locator("#activityStage").selectOption("1");
  assert.equal(await page.locator('[data-activity-path="s.0.f.0.label"]').textContent(),revisedLabel);
  await page.locator("#activityStage").selectOption("2");
  await page.locator('[data-activity-path="s.0.desc"]').click();
  await page.locator("#activityEditText").fill("<img src=x onerror=alert(1)>");
  assert.equal(await page.locator("#activityExport").isDisabled(),true,
    "Unsafe markup must prevent activity-proposal export");
  await page.locator("#activityRevertField").click();
  assert.equal(await page.locator("#activityExport").isEnabled(),true);
  await page.locator("#activityEditText").fill("Describe the scope of the possible investigation.");
  await page.locator("#activityReview").click();
  assert.match(await page.locator("#activityReviewValidation").textContent(),
    /field types, counts, and choices are excluded/);
  await page.locator("#activityReviewDialog form button").click();

  const pendingActivity=page.waitForEvent("download");
  await page.locator("#activityExport").click();
  const packetDownload=await pendingActivity;
  assert.equal(packetDownload.suggestedFilename(),"rms-activity-wording-review.json");
  const proposal=JSON.parse(await readFile(await packetDownload.path(),"utf8"));
  assert.equal(proposal.schema_version,"rms-activity-wording-proposal-v1");
  assert.equal(proposal.source_file,"assets/curriculum.js");
  assert.match(proposal.source_sha256,/^[a-f0-9]{64}$/);
  assert.equal(proposal.live_publication,false);
  assert.equal(proposal.review_required,true);
  assert.equal(proposal.edits.length,3);
  assert(proposal.edits.some(e=>e.stage_id===1&&e.path==="s.0.f.0.label"&&e.value===revisedLabel));
  assert(proposal.edits.some(e=>e.stage_id===1&&e.path==="c.0"));
  assert(proposal.edits.some(e=>e.stage_id===2&&e.path==="s.0.desc"));
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages)),
    activityBaseline,"The editor must never mutate the student curriculum module");
  const currentStageId=await page.evaluate(()=>window.RMSCurriculum.stages[0].sections[0].fields[0][0]);
  assert.equal(currentStageId,"interest1","Stable student data keys must remain intact");
  const savedReviewBytes=await readFile(await packetDownload.path());
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#adminWorkspace:not([hidden])").waitFor();
  await page.locator('[data-admin-panel="content-studio"]').click();
  await page.locator('[data-activity-path="s.0.f.0.label"]').waitFor();
  assert.equal(await page.locator("#activityReviewCount").textContent(),"0 proposed changes",
    "Activity drafts must be explicitly exported before leaving the current session");
  const mismatched={...proposal,source_sha256:"0".repeat(64)};
  await page.locator("#activityImport").setInputFiles({
    name:"wrong-curriculum.json",
    mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(mismatched))
  });
  await page.waitForFunction(()=>/different curriculum version/.test(
    document.getElementById("activityStatus")?.textContent||""));
  assert.equal(await page.locator("#activityReviewCount").textContent(),"0 proposed changes");
  const altered={...proposal,edits:[...proposal.edits,{
    stage_id:1,path:"s.0.f.999.label",original:"",value:"Unsafe inserted field"
  }]};
  await page.locator("#activityImport").setInputFiles({
    name:"altered-structure.json",
    mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(altered))
  });
  await page.waitForFunction(()=>/protected structure/.test(
    document.getElementById("activityStatus")?.textContent||""));
  assert.equal(await page.locator("#activityReviewCount").textContent(),"0 proposed changes");
  await page.locator("#activityImport").setInputFiles({
    name:"saved-review.json",
    mimeType:"application/json",
    buffer:savedReviewBytes
  });
  await page.waitForFunction(()=>/Restored 3 wording proposals/.test(
    document.getElementById("activityStatus")?.textContent||""));
  assert.equal(await page.locator("#activityReviewCount").textContent(),"3 proposed changes");
  assert.equal(await page.locator('[data-activity-path="s.0.f.0.label"]').textContent(),revisedLabel);
  await page.locator("#activityStage").selectOption("2");
  assert.equal(await page.locator('[data-activity-path="s.0.desc"]').textContent(),
    "Describe the scope of the possible investigation.");
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages)),activityBaseline);
  await page.locator("#activityStage").selectOption("6");
  assert.match(await page.locator("#activityPreview").textContent(),/separate interactive activity/i);
  assert(await page.locator('[data-activity-path^="c."]').count()>0);
  await page.locator("#activityStage").selectOption("1");
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#activityReset").click();
  assert.equal(await page.locator('[data-activity-path="s.0.f.0.label"]').textContent(),
    "Three science or research areas I enjoy");
  assert.equal(await page.locator("#activityReviewCount").textContent(),"1 proposed changes");
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-activity-wording-preview.png",fullPage:true});

  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-visual-guidance-desktop.png",fullPage:true});
  assert.deepEqual(errors,[],"Admin visual guidance should not produce runtime errors");
  console.log("PASS: admin mount, 18 stages, direct editing, source sync, safe paste and navigation");
}finally{
  await browser.close();
}