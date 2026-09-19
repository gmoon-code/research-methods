window.RMSPublicContentLoader = (() => {
  "use strict";

  const SCHEMA_VERSION =
    "1.0";

  const RECORD_TYPE =
    "stage_guidance";

  const STAGE_COUNT =
    18;

  const STARTUP_BUDGET_MS =
    1500;

  const VALUE_FIELDS =
    Object.freeze([
      "title",
      "nav",
      "purpose",
      "learn_html",
      "example_html",
      "warning_html"
    ]);

  const RECORD_FIELDS =
    Object.freeze([
      "key",
      "type",
      "phase",
      "stage_id",
      "value"
    ]);

  const RELEASE_FIELDS =
    Object.freeze([
      "schema_version",
      "content_version",
      "release_id",
      "published_at",
      "content_hash",
      "records"
    ]);

  const RESPONSE_FIELDS =
    Object.freeze([
      "published",
      "release"
    ]);

  const PLAIN_LIMITS =
    Object.freeze({
      title: 160,
      nav: 120,
      purpose: 1200
    });

  const MARKUP_LIMITS =
    Object.freeze({
      learn_html: 20000,
      example_html: 8000,
      warning_html: 8000
    });

  const STAGE_PHASES =
    Object.freeze({
      1: "discover",
      2: "discover",
      3: "discover",
      4: "discover",
      5: "literature",
      6: "literature",
      7: "literature",
      8: "literature",
      9: "design",
      10: "design",
      11: "design",
      12: "design",
      13: "analyze",
      14: "analyze",
      15: "analyze",
      16: "write",
      17: "write",
      18: "write"
    });

  const ALLOWED_TAGS =
    new Set([
      "h3",
      "p",
      "div",
      "strong",
      "b",
      "em",
      "i",
      "br",
      "ul",
      "ol",
      "li",
      "span"
    ]);

  const ALLOWED_CLASSES =
    new Set([
      "concept-box"
    ]);

  let state =
    Object.freeze({
      source: "bundled",
      content_version:
        "bundled",
      release_id: null,
      content_hash: null,
      load_status:
        "loading",
      failure_category:
        null
    });

  function publishState(next) {
    state =
      Object.freeze({
        source:
          next.source ||
          "bundled",
        content_version:
          next.content_version ||
          "bundled",
        release_id:
          next.release_id ||
          null,
        content_hash:
          next.content_hash ||
          null,
        load_status:
          next.load_status ||
          "unavailable",
        failure_category:
          next.failure_category ||
          null
      });

    window.RMSPublicContentState =
      state;

    return state;
  }

  function exactKeys(
    value,
    expected
  ) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const actual =
      Object.keys(value)
        .sort();

    const wanted =
      [...expected]
        .sort();

    return (
      actual.length ===
        wanted.length &&
      actual.every(
        (key, index) =>
          key === wanted[index]
      )
    );
  }

  function safeEndpoint() {
    const raw =
      String(
        window
          .RMS_RUNTIME_CONFIG
          ?.publicContentEndpoint ||
        ""
      ).trim();

    if (!raw) {
      return "";
    }

    try {
      const url =
        new URL(raw);

      if (
        url.protocol !==
          "https:" ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (
          url.pathname !==
            "/" &&
          url.pathname !==
            ""
        ) ||
        !url.hostname
          .endsWith(
            ".workers.dev"
          )
      ) {
        return "";
      }

      return url.origin;
    } catch {
      return "";
    }
  }

  function safeId(value) {
    const text =
      typeof value ===
        "string"
        ? value.trim()
        : "";

    return /^[A-Za-z0-9_.:-]{1,160}$/
      .test(text)
        ? text
        : "";
  }

  function safeIso(value) {
    const text =
      typeof value ===
        "string"
        ? value.trim()
        : "";

    if (!text) {
      return "";
    }

    const parsed =
      Date.parse(text);

    return Number
      .isFinite(parsed)
        ? new Date(
            parsed
          ).toISOString()
        : "";
  }

  function safeHash(value) {
    const text =
      typeof value ===
        "string"
        ? value
            .trim()
            .toLowerCase()
        : "";

    return /^[a-f0-9]{64}$/
      .test(text)
        ? text
        : "";
  }

  function validPlain(
    field,
    value
  ) {
    return (
      typeof value ===
        "string" &&
      value.trim() !==
        "" &&
      value.length <=
        PLAIN_LIMITS[field] &&
      !/[<>]/.test(value)
    );
  }

  function validClassAttribute(
    attributes
  ) {
    const match =
      String(
        attributes ||
        ""
      )
        .trim()
        .match(
          /^class\s*=\s*"([^"]+)"$/
        );

    if (!match) {
      return false;
    }

    const classes =
      match[1]
        .split(/\s+/)
        .filter(Boolean);

    return (
      classes.length > 0 &&
      classes.every(
        item =>
          ALLOWED_CLASSES
            .has(item)
      )
    );
  }

  function validMarkup(
    field,
    value
  ) {
    if (
      typeof value !==
        "string" ||
      value.trim() ===
        "" ||
      value.length >
        MARKUP_LIMITS[field]
    ) {
      return false;
    }

    if (
      /<\s*(script|style|iframe|object|embed|form|input|button|link|meta|svg|math|img|audio|video|source|track)\b/i
        .test(value) ||
      /\bon[a-z]+\s*=/i
        .test(value) ||
      /javascript\s*:/i
        .test(value) ||
      /\bsrc\s*=/i
        .test(value) ||
      /\bhref\s*=/i
        .test(value) ||
      /\bstyle\s*=/i
        .test(value)
    ) {
      return false;
    }

    const tags =
      value.match(
        /<[^>]+>/g
      ) || [];

    for (
      const token
      of tags
    ) {
      const match =
        token.match(
          /^<\s*\/?\s*([a-z0-9-]+)([\s\S]*?)>$/i
        );

      if (!match) {
        return false;
      }

      const tag =
        match[1]
          .toLowerCase();

      if (
        !ALLOWED_TAGS
          .has(tag)
      ) {
        return false;
      }

      const closing =
        /^<\s*\//.test(
          token
        );

      const attributes =
        String(
          match[2] ||
          ""
        )
          .replace(
            /^\s*\/\s*$/,
            ""
          )
          .trim();

      if (
        closing &&
        attributes
      ) {
        return false;
      }

      if (
        attributes &&
        !validClassAttribute(
          attributes
        )
      ) {
        return false;
      }
    }

    return true;
  }

  function validValue(value) {
    if (
      !exactKeys(
        value,
        VALUE_FIELDS
      )
    ) {
      return false;
    }

    for (
      const field
      of [
        "title",
        "nav",
        "purpose"
      ]
    ) {
      if (
        !validPlain(
          field,
          value[field]
        )
      ) {
        return false;
      }
    }

    for (
      const field
      of [
        "learn_html",
        "example_html",
        "warning_html"
      ]
    ) {
      if (
        !validMarkup(
          field,
          value[field]
        )
      ) {
        return false;
      }
    }

    return true;
  }

  function validRecord(
    record,
    bundledStage
  ) {
    if (
      !exactKeys(
        record,
        RECORD_FIELDS
      )
    ) {
      return false;
    }

    const stageId =
      record.stage_id;

    return (
      Number.isInteger(
        stageId
      ) &&
      stageId >= 1 &&
      stageId <=
        STAGE_COUNT &&
      record.key ===
        `curriculum.stage.${stageId}.guidance` &&
      record.type ===
        RECORD_TYPE &&
      record.phase ===
        STAGE_PHASES[
          stageId
        ] &&
      bundledStage?.id ===
        stageId &&
      bundledStage?.phase ===
        record.phase &&
      validValue(
        record.value
      )
    );
  }

  function validateRelease(
    release,
    curriculum
  ) {
    if (
      !exactKeys(
        release,
        RELEASE_FIELDS
      ) ||
      release.schema_version !==
        SCHEMA_VERSION
    ) {
      return {
        ok: false
      };
    }

    const id =
      safeId(
        release.release_id
      );

    if (
      !id ||
      release.content_version !==
        id ||
      !safeIso(
        release.published_at
      ) ||
      !safeHash(
        release.content_hash
      )
    ) {
      return {
        ok: false
      };
    }

    if (
      !Array.isArray(
        curriculum?.stages
      ) ||
      curriculum.stages.length !==
        STAGE_COUNT ||
      !Array.isArray(
        release.records
      ) ||
      release.records.length !==
        STAGE_COUNT
    ) {
      return {
        ok: false
      };
    }

    const patches = [];
    const seen =
      new Set();

    for (
      const record
      of release.records
    ) {
      const bundledStage =
        curriculum.stages
          .find(
            stage =>
              stage.id ===
              record?.stage_id
          );

      if (
        !bundledStage ||
        seen.has(
          record?.stage_id
        ) ||
        !validRecord(
          record,
          bundledStage
        )
      ) {
        return {
          ok: false
        };
      }

      seen.add(
        record.stage_id
      );

      patches.push({
        stage:
          bundledStage,
        value:
          record.value
      });
    }

    for (
      let stageId = 1;
      stageId <=
        STAGE_COUNT;
      stageId += 1
    ) {
      if (
        !seen.has(
          stageId
        )
      ) {
        return {
          ok: false
        };
      }
    }

    patches.sort(
      (a, b) =>
        a.stage.id -
        b.stage.id
    );

    return {
      ok: true,
      release_id: id,
      content_version:
        release
          .content_version,
      content_hash:
        release
          .content_hash
          .toLowerCase(),
      patches
    };
  }

  function applyValidatedRelease(
    validation
  ) {
    const originals =
      validation.patches
        .map(
          patch => ({
            stage:
              patch.stage,
            title:
              patch.stage.title,
            nav:
              patch.stage.nav,
            purpose:
              patch.stage.purpose,
            learn:
              patch.stage.learn,
            example:
              patch.stage.example,
            warning:
              patch.stage.warning
          })
        );

    try {
      for (
        const patch
        of validation.patches
      ) {
        const value =
          patch.value;

        patch.stage.title =
          value.title;
        patch.stage.nav =
          value.nav;
        patch.stage.purpose =
          value.purpose;
        patch.stage.learn =
          value.learn_html;
        patch.stage.example =
          value.example_html;
        patch.stage.warning =
          value.warning_html;
      }

      return true;
    } catch {
      for (
        const original
        of originals
      ) {
        try {
          original.stage.title =
            original.title;
          original.stage.nav =
            original.nav;
          original.stage.purpose =
            original.purpose;
          original.stage.learn =
            original.learn;
          original.stage.example =
            original.example;
          original.stage.warning =
            original.warning;
        } catch {
          /* best-effort rollback */
        }
      }

      return false;
    }
  }

  function bundledState(
    status,
    failureCategory = null
  ) {
    return publishState({
      source: "bundled",
      content_version:
        "bundled",
      release_id: null,
      content_hash: null,
      load_status:
        status,
      failure_category:
        failureCategory
    });
  }

  async function load() {
    const curriculum =
      window.RMSCurriculum;

    if (
      !curriculum ||
      !Array.isArray(
        curriculum.stages
      ) ||
      curriculum.stages.length !==
        STAGE_COUNT
    ) {
      return bundledState(
        "rejected",
        "bundled-curriculum"
      );
    }

    const endpoint =
      safeEndpoint();

    if (!endpoint) {
      return bundledState(
        "no-config"
      );
    }

    const controller =
      typeof AbortController ===
        "function"
        ? new AbortController()
        : null;

    let timer = null;

    const timeout =
      new Promise(
        resolve => {
          timer =
            setTimeout(
              () => {
                try {
                  controller
                    ?.abort?.();
                } catch {
                  /* no-op */
                }

                resolve({
                  timeout: true
                });
              },
              STARTUP_BUDGET_MS
            );
        }
      );

    let response;

    try {
      response =
        await Promise.race([
          fetch(
            `${endpoint}/content/public`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json"
              },
              cache: "no-store",
              credentials:
                "omit",
              referrerPolicy:
                "no-referrer",
              signal:
                controller
                  ?.signal
            }
          ),
          timeout
        ]);
    } catch {
      if (timer) {
        clearTimeout(timer);
      }

      return bundledState(
        "unavailable",
        "network"
      );
    }

    if (timer) {
      clearTimeout(timer);
    }

    if (
      response?.timeout ===
      true
    ) {
      return bundledState(
        "timeout",
        "startup-timeout"
      );
    }

    if (
      !response ||
      typeof response.status !==
        "number"
    ) {
      return bundledState(
        "unavailable",
        "response"
      );
    }

    if (
      response.status ===
        404
    ) {
      return bundledState(
        "no-publication"
      );
    }

    if (!response.ok) {
      return bundledState(
        "unavailable",
        "http"
      );
    }

    let payload;

    try {
      payload =
        await response.json();
    } catch {
      return bundledState(
        "rejected",
        "malformed-json"
      );
    }

    if (
      !exactKeys(
        payload,
        RESPONSE_FIELDS
      ) ||
      payload.published !==
        true
    ) {
      return bundledState(
        "rejected",
        "response-schema"
      );
    }

    const validation =
      validateRelease(
        payload.release,
        curriculum
      );

    if (!validation.ok) {
      return bundledState(
        "rejected",
        "release-validation"
      );
    }

    if (
      !applyValidatedRelease(
        validation
      )
    ) {
      return bundledState(
        "rejected",
        "apply-failed"
      );
    }

    return publishState({
      source: "published",
      content_version:
        validation
          .content_version,
      release_id:
        validation
          .release_id,
      content_hash:
        validation
          .content_hash,
      load_status:
        "published",
      failure_category:
        null
    });
  }

  function lockPage() {
    const body =
      document.body;

    if (!body) {
      return;
    }

    body.setAttribute(
      "aria-busy",
      "true"
    );

    body.setAttribute(
      "inert",
      ""
    );

    try {
      body.inert =
        true;
    } catch {
      /* attribute still applies */
    }
  }

  function unlockPage() {
    const body =
      document.body;

    if (!body) {
      return;
    }

    body.removeAttribute(
      "aria-busy"
    );

    body.removeAttribute(
      "inert"
    );

    try {
      body.inert =
        false;
    } catch {
      /* no-op */
    }
  }

  publishState(state);
  lockPage();

  const ready =
    Promise.resolve()
      .then(load)
      .catch(
        () =>
          bundledState(
            "unavailable",
            "loader"
          )
      )
      .finally(
        unlockPage
      );

  window.RMSPublicContentReady =
    ready;

  return Object.freeze({
    STARTUP_BUDGET_MS,
    getState() {
      return state;
    },
    ready
  });
})();
