const COORDINATOR_NAME =
  "global-content-release";

const INTERNAL_ORIGIN =
  "https://rms-content.internal";

function bindingConfigured(
  binding
) {
  return Boolean(
    binding &&
    (
      typeof binding
        .getByName ===
        "function" ||
      (
        typeof binding
          .idFromName ===
          "function" &&
        typeof binding.get ===
          "function"
      )
    )
  );
}

function coordinatorStub(
  binding
) {
  if (
    !bindingConfigured(
      binding
    )
  ) {
    return null;
  }

  if (
    typeof binding
      .getByName ===
      "function"
  ) {
    return binding
      .getByName(
        COORDINATOR_NAME
      );
  }

  const id =
    binding.idFromName(
      COORDINATOR_NAME
    );

  return binding.get(id);
}

async function requestJson(
  stub,
  path,
  {
    method = "GET",
    body
  } = {}
) {
  const headers =
    new Headers({
      Accept:
        "application/json"
    });

  if (body !== undefined) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response =
    await stub.fetch(
      new Request(
        INTERNAL_ORIGIN +
        path,
        {
          method,
          headers,
          body:
            body === undefined
              ? undefined
              : JSON.stringify(
                  body
                )
        }
      )
    );

  const value =
    await response
      .json()
      .catch(
        () => null
      );

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    throw new Error(
      "Content coordinator returned an invalid response."
    );
  }

  return {
    status:
      response.status,
    value
  };
}

function createContentCoordinatorClient(
  binding
) {
  const stub =
    coordinatorStub(
      binding
    );

  if (!stub) {
    return null;
  }

  return Object.freeze({
    async publicState() {
      return requestJson(
        stub,
        "/public"
      );
    },

    async adminState() {
      return requestJson(
        stub,
        "/state"
      );
    },

    async revisions() {
      return requestJson(
        stub,
        "/revisions"
      );
    },

    async publish(
      candidate
    ) {
      return requestJson(
        stub,
        "/publish",
        {
          method: "POST",
          body: candidate
        }
      );
    },

    async rollback(
      input
    ) {
      return requestJson(
        stub,
        "/rollback",
        {
          method: "POST",
          body: input
        }
      );
    }
  });
}

export {
  COORDINATOR_NAME,
  INTERNAL_ORIGIN,
  bindingConfigured,
  coordinatorStub,
  createContentCoordinatorClient,
  requestJson
};
