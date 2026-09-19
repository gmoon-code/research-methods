import {
  parseAllowedOrigins
} from "../../api/research-chat.js";

import {
  configured as teacherAuthConfigured,
  verifyTeacherToken
} from "./teacher-auth.mjs";

import {
  validateCandidate
} from "./content-publication.mjs";

import {
  safeRollbackInput
} from "./content-coordinator-core.mjs";

import {
  createContentCoordinatorClient
} from "./content-coordinator-client.mjs";

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

function clientFor(env) {
  return createContentCoordinatorClient(
    env?.RMS_CONTENT_COORDINATOR
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
  if (
    !teacherAuthConfigured(
      env
    )
  ) {
    return {
      ok: false,
      response:
        json(
          request,
          env,
          {
            error:
              "Content administration service is not configured."
          },
          503
        )
    };
  }

  const limited =
    await rateLimitAdmin(
      request,
      env,
      kind
    );

  if (limited) {
    return {
      ok: false,
      response:
        limited
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
    Number.isFinite(
      declared
    ) &&
    declared >
      MAX_BODY_BYTES
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
    encoder
      .encode(text)
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

function validRollbackBody(
  value
) {
  return safeRollbackInput(
    value
  );
}

async function publicContent(
  request,
  env,
  client
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
    const result =
      await client
        .publicState();

    if (
      result.status !==
      200
    ) {
      return storageFailure(
        request,
        env
      );
    }

    if (
      result.value
        .published ===
        false
    ) {
      return json(
        request,
        env,
        {
          published: false
        },
        404
      );
    }

    if (
      result.value
        .published !==
        true ||
      !result.value.release
    ) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      result.value
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
  client
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
    const result =
      await client
        .adminState();

    if (
      result.status !==
        200 ||
      result.value
        .configured !==
        true
    ) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      result.value
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
  client
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
    const result =
      await client
        .revisions();

    if (
      result.status !==
        200 ||
      !Array.isArray(
        result.value
          .revisions
      )
    ) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      {
        revisions:
          result.value
            .revisions
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
  client
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
    const result =
      await client.publish(
        validation.candidate
      );

    if (
      !Number.isInteger(
        result.status
      ) ||
      result.status < 200 ||
      result.status > 599
    ) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      result.value,
      result.status
    );
  } catch {
    return storageFailure(
      request,
      env
    );
  }
}

async function adminRollback(
  request,
  env,
  client
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

  if (
    !validRollbackBody(
      body.value
    )
  ) {
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
    const result =
      await client.rollback(
        body.value
      );

    if (
      !Number.isInteger(
        result.status
      ) ||
      result.status < 200 ||
      result.status > 599
    ) {
      return storageFailure(
        request,
        env
      );
    }

    return json(
      request,
      env,
      result.value,
      result.status
    );
  } catch {
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

  const isReadOnlyAdmin =
    pathname ===
      ADMIN_STATE_PATH ||
    pathname ===
      ADMIN_REVISIONS_PATH;

  const methods =
    isPublic ||
    isReadOnlyAdmin
      ? "GET, OPTIONS"
      : "POST, OPTIONS";

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
              methods,
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

  if (
    !contentPath(
      url.pathname
    )
  ) {
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
    const publicClient =
      clientFor(env);

    if (!publicClient) {
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
      publicClient
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

  const client =
    clientFor(env);

  if (!client) {
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
      client
    );
  }

  if (
    url.pathname ===
    ADMIN_REVISIONS_PATH
  ) {
    return adminRevisions(
      request,
      env,
      client
    );
  }

  if (
    url.pathname ===
    ADMIN_PUBLISH_PATH
  ) {
    return adminPublish(
      request,
      env,
      client
    );
  }

  if (
    url.pathname ===
    ADMIN_ROLLBACK_PATH
  ) {
    return adminRollback(
      request,
      env,
      client
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
  clientFor,
  contentPath,
  handleContentRequest,
  readJsonBody,
  validRollbackBody
};
