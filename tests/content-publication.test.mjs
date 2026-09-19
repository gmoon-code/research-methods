import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import {
  CONTENT_SCHEMA_VERSION,
  CONTENT_STAGE_COUNT,
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
} from "../backend/cloudflare-workers-ai/content-publication.mjs";

function loadRegistry() {
  const context = {
    window: {}
  };

  vm.runInNewContext(
    readFileSync(
      "assets/content-registry.js",
      "utf8"
    ),
    context,
    {
      filename:
        "assets/content-registry.js"
    }
  );

  return JSON.parse(
    JSON.stringify(
      context.window
        .RMSContentRegistry
    )
  );
}

const registry =
  loadRegistry();

function candidate({
  expected = null,
  summary = "Publish validated stage guidance",
  records = registry.records
} = {}) {
  return {
    schema_version:
      CONTENT_SCHEMA_VERSION,
    expected_current_release_id:
      expected,
    change_summary:
      summary,
    records:
      records.map(
        record => ({
          key: record.key,
          type: record.type,
          phase: record.phase,
          stage_id:
            record.stage_id,
          value:
            JSON.parse(
              JSON.stringify(
                record.value
              )
            )
        })
      )
  };
}

const HASH_A =
  "a".repeat(64);

const HASH_B =
  "b".repeat(64);

function releaseOne() {
  return createRelease({
    candidate: candidate(),
    releaseId: "release-001",
    nowIso:
      "2026-09-19T00:00:00.000Z",
    contentHash: HASH_A
  });
}

test(
  "current 18-stage registry forms a valid publication candidate",
  () => {
    const result =
      validateCandidate(
        candidate()
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.candidate
        .records.length,
      CONTENT_STAGE_COUNT
    );

    assert.deepEqual(
      result.candidate
        .records.map(
          record =>
            record.stage_id
        ),
      Array.from(
        { length: 18 },
        (_, index) =>
          index + 1
      )
    );
  }
);

test(
  "publication candidate normalization sorts stages deterministically",
  () => {
    const reversed =
      candidate({
        records:
          [...registry.records]
            .reverse()
      });

    const result =
      validateCandidate(
        reversed
      );

    assert.equal(
      result.ok,
      true
    );

    assert.deepEqual(
      result.candidate
        .records.map(
          record =>
            record.stage_id
        ),
      Array.from(
        { length: 18 },
        (_, index) =>
          index + 1
      )
    );
  }
);

test(
  "publication candidate requires exactly the supported top-level fields",
  () => {
    const missing =
      candidate();

    delete missing.change_summary;

    assert.equal(
      validateCandidate(
        missing
      ).ok,
      false
    );

    const extra = {
      ...candidate(),
      hidden: "no"
    };

    assert.equal(
      validateCandidate(
        extra
      ).ok,
      false
    );
  }
);

test(
  "publication candidate requires exactly 18 unique stage records",
  () => {
    const tooFew =
      candidate({
        records:
          registry.records
            .slice(0, 17)
      });

    assert.equal(
      validateCandidate(
        tooFew
      ).ok,
      false
    );

    const duplicateRecords =
      registry.records.map(
        record =>
          JSON.parse(
            JSON.stringify(
              record
            )
          )
      );

    duplicateRecords[17]
      .stage_id = 17;

    duplicateRecords[17]
      .key =
        "curriculum.stage.17.guidance";

    duplicateRecords[17]
      .phase = "write";

    assert.equal(
      validateCandidate(
        candidate({
          records:
            duplicateRecords
        })
      ).ok,
      false
    );
  }
);

test(
  "publication records enforce stage key phase and record type",
  () => {
    const base =
      candidate()
        .records[9];

    for (
      const mutated
      of [
        {
          ...base,
          stage_id: 0
        },
        {
          ...base,
          key:
            "curriculum.stage.11.guidance"
        },
        {
          ...base,
          phase: "write"
        },
        {
          ...base,
          type: "other"
        },
        {
          ...base,
          extra: true
        }
      ]
    ) {
      assert.equal(
        validateRecord(
          mutated
        ).ok,
        false
      );
    }
  }
);

test(
  "publication values require exactly the six supported guidance fields",
  () => {
    const value =
      JSON.parse(
        JSON.stringify(
          registry.records[0]
            .value
        )
      );

    delete value.warning_html;

    assert.equal(
      validateValue(
        value
      ).ok,
      false
    );

    const extra = {
      ...registry.records[0]
        .value,
      hidden: "no"
    };

    assert.equal(
      validateValue(
        extra
      ).ok,
      false
    );
  }
);

test(
  "publication validator accepts all markup used by the current curriculum",
  () => {
    for (
      const record
      of registry.records
    ) {
      assert.equal(
        validateValue(
          record.value
        ).ok,
        true,
        record.key
      );
    }
  }
);

