import {
  parseAllowedOrigins
} from "../../api/research-chat.js";

import {
  verifyTeacherToken
} from "./teacher-auth.mjs";

import {
  checkExpectedCurrentRelease,
  contentHashInput,
  createRelease,
  createRollbackRelease,
  publicReleaseProjection,
  revisionMetadata,
  validateCandidate,
  validateStoredRelease
} from "./content-publication.mjs";

import {
  createContentStore
} from "./content-store.mjs";

const PUBLIC_PATH =
  "/content/public";

const ADMIN_STATE_PATH =
  "/admin/content/state";

const ADMIN_REVISIONS_PATH =
  "/admin/content/revisions";

const ADMIN_PUBLISH_PATH =
  "/admin/content/publish";

const ADMIN_ROLLBACK_PATH =
  "/admin/content/rollback";

const ADMIN_PATHS =
  new Set([
    ADMIN_STATE_PATH,
    ADMIN_REVISIONS_PATH,
    ADMIN_PUBLISH_PATH,
    ADMIN_ROLLBACK_PATH
  ]);

const MAX_BODY_BYTES =
  256 * 1024;

const encoder =
  new TextEncoder();

function contentPath(pathname) {
  return (
    pathname ===
      PUBLIC_PATH ||
    ADMIN_PATHS.has(
      pathname
    )
  );
}

function allowedOrigin(
  request,
  env
) {
  const origin =
    String(
      request.headers.get(
        "origin"
      ) || ""
    ).trim();

  return parseAllowedOrigins(
    env
  ).includes(origin)
    ? origin
    : "";
}

function headers(
  request,
  env,
  extra = {}
) {
  const origin =
    allowedOrigin(
      request,
      env
    );

  const result =
    new Headers({
      "Content-Type":
        "application/json; charset=utf-8",
      "Cache-Control":
        "no-store",
      "X-Content-Type-Options":
        "nosniff",
      "Referrer-Policy":
        "no-referrer",
      "Vary":
        "Origin",
      ...extra
    });

  if (origin) {
    result.set(
      "Access-Control-Allow-Origin",
      origin
    );
  }

  return result;
}

function json(
  request,
  env,
  body,
  status = 200,
  extra = {}
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers:
        headers(
          request,
          env,
          extra
        )
    }
  );
}

function storeFor(env) {
  return createContentStore(
    env?.RMS_CONTENT_STORE
  );
}

function safeKeyPart(
  value,
  fallback = "unknown"
) {
  const text =
    String(value || "")
      .trim();

  return /^[A-Za-z0-9_.:-]{1,160}$/
    .test(text)
      ? text
      : fallback;
}

async function rateLimitAdmin(
  request,
  env,
  kind
) {
  const limiter =
    env?.AUTH_RATE_LIMITER;

  if (
    !limiter ||
    typeof limiter.limit !==
      "function"
  ) {
    return json(
      request,
      env,
      {
        error:
          "Content administration service is not configured."
      },
      503
    );
  }

  const ip =
    safeKeyPart(
      request.headers.get(
        "cf-connecting-ip"
      ),
      "unknown-ip"
    );

  const result =
    await limiter.limit({
      key:
        `content:${kind}:${ip}`
    });

  if (
    result?.success ===
    false
  ) {
    return json(
      request,
      env,
      {
        error:
          "Too many content administration requests. Wait a moment and try again."
      },
      429,
      {
        "Retry-After":
          "60"
      }
    );
  }

  return null;
}

async function requireAdmin(
  request,
  env,
  kind
) {
  const limited =
    await rateLimitAdmin(
      request,
      env,
      kind
    );

  if (limited) {
    return {
      ok: false,
      response: limited
    };
  }

  const token =
    String(
      request.headers.get(
        "x-rms-teacher-session"
      ) || ""
    );

  const result =
    await verifyTeacherToken(
      token,
      env
    );

  if (!result.ok) {
    return {
      ok: false,
      response:
        json(
          request,
          env,
          {
            error:
              "Administrator session was not accepted."
          },
          401
        )
    };
  }

  return {
    ok: true
  };
}

