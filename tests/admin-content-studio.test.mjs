import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadBrowserScript(
  path,
  context
) {
  vm.runInNewContext(
    readFileSync(path, "utf8"),
    context,
    {
      filename: path
    }
  );
}

const context = {
  window: {}
};

loadBrowserScript(
  "assets/content-registry.js",
  context
);

loadBrowserScript(
  "assets/admin-content-studio.js",
  context
);

const registry =
  context.window.RMSContentRegistry;

const studio =
  context.window.RMSAdminContentStudio;

function normalizeLineEndings(
  value
) {
  if (typeof value === "string") {
    return value.replace(
      /\r\n/g,
      "\n"
    );
  }

  if (Array.isArray(value)) {
    return value.map(
      normalizeLineEndings
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .map(
          ([key, item]) => [
            key,
            normalizeLineEndings(
              item
            )
          ]
        )
    );
  }

  return value;
}

function stageOneFromCurriculum() {
  const source =
    readFileSync(
      "assets/curriculum.js",
      "utf8"
    );

  const start =
    source.indexOf(
      "    {\n      id:1,"
    ) >= 0
      ? source.indexOf(
          "    {\n      id:1,"
        )
      : source.indexOf(
          "    {\r\n      id:1,"
        );

  const stageTwoLf =
    source.indexOf(
      "    {\n      id:2,",
      start
    );

  const stageTwoCrLf =
    source.indexOf(
      "    {\r\n      id:2,",
      start
    );

  const end =
    stageTwoLf >= 0
      ? stageTwoLf
      : stageTwoCrLf;

  assert.ok(start >= 0);
  assert.ok(end > start);

  const block =
    source.slice(
      start,
      end
    );

  function pick(
    regex,
    label
  ) {
    const match =
      block.match(regex);

    assert.ok(
      match,
      `Missing Stage 1 ${label}`
    );

    return match[1];
  }

  return {
    title:
      pick(
        /title:"([^"]+)"/,
        "title"
      ),
    nav:
      pick(
        /nav:"([^"]+)"/,
        "nav"
      ),
    purpose:
      pick(
        /purpose:"([^"]+)"/,
        "purpose"
      ),
    learn_html:
      pick(
        /learn:`([\s\S]*?)`,\r?\n      example:/,
        "learn"
      ),
    example_html:
      pick(
        /example:`([\s\S]*?)`,\r?\n      warning:/,
        "example"
      ),
    warning_html:
      pick(
        /warning:`([\s\S]*?)`,\r?\n      custom:/,
        "warning"
      )
  };
}

test(
  "Content registry seeds Stage 1 guidance exactly from the current curriculum",
  () => {
    assert.equal(
      registry.schema_version,
      "1.0"
    );

    assert.equal(
      registry.records.length,
      1
    );

    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    assert.ok(record);

    assert.equal(
      record.type,
      "stage_guidance"
    );

    assert.equal(
      record.stage_id,
      1
    );

    assert.deepEqual(
      normalizeLineEndings(
        JSON.parse(
          JSON.stringify(
            record.value
          )
        )
      ),
      normalizeLineEndings(
        stageOneFromCurriculum()
      )
    );
  }
);

test(
  "published Stage 1 seed passes Content Studio validation",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    const draft =
      studio.createDraft(
        record
      );

    const validation =
      studio.validateDraft(
        draft
      );

    assert.equal(
      validation.ok,
      true
    );

    assert.deepEqual(
      [...validation.errors],
      []
    );
  }
);

test(
  "field editing is immutable and does not mutate the registry seed",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    const draft =
      studio.createDraft(
        record
      );

    const next =
      studio.updateField(
        draft,
        "title",
        "A revised Stage 1 title"
      );

    assert.equal(
      draft.value.title,
      record.value.title
    );

    assert.equal(
      next.value.title,
      "A revised Stage 1 title"
    );

    assert.equal(
      registry.records[0]
        .value.title,
      record.value.title
    );

    assert.equal(
      studio.hasChanges(
        draft,
        record
      ),
      false
    );

    assert.equal(
      studio.hasChanges(
        next,
        record
      ),
      true
    );
  }
);