test(
  "publication validator rejects active embedded linked and styled markup",
  () => {
    const unsafe = [
      "<script>alert(1)</script>",
      "<img src=x>",
      "<p onclick=\"alert(1)\">x</p>",
      "<a href=\"https://example.com\">x</a>",
      "<p style=\"display:none\">x</p>",
      "<iframe></iframe>",
      "<object></object>",
      "<form></form>",
      "<svg></svg>",
      "<math></math>",
      "<video></video>"
    ];

    for (
      const markup
      of unsafe
    ) {
      const value =
        JSON.parse(
          JSON.stringify(
            registry.records[0]
              .value
          )
        );

      value.learn_html =
        markup;

      assert.equal(
        validateValue(
          value
        ).ok,
        false,
        markup
      );
    }
  }
);

test(
  "publication validator allows only the approved concept-box class",
  () => {
    const valid =
      JSON.parse(
        JSON.stringify(
          registry.records[0]
            .value
        )
      );

    valid.learn_html =
      '<div class="concept-box"><strong>Safe</strong></div>';

    assert.equal(
      validateValue(
        valid
      ).ok,
      true
    );

    for (
      const markup
      of [
        '<div class="other">No</div>',
        '<div class="concept-box other">No</div>',
        '<p class="concept-box">Allowed class but still explicit allowlist</p>',
        '<div id="concept-box">No</div>'
      ]
    ) {
      const value =
        JSON.parse(
          JSON.stringify(
            registry.records[0]
              .value
          )
        );

      value.learn_html =
        markup;

      const result =
        validateValue(
          value
        );

      if (
        markup.startsWith(
          '<p class="concept-box"'
        )
      ) {
        assert.equal(
          result.ok,
          true
        );
      } else {
        assert.equal(
          result.ok,
          false,
          markup
        );
      }
    }
  }
);

test(
  "publication candidate validates expected current release identifier and change summary",
  () => {
    assert.equal(
      validateCandidate(
        candidate({
          expected:
            "release-001"
        })
      ).ok,
      true
    );

    assert.equal(
      validateCandidate(
        candidate({
          expected:
            "bad release id"
        })
      ).ok,
      false
    );

    assert.equal(
      validateCandidate(
        candidate({
          summary: "x"
        })
      ).ok,
      false
    );

    assert.equal(
      validateCandidate(
        candidate({
          summary:
            "x".repeat(501)
        })
      ).ok,
      false
    );
  }
);

test(
  "content hash input is stable across record and object-key ordering",
  () => {
    const first =
      candidate();

    const reversed =
      candidate({
        records:
          [...registry.records]
            .reverse()
      });

    assert.equal(
      contentHashInput(
        first
      ),
      contentHashInput(
        reversed
      )
    );

    const reorderedValue =
      {
        warning_html:
          first.records[0]
            .value.warning_html,
        title:
          first.records[0]
            .value.title,
        learn_html:
          first.records[0]
            .value.learn_html,
        nav:
          first.records[0]
            .value.nav,
        purpose:
          first.records[0]
            .value.purpose,
        example_html:
          first.records[0]
            .value.example_html
      };

    const modified =
      candidate();

    modified.records[0].value =
      reorderedValue;

    assert.equal(
      contentHashInput(
        first
      ),
      contentHashInput(
        modified
      )
    );
  }
);

test(
  "canonicalStringify sorts object keys while retaining array order",
  () => {
    assert.equal(
      canonicalStringify({
        z: 1,
        a: {
          y: 2,
          b: 3
        },
        list: [3, 2, 1]
      }),
      '{"a":{"b":3,"y":2},"list":[3,2,1],"z":1}'
    );
  }
);

test(
  "stale publication state is detected without mutation",
  () => {
    const current =
      releaseOne();

    assert.deepEqual(
      checkExpectedCurrentRelease(
        "release-001",
        current
      ),
      {
        ok: true,
        expected:
          "release-001",
        actual:
          "release-001"
      }
    );

    assert.equal(
      checkExpectedCurrentRelease(
        "release-old",
        current
      ).ok,
      false
    );

    assert.equal(
      checkExpectedCurrentRelease(
        null,
        null
      ).ok,
      true
    );

    assert.equal(
      checkExpectedCurrentRelease(
        null,
        current
      ).ok,
      false
    );
  }
);

test(
  "server release construction controls trusted metadata",
  () => {
    const release =
      releaseOne();

    assert.equal(
      release.schema_version,
      CONTENT_SCHEMA_VERSION
    );

    assert.equal(
      release.release_id,
      "release-001"
    );

    assert.equal(
      release.content_version,
      "release-001"
    );

    assert.equal(
      release.created_at,
      "2026-09-19T00:00:00.000Z"
    );

    assert.equal(
      release.published_at,
      "2026-09-19T00:00:00.000Z"
    );

    assert.equal(
      release.parent_release_id,
      null
    );

    assert.equal(
      release.rollback_source_release_id,
      null
    );

    assert.equal(
      release.content_hash,
      HASH_A
    );

    assert.equal(
      release.records.length,
      18
    );

    assert.equal(
      Object.hasOwn(
        release,
        "expected_current_release_id"
      ),
      false
    );

    assert.equal(
      Object.isFrozen(
        release
      ),
      true
    );
  }
);

