import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/pilot.js', import.meta.url), 'utf8');

function browser() {
  const map = new Map();
  const events = [];
  const flags = { failMeta: false, failPrimary: false, failRollback: false, concurrent: null, previousRaw: null };
  const storage = {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, val) {
      const value = String(val);
      if (flags.failPrimary && key === 'current-project') throw new Error('primary is unavailable');
      if (flags.failRollback && key === 'current-project' && value === flags.previousRaw) throw new Error('rollback blocked');
      if (flags.failMeta && key === 'current-project_pilot_meta_v2') {
        if (flags.concurrent) map.set('current-project', flags.concurrent);
        throw new Error('metadata write denied');
      }
      map.set(key, value);
    },
    removeItem(key) { map.delete(key); }
  };
  const win = { dispatchEvent(event) { events.push(event.detail); }, addEventListener() {} };
  vm.runInNewContext(source, {
    window: win, localStorage: storage, Blob, Math, Date, JSON,
    CustomEvent: class { constructor(type, props) { this.type = type; this.detail = props?.detail; } }
  }, { filename: 'assets/pilot.js' });
  const project = name => ({ name, data: { finalRQ: name + ' question' }, pilot: { config: {} } });
  return { Pilot: win.RMSPilot, storage, map, flags, events, project };
}

test('ordinary browser-local saves preserve their expected metadata and recovery behavior', () => {
  const h = browser();
  const first = h.Pilot.safeSave('current-project', h.project('Original'));
  assert.equal(first.ok, true);
  assert.equal(h.Pilot.safeLoad('current-project').project.name, 'Original');
  const second = h.Pilot.safeSave('current-project', h.project('Revision'));
  assert.equal(second.ok, true);
  assert.equal(h.Pilot.safeLoad('current-project').project.name, 'Revision');
  assert.equal(JSON.parse(h.storage.getItem('current-project_recovery_v2')).name, 'Original');
  assert.equal(h.events.at(-1).ok, true);
});

test('metadata write failure after primary write restores the earlier project when possible', () => {
  const h = browser();
  h.Pilot.safeSave('current-project', h.project('Original'));
  const previous = h.storage.getItem('current-project');
  h.flags.previousRaw = previous;
  h.flags.failMeta = true;
  const result = h.Pilot.safeSave('current-project', h.project('Replacement'));
  assert.equal(result.ok, false);
  assert.equal(result.rollback, 'restored');
  assert.equal(h.storage.getItem('current-project'), previous);
  assert.equal(h.Pilot.safeLoad('current-project').project.name, 'Original');
  assert.equal(h.events.at(-1).ok, false);
  assert.equal(h.events.at(-1).rollback, 'restored');
});

test('metadata failure on a first-ever save removes an otherwise orphaned new primary', () => {
  const h = browser();
  h.flags.failMeta = true;
  const result = h.Pilot.safeSave('current-project', h.project('New but uncommitted'));
  assert.equal(result.ok, false);
  assert.equal(result.rollback, 'restored');
  assert.equal(h.storage.getItem('current-project'), null);
});

test('primary write failure leaves previous project untouched and needs no rollback', () => {
  const h = browser();
  h.Pilot.safeSave('current-project', h.project('Original'));
  const previous = h.storage.getItem('current-project');
  h.flags.failPrimary = true;
  const result = h.Pilot.safeSave('current-project', h.project('Rejected'));
  assert.equal(result.ok, false);
  assert.equal(result.rollback, 'not-needed');
  assert.equal(h.storage.getItem('current-project'), previous);
});

test('failed best-effort rollback warns rather than claiming unchanged storage', () => {
  const h = browser();
  h.Pilot.safeSave('current-project', h.project('Original'));
  h.flags.previousRaw = h.storage.getItem('current-project');
  h.flags.failMeta = true;
  h.flags.failRollback = true;
  const result = h.Pilot.safeSave('current-project', h.project('Uncertain replacement'));
  assert.equal(result.ok, false);
  assert.equal(result.rollback, 'failed');
  assert.equal(h.Pilot.safeLoad('current-project').project.name, 'Uncertain replacement');
  assert.match(h.events.at(-1).message, /may have changed.*Export your open project/);
});

test('concurrent browser-tab replacement is not overwritten by an attempted rollback', () => {
  const h = browser();
  h.Pilot.safeSave('current-project', h.project('Original'));
  h.flags.failMeta = true;
  h.flags.concurrent = JSON.stringify(h.project('Newer second-tab content'));
  const result = h.Pilot.safeSave('current-project', h.project('Uncommitted first-tab content'));
  assert.equal(result.ok, false);
  assert.equal(result.rollback, 'changed-elsewhere');
  assert.equal(h.Pilot.safeLoad('current-project').project.name, 'Newer second-tab content');
  assert.match(h.events.at(-1).message, /may have changed/);
});
