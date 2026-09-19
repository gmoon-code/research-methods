import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
  createTeacherToken
} from "../backend/cloudflare-workers-ai/teacher-auth.mjs";

import {
  ContentReleaseCoordinator
} from "../backend/cloudflare-workers-ai/content-durable-object.mjs";

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

function fakeStorage() {
  const data =
    new Map();

  return {
    data,

    async get(key) {
      return data.has(key)
        ? structuredClone(
            data.get(key)
          )
        : undefined;
    },

    async put(
      key,
      value
    ) {
      data.set(
        key,
        structuredClone(value)
      );
    },

    async list({
      prefix = ""
    } = {}) {
      return new Map(
        [...data.entries()]
          .filter(
            ([key]) =>
              key.startsWith(
                prefix
              )
          )
          .map(
            ([key, value]) => [
              key,
              structuredClone(
                value
              )
            ]
          )
      );
    },

    async transaction(
      callback
    ) {
      const snapshot =
        new Map(
          [...data.entries()]
            .map(
              ([key, value]) => [
                key,
                structuredClone(
                  value
                )
              ]
            )
        );

      const transaction = {
        async get(key) {
          return snapshot.has(key)
            ? structuredClone(
                snapshot.get(key)
              )
            : undefined;
        },

        async put(
          key,
          value
        ) {
          snapshot.set(
            key,
            structuredClone(
              value
            )
          );
        }
      };

      const result =
        await callback(
          transaction
        );

      data.clear();

      for (
        const [key, value]
        of snapshot
      ) {
        data.set(
          key,
          value
        );
      }

      return result;
    }
  };
}

function fakeCoordinatorBinding(
  storage =
    fakeStorage()
) {
  const calls = [];

  const object =
    new ContentReleaseCoordinator(
      {
        storage
      },
      {}
    );

  return {
    storage,
    calls,
    object,

    getByName(name) {
      calls.push({
        op:
          "getByName",
        name
      });

      return {
        async fetch(request) {
          const url =
            new URL(
              request.url
            );

          calls.push({
            op: "fetch",
            path:
              url.pathname,
            method:
              request.method
          });

          return object.fetch(
            request
          );
        }
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

async function publishThroughApi(
  environment,
  token,
  body
) {
  return handleContentRequest(
    request(
      ADMIN_PUBLISH_PATH,
      {
        method: "POST",
        token,
        body
      }
    ),
    environment
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
  "content routes reject disallowed origins before coordinator or auth work",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
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
  "public content fails closed when coordinator binding is absent",
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
      fakeCoordinatorBinding();

    const response =
      await handleContentRequest(
        request(
          PUBLIC_PATH
        ),
        baseEnv({
          RMS_CONTENT_COORDINATOR:
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
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const published =
      await publishThroughApi(
        environment,
        token,
        candidate()
      );

    assert.equal(
      published.status,
      201
    );

    const response =
      await handleContentRequest(
        request(
          PUBLIC_PATH
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
      body.published,
      true
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
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_TEACHER_ACCESS_CODE:
          undefined,
        RMS_TEACHER_SESSION_SECRET:
          undefined,
        RMS_CONTENT_COORDINATOR:
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
  "Admin authentication happens before coordinator configuration disclosure",
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
      /coordinator|not configured/i
    );
  }
);

test(
  "valid Admin session then fails closed when coordinator binding is absent",
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
  "Admin state returns neutral unpublished state for empty coordinator",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
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
  "publish rejects non-JSON malformed and invalid candidates before coordinator write path",
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
        fakeCoordinatorBinding();

      const environment =
        baseEnv({
          RMS_CONTENT_COORDINATOR:
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
              call.op ===
                "fetch" &&
              call.path ===
                "/publish"
          )
          .length,
        0
      );
    }
  }
);

test(
  "publish enforces the request body size limit before coordinator call",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
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
            call.op ===
              "fetch" &&
            call.path ===
              "/publish"
        )
        .length,
      0
    );
  }
);

test(
  "first publish reaches the coordinator and creates a current release",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const response =
      await publishThroughApi(
        environment,
        token,
        candidate()
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
      body.current
        .release_id,
      /^rel_[0-9a-f-]+$/i
    );

    assert.equal(
      binding.calls
        .some(
          call =>
            call.op ===
              "fetch" &&
            call.path ===
              "/publish"
        ),
      true
    );

    const current =
      binding.storage.data
        .get(
          "content:current"
        );

    assert.equal(
      current.release_id,
      body.current
        .release_id
    );
  }
);

test(
  "stale publish conflict is returned from the authoritative coordinator",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const first =
      await publishThroughApi(
        environment,
        token,
        candidate()
      );

    assert.equal(
      first.status,
      201
    );

    const stale =
      await publishThroughApi(
        environment,
        token,
        candidate(
          "release-old"
        )
      );

    assert.equal(
      stale.status,
      409
    );

    const body =
      await stale.json();

    assert.equal(
      body.code,
      "CONTENT_CONFLICT"
    );
  }
);

test(
  "second publish records the current release as parent",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const first =
      await publishThroughApi(
        environment,
        token,
        candidate()
      );

    const firstBody =
      await first.json();

    const next =
      candidate(
        firstBody.current
          .release_id,
        "Revise Stage 4"
      );

    next.records[3]
      .value.title =
        "Revised Stage 4";

    const second =
      await publishThroughApi(
        environment,
        token,
        next
      );

    assert.equal(
      second.status,
      201
    );

    const current =
      binding.storage.data
        .get(
          "content:current"
        );

    assert.equal(
      current
        .parent_release_id,
      firstBody.current
        .release_id
    );
  }
);

