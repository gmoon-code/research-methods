const CONTENT_SCHEMA_VERSION = "1.0";
const CONTENT_RECORD_TYPE = "stage_guidance";
const CONTENT_STAGE_COUNT = 18;

const VALUE_FIELDS = Object.freeze([
  "title",
  "nav",
  "purpose",
  "learn_html",
  "example_html",
  "warning_html"
]);

const RECORD_FIELDS = Object.freeze([
  "key",
  "type",
  "phase",
  "stage_id",
  "value"
]);

const CANDIDATE_FIELDS = Object.freeze([
  "schema_version",
  "expected_current_release_id",
  "change_summary",
  "records"
]);

const PLAIN_LIMITS = Object.freeze({
  title: 160,
  nav: 120,
  purpose: 1200
});

const MARKUP_LIMITS = Object.freeze({
  learn_html: 20000,
  example_html: 8000,
  warning_html: 8000
});

const STAGE_PHASES = Object.freeze({
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

const ALLOWED_TAGS = new Set([
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

const ALLOWED_CLASSES = new Set([
  "concept-box"
]);

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function deepFreeze(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  Object.freeze(value);

  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }

  return value;
}

function objectKeysExact(
  value,
  expected
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const actual =
    Object.keys(value).sort();

  const wanted =
    [...expected].sort();

  return (
    actual.length ===
      wanted.length &&
    actual.every(
      (key, index) =>
        key === wanted[index]
    )
  );
}

function stringValue(value) {
  return typeof value === "string"
    ? value
    : "";
}

function validStageId(stageId) {
  return (
    Number.isInteger(stageId) &&
    stageId >= 1 &&
    stageId <= CONTENT_STAGE_COUNT
  );
}

function expectedKey(stageId) {
  return `curriculum.stage.${stageId}.guidance`;
}

function validatePlain(
  field,
  value,
  errors
) {
  const text =
    stringValue(value);

  if (!text.trim()) {
    errors.push(
      `${field} cannot be empty.`
    );
    return;
  }

  if (
    text.length >
    PLAIN_LIMITS[field]
  ) {
    errors.push(
      `${field} exceeds its maximum length.`
    );
  }

  if (/[<>]/.test(text)) {
    errors.push(
      `${field} must be plain text.`
    );
  }
}

function validClassAttribute(
  attributes
) {
  const match =
    String(attributes || "")
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
        ALLOWED_CLASSES.has(item)
    )
  );
}

function validateMarkup(
  field,
  value,
  errors
) {
  const html =
    stringValue(value);

  if (!html.trim()) {
    errors.push(
      `${field} cannot be empty.`
    );
    return;
  }

  if (
    html.length >
    MARKUP_LIMITS[field]
  ) {
    errors.push(
      `${field} exceeds its maximum length.`
    );
  }

  if (
    /<\s*(script|style|iframe|object|embed|form|input|button|link|meta|svg|math|img|audio|video|source|track)\b/i
      .test(html) ||
    /\bon[a-z]+\s*=/i
      .test(html) ||
    /javascript\s*:/i
      .test(html) ||
    /\bsrc\s*=/i
      .test(html) ||
    /\bhref\s*=/i
      .test(html) ||
    /\bstyle\s*=/i
      .test(html)
  ) {
    errors.push(
      `${field} contains active or unsupported markup.`
    );
    return;
  }

  const tags =
    html.match(/<[^>]+>/g) || [];

  for (const token of tags) {
    const match =
      token.match(
        /^<\s*\/?\s*([a-z0-9-]+)([\s\S]*?)>$/i
      );

    if (!match) {
      errors.push(
        `${field} contains malformed markup.`
      );
      return;
    }

    const tag =
      match[1].toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      errors.push(
        `${field} contains unsupported <${tag}> markup.`
      );
      return;
    }

    const closing =
      /^<\s*\//.test(token);

    let attributes =
      String(match[2] || "")
        .replace(/^\s*\/\s*$/, "")
        .trim();

    if (
      closing &&
      attributes
    ) {
      errors.push(
        `${field} contains invalid closing-tag content.`
      );
      return;
    }

    if (!attributes) {
      continue;
    }

    if (!validClassAttribute(attributes)) {
      errors.push(
        `${field} contains an unsupported attribute or class.`
      );
      return;
    }
  }
}

