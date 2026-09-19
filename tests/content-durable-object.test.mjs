import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
  createContentReleaseCoordinatorHandler
} from "../backend/cloudflare-workers-ai/content-durable-object-handler.mjs";

function registry() {
  const context = { window: {} };
  vm.runInNewContext(readFileSync("assets/content-registry.js", "utf8"), context);
  return JSON.parse(JSON.stringify(context.window.RMSContentRegistry));
}

const records = registry().records.map(record => ({
  key: record.key,
  type: record.type,
  phase: record.phase,
  stage_id: record.stage_id,
  value: record.value
}));

function candidate(expected = null, summary = "Publish content") {
  return {
    schema_version: "1.0",
    expected_current_release_id: expected,
    change_summary: summary,
    records: structuredClone(records)
  };
}

function fakeStorage() {
  const data = new Map();
  return {
    data,
    async get(key) {
      return data.has(key) ? structuredClone(data.get(key)) : undefined;
    },
    async put(key, value) {
      data.set(key, structuredClone(value));
    },
    async list({ prefix = "" } = {}) {
      return new Map(
        [...data.entries()]
          .filter(([key]) => key.startsWith(prefix))
          .map(([key, value]) => [key, structuredClone(value)])
      );
    },
    async transaction(callback) {
      const snapshot = new Map([...data.entries()].map(([k,v]) => [k, structuredClone(v)]));
      const tx = {
        async get(key) {
          return snapshot.has(key) ? structuredClone(snapshot.get(key)) : undefined;
        },
        async put(key, value) {
          snapshot.set(key, structuredClone(value));
        }
      };
      const result = await callback(tx);
      data.clear();
      for (const [key,value] of snapshot) data.set(key,value);
      return result;
    }
  };
}

async function call(object, path, { method = "GET", body } = {}) {
  const response = await object.fetch(
    new Request("https://rms-content.internal" + path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  );
  return { response, body: await response.json() };
}

test("Durable Object begins with no publication", async () => {
  const object = createContentReleaseCoordinatorHandler(fakeStorage());
  const result = await call(object, "/public");
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body, { published: false });
});

test("Durable Object publishes and exposes a safe current release", async () => {
  const object = createContentReleaseCoordinatorHandler(fakeStorage());
  const published = await call(object, "/publish", { method: "POST", body: candidate() });
  assert.equal(published.response.status, 201);
  assert.equal(published.body.ok, true);
  assert.match(published.body.current.release_id, /^rel_[0-9a-f-]+$/i);

  const publicResult = await call(object, "/public");
  assert.equal(publicResult.body.published, true);
  assert.equal(publicResult.body.release.release_id, published.body.current.release_id);
  assert.equal(Object.hasOwn(publicResult.body.release, "change_summary"), false);
});

test("Durable Object enforces stale publication conflict internally", async () => {
  const object = createContentReleaseCoordinatorHandler(fakeStorage());
  const first = await call(object, "/publish", { method: "POST", body: candidate() });
  const stale = await call(object, "/publish", {
    method: "POST",
    body: candidate("release-old", "Stale publish")
  });
  assert.equal(stale.response.status, 409);
  assert.equal(stale.body.code, "CONTENT_CONFLICT");

  const state = await call(object, "/state");
  assert.equal(state.body.current.release_id, first.body.current.release_id);
});

test("Durable Object performs rollback and records rollback source", async () => {
  const object = createContentReleaseCoordinatorHandler(fakeStorage());
  const first = await call(object, "/publish", { method: "POST", body: candidate() });

  const secondCandidate = candidate(first.body.current.release_id, "Second revision");
  secondCandidate.records[1].value.title = "Changed stage 2";
  const second = await call(object, "/publish", { method: "POST", body: secondCandidate });

  const rollback = await call(object, "/rollback", {
    method: "POST",
    body: {
      expected_current_release_id: second.body.current.release_id,
      target_release_id: first.body.current.release_id,
      change_summary: "Rollback canary"
    }
  });

  assert.equal(rollback.response.status, 201);
  assert.equal(rollback.body.current.parent_release_id, second.body.current.release_id);
  assert.equal(rollback.body.current.rollback_source_release_id, first.body.current.release_id);
});

test("Durable Object revision list remains metadata-only", async () => {
  const object = createContentReleaseCoordinatorHandler(fakeStorage());
  await call(object, "/publish", { method: "POST", body: candidate() });
  const revisions = await call(object, "/revisions");
  assert.equal(revisions.response.status, 200);
  assert.equal(revisions.body.revisions.length, 1);
  assert.equal(Object.hasOwn(revisions.body.revisions[0], "records"), false);
});

test("Durable Object rejects malformed JSON and unknown internal operation", async () => {
  const object = createContentReleaseCoordinatorHandler(fakeStorage());

  const malformed = await object.fetch(
    new Request("https://rms-content.internal/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad"
    })
  );
  assert.equal(malformed.status, 400);

  const missing = await call(object, "/missing");
  assert.equal(missing.response.status, 404);
});
