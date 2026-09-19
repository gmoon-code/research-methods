window.RMSAdminContentService = (() => {
  "use strict";

  const TOKEN_KEY =
    "rms_admin_content_session_token_v1";

  const EXPIRES_KEY =
    "rms_admin_content_session_expires_v1";

  let verified = false;
  let verificationPromise = null;

  function endpointRoot() {
    try {
      const config =
        window.RMS_RUNTIME_CONFIG || {};

      const raw = String(
        config.adminContentEndpoint ||
        ""
      ).trim();

      if (!raw) {
        return "";
      }

      const url = new URL(raw);

      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        !url.hostname.endsWith(
          ".workers.dev"
        )
      ) {
        return "";
      }

      url.pathname = "/";
      url.search = "";
      url.hash = "";

      return url.toString().replace(
        /\/$/,
        ""
      );
    } catch {
      return "";
    }
  }

  function endpointOrigin() {
    const root =
      endpointRoot();

    if (!root) {
      return "";
    }

    try {
      return new URL(
        root
      ).origin;
    } catch {
      return "";
    }
  }

  function storedToken() {
    try {
      return String(
        sessionStorage.getItem(
          TOKEN_KEY
        ) || ""
      );
    } catch {
      return "";
    }
  }

  function storedExpiry() {
    try {
      return String(
        sessionStorage.getItem(
          EXPIRES_KEY
        ) || ""
      );
    } catch {
      return "";
    }
  }

  function expiryValid() {
    const value =
      Date.parse(
        storedExpiry()
      );

    return (
      Number.isFinite(value) &&
      value > Date.now()
    );
  }

  function hasStoredSession() {
    const token =
      storedToken();

    return Boolean(
      token &&
      token.length <= 4096 &&
      token.includes(".") &&
      expiryValid()
    );
  }

  function saveSession(
    token,
    expiresAt
  ) {
    try {
      sessionStorage.setItem(
        TOKEN_KEY,
        String(token)
      );

      sessionStorage.setItem(
        EXPIRES_KEY,
        String(expiresAt)
      );

      return true;
    } catch {
      return false;
    }
  }

  function clearSession() {
    verified = false;

    try {
      sessionStorage.removeItem(
        TOKEN_KEY
      );

      sessionStorage.removeItem(
        EXPIRES_KEY
      );
    } catch {}
  }

  function isActive() {
    return Boolean(
      verified &&
      hasStoredSession()
    );
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function normalizedError(
    response,
    body,
    fallback
  ) {
    const message =
      typeof body?.error ===
        "string"
        ? body.error.trim()
        : "";

    if (message) {
      return message;
    }

    if (
      response?.status ===
      401
    ) {
      return "Publication service session was not accepted.";
    }

    if (
      response?.status ===
      429
    ) {
      return "Publication service rate limit reached. Wait a moment and try again.";
    }

    return fallback;
  }

  async function login(code) {
    const endpoint =
      endpointRoot();

    const supplied =
      String(code || "")
        .trim();

    verified = false;

    if (!endpoint) {
      return {
        ok: false,
        status: 0,
        error:
          "Publication service is not configured."
      };
    }

    if (
      supplied.length < 16 ||
      supplied.length > 256
    ) {
      return {
        ok: false,
        status: 401,
        error:
          "Publication access was not accepted."
      };
    }

    try {
      const response =
        await fetch(
          `${endpoint}/teacher/session`,
          {
            method: "POST",
            headers: {
              "X-RMS-Teacher-Code":
                supplied
            },
            cache: "no-store",
            credentials: "omit",
            referrerPolicy:
              "no-referrer"
          }
        );

      const body =
        await readJson(
          response
        );

      if (
        !response.ok ||
        body?.ok !== true ||
        typeof body?.token !==
          "string" ||
        typeof body?.expiresAt !==
          "string"
      ) {
        clearSession();

        return {
          ok: false,
          status:
            response.status,
          error:
            response.status === 401
              ? "Publication access was not accepted."
              : normalizedError(
                  response,
                  body,
                  "Publication service is unavailable right now."
                )
        };
      }

      if (
        !saveSession(
          body.token,
          body.expiresAt
        )
      ) {
        clearSession();

        return {
          ok: false,
          status: 0,
          error:
            "This browser could not start a publication session."
        };
      }

      verified = true;

      return {
        ok: true,
        status:
          response.status,
        expiresAt:
          body.expiresAt
      };
    } catch {
      clearSession();

      return {
        ok: false,
        status: 0,
        error:
          "Publication service is unavailable right now."
      };
    }
  }

  async function performVerification() {
    if (!hasStoredSession()) {
      clearSession();
      return false;
    }

    const endpoint =
      endpointRoot();

    if (!endpoint) {
      verified = false;
      return false;
    }

    try {
      const response =
        await fetch(
          `${endpoint}/teacher/session/verify`,
          {
            method: "POST",
            headers: {
              "X-RMS-Teacher-Session":
                storedToken()
            },
            cache: "no-store",
            credentials: "omit",
            referrerPolicy:
              "no-referrer"
          }
        );

      const body =
        await readJson(
          response
        );

      if (
        response.ok &&
        body?.ok === true
      ) {
        if (
          typeof body.expiresAt ===
          "string"
        ) {
          saveSession(
            storedToken(),
            body.expiresAt
          );
        }

        verified = true;
        return true;
      }

      verified = false;

      if (
        response.status ===
        401
      ) {
        clearSession();
      }

      return false;
    } catch {
      verified = false;
      return false;
    }
  }

  function verify() {
    if (verificationPromise) {
      return verificationPromise;
    }

    verificationPromise =
      performVerification()
        .finally(() => {
          verificationPromise =
            null;
        });

    return verificationPromise;
  }

  async function request(
    path,
    {
      method = "GET",
      body,
      auth = true
    } = {}
  ) {
    const endpoint =
      endpointRoot();

    if (!endpoint) {
      return {
        ok: false,
        status: 0,
        body: {},
        error:
          "Publication service is not configured."
      };
    }

    if (
      auth &&
      !isActive()
    ) {
      return {
        ok: false,
        status: 401,
        body: {},
        error:
          "Publication service session is not active."
      };
    }

    const headers =
      new Headers({
        Accept:
          "application/json"
      });

    if (auth) {
      headers.set(
        "X-RMS-Teacher-Session",
        storedToken()
      );
    }

    if (
      body !== undefined
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    try {
      const response =
        await fetch(
          endpoint +
          path,
          {
            method,
            headers,
            body:
              body === undefined
                ? undefined
                : JSON.stringify(
                    body
                  ),
            cache: "no-store",
            credentials: "omit",
            referrerPolicy:
              "no-referrer"
          }
        );

      const value =
        await readJson(
          response
        );

      if (
        auth &&
        response.status ===
        401
      ) {
        clearSession();
      }

      return {
        ok:
          response.ok,
        status:
          response.status,
        body:
          value,
        error:
          response.ok
            ? ""
            : normalizedError(
                response,
                value,
                "Publication service request failed."
              )
      };
    } catch {
      return {
        ok: false,
        status: 0,
        body: {},
        error:
          "Publication service is unavailable right now."
      };
    }
  }

  async function state() {
    return request(
      "/admin/content/state"
    );
  }

  async function revisions() {
    return request(
      "/admin/content/revisions"
    );
  }

  async function publicRelease() {
    const result =
      await request(
        "/content/public",
        {
          auth: false
        }
      );

    if (
      result.status ===
      404 &&
      result.body
        ?.published ===
        false
    ) {
      return {
        ok: true,
        status: 404,
        published: false,
        release: null,
        error: ""
      };
    }

    if (
      result.ok &&
      result.body
        ?.published ===
        true &&
      result.body
        ?.release
    ) {
      return {
        ok: true,
        status:
          result.status,
        published: true,
        release:
          result.body.release,
        error: ""
      };
    }

    return {
      ok: false,
      status:
        result.status,
      published: false,
      release: null,
      error:
        result.error ||
        "Published content could not be read."
    };
  }

  async function publish(
    candidate
  ) {
    return request(
      "/admin/content/publish",
      {
        method: "POST",
        body: candidate
      }
    );
  }

  async function rollback(
    input
  ) {
    return request(
      "/admin/content/rollback",
      {
        method: "POST",
        body: input
      }
    );
  }

  function leave() {
    clearSession();
  }

  return Object.freeze({
    TOKEN_KEY,
    EXPIRES_KEY,
    endpointOrigin,
    hasStoredSession,
    isActive,
    login,
    verify,
    state,
    revisions,
    publicRelease,
    publish,
    rollback,
    leave
  });
})();