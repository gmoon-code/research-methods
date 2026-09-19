const CONTENT_BINDING =
  "RMS_CONTENT_STORE";

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function validNamespaceId(value) {
  return /^[a-f0-9]{32}$/i
    .test(
      String(value || "")
        .trim()
    );
}

function parseNamespaceListOutput(
  text
) {
  const source =
    String(text || "");

  const start =
    source.indexOf("[");

  const end =
    source.lastIndexOf("]");

  if (
    start < 0 ||
    end <= start
  ) {
    throw new Error(
      "Wrangler KV namespace list did not return a JSON array."
    );
  }

  const parsed =
    JSON.parse(
      source.slice(
        start,
        end + 1
      )
    );

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Wrangler KV namespace list was not an array."
    );
  }

  return parsed
    .filter(
      item =>
        item &&
        typeof item === "object" &&
        validNamespaceId(
          item.id
        ) &&
        typeof item.title ===
          "string"
    )
    .map(
      item => ({
        id:
          String(item.id)
            .trim(),
        title:
          String(item.title)
            .trim()
      })
    );
}

function expectedNamespaceTitles(
  workerName,
  binding =
    CONTENT_BINDING
) {
  const worker =
    String(workerName || "")
      .trim();

  const name =
    String(binding || "")
      .trim();

  if (!worker || !name) {
    throw new Error(
      "Worker name and content binding are required."
    );
  }

  return [
    name,
    `${worker}-${name}`
  ];
}

function chooseExistingNamespace(
  namespaces,
  workerName,
  binding =
    CONTENT_BINDING
) {
  const accepted =
    new Set(
      expectedNamespaceTitles(
        workerName,
        binding
      )
    );

  const matches =
    (Array.isArray(namespaces)
      ? namespaces
      : [])
      .filter(
        item =>
          accepted.has(
            String(
              item?.title || ""
            ).trim()
          ) &&
          validNamespaceId(
            item?.id
          )
      );

  const unique =
    new Map();

  for (const item of matches) {
    unique.set(
      item.id,
      {
        id:
          String(item.id)
            .trim(),
        title:
          String(item.title)
            .trim()
      }
    );
  }

  if (unique.size > 1) {
    throw new Error(
      "Multiple matching content KV namespaces exist. Resolve the duplicate namespaces before deployment."
    );
  }

  return unique.size === 1
    ? [...unique.values()][0]
    : null;
}

function contentBindingId(
  config,
  binding =
    CONTENT_BINDING
) {
  const matches =
    (
      Array.isArray(
        config?.kv_namespaces
      )
        ? config.kv_namespaces
        : []
    )
      .filter(
        item =>
          item?.binding ===
          binding
      );

  if (matches.length === 0) {
    return "";
  }

  if (matches.length > 1) {
    throw new Error(
      "Content KV binding is declared more than once."
    );
  }

  const id =
    String(
      matches[0]?.id || ""
    ).trim();

  if (!validNamespaceId(id)) {
    throw new Error(
      "Content KV binding has an invalid namespace ID."
    );
  }

  return id;
}

function withContentBinding(
  config,
  namespaceId,
  binding =
    CONTENT_BINDING
) {
  const id =
    String(namespaceId || "")
      .trim();

  if (!validNamespaceId(id)) {
    throw new Error(
      "A valid Cloudflare KV namespace ID is required."
    );
  }

  const next =
    clone(config || {});

  const current =
    Array.isArray(
      next.kv_namespaces
    )
      ? next.kv_namespaces
      : [];

  const others =
    current.filter(
      item =>
        item?.binding !==
        binding
    );

  next.kv_namespaces = [
    ...others,
    {
      binding,
      id
    }
  ];

  return next;
}

function baseConfigIsAccountNeutral(
  config,
  binding =
    CONTENT_BINDING
) {
  const declarations =
    Array.isArray(
      config?.kv_namespaces
    )
      ? config.kv_namespaces
      : [];

  return !declarations.some(
    item =>
      item?.binding ===
      binding
  );
}

export {
  CONTENT_BINDING,
  baseConfigIsAccountNeutral,
  chooseExistingNamespace,
  contentBindingId,
  expectedNamespaceTitles,
  parseNamespaceListOutput,
  validNamespaceId,
  withContentBinding
};