async function readJsonBody(
  request
) {
  const contentType =
    String(
      request.headers.get(
        "content-type"
      ) || ""
    ).toLowerCase();

  if (
    !contentType.startsWith(
      "application/json"
    )
  ) {
    return {
      ok: false,
      status: 415,
      error:
        "Content request must use application/json."
    };
  }

  const declared =
    Number(
      request.headers.get(
        "content-length"
      )
    );

  if (
    Number.isFinite(declared) &&
    declared > MAX_BODY_BYTES
  ) {
    return {
      ok: false,
      status: 413,
      error:
        "Content request is too large."
    };
  }

  let text = "";

  try {
    text =
      await request.text();
  } catch {
    return {
      ok: false,
      status: 400,
      error:
        "Content request could not be read."
    };
  }

  if (
    encoder.encode(text)
      .byteLength >
    MAX_BODY_BYTES
  ) {
    return {
      ok: false,
      status: 413,
      error:
        "Content request is too large."
    };
  }

  try {
    return {
      ok: true,
      value:
        JSON.parse(text)
    };
  } catch {
    return {
      ok: false,
      status: 400,
      error:
        "Content request contains malformed JSON."
    };
  }
}

async function sha256Hex(text) {
  const digest =
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(
          String(text)
        )
      )
    );

  return [...digest]
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}

function newReleaseId() {
  return (
    "rel_" +
    crypto.randomUUID()
  );
}

function nowIso() {
  return new Date()
    .toISOString();
}

function conflictResponse(
  request,
  env,
  conflict
) {
  return json(
    request,
    env,
    {
      error:
        "Published content changed after this Admin draft was loaded.",
      code:
        "CONTENT_CONFLICT",
      expected_release_id:
        conflict.expected,
      current_release_id:
        conflict.actual
    },
    409
  );
}

function storageFailure(
  request,
  env
) {
  return json(
    request,
    env,
    {
      error:
        "Content service is temporarily unavailable."
    },
    503
  );
}

async function publicContent(
  request,
  env,
  store
) {
  if (
    request.method !==
    "GET"
  ) {
    return json(
      request,
      env,
      {
        error:
          "Method not allowed."
      },
      405,
      {
        "Allow":
          "GET, OPTIONS"
      }
    );
  }

  try {
    const current =
      await store.readCurrent();

    if (!current) {
      return json(
        request,
        env,
        {
          published: false
        },
        404
      );
    }

    const validation =
      validateStoredRelease(
        current
      );

    if (!validation.ok) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      {
        published: true,
        release:
          publicReleaseProjection(
            current
          )
      }
    );
  } catch {
    return storageFailure(
      request,
      env
    );
  }
}

async function adminState(
  request,
  env,
  store
) {
  if (
    request.method !==
    "GET"
  ) {
    return json(
      request,
      env,
      {
        error:
          "Method not allowed."
      },
      405,
      {
        "Allow":
          "GET, OPTIONS"
      }
    );
  }

  try {
    const current =
      await store.readCurrent();

    if (!current) {
      return json(
        request,
        env,
        {
          configured: true,
          published: false,
          current: null
        }
      );
    }

    const validation =
      validateStoredRelease(
        current
      );

    if (!validation.ok) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      {
        configured: true,
        published: true,
        current:
          revisionMetadata(
            current
          )
      }
    );
  } catch {
    return storageFailure(
      request,
      env
    );
  }
}

async function adminRevisions(
  request,
  env,
  store
) {
  if (
    request.method !==
    "GET"
  ) {
    return json(
      request,
      env,
      {
        error:
          "Method not allowed."
      },
      405,
      {
        "Allow":
          "GET, OPTIONS"
      }
    );
  }

  try {
    const revisions =
      await store
        .listRevisionMetadata();

    return json(
      request,
      env,
      {
        revisions
      }
    );
  } catch {
    return storageFailure(
      request,
      env
    );
  }
}

