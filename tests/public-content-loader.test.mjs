import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";
import vm from "node:vm";

const curriculumSource =
  readFileSync(
    "assets/curriculum.js",
    "utf8"
  );

const loaderSource =
  readFileSync(
    "assets/public-content-loader.js",
    "utf8"
  );

const indexSource =
  readFileSync(
    "index.html",
    "utf8"
  );

const appSource =
  readFileSync(
    "assets/app.js",
    "utf8"
  );

const runtimeSource =
  readFileSync(
    "assets/runtime-config.js",
    "utf8"
  );

function deepClone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function bodyStub() {
  const attrs =
    new Map();

  return {
    inert: false,
    setAttribute(
      name,
      value
    ) {
      attrs.set(
        name,
        String(value)
      );
    },
    removeAttribute(name) {
      attrs.delete(name);
    },
    hasAttribute(name) {
      return attrs.has(name);
    }
  };
}

function response({
  status = 200,
  body
}) {
  return {
    status,
    ok:
      status >= 200 &&
      status < 300,
    async json() {
      return deepClone(body);
    }
  };
}

function releaseFor(
  curriculum,
  {
    releaseId =
      "rel_public_loader_test",
    mutateRecord = null
  } = {}
) {
  const records =
    curriculum.stages.map(
      stage => ({
        key:
          `curriculum.stage.${stage.id}.guidance`,
        type:
          "stage_guidance",
        phase:
          stage.phase,
        stage_id:
          stage.id,
        value: {
          title:
            stage.title,
          nav:
            stage.nav,
          purpose:
            stage.purpose,
          learn_html:
            stage.learn,
          example_html:
            stage.example,
          warning_html:
            stage.warning
        }
      })
    );

  if (
    typeof mutateRecord ===
      "function"
  ) {
    mutateRecord(records);
  }

  return {
    published: true,
    release: {
      schema_version:
        "1.0",
      content_version:
        releaseId,
      release_id:
        releaseId,
      published_at:
        "2026-09-19T08:00:00.000Z",
      content_hash:
        "a".repeat(64),
      records
    }
  };
}

function contextFor({
  fetchImpl,
  endpoint =
    "https://rms-research-methods-v3.gmoon-code.workers.dev/",
  setTimeoutImpl =
    setTimeout,
  clearTimeoutImpl =
    clearTimeout
} = {}) {
  const body =
    bodyStub();

  const window = {
    RMS_RUNTIME_CONFIG: {
      publicContentEndpoint:
        endpoint
    }
  };

  const context = {
    window,
    document: {
      body
    },
    URL,
    AbortController,
    Promise,
    fetch:
      fetchImpl ||
      (() =>
        Promise.resolve(
          response({
            status: 404,
            body: {
              published:
                false
            }
          })
        )),
    setTimeout:
      setTimeoutImpl,
    clearTimeout:
      clearTimeoutImpl,
    console
  };

  vm.runInNewContext(
    curriculumSource,
    context,
    {
      filename:
        "assets/curriculum.js"
    }
  );

  return {
    context,
    body,
    curriculum:
      context.window
        .RMSCurriculum
  };
}

async function runLoader(
  options = {}
) {
  const setup =
    contextFor(options);

  vm.runInNewContext(
    loaderSource,
    setup.context,
    {
      filename:
        "assets/public-content-loader.js"
    }
  );

  const state =
    await setup.context
      .window
      .RMSPublicContentReady;

  return {
    ...setup,
    state
  };
}

