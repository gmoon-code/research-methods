import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
  createRelease
} from "../backend/cloudflare-workers-ai/content-publication.mjs";

import {
  CURRENT_KEY,
  HISTORY_PREFIX,
  REVISION_PREFIX,
  createContentCoordinator,
  historyKey,
  revisionKey,
  safeMetadata,
  safeRollbackInput,
  storageAvailable
} from "../backend/cloudflare-workers-ai/content-coordinator-core.mjs";

function registry() {
  const context = { window: {} };
  vm.runInNewContext(
    readFileSync("assets/content-registry.js", "utf8"),
    context
  );
  return JSON.parse(JSON.stringify(context.window.RMSContentRegistry));
}

const contentRegistry = registry();

function candidate(expected = null, summary = "Publish stage guidance") {
  return {
    schema_version: "1.0",
    expected_current_release_id: expected,
    change_summary: summary,
    records: contentRegistry.records.map(record => ({
      key: record.key,
      type: record.type,
      phase: record.phase,
      stage_id: record.stage_id,
      value: JSON.parse(JSON.stringify(record.value))
    }))
  };
}

function fakeStorage({ failPutNumber = null } = {}) {
  const data = new Map();
  const calls = [];
  let putCount = 0;

  const get = async key => {
    calls.push({ op: "get", key });
    return data.has(key) ? data.get(key) : undefined;
  };

  const put = async (key, value) => {
    calls.push({ op: "put", key, value });
    putCount += 1;
    if (failPutNumber === putCount) throw new Error("simulated put failure");
    data.set(key, structuredClone(value));
  };

  const list = async ({ prefix = "" } = {}) => {
    calls.push({ op: "list", prefix });
    return new Map(
      [...data.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, structuredClone(value)])
    );
  };

  const transaction = async callback => {
    calls.push({ op: "transaction" });
    const snapshot = new Map([...data.entries()].map(([k,v]) => [k, structuredClone(v)]));
    let txPutCount = 0;

    const tx = {
      async get(key) {
        calls.push({ op: "tx-get", key });
        return snapshot.has(key) ? structuredClone(snapshot.get(key)) : undefined;
      },
      async put(key, value) {
        calls.push({ op: "tx-put", key, value });
        txPutCount += 1;
        if (failPutNumber === txPutCount) throw new Error("simulated transaction put failure");
        snapshot.set(key, structuredClone(value));
      }
    };

    const result = await callback(tx);
    data.clear();
    for (const [key, value] of snapshot) data.set(key, value);
    return result;
  };

  return { data, calls, get, put, list, transaction };
}

function server(id, time, hashCharacter = "a") {
  return {
    releaseId: id,
    nowIso: time,
    contentHash: hashCharacter.repeat(64)
  };
}

test("coordinator requires strongly consistent transaction-capable storage", () => {
  assert.equal(storageAvailable(null), false);
  assert.equal(storageAvailable({ get(){}, put(){}, list(){}, transaction(){} }), true);
  assert.throws(() => createContentCoordinator({ get(){}, put(){}, list(){} }));
});

test("empty coordinator returns neutral public and Admin state", async () => {
  const coordinator = createContentCoordinator(fakeStorage());
  assert.deepEqual(await coordinator.publicState(), { published: false });
  assert.deepEqual(await coordinator.adminState(), {
    configured: true,
    published: false,
    current: null
  });
  assert.deepEqual(await coordinator.listRevisions(), []);
});

test("publish atomically creates immutable revision history and current release", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  const result = await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 201);
  assert.equal(result.current.release_id, "release-001");

  const current = storage.data.get(CURRENT_KEY);
  assert.equal(current.release_id, "release-001");
  assert.equal(current.parent_release_id, null);
  assert.equal(storage.data.has(revisionKey("release-001")), true);

  const historyKeys = [...storage.data.keys()].filter(key => key.startsWith(HISTORY_PREFIX));
  assert.equal(historyKeys.length, 1);
  assert.equal(storage.calls.filter(call => call.op === "transaction").length, 1);
});

