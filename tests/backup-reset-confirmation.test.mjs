import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the actual reset event-handler source with controlled browser affordances,
// so a future refactor cannot reintroduce deletion merely after a download click.
const app = readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const start = app.indexOf('  if($("resetProject"))$("resetProject").onclick=()=>{');
const end = app.indexOf('  if($("pilotBtn"))', start);
assert.ok(start >= 0 && end > start, 'actual application reset handler must exist');
const handlerSource = app.slice(start, end);

function modalHarness({ downloadThrows = false, clearResult } = {}) {
  const calls = { downloads: [], clears: [], reloads: 0, confirmations: [], removed: 0 };
  const elements = Object.fromEntries(
    ['resetProject', 'cancelNewProject', 'backupThenNew', 'newWithoutBackup',
      'backupNewConfirmation', 'backupFileConfirmed', 'confirmBackupNew', 'newProjectStatus'
    ].map(id => [id, { id, onclick: null, onchange: null, checked: false, disabled: id === 'confirmBackupNew', hidden: id === 'backupNewConfirmation', textContent: '' }])
  );
  const wrap = { id: '', innerHTML: '', onclick: null, remove() { calls.removed++; } };
  const ctx = {
    $: id => elements[id] || null,
    document: {
      createElement(type) { assert.equal(type, 'div'); return wrap; },
      body: { appendChild(node) { assert.equal(node, wrap); } }
    },
    Pilot: {
      backupEnvelope(project, mode) {
        assert.equal(mode, 'full');
        return { packet_type: 'rms_project_backup', version: '2.0', mode, project };
      },
      clearProjectStorage(key, options) {
        calls.clears.push({ key, options });
        return clearResult || { primary: true, recovery: true, meta: true };
      }
    },
    project: { name: 'Original project', data: { finalRQ: 'Private research notes' } },
    KEY: 'research_methods_studio_v1',
    download(name, body, type) {
      calls.downloads.push({ name, body: JSON.parse(body), type });
      if (downloadThrows) throw new Error('Browser blocked download');
    },
    confirm(message) {
      calls.confirmations.push(message);
      return ctx.nextConfirmation ?? false;
    },
    location: { reload() { calls.reloads++; } },
    setTimeout() { throw new Error('Reset must never schedule delayed deletion'); }
  };
  vm.runInNewContext(handlerSource, ctx, { filename: 'assets/app.js/resetProject' });
  elements.resetProject.onclick();
  return { calls, elements, wrap, ctx };
}

test('reset modal explains that requesting a download does not prove a file was saved', () => {
  const { wrap, calls, elements } = modalHarness();
  assert.match(wrap.innerHTML, /Starting a download does not confirm that the file was saved/);
  assert.match(wrap.innerHTML, /full recovery backup file/);
  assert.match(wrap.innerHTML, /id="backupFileConfirmed"/);
  assert.match(wrap.innerHTML, /id="confirmBackupNew" disabled/);
  assert.equal(elements.backupNewConfirmation.hidden, true);
  assert.equal(calls.clears.length, 0);
});

test('requesting a backup does not delete the local project or reload', () => {
  const { calls, elements } = modalHarness();
  elements.backupThenNew.onclick();
  assert.equal(calls.downloads.length, 1);
  assert.equal(calls.downloads[0].name, 'research-methods-studio-full-backup.json');
  assert.equal(calls.downloads[0].body.mode, 'full');
  assert.equal(calls.downloads[0].body.project.data.finalRQ, 'Private research notes');
  assert.equal(calls.downloads[0].type, 'application/json');
  assert.equal(calls.clears.length, 0);
  assert.equal(calls.reloads, 0);
  assert.equal(elements.confirmBackupNew.disabled, true);
  assert.equal(elements.backupNewConfirmation.hidden, false);
  assert.match(elements.newProjectStatus.textContent, /has not been cleared/);
});

test('cancelling after requesting a backup preserves the project', () => {
  const { calls, elements } = modalHarness();
  elements.backupThenNew.onclick();
  elements.cancelNewProject.onclick();
  assert.equal(calls.removed, 1);
  assert.equal(calls.clears.length, 0);
  assert.equal(calls.reloads, 0);
});

test('blocked download preserves project and does not reveal the confirmation path', () => {
  const { calls, elements } = modalHarness({ downloadThrows: true });
  elements.backupThenNew.onclick();
  assert.equal(calls.clears.length, 0);
  assert.equal(calls.reloads, 0);
  assert.equal(elements.backupNewConfirmation.hidden, true);
  assert.equal(elements.confirmBackupNew.disabled, true);
  assert.match(elements.newProjectStatus.textContent, /could not be started/);
});

test('confirmation is guarded by a checked box and an affirmative browser confirmation', () => {
  const { calls, elements, ctx } = modalHarness();
  elements.backupThenNew.onclick();
  elements.confirmBackupNew.onclick();
  assert.equal(calls.confirmations.length, 0);
  assert.equal(calls.clears.length, 0);
  elements.backupFileConfirmed.checked = true;
  elements.backupFileConfirmed.onchange();
  assert.equal(elements.confirmBackupNew.disabled, false);
  ctx.nextConfirmation = false;
  elements.confirmBackupNew.onclick();
  assert.equal(calls.confirmations.length, 1);
  assert.equal(calls.clears.length, 0);
  assert.equal(calls.reloads, 0);
  ctx.nextConfirmation = true;
  elements.confirmBackupNew.onclick();
  assert.equal(calls.clears.length, 1);
  assert.equal(calls.clears[0].key, 'research_methods_studio_v1');
  assert.equal(calls.clears[0].options.clearOnboarding, false);
  assert.equal(calls.reloads, 1);
});

test('starting a second backup requires fresh confirmation', () => {
  const { elements, calls } = modalHarness();
  elements.backupThenNew.onclick();
  elements.backupFileConfirmed.checked = true;
  elements.backupFileConfirmed.onchange();
  assert.equal(elements.confirmBackupNew.disabled, false);
  elements.backupThenNew.onclick();
  assert.equal(calls.downloads.length, 2);
  assert.equal(elements.backupFileConfirmed.checked, false);
  assert.equal(elements.confirmBackupNew.disabled, true);
  assert.equal(calls.clears.length, 0);
});

test('an unsuccessful storage clear never reports reset via reload', () => {
  const { elements, calls, ctx } = modalHarness({ clearResult: { primary: true, recovery: false, meta: true } });
  elements.backupThenNew.onclick();
  elements.backupFileConfirmed.checked = true;
  elements.backupFileConfirmed.onchange();
  ctx.nextConfirmation = true;
  elements.confirmBackupNew.onclick();
  assert.equal(calls.clears.length, 1);
  assert.equal(calls.reloads, 0);
  assert.match(elements.newProjectStatus.textContent, /could not be cleared completely/);
});

test('start-without-backup still requires affirmative warning and checks storage removal', () => {
  const { elements, calls, ctx } = modalHarness();
  elements.newWithoutBackup.onclick();
  assert.equal(calls.clears.length, 0);
  ctx.nextConfirmation = true;
  elements.newWithoutBackup.onclick();
  assert.equal(calls.clears.length, 1);
  assert.equal(calls.reloads, 1);
  assert.match(calls.confirmations[0], /without downloading a backup/);
});
