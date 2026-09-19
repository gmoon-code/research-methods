import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function load(
  path,
  context
) {
  vm.runInNewContext(
    readFileSync(
      path,
      "utf8"
    ),
    context,
    {
      filename: path
    }
  );
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

const context = {
  window: {}
};

load(
  "assets/content-registry.js",
  context
);

load(
  "assets/admin-content-studio.js",
  context
);

load(
  "assets/admin-content-publication.js",
  context
);

const registry =
  context.window
    .RMSContentRegistry;

const publication =
  context.window
    .RMSAdminContentPublication;

function release(
  releaseId =
    "rel_test_001"
) {
  return {
    schema_version: "1.0",
    content_version:
      releaseId,
    release_id:
      releaseId,
    published_at:
      "2026-09-19T07:00:00.000Z",
    content_hash:
      "a".repeat(64),
    records:
      registry.records.map(
        record => ({
          key:
            record.key,
          type:
            record.type,
          phase:
            record.phase,
          stage_id:
            record.stage_id,
          value:
            clone(
              record.value
            )
        })
      )
  };
}

test(
  "published release hydrates all 18 Admin editing records",
  () => {
    const source =
      release();

    const result =
      publication
        .hydrateRelease(
          source,
          registry
        );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.records.length,
      18
    );

    assert.deepEqual(
      Array.from(
        result.records,
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
      of result.records
    ) {
      assert.equal(
        record.revision,
        "rel_test_001"
      );

      assert.equal(
        record.published,
        true
      );

      assert.equal(
        typeof record.location,
        "string"
      );

      assert.equal(
        typeof record.phase_label,
        "string"
      );
    }
  }
);

test(
  "release hydration does not mutate server release or bundled registry",
  () => {
    const source =
      release();

    const beforeRelease =
      JSON.stringify(source);

    const beforeRegistry =
      JSON.stringify(
        registry
      );

    const result =
      publication
        .hydrateRelease(
          source,
          registry
        );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      JSON.stringify(source),
      beforeRelease
    );

    assert.equal(
      JSON.stringify(
        registry
      ),
      beforeRegistry
    );
  }
);

test(
  "release hydration rejects incomplete duplicate and unsafe records",
  () => {
    const incomplete =
      release();

    incomplete.records.pop();

    assert.equal(
      publication
        .hydrateRelease(
          incomplete,
          registry
        ).ok,
      false
    );

    const duplicate =
      release();

    duplicate.records[17] =
      clone(
        duplicate.records[16]
      );

    assert.equal(
      publication
        .hydrateRelease(
          duplicate,
          registry
        ).ok,
      false
    );

    const unsafe =
      release();

    unsafe.records[0]
      .value.learn_html =
        "<script>alert(1)</script>";

    assert.equal(
      publication
        .hydrateRelease(
          unsafe,
          registry
        ).ok,
      false
    );
  }
);

test(
  "publication candidate contains exactly the server release input fields",
  () => {
    const hydrated =
      publication
        .hydrateRelease(
          release(),
          registry
        );

    const result =
      publication
        .buildCandidate(
          hydrated.records,
          "rel_test_001",
          "Update stage guidance"
        );

    assert.equal(
      result.ok,
      true
    );

    assert.deepEqual(
      Object.keys(
        result.candidate
      ).sort(),
      [
        "change_summary",
        "expected_current_release_id",
        "records",
        "schema_version"
      ].sort()
    );

    assert.equal(
      result.candidate
        .schema_version,
      "1.0"
    );

    assert.equal(
      result.candidate
        .expected_current_release_id,
      "rel_test_001"
    );

    assert.equal(
      result.candidate
        .records.length,
      18
    );

    for (
      const record
      of result.candidate
        .records
    ) {
      assert.deepEqual(
        Object.keys(
          record
        ).sort(),
        [
          "key",
          "phase",
          "stage_id",
          "type",
          "value"
        ].sort()
      );

      assert.equal(
        Object.hasOwn(
          record,
          "revision"
        ),
        false
      );

      assert.equal(
        Object.hasOwn(
          record,
          "location"
        ),
        false
      );

      assert.equal(
        Object.hasOwn(
          record,
          "published"
        ),
        false
      );
    }
  }
);

test(
  "publication candidate supports the first server release with null expected state",
  () => {
    const result =
      publication
        .buildCandidate(
          registry.records,
          null,
          "Initial release"
        );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.candidate
        .expected_current_release_id,
      null
    );
  }
);

test(
  "publication candidate rejects invalid summary release identity and stage set",
  () => {
    assert.equal(
      publication
        .buildCandidate(
          registry.records,
          null,
          "x"
        ).ok,
      false
    );

    assert.equal(
      publication
        .buildCandidate(
          registry.records,
          "bad release id",
          "Valid summary"
        ).ok,
      false
    );

    assert.equal(
      publication
        .buildCandidate(
          registry.records
            .slice(0, 17),
          null,
          "Valid summary"
        ).ok,
      false
    );
  }
);

test(
  "rollback request requires current target and change summary",
  () => {
    const valid =
      publication
        .buildRollback(
          "rel_current",
          "rel_target",
          "Restore earlier guidance"
        );

    assert.equal(
      valid.ok,
      true
    );

    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          valid.request
        )
      ),
      {
        expected_current_release_id:
          "rel_current",
        target_release_id:
          "rel_target",
        change_summary:
          "Restore earlier guidance"
      }
    );

    assert.equal(
      publication
        .buildRollback(
          null,
          "rel_target",
          "Restore earlier guidance"
        ).ok,
      false
    );

    assert.equal(
      publication
        .buildRollback(
          "rel_current",
          "",
          "Restore earlier guidance"
        ).ok,
      false
    );

    assert.equal(
      publication
        .buildRollback(
          "rel_current",
          "rel_target",
          "x"
        ).ok,
      false
    );
  }
);

test(
  "publication model contains no network persistence or student project path",
  () => {
    const source =
      readFileSync(
        "assets/admin-content-publication.js",
        "utf8"
      );

    assert.doesNotMatch(
      source,
      /\bfetch\s*\(/
    );

    assert.doesNotMatch(
      source,
      /sessionStorage/
    );

    assert.doesNotMatch(
      source,
      /localStorage/
    );

    assert.doesNotMatch(
      source,
      /indexedDB/i
    );

    assert.doesNotMatch(
      source,
      /project/i
    );
  }
);
