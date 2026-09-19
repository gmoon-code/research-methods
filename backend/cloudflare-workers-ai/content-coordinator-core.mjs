import {
  checkExpectedCurrentRelease,
  createRelease,
  createRollbackRelease,
  publicReleaseProjection,
  revisionMetadata,
  validateCandidate,
  validateStoredRelease
} from "./content-publication.mjs";

const CURRENT_KEY =
  "content:current";

const REVISION_PREFIX =
  "content:revision:";

const HISTORY_PREFIX =
  "content:history:";

const HISTORY_LIMIT =
  50;

function revisionKey(releaseId) {
  return (
    REVISION_PREFIX +
    String(releaseId)
  );
}

function historyKey(release) {
  const timestamp =
    Date.parse(
      String(
        release.published_at
      )
    );

  if (
    !Number.isFinite(
      timestamp
    )
  ) {
    throw new Error(
      "Published timestamp is invalid."
    );
  }

  const reverseTime =
    String(
      9999999999999 -
      timestamp
    ).padStart(
      13,
      "0"
    );

  return (
    HISTORY_PREFIX +
    reverseTime +
    ":" +
    String(
      release.release_id
    )
  );
}

function safeRollbackInput(
  value
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const keys =
    Object.keys(value)
      .sort();

  const expectedKeys =
    [
      "change_summary",
      "expected_current_release_id",
      "target_release_id"
    ];

  if (
    keys.length !==
      expectedKeys.length ||
    !keys.every(
      (key, index) =>
        key ===
        expectedKeys[index]
    )
  ) {
    return null;
  }

  const expectedCurrent =
    String(
      value
        .expected_current_release_id ||
      ""
    ).trim();

  const target =
    String(
      value.target_release_id ||
      ""
    ).trim();

  const summary =
    String(
      value.change_summary ||
      ""
    ).trim();

  if (
    !/^[A-Za-z0-9_.:-]{1,160}$/
      .test(
        expectedCurrent
      ) ||
    !/^[A-Za-z0-9_.:-]{1,160}$/
      .test(target) ||
    summary.length < 3 ||
    summary.length > 500
  ) {
    return null;
  }

  return {
    expectedCurrent,
    target,
    summary
  };
}

function safeMetadata(
  value
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const id =
    String(
      value.release_id || ""
    ).trim();

  const version =
    String(
      value.content_version || ""
    ).trim();

  const publishedAt =
    String(
      value.published_at || ""
    ).trim();

  const hash =
    String(
      value.content_hash || ""
    )
      .trim()
      .toLowerCase();

  const summary =
    String(
      value.change_summary || ""
    ).trim();

  const parent =
    value.parent_release_id ===
      null
      ? null
      : String(
          value.parent_release_id ||
          ""
        ).trim();

  const rollbackSource =
    value
      .rollback_source_release_id ===
      null
      ? null
      : String(
          value
            .rollback_source_release_id ||
          ""
        ).trim();

  if (
    !/^[A-Za-z0-9_.:-]{1,160}$/
      .test(id) ||
    version !== id ||
    !Number.isFinite(
      Date.parse(
        publishedAt
      )
    ) ||
    !/^[a-f0-9]{64}$/
      .test(hash) ||
    summary.length < 3 ||
    summary.length > 500 ||
    (
      parent !== null &&
      !/^[A-Za-z0-9_.:-]{1,160}$/
        .test(parent)
    ) ||
    (
      rollbackSource !== null &&
      !/^[A-Za-z0-9_.:-]{1,160}$/
        .test(
          rollbackSource
        )
    )
  ) {
    return null;
  }

  return {
    release_id: id,
    content_version:
      version,
    published_at:
      new Date(
        publishedAt
      ).toISOString(),
    parent_release_id:
      parent,
    rollback_source_release_id:
      rollbackSource,
    content_hash:
      hash,
    change_summary:
      summary
  };
}

function storageAvailable(
  storage
) {
  return Boolean(
    storage &&
    typeof storage.get ===
      "function" &&
    typeof storage.put ===
      "function" &&
    typeof storage.list ===
      "function" &&
    typeof storage.transaction ===
      "function"
  );
}