function validateValue(value) {
  const errors = [];

  if (
    !objectKeysExact(
      value,
      VALUE_FIELDS
    )
  ) {
    errors.push(
      "Each content value must contain exactly the six supported guidance fields."
    );
  }

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return deepFreeze({
      ok: false,
      errors
    });
  }

  for (const field of [
    "title",
    "nav",
    "purpose"
  ]) {
    validatePlain(
      field,
      value[field],
      errors
    );
  }

  for (const field of [
    "learn_html",
    "example_html",
    "warning_html"
  ]) {
    validateMarkup(
      field,
      value[field],
      errors
    );
  }

  return deepFreeze({
    ok: errors.length === 0,
    errors
  });
}

function validateRecord(record) {
  const errors = [];

  if (
    !objectKeysExact(
      record,
      RECORD_FIELDS
    )
  ) {
    errors.push(
      "Each stage record must contain exactly key, type, phase, stage_id, and value."
    );
  }

  if (
    !record ||
    typeof record !== "object" ||
    Array.isArray(record)
  ) {
    return deepFreeze({
      ok: false,
      errors
    });
  }

  const stageId =
    record.stage_id;

  if (!validStageId(stageId)) {
    errors.push(
      "Stage identifier must be an integer from 1 through 18."
    );
  }

  if (
    validStageId(stageId) &&
    record.key !==
      expectedKey(stageId)
  ) {
    errors.push(
      "Record key does not match its stage identifier."
    );
  }

  if (
    record.type !==
    CONTENT_RECORD_TYPE
  ) {
    errors.push(
      "Unsupported content record type."
    );
  }

  if (
    validStageId(stageId) &&
    record.phase !==
      STAGE_PHASES[stageId]
  ) {
    errors.push(
      "Record phase does not match its stage."
    );
  }

  const valueValidation =
    validateValue(record.value);

  errors.push(
    ...valueValidation.errors
  );

  return deepFreeze({
    ok: errors.length === 0,
    errors
  });
}

function normalizedSummary(value) {
  const summary =
    stringValue(value).trim();

  if (
    summary.length < 3 ||
    summary.length > 500
  ) {
    return "";
  }

  return summary;
}

function normalizedExpectedReleaseId(
  value
) {
  if (
    value === null ||
    value === ""
  ) {
    return null;
  }

  const text =
    stringValue(value).trim();

  return /^[A-Za-z0-9_.:-]{1,160}$/
    .test(text)
      ? text
      : "";
}

function normalizeRecords(records) {
  return records
    .map(clone)
    .sort(
      (a, b) =>
        a.stage_id -
        b.stage_id
    );
}

function validateCandidate(candidate) {
  const errors = [];

  if (
    !objectKeysExact(
      candidate,
      CANDIDATE_FIELDS
    )
  ) {
    errors.push(
      "Publication candidate contains unsupported or missing top-level fields."
    );
  }

  if (
    !candidate ||
    typeof candidate !== "object" ||
    Array.isArray(candidate)
  ) {
    return deepFreeze({
      ok: false,
      errors,
      candidate: null
    });
  }

  if (
    candidate.schema_version !==
    CONTENT_SCHEMA_VERSION
  ) {
    errors.push(
      "Unsupported content schema version."
    );
  }

  const expectedReleaseId =
    normalizedExpectedReleaseId(
      candidate
        .expected_current_release_id
    );

  if (
    expectedReleaseId === ""
  ) {
    errors.push(
      "Expected current release identifier is invalid."
    );
  }

  const changeSummary =
    normalizedSummary(
      candidate.change_summary
    );

  if (!changeSummary) {
    errors.push(
      "Change summary must contain 3 to 500 characters."
    );
  }

  if (
    !Array.isArray(
      candidate.records
    ) ||
    candidate.records.length !==
      CONTENT_STAGE_COUNT
  ) {
    errors.push(
      "Publication candidate must contain exactly 18 stage records."
    );
  }

  const records =
    Array.isArray(
      candidate.records
    )
      ? candidate.records
      : [];

  const seen =
    new Set();

  for (const record of records) {
    const validation =
      validateRecord(record);

    errors.push(
      ...validation.errors.map(
        error =>
          `Stage record: ${error}`
      )
    );

    if (
      validStageId(
        record?.stage_id
      )
    ) {
      if (
        seen.has(
          record.stage_id
        )
      ) {
        errors.push(
          `Duplicate Stage ${record.stage_id} record.`
        );
      }

      seen.add(
        record.stage_id
      );
    }
  }

  for (
    let stageId = 1;
    stageId <= CONTENT_STAGE_COUNT;
    stageId += 1
  ) {
    if (!seen.has(stageId)) {
      errors.push(
        `Stage ${stageId} record is missing.`
      );
    }
  }

  if (errors.length > 0) {
    return deepFreeze({
      ok: false,
      errors,
      candidate: null
    });
  }

  return deepFreeze({
    ok: true,
    errors: [],
    candidate: {
      schema_version:
        CONTENT_SCHEMA_VERSION,
      expected_current_release_id:
        expectedReleaseId,
      change_summary:
        changeSummary,
      records:
        normalizeRecords(
          records
        )
    }
  });
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(
      canonicalize
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const next = {};

    for (
      const key
      of Object.keys(value).sort()
    ) {
      next[key] =
        canonicalize(
          value[key]
        );
    }

    return next;
  }

  return value;
}