test("stale publish is rejected inside the transaction without changing storage", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  const before = structuredClone([...storage.data.entries()]);

  const result = await coordinator.publish(
    candidate("release-old"),
    server("release-002", "2026-09-19T01:00:00.000Z", "b")
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.equal(result.code, "CONTENT_CONFLICT");
  assert.deepEqual([...storage.data.entries()], before);
});

test("second publish links to the current release as parent", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  const next = candidate("release-001", "Revise Stage 4 title");
  next.records[3].value.title = "Revised Stage 4";

  const result = await coordinator.publish(
    next,
    server("release-002", "2026-09-19T01:00:00.000Z", "b")
  );

  assert.equal(result.ok, true);
  const current = storage.data.get(CURRENT_KEY);
  assert.equal(current.parent_release_id, "release-001");
  assert.equal(current.records[3].value.title, "Revised Stage 4");
});

test("release identifier collision is rejected without overwriting history", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  const result = await coordinator.publish(
    candidate("release-001", "Same id collision"),
    server("release-001", "2026-09-19T01:00:00.000Z", "b")
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, "REVISION_EXISTS");
  assert.equal(storage.data.get(CURRENT_KEY).release_id, "release-001");
});

test("rollback creates a new chronological release from immutable history", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  const changed = candidate("release-001", "Change Stage 5");
  changed.records[4].value.title = "Changed Stage 5";

  await coordinator.publish(
    changed,
    server("release-002", "2026-09-19T01:00:00.000Z", "b")
  );

  const result = await coordinator.rollback(
    {
      expected_current_release_id: "release-002",
      target_release_id: "release-001",
      change_summary: "Restore release 001"
    },
    server("release-003", "2026-09-19T02:00:00.000Z")
  );

  assert.equal(result.ok, true);
  const current = storage.data.get(CURRENT_KEY);
  assert.equal(current.release_id, "release-003");
  assert.equal(current.parent_release_id, "release-002");
  assert.equal(current.rollback_source_release_id, "release-001");
  assert.equal(
    current.records[4].value.title,
    storage.data.get(revisionKey("release-001")).records[4].value.title
  );
});

test("rollback rejects a missing revision and preserves current release", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  const result = await coordinator.rollback(
    {
      expected_current_release_id: "release-001",
      target_release_id: "release-missing",
      change_summary: "Missing rollback"
    },
    server("release-002", "2026-09-19T01:00:00.000Z")
  );

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(storage.data.get(CURRENT_KEY).release_id, "release-001");
});

test("transaction failure leaves no partial publication", async () => {
  const storage = fakeStorage({ failPutNumber: 2 });
  const coordinator = createContentCoordinator(storage);

  await assert.rejects(
    () => coordinator.publish(
      candidate(),
      server("release-001", "2026-09-19T00:00:00.000Z")
    ),
    /simulated transaction put failure/
  );

  assert.equal(storage.data.size, 0);
});

test("revision history is newest first and malformed metadata is excluded", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  await coordinator.publish(
    candidate("release-001", "Second publication"),
    server("release-002", "2026-09-19T01:00:00.000Z", "b")
  );

  storage.data.set("content:history:0000000000000:bad", { release_id: "bad", injected: true });

  const history = await coordinator.listRevisions();
  assert.deepEqual(history.map(item => item.release_id), ["release-002", "release-001"]);
});

test("public state exposes only safe release projection", async () => {
  const storage = fakeStorage();
  const coordinator = createContentCoordinator(storage);

  await coordinator.publish(
    candidate(),
    server("release-001", "2026-09-19T00:00:00.000Z")
  );

  const state = await coordinator.publicState();
  assert.equal(state.published, true);
  assert.equal(state.release.release_id, "release-001");
  assert.equal(Object.hasOwn(state.release, "change_summary"), false);
  assert.equal(Object.hasOwn(state.release, "parent_release_id"), false);
});

test("rollback and history helpers reject malformed input", () => {
  assert.equal(safeRollbackInput({}), null);
  assert.equal(safeMetadata({ release_id: "bad" }), null);
  assert.equal(revisionKey("x"), REVISION_PREFIX + "x");
  assert.equal(
    historyKey({ release_id: "x", published_at: "2026-09-19T00:00:00.000Z" })
      .startsWith(HISTORY_PREFIX),
    true
  );
});
