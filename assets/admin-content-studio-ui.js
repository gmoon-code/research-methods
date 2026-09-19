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
  let records = [];
  let selectedKey = "";
  let record = null;
  let draft = null;
  let baselineLabel =
    "bundled seed";
  const drafts = new Map();

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

  function recordForKey(key) {
    return records.find(
      item => item.key === key
    ) || null;
  }

  function draftForRecord(nextRecord) {
    if (!nextRecord) {
      return null;
    }

    const existing =
      drafts.get(
        nextRecord.key
      );

    if (existing) {
      return existing;
    }

    const created =
      currentApi().createDraft(
        nextRecord
      );

    drafts.set(
      nextRecord.key,
      created
    );

    return created;
  }

  function isDirty(nextRecord) {
    if (!nextRecord) {
      return false;
    }

    const nextDraft =
      drafts.get(
        nextRecord.key
      );

    if (!nextDraft) {
      return false;
    }

    return currentApi().hasChanges(
      nextDraft,
      nextRecord
    );
  }

  function dirtyCount() {
    return records.reduce(
      (count, item) =>
        count +
        (
          isDirty(item)
            ? 1
            : 0
        ),
      0
    );
  }

  function updateDirtySummary() {
    const count =
      dirtyCount();

    const element =
      id("contentDirtyCount");

    if (element) {
      element.textContent =
        count === 1
          ? "1 changed draft"
          : `${count} changed drafts`;
    }
  }

  function syncReplacementView() {
    const replacement =
      id("contentFullReplacement");

    if (
      !replacement ||
      !draft ||
      document.activeElement ===
        replacement
    ) {
      return;
    }

    replacement.value =
      JSON.stringify(
        draft.value,
        null,
        2
      );
  }

  function clearPreview() {
    const frame =
      id("contentPreviewFrame");

    if (frame) {
      frame.hidden = true;
      frame.removeAttribute(
        "srcdoc"
      );
    }

    const empty =
      id("contentPreviewEmpty");

    if (empty) {
      empty.hidden = false;

      empty.textContent =
        record
          ? `Select Preview draft to render Stage ${record.stage_id}.`
          : "Select a content record to preview.";
    }
  }

  function syncFields() {
    if (
      !record ||
      !draft
    ) {
      return;
    }

    for (
      const [field, elementId]
      of Object.entries(FIELD_IDS)
    ) {
      const element =
        id(elementId);

      if (element) {
        element.value =
          draft.value[field] || "";
      }
    }

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

    const stage =
      id("contentRecordStage");

    if (stage) {
      stage.textContent =
        `Stage ${record.stage_id}`;
    }

    const phase =
      id("contentRecordPhase");

    if (phase) {
      phase.textContent =
        record.phase_label ||
        record.phase ||
        "Unspecified phase";
    }

    const editorLabel =
      id("contentEditorStageLabel");

    if (editorLabel) {
      editorLabel.textContent =
        `Stage ${record.stage_id} guidance`;
    }

    const dirtyState =
      id("contentDraftState");

    if (dirtyState) {
      dirtyState.textContent =
        isDirty(record)
          ? `Draft differs from ${baselineLabel}`
          : `Matches ${baselineLabel}`;
    }

    syncReplacementView();
    updateDirtySummary();
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
    if (
      !record ||
      !draft
    ) {
      return;
    }

    draft =
      currentApi().updateField(
        draft,
        field,
        value
      );

    drafts.set(
      record.key,
      draft
    );

    const validation =
      currentApi().validateDraft(
        draft
      );

    setStatus(
      validation.ok
        ? `Stage ${record.stage_id} draft updated in memory.`
        : validationMessage(
            validation
          ),
      validation.ok
        ? "ok"
        : "warning"
    );

    syncFields();
    renderBrowser();
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
    Stage ${model.stage_id} ·
    ${escapeText(
      model.phase_label ||
      model.phase ||
      ""
    )}
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
    if (!draft) return;

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
      `Stage ${record.stage_id} preview generated from the current in-memory draft.`,
      "ok"
    );
  }

  function applyReplacement() {
    if (
      !record ||
      !draft
    ) {
      return;
    }

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

    drafts.set(
      record.key,
      draft
    );

    syncFields();
    renderBrowser();

    setStatus(
      `Stage ${record.stage_id} complete editable content block was replaced in memory.`,
      "ok"
    );
  }

  function resetDraft() {
    if (
      !record ||
      !draft
    ) {
      return;
    }

    if (
      !window.confirm(
        `Reset the Stage ${record.stage_id} in-memory draft to the ${baselineLabel}?`
      )
    ) {
      return;
    }

    draft =
      currentApi().createDraft(
        record
      );

    drafts.set(
      record.key,
      draft
    );

    syncFields();
    clearPreview();
    renderBrowser();

    setStatus(
      `Stage ${record.stage_id} draft reset to the ${baselineLabel}.`,
      "ok"
    );
  }

  function exportDraft() {
    if (
      !record ||
      !draft
    ) {
      return;
    }

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
      `rms-content-stage-${record.stage_id}-draft.json`;

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
      `Stage ${record.stage_id} draft JSON exported. Nothing was published.`,
      "ok"
    );
  }

  function selectRecord(key) {
    const nextRecord =
      recordForKey(key);

    if (!nextRecord) {
      return;
    }

    selectedKey =
      nextRecord.key;

    record =
      nextRecord;

    draft =
      draftForRecord(
        nextRecord
      );

    syncFields();
    clearPreview();
    renderBrowser();

    setStatus(
      `Stage ${record.stage_id} guidance loaded from the ${baselineLabel}. Edits stay in memory.`,
      "ok"
    );
  }

  function browserSearchValue() {
    return String(
      id("contentBrowserSearch")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();
  }

  function matchesSearch(
    nextRecord,
    query
  ) {
    if (!query) {
      return true;
    }

    const haystack = [
      String(
        nextRecord.stage_id
      ),
      nextRecord.value.title,
      nextRecord.value.nav,
      nextRecord.phase_label,
      nextRecord.phase
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(
      query
    );
  }

  function renderBrowser() {
    const list =
      id("contentBrowserList");

    if (!list) return;

    list.replaceChildren();

    const query =
      browserSearchValue();

    const visible =
      records.filter(
        item =>
          matchesSearch(
            item,
            query
          )
      );

    const count =
      id("contentBrowserCount");

    if (count) {
      count.textContent =
        query
          ? `${visible.length} of ${records.length} stages`
          : `${records.length} stages`;
    }

    for (const nextRecord of visible) {
      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "content-browser-item";

      if (
        nextRecord.key ===
        selectedKey
      ) {
        button.setAttribute(
          "aria-current",
          "true"
        );
      }

      const top =
        document.createElement(
          "span"
        );

      top.className =
        "content-browser-stage";

      top.textContent =
        `Stage ${nextRecord.stage_id}`;

      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        nextRecord.value.title;

      const phase =
        document.createElement(
          "small"
        );

      phase.textContent =
        nextRecord.phase_label ||
        nextRecord.phase ||
        "";

      button.append(
        top,
        title,
        phase
      );

      if (isDirty(nextRecord)) {
        const dirty =
          document.createElement(
            "span"
          );

        dirty.className =
          "content-browser-dirty";

        dirty.textContent =
          "Draft changed";

        button.appendChild(
          dirty
        );
      }

      button.addEventListener(
        "click",
        () => {
          selectRecord(
            nextRecord.key
          );
        }
      );

      list.appendChild(
        button
      );
    }

    if (visible.length === 0) {
      const empty =
        document.createElement(
          "p"
        );

      empty.className =
        "content-browser-no-results";

      empty.textContent =
        "No research stages match this search.";

      list.appendChild(
        empty
      );
    }

    updateDirtySummary();
  }

  function snapshotRecords() {
    return records.map(
      nextRecord => {
        const copy =
          JSON.parse(
            JSON.stringify(
              nextRecord
            )
          );

        const nextDraft =
          drafts.get(
            nextRecord.key
          );

        if (nextDraft) {
          copy.value =
            JSON.parse(
              JSON.stringify(
                nextDraft.value
              )
            );
        }

        return copy;
      }
    );
  }

  function hasDirtyDrafts() {
    return dirtyCount() > 0;
  }

  function replaceBaseline(
    nextRecords,
    sourceLabel
  ) {
    const api =
      currentApi();

    if (
      !api ||
      !Array.isArray(
        nextRecords
      )
    ) {
      return false;
    }

    const accepted =
      api.listRecords({
        records:
          nextRecords
      });

    if (
      accepted.length !==
      18
    ) {
      return false;
    }

    const priorKey =
      selectedKey;

    records =
      accepted;

    baselineLabel =
      String(
        sourceLabel ||
        "current baseline"
      ).trim() ||
      "current baseline";

    drafts.clear();

    selectedKey = "";
    record = null;
    draft = null;

    renderBrowser();

    const nextKey =
      recordForKey(
        priorKey
      )
        ?.key ||
      records[0]?.key ||
      "";

    if (!nextKey) {
      return false;
    }

    selectRecord(
      nextKey
    );

    return true;
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

    records =
      api.listRecords(
        registry
      );

    if (
      records.length !== 18
    ) {
      setStatus(
        "Content Studio expected 18 stage guidance records.",
        "error"
      );
      return false;
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

    id("contentBrowserSearch")
      ?.addEventListener(
        "input",
        renderBrowser
      );

    id("validateContentDraft")
      ?.addEventListener(
        "click",
        () => {
          if (!draft) return;

          const validation =
            api.validateDraft(
              draft
            );

          setStatus(
            validation.ok
              ? `Stage ${record.stage_id} draft is valid.`
              : validationMessage(
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

    renderBrowser();

    selectRecord(
      records[0].key
    );

    mounted = true;
    return true;
  }

  return Object.freeze({
    mount,
    snapshotRecords,
    hasDirtyDrafts,
    replaceBaseline
  });
})();
