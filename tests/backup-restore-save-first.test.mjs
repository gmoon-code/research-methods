import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const pilotSource = readFileSync(new URL('../assets/pilot.js', import.meta.url), 'utf8');
const uiSource = readFileSync(new URL('../assets/pilot-ui.js', import.meta.url), 'utf8');

function restoreHarness({ confirmation = true } = {}) {
  const storage = new Map();
  const state = {
    blocked: false, confirmed: confirmation, confirmationCalls: 0,
    reloads: 0, scheduledReloads: 0, regularSaveCalls: 0
  };
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) {
      if (state.blocked) throw new Error('Browser storage is unavailable');
      storage.set(key, String(value));
    },
    removeItem(key) {
      if (state.blocked) throw new Error('Browser storage is unavailable');
      storage.delete(key);
    }
  };
  const ui = Object.fromEntries(
    ['restoreBackup', 'restoreStatus', 'closePilot'].map(id => [id, { files: [], innerHTML: '', onclick: null, onchange: null }])
  );
  const wrap = {
    innerHTML: '', onclick: null, remove() {}
  };
  const win = { dispatchEvent() {}, addEventListener() {} };
  const ctx = {
    window: win, localStorage, Blob, Math, Date, JSON,
    CustomEvent: class { constructor(name, args) { this.type = name; this.detail = args?.detail; } },
    document: {
      body: { appendChild(el) { assert.equal(el, wrap); } },
      createElement(tag) { assert.equal(tag, 'div'); return wrap; },
      getElementById(id) { return ui[id] || null; },
      querySelectorAll() { return []; }
    },
    confirm(message) {
      assert.match(message, /Current browser project will be replaced/);
      state.confirmationCalls++;
      return state.confirmed;
    },
    setTimeout(fn) {
      state.scheduledReloads++;
      state.pendingReload = fn;
      return state.scheduledReloads;
    },
    location: { reload() { state.reloads++; } },
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} }
  };
  vm.runInNewContext(pilotSource, ctx, { filename: 'assets/pilot.js' });
  vm.runInNewContext(uiSource, ctx, { filename: 'assets/pilot-ui.js' });
  const Pilot = win.RMSPilot;
  const current = {
    name: 'Current research', data: { finalRQ: 'Original private research question' },
    pilot: { config: {} }
  };
  const restored = {
    name: 'Recovered research', data: { finalRQ: 'Backup research question' },
    pilot: { config: {} }
  };
  const key = 'research_methods_studio_v1';
  assert.equal(Pilot.safeSave(key, current).ok, true);
  const originalStored = localStorage.getItem(key);
  win.RMSPilotUI.open(current, () => { state.regularSaveCalls++; return Pilot.safeSave(key, current); }, key, 'backup');
  return {
    current, restored, Pilot, key, localStorage, originalStored, ui, wrap, state,
    select(packet) { ui.restoreBackup.files = [{ text: async () => JSON.stringify(packet) }]; },
    selectText(text) { ui.restoreBackup.files = [{ text: async () => text }]; },
    async restore() { await ui.restoreBackup.onchange(); }
  };
}

test('valid full backup persists before replacing current in-memory object', async () => {
  const h = restoreHarness();
  h.select(h.Pilot.backupEnvelope(h.restored, 'full'));
  await h.restore();
  assert.equal(h.current.name, 'Recovered research');
  assert.equal(h.current.data.finalRQ, 'Backup research question');
  assert.equal(h.Pilot.safeLoad(h.key).project.name, 'Recovered research');
  assert.equal(h.state.regularSaveCalls, 0);
  assert.equal(h.state.scheduledReloads, 1);
  assert.match(h.ui.restoreStatus.innerHTML, /Backup restored successfully/);
});

test('storage failure preserves current in-memory project and prior stored project', async () => {
  const h = restoreHarness();
  h.select(h.Pilot.backupEnvelope(h.restored, 'full'));
  h.state.blocked = true;
  await h.restore();
  assert.equal(h.current.name, 'Current research');
  assert.equal(h.current.data.finalRQ, 'Original private research question');
  assert.equal(h.localStorage.getItem(h.key), h.originalStored);
  assert.equal(h.state.scheduledReloads, 0);
  assert.equal(h.state.reloads, 0);
  assert.match(h.ui.restoreStatus.innerHTML, /restored project could not be saved/);
});

test('cancelled restore leaves both working copy and saved copy unchanged', async () => {
  const h = restoreHarness({ confirmation: false });
  h.select(h.Pilot.backupEnvelope(h.restored, 'full'));
  await h.restore();
  assert.equal(h.state.confirmationCalls, 1);
  assert.equal(h.current.name, 'Current research');
  assert.equal(h.localStorage.getItem(h.key), h.originalStored);
  assert.equal(h.state.scheduledReloads, 0);
});

test('invalid JSON is rejected before confirmation or mutation', async () => {
  const h = restoreHarness();
  h.selectText('not a JSON backup');
  await h.restore();
  assert.equal(h.state.confirmationCalls, 0);
  assert.equal(h.current.name, 'Current research');
  assert.equal(h.localStorage.getItem(h.key), h.originalStored);
  assert.match(h.ui.restoreStatus.innerHTML, /Unexpected token|JSON/);
});

test('tampered checksum backup fails without replacing current project', async () => {
  const h = restoreHarness();
  const packet = h.Pilot.backupEnvelope(h.restored, 'full');
  packet.project.name = 'Modified without checksum update';
  h.select(packet);
  await h.restore();
  assert.equal(h.state.confirmationCalls, 0);
  assert.equal(h.current.name, 'Current research');
  assert.equal(h.localStorage.getItem(h.key), h.originalStored);
  assert.match(h.ui.restoreStatus.innerHTML, /fingerprint/);
});

test('privacy-minimized copy cannot be restored as complete project', async () => {
  const h = restoreHarness();
  h.select(h.Pilot.backupEnvelope(h.restored, 'privacy'));
  await h.restore();
  assert.equal(h.state.confirmationCalls, 0);
  assert.equal(h.current.name, 'Current research');
  assert.equal(h.localStorage.getItem(h.key), h.originalStored);
  assert.match(h.ui.restoreStatus.innerHTML, /cannot be used as recovery backups/);
});
