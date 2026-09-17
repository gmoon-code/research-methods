import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const entry = readFileSync(
  "teacher.html",
  "utf8"
);

const workspace = readFileSync(
  "teacher-workspace.html",
  "utf8"
);

test(
  "teacher entry routes authenticated sessions to the dedicated workspace",
  () => {
    const workspaceRedirect =
      /location\.replace\("\.\/teacher-workspace\.html"\);/g;

    assert.equal(
      [...entry.matchAll(workspaceRedirect)].length,
      2,
      "teacher.html must contain exactly two authenticated workspace redirects"
    );

    const studentRedirect =
      /location\.replace\("\.\/"\);/g;

    assert.equal(
      [...entry.matchAll(studentRedirect)].length,
      1,
      "teacher.html must retain exactly one student-site redirect"
    );

    assert.match(
      entry,
      /Access accepted\. Opening teacher workspace\.\.\.[\s\S]{0,180}location\.replace\("\.\/teacher-workspace\.html"\);/
    );

    assert.match(
      entry,
      /\.verify\(\)[\s\S]{0,180}if \(ok\) \{[\s\S]{0,120}location\.replace\("\.\/teacher-workspace\.html"\);/
    );

    assert.match(
      entry,
      /RMSTeacherSession[\s\S]{0,120}\.leave\(\);[\s\S]{0,120}location\.replace\("\.\/"\);/
    );
  }
);

test(
  "teacher workspace is hidden until the signed session is verified",
  () => {
    assert.match(
      workspace,
      /id="teacherWorkspace"[\s\S]{0,80}\bhidden\b/
    );

    const stored =
      workspace.indexOf(
        "teacherSession.hasStoredSession()"
      );

    const verify =
      workspace.indexOf(
        "await teacherSession.verify()"
      );

    const active =
      workspace.indexOf(
        "!teacherSession.isActive()"
      );

    const gateHide =
      workspace.indexOf(
        "gate.hidden = true"
      );

    const reveal =
      workspace.indexOf(
        "workspace.hidden = false"
      );

    for (const position of [
      stored,
      verify,
      active,
      gateHide,
      reveal
    ]) {
      assert.ok(
        position >= 0,
        "required authentication-gate step is missing"
      );
    }

    assert.ok(stored < verify);
    assert.ok(verify < active);
    assert.ok(active < gateHide);
    assert.ok(gateHide < reveal);
  }
);

test(
  "teacher workspace fails closed to teacher entry",
  () => {
    assert.match(
      workspace,
      /function returnToTeacherEntry\(\)[\s\S]{0,120}location\.replace\("\.\/teacher\.html"\);/
    );

    assert.match(
      workspace,
      /if \([\s\S]{0,220}!teacherSession[\s\S]{0,220}returnToTeacherEntry\(\);/
    );

    assert.match(
      workspace,
      /!teacherSession\.hasStoredSession\(\)[\s\S]{0,100}returnToTeacherEntry\(\);/
    );

    assert.match(
      workspace,
      /!verified[\s\S]{0,100}!teacherSession\.isActive\(\)[\s\S]{0,100}returnToTeacherEntry\(\);/
    );
  }
);

test(
  "teacher workspace leave action clears the teacher session before returning to students",
  () => {
    assert.match(
      workspace,
      /leaveButton\.addEventListener\([\s\S]{0,420}teacherSession\.leave\(\);[\s\S]{0,520}location\.replace\("\.\/"\);/
    );
  }
);

test(
  "teacher workspace loads authentication dependencies before the T2 data module",
  () => {
    const runtime =
      workspace.indexOf(
        "./assets/runtime-config.js"
      );

    const session =
      workspace.indexOf(
        "./assets/teacher-session.js"
      );

    const data =
      workspace.indexOf(
        "./assets/teacher-workspace-data.js"
      );

    assert.ok(runtime >= 0);
    assert.ok(session >= 0);
    assert.ok(data >= 0);
    assert.ok(runtime < session);
    assert.ok(session < data);

    const externalScripts = [
      ...workspace.matchAll(
        /<script\s+src="([^"]+)"/g
      )
    ].map(match => match[1]);

    assert.deepEqual(
      externalScripts,
      [
        "./assets/runtime-config.js",
        "./assets/teacher-session.js",
        "./assets/teacher-workspace-data.js"
      ]
    );
  }
);

test(
  "teacher workspace has no client-only privilege bypass or new persistence layer",
  () => {
    assert.doesNotMatch(
      workspace,
      /localStorage/
    );

    assert.doesNotMatch(
      workspace,
      /indexedDB/i
    );

    assert.doesNotMatch(
      workspace,
      /URLSearchParams/
    );

    assert.doesNotMatch(
      workspace,
      /\?mode=teacher/
    );

    assert.doesNotMatch(
      workspace,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      workspace,
      /X-RMS-Teacher-Session/
    );

    assert.doesNotMatch(
      workspace,
      /\/teacher\/session\/verify/
    );
  }
);

test(
  "teacher workspace contains exactly the seven planned primary areas",
  () => {
    const expected = [
      "overview",
      "review-queue",
      "students",
      "assignment-setup",
      "analytics",
      "chat-controls",
      "recovery"
    ];

    const nav = [
      ...workspace.matchAll(
        /data-panel="([^"]+)"/g
      )
    ].map(match => match[1]);

    const panels = [
      ...workspace.matchAll(
        /data-workspace-panel="([^"]+)"/g
      )
    ].map(match => match[1]);

    assert.deepEqual(nav, expected);
    assert.deepEqual(panels, expected);
  }
);

