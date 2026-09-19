import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function memoryStorage(
  initial = {}
) {
  const data =
    new Map(
      Object.entries(
        initial
      )
    );

  return {
    getItem(key) {
      return data.has(key)
        ? data.get(key)
        : null;
    },

    setItem(key, value) {
      data.set(
        key,
        String(value)
      );
    },

    removeItem(key) {
      data.delete(key);
    },

    snapshot() {
      return Object.fromEntries(
        data.entries()
      );
    }
  };
}

function jsonResponse(
  value,
  status = 200
) {
  return new Response(
    JSON.stringify(value),
    {
      status,
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );
}

function loadService({
  endpoint =
    "https://rms-research-methods-v3.gmoon-code.workers.dev/",
  fetchImpl,
  storage =
    memoryStorage()
} = {}) {
  const context = {
    window: {
      RMS_RUNTIME_CONFIG: {
        adminContentEndpoint:
          endpoint,
        researchChatEndpoint:
          "https://rms-research-chat-free.gmoon-code.workers.dev/"
      }
    },
    sessionStorage:
      storage,
    fetch:
      fetchImpl ||
      (async () =>
        jsonResponse(
          {},
          500
        )),
    URL,
    Headers,
    Response,
    Date,
    String,
    Number,
    Boolean,
    Object,
    Array,
    JSON,
    Map,
    Set,
    Promise,
    RegExp
  };

  vm.runInNewContext(
    readFileSync(
      "assets/admin-content-service.js",
      "utf8"
    ),
    context,
    {
      filename:
        "assets/admin-content-service.js"
    }
  );

  return {
    service:
      context.window
        .RMSAdminContentService,
    storage
  };
}

test(
  "Admin content service uses only the isolated v3 endpoint",
  () => {
    const {
      service
    } =
      loadService();

    assert.equal(
      service.endpointOrigin(),
      "https://rms-research-methods-v3.gmoon-code.workers.dev"
    );
  }
);

test(
  "Admin content endpoint rejects insecure credential-bearing and non-workers.dev values",
  () => {
    for (
      const endpoint
      of [
        "http://rms-research-methods-v3.gmoon-code.workers.dev/",
        "https://user:pass@rms-research-methods-v3.gmoon-code.workers.dev/",
        "https://example.com/"
      ]
    ) {
      const {
        service
      } =
        loadService({
          endpoint
        });

      assert.equal(
        service.endpointOrigin(),
        ""
      );
    }
  }
);

test(
  "publication login stores only the separate v3 session token and expiry",
  async () => {
    const calls = [];

    const storage =
      memoryStorage({
        rms_teacher_session_token_v1:
          "existing.v2.token",
        rms_teacher_session_expires_v1:
          "2099-01-01T00:00:00.000Z"
      });

    const {
      service
    } =
      loadService({
        storage,
        fetchImpl:
          async (
            url,
            options
          ) => {
            calls.push({
              url,
              options
            });

            return jsonResponse({
              ok: true,
              token:
                "content.session.token",
              expiresAt:
                "2099-01-01T00:00:00.000Z"
            });
          }
      });

    const result =
      await service.login(
        "1234567890abcdef"
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      calls.length,
      1
    );

    assert.equal(
      calls[0].url,
      "https://rms-research-methods-v3.gmoon-code.workers.dev/teacher/session"
    );

    assert.equal(
      calls[0]
        .options.headers[
          "X-RMS-Teacher-Code"
        ],
      "1234567890abcdef"
    );

    const values =
      storage.snapshot();

    assert.equal(
      values[
        service.TOKEN_KEY
      ],
      "content.session.token"
    );

    assert.equal(
      values[
        service.EXPIRES_KEY
      ],
      "2099-01-01T00:00:00.000Z"
    );

    assert.equal(
      values[
        "rms_teacher_session_token_v1"
      ],
      "existing.v2.token"
    );

    assert.equal(
      Object.values(values)
        .includes(
          "1234567890abcdef"
        ),
      false
    );
  }
);

test(
  "verified publication session authorizes Admin state requests",
  async () => {
    const calls = [];

    const {
      service
    } =
      loadService({
        fetchImpl:
          async (
            url,
            options
          ) => {
            calls.push({
              url,
              options
            });

            if (
              url.endsWith(
                "/teacher/session"
              )
            ) {
              return jsonResponse({
                ok: true,
                token:
                  "content.session.token",
                expiresAt:
                  "2099-01-01T00:00:00.000Z"
              });
            }

            return jsonResponse({
              configured: true,
              published: false,
              current: null
            });
          }
      });

    assert.equal(
      (
        await service.login(
          "1234567890abcdef"
        )
      ).ok,
      true
    );

    const result =
      await service.state();

    assert.equal(
      result.ok,
      true
    );

    const stateCall =
      calls.at(-1);

    assert.equal(
      stateCall.url,
      "https://rms-research-methods-v3.gmoon-code.workers.dev/admin/content/state"
    );

    assert.equal(
      stateCall
        .options.headers.get(
          "X-RMS-Teacher-Session"
        ),
      "content.session.token"
    );
  }
);

test(
  "401 clears only the publication session",
  async () => {
    const storage =
      memoryStorage({
        rms_teacher_session_token_v1:
          "existing.v2.token",
        rms_teacher_session_expires_v1:
          "2099-01-01T00:00:00.000Z"
      });

    let count = 0;

    const {
      service
    } =
      loadService({
        storage,
        fetchImpl:
          async url => {
            count += 1;

            if (
              count === 1
            ) {
              return jsonResponse({
                ok: true,
                token:
                  "content.session.token",
                expiresAt:
                  "2099-01-01T00:00:00.000Z"
              });
            }

            assert.match(
              String(url),
              /\/admin\/content\/state$/
            );

            return jsonResponse({
              error:
                "Administrator session was not accepted."
            }, 401);
          }
      });

    await service.login(
      "1234567890abcdef"
    );

    const result =
      await service.state();

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.status,
      401
    );

    const values =
      storage.snapshot();

    assert.equal(
      Object.hasOwn(
        values,
        service.TOKEN_KEY
      ),
      false
    );

    assert.equal(
      values[
        "rms_teacher_session_token_v1"
      ],
      "existing.v2.token"
    );
  }
);

