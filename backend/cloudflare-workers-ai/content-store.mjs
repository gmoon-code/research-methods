const CURRENT_KEY =
  "content:current";

const REVISION_PREFIX =
  "content:revision:";

const HISTORY_PREFIX =
  "content:history:";

const HISTORY_LIMIT = 50;

function bindingConfigured(binding) {
  return Boolean(
    binding &&
    typeof binding.get === "function" &&
    typeof binding.put === "function" &&
    typeof binding.list === "function"
  );
}

function parseJson(text) {
  if (
    typeof text !== "string" ||
    !text.trim()
  ) {
    return null;
  }

  return JSON.parse(text);
}

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

  if (!Number.isFinite(timestamp)) {
    throw new Error(
      "Published timestamp is invalid."
    );
  }

  const reverseTime =
    String(
      9999999999999 -
      timestamp
    ).padStart(13, "0");

  return (
    HISTORY_PREFIX +
    reverseTime +
    ":" +
    String(
      release.release_id
    )
  );
}

function createContentStore(binding) {
  if (!bindingConfigured(binding)) {
    return null;
  }

  async function readCurrent() {
    const text =
      await binding.get(
        CURRENT_KEY
      );

    return parseJson(text);
  }

  async function writeCurrent(
    release
  ) {
    await binding.put(
      CURRENT_KEY,
      JSON.stringify(release)
    );
  }

  async function readRevision(
    releaseId
  ) {
    const text =
      await binding.get(
        revisionKey(releaseId)
      );

    return parseJson(text);
  }

  async function writeRevision(
    release,
    metadata
  ) {
    const key =
      revisionKey(
        release.release_id
      );

    const existing =
      await binding.get(key);

    if (existing !== null) {
      const error =
        new Error(
          "Revision already exists."
        );

      error.code =
        "REVISION_EXISTS";

      throw error;
    }

    await binding.put(
      key,
      JSON.stringify(release)
    );

    await binding.put(
      historyKey(release),
      JSON.stringify(metadata)
    );
  }

  async function listRevisionMetadata() {
    const listing =
      await binding.list({
        prefix:
          HISTORY_PREFIX,
        limit:
          HISTORY_LIMIT
      });

    const keys =
      Array.isArray(
        listing?.keys
      )
        ? listing.keys
        : [];

    const values =
      await Promise.all(
        keys.map(
          async item => {
            try {
              const text =
                await binding.get(
                  item.name
                );

              return parseJson(
                text
              );
            } catch {
              return null;
            }
          }
        )
      );

    return values
      .filter(Boolean)
      .sort(
        (a, b) =>
          String(
            b.published_at || ""
          ).localeCompare(
            String(
              a.published_at || ""
            )
          )
      )
      .slice(
        0,
        HISTORY_LIMIT
      );
  }

  return Object.freeze({
    readCurrent,
    writeCurrent,
    readRevision,
    writeRevision,
    listRevisionMetadata
  });
}

export {
  CURRENT_KEY,
  HISTORY_LIMIT,
  HISTORY_PREFIX,
  REVISION_PREFIX,
  bindingConfigured,
  createContentStore,
  historyKey,
  revisionKey
};
