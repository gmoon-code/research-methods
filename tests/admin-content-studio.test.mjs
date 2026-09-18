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

function curriculumSource() {
  return readFileSync(
    "assets/curriculum.js",
    "utf8"
  );
}

function stageBlock(
  source,
  stageId
) {
  const lf =
    `    {\n      id:${stageId},`;

  const crlf =
    `    {\r\n      id:${stageId},`;

  let start =
    source.indexOf(lf);

  if (start < 0) {
    start =
      source.indexOf(crlf);
  }

  assert.ok(
    start >= 0,
    `Missing Stage ${stageId} start`
  );

  let end = -1;

  if (stageId < 18) {
    const nextLf =
      `    {\n      id:${stageId + 1},`;

    const nextCrLf =
      `    {\r\n      id:${stageId + 1},`;

    end =
      source.indexOf(
        nextLf,
        start + 1
      );

    if (end < 0) {
      end =
        source.indexOf(
          nextCrLf,
          start + 1
        );
    }
  } else {
    end =
      source.indexOf(
        "\n  ];",
        start
      );

    if (end < 0) {
      end =
        source.indexOf(
          "\r\n  ];",
          start
        );
    }
  }

  assert.ok(
    end > start,
    `Missing Stage ${stageId} end`
  );

  return source.slice(
    start,
    end
  );
}

function stageFromCurriculum(
  stageId
) {
  const block =
    stageBlock(
      curriculumSource(),
      stageId
    );

  function pick(
    regex,
    label
  ) {
    const match =
      block.match(regex);

    assert.ok(
      match,
      `Missing Stage ${stageId} ${label}`
    );

    return match[1];
  }

  return {
    phase:
      pick(
        /phase:"([^"]+)"/,
        "phase"
      ),
    value: {
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
          /warning:`([\s\S]*?)`,\r?\n      (?:custom:|sections:)/,
          "warning"
        )
    }
  };
}

test(
  "Content registry contains exactly 18 ordered stage guidance records",
  () => {
    assert.equal(
      registry.schema_version,
      "1.0"
    );

    assert.equal(
      registry.content_version,
      "v3-content-foundation-2"
    );

    assert.equal(
      registry.records.length,
      18
    );

    assert.deepEqual(
      registry.records.map(
        record =>
          record.stage_id
      ),
      Array.from(
        { length: 18 },
        (_, index) =>
          index + 1
      )
    );

    for (
      const record
      of registry.records
    ) {
      assert.equal(
        record.key,
        `curriculum.stage.${record.stage_id}.guidance`
      );

      assert.equal(
        record.type,
        "stage_guidance"
      );

      assert.equal(
        record.revision,
        "seed-v2.17.1"
      );

      assert.equal(
        record.published,
        true
      );
    }
  }
);

test(
  "all 18 registry records match the current curriculum guidance exactly",
  () => {
    for (
      let stageId = 1;
      stageId <= 18;
      stageId += 1
    ) {
      const record =
        studio.getRecord(
          registry,
          `curriculum.stage.${stageId}.guidance`
        );

      assert.ok(
        record,
        `Stage ${stageId}`
      );

      const current =
        stageFromCurriculum(
          stageId
        );

      assert.equal(
        record.phase,
        current.phase,
        `Stage ${stageId} phase`
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
          current.value
        ),
        `Stage ${stageId} content`
      );
    }
  }
);

test(
  "Content Studio lists valid records in deterministic stage order",
  () => {
    const records =
      studio.listRecords(
        registry
      );

    assert.equal(
      records.length,
      18
    );

    assert.deepEqual(
      records.map(
        record =>
          record.stage_id
      ),
      Array.from(
        { length: 18 },
        (_, index) =>
          index + 1
      )
    );

    assert.equal(
      Object.isFrozen(
        records
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        records[0]
      ),
      true
    );
  }
);

test(
  "every published stage seed creates a valid draft",
  () => {
    for (
      const record
      of studio.listRecords(
        registry
      )
    ) {
      const validation =
        studio.validateRecord(
          record
        );

      assert.equal(
        validation.ok,
        true,
        record.key
      );

      const draft =
        studio.createDraft(
          record
        );

      const draftValidation =
        studio.validateDraft(
          draft
        );

      assert.equal(
        draftValidation.ok,
        true,
        record.key
      );

      assert.equal(
        draft.stage_id,
        record.stage_id
      );

      assert.equal(
        draft.phase,
        record.phase
      );
    }
  }
);

test(
  "record validation enforces stage range key identity type and phase",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.4.guidance"
      );

    const raw =
      JSON.parse(
        JSON.stringify(
          record
        )
      );

    for (
      const mutation
      of [
        {
          ...raw,
          stage_id: 0
        },
        {
          ...raw,
          stage_id: 19
        },
        {
          ...raw,
          key:
            "curriculum.stage.5.guidance"
        },
        {
          ...raw,
          type: "other"
        },
        {
          ...raw,
          phase: "unknown"
        }
      ]
    ) {
      assert.equal(
        studio.validateRecord(
          mutation
        ).ok,
        false
      );
    }
  }
);

