window.RMSAdminContentPublication = (() => {
  "use strict";

  const SCHEMA_VERSION =
    "1.0";

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function deepFreeze(value) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.freeze(value);

    for (
      const key
      of Object.keys(value)
    ) {
      deepFreeze(
        value[key]
      );
    }

    return value;
  }

  function safeReleaseId(
    value
  ) {
    if (
      value === null ||
      value === ""
    ) {
      return null;
    }

    const text =
      String(value || "")
        .trim();

    return /^[A-Za-z0-9_.:-]{1,160}$/
      .test(text)
        ? text
        : "";
  }

  function safeSummary(
    value
  ) {
    const text =
      String(value || "")
        .trim();

    return (
      text.length >= 3 &&
      text.length <= 500
    )
      ? text
      : "";
  }

  function studioApi() {
    return window
      .RMSAdminContentStudio;
  }

  function hydrateRelease(
    release,
    registry
  ) {
    const api =
      studioApi();

    if (
      !api ||
      !release ||
      typeof release !==
        "object" ||
      !Array.isArray(
        release.records
      ) ||
      release.records.length !==
        18
    ) {
      return deepFreeze({
        ok: false,
        errors: [
          "Published release is incomplete."
        ],
        records: []
      });
    }

    const releaseId =
      safeReleaseId(
        release.release_id
      );

    if (!releaseId) {
      return deepFreeze({
        ok: false,
        errors: [
          "Published release identifier is invalid."
        ],
        records: []
      });
    }

    const seedRecords =
      api.listRecords(
        registry
      );

    if (
      seedRecords.length !==
      18
    ) {
      return deepFreeze({
        ok: false,
        errors: [
          "Bundled content registry is incomplete."
        ],
        records: []
      });
    }

    const seedById =
      new Map(
        seedRecords.map(
          record => [
            record.stage_id,
            record
          ]
        )
      );

    const hydrated = [];
    const seen =
      new Set();
    const errors = [];

    for (
      const source
      of release.records
    ) {
      const seed =
        seedById.get(
          source?.stage_id
        );

      if (
        !seed ||
        seen.has(
          source.stage_id
        )
      ) {
        errors.push(
          "Published release contains an unknown or duplicate stage."
        );
        continue;
      }

      const record = {
        key:
          source.key,
        type:
          source.type,
        location:
          seed.location,
        phase:
          source.phase,
        phase_label:
          seed.phase_label,
        stage_id:
          source.stage_id,
        revision:
          releaseId,
        published: true,
        value:
          clone(
            source.value
          )
      };

      const validation =
        api.validateRecord(
          record
        );

      if (!validation.ok) {
        errors.push(
          ...validation.errors
        );
        continue;
      }

      seen.add(
        record.stage_id
      );

      hydrated.push(
        record
      );
    }

    hydrated.sort(
      (a, b) =>
        a.stage_id -
        b.stage_id
    );

    if (
      errors.length > 0 ||
      hydrated.length !== 18
    ) {
      return deepFreeze({
        ok: false,
        errors:
          errors.length
            ? errors
            : [
                "Published release does not contain all 18 stages."
              ],
        records: []
      });
    }

    return deepFreeze({
      ok: true,
      errors: [],
      records:
        hydrated
    });
  }

  function buildCandidate(
    records,
    expectedReleaseId,
    summary
  ) {
    const api =
      studioApi();

    const expected =
      safeReleaseId(
        expectedReleaseId
      );

    const changeSummary =
      safeSummary(
        summary
      );

    const errors = [];

    if (
      expectedReleaseId !==
        null &&
      expectedReleaseId !==
        "" &&
      expected === ""
    ) {
      errors.push(
        "Current release identifier is invalid."
      );
    }

    if (!changeSummary) {
      errors.push(
        "Change summary must contain 3 to 500 characters."
      );
    }

    if (
      !api ||
      !Array.isArray(records) ||
      records.length !== 18
    ) {
      errors.push(
        "Publication requires exactly 18 stage records."
      );
    }

    const accepted = [];
    const seen =
      new Set();

    for (
      const record
      of Array.isArray(records)
        ? records
        : []
    ) {
      const validation =
        api?.validateRecord(
          record
        ) || {
          ok: false,
          errors: [
            "Content Studio validator is unavailable."
          ]
        };

      if (!validation.ok) {
        errors.push(
          ...validation.errors
        );
        continue;
      }

      if (
        seen.has(
          record.stage_id
        )
      ) {
        errors.push(
          `Duplicate Stage ${record.stage_id} record.`
        );
        continue;
      }

      seen.add(
        record.stage_id
      );

      accepted.push({
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
      });
    }

    accepted.sort(
      (a, b) =>
        a.stage_id -
        b.stage_id
    );

    if (
      errors.length > 0 ||
      accepted.length !==
        18
    ) {
      return deepFreeze({
        ok: false,
        errors:
          errors.length
            ? errors
            : [
                "Publication requires all 18 valid stage records."
              ],
        candidate: null
      });
    }

    return deepFreeze({
      ok: true,
      errors: [],
      candidate: {
        schema_version:
          SCHEMA_VERSION,
        expected_current_release_id:
          expected,
        change_summary:
          changeSummary,
        records:
          accepted
      }
    });
  }

  function buildRollback(
    currentReleaseId,
    targetReleaseId,
    summary
  ) {
    const current =
      safeReleaseId(
        currentReleaseId
      );

    const target =
      safeReleaseId(
        targetReleaseId
      );

    const changeSummary =
      safeSummary(
        summary
      );

    const errors = [];

    if (!current) {
      errors.push(
        "Current release identifier is required."
      );
    }

    if (!target) {
      errors.push(
        "Rollback target identifier is required."
      );
    }

    if (!changeSummary) {
      errors.push(
        "Rollback summary must contain 3 to 500 characters."
      );
    }

    return deepFreeze({
      ok:
        errors.length === 0,
      errors,
      request:
        errors.length === 0
          ? {
              expected_current_release_id:
                current,
              target_release_id:
                target,
              change_summary:
                changeSummary
            }
          : null
    });
  }

  return Object.freeze({
    SCHEMA_VERSION,
    hydrateRelease,
    buildCandidate,
    buildRollback
  });
})();