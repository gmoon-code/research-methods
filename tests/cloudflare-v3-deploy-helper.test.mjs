import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";
import {
  spawnSync
} from "node:child_process";

const helper =
  readFileSync(
    "scripts/deploy-cloudflare-v3.mjs",
    "utf8"
  );

const canary =
  readFileSync(
    "scripts/test-production-content.mjs",
    "utf8"
  );

const worker =
  readFileSync(
    "backend/cloudflare-workers-ai/worker.mjs",
    "utf8"
  );

const workerCore =
  readFileSync(
    "backend/cloudflare-workers-ai/worker-core.mjs",
    "utf8"
  );

const wrangler =
  JSON.parse(
    readFileSync(
      "backend/cloudflare-workers-ai/wrangler.jsonc",
      "utf8"
    )
  );

const runtimeConfig =
  readFileSync(
    "assets/runtime-config.js",
    "utf8"
  );

test(
  "v3 deployment helper passes offline preflight without Cloudflare access",
  () => {
    const result =
      spawnSync(
        process.execPath,
        [
          "scripts/deploy-cloudflare-v3.mjs",
          "--check"
        ],
        {
          cwd:
            process.cwd(),
          encoding:
            "utf8"
        }
      );

    assert.equal(
      result.status,
      0,
      result.stderr ||
      result.stdout
    );

    assert.match(
      result.stdout,
      /CLOUDFLARE V3 DEPLOYMENT HELPER CHECK: PASS/
    );

    assert.match(
      result.stdout,
      /SQLite Durable Object binding/
    );

    assert.match(
      result.stdout,
      /no Workers KV content binding/i
    );

    assert.match(
      result.stdout,
      /isolated v3 Worker target: rms-research-methods-v3/
    );

    assert.match(
      result.stdout,
      /existing production Worker remains: rms-research-chat-free/
    );
  }
);

test(
  "Wrangler config binds one SQLite content release Durable Object",
  () => {
    assert.deepEqual(
      wrangler
        .durable_objects
        ?.bindings,
      [
        {
          name:
            "RMS_CONTENT_COORDINATOR",
          class_name:
            "ContentReleaseCoordinator"
        }
      ]
    );

    assert.deepEqual(
      wrangler.exports
        ?.ContentReleaseCoordinator,
      {
        type:
          "durable-object",
        storage:
          "sqlite"
      }
    );

    const kvBindings =
      Array.isArray(
        wrangler.kv_namespaces
      )
        ? wrangler
            .kv_namespaces
        : [];

    assert.equal(
      kvBindings.some(
        item =>
          /RMS_CONTENT/i
            .test(
              String(
                item?.binding ||
                ""
              )
            )
      ),
      false
    );
  }
);