async function adminPublish(
  request,
  env,
  store
) {
  if (
    request.method !==
    "POST"
  ) {
    return json(
      request,
      env,
      {
        error:
          "Method not allowed."
      },
      405,
      {
        "Allow":
          "POST, OPTIONS"
      }
    );
  }

  const body =
    await readJsonBody(
      request
    );

  if (!body.ok) {
    return json(
      request,
      env,
      {
        error:
          body.error
      },
      body.status
    );
  }

  const validation =
    validateCandidate(
      body.value
    );

  if (!validation.ok) {
    return json(
      request,
      env,
      {
        error:
          "Content draft is invalid.",
        code:
          "CONTENT_INVALID",
        details:
          validation.errors
            .slice(0, 20)
      },
      400
    );
  }

  try {
    const current =
      await store.readCurrent();

    if (
      current &&
      !validateStoredRelease(
        current
      ).ok
    ) {
      return storageFailure(
        request,
        env
      );
    }

    const conflict =
      checkExpectedCurrentRelease(
        validation
          .candidate
          .expected_current_release_id,
        current
      );

    if (!conflict.ok) {
      return conflictResponse(
        request,
        env,
        conflict
      );
    }

    const hash =
      await sha256Hex(
        contentHashInput(
          validation.candidate
        )
      );

    const release =
      createRelease({
        candidate:
          validation.candidate,
        releaseId:
          newReleaseId(),
        nowIso:
          nowIso(),
        contentHash:
          hash,
        parentReleaseId:
          current
            ?.release_id ||
          null
      });

    await store.writeRevision(
      release,
      revisionMetadata(
        release
      )
    );

    await store.writeCurrent(
      release
    );

    return json(
      request,
      env,
      {
        ok: true,
        current:
          revisionMetadata(
            release
          )
      },
      201
    );
  } catch (error) {
    if (
      error?.code ===
      "REVISION_EXISTS"
    ) {
      return json(
        request,
        env,
        {
          error:
            "Content release identifier collision. Try publishing again."
        },
        409
      );
    }

    return storageFailure(
      request,
      env
    );
  }
}

function validRollbackBody(
  value
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const keys =
    Object.keys(value)
      .sort();

  const expected =
    [
      "change_summary",
      "expected_current_release_id",
      "target_release_id"
    ];

  if (
    keys.length !==
      expected.length ||
    !keys.every(
      (key, index) =>
        key ===
        expected[index]
    )
  ) {
    return null;
  }

  const expectedCurrent =
    String(
      value
        .expected_current_release_id ||
      ""
    ).trim();

  const target =
    String(
      value.target_release_id ||
      ""
    ).trim();

  const summary =
    String(
      value.change_summary ||
      ""
    ).trim();

  if (
    !/^[A-Za-z0-9_.:-]{1,160}$/
      .test(expectedCurrent) ||
    !/^[A-Za-z0-9_.:-]{1,160}$/
      .test(target) ||
    summary.length < 3 ||
    summary.length > 500
  ) {
    return null;
  }

  return {
    expectedCurrent,
    target,
    summary
  };
}

async function adminRollback(
  request,
  env,
  store
) {
  if (
    request.method !==
    "POST"
  ) {
    return json(
      request,
      env,
      {
        error:
          "Method not allowed."
      },
      405,
      {
        "Allow":
          "POST, OPTIONS"
      }
    );
  }

  const body =
    await readJsonBody(
      request
    );

  if (!body.ok) {
    return json(
      request,
      env,
      {
        error:
          body.error
      },
      body.status
    );
  }

  const rollback =
    validRollbackBody(
      body.value
    );

  if (!rollback) {
    return json(
      request,
      env,
      {
        error:
          "Rollback request is invalid."
      },
      400
    );
  }

  try {
    const [
      current,
      target
    ] =
      await Promise.all([
        store.readCurrent(),
        store.readRevision(
          rollback.target
        )
      ]);

    if (
      !current ||
      !validateStoredRelease(
        current
      ).ok
    ) {
      return storageFailure(
        request,
        env
      );
    }

    if (!target) {
      return json(
        request,
        env,
        {
          error:
            "Requested content revision was not found."
        },
        404
      );
    }

    if (
      !validateStoredRelease(
        target
      ).ok
    ) {
      return storageFailure(
        request,
        env
      );
    }

    const conflict =
      checkExpectedCurrentRelease(
        rollback
          .expectedCurrent,
        current
      );

    if (!conflict.ok) {
      return conflictResponse(
        request,
        env,
        conflict
      );
    }

    const hash =
      await sha256Hex(
        contentHashInput(
          target
        )
      );

    const release =
      createRollbackRelease({
        currentRelease:
          current,
        targetRelease:
          target,
        releaseId:
          newReleaseId(),
        nowIso:
          nowIso(),
        contentHash:
          hash,
        changeSummary:
          rollback.summary
      });

    await store.writeRevision(
      release,
      revisionMetadata(
        release
      )
    );

    await store.writeCurrent(
      release
    );

    return json(
      request,
      env,
      {
        ok: true,
        current:
          revisionMetadata(
            release
          )
      },
      201
    );
  } catch (error) {
    if (
      error?.code ===
      "REVISION_EXISTS"
    ) {
      return json(
        request,
        env,
        {
          error:
            "Content release identifier collision. Try rollback again."
        },
        409
      );
    }

    return storageFailure(
      request,
      env
    );
  }
}

