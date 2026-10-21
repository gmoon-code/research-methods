import test from "node:test";
import assert from "node:assert/strict";
import {startAdminPreview} from "../scripts/preview-admin-locally.mjs";

test("Interactive draft preview is isolated, locally served, and editable",async()=>{
  const preview=await startAdminPreview({headless:true});
  try{
    const {page,origin}=preview;
    assert.match(origin,/^http:\/\/127\.0\.0\.1:\d+$/);
    assert.equal(new URL(page.url()).origin,origin);
    assert.equal(await page.locator("#adminWorkspace").isVisible(),true);
    assert.match(await page.locator("#rms-local-preview-warning").textContent(),
      /Simulated Admin access.*External connections blocked.*Cannot publish/);

    // Files outside the preview's static allowlist cannot be requested.
    const forbidden=await page.request.get(origin+"/backend/cloudflare-workers-ai/wrangler.jsonc");
    assert.equal(forbidden.status(),404);
    const access=await page.request.get(origin+"/assets/teacher-session.js");
    assert.equal(access.status(),200); // HTTP server serves this locally; browser overrides it.
    const external=await page.evaluate(async()=>{
      try{
        await fetch("https://rms-research-chat-free.gmoon-code.workers.dev/teacher/session/verify",{
          method:"POST"
        });
        return "unexpectedly connected";
      }catch{return "blocked";}
    });
    assert.equal(external,"blocked","Preview browser must block every external request");

    await page.locator('[data-admin-panel="content-studio"]').click();
    await page.locator('[data-content-view="activities"]').click();
    await page.locator('[data-activity-path="s.0.title"]').click();
    const editor=page.locator("#activityPreview .inline-review-input");
    assert.equal(await editor.isVisible(),true);
    await editor.fill("Local preview only · Science interests");
    await page.locator("#activityPreview .inline-review-save").click();
    assert.equal(await page.locator('[data-activity-path="s.0.title"]').textContent(),
      "Local preview only · Science interests");
    assert.equal(await page.locator("#activityReviewCount").textContent(),
      "1 proposed change");
  }finally{
    await preview.close();
  }
});