test(
  "revision history is metadata-only",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    await publishThroughApi(
      environment,
      token,
      candidate()
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
      Object.hasOwn(
        body.revisions[0],
        "records"
      ),
      false
    );
  }
);

test(
  "rollback rejects missing target revision without changing current release",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const first =
      await publishThroughApi(
        environment,
        token,
        candidate()
      );

    const firstBody =
      await first.json();

    const response =
      await handleContentRequest(
        request(
          ADMIN_ROLLBACK_PATH,
          {
            method: "POST",
            token,
            body: {
              expected_current_release_id:
                firstBody.current
                  .release_id,
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
      binding.storage.data
        .get(
          "content:current"
        )
        .release_id,
      firstBody.current
        .release_id
    );
  }
);

test(
  "rollback republishes prior content as a new chronological release",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      });

    const token =
      await adminToken(
        environment
      );

    const first =
      await publishThroughApi(
        environment,
        token,
        candidate()
      );

    const firstBody =
      await first.json();

    const changed =
      candidate(
        firstBody.current
          .release_id,
        "Change Stage 5"
      );

    changed.records[4]
      .value.title =
        "Changed Stage 5";

    const second =
      await publishThroughApi(
        environment,
        token,
        changed
      );

    const secondBody =
      await second.json();

    const rollback =
      await handleContentRequest(
        request(
          ADMIN_ROLLBACK_PATH,
          {
            method: "POST",
            token,
            body: {
              expected_current_release_id:
                secondBody.current
                  .release_id,
              target_release_id:
                firstBody.current
                  .release_id,
              change_summary:
                "Restore initial guidance"
            }
          }
        ),
        environment
      );

    assert.equal(
      rollback.status,
      201
    );

    const rollbackBody =
      await rollback.json();

    assert.equal(
      rollbackBody.current
        .parent_release_id,
      secondBody.current
        .release_id
    );

    assert.equal(
      rollbackBody.current
        .rollback_source_release_id,
      firstBody.current
        .release_id
    );
  }
);

test(
  "content Admin rate limit blocks requests before coordinator access",
  async () => {
    const binding =
      fakeCoordinatorBinding();

    const environment =
      baseEnv({
        RMS_CONTENT_COORDINATOR:
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
      fakeCoordinatorBinding();

    const aiCalls = [];

    const environment = {
      ...baseEnv({
        RMS_CONTENT_COORDINATOR:
          binding
      }),
      RMS_CHAT_ACCESS_CODE:
        "class-code-12345678",
      RMS_AI_MODEL:
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      AI: {
        async run(
          ...args
        ) {
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
