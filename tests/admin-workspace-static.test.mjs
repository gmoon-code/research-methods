import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const admin = readFileSync(
  "admin-workspace.html",
  "utf8"
);

test(
  "Admin Workspace uses the existing verified private session",
  () => {
    const runtime =
      admin.indexOf("./assets/runtime-config.js");

    const session =
      admin.indexOf("./assets/teacher-session.js");

    const verify =
      admin.indexOf("await teacherSession.verify()");

    const active =
      admin.indexOf("!teacherSession.isActive()");

    const reveal =
      admin.indexOf("workspace.hidden = false");

    assert.ok(runtime >= 0);
    assert.ok(session > runtime);
    assert.ok(verify > session);
    assert.ok(active > verify);
    assert.ok(reveal > active);

    assert.match(
      admin,
      /location\.replace\("\.\/teacher\.html"\)/
    );

    assert.doesNotMatch(admin, /URLSearchParams/);
    assert.doesNotMatch(admin, /\?mode=teacher/);
    assert.doesNotMatch(admin, /localStorage/);
    assert.doesNotMatch(admin, /indexedDB/i);
  }
);

test(
  "Admin Workspace contains exactly the seven v3 foundation areas",
  () => {
    const expected = [
      "dashboard",
      "content-studio",
      "usage-research-data",
      "analytics",
      "services",
      "recovery-operations",
      "settings"
    ];

    const nav = [
      ...admin.matchAll(
        /data-admin-panel="([^"]+)"/g
      )
    ].map(match => match[1]);

    const panels = [
      ...admin.matchAll(
        /data-admin-workspace-panel="([^"]+)"/g
      )
    ].map(match => match[1]);

    assert.deepEqual(nav, expected);
    assert.deepEqual(panels, expected);
  }
);

test(
  "Admin foundation shell enables no telemetry research collection or content publishing",
  () => {
    assert.match(
      admin,
      /No operational telemetry or research data[\s\S]*collected by this shell/
    );

    assert.match(
      admin,
      /Content publishing[\s\S]*Not enabled yet/
    );

    assert.match(
      admin,
      /Operational collection[\s\S]*Off/
    );

    assert.match(
      admin,
      /Research collection[\s\S]*Off/
    );

    assert.match(
      admin,
      /No silent collection\./
    );

    assert.doesNotMatch(admin, /\bfetch\s*\(/);
    assert.doesNotMatch(admin, /XMLHttpRequest/);
    assert.doesNotMatch(admin, /WebSocket/);
    assert.doesNotMatch(admin, /navigator\.sendBeacon/);
  }
);

test(
  "Admin shell preserves Classroom Tools only as an optional compatibility surface",
  () => {
    assert.match(
      admin,
      /href="\.\/teacher-workspace\.html"/
    );

    assert.match(admin, /Classroom Tools/);
    assert.match(admin, /compatibility module/);

    assert.match(
      admin,
      /not required for the public self-guided research workflow/
    );
  }
);

test(
  "Admin shell renders only public runtime service metadata",
  () => {
    assert.match(admin, /window\.RMS_RUNTIME_CONFIG/);
    assert.match(admin, /safeEndpointOrigin/);
    assert.match(admin, /return url\.origin/);

    assert.match(
      admin,
      /Secrets exposed here[\s\S]*<strong>None<\/strong>/
    );

    assert.doesNotMatch(
      admin,
      /RMS_TEACHER_ACCESS_CODE/
    );

    assert.doesNotMatch(
      admin,
      /RMS_TEACHER_SESSION_SECRET/
    );

    assert.doesNotMatch(
      admin,
      /X-RMS-Teacher-Code/
    );
  }
);

test(
  "Admin shell has no student project ingestion path",
  () => {
    assert.doesNotMatch(admin, /type="file"/);
    assert.doesNotMatch(admin, /studentPacketFiles/);
    assert.doesNotMatch(
      admin,
      /research_methods_studio_v1/
    );
    assert.doesNotMatch(
      admin,
      /RMSTeacherWorkspaceData/
    );

    assert.match(
      admin,
      /does not read public users' browser projects/
    );
  }
);

test(
  "Content Studio wires the guarded all-stage browser editor and sandboxed preview",
  () => {
    for (
      const required
      of [
        "./assets/content-registry.js",
        "./assets/admin-content-studio.js",
        "./assets/admin-content-studio-ui.js",
        'id="contentBrowserSearch"',
        'id="contentBrowserList"',
        'id="contentBrowserCount"',
        'id="contentDirtyCount"',
        'id="contentRecordStage"',
        'id="contentRecordPhase"',
        'id="contentRecordKey"',
        'id="contentRecordRevision"',
        'id="contentDraftState"',
        'id="contentEditorStageLabel"',
        'id="contentTitle"',
        'id="contentNav"',
        'id="contentPurpose"',
        'id="contentLearnHtml"',
        'id="contentExampleHtml"',
        'id="contentWarningHtml"',
        'id="validateContentDraft"',
        'id="previewContentDraft"',
        'id="exportContentDraft"',
        'id="resetContentDraft"',
        'id="contentFullReplacement"',
        'id="applyContentReplacement"',
        'id="contentPreviewFrame"',
        'sandbox=""',
        "Publication boundary.",
        "browse all 18 stage-guidance records",
        "cannot publish to the public site yet",
        "discards every in-memory draft"
      ]
    ) {
      assert.equal(
        admin.includes(required),
        true,
        required
      );
    }

    const session =
      admin.indexOf(
        "./assets/teacher-session.js"
      );

    const registry =
      admin.indexOf(
        "./assets/content-registry.js"
      );

    const model =
      admin.indexOf(
        "./assets/admin-content-studio.js"
      );

    const ui =
      admin.indexOf(
        "./assets/admin-content-studio-ui.js"
      );

    assert.ok(session >= 0);
    assert.ok(registry > session);
    assert.ok(model > registry);
    assert.ok(ui > model);

    assert.match(
      admin,
      /RMSAdminContentStudioUI[\s\S]{0,80}mount/
    );
  }
);
