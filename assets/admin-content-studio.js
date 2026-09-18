window.RMSAdminContentStudio = (() => {
  "use strict";

  const VALUE_FIELDS = Object.freeze([
    "title",
    "nav",
    "purpose",
    "learn_html",
    "example_html",
    "warning_html"
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

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function stringValue(value) {
    return typeof value === "string"
      ? value
      : "";
  }

  function validatePlain(
    field,
    value,
    errors
  ) {
    const text = stringValue(value);

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
        `${field} is longer than the allowed limit.`
      );
    }

    if (/[<>]/.test(text)) {
      errors.push(
        `${field} must be plain text.`
      );
    }
  }

  function validateMarkup(
    field,
    value,
    errors
  ) {
    const html = stringValue(value);

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
        `${field} is longer than the allowed limit.`
      );
    }

    if (
      /<\s*(script|style|iframe|object|embed|form|input|button|link|meta|svg|math)\b/i
        .test(html) ||
      /\bon[a-z]+\s*=/i.test(html) ||
      /javascript\s*:/i.test(html) ||
      /data\s*:/i.test(html) ||
      /src\s*=/i.test(html) ||
      /href\s*=/i.test(html)
    ) {
      errors.push(
        `${field} contains markup that is not allowed.`
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
          `${field} contains an unsupported <${tag}> element.`
        );
        return;
      }

      let attributes =
        match[2] || "";

      attributes =
        attributes
          .replace(/^\s*\/\s*$/, "")
          .trim();

      if (!attributes) {
        continue;
      }

      if (
        !/^class\s*=\s*"[-_a-zA-Z0-9 ]+"$/
          .test(attributes)
      ) {
        errors.push(
          `${field} contains an unsupported attribute.`
        );
        return;
      }
    }
  }

  function validateValue(value) {
    const errors = [];

    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return Object.freeze({
        ok: false,
        errors: Object.freeze([
          "Content value must be an object."
        ])
      });
    }

    const keys =
      Object.keys(value).sort();

    const expected =
      [...VALUE_FIELDS].sort();

    if (
      JSON.stringify(keys) !==
      JSON.stringify(expected)
    ) {
      errors.push(
        "The content block must contain exactly the six supported fields."
      );
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
      !record ||
      typeof record !== "object" ||
      Array.isArray(record)
    ) {
      return deepFreeze({
        ok: false,
        errors: [
          "Content record must be an object."
        ]
      });
    }

    if (
      record.key !==
      "curriculum.stage.1.guidance"
    ) {
      errors.push(
        "Unsupported content key."
      );
    }

    if (
      record.type !==
      "stage_guidance"
    ) {
      errors.push(
        "Unsupported content type."
      );
    }

    if (record.stage_id !== 1) {
      errors.push(
        "Stage identifier must remain 1."
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

  function getRecord(
    registry,
    key
  ) {
    const records =
      Array.isArray(registry?.records)
        ? registry.records
        : [];

    const record =
      records.find(
        item => item?.key === key
      );

    return record
      ? deepFreeze(clone(record))
      : null;
  }

  function createDraft(record) {
    const validation =
      validateRecord(record);

    if (!validation.ok) {
      throw new Error(
        "Cannot create a draft from an invalid content record."
      );
    }

    return deepFreeze({
      key: record.key,
      type: record.type,
      location: stringValue(
        record.location
      ),
      stage_id: record.stage_id,
      base_revision: stringValue(
        record.revision
      ),
      value: clone(record.value)
    });
  }

  function updateField(
    draft,
    field,
    value
  ) {
    if (
      !VALUE_FIELDS.includes(field)
    ) {
      throw new Error(
        "Unsupported content field."
      );
    }

    const next = clone(draft);
    next.value[field] =
      stringValue(value);

    return deepFreeze(next);
  }

  function replaceValue(
    draft,
    replacement
  ) {
    const validation =
      validateValue(replacement);

    if (!validation.ok) {
      return deepFreeze({
        ok: false,
        errors: validation.errors,
        draft
      });
    }

    const next = clone(draft);
    next.value = clone(replacement);

    return deepFreeze({
      ok: true,
      errors: [],
      draft: deepFreeze(next)
    });
  }

  function validateDraft(draft) {
    return validateRecord({
      key: draft?.key,
      type: draft?.type,
      stage_id: draft?.stage_id,
      value: draft?.value
    });
  }

  function previewModel(draft) {
    const validation =
      validateDraft(draft);

    if (!validation.ok) {
      return deepFreeze({
        ok: false,
        errors: validation.errors,
        model: null
      });
    }

    return deepFreeze({
      ok: true,
      errors: [],
      model: {
        title: draft.value.title,
        nav: draft.value.nav,
        purpose: draft.value.purpose,
        learn_html:
          draft.value.learn_html,
        example_html:
          draft.value.example_html,
        warning_html:
          draft.value.warning_html
      }
    });
  }

  function hasChanges(
    draft,
    record
  ) {
    return JSON.stringify(
      draft?.value || null
    ) !== JSON.stringify(
      record?.value || null
    );
  }

  function exportEnvelope(draft) {
    const validation =
      validateDraft(draft);

    if (!validation.ok) {
      return deepFreeze({
        ok: false,
        errors: validation.errors,
        packet: null
      });
    }

    return deepFreeze({
      ok: true,
      errors: [],
      packet: {
        packet_type:
          "rms_admin_content_draft",
        version: "1.0",
        key: draft.key,
        type: draft.type,
        stage_id: draft.stage_id,
        base_revision:
          draft.base_revision,
        value: clone(draft.value)
      }
    });
  }

  return Object.freeze({
    VALUE_FIELDS,
    getRecord,
    createDraft,
    updateField,
    replaceValue,
    validateValue,
    validateDraft,
    previewModel,
    hasChanges,
    exportEnvelope
  });
})();
