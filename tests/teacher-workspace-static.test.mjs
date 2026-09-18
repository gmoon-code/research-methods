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

    const adapter =
      workspace.indexOf(
        "./assets/ai-adapter.js"
      );

    const pilot =
      workspace.indexOf(
        "./assets/pilot.js"
      );

    const data =
      workspace.indexOf(
        "./assets/teacher-workspace-data.js"
      );

    assert.ok(runtime >= 0);
    assert.ok(session >= 0);
    assert.ok(adapter >= 0);
    assert.ok(pilot >= 0);
    assert.ok(data >= 0);
    assert.ok(runtime < session);
    assert.ok(session < adapter);
    assert.ok(adapter < pilot);
    assert.ok(pilot < data);

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
        "./assets/ai-adapter.js",
        "./assets/pilot.js",
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
      0
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
  "T3 preserves its seven-area and competency boundaries after later milestones",
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
      0
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
      0
    );

    assert.match(
      workspace,
      /id="panel-analytics"[\s\S]*id="analyticsProjectCount"/
    );

    assert.match(
      workspace,
      /id="panel-chat-controls"[\s\S]*id="chatLocalEnabled"/
    );

    const recoveryPanel =
      workspace.match(
        /<section[^>]*id="panel-recovery"[\s\S]*?<\/section>/
      )?.[0] || "";

    assert.doesNotMatch(
      recoveryPanel,
      /Reserved for a later milestone\./
    );

    assert.match(
      recoveryPanel,
      /id="recoveryBackupFile"/
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
  "T6 Chat Controls preserves all seven workspace areas after T7",
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

    const chatPanel =
      workspace.match(
        /<section[^>]*id="panel-chat-controls"[\s\S]*?<\/section>/
      )?.[0] || "";

    assert.notEqual(
      chatPanel,
      ""
    );

    assert.equal(
      chatPanel.includes(
        "Reserved for a later milestone."
      ),
      false
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

test(
  "T6 Chat Controls exposes truthful current-browser controls",
  () => {
    for (
      const required
      of [
        'id="panel-chat-controls"',
        'id="chatServiceConfigured"',
        'id="chatEndpointOrigin"',
        'id="chatRuntimeVersion"',
        'id="chatEdition"',
        'id="chatTeacherSessionStatus"',
        'id="chatLocalEnabled"',
        'id="chatLocalEnabledStatus"',
        'id="chatClassCodeStatus"',
        'id="clearClassChatCode"'
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
      /This browser session only\./
    );

    assert.match(
      workspace,
      /do not change another device/
    );

    assert.match(
      workspace,
      /do not\s+apply settings to students as a class/
    );

    assert.match(
      workspace,
      /No class-wide Chat policy is available in this version\./
    );
  }
);

test(
  "T6 Chat Controls uses the committed pure status API and existing Research Chat adapter",
  () => {
    assert.match(
      workspace,
      /deriveTeacherChatControlsStatus/
    );

    assert.match(
      workspace,
      /window\.RMSAI/
    );

    assert.match(
      workspace,
      /chat\.getConfig\(\)/
    );

    assert.match(
      workspace,
      /chat\.setConfig\(\{[\s\S]*enabled:/
    );

    assert.match(
      workspace,
      /chat\.clearAccessCode\(\)/
    );

    assert.doesNotMatch(
      workspace,
      /setConfig\(\{[\s\S]{0,120}(?:endpoint|chatEndpoint|researchChatEndpoint)/
    );
  }
);

test(
  "T6 Chat Controls keeps endpoint credentials and transcript content inaccessible",
  () => {
    assert.doesNotMatch(
      workspace,
      /id="chatEndpoint(?:Input|Editor|Field)"/
    );

    assert.doesNotMatch(
      workspace,
      /type="password"[\s\S]{0,160}Chat/
    );

    assert.doesNotMatch(
      workspace,
      /aiHelper\.messages/
    );

    assert.doesNotMatch(
      workspace,
      /aiHelper\.events/
    );

    assert.doesNotMatch(
      workspace,
      /getAccessCode\(\)/
    );

    assert.match(
      workspace,
      /The code value is never shown\./
    );

    assert.match(
      workspace,
      /Teacher access codes and signed session tokens are never[\s\S]*displayed/
    );
  }
);

test(
  "T6 Chat Controls preserves student ownership of project context",
  () => {
    assert.match(
      workspace,
      /Use my current project context/
    );

    assert.match(
      workspace,
      /Teacher Workspace cannot force that setting on or off\./
    );

    assert.doesNotMatch(
      workspace,
      /id="[^"]*(?:force|require|block)[^"]*Context/i
    );
  }
);

test(
  "T6 Chat Controls introduces no policy network path or new persistence mechanism",
  () => {
    const start =
      workspace.indexOf(
        "function currentChatControlsStatus()"
      );

    const end =
      workspace.indexOf(
        "function renderAll()",
        start
      );

    assert.ok(
      start >= 0
    );

    assert.ok(
      end > start
    );

    const chatLogic =
      workspace.slice(
        start,
        end
      );

    assert.doesNotMatch(
      chatLogic,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      chatLogic,
      /XMLHttpRequest/
    );

    assert.doesNotMatch(
      chatLogic,
      /localStorage/
    );

    assert.doesNotMatch(
      chatLogic,
      /sessionStorage/
    );

    assert.doesNotMatch(
      chatLogic,
      /\/teacher\/chat/i
    );

    assert.doesNotMatch(
      chatLogic,
      /\/chat\/policy/i
    );
  }
);

test(
  "T6 Chat Controls keeps dynamic status rendering text-safe",
  () => {
    const start =
      workspace.indexOf(
        "function renderChatControls()"
      );

    const end =
      workspace.indexOf(
        "function bindChatControls()",
        start
      );

    assert.ok(
      start >= 0
    );

    assert.ok(
      end > start
    );

    const renderer =
      workspace.slice(
        start,
        end
      );

    assert.match(
      renderer,
      /\.textContent\s*=/
    );

    assert.doesNotMatch(
      renderer,
      /\.innerHTML\s*=/
    );

    assert.doesNotMatch(
      renderer,
      /insertAdjacentHTML/
    );
  }
);

test(
  "T6 Chat Controls is independent of imported student review packets",
  () => {
    const start =
      workspace.indexOf(
        "function currentChatControlsStatus()"
      );

    const end =
      workspace.indexOf(
        "function renderChatControls()",
        start
      );

    const statusReader =
      workspace.slice(
        start,
        end
      );

    assert.doesNotMatch(
      statusReader,
      /importedPackets/
    );

    assert.doesNotMatch(
      statusReader,
      /selectedProjectId/
    );

    assert.doesNotMatch(
      statusReader,
      /student_alias/
    );
  }
);

test(
  "T7 Recovery initializes only after the Teacher Workspace data layer is assigned",
  () => {
    assert.match(
      workspace,
      /let recoveryInspection\s*=\s*null;/
    );

    assert.doesNotMatch(
      workspace,
      /let recoveryInspection\s*=\s*teacherData[\s\S]{0,100}deriveTeacherRecoveryInspection/
    );

    const initStart =
      workspace.indexOf(
        "function initializeDataWorkspace("
      );

    const initEnd =
      workspace.indexOf(
        "for (const button of navButtons)",
        initStart
      );

    assert.ok(
      initStart >= 0
    );

    assert.ok(
      initEnd > initStart
    );

    const initLogic =
      workspace.slice(
        initStart,
        initEnd
      );

    const assignment =
      initLogic.indexOf(
        "teacherData = data;"
      );

    const recovery =
      initLogic.indexOf(
        "deriveTeacherRecoveryInspection()"
      );

    const render =
      initLogic.indexOf(
        "renderAll();"
      );

    assert.ok(
      assignment >= 0
    );

    assert.ok(
      recovery > assignment
    );

    assert.ok(
      render > recovery
    );
  }
);

test(
  "T7 Recovery makes the seventh workspace area functional",
  () => {
    const recoveryPanel =
      workspace.match(
        /<section[^>]*id="panel-recovery"[\s\S]*?<\/section>/
      )?.[0] || "";

    assert.notEqual(
      recoveryPanel,
      ""
    );

    assert.equal(
      (
        workspace.match(
          /Reserved for a later milestone\./g
        ) || []
      ).length,
      0
    );

    assert.match(
      recoveryPanel,
      /id="recoveryBackupFile"/
    );

    assert.match(
      recoveryPanel,
      /id="clearRecoveryInspection"/
    );

    assert.match(
      recoveryPanel,
      /id="openStudentRecovery"/
    );
  }
);

test(
  "T7 Recovery loads the existing project validator and pure inspection model",
  () => {
    assert.match(
      workspace,
      /<script src="\.\/assets\/pilot\.js"><\/script>/
    );

    assert.match(
      workspace,
      /deriveTeacherRecoveryInspection/
    );

    assert.match(
      workspace,
      /pilot\.validateBackup\(\s*parsed\s*\)/
    );
  }
);

test(
  "T7 Recovery accepts one local JSON file and enforces the 25 MiB pre-read limit",
  () => {
    assert.match(
      workspace,
      /id="recoveryBackupFile"[\s\S]*type="file"[\s\S]*accept="\.json,application\/json"/
    );

    assert.match(
      workspace,
      /const RECOVERY_MAX_FILE_BYTES =\s*26214400/
    );

    const start =
      workspace.indexOf(
        "async function inspectRecoveryFile("
      );

    const end =
      workspace.indexOf(
        "function bindRecovery()",
        start
      );

    assert.ok(
      start >= 0
    );

    assert.ok(
      end > start
    );

    const logic =
      workspace.slice(
        start,
        end
      );

    const sizeCheck =
      logic.indexOf(
        "fileSize >"
      );

    const fileRead =
      logic.indexOf(
        "await file.text()"
      );

    assert.ok(
      sizeCheck >= 0
    );

    assert.ok(
      fileRead > sizeCheck
    );
  }
);

test(
  "T7 Recovery never invokes student project storage or restore mutation APIs",
  () => {
    const start =
      workspace.indexOf(
        "const RECOVERY_MAX_FILE_BYTES"
      );

    const end =
      workspace.indexOf(
        "function renderAll()",
        start
      );

    assert.ok(
      start >= 0
    );

    assert.ok(
      end > start
    );

    const recoveryLogic =
      workspace.slice(
        start,
        end
      );

    for (
      const forbidden
      of [
        "safeLoad(",
        "safeSave(",
        "clearProjectStorage(",
        "applyRestore(",
        "storageReport(",
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "research_methods_studio_v1",
        "XMLHttpRequest"
      ]
    ) {
      assert.equal(
        recoveryLogic.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }

    assert.doesNotMatch(
      recoveryLogic,
      /\bfetch\s*\(/
    );
  }
);

test(
  "T7 Recovery renders selected-file metadata only through textContent",
  () => {
    const start =
      workspace.indexOf(
        "function renderRecoveryInspection()"
      );

    const end =
      workspace.indexOf(
        "function clearRecoveryInspectionState()",
        start
      );

    assert.ok(
      start >= 0
    );

    assert.ok(
      end > start
    );

    const renderer =
      workspace.slice(
        start,
        end
      );

    assert.match(
      renderer,
      /\.textContent\s*=/
    );

    assert.doesNotMatch(
      renderer,
      /\.innerHTML\s*=/
    );

    assert.doesNotMatch(
      renderer,
      /insertAdjacentHTML/
    );
  }
);

test(
  "T7 Recovery never renders project contents",
  () => {
    const start =
      workspace.indexOf(
        "async function inspectRecoveryFile("
      );

    const end =
      workspace.indexOf(
        "function bindRecovery()",
        start
      );

    const logic =
      workspace.slice(
        start,
        end
      );

    assert.doesNotMatch(
      logic,
      /parsed\.project/
    );

    assert.doesNotMatch(
      logic,
      /validation\.project/
    );

    assert.doesNotMatch(
      logic,
      /rawData/
    );

    assert.doesNotMatch(
      logic,
      /writing\.sections/
    );
  }
);

test(
  "T7 Recovery exposes only a student-site handoff for actual restoration",
  () => {
    const recoveryPanel =
      workspace.match(
        /<section[^>]*id="panel-recovery"[\s\S]*?<\/section>/
      )?.[0] || "";

    assert.match(
      recoveryPanel,
      /id="openStudentRecovery"[\s\S]*href="\.\/"[\s\S]*target="_blank"/
    );

    assert.match(
      recoveryPanel,
      /does not transfer this selected file automatically/
    );

    assert.match(
      recoveryPanel,
      /valid full backup can be restored only through the[\s\S]*existing student-site recovery flow/
    );
  }
);

test(
  "T7 Recovery keeps privacy copies non-restorable in the UI path",
  () => {
    assert.match(
      workspace,
      /openStudentRecovery[\s\S]*hidden =[\s\S]*!status\.recovery[\s\S]*\.restorable/
    );

    assert.match(
      workspace,
      /privacy-minimized[\s\S]*intentionally non-restorable/
    );
  }
);

test(
  "T7 Clear inspection resets only local Recovery inspection state",
  () => {
    const start =
      workspace.indexOf(
        "function clearRecoveryInspectionState()"
      );

    const end =
      workspace.indexOf(
        "async function inspectRecoveryFile(",
        start
      );

    assert.ok(
      start >= 0
    );

    assert.ok(
      end > start
    );

    const clearLogic =
      workspace.slice(
        start,
        end
      );

    assert.match(
      clearLogic,
      /deriveTeacherRecoveryInspection\(\)/
    );

    assert.match(
      clearLogic,
      /fileInput\.value\s*=\s*""/
    );

    for (
      const forbidden
      of [
        "importedPackets",
        "reviewDraft",
        "assignmentDraft",
        "RMSTeacherSession",
        "RMSAI",
        "localStorage",
        "sessionStorage"
      ]
    ) {
      assert.equal(
        clearLogic.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }
  }
);

test(
  "T7 Recovery explains transient Teacher Workspace recovery boundaries",
  () => {
    const recoveryPanel =
      workspace.match(
        /<section[^>]*id="panel-recovery"[\s\S]*?<\/section>/
      )?.[0] || "";

    assert.match(
      recoveryPanel,
      /rms_student_review/
    );

    assert.match(
      recoveryPanel,
      /rms_teacher_feedback/
    );

    assert.match(
      recoveryPanel,
      /rms_assignment_setup/
    );

    assert.match(
      recoveryPanel,
      /Reloading the page cannot recreate work that[\s\S]*was never downloaded/
    );
  }
);
