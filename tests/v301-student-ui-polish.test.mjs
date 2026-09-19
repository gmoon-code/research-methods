import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const index = read("index.html");
const app = read("assets/app.js");
const flowUI = read("assets/student-flow-ui.js");
const journey = read("assets/journey.js");
const journeyUI = read("assets/journey-ui.js");
const theme = read("assets/moon-notes-theme.css");

test("student surface no longer exposes Teacher Dashboard or feedback workflow", () => {
  assert.doesNotMatch(index, /id="teacherBtn"|Teacher Dashboard/);
  assert.doesNotMatch(flowUI, /Teacher review & feedback|data-proxy-click="teacherBtn"|Teacher Dashboard/);
  assert.doesNotMatch(journeyUI, /teacher review packet|teacher feedback|Teacher Dashboard|data-submit-milestone|openTeacherDashboard/i);
  assert.doesNotMatch(app, /teacherBtn/);
  assert.match(flowUI, /My Research Journey/);
});

test("active journey milestones are independent", () => {
  assert.match(journey, /title:"Method Ready"/);
  assert.match(journey, /title:"Paper Ready"/);
  assert.equal((journey.match(/teacher:false/g) || []).length, 5);
  assert.match(journey, /const state=blockers\.length===0\?"complete":"blocked"/);
  assert.doesNotMatch(journeyUI, /Awaiting teacher|Ready to submit|Submit checkpoint/i);
});

test("ethics and approval safety language remains", () => {
  assert.match(index, /school, institutional, or other formal approval/);
  assert.match(app, /teacher, school, institutional, or other approval is needed/);
  assert.match(journey, /Teacher\/institutional review is required for the proposed method/);
});

test("close controls cannot collapse around their label", () => {
  assert.match(theme, /\.modal \[id\^="close"\]/);
  assert.match(theme, /min-width:66px !important/);
  assert.match(theme, /white-space:nowrap !important/);
  assert.match(theme, /flex:0 0 auto !important/);
});

test("student palette uses the restrained v3.0.1 tokens", () => {
  assert.match(theme, /--moon-page:#f7f6f2/);
  assert.match(theme, /--section-yellow:#f3e7a1/);
  assert.match(theme, /--section-green:#dcebd2/);
  assert.match(theme, /--section-turquoise:#d1e9e7/);
  assert.match(theme, /--section-pink:#ecd9e1/);
  assert.match(index, /<title>Research Methods Studio<\/title>/);
  assert.doesNotMatch(index, /v2\.17\.1/);
});
