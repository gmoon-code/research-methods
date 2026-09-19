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

const wrangler =
  JSON.parse(
    readFileSync(
      "backend/cloudflare-workers-ai/wrangler.jsonc",
      "utf8"
    )
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
      /account-neutral/
    );
  }
);

test(
  "repository Wrangler config contains no account-specific content KV binding",
  () => {
    assert.equal(
      Array.isArray(
        wrangler.kv_namespaces
      )
        ? wrangler.kv_namespaces
            .some(
              item =>
                item?.binding ===
                "RMS_CONTENT_STORE"
            )
        : false,
      false
    );

    assert.doesNotMatch(
      JSON.stringify(
        wrangler
      ),
      /[a-f0-9]{32}/i
    );
  }
);

test(
  "v3 helper discovers or creates content KV only through a temporary deployment config",
  () => {
    assert.match(
      helper,
      /wrangler",s*"kv",s*"namespace",s*"list"/
    );

    assert.match(
      helper,
      /"create",s*CONTENT_BINDING/
    );

    assert.match(
      helper,
      /"--binding",s*CONTENT_BINDING/
    );

    assert.match(
      helper,
      /"--update-config"/
    );

    assert.match(
      helper,
      /deploymentConfigFile/
    );

    assert.match(
      helper,
      /withContentBinding/
    );

    assert.match(
      helper,
      /unlink(s*deploymentConfigFile/
    );

    assert.doesNotMatch(
      helper,
      /RMS_CONTENT_STORE["']?s*:s*["'][a-f0-9]{32}/i
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
      /randomBytes(48)/
    );

    assert.match(
      helper,
      /mode:s*0o600/
    );

    assert.match(
      helper,
      /await rm(s*tempDir/
    );

    assert.doesNotMatch(
      helper,
      /OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY/
    );
  }
);

test(
  "v3 deployment requires explicit free-plan intent before provisioning",
  () => {
    assert.match(
      helper,
      /Cloudflare Workers Free/
    );

    assert.match(
      helper,
      /Workers KV/
    );

    assert.match(
      helper,
      /do not upgrade Workers/i
    );

    assert.match(
      helper,
      /Confirm you intend to keep this deployment on Cloudflare Workers Free/
    );

    assert.match(
      helper,
      /No existing RMS content store was found\. Create one now/
    );
  }
);

test(
  "v3 deployment invokes the production content canary before optional Chat smoke",
  () => {
    const contentIndex =
      helper.indexOf(
        "test-production-content.mjs"
      );

    const chatIndex =
      helper.indexOf(
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
  "production content canary authenticates and verifies publish publish rollback history",
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

    assert.doesNotMatch(
      canary,
      /console\.log\([^\n]*(token|adminCode)/i
    );
  }
);

test(
  "production content canary publishes only the existing public or bundled semantic baseline",
  () => {
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
      /canonicalStringify\(\s*sourceRecords/
    );

    assert.match(
      canary,
      /Final public content differs from the semantic baseline after rollback/
    );
  }
);