test(
  "Worker exports the configured Durable Object and worker core routes content before Research Chat",
  () => {
    assert.match(
      worker,
      /import\s*{\s*ContentReleaseCoordinator\s*}\s*from\s*['"]\.\/content-durable-object\.mjs['"]/
    );

    assert.match(
      worker,
      /export\s*{[\s\S]*ContentReleaseCoordinator/
    );

    assert.match(
      workerCore,
      /handleContentRequest/
    );

    const contentIndex =
      workerCore.indexOf(
        "handleContentRequest"
      );

    const rateLimitIndex =
      workerCore.indexOf(
        "applyRateLimits(request, env)"
      );

    assert.ok(
      contentIndex >= 0
    );

    assert.ok(
      rateLimitIndex >
      contentIndex
    );
  }
);

test(
  "v3 helper deploys an isolated Worker and contains no KV provisioning path",
  () => {
    assert.match(
      helper,
      /"wrangler",\s*"deploy"/
    );

    assert.match(
      helper,
      /"--name",[\s\S]{0,80}V3_WORKER_NAME/
    );

    assert.match(
      helper,
      /const V3_WORKER_NAME\s*=\s*"rms-research-methods-v3"/
    );

    assert.match(
      helper,
      /const EXISTING_PRODUCTION_WORKER\s*=\s*"rms-research-chat-free"/
    );

    assert.match(
      helper,
      /RMS_CONTENT_COORDINATOR/
    );

    assert.match(
      helper,
      /ContentReleaseCoordinator/
    );

    assert.doesNotMatch(
      helper,
      /kv[\s\S]{0,40}namespace[\s\S]{0,40}(create|list)/i
    );

    assert.doesNotMatch(
      helper,
      /RMS_CONTENT_STORE/
    );

    assert.doesNotMatch(
      helper,
      /deploymentConfigFile|--update-config/
    );

    assert.doesNotMatch(
      helper,
      /configure-chat-endpoint\.mjs/
    );

    assert.match(
      helper,
      /public runtime-config\.js intentionally unchanged/
    );

    assert.equal(
      wrangler.name,
      "rms-research-chat-free"
    );

    assert.match(
      runtimeConfig,
      /rms-research-chat-free\.gmoon-code\.workers\.dev/
    );

    assert.doesNotMatch(
      runtimeConfig,
      /rms-research-methods-v3/
    );
  }
);

test(
  "v3 helper keeps deployment secrets temporary and never requests an AI API key",
  () => {
    assert.match(
      helper,
      /RMS_CHAT_ACCESS_CODE/
    );

    assert.match(
      helper,
      /RMS_TEACHER_ACCESS_CODE/
    );

    assert.match(
      helper,
      /RMS_TEACHER_SESSION_SECRET/
    );

    assert.match(
      helper,
      /randomBytes\(48\)/
    );

    assert.match(
      helper,
      /mode:\s*0o600/
    );

    assert.match(
      helper,
      /await rm\(\s*tempDir/
    );

    assert.doesNotMatch(
      helper,
      /OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY/
    );
  }
);

test(
  "v3 deployment requires explicit free-plan intent and identifies SQLite coordination",
  () => {
    assert.match(
      helper,
      /Cloudflare Workers Free/
    );

    assert.match(
      helper,
      /SQLite-backed Durable Object/
    );

    assert.match(
      helper,
      /do not upgrade Workers/i
    );

    assert.match(
      helper,
      /Confirm you intend to keep this deployment on Cloudflare Workers Free/
    );
  }
);

test(
  "v3 deployment invokes content canary before optional Research Chat smoke",
  () => {
    const contentIndex =
      helper.lastIndexOf(
        "test-production-content.mjs"
      );

    const chatIndex =
      helper.lastIndexOf(
        "test-production-chat.mjs"
      );

    assert.ok(
      contentIndex >= 0
    );

    assert.ok(
      chatIndex >
      contentIndex
    );

    assert.match(
      helper,
      /RMS_CONTENT_ENDPOINT/
    );

    assert.match(
      helper,
      /RMS_CONTENT_ORIGIN/
    );
  }
);

test(
  "production content canary verifies publish publish rollback without semantic content change",
  () => {
    for (
      const required
      of [
        "/teacher/session",
        "/admin/content/state",
        "/admin/content/publish",
        "/admin/content/rollback",
        "/admin/content/revisions",
        "/content/public",
        "firstReleaseId",
        "secondReleaseId",
        "rollback_source_release_id",
        "semanticBaseline",
        "PRODUCTION CONTENT CANARY: PASS"
      ]
    ) {
      assert.equal(
        canary.includes(
          required
        ),
        true,
        required
      );
    }

    const publishMatches =
      canary.match(
        /"\/admin\/content\/publish"/g
      ) || [];

    assert.equal(
      publishMatches.length,
      2
    );

    assert.match(
      canary,
      /sourceRecords\s*=\s*initialPublic\.release/
    );

    assert.match(
      canary,
      /sourceRecords\s*=\s*loadBundledRecords\(\)/
    );

    assert.match(
      canary,
      /Final public content differs from the semantic baseline after rollback/
    );

    assert.doesNotMatch(
      canary,
      /console\.log\([^\n]*(token|adminCode)/i
    );
  }
);