async function preflight(
  request,
  env,
  pathname
) {
  if (
    !allowedOrigin(
      request,
      env
    )
  ) {
    return json(
      request,
      env,
      {
        error:
          "Origin not allowed."
      },
      403
    );
  }

  const isPublic =
    pathname ===
    PUBLIC_PATH;

  return new Response(
    null,
    {
      status: 204,
      headers:
        headers(
          request,
          env,
          {
            "Access-Control-Allow-Methods":
              isPublic
                ? "GET, OPTIONS"
                : "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers":
              isPublic
                ? "Content-Type"
                : "Content-Type, X-RMS-Teacher-Session",
            "Access-Control-Max-Age":
              "600"
          }
        )
    }
  );
}

async function handleContentRequest(
  request,
  env
) {
  const url =
    new URL(
      request.url
    );

  if (!contentPath(url.pathname)) {
    return null;
  }

  if (
    !allowedOrigin(
      request,
      env
    )
  ) {
    return json(
      request,
      env,
      {
        error:
          "Origin not allowed."
      },
      403
    );
  }

  if (
    request.method ===
    "OPTIONS"
  ) {
    return preflight(
      request,
      env,
      url.pathname
    );
  }

  if (
    url.pathname ===
    PUBLIC_PATH
  ) {
    const publicStore =
      storeFor(env);

    if (!publicStore) {
      return json(
        request,
        env,
        {
          error:
            "Content service is not configured."
        },
        503
      );
    }

    return publicContent(
      request,
      env,
      publicStore
    );
  }

  const admin =
    await requireAdmin(
      request,
      env,
      url.pathname
        .split("/")
        .pop()
    );

  if (!admin.ok) {
    return admin.response;
  }

  const store =
    storeFor(env);

  if (!store) {
    return json(
      request,
      env,
      {
        error:
          "Content administration service is not configured."
      },
      503
    );
  }

  if (
    url.pathname ===
    ADMIN_STATE_PATH
  ) {
    return adminState(
      request,
      env,
      store
    );
  }

  if (
    url.pathname ===
    ADMIN_REVISIONS_PATH
  ) {
    return adminRevisions(
      request,
      env,
      store
    );
  }

  if (
    url.pathname ===
    ADMIN_PUBLISH_PATH
  ) {
    return adminPublish(
      request,
      env,
      store
    );
  }

  if (
    url.pathname ===
    ADMIN_ROLLBACK_PATH
  ) {
    return adminRollback(
      request,
      env,
      store
    );
  }

  return null;
}

export {
  ADMIN_PUBLISH_PATH,
  ADMIN_REVISIONS_PATH,
  ADMIN_ROLLBACK_PATH,
  ADMIN_STATE_PATH,
  MAX_BODY_BYTES,
  PUBLIC_PATH,
  allowedOrigin,
  contentPath,
  handleContentRequest,
  readJsonBody,
  sha256Hex,
  validRollbackBody
};
