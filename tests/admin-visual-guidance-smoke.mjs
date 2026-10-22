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
    body:"window.RMSTeacherSession={verify:async()=>true,isActive:()=>true,hasStoredSession:()=>true,login:async()=>({ok:true}),leave:()=>{}};"
  }));
  // Public GitHub Pages editor.html must use the existing sign-in entry,
  // then retain the allowlisted Content Studio area after authentication.
  await page.goto(origin+"/editor.html",{waitUntil:"domcontentloaded"});
  await page.locator("#adminWorkspace:not([hidden])").waitFor();
  await page.locator("#contentStudioPanel:not([hidden])").waitFor();
  assert.equal(new URL(page.url()).hash,"#visualGuidanceEditor");
  await page.locator("#visualGuidanceEditor [data-visual-field=title]").waitFor();

  // Cross-site editors should be discoverable in Content Studio while
  // remaining independent of this authenticated Admin session.
  const crossEditorDisclosure=page.locator('.cross-site-editor-switcher');
  assert.equal(await crossEditorDisclosure.isVisible(),true);
  await crossEditorDisclosure.locator('summary').click();
  const externalEditorLinks=await crossEditorDisclosure.locator('nav a').evaluateAll(
    links=>links.map(link=>({
      pathname:new URL(link.href).pathname,
      target:link.target,
      noopener:link.rel.split(/\s+/).includes('noopener')
    }))
  );
  assert.deepEqual(externalEditorLinks,[
    {pathname:'/editor.html',target:'_blank',noopener:true},
    {pathname:'/memory-palace-u1-8/editor.html',target:'_blank',noopener:true}
  ]);
  const hubLink=crossEditorDisclosure.locator('a[href="../editors.html"]');
  assert.equal(await hubLink.count(),1);
  assert.equal(await hubLink.getAttribute('target'),'_blank');
  assert.match(await hubLink.getAttribute('rel'),/noopener/);
  assert.equal(await hubLink.evaluate(link=>new URL(link.href).pathname),'/editors.html');
  await crossEditorDisclosure.locator('summary').click();
  assert.equal(await page.locator(".content-authoring-nav a").count(),5);
  assert.deepEqual(await page.locator(".content-authoring-nav a").evaluateAll(links=>
    links.map(a=>a.getAttribute("href"))),[
    "#visualGuidanceEditor","#activityAuthoring","#labGuideAuthoring",
    "#studentGuideAuthoring","#contentPublicationHeading"
  ]);
  assert.equal(await page.locator('[data-content-view="guidance"][aria-current="page"]').count(),1);
  assert.equal(await page.locator('#activityAuthoring').isHidden(),true);
  assert.equal(await page.locator('#labGuideAuthoring').isHidden(),true);
  assert.equal(await page.locator('#studentGuideAuthoring').isHidden(),true);
  assert.equal(await page.locator('.publication-card').isHidden(),true);
  // Keyboard-only browsing must permit arrow/Home/End movement across area
  // links without unexpectedly changing the currently visible workspace.
  const navGuidance=page.locator('[data-content-view="guidance"]');
  await navGuidance.focus();
  await navGuidance.press("ArrowRight");
  assert.equal(await page.locator('[data-content-view="activities"]').evaluate(
    node=>document.activeElement===node),true);
  assert.equal(await page.locator('#activityAuthoring').isHidden(),true);
  await page.keyboard.press("End");
  assert.equal(await page.locator('[data-content-view="publication"]').evaluate(
    node=>document.activeElement===node),true);
  await page.keyboard.press("Home");
  assert.equal(await navGuidance.evaluate(node=>document.activeElement===node),true);
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator('[data-content-view="publication"]').evaluate(
    node=>document.activeElement===node),true);
  assert.equal(await page.locator('#contentAuthoringNav').getAttribute('aria-describedby'),
    'contentAuthoringNavHelp');
  await navGuidance.focus();
  assert.equal(await page.locator('#contentBrowserList button').count(),18);
  assert.equal(await page.locator("#visualGuidanceEditor [data-visual-field]").count(),6);
  const originalTitle=await page.locator("#contentTitle").inputValue();
  assert(originalTitle.trim(),"Stage title should be present");

  const visualTitle=page.locator('[data-visual-field="title"]');
  await visualTitle.fill("New visual draft title");
  assert.equal(await page.locator("#contentTitle").inputValue(),"New visual draft title");
  assert.match(await page.locator("#contentStudioStatus").textContent(),/draft updated/);
  assert.equal(await page.locator("#contentDraftState").textContent()!=="Matches bundled seed",true);
  await page.waitForFunction(()=>/changed draft/.test(
    document.getElementById("guidanceEditorCount")?.textContent||""));
  assert.match(await page.locator("#contentViewStatus").textContent(),/changed draft/);

  await page.locator("#contentSourceFallback summary").click();
  assert.equal(await page.locator("#contentSourceFallback").getAttribute("open"),"");
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
  const quick=page.locator("#visualGuidanceQuickToolbar");
  await quick.waitFor({state:"visible"});
  assert.equal(await quick.getAttribute("role"),"toolbar");
  assert.equal(await quick.getAttribute("aria-label"),"Selected guidance block actions");
  assert.equal(await quick.getByRole("button",{name:"Move selected guidance block up"}).isDisabled(),false,
    "First paragraph must be able to move above the heading when selected");
  assert.equal(await quick.getByRole("button",{name:"Duplicate selected guidance block"}).isEnabled(),true);
  await quick.getByRole("button",{name:"Enter text for a new paragraph next to the selected block"}).click();
  let composer=page.getByRole("dialog",{name:"Add guidance block here"});
  await composer.waitFor({state:"visible"});
  assert.equal(await composer.getByLabel("Block type").evaluate(
    el=>document.activeElement===el),true,
    "In-place Add must focus its native block-type chooser");
  assert.equal(await composer.getByLabel("Block type").inputValue(),"paragraph");
  assert.equal(await composer.getByRole("option").count(),3);
  assert.equal(await page.locator("#visualAddParagraph").isEnabled(),true);
  assert.equal(await page.locator("#visualAddListItem").isDisabled(),true);
  // A cancelled addition leaves the stage's original HTML untouched.
  const beforeCancel=await page.locator("#contentLearnHtml").inputValue();
  await composer.getByLabel("Block text").fill("Discard this temporary writing.");
  await composer.getByLabel("Block text").press("Escape");
  assert.equal(await composer.count(),0);
  assert.equal(await page.locator("#contentLearnHtml").inputValue(),beforeCancel);
  await quick.getByRole("button",{name:"Enter text for a new paragraph next to the selected block"}).click();
  composer=page.getByRole("dialog",{name:"Add guidance block here"});
  await composer.getByRole("button",{name:"Add block"}).click();
  assert.match(await composer.getByRole("status").textContent(),/Write some text/);
  await composer.getByLabel("Block text").fill("A new structured paragraph for testing.");
  await composer.getByRole("button",{name:"Add block"}).click();
  assert.equal(await composer.count(),0);
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
  assert.equal(await page.locator("#visualDuplicateBlock").isEnabled(),true);
  await content.locator(":scope > [data-visual-selected]").click();
  await quick.waitFor({state:"visible"});
  await quick.getByRole("button",{name:"Duplicate selected guidance block"}).click();
  assert.equal(await newParagraph.count(),2,
    "Duplicating a paragraph should preserve the existing content and create a separate block");
  assert.equal(((await page.locator("#contentLearnHtml").inputValue())
    .match(/A new structured paragraph for testing/g)||[]).length,2,
    "The authoritative Content Studio field must receive both copies");
  assert(!((await page.locator("#contentLearnHtml").inputValue())
    .includes("data-visual-selected")),"The duplicated copy cannot retain inspector selection markers");
  assert(!((await page.locator("#contentLearnHtml").inputValue())
    .includes("visualGuidanceQuickToolbar")),
    "Floating quick actions must never be included in the authoritative source HTML");
  // Duplicate automatically selects the newly created copy. Remove that
  // copy directly without a redundant click that can hit another block.
  assert.match(await content.locator(":scope > [data-visual-selected]").textContent(),
    /A new structured paragraph for testing/);
  await quick.waitFor({state:"visible"});
  await quick.getByRole("button",{name:"Remove selected guidance block"}).click();
  assert.equal(await newParagraph.count(),1,
    "Remove should delete the selected duplicate while keeping the original. Status: "+
      await page.locator("#visualBlockStatus").textContent()+
      "; selected count: "+await content.locator(":scope > [data-visual-selected]").count());

  // Drag a newly inserted block past its visible neighbour. Both are short,
  // adjacent pieces of content, so the target remains in the viewport.
  await newParagraph.click();
  await page.locator("#visualBlockText").fill("Another paragraph to reposition.");
  await page.locator("#visualAddParagraph").click();
  const dragged=content.locator(":scope > p")
    .filter({hasText:"Another paragraph to reposition."});
  const targetParagraph=content.locator(":scope > p")
    .filter({hasText:"A new structured paragraph for testing."});
  await targetParagraph.scrollIntoViewIfNeeded();
  await dragged.click();
  const grip=page.locator("#visualGuidanceMoveHandle");
  await grip.waitFor({state:"visible"});
  const firstBox=await targetParagraph.boundingBox();
  const gripBox=await grip.boundingBox();
  assert(firstBox&&gripBox,"The selected block must have a visible drag handle");
  await page.mouse.move(gripBox.x+gripBox.width/2,gripBox.y+gripBox.height/2);
  await page.mouse.down();
  await page.mouse.move(firstBox.x+Math.max(25,firstBox.width/4),firstBox.y+5,{steps:7});
  await page.mouse.up();
  const paragraphs=await content.locator(":scope > p").allTextContents();
  assert(paragraphs.indexOf("Another paragraph to reposition.")<
    paragraphs.indexOf("A new structured paragraph for testing."),
    "Dragging above the neighbour must reorder its top-level content blocks");
  const authoritative=await page.locator("#contentLearnHtml").inputValue();
  assert(authoritative.indexOf("Another paragraph to reposition.")>=0,
    "Moved text must remain in the authoritative guidance field");
  assert(!authoritative.includes("data-visual-drop-target")&&
    !authoritative.includes("visualGuidanceMoveHandle"),
    "Drag overlays must never enter the stage content HTML");

  // Insert a heading directly from the on-page composer using the same
  // validator as the long-form block controls.
  await content.locator(":scope > [data-visual-selected]").click();
  await quick.getByRole("button",{name:"Enter text for a new paragraph next to the selected block"}).click();
  composer=page.getByRole("dialog",{name:"Add guidance block here"});
  await composer.getByLabel("Block type").selectOption("heading");
  await composer.getByLabel("Block text").fill("New guidance subsection");
  await composer.getByLabel("Block text").press("Control+Enter");
  assert.equal(await composer.count(),0);
  assert.equal(await content.locator(":scope > h3")
    .filter({hasText:"New guidance subsection"}).count(),1,
    "Section headings should be created inside the selected guidance field");
  assert.match(await page.locator("#contentLearnHtml").inputValue(),
    /<h3>New guidance subsection<\/h3>/,
    "New headings must synchronize with the existing schema-validated draft");
  await page.locator("#visualRemoveBlock").click();
  assert.equal((await page.locator("#contentLearnHtml").inputValue())
    .includes("New guidance subsection"),false,
    "Removing the selected heading must restore the prior content");

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
  assert.equal(await page.locator("#visualDuplicateBlock").isDisabled(),true,
    "A block from a previous stage cannot be duplicated after changing stages");
  assert.equal(await quick.count(),0,
    "The in-page actions must be removed when a different stage is selected");
  await page.locator("#visualGuidanceRecord").waitFor();
  assert.match(await page.locator("#visualGuidanceRecord").textContent(),/Stage 2/);
  assert.notEqual(await page.locator("#contentTitle").inputValue(),"New visual draft title");
  assert.equal((await page.locator('[data-visual-field="title"]').textContent()).trim(),
    await page.locator("#contentTitle").inputValue());
  // The curriculum activity author is proposal-only. Exercise visible
  // wording edits, field-key preservation, validation and safe JSON export.
  // Switching workspaces must preserve the stage-guidance draft in memory
  // and show only the selected editing area.
  await page.locator('[data-content-view="activities"]').click();
  assert.equal(await page.locator('#activityAuthoring').isVisible(),true);
  assert.equal(await page.locator('#visualGuidanceEditor').isHidden(),true);
  assert.equal(await page.locator('#contentBrowserList').isHidden(),true);
  assert.equal(await page.locator('[data-content-view="activities"][aria-current="page"]').count(),1);
  assert.match(await page.locator('#contentViewHeading').textContent(),/Research activities/);
  await page.locator('[data-content-view="guidance"]').click();
  assert.equal(await page.locator("#contentTitle").inputValue(),await page.locator('[data-visual-field="title"]').textContent());
  const activityLink=page.locator('[data-content-view="activities"]');
  await activityLink.focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator('#contentViewHeading').evaluate(
    node=>document.activeElement===node),true,
  'Enter should focus the newly opened workspace heading for screen readers');
  assert.equal(await page.locator('#activityAuthoring').isVisible(),true);
  const activityBaseline=await page.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages));
  // Navigate editable sections using the visible text sequence, without
  // changing stage IDs, form definitions, or unsaved content.
  await page.locator(
    '#activityPreview [data-activity-path="s.0.title"] + .inline-quick-edit'
  ).click();
  assert.match(await page.locator('#activityPreview .inline-review-position').textContent(),
    /^Wording 1 of /);
  assert.equal(await page.locator('#activityPreview .inline-review-prev').isDisabled(),true);
  assert.equal(await page.locator('#activityPreview .inline-review-next').isEnabled(),true);
  await page.locator('#activityPreview .inline-review-next').click();
  assert.equal(await page.locator('#activityPreview .inline-review-box')
    .getAttribute('data-inline-editing'),'s.0.desc');
  await page.locator('#activityPreview .inline-review-target-select')
    .selectOption('s.0.title');
  assert.equal(await page.locator('#activityPreview .inline-review-box')
    .getAttribute('data-inline-editing'),'s.0.title');
  await page.locator('#activityPreview .inline-review-input')
    .fill('Research areas to consider before choosing a project');
  assert.match(await page.locator('#activityPreview .inline-review-next').textContent(),
    /Save and next/);
  await page.locator('#activityPreview .inline-review-next').click();
  assert.equal(await page.locator('#activityPreview .inline-review-box')
    .getAttribute('data-inline-editing'),'s.0.desc');
  assert.equal(await page.locator('#activityReviewCount').textContent(),'1 proposed change');
  const longPassage='First paragraph introduces a question and its context.\n\n'+
    'Second paragraph examines how a student might find relevant evidence.\n\n'+
    'Third paragraph asks what would support a careful explanation.';
  await page.locator('#activityPreview .inline-review-input').fill(longPassage);
  assert.equal(await page.locator('#activityPreview .inline-review-parts').isVisible(),true);
  assert.equal(await page.locator('#activityPreview .inline-review-part-select option').count(),3);
  await page.locator('#activityPreview .inline-review-part-select').selectOption('1');
  const selectedPart=await page.locator('#activityPreview .inline-review-input')
    .evaluate(field=>field.value.slice(field.selectionStart,field.selectionEnd).trim());
  assert.equal(selectedPart,
    'Second paragraph examines how a student might find relevant evidence.');
  assert.equal(await page.locator('#activityPreview .inline-review-input').inputValue(),longPassage,
    'Selecting a paragraph must not modify its source text');
  await page.locator('#activityPreview .inline-review-input').fill('<unsafe>');
  assert.equal(await page.locator('#activityPreview .inline-review-next').isDisabled(),true);
  await page.locator('#activityPreview .inline-review-target-select')
    .selectOption('s.0.title');
  assert.equal(await page.locator('#activityPreview .inline-review-target-select').inputValue(),
    's.0.desc','Invalid text must block moving to another wording item');
  await page.locator('#activityPreview .inline-review-input').press('Escape');
  assert.equal(await page.locator('#activityReviewCount').textContent(),'1 proposed change');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#activityReset').click();
  assert.equal(await page.locator('#activityReviewCount').textContent(),'0 proposed changes');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSCurriculum.stages)),activityBaseline);
  // Direct editing is the default in each review-only workspace; clicking
  // displayed text opens its editor without using the pencil.
  assert.equal(await page.locator("#reviewEditingPreference").isVisible(),true);
  assert.equal(await page.locator("#reviewEditingMode").inputValue(),"direct");
  await page.locator('[data-activity-path="s.0.title"]').click();
  assert.equal(await page.locator('#activityPreview .inline-review-input').isVisible(),true);
  assert.equal(await page.locator('#activityInspector').isHidden(),true);
  await page.locator('#activityPreview .inline-review-input')
    .fill('An activity title edited directly in context');
  await page.locator('#activityPreview .inline-review-inspect').click();
  assert.equal(await page.locator('#activityPreview .inline-review-input').count(),0);
  assert.equal(await page.locator('#activityEditText').inputValue(),
    'An activity title edited directly in context');
  assert.equal(await page.locator('#activityInspector').isVisible(),true);
  assert.equal(await page.locator('#activityReviewCount').textContent(),'1 proposed change');
  await page.locator('#activityRevertField').click();
  assert.equal(await page.locator('#activityReviewCount').textContent(),'0 proposed changes');
  await page.locator('[data-activity-path="s.0.title"]').click();
  await page.locator('#activityPreview .inline-review-input').press("Escape");
  assert.equal(await page.locator('#activityPreview .inline-review-box').count(),0);
  await page.locator('#reviewEditingMode').selectOption("inspector");
  assert.equal(await page.locator("#reviewEditingMode").inputValue(),"inspector");
  await page.locator('[data-activity-path="s.0.f.0.label"]').click();
  assert.equal(await page.locator('#activityInspector').isVisible(),true);
  assert.equal(await page.locator('#activityPreview .inline-review-input').count(),0);
  // One-click pencil edits in the visible student activity, with inline
  // validation, inspector synchronisation, and an explicit cancel path.
  const activityQuick=page.locator(
    '#activityPreview [data-activity-path="s.0.title"] + .inline-quick-edit');
  await activityQuick.click();
  assert.equal(await page.locator('#activityPreview .inline-review-input').isVisible(),true);
  assert.equal(await page.locator('#activityPreview [data-activity-path="s.0.title"]').isHidden(),true);
  const inlineField=page.locator('#activityPreview .inline-review-input');
  const inlineSemantics=await inlineField.evaluate(field=>({
    labelled:!!document.querySelector('label[for="'+field.id+'"]'),
    describedBy:(field.getAttribute('aria-describedby')||'').split(/\s+/).every(
      id=>!!document.getElementById(id)),
    group:field.closest('[role="group"]')?.getAttribute('aria-labelledby')
  }));
  assert.equal(inlineSemantics.labelled,true);
  assert.equal(inlineSemantics.describedBy,true);
  assert.equal(inlineSemantics.group,'inlineEditorActivityLabel');
  await inlineField.fill('<img src=x onerror=alert(1)>');
  assert.equal(await inlineField.getAttribute('aria-invalid'),'true');
  assert.equal(await page.locator('#activityPreview .inline-review-save').isDisabled(),true);
  await page.locator('#activityPreview .inline-review-input').fill('Updated interest inventory heading');
  assert.equal(await page.locator('#activityPreview .inline-review-save').isEnabled(),true);
  assert.equal(await inlineField.getAttribute('aria-invalid'),null);
  // Tab should reach the Save control with a meaningful name, then
  // Shift+Tab should return to the textbox without losing its draft.
  await inlineField.focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#activityPreview .inline-review-save').evaluate(
    node=>document.activeElement===node),true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await inlineField.evaluate(node=>document.activeElement===node),true);
  await page.locator('#activityPreview .inline-review-save').click();
  assert.equal(await page.locator('[data-activity-path="s.0.title"]').textContent(),
    'Updated interest inventory heading');
  assert.equal(await page.locator('#activityReviewCount').textContent(),'1 proposed change');
  assert.equal(await page.locator('#activityEditText').inputValue(),
    'Updated interest inventory heading');
  await activityQuick.click();
  await page.locator('#activityPreview .inline-review-input').fill('Discard this unsaved change');
  await page.locator('#activityPreview .inline-review-input').press('Escape');
  assert.equal(await page.locator('#activityPreview .inline-review-box').count(),0);
  assert.equal(await page.locator('[data-activity-path="s.0.title"]').textContent(),
    'Updated interest inventory heading');
  await page.locator('[data-activity-path="s.0.title"]').click();
  await page.locator('#activityRevertField').click();
  assert.equal(await page.locator('#activityReviewCount').textContent(),'0 proposed changes');

  // A cancelled stage switch retains the exact uncommitted text and option.
  await activityQuick.click();
  await page.locator('#activityPreview .inline-review-input')
    .fill('Unfinished activity introduction');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#activityStage').selectOption('2');
  assert.equal(await page.locator('#activityStage').inputValue(),'1');
  assert.equal(await page.locator('#activityPreview .inline-review-input').inputValue(),
    'Unfinished activity introduction');
  assert.equal(await page.locator('#activityReviewCount').textContent(),'0 proposed changes');
  // Switching workspaces is protected by the same guard.
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('[data-admin-panel="settings"]').click();
  assert.equal(await page.locator('#contentStudioPanel').isVisible(),true,
    'Declining to discard a pending edit must block leaving Content Studio');
  assert.equal(await page.locator('#activityPreview .inline-review-input').inputValue(),
    'Unfinished activity introduction');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('[data-content-view="laboratories"]').click();
  assert.equal(await page.locator('#activityAuthoring').isVisible(),true);
  assert.equal(await page.locator('#labGuideAuthoring').isHidden(),true);
  assert.equal(await page.locator('#activityPreview .inline-review-input').inputValue(),
    'Unfinished activity introduction');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('[data-content-view="laboratories"]').click();
  assert.equal(await page.locator('#labGuideAuthoring').isVisible(),true);
  assert.equal(await page.locator('#activityPreview .inline-review-box').count(),0);
  await page.locator('[data-content-view="activities"]').click();

  // Review must not ignore text that is still waiting in the inline editor.
  await activityQuick.click();
  await page.locator('#activityPreview .inline-review-input')
    .fill('Draft pending review that has not been saved');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#activityReview').click();
  assert.equal(await page.locator('#activityReviewDialog').isHidden(),true);
  assert.equal(await page.locator('#activityPreview .inline-review-input').inputValue(),
    'Draft pending review that has not been saved');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#activityReview').click();
  assert.equal(await page.locator('#activityPreview .inline-review-box').count(),0);
  await page.locator('#activityReviewDialog form button').click();

  assert.equal(await page.locator("#activityStage option").count(),18);
  assert.equal(await page.locator("#activityExport").isDisabled(),true);
  await page.locator('[data-activity-path="s.0.f.0.label"]').click();
  assert.match(await page.locator("#activitySelectedLabel").textContent(),/interest1 label/);
  const revisedLabel="Three science areas I would like to explore further";
  await page.locator("#activityEditText").fill(revisedLabel);
  assert.equal(await page.locator('[data-activity-path="s.0.f.0.label"]').textContent(),revisedLabel);
  assert.equal(await page.locator('[data-activity-path="s.0.f.0.label"]').getAttribute('data-proposed'),
    'true',"Edited activity fields need a clearly visible proposed state");
  assert.match(await page.locator('[data-activity-path="s.0.f.0.label"]').getAttribute('aria-label'),
    /Proposed change/);
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
  await page.locator('[data-content-view="activities"]').click();
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
  await page.waitForFunction(()=>document.getElementById("activityEditorCount")
    ?.textContent==="3 proposed changes");
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
  assert.equal(await page.locator("#activityReviewCount").textContent(),"1 proposed change");
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-activity-wording-preview.png",fullPage:true});

  // Specialised laboratory instruction authoring stays separate from the
  // four interactive student tools and their saved project structure.
  await page.locator('[data-content-view="laboratories"]').click();
  assert.equal(await page.locator('#labGuideAuthoring').isVisible(),true);
  assert.equal(await page.locator('#activityAuthoring').isHidden(),true);
  assert.match(await page.locator("#activityEditorCount").textContent(),/proposed changes?/);
  const labBaseline=await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance));
  await page.locator(
    '[data-lab-guide-path="labs.literature.search.title"] + .inline-quick-edit'
  ).click();
  assert.equal(await page.locator('#labGuidePreview .inline-review-position').textContent(),
    'Wording 1 of 2');
  await page.locator('#labGuidePreview .inline-review-input').press('Alt+ArrowDown');
  assert.equal(await page.locator('#labGuidePreview .inline-review-box')
    .getAttribute('data-inline-editing'),'labs.literature.search.text',
    'Alt+Down must navigate to the next editable item');
  await page.locator('#labGuidePreview .inline-review-input').press('Alt+ArrowUp');
  assert.equal(await page.locator('#labGuidePreview .inline-review-box')
    .getAttribute('data-inline-editing'),'labs.literature.search.title',
    'Alt+Up must navigate to the previous editable item');
  await page.locator('#labGuidePreview .inline-review-next').click();
  assert.equal(await page.locator('#labGuidePreview .inline-review-box')
    .getAttribute('data-inline-editing'),'labs.literature.search.text');
  await page.locator('#labGuidePreview .inline-review-prev').click();
  assert.equal(await page.locator('#labGuidePreview .inline-review-box')
    .getAttribute('data-inline-editing'),'labs.literature.search.title');
  await page.locator('#labGuidePreview .inline-review-input').press('Escape');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance)),labBaseline);
  assert.equal(await page.locator('#reviewEditingPreference').isVisible(),true);
  await page.locator('#reviewEditingMode').selectOption('direct');
  await page.locator('[data-lab-guide-path="labs.literature.search.title"]').click();
  assert.equal(await page.locator('#labGuidePreview .inline-review-input').isVisible(),true);
  await page.locator('#labGuidePreview .inline-review-input').press('Escape');
  await page.locator('#reviewEditingMode').selectOption('inspector');
  // Empty inspector space should be reclaimed by a full-width preview.
  const gridColumns=()=>page.locator('#labGuideAuthoring .activity-authoring-grid')
    .evaluate(element=>getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length);
  assert.equal(await gridColumns(),1,
    "A laboratory preview with no selected inspector must not keep an empty second column");
  const labQuick=page.locator(
    '[data-lab-guide-path="labs.literature.search.title"] + .inline-quick-edit');
  await labQuick.click();
  assert.equal(await gridColumns(),1,
    "Inline editing should remain full-width while its duplicate inspector is hidden");
  await page.locator('#labGuidePreview .inline-review-input').fill(
    'Search journal articles and document the strategy');
  await page.locator('#labGuidePreview .inline-review-input').press('Control+Enter');
  assert.equal(await page.locator('[data-lab-guide-path="labs.literature.search.title"]').textContent(),
    'Search journal articles and document the strategy');
  assert.equal(await page.locator('#labGuideCount').textContent(),'1 proposed change');
  await page.locator('[data-lab-guide-path="labs.literature.search.title"]').click();
  await page.locator('#labGuideRevert').click();
  assert.equal(await page.locator('#labGuideCount').textContent(),'0 proposed changes');
  await labQuick.click();
  await page.locator('#labGuidePreview .inline-review-input')
    .fill('An unfinished search record heading');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#labGuideLab').selectOption('methods');
  assert.equal(await page.locator('#labGuideLab').inputValue(),'literature');
  assert.equal(await page.locator('#labGuidePreview .inline-review-input').inputValue(),
    'An unfinished search record heading');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#labGuideStep').selectOption('sources');
  assert.equal(await page.locator('#labGuideStep').inputValue(),'sources');
  assert.equal(await page.locator('#labGuidePreview .inline-review-box').count(),0);
  // The rest of the existing test edits the original Search panel.
  await page.locator('#labGuideStep').selectOption('search');

  assert.equal(await page.locator("#labGuideLab option").count(),4);
  assert.equal(await page.evaluate(()=>{
    const labs=window.RMSStudentGuidance.labs;
    return Object.values(labs).reduce((sum,steps)=>sum+Object.keys(steps).length,0);
  }),32);
  assert.equal(await page.locator("#labGuideExport").isDisabled(),true);
  await page.locator('[data-lab-guide-path="labs.literature.search.text"]').click();
  const newSearchText="Record the search database, query, date, filters, and result counts.";
  await page.locator("#labGuideEditText").fill(newSearchText);
  assert.equal(await page.locator('[data-lab-guide-path="labs.literature.search.text"]').textContent(),
    newSearchText);
  assert.equal(await page.locator('[data-lab-guide-path="labs.literature.search.text"]').getAttribute('data-proposed'),
    'true');
  assert.equal(await page.locator("#labGuideExport").isEnabled(),true);
  await page.locator("#labGuideLab").selectOption("methods");
  assert(await page.locator("#labGuideStep option").count()>=9);
  await page.locator("#labGuideStep").selectOption("ethics");
  assert.match(await page.locator("#labGuidePreview").textContent(),/decision keys/i);
  assert.equal(await page.locator("#labGuideInspector").isHidden(),true);
  await page.locator('[data-lab-guide-path="labs.methods.ethics.title"]').click();
  const newEthicsTitle="Ethics and approval · Plan before recruitment";
  await page.locator("#labGuideEditText").fill(newEthicsTitle);
  assert.equal(await page.locator('[data-lab-guide-path="labs.methods.ethics.title"]').textContent(),
    newEthicsTitle);
  await page.locator("#labGuideLab").selectOption("data");
  assert.equal(await page.locator("#labGuideStep option").count(),7);
  await page.locator("#labGuideLab").selectOption("writing");
  assert.equal(await page.locator("#labGuideStep option").count(),8);
  await page.locator("#labGuideLab").selectOption("methods");
  await page.locator("#labGuideStep").selectOption("ethics");
  await page.locator('[data-lab-guide-path="labs.methods.ethics.title"]').click();
  await page.locator("#labGuideEditText").fill("<svg onload=alert(1)>");
  assert.equal(await page.locator("#labGuideExport").isDisabled(),true,
    "Unsupported active markup must block laboratory packet export");
  await page.locator("#labGuideRevert").click();
  assert.equal(await page.locator("#labGuideEditText").inputValue(),
    await page.evaluate(()=>window.RMSStudentGuidance.labs.methods.ethics.title));
  await page.locator("#labGuideEditText").fill(newEthicsTitle);
  assert.equal(await page.locator("#labGuideExport").isEnabled(),true);
  await page.locator("#labGuideReview").click();
  assert.match(await page.locator("#labGuideReviewValidation").textContent(),
    /decision keys remain protected/);
  await page.locator("#labGuideReviewDialog form button").click();

  const labDownloadPromise=page.waitForEvent("download");
  await page.locator("#labGuideExport").click();
  const labDownload=await labDownloadPromise;
  assert.equal(labDownload.suggestedFilename(),"rms-lab-guidance-review.json");
  const labReviewBytes=await readFile(await labDownload.path());
  const labReview=JSON.parse(labReviewBytes.toString("utf8"));
  assert.equal(labReview.schema_version,"rms-lab-guidance-review-v1");
  assert.equal(labReview.source_file,"assets/student-guidance.js");
  assert.equal(labReview.live_publication,false);
  assert.equal(labReview.review_required,true);
  assert.match(labReview.source_sha256,/^[a-f0-9]{64}$/);
  assert.equal(labReview.edits.length,2);
  assert(labReview.edits.some(e=>e.path==="labs.literature.search.text"&&e.value===newSearchText));
  assert(labReview.edits.some(e=>e.path==="labs.methods.ethics.title"&&e.value===newEthicsTitle));
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance)),labBaseline,
    "Editing student lab instructions must not mutate the student guidance module");

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#adminWorkspace:not([hidden])").waitFor();
  await page.locator('[data-admin-panel="content-studio"]').click();
  await page.locator('[data-content-view="laboratories"]').click();
  await page.locator('[data-lab-guide-path="labs.literature.search.text"]').waitFor();
  assert.equal(await page.locator("#labGuideCount").textContent(),"0 proposed changes");
  const badVersion={...labReview,source_sha256:"0".repeat(64)};
  await page.locator("#labGuideImport").setInputFiles({
    name:"invalid-version.json",mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(badVersion))
  });
  await page.waitForFunction(()=>/different Student Guide version/.test(
    document.getElementById("labGuideStatus")?.textContent||""));
  assert.equal(await page.locator("#labGuideCount").textContent(),"0 proposed changes");
  const badPath={...labReview,edits:[...labReview.edits,{
    path:"labs.methods.ethics.decisionKeys",
    original:"",value:"malicious logic change"
  }]};
  await page.locator("#labGuideImport").setInputFiles({
    name:"invalid-field.json",mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(badPath))
  });
  await page.waitForFunction(()=>/unknown or altered instruction/.test(
    document.getElementById("labGuideStatus")?.textContent||""));
  assert.equal(await page.locator("#labGuideCount").textContent(),"0 proposed changes");
  await page.locator("#labGuideImport").setInputFiles({
    name:"lab-guidance-review.json",mimeType:"application/json",buffer:labReviewBytes
  });
  await page.waitForFunction(()=>/Restored 2 laboratory wording proposals/.test(
    document.getElementById("labGuideStatus")?.textContent||""));
  assert.equal(await page.locator("#labGuideCount").textContent(),"2 proposed changes");
  await page.waitForFunction(()=>document.getElementById("labEditorCount")
    ?.textContent==="2 proposed changes");
  assert.equal(await page.locator('[data-lab-guide-path="labs.literature.search.text"]').textContent(),
    newSearchText);
  await page.locator("#labGuideLab").selectOption("methods");
  await page.locator("#labGuideStep").selectOption("ethics");
  assert.equal(await page.locator('[data-lab-guide-path="labs.methods.ethics.title"]').textContent(),
    newEthicsTitle);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance)),labBaseline);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#labGuideReset").click();
  assert.equal(await page.locator("#labGuideCount").textContent(),"1 proposed change");
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-lab-guidance-review.png",fullPage:true});

  // Stage Guide and per-field help review. All source maps and student
  // field IDs must remain unchanged even when edits span different records.
  await page.locator('[data-content-view="student-guide"]').click();
  assert.equal(await page.locator('#studentGuideAuthoring').isVisible(),true);
  assert.equal(await page.locator('#labGuideAuthoring').isHidden(),true);
  const guideBaseline=await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance));
  await page.locator(
    '[data-guide-path="stages.1.title"] + .inline-quick-edit'
  ).click();
  const guideTotal=await page.locator('#studentGuidePreview .activity-edit-target').count();
  assert(guideTotal>10,'Stage Guide should expose separate editing targets');
  assert.equal(await page.locator('#studentGuidePreview .inline-review-position').textContent(),
    'Wording 1 of '+guideTotal);
  await page.locator('#studentGuidePreview .inline-review-target-select')
    .selectOption('stages.1.walkthrough.situation');
  assert.equal(await page.locator('#studentGuidePreview .inline-review-box')
    .getAttribute('data-inline-editing'),'stages.1.walkthrough.situation');
  await page.locator('#studentGuidePreview .inline-review-input').press('Escape');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance)),guideBaseline);
  await page.locator('[data-guide-path="stages.1.title"]').click();
  assert.equal(await page.locator('#studentGuidePreview .inline-review-input').isVisible(),true);
  await page.locator('#studentGuidePreview .inline-review-input').press('Escape');
  await page.locator('#reviewEditingMode').selectOption('inspector');
  const guideQuick=page.locator(
    '[data-guide-path="stages.1.title"] + .inline-quick-edit');
  await guideQuick.click();
  await page.locator('#studentGuidePreview .inline-review-input').fill(
    'Research questions begin with student curiosity');
  await page.locator('#studentGuidePreview .inline-review-save').click();
  assert.equal(await page.locator('[data-guide-path="stages.1.title"]').textContent(),
    'Research questions begin with student curiosity');
  assert.equal(await page.locator('#studentGuideCount').textContent(),'1 proposed change');
  await page.locator('[data-guide-path="stages.1.title"]').click();
  await page.locator('#studentGuideRevert').click();
  assert.equal(await page.locator('#studentGuideCount').textContent(),'0 proposed changes');
  await guideQuick.click();
  await page.locator('#studentGuidePreview .inline-review-input')
    .fill('Unfinished stage-guide wording');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#studentGuideRecord').selectOption('2');
  assert.equal(await page.locator('#studentGuideRecord').inputValue(),'1');
  assert.equal(await page.locator('#studentGuidePreview .inline-review-input').inputValue(),
    'Unfinished stage-guide wording');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#studentGuideMode').selectOption('field');
  assert.equal(await page.locator('#studentGuideMode').inputValue(),'field');
  assert.equal(await page.locator('#studentGuidePreview .inline-review-box').count(),0);
  await page.locator('#studentGuideMode').selectOption('stage');

  assert.equal(await page.locator("#studentGuideMode option").count(),2);
  assert.equal(await page.locator("#studentGuideRecord option").count(),18);
  assert.equal(await page.locator("#studentGuideExport").isDisabled(),true);
  await page.locator('[data-guide-path="stages.1.plain"]').click();
  assert.equal(await page.locator("#studentGuideInspector").isVisible(),true);
  const newPlain="First, explore several research interests and consider available evidence.";
  await page.locator("#studentGuideEdit").fill(newPlain);
  assert.equal(await page.locator('[data-guide-path="stages.1.plain"]').textContent(),newPlain);
  assert.equal(await page.locator('[data-guide-path="stages.1.plain"]').getAttribute('data-proposed'),
    'true');
  await page.locator('[data-guide-path="stages.1.walkthrough.thinking.0"]').click();
  await page.locator("#studentGuideEdit").fill(
    "Start by treating the observed pattern as a question rather than an established explanation.");
  assert.equal(await page.locator("#studentGuideExport").isEnabled(),true);
  await page.locator("#studentGuideMode").selectOption("field");
  assert.equal(await page.locator("#studentGuideRecord option").count(),113);
  await page.locator("#studentGuideFieldSearch").fill("interest1");
  assert.equal(await page.locator("#studentGuideRecord option").count(),1);
  await page.locator("#studentGuideRecord").selectOption("interest1");
  await page.locator('[data-guide-path="fields.interest1.meaning"]').click();
  const newMeaning="Name a science topic or observation you would like to explore in a study.";
  await page.locator("#studentGuideEdit").fill(newMeaning);
  assert.equal(await page.locator('[data-guide-path="fields.interest1.meaning"]').textContent(),
    newMeaning);
  await page.locator('[data-guide-path="fields.interest1.questions.0"]').click();
  await page.locator("#studentGuideEdit").fill("Would I remain interested in this project?");
  await page.locator("#studentGuideEdit").fill("<script>alert(1)</script>");
  assert.equal(await page.locator("#studentGuideExport").isDisabled(),true,
    "Untrusted HTML-like text must prevent review export");
  await page.locator("#studentGuideRevert").click();
  assert.equal(await page.locator("#studentGuideExport").isEnabled(),true);
  await page.locator("#studentGuideReview").click();
  assert.match(await page.locator("#studentGuideReviewValidation").textContent(),
    /field IDs, and guidance arrays retain their structure/);
  await page.locator("#studentGuideReviewDialog form button").click();
  const guideDownloadPromise=page.waitForEvent("download");
  await page.locator("#studentGuideExport").click();
  const guideDownload=await guideDownloadPromise;
  assert.equal(guideDownload.suggestedFilename(),"rms-student-guide-review.json");
  const guideBytes=await readFile(await guideDownload.path());
  const guidePacket=JSON.parse(guideBytes.toString("utf8"));
  assert.equal(guidePacket.schema_version,"rms-student-guide-review-v1");
  assert.equal(guidePacket.source_file,"assets/student-guidance.js");
  assert.equal(guidePacket.live_publication,false);
  assert.equal(guidePacket.review_required,true);
  assert.match(guidePacket.source_sha256,/^[a-f0-9]{64}$/);
  assert.equal(guidePacket.edits.length,3);
  assert(guidePacket.edits.some(e=>e.path==="stages.1.plain"&&e.value===newPlain));
  assert(guidePacket.edits.some(e=>e.path==="fields.interest1.meaning"&&e.value===newMeaning));
  assert(guidePacket.edits.some(e=>e.path==="stages.1.walkthrough.thinking.0"));
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance)),guideBaseline);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#adminWorkspace:not([hidden])").waitFor();
  await page.locator('[data-admin-panel="content-studio"]').click();
  await page.locator('[data-content-view="student-guide"]').click();
  await page.locator('[data-guide-path="stages.1.plain"]').waitFor();
  assert.equal(await page.locator("#studentGuideCount").textContent(),"0 proposed changes");
  const wrongGuide={...guidePacket,source_sha256:"0".repeat(64)};
  await page.locator("#studentGuideImport").setInputFiles({
    name:"old-guide.json",mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(wrongGuide))
  });
  await page.waitForFunction(()=>/different Student Guide version/.test(
    document.getElementById("studentGuideStatus")?.textContent||""));
  assert.equal(await page.locator("#studentGuideCount").textContent(),"0 proposed changes");
  const unsafeGuide={...guidePacket,edits:[...guidePacket.edits,{
    path:"stages.1.terms.0",original:"variable",value:"Unsafe changed term mapping"
  }]};
  await page.locator("#studentGuideImport").setInputFiles({
    name:"wrong-field.json",mimeType:"application/json",
    buffer:Buffer.from(JSON.stringify(unsafeGuide))
  });
  await page.waitForFunction(()=>/unknown or altered help field/.test(
    document.getElementById("studentGuideStatus")?.textContent||""));
  assert.equal(await page.locator("#studentGuideCount").textContent(),"0 proposed changes");
  await page.locator("#studentGuideImport").setInputFiles({
    name:"review.json",mimeType:"application/json",buffer:guideBytes
  });
  await page.waitForFunction(()=>/Restored 3 Student Guide wording changes/.test(
    document.getElementById("studentGuideStatus")?.textContent||""));
  assert.equal(await page.locator("#studentGuideCount").textContent(),"3 proposed changes");
  await page.waitForFunction(()=>document.getElementById("studentEditorCount")
    ?.textContent==="3 proposed changes");
  assert.equal(await page.locator('[data-guide-path="stages.1.plain"]').textContent(),newPlain);
  await page.locator("#studentGuideMode").selectOption("field");
  await page.locator("#studentGuideRecord").selectOption("interest1");
  assert.equal(await page.locator('[data-guide-path="fields.interest1.meaning"]').textContent(),
    newMeaning);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.RMSStudentGuidance)),guideBaseline);
  page.once("dialog",dialog=>dialog.accept());
  await page.locator("#studentGuideReset").click();
  assert.equal(await page.locator("#studentGuideCount").textContent(),"2 proposed changes");
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-student-guide-editor.png",fullPage:true});

  // Publication remains isolated from all review-only proposals.
  await page.locator('[data-content-view="publication"]').click();
  assert.equal(await page.locator(".publication-card").isVisible(),true);
  assert.equal(await page.locator('#reviewEditingPreference').isHidden(),true);
  assert.equal(await page.locator('#studentGuideAuthoring').isHidden(),true);
  assert.match(await page.locator("#contentViewDescription").textContent(),
    /Review-only proposals cannot publish here/);
  assert.equal(await page.locator("#publishContentRelease").isDisabled(),true);
  assert.equal(await page.locator('[data-content-view="publication"][aria-current="page"]').count(),1);
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-content-studio-publication.png",fullPage:true});
  await page.locator('[data-content-view="guidance"]').click();
  assert.equal(await page.locator('#visualGuidanceEditor').isVisible(),true);
  // Visual editing is the default; keep advanced raw fields closed.
  await page.locator("#contentSourceFallback").evaluate(el=>el.open=false);
  await page.screenshot({path:"/tmp/visual-guidance-artifacts/admin-visual-guidance-desktop.png",fullPage:true});
  // A copied editing-area URL should still require teacher verification and
  // automatically select the matching Content Studio area after that check.
  await page.goto(origin+"/admin-workspace.html#studentGuideAuthoring",
    {waitUntil:"domcontentloaded"});
  await page.locator("#adminWorkspace:not([hidden])").waitFor();
  assert.equal(await page.locator('#contentStudioPanel').isVisible(),true);
  assert.equal(await page.locator('#studentGuideAuthoring').isVisible(),true);
  assert.equal(await page.locator('[data-content-view="student-guide"][aria-current="page"]').count(),1);
  assert.equal(await page.locator('#visualGuidanceEditor').isHidden(),true);
  await page.locator('[data-admin-panel="settings"]').click();
  assert.equal(await page.locator('#contentStudioPanel').isHidden(),true);
  await page.evaluate(()=>{window.location.hash="#activityAuthoring";});
  assert.equal(await page.locator('#contentStudioPanel').isVisible(),true);
  assert.equal(await page.locator('#activityAuthoring').isVisible(),true);
  assert.equal(await page.locator('[data-content-view="activities"][aria-current="page"]').count(),1);

  // Mobile viewport uses a two-column workspace switcher. The regular
  // Admin sections and the active editor remain independently reachable.
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-content-view="student-guide"]').click();
  assert.equal(await page.locator('#studentGuideAuthoring').isVisible(),true);
  assert.equal(await page.locator('#labGuideAuthoring').isHidden(),true);
  assert.equal(await page.locator('.content-authoring-nav a').count(),5);
  assert.equal(await page.locator('.foundation-notice-short').isVisible(),true);
  assert.equal(await page.locator('.foundation-notice-full').isHidden(),true);
  assert.equal(await page.locator('.workspace-header p').isHidden(),true);
  assert.match(await page.locator('.foundation-notice-short').textContent(),
    /Research collection remains off/);
  const mobile=await page.locator("#contentAuthoringNav").evaluate(el=>{
    const bounds=el.getBoundingClientRect();
    const panel=el.closest("#contentStudioPanel").getBoundingClientRect();
    return {
      columns:getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
      navRight:bounds.right,panelRight:panel.right
    };
  });
  assert.equal(mobile.columns,2,"Narrow viewports should use a two-column editor switcher");
  const mobileChrome=await page.evaluate(()=>({
    topbarPosition:getComputedStyle(document.querySelector(".topbar")).position,
    sidebarTop:getComputedStyle(document.querySelector(".sidebar")).top,
    sidebarPosition:getComputedStyle(document.querySelector(".sidebar")).position
  }));
  assert.equal(mobileChrome.topbarPosition,"static");
  assert.equal(mobileChrome.sidebarPosition,"sticky");
  assert.equal(mobileChrome.sidebarTop,"0px",
    "Mobile Admin navigation must not leave a sticky offset below the nonsticky topbar");
  const mobilePreview=await page.locator('#studentGuidePreview').evaluate(el=>({
    maxHeight:getComputedStyle(el).maxHeight,
    overflow:getComputedStyle(el).overflowY,
    viewport:window.innerWidth,
    documentWidth:document.documentElement.scrollWidth
  }));
  assert.equal(mobilePreview.maxHeight,'none',
    'Small screens should scroll normally through the Student Guide preview');
  assert.notEqual(mobilePreview.overflow,'auto',
    'The mobile editor must not trap scrolling inside the preview');
  assert(mobilePreview.documentWidth<=mobilePreview.viewport+1,
    'The Admin Workspace must not produce horizontal page overflow on mobile');
  assert(mobile.navRight<=mobile.panelRight+2,
    "Mobile workspace navigation must remain within its Admin panel");
  await page.locator('#studentGuideMode').selectOption('stage');
  await page.locator('#studentGuideRecord').selectOption('1');
  await page.locator('#reviewEditingMode').selectOption('direct');
  const accessiblePencil=page.locator(
    '#studentGuidePreview [data-guide-path="stages.1.title"] + .inline-quick-edit');
  assert.match(await accessiblePencil.getAttribute('aria-label'),/^Edit /);
  const touchSize=await accessiblePencil.evaluate(el=>({
    width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height
  }));
  assert(touchSize.width>=40&&touchSize.height>=40,
    'Pencil controls must have practical touch targets');
  await page.locator('[data-guide-path="stages.1.title"]').click();
  assert.equal(await page.locator('#studentGuidePreview .inline-review-input').isVisible(),true);
  await page.screenshot({
    path:"/tmp/visual-guidance-artifacts/admin-inline-edit-mobile.png",fullPage:true
  });
  await page.locator('#studentGuidePreview .inline-review-input').press('Escape');
  await page.locator('[data-content-view="publication"]').click();
  assert.equal(await page.locator('.publication-card').isVisible(),true);
  await page.screenshot({
    path:"/tmp/visual-guidance-artifacts/admin-content-studio-mobile.png",fullPage:true
  });
  await page.locator('[data-admin-panel="dashboard"]').click();
  assert.equal(await page.locator('.foundation-notice-full').isVisible(),true,
    'Other Admin areas must retain their full privacy and publication notice');
  assert.equal(await page.locator('.foundation-notice-short').isHidden(),true);
  assert.equal(await page.locator('.workspace-header p').isVisible(),true);
  assert.deepEqual(errors,[],"Admin visual guidance should not produce runtime errors");
  console.log("PASS: admin mount, 18 stages, direct editing, source sync, safe paste and navigation");
 }finally{
  await browser.close();
}