function canonicalStringify(value) {
  return JSON.stringify(
    canonicalize(value)
  );
}

function contentHashInput(
  candidateOrRelease
) {
  const source =
    candidateOrRelease?.records;

  const records =
    Array.isArray(source)
      ? normalizeRecords(source)
      : [];

  return canonicalStringify({
    schema_version:
      CONTENT_SCHEMA_VERSION,
    records
  });
}

function currentReleaseId(
  currentRelease
) {
  if (
    !currentRelease ||
    typeof currentRelease !==
      "object"
  ) {
    return null;
  }

  const id =
    stringValue(
      currentRelease.release_id
    ).trim();

  return id || null;
}

function checkExpectedCurrentRelease(
  expectedReleaseId,
  currentRelease
) {
  const expected =
    expectedReleaseId === null
      ? null
      : stringValue(
          expectedReleaseId
        ).trim();

  const actual =
    currentReleaseId(
      currentRelease
    );

  return deepFreeze({
    ok: expected === actual,
    expected,
    actual
  });
}

function safeReleaseId(value) {
  const text =
    stringValue(value).trim();

  return /^[A-Za-z0-9_.:-]{1,160}$/
    .test(text)
      ? text
      : "";
}

function safeIso(value) {
  const text =
    stringValue(value).trim();

  const timestamp =
    Date.parse(text);

  if (
    !text ||
    !Number.isFinite(timestamp)
  ) {
    return "";
  }

  return new Date(
    timestamp
  ).toISOString();
}

function safeHash(value) {
  const text =
    stringValue(value)
      .trim()
      .toLowerCase();

  return /^[a-f0-9]{64}$/
    .test(text)
      ? text
      : "";
}

function createRelease({
  candidate,
  releaseId,
  nowIso,
  contentHash,
  parentReleaseId = null,
  rollbackSourceReleaseId = null
}) {
  const validation =
    validateCandidate(
      candidate
    );

  if (!validation.ok) {
    throw new Error(
      "Cannot construct a release from an invalid publication candidate."
    );
  }

  const id =
    safeReleaseId(
      releaseId
    );

  const timestamp =
    safeIso(
      nowIso
    );

  const hash =
    safeHash(
      contentHash
    );

  const parent =
    parentReleaseId === null
      ? null
      : safeReleaseId(
          parentReleaseId
        );

  const rollbackSource =
    rollbackSourceReleaseId ===
      null
      ? null
      : safeReleaseId(
          rollbackSourceReleaseId
        );

  if (!id) {
    throw new Error(
      "Server release identifier is invalid."
    );
  }

  if (!timestamp) {
    throw new Error(
      "Server release timestamp is invalid."
    );
  }

  if (!hash) {
    throw new Error(
      "Server content hash is invalid."
    );
  }

  if (
    parentReleaseId !== null &&
    !parent
  ) {
    throw new Error(
      "Parent release identifier is invalid."
    );
  }

  if (
    rollbackSourceReleaseId !==
      null &&
    !rollbackSource
  ) {
    throw new Error(
      "Rollback source release identifier is invalid."
    );
  }

  return deepFreeze({
    schema_version:
      CONTENT_SCHEMA_VERSION,
    content_version:
      id,
    release_id:
      id,
    created_at:
      timestamp,
    published_at:
      timestamp,
    parent_release_id:
      parent,
    rollback_source_release_id:
      rollbackSource,
    content_hash:
      hash,
    change_summary:
      validation
        .candidate
        .change_summary,
    records:
      clone(
        validation
          .candidate
          .records
      )
  });
}