test(
  "full-block replacement requires exactly the six editable fields",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    const draft =
      studio.createDraft(
        record
      );

    const missing =
      {
        ...JSON.parse(
          JSON.stringify(
            record.value
          )
        )
      };

    delete missing.warning_html;

    const missingResult =
      studio.replaceValue(
        draft,
        missing
      );

    assert.equal(
      missingResult.ok,
      false
    );

    const extra =
      {
        ...JSON.parse(
          JSON.stringify(
            record.value
          )
        ),
        hidden_extra: "no"
      };

    const extraResult =
      studio.replaceValue(
        draft,
        extra
      );

    assert.equal(
      extraResult.ok,
      false
    );

    const complete =
      {
        ...JSON.parse(
          JSON.stringify(
            record.value
          )
        ),
        title:
          "Complete replacement title"
      };

    const completeResult =
      studio.replaceValue(
        draft,
        complete
      );

    assert.equal(
      completeResult.ok,
      true
    );

    assert.equal(
      completeResult
        .draft.value.title,
      "Complete replacement title"
    );
  }
);

test(
  "Content Studio rejects active or embedded markup",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    const dangerous = [
      "<script>alert(1)</script>",
      "<img src=x>",
      "<p onclick=\"alert(1)\">Click</p>",
      "<a href=\"https://example.com\">link</a>",
      "<form><input></form>",
      "<iframe src=\"https://example.com\"></iframe>",
      "<object></object>",
      "<svg></svg>"
    ];

    for (const markup of dangerous) {
      const value =
        JSON.parse(
          JSON.stringify(
            record.value
          )
        );

      value.learn_html =
        markup;

      const validation =
        studio.validateValue(
          value
        );

      assert.equal(
        validation.ok,
        false,
        markup
      );
    }
  }
);

test(
  "Content Studio accepts the restricted instructional markup used by Stage 1",
  () => {
    const value = {
      title: "Title",
      nav: "Navigation",
      purpose:
        "A concise instructional purpose.",
      learn_html:
        '<h3>Heading</h3><p>Paragraph <strong>with emphasis</strong>.</p><div class="concept-box">Concept<br>line</div><ul><li>One</li></ul>',
      example_html:
        "<strong>Example</strong><p>Example text.</p>",
      warning_html:
        "<strong>Warning</strong><ol><li>Check scope.</li></ol>"
    };

    const validation =
      studio.validateValue(
        value
      );

    assert.equal(
      validation.ok,
      true
    );
  }
);

test(
  "invalid drafts cannot generate previews or export packets",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    let draft =
      studio.createDraft(
        record
      );

    draft =
      studio.updateField(
        draft,
        "learn_html",
        "<script>alert(1)</script>"
      );

    const preview =
      studio.previewModel(
        draft
      );

    const exported =
      studio.exportEnvelope(
        draft
      );

    assert.equal(
      preview.ok,
      false
    );

    assert.equal(
      preview.model,
      null
    );

    assert.equal(
      exported.ok,
      false
    );

    assert.equal(
      exported.packet,
      null
    );
  }
);

test(
  "valid draft export is a content draft packet and never a publication packet",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.1.guidance"
      );

    const draft =
      studio.createDraft(
        record
      );

    const exported =
      studio.exportEnvelope(
        draft
      );

    assert.equal(
      exported.ok,
      true
    );

    assert.equal(
      exported.packet.packet_type,
      "rms_admin_content_draft"
    );

    assert.equal(
      exported.packet.version,
      "1.0"
    );

    assert.equal(
      exported.packet.key,
      record.key
    );

    assert.equal(
      Object.hasOwn(
        exported.packet,
        "published"
      ),
      false
    );
  }
);

test(
  "Content Studio model introduces no network or persistence path",
  () => {
    const data =
      readFileSync(
        "assets/admin-content-studio.js",
        "utf8"
      );

    const ui =
      readFileSync(
        "assets/admin-content-studio-ui.js",
        "utf8"
      );

    for (const source of [
      data,
      ui
    ]) {
      assert.doesNotMatch(
        source,
        /\bfetch\s*\(/
      );

      assert.doesNotMatch(
        source,
        /XMLHttpRequest/
      );

      assert.doesNotMatch(
        source,
        /WebSocket/
      );

      assert.doesNotMatch(
        source,
        /navigator\.sendBeacon/
      );

      assert.doesNotMatch(
        source,
        /localStorage/
      );

      assert.doesNotMatch(
        source,
        /indexedDB/i
      );
    }
  }
);