test(
  "public release normalizes the no-publication state",
  async () => {
    const {
      service
    } =
      loadService({
        fetchImpl:
          async url => {
            assert.match(
              String(url),
              /\/content\/public$/
            );

            return jsonResponse({
              published: false
            }, 404);
          }
      });

    const result =
      await service
        .publicRelease();

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.published,
      false
    );

    assert.equal(
      result.release,
      null
    );
  }
);

test(
  "publication service source does not persist codes or reuse Chat endpoint settings",
  () => {
    const source =
      readFileSync(
        "assets/admin-content-service.js",
        "utf8"
      );

    assert.match(
      source,
      /adminContentEndpoint/
    );

    assert.doesNotMatch(
      source,
      /researchChatEndpoint/
    );

    assert.doesNotMatch(
      source,
      /chatEndpoint/
    );

    assert.doesNotMatch(
      source,
      /localStorage/
    );

    assert.doesNotMatch(
      source,
      /indexedDB/i
    );

    assert.doesNotMatch(
      source,
      /setItem[\s\S]{0,120}Teacher-Code/i
    );
  }
);

test(
  "student runtime modules do not consume the Admin content endpoint",
  () => {
    const sources = [
      "assets/app.js",
      "assets/student-flow.js",
      "assets/student-flow-ui.js",
      "assets/engine.js",
      "assets/journey.js",
      "assets/journey-ui.js"
    ].map(
      path =>
        readFileSync(
          path,
          "utf8"
        )
    );

    for (
      const source
      of sources
    ) {
      assert.doesNotMatch(
        source,
        /adminContentEndpoint/
      );

      assert.doesNotMatch(
        source,
        /RMSAdminContentService/
      );

      assert.doesNotMatch(
        source,
        /\/content\/public/
      );
    }
  }
);
