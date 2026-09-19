import test from "node:test";
import assert from "node:assert/strict";

import {
  CURRENT_KEY,
  HISTORY_PREFIX,
  REVISION_PREFIX,
  bindingConfigured,
  createContentStore,
  historyKey,
  revisionKey
} from "../backend/cloudflare-workers-ai/content-store.mjs";

function fakeBinding() {
  const data =
    new Map();

  const calls = [];

  return {
    data,
    calls,

    async get(key) {
      calls.push({
        op: "get",
        key
      });

      return data.has(key)
        ? data.get(key)
        : null;
    },

    async put(key, value) {
      calls.push({
        op: "put",
        key,
        value
      });

      data.set(
        key,
        String(value)
      );
    },

    async list({
      prefix = "",
      limit = 1000
    } = {}) {
      calls.push({
        op: "list",
        prefix,
        limit
      });

      const keys =
        [...data.keys()]
          .filter(
            key =>
              key.startsWith(
                prefix
              )
          )
          .sort()
          .slice(
            0,
            limit
          )
          .map(
            name => ({
              name
            })
          );

      return {
        keys,
        list_complete: true
      };
    }
  };
}

function release(
  id,
  publishedAt
) {
  return {
    release_id: id,
    published_at:
      publishedAt
  };
}

function metadata(
  id,
  publishedAt
) {
  return {
    release_id: id,
    content_version: id,
    published_at:
      publishedAt,
    parent_release_id:
      null,
    rollback_source_release_id:
      null,
    content_hash:
      "a".repeat(64),
    change_summary:
      `Release ${id}`
  };
}

test(
  "content store requires get put and list binding methods",
  () => {
    assert.equal(
      bindingConfigured(null),
      false
    );

    assert.equal(
      bindingConfigured({}),
      false
    );

    assert.equal(
      bindingConfigured({
        get() {},
        put() {},
        list() {}
      }),
      true
    );

    assert.equal(
      createContentStore({}),
      null
    );
  }
);

test(
  "content store reads and writes the complete current snapshot",
  async () => {
    const binding =
      fakeBinding();

    const store =
      createContentStore(
        binding
      );

    assert.equal(
      await store.readCurrent(),
      null
    );

    const current = {
      release_id:
        "release-001",
      records: []
    };

    await store.writeCurrent(
      current
    );

    assert.equal(
      binding.data.has(
        CURRENT_KEY
      ),
      true
    );

    assert.deepEqual(
      await store.readCurrent(),
      current
    );
  }
);

test(
  "revision keys are isolated from the current snapshot",
  () => {
    assert.equal(
      revisionKey(
        "release-001"
      ),
      `${REVISION_PREFIX}release-001`
    );

    assert.notEqual(
      revisionKey(
        "release-001"
      ),
      CURRENT_KEY
    );
  }
);

test(
  "history keys sort newer timestamps before older timestamps",
  () => {
    const older =
      historyKey(
        release(
          "release-old",
          "2026-09-19T00:00:00.000Z"
        )
      );

    const newer =
      historyKey(
        release(
          "release-new",
          "2026-09-20T00:00:00.000Z"
        )
      );

    assert.equal(
      older.startsWith(
        HISTORY_PREFIX
      ),
      true
    );

    assert.equal(
      newer.startsWith(
        HISTORY_PREFIX
      ),
      true
    );

    assert.equal(
      newer.localeCompare(
        older
      ) < 0,
      true
    );
  }
);

test(
  "writeRevision writes immutable release before revision metadata",
  async () => {
    const binding =
      fakeBinding();

    const store =
      createContentStore(
        binding
      );

    const item =
      release(
        "release-001",
        "2026-09-19T00:00:00.000Z"
      );

    const info =
      metadata(
        "release-001",
        item.published_at
      );

    await store.writeRevision(
      item,
      info
    );

    const puts =
      binding.calls.filter(
        call =>
          call.op === "put"
      );

    assert.equal(
      puts.length,
      2
    );

    assert.equal(
      puts[0].key,
      revisionKey(
        "release-001"
      )
    );

    assert.equal(
      puts[1].key.startsWith(
        HISTORY_PREFIX
      ),
      true
    );

    assert.deepEqual(
      await store.readRevision(
        "release-001"
      ),
      item
    );
  }
);

test(
  "writeRevision refuses to overwrite an existing immutable revision",
  async () => {
    const binding =
      fakeBinding();

    const store =
      createContentStore(
        binding
      );

    const item =
      release(
        "release-001",
        "2026-09-19T00:00:00.000Z"
      );

    const info =
      metadata(
        "release-001",
        item.published_at
      );

    await store.writeRevision(
      item,
      info
    );

    const putsBefore =
      binding.calls.filter(
        call =>
          call.op === "put"
      ).length;

    await assert.rejects(
      () =>
        store.writeRevision(
          item,
          info
        ),
      error =>
        error?.code ===
        "REVISION_EXISTS"
    );

    const putsAfter =
      binding.calls.filter(
        call =>
          call.op === "put"
      ).length;

    assert.equal(
      putsAfter,
      putsBefore
    );
  }
);

test(
  "revision metadata lists newest publication first",
  async () => {
    const binding =
      fakeBinding();

    const store =
      createContentStore(
        binding
      );

    for (
      const [id, time]
      of [
        [
          "release-001",
          "2026-09-19T00:00:00.000Z"
        ],
        [
          "release-003",
          "2026-09-19T02:00:00.000Z"
        ],
        [
          "release-002",
          "2026-09-19T01:00:00.000Z"
        ]
      ]
    ) {
      await store.writeRevision(
        release(
          id,
          time
        ),
        metadata(
          id,
          time
        )
      );
    }

    const revisions =
      await store
        .listRevisionMetadata();

    assert.deepEqual(
      revisions.map(
        item =>
          item.release_id
      ),
      [
        "release-003",
        "release-002",
        "release-001"
      ]
    );

    const listCall =
      binding.calls.find(
        call =>
          call.op === "list"
      );

    assert.equal(
      listCall.prefix,
      HISTORY_PREFIX
    );
  }
);

test(
  "malformed stored JSON is surfaced to the caller instead of silently invented",
  async () => {
    const binding =
      fakeBinding();

    const store =
      createContentStore(
        binding
      );

    binding.data.set(
      CURRENT_KEY,
      "{bad"
    );

    await assert.rejects(
      () =>
        store.readCurrent(),
      SyntaxError
    );
  }
);
