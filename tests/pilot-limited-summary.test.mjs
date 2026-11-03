import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/pilot.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../assets/pilot-ui.js', import.meta.url), 'utf8');
const secret = 'PRIVATE-DO-NOT-EXPORT-LEVEL-9';

function actualPilot() {
  const map = new Map();
  const window = { dispatchEvent() {}, addEventListener() {} };
  vm.runInNewContext(source, {
    window, localStorage: {
      getItem(key) { return map.get(key) ?? null; },
      setItem(key, value) { map.set(key, String(value)); },
      removeItem(key) { map.delete(key); }
    },
    Blob, Date, Math, JSON,
    CustomEvent: class { constructor(_type, options) { this.detail = options?.detail; } }
  }, { filename: 'assets/pilot.js' });
  return window.RMSPilot;
}

function project() {
  return {
    name: secret + ' student name', context: secret + ' background', currentStage: 7,
    data: { finalRQ: secret + ' research question', hypothesis: secret + ' private plan' },
    sources: [{ id: secret, title: secret, authors: secret, themes: [secret], themeEvidence: secret }],
    searchLog: [{ database: secret, query: secret, notes: secret }],
    litClaims: [{ text: secret, sourceIds: [secret] }],
    schema: [{ name: secret, type: secret }],
    methods: { ethics: { participants: secret, risks: secret, consent: secret } },
    analysis: { rawData: [{ participant: secret }], fileName: secret, runs: [{ explanation: secret }] },
    writing: { sections: { introduction: secret, discussion: secret, empty: '' } },
    aiHelper: { lastField: { value: secret }, messages: [{ role: 'user', content: secret }], events: [{ content: secret }] },
    pilot: { config: { teacherReviewProcess: secret, rawDataLocation: secret }, restoreHistory: [{ details: secret }] },
    reviews: [{ messages: [secret] }], notes: secret, studentIdentity: secret
  };
}

test('reduced progress export has an exact nontext allowlist and never serializes sensitive notebook text', () => {
  const P = actualPilot();
  const input = project();
  const before = JSON.stringify(input);
  const envelope = P.backupEnvelope(input, 'privacy');
  const expectedKeys = ['copy_type', 'current_stage', 'activity_counts'];
  assert.deepEqual(Object.keys(envelope.project), expectedKeys);
  assert.deepEqual(JSON.parse(JSON.stringify(envelope.project)), {
    copy_type: 'limited_progress_summary',
    current_stage: 7,
    activity_counts: {
      source_records: 1,
      search_log_records: 1,
      literature_claims: 1,
      schema_fields: 1,
      analysis_runs: 1,
      written_sections: 2
    }
  });
  assert.doesNotMatch(JSON.stringify(envelope), /PRIVATE-DO-NOT-EXPORT-LEVEL-9/);
  assert.equal(JSON.stringify(input), before, 'summary must not mutate source project');
});

test('unknown and free-text metadata properties cannot enter allowlisted reduced export', () => {
  const P = actualPilot();
  const input = project();
  input.currentStage = secret;
  input.studioExtras = { participantRecords: secret };
  input.pathway = { selected: secret };
  input.data.priorAssessment = [secret];
  input.aiHelper.messages[0].attachment = secret;
  const e = P.backupEnvelope(input, 'privacy');
  assert.equal(e.project.current_stage, null);
  assert.doesNotMatch(JSON.stringify(e), /PRIVATE-DO-NOT-EXPORT-LEVEL-9/);
  assert.deepEqual(Object.keys(e.project.activity_counts), [
    'source_records', 'search_log_records', 'literature_claims',
    'schema_fields', 'analysis_runs', 'written_sections'
  ]);
});

test('privacy export remains a nonrestorable packet and warns against assuming anonymity', () => {
  const P = actualPilot();
  const e = P.backupEnvelope(project(), 'privacy');
  const validation = P.validateBackup(e);
  assert.equal(validation.ok, true);
  assert.equal(validation.restorable, false);
  assert.match(validation.error, /cannot be used as recovery backups/);
  assert.match(e.warning, /not anonymous/);
  assert.match(e.warning, /not.*recovery backup/);
  assert.match(e.warning, /creation time/);
  assert.match(P.backupFilename({ name: secret }, 'privacy'), /-progress-summary-/);
  assert.doesNotMatch(P.backupFilename({ name: secret }, 'privacy'), /privacy-copy/);
});

test('full recovery backups remain complete, readable and restorable', () => {
  const P = actualPilot();
  const input = project();
  const e = P.backupEnvelope(input, 'full');
  assert.equal(e.mode, 'full');
  assert.match(JSON.stringify(e.project), /PRIVATE-DO-NOT-EXPORT-LEVEL-9/);
  const validation = P.validateBackup(e);
  assert.equal(validation.ok, true);
  assert.equal(validation.restorable, true);
  assert.equal(validation.project.name, input.name);
});

test('summary does not leak sensitive content through source records or Chat history', () => {
  const P = actualPilot();
  const input = project();
  input.sources.push({ citation: secret, notes: secret, respondent: { name: secret } });
  input.aiHelper.messages.push({ content: secret, tool_result: secret });
  input.writing.sections.results = secret;
  const e = P.backupEnvelope(input, 'privacy');
  assert.equal(e.project.activity_counts.source_records, 2);
  assert.equal(e.project.activity_counts.written_sections, 3);
  assert.doesNotMatch(JSON.stringify(e), /PRIVATE-DO-NOT-EXPORT-LEVEL-9/);
  assert.equal(e.project.aiHelper, undefined);
  assert.equal(e.project.data, undefined);
  assert.equal(e.project.sources, undefined);
});

test('UI names this a limited summary and warns it cannot restore or ensure safe sharing', () => {
  assert.match(uiSource, /Download limited progress summary \(JSON\)/);
  assert.match(uiSource, /not guaranteed anonymous or approved for sharing/);
  assert.match(uiSource, /It cannot restore your work/);
  assert.match(uiSource, /Check the file and your school/);
  assert.doesNotMatch(uiSource, /Download privacy-minimized copy/);
});