test(
  "public loader atomically applies a valid complete release while preserving curriculum identity",
  async () => {
    let original;
    let originalCustom;
    let originalSections;

    const setup =
      contextFor({
        fetchImpl:
          async () =>
            response({
              body:
                releaseFor(
                  setup.curriculum,
                  {
                    mutateRecord(
                      records
                    ) {
                      records[0]
                        .value
                        .title =
                        "Published Stage 1";
                      records[0]
                        .value
                        .purpose =
                        "Published purpose";
                    }
                  }
                )
            })
      });

    original =
      setup.curriculum;

    originalCustom =
      original.stages[0]
        .custom;

    originalSections =
      original.stages[0]
        .sections;

    vm.runInNewContext(
      loaderSource,
      setup.context,
      {
        filename:
          "assets/public-content-loader.js"
      }
    );

    const state =
      await setup.context
        .window
        .RMSPublicContentReady;

    assert.equal(
      setup.context.window
        .RMSCurriculum,
      original
    );

    assert.equal(
      original.stages[0]
        .title,
      "Published Stage 1"
    );

    assert.equal(
      original.stages[0]
        .purpose,
      "Published purpose"
    );

    assert.equal(
      original.stages[0]
        .custom,
      originalCustom
    );

    assert.equal(
      original.stages[0]
        .sections,
      originalSections
    );

    assert.deepEqual(
      {
        source:
          state.source,
        load_status:
          state.load_status,
        release_id:
          state.release_id,
        content_version:
          state.content_version
      },
      {
        source:
          "published",
        load_status:
          "published",
        release_id:
          "rel_public_loader_test",
        content_version:
          "rel_public_loader_test"
      }
    );

    assert.equal(
      Object.isFrozen(
        setup.context.window
          .RMSPublicContentState
      ),
      true
    );

    assert.equal(
      setup.body.inert,
      false
    );

    assert.equal(
      setup.body.hasAttribute(
        "aria-busy"
      ),
      false
    );
  }
);

test(
  "public loader rejects active markup and leaves all bundled stages unchanged",
  async () => {
    let baseline;

    const setup =
      contextFor({
        fetchImpl:
          async () => {
            const payload =
              releaseFor(
                setup.curriculum,
                {
                  mutateRecord(
                    records
                  ) {
                    records[0]
                      .value
                      .learn_html =
                      '<img src="x">';
                  }
                }
              );

            return response({
              body: payload
            });
          }
      });

    baseline =
      deepClone(
        setup.curriculum
          .stages
      );

    vm.runInNewContext(
      loaderSource,
      setup.context
    );

    const state =
      await setup.context
        .window
        .RMSPublicContentReady;

    assert.equal(
      state.source,
      "bundled"
    );

    assert.equal(
      state.load_status,
      "rejected"
    );

    assert.equal(
      state.failure_category,
      "release-validation"
    );

    assert.deepEqual(
      deepClone(
        setup.curriculum
          .stages
      ),
      baseline
    );
  }
);

test(
  "public loader rejects an incomplete release without a partial overlay",
  async () => {
    const setup =
      contextFor({
        fetchImpl:
          async () => {
            const payload =
              releaseFor(
                setup.curriculum
              );

            payload.release
              .records
              .pop();

            return response({
              body: payload
            });
          }
      });

    const baseline =
      deepClone(
        setup.curriculum
          .stages
      );

    vm.runInNewContext(
      loaderSource,
      setup.context
    );

    const state =
      await setup.context
        .window
        .RMSPublicContentReady;

    assert.equal(
      state.load_status,
      "rejected"
    );

    assert.deepEqual(
      deepClone(
        setup.curriculum
          .stages
      ),
      baseline
    );
  }
);

test(
  "public loader uses bundled curriculum when no publication exists",
  async () => {
    const {
      state,
      curriculum
    } =
      await runLoader({
        fetchImpl:
          async () =>
            response({
              status: 404,
              body: {
                published:
                  false
              }
            })
      });

    assert.equal(
      state.source,
      "bundled"
    );

    assert.equal(
      state.load_status,
      "no-publication"
    );

    assert.equal(
      curriculum.stages.length,
      18
    );
  }
);

