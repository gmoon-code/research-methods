import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
  createTeacherToken
} from "../backend/cloudflare-workers-ai/teacher-auth.mjs";

import {
  createRelease,
  revisionMetadata
} from "../backend/cloudflare-workers-ai/content-publication.mjs";

import {
  handleContentRequest,
  MAX_BODY_BYTES,
  PUBLIC_PATH,
  ADMIN_STATE_PATH,
  ADMIN_REVISIONS_PATH,
  ADMIN_PUBLISH_PATH,
  ADMIN_ROLLBACK_PATH
} from "../backend/cloudflare-workers-ai/content-api.mjs";

import {
  createWorker
} from "../backend/cloudflare-workers-ai/worker.mjs";

const ORIGIN =
  "https://gmoon-code.github.io";

const TEACHER_CODE =
  "teacher-code-12345678";

const SESSION_SECRET =
  "0123456789abcdef0123456789abcdef";

function registry() {
  const context = {
    window: {}
  };

  vm.runInNewContext(
    readFileSync(
      "assets/content-registry.js",
      "utf8"
    ),
    context
  );

  return JSON.parse(
    JSON.stringify(
      context.window
        .RMSContentRegistry
    )
  );
}

const contentRegistry =
  registry();

function candidate(
  expected = null,
  summary =
    "Publish stage guidance"
) {
  return {
    schema_version: "1.0",
    expected_current_release_id:
      expected,
    change_summary:
      summary,
    records:
      contentRegistry.records
        .map(
          record => ({
            key: record.key,
            type: record.type,
            phase: record.phase,
            stage_id:
              record.stage_id,
            value:
              JSON.parse(
                JSON.stringify(
                  record.value
                )
              )
          })
        )
  };
}

function limiter(
  sequence = [true]
) {
  const calls = [];
  let index = 0;

  return {
    calls,

    async limit(input) {
      calls.push(input);

      const success =
        sequence[
          Math.min(
            index,
            sequence.length - 1
          )
        ];

      index += 1;

      return {
        success
      };
    }
  };
}

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

      return {
        keys:
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
            ),
        list_complete: true
      };
    }
  };
}

function baseEnv(
  overrides = {}
) {
  return {
    RMS_ALLOWED_ORIGINS:
      ORIGIN,
    RMS_TEACHER_ACCESS_CODE:
      TEACHER_CODE,
    RMS_TEACHER_SESSION_SECRET:
      SESSION_SECRET,
    AUTH_RATE_LIMITER:
      limiter(),
    ...overrides
  };
}

async function adminToken(
  environment
) {
  const result =
    await createTeacherToken(
      environment
    );

  return result.token;
}

function request(
  path,
  {
    method = "GET",
    origin = ORIGIN,
    token,
    body,
    contentType =
      "application/json"
  } = {}
) {
  const headers =
    new Headers();

  if (origin) {
    headers.set(
      "Origin",
      origin
    );
  }

  headers.set(
    "CF-Connecting-IP",
    "203.0.113.11"
  );

  if (token) {
    headers.set(
      "X-RMS-Teacher-Session",
      token
    );
  }

  if (body !== undefined) {
    headers.set(
      "Content-Type",
      contentType
    );
  }

  return new Request(
    `https://rms.example.workers.dev${path}`,
    {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : typeof body ===
              "string"
            ? body
            : JSON.stringify(
                body
              )
    }
  );
}

function hash(
  character = "a"
) {
  return character.repeat(64);
}

function seededRelease(
  id = "release-001",
  summary =
    "Initial publication"
) {
  return createRelease({
    candidate:
      candidate(
        null,
        summary
      ),
    releaseId:
      id,
    nowIso:
      "2026-09-19T00:00:00.000Z",
    contentHash:
      hash("a")
  });
}

async function seedStore(
  binding,
  release
) {
  binding.data.set(
    "content:current",
    JSON.stringify(
      release
    )
  );

  binding.data.set(
    `content:revision:${release.release_id}`,
    JSON.stringify(
      release
    )
  );

  binding.data.set(
    `content:history:0000000000001:${release.release_id}`,
    JSON.stringify(
      revisionMetadata(
        release
      )
    )
  );
}