function releaseToCandidate(
  release,
  expectedCurrentReleaseId,
  changeSummary
) {
  return {
    schema_version:
      CONTENT_SCHEMA_VERSION,
    expected_current_release_id:
      expectedCurrentReleaseId,
    change_summary:
      changeSummary,
    records:
      clone(
        release.records
      )
  };
}

function validateStoredRelease(release) {
  const errors = [];

  if (
    !release ||
    typeof release !== "object" ||
    Array.isArray(release)
  ) {
    return deepFreeze({
      ok: false,
      errors: [
        "Stored release must be an object."
      ]
    });
  }

  const id =
    safeReleaseId(
      release.release_id
    );

  const timestamp =
    safeIso(
      release.published_at
    );

  const hash =
    safeHash(
      release.content_hash
    );

  if (!id) {
    errors.push(
      "Stored release identifier is invalid."
    );
  }

  if (!timestamp) {
    errors.push(
      "Stored release timestamp is invalid."
    );
  }

  if (!hash) {
    errors.push(
      "Stored content hash is invalid."
    );
  }

  const candidate =
    releaseToCandidate(
      release,
      null,
      stringValue(
        release.change_summary
      )
    );

  const validation =
    validateCandidate(
      candidate
    );

  errors.push(
    ...validation.errors
  );

  return deepFreeze({
    ok: errors.length === 0,
    errors
  });
}

function createRollbackRelease({
  currentRelease,
  targetRelease,
  releaseId,
  nowIso,
  contentHash,
  changeSummary
}) {
  const currentValidation =
    validateStoredRelease(
      currentRelease
    );

  const targetValidation =
    validateStoredRelease(
      targetRelease
    );

  if (
    !currentValidation.ok ||
    !targetValidation.ok
  ) {
    throw new Error(
      "Rollback requires valid current and target releases."
    );
  }

  const candidate =
    releaseToCandidate(
      targetRelease,
      currentRelease.release_id,
      changeSummary
    );

  return createRelease({
    candidate,
    releaseId,
    nowIso,
    contentHash,
    parentReleaseId:
      currentRelease.release_id,
    rollbackSourceReleaseId:
      targetRelease.release_id
  });
}

function publicReleaseProjection(
  release
) {
  const validation =
    validateStoredRelease(
      release
    );

  if (!validation.ok) {
    throw new Error(
      "Cannot expose an invalid stored release."
    );
  }

  return deepFreeze({
    schema_version:
      CONTENT_SCHEMA_VERSION,
    content_version:
      release.content_version,
    release_id:
      release.release_id,
    published_at:
      release.published_at,
    content_hash:
      release.content_hash,
    records:
      clone(
        normalizeRecords(
          release.records
        )
      )
  });
}

function revisionMetadata(
  release
) {
  const validation =
    validateStoredRelease(
      release
    );

  if (!validation.ok) {
    throw new Error(
      "Cannot summarize an invalid stored release."
    );
  }

  return deepFreeze({
    release_id:
      release.release_id,
    content_version:
      release.content_version,
    published_at:
      release.published_at,
    parent_release_id:
      release.parent_release_id ||
      null,
    rollback_source_release_id:
      release
        .rollback_source_release_id ||
      null,
    content_hash:
      release.content_hash,
    change_summary:
      release.change_summary
  });
}

export {
  ALLOWED_CLASSES,
  ALLOWED_TAGS,
  CONTENT_RECORD_TYPE,
  CONTENT_SCHEMA_VERSION,
  CONTENT_STAGE_COUNT,
  STAGE_PHASES,
  VALUE_FIELDS,
  canonicalStringify,
  checkExpectedCurrentRelease,
  contentHashInput,
  createRelease,
  createRollbackRelease,
  publicReleaseProjection,
  revisionMetadata,
  validateCandidate,
  validateRecord,
  validateStoredRelease,
  validateValue
};