test(
  "startup timeout falls back once and a late response cannot mutate curriculum",
  async () => {
    let resolveFetch;

    const setup =
      contextFor({
        fetchImpl:
          () =>
            new Promise(
              resolve => {
                resolveFetch =
                  resolve;
              }
            ),
        setTimeoutImpl:
          fn => {
            queueMicrotask(fn);
            return 1;
          },
        clearTimeoutImpl:
          () => {}
      });

    const baseline =
      deepClone(
        setup.curriculum
          .stages
      );

    vm.runInNewContext(
      loaderSource,
      setup.context
    );

    const state =
      await setup.context
        .window
        .RMSPublicContentReady;

    assert.equal(
      state.load_status,
      "timeout"
    );

    resolveFetch(
      response({
        body:
          releaseFor(
            setup.curriculum,
            {
              mutateRecord(
                records
              ) {
                records[0]
                  .value
                  .title =
                  "Too late";
              }
            }
          )
      })
    );

    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(
      deepClone(
        setup.curriculum
          .stages
      ),
      baseline
    );
  }
);

test(
  "invalid or missing public endpoint never sends a request",
  async () => {
    let calls = 0;

    const {
      state
    } =
      await runLoader({
        endpoint:
          "http://example.com/",
        fetchImpl:
          async () => {
            calls += 1;
            throw new Error(
              "should not fetch"
            );
          }
      });

    assert.equal(
      calls,
      0
    );

    assert.equal(
      state.load_status,
      "no-config"
    );

    assert.equal(
      state.source,
      "bundled"
    );
  }
);

test(
  "public loader has no Admin credential persistence telemetry or mutation path",
  () => {
    for (
      const forbidden
      of [
        "adminContentEndpoint",
        "/admin/content/",
        "X-RMS-Teacher",
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "sendBeacon",
        "WebSocket"
      ]
    ) {
      assert.equal(
        loaderSource.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }

    assert.match(
      loaderSource,
      /\/content\/public/
    );

    assert.match(
      loaderSource,
      /credentials:\s*"omit"/
    );

    assert.match(
      loaderSource,
      /cache:\s*"no-store"/
    );
  }
);

test(
  "student boot loads runtime config curriculum and public loader before dependent modules",
  () => {
    const runtimeIndex =
      indexSource.indexOf(
        'assets/runtime-config.js'
      );

    const curriculumIndex =
      indexSource.indexOf(
        'assets/curriculum.js'
      );

    const loaderIndex =
      indexSource.indexOf(
        'assets/public-content-loader.js'
      );

    const firstDependentIndex =
      indexSource.indexOf(
        'assets/pathway-model.js'
      );

    const appIndex =
      indexSource.indexOf(
        'assets/app.js'
      );

    assert.ok(
      runtimeIndex >= 0
    );

    assert.ok(
      curriculumIndex >
      runtimeIndex
    );

    assert.ok(
      loaderIndex >
      curriculumIndex
    );

    assert.ok(
      firstDependentIndex >
      loaderIndex
    );

    assert.ok(
      appIndex >
      loaderIndex
    );

    assert.equal(
      indexSource
        .split(
          "assets/runtime-config.js"
        )
        .length -
      1,
      1
    );
  }
);

test(
  "app initial render waits on the public content startup promise",
  () => {
    assert.match(
      appSource,
      /const contentReady=\s*window\.RMSPublicContentReady/
    );

    assert.match(
      appSource,
      /contentReady[\s\S]*\.then\(initialRender\)/
    );

    assert.match(
      appSource,
      /else\{\s*initialRender\(\);\s*\}/
    );
  }
);

test(
  "runtime configuration separates public content Admin content and student Chat endpoints",
  () => {
    assert.match(
      runtimeSource,
      /"researchChatEndpoint":\s*"https:\/\/rms-research-chat-free\.gmoon-code\.workers\.dev\/"/
    );

    assert.match(
      runtimeSource,
      /"chatEndpoint":\s*"https:\/\/rms-research-chat-free\.gmoon-code\.workers\.dev\/"/
    );

    assert.match(
      runtimeSource,
      /"publicContentEndpoint":\s*"https:\/\/rms-research-methods-v3\.gmoon-code\.workers\.dev\/"/
    );

    assert.match(
      runtimeSource,
      /"adminContentEndpoint":\s*"https:\/\/rms-research-methods-v3\.gmoon-code\.workers\.dev\/"/
    );
  }
);
