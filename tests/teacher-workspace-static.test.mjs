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
      /leaveButton\.addEventListener\([\s\S]{0,420}teacherSession\.leave\(\);[\s\S]{0,120}location\.replace\("\.\/"\);/
    );
  }
);

test(
  "teacher workspace loads only the established teacher authentication dependencies",
  () => {
    const runtime =
      workspace.indexOf(
        "./assets/runtime-config.js"
      );

    const session =
      workspace.indexOf(
        "./assets/teacher-session.js"
      );

    assert.ok(runtime >= 0);
    assert.ok(session >= 0);
    assert.ok(runtime < session);

    const externalScripts = [
      ...workspace.matchAll(
        /<script\s+src="([^"]+)"/g
      )
    ].map(match => match[1]);

    assert.deepEqual(
      externalScripts,
      [
        "./assets/runtime-config.js",
        "./assets/teacher-session.js"
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
  "T1 shell does not implement packet, database, or student-account behavior",
  () => {
    assert.doesNotMatch(
      workspace,
      /rms_student_review/
    );

    assert.doesNotMatch(
      workspace,
      /WebSocket/
    );

    assert.doesNotMatch(
      workspace,
      /new\s+Worker\s*\(/
    );

    assert.doesNotMatch(
      workspace,
      /studentAccount|student_account|student-account/i
    );
  }
);