test(
  "T2 packet workspace is authenticated, local-only, and text-safe",
  () => {
    assert.match(
      workspace,
      /id="studentPacketFiles"[\s\S]{0,180}type="file"[\s\S]{0,180}multiple/
    );

    assert.match(
      workspace,
      /let importedPackets = \[\];/
    );

    assert.match(
      workspace,
      /teacherData[\s\S]{0,80}\.upsertStudentPacket/
    );

    assert.match(
      workspace,
      /teacherData\.deriveOverview/
    );

    assert.match(
      workspace,
      /teacherData[\s\S]{0,80}\.deriveReviewQueue/
    );

    assert.match(
      workspace,
      /teacherData[\s\S]{0,100}\.deriveStudentInspector/
    );

    assert.match(
      workspace,
      /\.textContent\s*=/
    );

    assert.match(
      workspace,
      /\.replaceChildren\(\)/
    );

    assert.doesNotMatch(
      workspace,
      /\.innerHTML\s*=/
    );

    assert.doesNotMatch(
      workspace,
      /insertAdjacentHTML/
    );

    assert.doesNotMatch(
      workspace,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      workspace,
      /WebSocket/
    );

    assert.doesNotMatch(
      workspace,
      /localStorage/
    );

    assert.doesNotMatch(
      workspace,
      /indexedDB/i
    );

    assert.doesNotMatch(
      workspace,
      /FormData/
    );

    assert.doesNotMatch(
      workspace,
      /studentAccount|student_account|student-account/i
    );

    const verify =
      workspace.indexOf(
        "await teacherSession.verify()"
      );

    const active =
      workspace.indexOf(
        "!teacherSession.isActive()"
      );

    const dataLayer =
      workspace.indexOf(
        "window.RMSTeacherWorkspaceData"
      );

    const reveal =
      workspace.indexOf(
        "workspace.hidden = false"
      );

    assert.ok(verify >= 0);
    assert.ok(active > verify);
    assert.ok(dataLayer > active);
    assert.ok(reveal > dataLayer);

    assert.match(
      workspace,
      /Imported review packets stay in memory in this page only\./
    );

    assert.match(
      workspace,
      /raw dataset rows/
    );

    assert.match(
      workspace,
      /Research Chat transcripts/
    );

    assert.match(
      workspace,
      /id="panel-overview"[\s\S]*id="studentPacketFiles"/
    );

    assert.match(
      workspace,
      /id="panel-review-queue"[\s\S]*id="reviewQueueFilter"/
    );

    assert.match(
      workspace,
      /id="panel-students"[\s\S]*id="studentInspector"/
    );

    assert.equal(
      (
        workspace.match(
          /Reserved for a later milestone\./g
        ) ||
        []
      ).length,
      2
    );
  }
);


