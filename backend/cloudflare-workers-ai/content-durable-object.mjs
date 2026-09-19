import {
  CONTENT_SCHEMA_VERSION,
  contentHashInput,
  validateCandidate
} from "./content-publication.mjs";

import {
  createContentCoordinator
} from "./content-coordinator-core.mjs";

const INTERNAL_ORIGIN =
  "https://rms-content.internal";

function json(
  body,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store",
        "X-Content-Type-Options":
          "nosniff"
      }
    }
  );
}

async function sha256Hex(text) {
  const bytes =
    new TextEncoder()
      .encode(
        String(text)
      );

  const digest =
    new Uint8Array(
      await crypto.subtle
        .digest(
          "SHA-256",
          bytes
        )
    );

  return [...digest]
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");
}

function serverMetadata(
  contentHash = null
) {
  return {
    releaseId:
      "rel_" +
      crypto.randomUUID(),
    nowIso:
      new Date()
        .toISOString(),
    ...(contentHash
      ? {
          contentHash
        }
      : {})
  };
}

async function readJson(
  request
) {
  try {
    return {
      ok: true,
      value:
        await request.json()
    };
  } catch {
    return {
      ok: false,
      value: null
    };
  }
}

class ContentReleaseCoordinator {
  constructor(
    state,
    env
  ) {
    this.state =
      state;

    this.env =
      env;

    this.coordinator =
      createContentCoordinator(
        state.storage
      );
  }

  async fetch(request) {
    const url =
      new URL(
        request.url
      );

    try {
      if (
        request.method ===
          "GET" &&
        url.pathname ===
          "/public"
      ) {
        return json(
          await this
            .coordinator
            .publicState()
        );
      }

      if (
        request.method ===
          "GET" &&
        url.pathname ===
          "/state"
      ) {
        return json(
          await this
            .coordinator
            .adminState()
        );
      }

      if (
        request.method ===
          "GET" &&
        url.pathname ===
          "/revisions"
      ) {
        return json({
          revisions:
            await this
              .coordinator
              .listRevisions()
        });
      }

      if (
        request.method ===
          "POST" &&
        url.pathname ===
          "/publish"
      ) {
        const body =
          await readJson(
            request
          );

        if (!body.ok) {
          return json(
            {
              ok: false,
              code:
                "CONTENT_INVALID",
              error:
                "Content draft is invalid."
            },
            400
          );
        }

        const validation =
          validateCandidate(
            body.value
          );

        if (!validation.ok) {
          return json(
            {
              ok: false,
              code:
                "CONTENT_INVALID",
              error:
                "Content draft is invalid.",
              details:
                validation.errors
                  .slice(0, 20)
            },
            400
          );
        }

        const hash =
          await sha256Hex(
            contentHashInput(
              validation
                .candidate
            )
          );

        const result =
          await this
            .coordinator
            .publish(
              validation
                .candidate,
              serverMetadata(
                hash
              )
            );

        const {
          status,
          ...bodyValue
        } = result;

        return json(
          bodyValue,
          status
        );
      }

      if (
        request.method ===
          "POST" &&
        url.pathname ===
          "/rollback"
      ) {
        const body =
          await readJson(
            request
          );

        if (!body.ok) {
          return json(
            {
              ok: false,
              code:
                "ROLLBACK_INVALID",
              error:
                "Rollback request is invalid."
            },
            400
          );
        }

        const result =
          await this
            .coordinator
            .rollback(
              body.value,
              serverMetadata()
            );

        const {
          status,
          ...bodyValue
        } = result;

        return json(
          bodyValue,
          status
        );
      }

      return json(
        {
          error:
            "Internal content operation not found.",
          schema_version:
            CONTENT_SCHEMA_VERSION
        },
        404
      );
    } catch {
      return json(
        {
          error:
            "Content coordinator is temporarily unavailable."
        },
        503
      );
    }
  }
}

export {
  ContentReleaseCoordinator,
  INTERNAL_ORIGIN,
  readJson,
  serverMetadata,
  sha256Hex
};
