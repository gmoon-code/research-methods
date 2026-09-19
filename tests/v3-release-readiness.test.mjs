import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";

const pkg =
  JSON.parse(
    readFileSync(
      "package.json",
      "utf8"
    )
  );

const runtime =
  readFileSync(
    "assets/runtime-config.js",
    "utf8"
  );

const readme =
  readFileSync(
    "README.md",
    "utf8"
  );

const backendReadme =
  readFileSync(
    "backend/cloudflare-workers-ai/README.md",
    "utf8"
  );

const foundation =
  readFileSync(
    "docs/V3_ADMIN_WORKSPACE_FOUNDATION_CONTRACT.md",
    "utf8"
  );

const publication =
  readFileSync(
    "docs/V3_CONTENT_PUBLICATION_ROLLBACK_CONTRACT.md",
    "utf8"
  );

const cutover =
  readFileSync(
    "docs/V3_PRODUCTION_CUTOVER_CHECKLIST.md",
    "utf8"
  );

test(
  "v3 application package and runtime versions are both 3.0.0",
  () => {
    assert.equal(
      pkg.version,
      "3.0.0"
    );

    assert.match(
      runtime,
      /"version":\s*"3\.0\.0"/
    );
  }
);

test(
  "v3 runtime keeps student Chat separate from public and Admin content",
  () => {
    assert.match(
      runtime,
      /"researchChatEndpoint":\s*"https:\/\/rms-research-chat-free\.gmoon-code\.workers\.dev\/"/
    );

    assert.match(
      runtime,
      /"chatEndpoint":\s*"https:\/\/rms-research-chat-free\.gmoon-code\.workers\.dev\/"/
    );

    assert.match(
      runtime,
      /"publicContentEndpoint":\s*"https:\/\/rms-research-methods-v3\.gmoon-code\.workers\.dev\/"/
    );

    assert.match(
      runtime,
      /"adminContentEndpoint":\s*"https:\/\/rms-research-methods-v3\.gmoon-code\.workers\.dev\/"/
    );
  }
);

test(
  "v3 README identifies Admin Workspace public fallback and disabled research collection",
  () => {
    assert.match(
      readme,
      /^# Research Methods Studio v3\.0\.0 FREE/m
    );

    assert.match(
      readme,
      /Admin Workspace/
    );

    assert.match(
      readme,
      /bundled curriculum/
    );

    assert.match(
      readme,
      /does not enable operational telemetry or research-study data collection/
    );
  }
);

test(
  "backend documentation preserves the Research Chat service-version distinction",
  () => {
    assert.match(
      backendReadme,
      /Research Methods Studio v2\.16\.0/
    );

    assert.match(
      backendReadme,
      /v3\.0\.0 application source tree now includes the verified public content startup loader/
    );

    assert.match(
      backendReadme,
      /rms-research-chat-free/
    );

    assert.match(
      backendReadme,
      /rms-research-methods-v3/
    );
  }
);

test(
  "v3 foundation contract treats v2.17.1 as an immutable recovery baseline",
  () => {
    assert.match(
      foundation,
      /authored against the frozen Research Methods Studio v2\.17\.1 public baseline/
    );

    assert.match(
      foundation,
      /v2\.17\.1 production tag remains an immutable recovery reference/
    );
  }
);

test(
  "publication contract records completed loader gates while keeping cutover deliberate",
  () => {
    assert.match(
      publication,
      /later v3\.0\.0 release candidate implemented/
    );

    assert.match(
      publication,
      /bounded bundled fallback/
    );

    assert.match(
      publication,
      /draft pull request until the production cutover gate is deliberately completed/
    );
  }
);

test(
  "cutover checklist pins the frozen baseline and recovery branch",
  () => {
    assert.match(
      cutover,
      /bf02a3e513ebdf5eedaa5955d07f75619b0e38b4/
    );

    assert.match(
      cutover,
      /backup\/v2\.17\.1-pre-v3\.0\.0-cutover-2026-09-19/
    );

    assert.match(
      cutover,
      /Do not move the v2\.17\.1 tag/
    );
  }
);

test(
  "cutover checklist requires squash merge and normal revert recovery",
  () => {
    assert.match(
      cutover,
      /Use a squash merge for PR #9/
    );

    assert.match(
      cutover,
      /Revert the single v3\.0\.0 squash commit/
    );

    assert.match(
      cutover,
      /Use a normal revert commit/
    );

    assert.match(
      cutover,
      /Do not force-reset `main`/
    );
  }
);

test(
  "v3.0.0 tag is delayed until post-merge production acceptance",
  () => {
    assert.match(
      cutover,
      /Do not create the final `v3\.0\.0` tag before post-merge production verification passes/
    );

    assert.match(
      cutover,
      /create the annotated `v3\.0\.0` tag at that exact accepted commit/
    );
  }
);

test(
  "release regression command includes public loader and release-readiness suites",
  () => {
    assert.match(
      pkg.scripts[
        "test:research-chat"
      ],
      /tests\/public-content-loader\.test\.mjs/
    );

    assert.match(
      pkg.scripts[
        "test:research-chat"
      ],
      /tests\/v3-release-readiness\.test\.mjs/
    );
  }
);