test(
  "field editing is immutable and does not mutate any registry seed",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.3.guidance"
      );

    const originalTitle =
      record.value.title;

    const draft =
      studio.createDraft(
        record
      );

    const next =
      studio.updateField(
        draft,
        "title",
        "A revised Stage 3 title"
      );

    assert.equal(
      draft.value.title,
      originalTitle
    );

    assert.equal(
      next.value.title,
      "A revised Stage 3 title"
    );

    assert.equal(
      registry.records[2]
        .value.title,
      originalTitle
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
  "drafts for different stages remain independent",
  () => {
    const stage2 =
      studio.getRecord(
        registry,
        "curriculum.stage.2.guidance"
      );

    const stage17 =
      studio.getRecord(
        registry,
        "curriculum.stage.17.guidance"
      );

    const draft2 =
      studio.updateField(
        studio.createDraft(
          stage2
        ),
        "title",
        "Stage 2 changed"
      );

    const draft17 =
      studio.updateField(
        studio.createDraft(
          stage17
        ),
        "nav",
        "Stage 17 changed"
      );

    assert.equal(
      draft2.value.title,
      "Stage 2 changed"
    );

    assert.equal(
      draft2.value.nav,
      stage2.value.nav
    );

    assert.equal(
      draft17.value.title,
      stage17.value.title
    );

    assert.equal(
      draft17.value.nav,
      "Stage 17 changed"
    );

    assert.equal(
      stage2.value.title,
      registry.records[1]
        .value.title
    );

    assert.equal(
      stage17.value.nav,
      registry.records[16]
        .value.nav
    );
  }
);

test(
  "full-block replacement requires exactly the six editable fields",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.10.guidance"
      );

    const draft =
      studio.createDraft(
        record
      );

    const missing =
      JSON.parse(
        JSON.stringify(
          record.value
        )
      );

    delete missing.warning_html;

    assert.equal(
      studio.replaceValue(
        draft,
        missing
      ).ok,
      false
    );

    const extra = {
      ...JSON.parse(
        JSON.stringify(
          record.value
        )
      ),
      hidden_extra: "no"
    };

    assert.equal(
      studio.replaceValue(
        draft,
        extra
      ).ok,
      false
    );

    const complete = {
      ...JSON.parse(
        JSON.stringify(
          record.value
        )
      ),
      title:
        "Complete replacement title"
    };

    const result =
      studio.replaceValue(
        draft,
        complete
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.draft.value.title,
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
        "curriculum.stage.6.guidance"
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

    for (
      const markup
      of dangerous
    ) {
      const value =
        JSON.parse(
          JSON.stringify(
            record.value
          )
        );

      value.learn_html =
        markup;

      assert.equal(
        studio.validateValue(
          value
        ).ok,
        false,
        markup
      );
    }
  }
);

test(
  "Content Studio accepts restricted instructional markup",
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

    assert.equal(
      studio.validateValue(
        value
      ).ok,
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
        "curriculum.stage.12.guidance"
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
  "valid draft preview and export retain selected stage identity",
  () => {
    const record =
      studio.getRecord(
        registry,
        "curriculum.stage.18.guidance"
      );

    const draft =
      studio.createDraft(
        record
      );

    const preview =
      studio.previewModel(
        draft
      );

    assert.equal(
      preview.ok,
      true
    );

    assert.equal(
      preview.model.stage_id,
      18
    );

    assert.equal(
      preview.model.phase,
      "write"
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
      exported.packet.stage_id,
      18
    );

    assert.equal(
      exported.packet.phase,
      "write"
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
  "unknown content keys do not produce managed records",
  () => {
    assert.equal(
      studio.getRecord(
        registry,
        "curriculum.stage.99.guidance"
      ),
      null
    );

    assert.equal(
      studio.getRecord(
        registry,
        "other.content"
      ),
      null
    );
  }
);

test(
  "Content Studio browser source preserves separate session drafts and search",
  () => {
    const ui =
      readFileSync(
        "assets/admin-content-studio-ui.js",
        "utf8"
      );

    for (
      const required
      of [
        "const drafts = new Map();",
        "function renderBrowser()",
        "function matchesSearch(",
        "contentBrowserSearch",
        "contentBrowserList",
        "contentDirtyCount",
        "Draft changed",
        "records.length !== 18",
        "drafts.set(",
        "draftForRecord("
      ]
    ) {
      assert.equal(
        ui.includes(required),
        true,
        required
      );
    }
  }
);

test(
  "Content Studio model and browser introduce no network or persistence path",
  () => {
    const sources = [
      readFileSync(
        "assets/admin-content-studio.js",
        "utf8"
      ),
      readFileSync(
        "assets/admin-content-studio-ui.js",
        "utf8"
      ),
      readFileSync(
        "assets/content-registry.js",
        "utf8"
      )
    ];

    for (
      const source
      of sources
    ) {
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
