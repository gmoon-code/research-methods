import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const session = readFileSync(
  "assets/teacher-session.js",
  "utf8"
);

const page = readFileSync(
  "teacher.html",
  "utf8"
);

const flow = readFileSync(
  "assets/student-flow-ui.js",
  "utf8"
);

const app = readFileSync(
  "assets/app.js",
  "utf8"
);

const theme = readFileSync(
  "assets/moon-notes-theme.css",
  "utf8"
);

test(
  "teacher entry has no client-only activation bypass",
  () => {
    assert.doesNotMatch(
      session,
      /function\s+enter\s*\(/
    );

    assert.doesNotMatch(
      page,
      /\.enter\s*\(/
    );

    assert.doesNotMatch(
      session,
      /rms_teacher_mode_v1/
    );

    assert.doesNotMatch(
      flow,
      /\?mode=teacher/
    );
  }
);

test(
  "teacher code uses a password field and is not persisted",
  () => {
    assert.match(
      page,
      /type="password"/
    );

    assert.match(
      page,
      /RMSTeacherSession[\s\S]*\.login\(code\)/
    );

    assert.doesNotMatch(
      page,
      /localStorage/
    );

    assert.doesNotMatch(
      session,
      /localStorage/
    );
  }
);

test(
  "teacher authentication uses signed Worker session endpoints",
  () => {
    assert.match(
      session,
      /\/teacher\/session/
    );

    assert.match(
      session,
      /\/teacher\/session\/verify/
    );

    assert.match(
      session,
      /X-RMS-Teacher-Code/
    );

    assert.match(
      session,
      /X-RMS-Teacher-Session/
    );

    assert.match(
      session,
      /sessionStorage/
    );
  }
);

test(
  "More verifies the authenticated session before showing teacher tools",
  () => {
    assert.match(
      flow,
      /async function openMore\(\)/
    );

    assert.match(
      flow,
      /RMSTeacherSession[\s\S]{0,160}\?\.verify\?\.\(\)/
    );

    assert.doesNotMatch(
      flow,
      /URLSearchParams[\s\S]{0,100}teacher/
    );
  }
);

test(
  "teacher entry loads runtime configuration before teacher session code",
  () => {
    const runtime =
      page.indexOf(
        "./assets/runtime-config.js"
      );

    const teacherSession =
      page.indexOf(
        "./assets/teacher-session.js"
      );

    assert.ok(
      runtime >= 0,
      "teacher.html must load runtime-config.js"
    );

    assert.ok(
      teacherSession >= 0,
      "teacher.html must load teacher-session.js"
    );

    assert.ok(
      runtime < teacherSession,
      "runtime-config.js must load before teacher-session.js"
    );
  }
);

test(
  "More menu has one primary click path and blocks concurrent opening",
  () => {
    assert.doesNotMatch(
      app,
      /\$\("moreMenuBtn"\)\.onclick/
    );

    assert.match(
      flow,
      /"#moreMenuBtn"/
    );

    assert.match(
      flow,
      /let moreOpening = false;/
    );

    assert.match(
      flow,
      /if \(moreOpening\) return;/
    );

    assert.match(
      flow,
      /id\("leaveTeacherMode"\)\?\.[\s\S]{0,300}RMSTeacherSession\?\.leave\?\.\(\)[\s\S]{0,150}location\.href = "\.\/";/
    );
  }
);

test(
  "future-stage preview uses an intentional read-only separator",
  () => {
    const separator =
      String.fromCharCode(183);

    assert.ok(
      theme.includes(
        'content: "PREVIEW ' +
        separator +
        ' READ ONLY";'
      )
    );

    assert.doesNotMatch(
      theme,
      /PREVIEW \? READ ONLY/
    );
  }
);
