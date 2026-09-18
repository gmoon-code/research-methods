window.RMSAdminContentStudioUI = (() => {
  "use strict";

  const FIELD_IDS = Object.freeze({
    title: "contentTitle",
    nav: "contentNav",
    purpose: "contentPurpose",
    learn_html: "contentLearnHtml",
    example_html: "contentExampleHtml",
    warning_html: "contentWarningHtml"
  });

  let mounted = false;
  let record = null;
  let draft = null;

  function id(value) {
    return document.getElementById(
      value
    );
  }

  function setStatus(
    message,
    tone = ""
  ) {
    const status =
      id("contentStudioStatus");

    if (!status) return;

    status.textContent =
      String(message || "");

    status.dataset.tone =
      String(tone || "");
  }

  function escapeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function currentApi() {
    return window
      .RMSAdminContentStudio;
  }

  function currentRegistry() {
    return window
      .RMSContentRegistry;
  }

  function syncFields() {
    if (!draft) return;

    for (
      const [field, elementId]
      of Object.entries(FIELD_IDS)
    ) {
      const element = id(elementId);

      if (element) {
        element.value =
          draft.value[field] || "";
      }
    }

    const replacement =
      id("contentFullReplacement");

    if (replacement) {
      replacement.value =
        JSON.stringify(
          draft.value,
          null,
          2
        );
    }

    const dirty =
      currentApi().hasChanges(
        draft,
        record
      );

    const dirtyState =
      id("contentDraftState");

    if (dirtyState) {
      dirtyState.textContent =
        dirty
          ? "Draft differs from published seed"
          : "Matches published seed";
    }
  }

  function validationMessage(
    validation
  ) {
    return validation.ok
      ? "Draft is valid."
      : validation.errors.join(" ");
  }

  function updateFromField(
    field,
    value
  ) {
    draft =
      currentApi().updateField(
        draft,
        field,
        value
      );

    const validation =
      currentApi().validateDraft(
        draft
      );

    setStatus(
      validation.ok
        ? "Draft updated in memory."
        : validationMessage(
            validation
          ),
      validation.ok
        ? "ok"
        : "warning"
    );

    const dirtyState =
      id("contentDraftState");

    if (dirtyState) {
      dirtyState.textContent =
        currentApi().hasChanges(
          draft,
          record
        )
          ? "Draft differs from published seed"
          : "Matches published seed";
    }
  }

  function previewSrcdoc(model) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"
  >
  <style>
    body {
      margin: 0;
      padding: 22px;
      color: #172033;
      background: #fff;
      font-family: Inter, system-ui, sans-serif;
      line-height: 1.6;
    }
    .preview-kicker {
      color: #667085;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    h1 {
      margin: 4px 0 7px;
      font-size: 25px;
    }
    .purpose {
      margin: 0 0 20px;
      color: #475467;
    }
    .section {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid #d9e0e7;
      border-radius: 8px;
    }
    .concept-box {
      padding: 12px;
      background: #f1f8fb;
      border-left: 4px solid #6aa6bd;
    }
    .example {
      background: #f7fbf4;
    }
    .warning {
      background: #fff8ed;
    }
  </style>
</head>
<body>
  <div class="preview-kicker">
    Stage 1 · ${escapeText(model.nav)}
  </div>
  <h1>${escapeText(model.title)}</h1>
  <p class="purpose">
    ${escapeText(model.purpose)}
  </p>

  <div class="section">
    ${model.learn_html}
  </div>

  <div class="section example">
    ${model.example_html}
  </div>

  <div class="section warning">
    ${model.warning_html}
  </div>
</body>
</html>`;
  }

  function renderPreview() {
    const result =
      currentApi().previewModel(
        draft
      );

    if (!result.ok) {
      setStatus(
        validationMessage(result),
        "error"
      );
      return;
    }

    const frame =
      id("contentPreviewFrame");

    if (!frame) return;

    frame.srcdoc =
      previewSrcdoc(
        result.model
      );

    frame.hidden = false;

    const empty =
      id("contentPreviewEmpty");

    if (empty) {
      empty.hidden = true;
    }

    setStatus(
      "Preview generated from the current in-memory draft.",
      "ok"
    );
  }

  function applyReplacement() {
    const source =
      id("contentFullReplacement");

    if (!source) return;

    let replacement;

    try {
      replacement =
        JSON.parse(source.value);
    } catch {
      setStatus(
        "Full-block replacement must be valid JSON.",
        "error"
      );
      return;
    }

    const result =
      currentApi().replaceValue(
        draft,
        replacement
      );

    if (!result.ok) {
      setStatus(
        result.errors.join(" "),
        "error"
      );
      return;
    }

    draft = result.draft;
    syncFields();

    setStatus(
      "The complete editable content block was replaced in memory.",
      "ok"
    );
  }

  function resetDraft() {
    if (
      !window.confirm(
        "Reset the in-memory draft to the published seed?"
      )
    ) {
      return;
    }

    draft =
      currentApi().createDraft(
        record
      );

    syncFields();

    const frame =
      id("contentPreviewFrame");

    if (frame) {
      frame.hidden = true;
      frame.removeAttribute("srcdoc");
    }

    const empty =
      id("contentPreviewEmpty");

    if (empty) {
      empty.hidden = false;
    }

    setStatus(
      "Draft reset to the published seed.",
      "ok"
    );
  }

  function exportDraft() {
    const result =
      currentApi().exportEnvelope(
        draft
      );

    if (!result.ok) {
      setStatus(
        result.errors.join(" "),
        "error"
      );
      return;
    }

    const packet = {
      ...result.packet,
      exported_at:
        new Date().toISOString()
    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            packet,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "rms-content-stage-1-draft.json";

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      0
    );

    setStatus(
      "Draft JSON exported. This did not publish anything.",
      "ok"
    );
  }

  function mount() {
    if (mounted) return true;

    const api =
      currentApi();

    const registry =
      currentRegistry();

    if (
      !api ||
      !registry
    ) {
      setStatus(
        "Content Studio modules are unavailable.",
        "error"
      );
      return false;
    }

    record =
      api.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    if (!record) {
      setStatus(
        "The Stage 1 seed record is unavailable.",
        "error"
      );
      return false;
    }

    draft =
      api.createDraft(
        record
      );

    const key =
      id("contentRecordKey");

    if (key) {
      key.textContent =
        record.key;
    }

    const revision =
      id("contentRecordRevision");

    if (revision) {
      revision.textContent =
        record.revision;
    }

    for (
      const [field, elementId]
      of Object.entries(FIELD_IDS)
    ) {
      id(elementId)
        ?.addEventListener(
          "input",
          event => {
            updateFromField(
              field,
              event.target.value
            );
          }
        );
    }

    id("validateContentDraft")
      ?.addEventListener(
        "click",
        () => {
          const validation =
            api.validateDraft(
              draft
            );

          setStatus(
            validationMessage(
              validation
            ),
            validation.ok
              ? "ok"
              : "error"
          );
        }
      );

    id("previewContentDraft")
      ?.addEventListener(
        "click",
        renderPreview
      );

    id("applyContentReplacement")
      ?.addEventListener(
        "click",
        applyReplacement
      );

    id("resetContentDraft")
      ?.addEventListener(
        "click",
        resetDraft
      );

    id("exportContentDraft")
      ?.addEventListener(
        "click",
        exportDraft
      );

    syncFields();

    setStatus(
      "Stage 1 guidance loaded from the published v2.17.1 seed. Edits stay in memory.",
      "ok"
    );

    mounted = true;
    return true;
  }

  return Object.freeze({
    mount
  });
})();
