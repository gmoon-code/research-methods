import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const index = read("index.html");
const app = read("assets/app.js");
const flowUI = read("assets/student-flow-ui.js");
const journey = read("assets/journey.js");
const journeyUI = read("assets/journey-ui.js");
const snapshotUI = read("assets/research-snapshot-ui.js");
const snapshot = read("assets/research-snapshot.js");
const competencyUI = read("assets/competency-ui.js");
const methods = read("assets/methods.js");
const pathCoach = read("assets/path-coach.js");
const guidance = read("assets/student-guidance.js");
const rescue = read("assets/rescue-model.js");
const style = read("assets/style.css");
const theme = read("assets/moon-notes-theme.css");

test("student surface no longer exposes Teacher Dashboard or feedback workflow", () => {
  assert.doesNotMatch(index, /id="teacherBtn"|Teacher Dashboard/);
  assert.doesNotMatch(flowUI, /Teacher review & feedback|data-proxy-click="teacherBtn"|Teacher Dashboard/);
  assert.doesNotMatch(journeyUI, /teacher review packet|teacher feedback|Teacher Dashboard|data-submit-milestone|openTeacherDashboard/i);
  assert.doesNotMatch(snapshotUI, /Teacher feedback|teacher-review tools/i);
  assert.doesNotMatch(snapshot, /## Teacher feedback/i);
  assert.doesNotMatch(competencyUI, /teacher feedback|teacher rating|teacher-coded|teacher judgment/i);
  assert.doesNotMatch(app, /teacherBtn/);
  assert.match(flowUI, /My Research Journey/);
});

test("active student renderers use independent review language", () => {
  const renderers = [app, flowUI, journeyUI, snapshotUI, competencyUI, methods, pathCoach, guidance, rescue, style];
  for (const source of renderers) {
    assert.doesNotMatch(source, /Teacher Dashboard|teacher review|teacher feedback|Teacher mode|teacher-provided|teacher-coded|teacher-review tools/i);
  }
  assert.match(methods, /Method plan ready/);
  assert.match(pathCoach, /Method plan ready/);
  assert.match(app, /approval required/);
  assert.match(journey, /Appropriate formal approval is required for the proposed method/);
});

test("active journey milestones are independent", () => {
  assert.match(journey, /title:"Method Ready"/);
  assert.match(journey, /title:"Paper Ready"/);
  assert.equal((journey.match(/teacher:false/g) || []).length, 5);
  assert.match(journey, /const state=blockers\.length===0\?"complete":"blocked"/);
  assert.doesNotMatch(journeyUI, /Awaiting teacher|Ready to submit|Submit checkpoint/i);
});

test("ethics and approval safeguards remain", () => {
  assert.match(index, /school, institutional, or other formal approval/);
  assert.match(app, /school, institutional, supervisory, or other formal approval may be needed/);
  assert.match(journey, /Appropriate formal approval is required for the proposed method/);
  assert.match(methods, /appropriate consent\/permission route before collection/);
});

test("close controls cannot collapse around their label", () => {
  assert.match(theme, /\.modal \[id\^="close"\]/);
  assert.match(theme, /min-width:66px !important/);
  assert.match(theme, /white-space:nowrap !important/);
  assert.match(theme, /flex:0 0 auto !important/);
});


test("route modal is viewport-safe, internally scrollable, and uses a single-phase accordion", () => {
  assert.match(flowUI, /routeModalExpandedPhase/);
  assert.match(flowUI, /routeHTML\(p, true\)/);
  assert.match(flowUI, /Current phase opens first\. Select another phase to inspect its stages\./);
  assert.match(theme, /max-height:calc\(100dvh - 32px\) !important/);
  assert.match(theme, /#routeModalList\{/);
  assert.match(theme, /overflow-y:auto/);
  assert.match(theme, /scrollbar-gutter:stable/);
});

test("student header shows only stage progress for an active project", () => {
  assert.match(app, /project\.name\?`Stage \$\{project\.currentStage\} of 18`/);
  assert.doesNotMatch(app, /project\.name\?`\$\{project\.name\} · Stage/);
  assert.match(index, /<meta name="theme-color" content="#ffffff">/);
});
test("student palette uses the restrained v3.0.1 tokens", () => {
  assert.match(theme, /--moon-page:#ffffff/);
  assert.match(theme, /--section-yellow:#f3e7a1/);
  assert.match(theme, /--section-green:#dcebd2/);
  assert.match(theme, /--section-turquoise:#d1e9e7/);
  assert.match(theme, /--section-pink:#ecd9e1/);
  assert.match(index, /<title>Research Methods Studio<\/title>/);
  assert.doesNotMatch(index, /v2\.17\.1/);
});