const {
  default: t3Test
} = await import(
  "node:test"
);

const {
  default: t3Assert
} = await import(
  "node:assert/strict"
);

const {
  readFile: readT3WorkspaceFile
} = await import(
  "node:fs/promises"
);

const t3WorkspaceSource =
  await readT3WorkspaceFile(
    new URL(
      "../teacher-workspace.html",
      import.meta.url
    ),
    "utf8"
  );

t3Test(
  "T3 review authoring remains local, explicit, and packet-compatible",
  () => {
    for (
      const required
      of [
        "let teacherReviewDraft = null;",
        "let teacherReviewPacket = null;",
        "createTeacherReviewDraft",
        "setTeacherDisplayName",
        "upsertCheckpointDecision",
        "upsertTeacherFeedback",
        "hasExportableTeacherReview",
        "buildTeacherFeedbackPacket",
        "Preview feedback packet",
        "Download feedback JSON",
        "Discard review draft",
        "approved",
        "revision_requested",
        "rms-teacher-feedback-"
      ]
    ) {
      t3Assert.equal(
        t3WorkspaceSource.includes(
          required
        ),
        true,
        required
      );
    }

    t3Assert.equal(
      t3WorkspaceSource.includes(
        "window.confirm("
      ),
      true
    );

    t3Assert.equal(
      t3WorkspaceSource.includes(
        "URL.createObjectURL("
      ),
      true
    );

    t3Assert.equal(
      t3WorkspaceSource.includes(
        "new Blob("
      ),
      true
    );
  }
);

