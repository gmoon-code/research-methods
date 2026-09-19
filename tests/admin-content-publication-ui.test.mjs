import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source =
  readFileSync(
    "assets/admin-content-publication-ui.js",
    "utf8"
  );

test(
  "publication controller uses the isolated service abstraction for every remote operation",
  () => {
    for (
      const required
      of [
        ".state()",
        ".publicRelease()",
        ".revisions()",
        ".publish(",
        ".rollback(",
        ".login(",
        ".verify()"
      ]
    ) {
      assert.equal(
        source.includes(
          required
        ),
        true,
        required
      );
    }

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
  }
);

test(
  "publication controller synchronizes Content Studio to the current server release",
  () => {
    assert.match(
      source,
      /hydrateRelease\([\s\S]*publicResult\.release[\s\S]*registry\(\)/
    );

    assert.match(
      source,
      /editor\.replaceBaseline\([\s\S]*hydrated\.records[\s\S]*"current isolated publication"/
    );

    assert.match(
      source,
      /editor\.hasDirtyDrafts\(\)/
    );

    assert.match(
      source,
      /forceRebase/
    );

    assert.match(
      source,
      /registry\(\)\?\.records/
    );

    assert.match(
      source,
      /editor\.replaceBaseline\([\s\S]*bundledRecords[\s\S]*"bundled seed"/
    );
  }
);

test(
  "publication controller publishes the complete editor snapshot with optimistic current state",
  () => {
    assert.match(
      source,
      /model\.buildCandidate\([\s\S]*editor\.snapshotRecords\(\)[\s\S]*currentReleaseId\(\)[\s\S]*changeSummary\(\)/
    );

    assert.match(
      source,
      /Publish the complete 18-stage guidance release/
    );

    assert.match(
      source,
      /public student site does not consume this backend yet/
    );
  }
);

test(
  "publication conflict locks further publishing until synchronization",
  () => {
    const conflicts =
      source.match(
        /response\.status\s*===\s*409[\s\S]{0,100}baselineSynced\s*=\s*false/g
      ) || [];

    assert.equal(
      conflicts.length,
      2
    );

    assert.match(
      source,
      /!baselineSynced/
    );

    assert.match(
      source,
      /Refresh current release|refresh/i
    );
  }
);

test(
  "rollback uses a new release request and rebases after success",
  () => {
    assert.match(
      source,
      /model\.buildRollback\([\s\S]*currentReleaseId\(\)[\s\S]*targetReleaseId[\s\S]*changeSummary\(\)/
    );

    assert.match(
      source,
      /await api\.rollback\([\s\S]*result\.request/
    );

    assert.match(
      source,
      /loadRemote\(\{[\s\S]*forceRebase:\s*true/
    );

    const synchronizedReads =
      source.match(
        /const synchronized\s*=\s*await loadRemote\(\{/g
      ) || [];

    assert.equal(
      synchronizedReads.length,
      2
    );
  }
);

test(
  "publication controller renders remote metadata as inert text",
  () => {
    assert.match(
      source,
      /textContent/
    );

    assert.match(
      source,
      /replaceChildren\(\)/
    );

    assert.doesNotMatch(
      source,
      /\.innerHTML\s*=/
    );

    assert.doesNotMatch(
      source,
      /insertAdjacentHTML/
    );

    assert.doesNotMatch(
      source,
      /document\.write/
    );
  }
);

test(
  "publication controller introduces no persistent research or student-project path",
  () => {
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
      /sendBeacon/
    );

    assert.doesNotMatch(
      source,
      /studentPacket/i
    );

    assert.doesNotMatch(
      source,
      /research_methods_studio_v1/
    );
  }
);
