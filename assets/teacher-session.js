window.RMSTeacherSession = (() => {
  "use strict";

  const TOKEN_KEY =
    "rms_teacher_session_token_v1";

  const EXPIRES_KEY =
    "rms_teacher_session_expires_v1";

  let verified = false;
  let verificationPromise = null;

  function endpointRoot() {
    try {
      const config =
        window.RMS_RUNTIME_CONFIG || {};

      const raw = String(
        config.researchChatEndpoint ||
        config.chatEndpoint ||
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
      Date.parse(storedExpiry());

    return (
      Number.isFinite(value) &&
      value > Date.now()
    );
  }

  function hasStoredSession() {
    const token = storedToken();

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

  function emitState() {
    try {
      window.dispatchEvent(
        new CustomEvent(
          "rms-teacher-session-change",
          {
            detail: {
              active:
                isActive()
            }
          }
        )
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

  async function login(code) {
    const endpoint =
      endpointRoot();

    const supplied =
      String(code || "").trim();

    verified = false;

    if (!endpoint) {
      return {
        ok: false,
        status: 0,
        error:
          "Teacher access is not configured."
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
          "Teacher access was not accepted."
      };
    }

    try {
      const response = await fetch(
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
        await readJson(response);

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
              ? "Teacher access was not accepted."
              : "Teacher access is unavailable right now."
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
            "This browser could not start a teacher session."
        };
      }

      verified = true;
      emitState();

      return {
        ok: true,
        status: response.status,
        expiresAt:
          body.expiresAt
      };
    } catch {
      clearSession();

      return {
        ok: false,
        status: 0,
        error:
          "Teacher access is unavailable right now."
      };
    }
  }

  async function performVerification() {
    if (!hasStoredSession()) {
      clearSession();
      emitState();
      return false;
    }

    const endpoint =
      endpointRoot();

    if (!endpoint) {
      verified = false;
      emitState();
      return false;
    }

    try {
      const response = await fetch(
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
        await readJson(response);

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
        emitState();
        return true;
      }

      verified = false;

      if (response.status === 401) {
        clearSession();
      }

      emitState();
      return false;
    } catch {
      /*
        Fail closed for this page load.
        Keep an unexpired token so a
        temporary network failure does
        not destroy the teacher session.
      */
      verified = false;
      emitState();
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

  function leave() {
    clearSession();
    emitState();
  }

  /*
    Verification is intentionally
    asynchronous. Teacher UI must use
    isActive() only after verification,
    or await verify().
  */
  if (hasStoredSession()) {
    void verify();
  }

  return Object.freeze({
    login,
    verify,
    isActive,
    leave,
    hasStoredSession
  });
})();