t3Test(
  "T3 review UI does not introduce persistence, feedback networking, or unsafe HTML",
  () => {
    for (
      const forbidden
      of [
        ".innerHTML =",
        ".innerHTML=",
        "insertAdjacentHTML",
        "localStorage",
        "indexedDB",
        "XMLHttpRequest",
        "WebSocket",
        "FormData"
      ]
    ) {
      t3Assert.equal(
        t3WorkspaceSource.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }

    t3Assert.equal(
      /\bfetch\s*\(/.test(
        t3WorkspaceSource
      ),
      false
    );

    t3Assert.equal(
      t3WorkspaceSource.includes(
        "review-preview"
      ),
      true
    );

    t3Assert.equal(
      t3WorkspaceSource.includes(
        "preview.textContent ="
      ),
      true
    );
  }
);

t3Test(
  "T3 preserves seven primary areas and leaves later milestones reserved",
  () => {
    const primaryAreas =
      [
        "overview",
        "review-queue",
        "students",
        "assignment-setup",
        "analytics",
        "chat-controls",
        "recovery"
      ];

    for (
      const area
      of primaryAreas
    ) {
      t3Assert.equal(
        t3WorkspaceSource.includes(
          `data-workspace-panel="${area}"`
        ),
        true,
        area
      );
    }

    t3Assert.equal(
      (
        t3WorkspaceSource.match(
          /Reserved for a later milestone\./g
        ) ||
        []
      ).length,
      2
    );

    t3Assert.equal(
      t3WorkspaceSource.includes(
        "competency_ratings"
      ),
      false
    );
  }
);


test(
  "T4 Assignment Setup UI uses the committed pure data API",
  () => {
    for (
      const required
      of [
        'id="panel-assignment-setup"',
        'id="assignmentId"',
        'id="assignmentTitle"',
        'id="assignmentCourseSection"',
        'id="assignmentTeacherName"',
        'id="assignmentStudentInstructions"',
        'id="assignmentTeacherNotes"',
        'id="assignmentDueM1"',
        'id="assignmentDueM2"',
        'id="assignmentDueM3"',
        'id="assignmentDueM4"',
        'id="assignmentDueM5"',
        'id="assignmentSetupFile"',
        'id="previewAssignmentSetup"',
        'id="downloadAssignmentSetup"',
        'id="clearAssignmentSetup"',
        "let assignmentDraft = null;",
        "let assignmentPreviewPacket = null;",
        "createAssignmentDraft",
        "updateAssignmentField",
        "updateAssignmentMilestoneDueDate",
        "assignmentDraftFromPacket",
        "buildAssignmentPacket",
        "Preview assignment JSON",
        "Download assignment JSON",
        "rms_assignment_setup version 1.0"
      ]
    ) {
      assert.equal(
        workspace.includes(
          required
        ),
        true,
        required
      );
    }
  }
);

test(
  "T4 assignment state remains local and does not mutate student work",
  () => {
    assert.match(
      workspace,
      /Assignment Setup stays in memory in this page only\./
    );

    assert.match(
      workspace,
      /Nothing here[\s\S]*student projects\./
    );

    assert.match(
      workspace,
      /Due dates are planning information only\./
    );

    assert.equal(
      /\bfetch\s*\(/.test(
        workspace
      ),
      false
    );

    for (
      const forbidden
      of [
        ".innerHTML =",
        ".innerHTML=",
        "insertAdjacentHTML",
        "localStorage",
        "indexedDB",
        "XMLHttpRequest",
        "WebSocket",
        "FormData"
      ]
    ) {
      assert.equal(
        workspace.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }
  }
);

test(
  "T4 Assignment Setup supports local import preview download and safe replacement",
  () => {
    for (
      const required
      of [
        "await file.text()",
        "JSON.parse(",
        "window.confirm(",
        "URL.createObjectURL(",
        "new Blob(",
        "assignmentFilename(",
        "rms-assignment-setup-",
        "assignmentSetupPreview.textContent ="
      ]
    ) {
      assert.equal(
        workspace.includes(
          required
        ),
        true,
        required
      );
    }

    assert.match(
      workspace,
      /Replace the current in-memory assignment draft/
    );

    assert.match(
      workspace,
      /Student projects were not modified\./
    );
  }
);

test(
  "T4 preserves the fixed Teacher Workspace structure",
  () => {
    const primaryAreas =
      [
        "overview",
        "review-queue",
        "students",
        "assignment-setup",
        "analytics",
        "chat-controls",
        "recovery"
      ];

    for (
      const area
      of primaryAreas
    ) {
      assert.equal(
        workspace.includes(
          `data-workspace-panel="${area}"`
        ),
        true,
        area
      );
    }

    assert.equal(
      (
        workspace.match(
          /Reserved for a later milestone\./g
        ) ||
        []
      ).length,
      2
    );

    assert.match(
      workspace,
      /id="panel-analytics"[\s\S]*id="analyticsProjectCount"/
    );

    assert.match(
      workspace,
      /id="panel-chat-controls"[\s\S]*Reserved for a later milestone\./
    );

    assert.match(
      workspace,
      /id="panel-recovery"[\s\S]*Reserved for a later milestone\./
    );
  }
);


test(
  "T5 Analytics UI renders only descriptive packet aggregates",
  () => {
    for (
      const required
      of [
        'id="panel-analytics"',
        'id="analyticsProjectCount"',
        'id="analyticsZeroState"',
        'id="analyticsContent"',
        'id="analyticsStageReadiness"',
        'id="analyticsMilestoneStates"',
        'id="analyticsCourseSections"',
        'id="analyticsAwaitingTeacher"',
        'id="analyticsRevisionRequested"',
        'id="analyticsBlockers"',
        'id="analyticsEthicsReview"',
        'id="analyticsEthicsStop"',
        'id="analyticsLockedProtocols"',
        'id="analyticsStoredAnalysis"',
        'id="analyticsIncludedSources"',
        'id="analyticsVerifiedSources"',
        "deriveTeacherAnalytics",
        "function renderAnalytics(",
        "Stage readiness is packet-reported workflow status.",
        "Milestone-state distributions",
        "Course sections",
        "Literature-status presence"
      ]
    ) {
      assert.equal(
        workspace.includes(
          required
        ),
        true,
        required
      );
    }
  }
);

test(
  "T5 Analytics has a clear zero-packet state and interpretation boundaries",
  () => {
    assert.match(
      workspace,
      /Import student review packets to generate local,[\s\S]*descriptive workflow analytics\./
    );

    assert.match(
      workspace,
      /These counts describe packet-reported workflow status only\./
    );

    assert.match(
      workspace,
      /They are not grades, rankings, predictions, measures of[\s\S]*student ability/
    );

    assert.match(
      workspace,
      /Missing optional packet information remains unknown\./
    );

    assert.match(
      workspace,
      /raw dataset rows, full[\s\S]*Research Chat[\s\S]*transcripts/
    );
  }
);

test(
  "T5 Analytics remains text-safe local-only and view-only",
  () => {
    assert.equal(
      workspace.includes(
        "analyticsCourseSections.append("
      ),
      true
    );

    assert.equal(
      workspace.includes(
        "makeElement("
      ),
      true
    );

    for (
      const forbidden
      of [
        ".innerHTML =",
        ".innerHTML=",
        "insertAdjacentHTML",
        "localStorage",
        "indexedDB",
        "XMLHttpRequest",
        "WebSocket",
        "FormData"
      ]
    ) {
      assert.equal(
        workspace.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }

    assert.equal(
      /\bfetch\s*\(/.test(
        workspace
      ),
      false
    );
  }
);

test(
  "T5 Analytics exposes no grading ranking prediction or competency controls",
  () => {
    const analyticsPanel =
      workspace.match(
        /id="panel-analytics"[\s\S]*?(?=<section[\s\S]*?id="panel-chat-controls")/
      )?.[0] ||
      "";

    for (
      const forbidden
      of [
        'id="analyticsGrade',
        'id="analyticsRank',
        'id="analyticsRisk',
        'id="analyticsPrediction',
        'id="analyticsCompetency',
        'name="grade',
        'name="rank',
        'name="risk',
        'name="competency'
      ]
    ) {
      assert.equal(
        analyticsPanel.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }

    assert.equal(
      analyticsPanel.includes(
        "leaderboard"
      ),
      false
    );

    assert.equal(
      analyticsPanel.includes(
        "overall score"
      ),
      false
    );
  }
);

test(
  "T5 Analytics preserves seven areas and leaves only Chat Controls and Recovery reserved",
  () => {
    const primaryAreas =
      [
        "overview",
        "review-queue",
        "students",
        "assignment-setup",
        "analytics",
        "chat-controls",
        "recovery"
      ];

    for (
      const area
      of primaryAreas
    ) {
      assert.equal(
        workspace.includes(
          `data-workspace-panel="${area}"`
        ),
        true,
        area
      );
    }

    assert.equal(
      (
        workspace.match(
          /Reserved for a later milestone\./g
        ) ||
        []
      ).length,
      2
    );

    assert.doesNotMatch(
      workspace,
      /id="panel-analytics"[\s\S]{0,500}Reserved for a later milestone\./
    );

    assert.match(
      workspace,
      /id="panel-chat-controls"[\s\S]*Reserved for a later milestone\./
    );

    assert.match(
      workspace,
      /id="panel-recovery"[\s\S]*Reserved for a later milestone\./
    );
  }
);

test(
  "T5 Analytics is included in every imported-packet render cycle",
  () => {
    assert.match(
      workspace,
      /function renderAll\(\)[\s\S]{0,220}renderOverview\(\);[\s\S]{0,120}renderReviewQueue\(\);[\s\S]{0,120}renderStudents\(\);[\s\S]{0,120}renderAnalytics\(\);/
    );

    assert.match(
      workspace,
      /function clearImportedPackets\(\)[\s\S]*?renderAll\(\);/
    );
  }
);
