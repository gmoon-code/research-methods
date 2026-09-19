import process from "node:process";
import {
  readFileSync
} from "node:fs";
import vm from "node:vm";

import {
  CONTENT_SCHEMA_VERSION,
  canonicalStringify,
  validateCandidate
} from "../backend/cloudflare-workers-ai/content-publication.mjs";

const endpoint =
  String(
    process.env
      .RMS_CONTENT_ENDPOINT ||
    ""
  ).trim();

const adminCode =
  String(
    process.env
      .RMS_TEACHER_ACCESS_CODE ||
    ""
  ).trim();

const origin =
  String(
    process.env
      .RMS_CONTENT_ORIGIN ||
    ""
  ).trim();

function fail(message) {
  console.error(
    `PRODUCTION CONTENT CANARY: FAIL\n${message}`
  );

  process.exit(1);
}

function safeEndpoint(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function urlFor(path) {
  const base =
    endpoint.endsWith("/")
      ? endpoint
      : endpoint + "/";

  return new URL(
    path.replace(
      /^\//,
      ""
    ),
    base
  ).toString();
}

async function timedFetch(
  url,
  options,
  timeoutMs = 45_000
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      timeoutMs
    );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal,
        redirect:
          "error"
      }
    );
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      fail(
        `Request timed out after ${timeoutMs} ms.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function jsonBody(
  response
) {
  return await response
    .json()
    .catch(
      () => ({})
    );
}

function loadBundledRecords() {
  const context = {
    window: {}
  };

  vm.runInNewContext(
    readFileSync(
      new URL(
        "../assets/content-registry.js",
        import.meta.url
      ),
      "utf8"
    ),
    context,
    {
      filename:
        "assets/content-registry.js"
    }
  );

  const registry =
    JSON.parse(
      JSON.stringify(
        context.window
          .RMSContentRegistry
      )
    );

  if (
    !Array.isArray(
      registry?.records
    ) ||
    registry.records.length !==
      18
  ) {
    fail(
      "Bundled content registry does not contain 18 stage records."
    );
  }

  return registry.records
    .map(
      record => ({
        key: record.key,
        type: record.type,
        phase: record.phase,
        stage_id:
          record.stage_id,
        value:
          record.value
      })
    );
}

function publicationCandidate(
  records,
  expectedReleaseId,
  summary
) {
  const value = {
    schema_version:
      CONTENT_SCHEMA_VERSION,
    expected_current_release_id:
      expectedReleaseId,
    change_summary:
      summary,
    records:
      JSON.parse(
        JSON.stringify(
          records
        )
      )
  };

  const validation =
    validateCandidate(
      value
    );

  if (!validation.ok) {
    fail(
      "Local publication candidate validation failed."
    );
  }

  return value;
}

async function adminFetch(
  path,
  token,
  {
    method = "GET",
    body
  } = {}
) {
  const headers = {
    Origin: origin,
    Accept:
      "application/json",
    "X-RMS-Teacher-Session":
      token
  };

  if (body !== undefined) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }

  return await timedFetch(
    urlFor(path),
    {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : JSON.stringify(
              body
            )
    }
  );
}

if (!safeEndpoint(endpoint)) {
  fail(
    "RMS_CONTENT_ENDPOINT must be a clean HTTPS URL."
  );
}

if (
  adminCode.length < 16 ||
  adminCode.length > 256
) {
  fail(
    "RMS_TEACHER_ACCESS_CODE must be 16-256 characters."
  );
}

if (
  !/^https:\/\//
    .test(origin)
) {
  fail(
    "RMS_CONTENT_ORIGIN must be the exact HTTPS browser origin."
  );
}

const noOrigin =
  await timedFetch(
    urlFor(
      "/content/public"
    ),
    {
      method: "GET",
      headers: {
        Accept:
          "application/json"
      }
    }
  );

if (
  noOrigin.status !== 403
) {
  fail(
    `Missing-Origin content check expected 403 but received ${noOrigin.status}.`
  );
}

const login =
  await timedFetch(
    urlFor(
      "/teacher/session"
    ),
    {
      method: "POST",
      headers: {
        Origin: origin,
        "X-RMS-Teacher-Code":
          adminCode,
        Accept:
          "application/json"
      }
    }
  );

const loginBody =
  await jsonBody(login);

if (
  !login.ok ||
  loginBody.ok !== true ||
  typeof loginBody.token !==
    "string" ||
  !loginBody.token
) {
  fail(
    `Admin session login failed (${login.status}).`
  );
}

const token =
  loginBody.token;

const initialStateResponse =
  await adminFetch(
    "/admin/content/state",
    token
  );

const initialState =
  await jsonBody(
    initialStateResponse
  );

if (
  !initialStateResponse.ok ||
  initialState.configured !==
    true
) {
  fail(
    `Content Admin state failed (${initialStateResponse.status}).`
  );
}

const initialPublicResponse =
  await timedFetch(
    urlFor(
      "/content/public"
    ),
    {
      method: "GET",
      headers: {
        Origin: origin,
        Accept:
          "application/json"
      }
    }
  );

const initialPublic =
  await jsonBody(
    initialPublicResponse
  );

let sourceRecords;

if (
  initialState.published ===
  true
) {
  if (
    !initialPublicResponse.ok ||
    initialPublic.published !==
      true ||
    initialPublic.release
      ?.release_id !==
      initialState.current
        ?.release_id
  ) {
    fail(
      "Published content state and public release do not agree."
    );
  }

  sourceRecords =
    initialPublic.release
      .records;
} else {
  if (
    initialPublicResponse.status !==
      404 ||
    initialPublic.published !==
      false
  ) {
    fail(
      "Unpublished content state did not produce the expected public 404."
    );
  }

  sourceRecords =
    loadBundledRecords();
}

const semanticBaseline =
  canonicalStringify(
    sourceRecords
  );

const firstCandidate =
  publicationCandidate(
    sourceRecords,
    initialState.current
      ?.release_id ||
      null,
    "Production content canary first identical-content revision"
  );

const firstPublish =
  await adminFetch(
    "/admin/content/publish",
    token,
    {
      method: "POST",
      body:
        firstCandidate
    }
  );

const firstBody =
  await jsonBody(
    firstPublish
  );

if (
  firstPublish.status !== 201 ||
  firstBody.ok !== true ||
  typeof firstBody.current
    ?.release_id !==
    "string"
) {
  fail(
    `First content canary publication failed (${firstPublish.status}).`
  );
}

const firstReleaseId =
  firstBody.current
    .release_id;

const firstPublicResponse =
  await timedFetch(
    urlFor(
      "/content/public"
    ),
    {
      method: "GET",
      headers: {
        Origin: origin,
        Accept:
          "application/json"
      }
    }
  );

const firstPublic =
  await jsonBody(
    firstPublicResponse
  );

if (
  !firstPublicResponse.ok ||
  firstPublic.release
    ?.release_id !==
    firstReleaseId ||
  canonicalStringify(
    firstPublic.release
      ?.records
  ) !==
    semanticBaseline
) {
  fail(
    "First content canary release did not preserve the semantic baseline."
  );
}

const secondCandidate =
  publicationCandidate(
    sourceRecords,
    firstReleaseId,
    "Production content canary second identical-content revision"
  );

const secondPublish =
  await adminFetch(
    "/admin/content/publish",
    token,
    {
      method: "POST",
      body:
        secondCandidate
    }
  );

const secondBody =
  await jsonBody(
    secondPublish
  );

if (
  secondPublish.status !== 201 ||
  secondBody.ok !== true ||
  typeof secondBody.current
    ?.release_id !==
    "string" ||
  secondBody.current
    .parent_release_id !==
    firstReleaseId
) {
  fail(
    `Second content canary publication failed (${secondPublish.status}).`
  );
}

const secondReleaseId =
  secondBody.current
    .release_id;

const rollbackResponse =
  await adminFetch(
    "/admin/content/rollback",
    token,
    {
      method: "POST",
      body: {
        expected_current_release_id:
          secondReleaseId,
        target_release_id:
          firstReleaseId,
        change_summary:
          "Production content canary rollback verification"
      }
    }
  );

const rollbackBody =
  await jsonBody(
    rollbackResponse
  );

if (
  rollbackResponse.status !==
    201 ||
  rollbackBody.ok !== true ||
  typeof rollbackBody.current
    ?.release_id !==
    "string" ||
  rollbackBody.current
    .parent_release_id !==
    secondReleaseId ||
  rollbackBody.current
    .rollback_source_release_id !==
    firstReleaseId
) {
  fail(
    `Content rollback canary failed (${rollbackResponse.status}).`
  );
}

const finalPublicResponse =
  await timedFetch(
    urlFor(
      "/content/public"
    ),
    {
      method: "GET",
      headers: {
        Origin: origin,
        Accept:
          "application/json"
      }
    }
  );

const finalPublic =
  await jsonBody(
    finalPublicResponse
  );

if (
  !finalPublicResponse.ok ||
  finalPublic.release
    ?.release_id !==
    rollbackBody.current
      .release_id ||
  canonicalStringify(
    finalPublic.release
      ?.records
  ) !==
    semanticBaseline
) {
  fail(
    "Final public content differs from the semantic baseline after rollback."
  );
}

const revisionsResponse =
  await adminFetch(
    "/admin/content/revisions",
    token
  );

const revisionsBody =
  await jsonBody(
    revisionsResponse
  );

if (
  !revisionsResponse.ok ||
  !Array.isArray(
    revisionsBody.revisions
  ) ||
  !revisionsBody.revisions
    .some(
      item =>
        item.release_id ===
        firstReleaseId
    ) ||
  !revisionsBody.revisions
    .some(
      item =>
        item.release_id ===
        secondReleaseId
    ) ||
  !revisionsBody.revisions
    .some(
      item =>
        item.release_id ===
        rollbackBody.current
          .release_id
    )
) {
  fail(
    "Content revision history did not expose the canary publication chain."
  );
}

console.log(
  "Admin session PASS"
);

console.log(
  "Content state and public projection PASS"
);

console.log(
  "Identical-content publication PASS"
);

console.log(
  "Second revision parent linkage PASS"
);

console.log(
  "Rollback and semantic restoration PASS"
);

console.log(
  "Revision history PASS"
);

console.log(
  "PRODUCTION CONTENT CANARY: PASS"
);