test(
  "release construction rejects invalid server metadata",
  () => {
    const base = {
      candidate:
        candidate(),
      releaseId:
        "release-001",
      nowIso:
        "2026-09-19T00:00:00.000Z",
      contentHash:
        HASH_A
    };

    assert.throws(
      () =>
        createRelease({
          ...base,
          releaseId:
            "bad release"
        })
    );

    assert.throws(
      () =>
        createRelease({
          ...base,
          nowIso:
            "not-a-date"
        })
    );

    assert.throws(
      () =>
        createRelease({
          ...base,
          contentHash:
            "abc"
        })
    );
  }
);

test(
  "stored release validation rejects tampered metadata and unknown fields",
  () => {
    const release =
      JSON.parse(
        JSON.stringify(
          releaseOne()
        )
      );

    assert.equal(
      validateStoredRelease(
        release
      ).ok,
      true
    );

    assert.equal(
      validateStoredRelease({
        ...release,
        content_version:
          "different"
      }).ok,
      false
    );

    assert.equal(
      validateStoredRelease({
        ...release,
        extra: true
      }).ok,
      false
    );

    assert.equal(
      validateStoredRelease({
        ...release,
        parent_release_id:
          "bad parent id"
      }).ok,
      false
    );
  }
);

test(
  "public projection exposes only safe published content fields",
  () => {
    const release =
      releaseOne();

    const publicRelease =
      publicReleaseProjection(
        release
      );

    assert.deepEqual(
      Object.keys(
        publicRelease
      ).sort(),
      [
        "content_hash",
        "content_version",
        "published_at",
        "records",
        "release_id",
        "schema_version"
      ].sort()
    );

    assert.equal(
      Object.hasOwn(
        publicRelease,
        "change_summary"
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        publicRelease,
        "parent_release_id"
      ),
      false
    );

    assert.equal(
      Object.hasOwn(
        publicRelease,
        "rollback_source_release_id"
      ),
      false
    );

    assert.equal(
      Object.isFrozen(
        publicRelease
      ),
      true
    );
  }
);

test(
  "revision metadata omits content bodies",
  () => {
    const metadata =
      revisionMetadata(
        releaseOne()
      );

    assert.equal(
      Object.hasOwn(
        metadata,
        "records"
      ),
      false
    );

    assert.equal(
      metadata.release_id,
      "release-001"
    );

    assert.equal(
      metadata.content_hash,
      HASH_A
    );
  }
);

test(
  "rollback creates a new chronological release from a prior revision",
  () => {
    const target =
      releaseOne();

    const changedCandidate =
      candidate({
        expected:
          "release-001",
        summary:
          "Change Stage 2 title"
      });

    changedCandidate
      .records[1]
      .value.title =
        "Changed Stage 2";

    const current =
      createRelease({
        candidate:
          changedCandidate,
        releaseId:
          "release-002",
        nowIso:
          "2026-09-19T01:00:00.000Z",
        contentHash:
          HASH_B,
        parentReleaseId:
          "release-001"
      });

    const rollback =
      createRollbackRelease({
        currentRelease:
          current,
        targetRelease:
          target,
        releaseId:
          "release-003",
        nowIso:
          "2026-09-19T02:00:00.000Z",
        contentHash:
          HASH_A,
        changeSummary:
          "Rollback to release 001"
      });

    assert.equal(
      rollback.release_id,
      "release-003"
    );

    assert.equal(
      rollback.parent_release_id,
      "release-002"
    );

    assert.equal(
      rollback
        .rollback_source_release_id,
      "release-001"
    );

    assert.equal(
      rollback.records[1]
        .value.title,
      target.records[1]
        .value.title
    );

    assert.notEqual(
      rollback.records[1]
        .value.title,
      current.records[1]
        .value.title
    );
  }
);

test(
  "rollback refuses invalid stored releases",
  () => {
    const current =
      releaseOne();

    const invalidTarget = {
      ...JSON.parse(
        JSON.stringify(
          current
        )
      ),
      content_version:
        "tampered"
    };

    assert.throws(
      () =>
        createRollbackRelease({
          currentRelease:
            current,
          targetRelease:
            invalidTarget,
          releaseId:
            "release-002",
          nowIso:
            "2026-09-19T01:00:00.000Z",
          contentHash:
            HASH_A,
          changeSummary:
            "Rollback"
        })
    );
  }
);

test(
  "pure publication model has no route storage network or environment dependency",
  () => {
    const source =
      readFileSync(
        "backend/cloudflare-workers-ai/content-publication.mjs",
        "utf8"
      );

    assert.doesNotMatch(
      source,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      source,
      /env\./
    );

    assert.doesNotMatch(
      source,
      /\.put\s*\(/
    );

    assert.doesNotMatch(
      source,
      /\.get\s*\(/
    );

    assert.doesNotMatch(
      source,
      /KVNamespace/
    );

    assert.doesNotMatch(
      source,
      /RMS_TEACHER_SESSION/
    );
  }
);
