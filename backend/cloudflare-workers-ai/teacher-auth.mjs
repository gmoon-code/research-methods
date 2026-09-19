import { parseAllowedOrigins } from "../../api/research-chat.js";

const LOGIN_PATH = "/teacher/session";
const VERIFY_PATH = "/teacher/session/verify";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

const encoder = new TextEncoder();

function teacherPath(pathname) {
  return pathname === LOGIN_PATH || pathname === VERIFY_PATH;
}

function allowedOrigin(request, env) {
  const origin = String(request.headers.get("origin") || "").trim();
  return parseAllowedOrigins(env).includes(origin) ? origin : "";
}

function responseHeaders(request, env, extra = {}) {
  const origin = allowedOrigin(request, env);

  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin",
    ...extra
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function json(request, env, body, status = 200, extra = {}) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: responseHeaders(request, env, extra)
    }
  );
}

function configured(env) {
  return Boolean(
    String(env?.RMS_TEACHER_ACCESS_CODE || "").trim() &&
    String(env?.RMS_TEACHER_SESSION_SECRET || "").trim().length >= 32
  );
}

function limiterConfigured(env) {
  return Boolean(
    env?.AUTH_RATE_LIMITER &&
    typeof env.AUTH_RATE_LIMITER.limit === "function"
  );
}

function safeKeyPart(value, fallback = "unknown") {
  const text = String(value || "").trim();

  return /^[A-Za-z0-9_.:-]{1,160}$/.test(text)
    ? text
    : fallback;
}

async function applyTeacherRateLimit(request, env, kind) {
  if (!limiterConfigured(env)) {
    return json(
      request,
      env,
      { error: "Teacher access service is not configured." },
      503
    );
  }

  const ip = safeKeyPart(
    request.headers.get("cf-connecting-ip"),
    "unknown-ip"
  );

  const result = await env.AUTH_RATE_LIMITER.limit({
    key: `teacher:${kind}:${ip}`
  });

  if (result?.success === false) {
    return json(
      request,
      env,
      {
        error:
          "Too many teacher access attempts. Wait a moment and try again."
      },
      429,
      { "Retry-After": "60" }
    );
  }

  return null;
}

async function sha256(text) {
  return new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(String(text))
    )
  );
}

function constantTimeEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

async function secretEqual(a, b) {
  const [left, right] = await Promise.all([
    sha256(a),
    sha256(b)
  ]);

  return constantTimeEqual(left, right);
}

function base64UrlEncode(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    normalized +
    "=".repeat((4 - (normalized.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function signingKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
}

async function sign(secret, value) {
  const key = await signingKey(secret);

  return new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(value)
    )
  );
}

async function createTeacherToken(env) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    v: 1,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    jti: crypto.randomUUID()
  };

  const encodedPayload = base64UrlEncode(
    encoder.encode(JSON.stringify(payload))
  );

  const signature = await sign(
    env.RMS_TEACHER_SESSION_SECRET,
    encodedPayload
  );

  return {
    token:
      `${encodedPayload}.${base64UrlEncode(signature)}`,
    expiresAt:
      new Date(payload.exp * 1000).toISOString()
  };
}

async function verifyTeacherToken(token, env) {
  try {
    const parts = String(token || "").split(".");

    if (parts.length !== 2) {
      return { ok: false };
    }

    const [encodedPayload, encodedSignature] = parts;

    if (
      encodedPayload.length > 2048 ||
      encodedSignature.length > 512
    ) {
      return { ok: false };
    }

    const supplied = base64UrlDecode(
      encodedSignature
    );

    if (
      base64UrlEncode(supplied) !==
      encodedSignature
    ) {
      return { ok: false };
    }

    const payloadBytes =
      base64UrlDecode(
        encodedPayload
      );

    if (
      base64UrlEncode(payloadBytes) !==
      encodedPayload
    ) {
      return { ok: false };
    }

    const expected = await sign(
      env.RMS_TEACHER_SESSION_SECRET,
      encodedPayload
    );

    if (!constantTimeEqual(expected, supplied)) {
      return { ok: false };
    }

    const payloadText =
      new TextDecoder().decode(
        payloadBytes
      );

    const payload = JSON.parse(payloadText);
    const now = Math.floor(Date.now() / 1000);

    if (
      payload?.v !== 1 ||
      !Number.isFinite(payload?.iat) ||
      !Number.isFinite(payload?.exp) ||
      payload.exp <= now ||
      payload.iat > now + 60 ||
      payload.exp - payload.iat > SESSION_TTL_SECONDS
    ) {
      return { ok: false };
    }

    return {
      ok: true,
      expiresAt:
        new Date(payload.exp * 1000).toISOString()
    };
  } catch {
    return { ok: false };
  }
}

async function preflight(request, env) {
  if (!allowedOrigin(request, env)) {
    return json(
      request,
      env,
      { error: "Origin not allowed." },
      403
    );
  }

  return new Response(null, {
    status: 204,
    headers: responseHeaders(
      request,
      env,
      {
        "Access-Control-Allow-Methods":
          "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, X-RMS-Teacher-Code, X-RMS-Teacher-Session",
        "Access-Control-Max-Age": "600"
      }
    )
  });
}

async function login(request, env) {
  if (!configured(env)) {
    return json(
      request,
      env,
      { error: "Teacher access service is not configured." },
      503
    );
  }

  const limited = await applyTeacherRateLimit(
    request,
    env,
    "login"
  );

  if (limited) {
    return limited;
  }

  const supplied = String(
    request.headers.get("x-rms-teacher-code") || ""
  );

  if (
    !supplied ||
    supplied.length > 256 ||
    !(await secretEqual(
      supplied,
      env.RMS_TEACHER_ACCESS_CODE
    ))
  ) {
    return json(
      request,
      env,
      { error: "Teacher access was not accepted." },
      401
    );
  }

  const session = await createTeacherToken(env);

  return json(
    request,
    env,
    {
      ok: true,
      token: session.token,
      expiresAt: session.expiresAt
    }
  );
}

async function verify(request, env) {
  if (!configured(env)) {
    return json(
      request,
      env,
      { error: "Teacher access service is not configured." },
      503
    );
  }

  const limited = await applyTeacherRateLimit(
    request,
    env,
    "verify"
  );

  if (limited) {
    return limited;
  }

  const token = String(
    request.headers.get("x-rms-teacher-session") || ""
  );

  const result = await verifyTeacherToken(
    token,
    env
  );

  if (!result.ok) {
    return json(
      request,
      env,
      { ok: false },
      401
    );
  }

  return json(
    request,
    env,
    {
      ok: true,
      expiresAt: result.expiresAt
    }
  );
}

async function handleTeacherRequest(request, env) {
  const url = new URL(request.url);

  if (!teacherPath(url.pathname)) {
    return null;
  }

  if (!allowedOrigin(request, env)) {
    return json(
      request,
      env,
      { error: "Origin not allowed." },
      403
    );
  }

  if (request.method === "OPTIONS") {
    return preflight(request, env);
  }

  if (request.method !== "POST") {
    return json(
      request,
      env,
      { error: "Method not allowed." },
      405,
      { Allow: "POST, OPTIONS" }
    );
  }

  if (url.pathname === LOGIN_PATH) {
    return login(request, env);
  }

  if (url.pathname === VERIFY_PATH) {
    return verify(request, env);
  }

  return null;
}

export {
  LOGIN_PATH,
  VERIFY_PATH,
  SESSION_TTL_SECONDS,
  configured,
  createTeacherToken,
  handleTeacherRequest,
  teacherPath,
  verifyTeacherToken
};
