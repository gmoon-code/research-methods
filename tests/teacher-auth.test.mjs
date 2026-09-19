import test from "node:test";
import assert from "node:assert/strict";

import {
  SESSION_TTL_SECONDS,
  createTeacherToken,
  handleTeacherRequest,
  verifyTeacherToken
} from "../backend/cloudflare-workers-ai/teacher-auth.mjs";

import {
  createWorker
} from "../backend/cloudflare-workers-ai/worker-core.mjs";

const ORIGIN = "https://gmoon-code.github.io";
const WORKER = "https://rms-research-chat-free.gmoon-code.workers.dev";

const TEACHER_CODE = "teacher-test-code-94731";
const SESSION_SECRET =
  "teacher-session-secret-0123456789abcdef-TEST";

function limiter(success = true) {
  return {
    async limit() {
      return { success };
    }
  };
}

function env(overrides = {}) {
  return {
    RMS_ALLOWED_ORIGINS: ORIGIN,
    RMS_TEACHER_ACCESS_CODE: TEACHER_CODE,
    RMS_TEACHER_SESSION_SECRET: SESSION_SECRET,

    AUTH_RATE_LIMITER: limiter(true),

    ...overrides
  };
}

function request(
  path,
  {
    method = "POST",
    origin = ORIGIN,
    headers = {}
  } = {}
) {
  return new Request(
    `${WORKER}${path}`,
    {
      method,
      headers: {
        Origin: origin,
        ...headers
      }
    }
  );
}

test(
  "teacher login accepts the configured teacher code",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            headers: {
              "X-RMS-Teacher-Code":
                TEACHER_CODE
            }
          }
        ),
        env()
      );

    assert.ok(response);
    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.ok, true);
    assert.equal(
      typeof body.token,
      "string"
    );
    assert.ok(body.token.length > 40);
    assert.equal(
      typeof body.expiresAt,
      "string"
    );

    assert.equal(
      response.headers.get(
        "access-control-allow-origin"
      ),
      ORIGIN
    );

    /*
      The secret itself must never be echoed
      into the response.
    */
    const serialized =
      JSON.stringify(body);

    assert.equal(
      serialized.includes(
        TEACHER_CODE
      ),
      false
    );

    assert.equal(
      serialized.includes(
        SESSION_SECRET
      ),
      false
    );
  }
);

test(
  "teacher login rejects a wrong code with a generic response",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            headers: {
              "X-RMS-Teacher-Code":
                "definitely-wrong"
            }
          }
        ),
        env()
      );

    assert.equal(response.status, 401);

    const body = await response.json();

    assert.equal(
      body.error,
      "Teacher access was not accepted."
    );

    assert.equal(
      "token" in body,
      false
    );
  }
);

test(
  "a newly issued teacher session verifies successfully",
  async () => {
    const session =
      await createTeacherToken(env());

    const direct =
      await verifyTeacherToken(
        session.token,
        env()
      );

    assert.equal(direct.ok, true);

    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session/verify",
          {
            headers: {
              "X-RMS-Teacher-Session":
                session.token
            }
          }
        ),
        env()
      );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.ok, true);
    assert.equal(
      typeof body.expiresAt,
      "string"
    );
  }
);

test(
  "tampering with a teacher session invalidates it",
  async () => {
    const session =
      await createTeacherToken(env());

    const parts =
      session.token.split(".");

    assert.equal(parts.length, 2);

    const signature =
      parts[1];

    const last =
      signature.at(-1);

    const replacement =
      last === "A" ? "B" : "A";

    const tampered =
      `${parts[0]}.` +
      `${signature.slice(0, -1)}` +
      replacement;

    const direct =
      await verifyTeacherToken(
        tampered,
        env()
      );

    assert.equal(direct.ok, false);

    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session/verify",
          {
            headers: {
              "X-RMS-Teacher-Session":
                tampered
            }
          }
        ),
        env()
      );

    assert.equal(response.status, 401);
  }
);

test(
  "teacher sessions expire after the configured lifetime",
  async () => {
    const realNow = Date.now;

    try {
      const issuedAt =
        1_800_000_000_000;

      Date.now = () => issuedAt;

      const session =
        await createTeacherToken(env());

      Date.now = () =>
        issuedAt +
        (
          SESSION_TTL_SECONDS +
          1
        ) * 1000;

      const result =
        await verifyTeacherToken(
          session.token,
          env()
        );

      assert.equal(result.ok, false);
    } finally {
      Date.now = realNow;
    }
  }
);

test(
  "teacher endpoints reject an unapproved origin",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            origin:
              "https://example.invalid",
            headers: {
              "X-RMS-Teacher-Code":
                TEACHER_CODE
            }
          }
        ),
        env()
      );

    assert.equal(response.status, 403);

    assert.equal(
      response.headers.get(
        "access-control-allow-origin"
      ),
      null
    );
  }
);

test(
  "teacher preflight exposes only the required methods and headers",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            method: "OPTIONS"
          }
        ),
        env()
      );

    assert.equal(response.status, 204);

    assert.equal(
      response.headers.get(
        "access-control-allow-origin"
      ),
      ORIGIN
    );

    assert.equal(
      response.headers.get(
        "access-control-allow-methods"
      ),
      "POST, OPTIONS"
    );

    const allowedHeaders =
      response.headers.get(
        "access-control-allow-headers"
      );

    assert.match(
      allowedHeaders,
      /X-RMS-Teacher-Code/
    );

    assert.match(
      allowedHeaders,
      /X-RMS-Teacher-Session/
    );
  }
);

test(
  "teacher access fails closed when secrets are absent",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            headers: {
              "X-RMS-Teacher-Code":
                TEACHER_CODE
            }
          }
        ),
        env({
          RMS_TEACHER_ACCESS_CODE:
            "",
          RMS_TEACHER_SESSION_SECRET:
            ""
        })
      );

    assert.equal(response.status, 503);

    const body = await response.json();

    assert.equal(
      body.error,
      "Teacher access service is not configured."
    );
  }
);

test(
  "teacher authentication is rate limited",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            headers: {
              "X-RMS-Teacher-Code":
                TEACHER_CODE
            }
          }
        ),
        env({
          AUTH_RATE_LIMITER:
            limiter(false)
        })
      );

    assert.equal(response.status, 429);

    assert.equal(
      response.headers.get(
        "retry-after"
      ),
      "60"
    );
  }
);

test(
  "unsupported methods are rejected",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/teacher/session",
          {
            method: "GET"
          }
        ),
        env()
      );

    assert.equal(response.status, 405);

    assert.equal(
      response.headers.get("allow"),
      "POST, OPTIONS"
    );
  }
);

test(
  "non-teacher paths pass through untouched",
  async () => {
    const response =
      await handleTeacherRequest(
        request(
          "/health",
          {
            method: "GET"
          }
        ),
        env()
      );

    assert.equal(response, null);
  }
);

test(
  "the real Worker routes teacher login through teacher authentication",
  async () => {
    const worker =
      createWorker();

    const response =
      await worker.fetch(
        request(
          "/teacher/session",
          {
            headers: {
              "X-RMS-Teacher-Code":
                TEACHER_CODE
            }
          }
        ),
        env()
      );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.ok, true);
    assert.equal(
      typeof body.token,
      "string"
    );
  }
);