test(
  "content handler ignores unrelated Worker paths",
  async () => {
    const response =
      await handleContentRequest(
        request("/"),
        baseEnv()
      );

    assert.equal(
      response,
      null
    );
  }
);

test(
  "content routes reject disallowed origins before storage or auth work",
  async () => {
    const binding =
      fakeBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const response =
      await handleContentRequest(
        request(
          PUBLIC_PATH,
          {
            origin:
              "https://evil.example"
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      403
    );

    assert.equal(
      binding.calls.length,
      0
    );

    assert.equal(
      environment
        .AUTH_RATE_LIMITER
        .calls.length,
      0
    );
  }
);

test(
  "content preflight advertises only route-required methods",
  async () => {
    const environment =
      baseEnv();

    for (
      const [path, methods]
      of [
        [
          PUBLIC_PATH,
          "GET, OPTIONS"
        ],
        [
          ADMIN_STATE_PATH,
          "GET, OPTIONS"
        ],
        [
          ADMIN_REVISIONS_PATH,
          "GET, OPTIONS"
        ],
        [
          ADMIN_PUBLISH_PATH,
          "POST, OPTIONS"
        ],
        [
          ADMIN_ROLLBACK_PATH,
          "POST, OPTIONS"
        ]
      ]
    ) {
      const response =
        await handleContentRequest(
          request(
            path,
            {
              method:
                "OPTIONS"
            }
          ),
          environment
        );

      assert.equal(
        response.status,
        204,
        path
      );

      assert.equal(
        response.headers.get(
          "access-control-allow-methods"
        ),
        methods,
        path
      );
    }
  }
);

test(
  "public content fails closed when storage is not configured",
  async () => {
    const response =
      await handleContentRequest(
        request(
          PUBLIC_PATH
        ),
        baseEnv()
      );

    assert.equal(
      response.status,
      503
    );

    assert.match(
      await response.text(),
      /not configured/i
    );
  }
);

test(
  "public content reports no publication without inventing a release",
  async () => {
    const binding =
      fakeBinding();

    const response =
      await handleContentRequest(
        request(
          PUBLIC_PATH
        ),
        baseEnv({
          RMS_CONTENT_STORE:
            binding
        })
      );

    assert.equal(
      response.status,
      404
    );

    assert.deepEqual(
      await response.json(),
      {
        published: false
      }
    );
  }
);

test(
  "public content exposes only the safe release projection",
  async () => {
    const binding =
      fakeBinding();

    const release =
      seededRelease();

    await seedStore(
      binding,
      release
    );

    const response =
      await handleContentRequest(
        request(
          PUBLIC_PATH
        ),
        baseEnv({
          RMS_CONTENT_STORE:
            binding
        })
      );

    assert.equal(
      response.status,
      200
    );

    const body =
      await response.json();

    assert.equal(
      body.published,
      true
    );

    assert.equal(
      body.release.release_id,
      release.release_id
    );

    assert.equal(
      Object.hasOwn(
        body.release,
        "change_summary"
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        body.release,
        "parent_release_id"
      ),
      false
    );
  }
);

test(
  "Admin content routes fail closed when session configuration is absent",
  async () => {
    const binding =
      fakeBinding();

    const environment =
      baseEnv({
        RMS_TEACHER_ACCESS_CODE:
          undefined,
        RMS_TEACHER_SESSION_SECRET:
          undefined,
        RMS_CONTENT_STORE:
          binding
      });

    const response =
      await handleContentRequest(
        request(
          ADMIN_STATE_PATH,
          {
            token:
              "anything"
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      503
    );

    assert.equal(
      binding.calls.length,
      0
    );
  }
);

test(
  "Admin authentication happens before storage configuration disclosure",
  async () => {
    const environment =
      baseEnv();

    const response =
      await handleContentRequest(
        request(
          ADMIN_STATE_PATH,
          {
            token:
              "invalid-token"
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      401
    );

    assert.doesNotMatch(
      await response.text(),
      /storage|not configured/i
    );
  }
);

test(
  "valid Admin session then fails closed when storage binding is absent",
  async () => {
    const environment =
      baseEnv();

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_STATE_PATH,
          {
            token
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      503
    );

    assert.match(
      await response.text(),
      /not configured/i
    );
  }
);

test(
  "Admin state returns neutral unpublished state for an empty configured store",
  async () => {
    const binding =
      fakeBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_STATE_PATH,
          {
            token
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      200
    );

    assert.deepEqual(
      await response.json(),
      {
        configured: true,
        published: false,
        current: null
      }
    );
  }
);

test(
  "Admin revisions filters malformed stored metadata",
  async () => {
    const binding =
      fakeBinding();

    const valid =
      seededRelease();

    await seedStore(
      binding,
      valid
    );

    binding.data.set(
      "content:history:0000000000000:bad",
      JSON.stringify({
        release_id: "bad",
        injected: "<script>"
      })
    );

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_REVISIONS_PATH,
          {
            token
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      200
    );

    const body =
      await response.json();

    assert.equal(
      body.revisions.length,
      1
    );

    assert.equal(
      body.revisions[0]
        .release_id,
      valid.release_id
    );
  }
);

test(
  "publish rejects non-JSON malformed and invalid candidates before storage writes",
  async () => {
    for (
      const entry
      of [
        {
          contentType:
            "text/plain",
          body:
            JSON.stringify(
              candidate()
            ),
          status: 415
        },
        {
          contentType:
            "application/json",
          body: "{bad",
          status: 400
        },
        {
          contentType:
            "application/json",
          body: {
            ...candidate(),
            records: []
          },
          status: 400
        }
      ]
    ) {
      const binding =
        fakeBinding();

      const environment =
        baseEnv({
          RMS_CONTENT_STORE:
            binding
        });

      const token =
        await adminToken(
          environment
        );

      const response =
        await handleContentRequest(
          request(
            ADMIN_PUBLISH_PATH,
            {
              method: "POST",
              token,
              body:
                entry.body,
              contentType:
                entry.contentType
            }
          ),
          environment
        );

      assert.equal(
        response.status,
        entry.status
      );

      assert.equal(
        binding.calls
          .filter(
            call =>
              call.op === "put"
          )
          .length,
        0
      );
    }
  }
);

test(
  "publish enforces the request body size limit",
  async () => {
    const binding =
      fakeBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_PUBLISH_PATH,
          {
            method: "POST",
            token,
            body:
              "x".repeat(
                MAX_BODY_BYTES + 1
              )
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      413
    );

    assert.equal(
      binding.calls
        .filter(
          call =>
            call.op === "put"
        )
        .length,
      0
    );
  }
);

test(
  "first publish writes immutable revision before current snapshot",
  async () => {
    const binding =
      fakeBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_PUBLISH_PATH,
          {
            method: "POST",
            token,
            body:
              candidate()
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      201
    );

    const body =
      await response.json();

    assert.equal(
      body.ok,
      true
    );

    assert.match(
      body.current.release_id,
      /^rel_[0-9a-f-]+$/i
    );

    const puts =
      binding.calls.filter(
        call =>
          call.op === "put"
      );

    assert.equal(
      puts.length,
      3
    );

    assert.equal(
      puts[0].key.startsWith(
        "content:revision:"
      ),
      true
    );

    assert.equal(
      puts[1].key.startsWith(
        "content:history:"
      ),
      true
    );

    assert.equal(
      puts[2].key,
      "content:current"
    );

    const current =
      JSON.parse(
        binding.data.get(
          "content:current"
        )
      );

    assert.equal(
      current.release_id,
      body.current.release_id
    );

    assert.equal(
      current.parent_release_id,
      null
    );
  }
);

test(
  "publish detects stale current release before any write",
  async () => {
    const binding =
      fakeBinding();

    const current =
      seededRelease();

    await seedStore(
      binding,
      current
    );

    binding.calls.length = 0;

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_PUBLISH_PATH,
          {
            method: "POST",
            token,
            body:
              candidate(
                "release-old"
              )
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      409
    );

    const body =
      await response.json();

    assert.equal(
      body.code,
      "CONTENT_CONFLICT"
    );

    assert.equal(
      body.current_release_id,
      current.release_id
    );

    assert.equal(
      binding.calls
        .filter(
          call =>
            call.op === "put"
        )
        .length,
      0
    );
  }
);

test(
  "publish from current release records the prior release as parent",
  async () => {
    const binding =
      fakeBinding();

    const current =
      seededRelease();

    await seedStore(
      binding,
      current
    );

    binding.calls.length = 0;

    const next =
      candidate(
        current.release_id,
        "Revise Stage 4 title"
      );

    next.records[3]
      .value.title =
        "Revised Stage 4";

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_PUBLISH_PATH,
          {
            method: "POST",
            token,
            body: next
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      201
    );

    const stored =
      JSON.parse(
        binding.data.get(
          "content:current"
        )
      );

    assert.equal(
      stored.parent_release_id,
      current.release_id
    );

    assert.equal(
      stored.records[3]
        .value.title,
      "Revised Stage 4"
    );
  }
);

test(
  "rollback rejects missing target revision without writes",
  async () => {
    const binding =
      fakeBinding();

    const current =
      seededRelease();

    await seedStore(
      binding,
      current
    );

    binding.calls.length = 0;

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_ROLLBACK_PATH,
          {
            method: "POST",
            token,
            body: {
              expected_current_release_id:
                current.release_id,
              target_release_id:
                "release-missing",
              change_summary:
                "Rollback missing"
            }
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      404
    );

    assert.equal(
      binding.calls
        .filter(
          call =>
            call.op === "put"
        )
        .length,
      0
    );
  }
);

test(
  "rollback republishes prior content as a new chronological release",
  async () => {
    const binding =
      fakeBinding();

    const target =
      seededRelease(
        "release-001",
        "Initial publication"
      );

    await seedStore(
      binding,
      target
    );

    const changed =
      candidate(
        "release-001",
        "Change Stage 5"
      );

    changed.records[4]
      .value.title =
        "Changed Stage 5";

    const current =
      createRelease({
        candidate: changed,
        releaseId:
          "release-002",
        nowIso:
          "2026-09-19T01:00:00.000Z",
        contentHash:
          hash("b"),
        parentReleaseId:
          "release-001"
      });

    await seedStore(
      binding,
      current
    );

    binding.calls.length = 0;

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_ROLLBACK_PATH,
          {
            method: "POST",
            token,
            body: {
              expected_current_release_id:
                current.release_id,
              target_release_id:
                target.release_id,
              change_summary:
                "Restore initial guidance"
            }
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      201
    );

    const stored =
      JSON.parse(
        binding.data.get(
          "content:current"
        )
      );

    assert.notEqual(
      stored.release_id,
      current.release_id
    );

    assert.equal(
      stored.parent_release_id,
      current.release_id
    );

    assert.equal(
      stored.rollback_source_release_id,
      target.release_id
    );

    assert.equal(
      stored.records[4]
        .value.title,
      target.records[4]
        .value.title
    );
  }
);

test(
  "content Admin rate limit blocks requests before storage",
  async () => {
    const binding =
      fakeBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_STORE:
          binding,
        AUTH_RATE_LIMITER:
          limiter([false])
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await handleContentRequest(
        request(
          ADMIN_STATE_PATH,
          {
            token
          }
        ),
        environment
      );

    assert.equal(
      response.status,
      429
    );

    assert.equal(
      binding.calls.length,
      0
    );
  }
);

test(
  "real Worker routes content API before Research Chat inference",
  async () => {
    const binding =
      fakeBinding();

    const aiCalls = [];

    const environment = {
      ...baseEnv({
        RMS_CONTENT_STORE:
          binding
      }),
      RMS_CHAT_ACCESS_CODE:
        "class-code-12345678",
      RMS_AI_MODEL:
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      AI: {
        async run(...args) {
          aiCalls.push(args);

          throw new Error(
            "AI should not run."
          );
        }
      },
      SESSION_RATE_LIMITER:
        limiter(),
      CLASS_RATE_LIMITER:
        limiter()
    };

    const response =
      await createWorker()
        .fetch(
          request(
            PUBLIC_PATH
          ),
          environment
        );

    assert.equal(
      response.status,
      404
    );

    assert.equal(
      aiCalls.length,
      0
    );

    assert.equal(
      environment
        .SESSION_RATE_LIMITER
        .calls.length,
      0
    );

    assert.equal(
      environment
        .CLASS_RATE_LIMITER
        .calls.length,
      0
    );
  }
);