function createContentCoordinator(
  storage
) {
  if (
    !storageAvailable(
      storage
    )
  ) {
    throw new Error(
      "Strongly consistent content storage is unavailable."
    );
  }

  async function readCurrent() {
    const current =
      await storage.get(
        CURRENT_KEY
      );

    return current ??
      null;
  }

  async function publicState() {
    const current =
      await readCurrent();

    if (!current) {
      return {
        published: false
      };
    }

    if (
      !validateStoredRelease(
        current
      ).ok
    ) {
      throw new Error(
        "Stored current release is invalid."
      );
    }

    return {
      published: true,
      release:
        publicReleaseProjection(
          current
        )
    };
  }

  async function adminState() {
    const current =
      await readCurrent();

    if (!current) {
      return {
        configured: true,
        published: false,
        current: null
      };
    }

    if (
      !validateStoredRelease(
        current
      ).ok
    ) {
      throw new Error(
        "Stored current release is invalid."
      );
    }

    return {
      configured: true,
      published: true,
      current:
        revisionMetadata(
          current
        )
    };
  }

  async function listRevisions() {
    const entries =
      await storage.list({
        prefix:
          HISTORY_PREFIX
      });

    const values =
      entries instanceof Map
        ? [...entries.values()]
        : [];

    return values
      .map(
        safeMetadata
      )
      .filter(Boolean)
      .sort(
        (left, right) =>
          String(
            right.published_at
          ).localeCompare(
            String(
              left.published_at
            )
          )
      )
      .slice(
        0,
        HISTORY_LIMIT
      );
  }

  async function publish(
    candidate,
    server
  ) {
    const validation =
      validateCandidate(
        candidate
      );

    if (!validation.ok) {
      return {
        ok: false,
        status: 400,
        code:
          "CONTENT_INVALID",
        error:
          "Content draft is invalid.",
        details:
          validation.errors
            .slice(0, 20)
      };
    }

    return await storage
      .transaction(
        async transaction => {
          const current =
            (
              await transaction.get(
                CURRENT_KEY
              )
            ) ??
            null;

          if (
            current &&
            !validateStoredRelease(
              current
            ).ok
          ) {
            return {
              ok: false,
              status: 503,
              code:
                "CONTENT_STORAGE_INVALID",
              error:
                "Content service is temporarily unavailable."
            };
          }

          const conflict =
            checkExpectedCurrentRelease(
              validation
                .candidate
                .expected_current_release_id,
              current
            );

          if (!conflict.ok) {
            return {
              ok: false,
              status: 409,
              code:
                "CONTENT_CONFLICT",
              error:
                "Published content changed after this Admin draft was loaded.",
              expected_release_id:
                conflict.expected,
              current_release_id:
                conflict.actual
            };
          }

          const release =
            createRelease({
              candidate:
                validation.candidate,
              releaseId:
                server.releaseId,
              nowIso:
                server.nowIso,
              contentHash:
                server.contentHash,
              parentReleaseId:
                current
                  ?.release_id ||
                null
            });

          const revision =
            revisionKey(
              release.release_id
            );

          const existing =
            await transaction.get(
              revision
            );

          if (
            existing !== undefined &&
            existing !== null
          ) {
            return {
              ok: false,
              status: 409,
              code:
                "REVISION_EXISTS",
              error:
                "Content release identifier collision. Try publishing again."
            };
          }

          await transaction.put(
            revision,
            release
          );

          await transaction.put(
            historyKey(
              release
            ),
            revisionMetadata(
              release
            )
          );

          await transaction.put(
            CURRENT_KEY,
            release
          );

          return {
            ok: true,
            status: 201,
            current:
              revisionMetadata(
                release
              )
          };
        }
      );
  }

  async function rollback(
    input,
    server
  ) {
    const rollbackInput =
      safeRollbackInput(
        input
      );

    if (!rollbackInput) {
      return {
        ok: false,
        status: 400,
        code:
          "ROLLBACK_INVALID",
        error:
          "Rollback request is invalid."
      };
    }

    return await storage
      .transaction(
        async transaction => {
          const current =
            (
              await transaction.get(
                CURRENT_KEY
              )
            ) ??
            null;

          if (
            !current ||
            !validateStoredRelease(
              current
            ).ok
          ) {
            return {
              ok: false,
              status: 503,
              code:
                "CONTENT_STORAGE_INVALID",
              error:
                "Content service is temporarily unavailable."
            };
          }

          const conflict =
            checkExpectedCurrentRelease(
              rollbackInput
                .expectedCurrent,
              current
            );

          if (!conflict.ok) {
            return {
              ok: false,
              status: 409,
              code:
                "CONTENT_CONFLICT",
              error:
                "Published content changed after this Admin draft was loaded.",
              expected_release_id:
                conflict.expected,
              current_release_id:
                conflict.actual
            };
          }

          const target =
            await transaction.get(
              revisionKey(
                rollbackInput
                  .target
              )
            );

          if (!target) {
            return {
              ok: false,
              status: 404,
              code:
                "REVISION_NOT_FOUND",
              error:
                "Requested content revision was not found."
            };
          }

          if (
            !validateStoredRelease(
              target
            ).ok
          ) {
            return {
              ok: false,
              status: 503,
              code:
                "CONTENT_STORAGE_INVALID",
              error:
                "Content service is temporarily unavailable."
            };
          }

          const release =
            createRollbackRelease({
              currentRelease:
                current,
              targetRelease:
                target,
              releaseId:
                server.releaseId,
              nowIso:
                server.nowIso,
              contentHash:
                target
                  .content_hash,
              changeSummary:
                rollbackInput
                  .summary
            });

          const revision =
            revisionKey(
              release.release_id
            );

          const existing =
            await transaction.get(
              revision
            );

          if (
            existing !== undefined &&
            existing !== null
          ) {
            return {
              ok: false,
              status: 409,
              code:
                "REVISION_EXISTS",
              error:
                "Content release identifier collision. Try rollback again."
            };
          }

          await transaction.put(
            revision,
            release
          );

          await transaction.put(
            historyKey(
              release
            ),
            revisionMetadata(
              release
            )
          );

          await transaction.put(
            CURRENT_KEY,
            release
          );

          return {
            ok: true,
            status: 201,
            current:
              revisionMetadata(
                release
              )
          };
        }
      );
  }

  return Object.freeze({
    adminState,
    listRevisions,
    publicState,
    publish,
    readCurrent,
    rollback
  });
}

export {
  CURRENT_KEY,
  HISTORY_LIMIT,
  HISTORY_PREFIX,
  REVISION_PREFIX,
  createContentCoordinator,
  historyKey,
  revisionKey,
  safeMetadata,
  safeRollbackInput,
  storageAvailable
};
