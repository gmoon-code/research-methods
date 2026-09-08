window.RMS_LOCAL_CHAT_CONFIG = Object.freeze({
  release: "v2.15",
  storageKey: "rms_research_chat_v215",
  projectStorageKey: "research_methods_studio_v1",

  model: Object.freeze({
    displayName: "SmolLM2 360M Instruct",
    id: "smollm2-360m-instruct",
    sourceRepository: "onnx-community/SmolLM2-360M-Instruct-ONNX",
    sourceRevision: "fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9",
    dtype: "q4",
    expectedModelBytes: 386495938,
    expectedFirstDownloadMB: 400,
    modelSha256: "77b81bc8d2cb60c23a3399acba67dfa241d073764a4d1bdcce479747fb794aa6"
  }),

  runtime: Object.freeze({
    transformersVersion: "4.2.0",
    preferWebGPU: true,
    allowWasmFallback: true,
    maxNewTokens: 140,
    maxHistoryTurns: 6,
    maxPromptCharacters: 12000
  }),

  minimums: Object.freeze({
    warnDeviceMemoryGB: 8,
    recommendedFreeStorageMB: 650
  })
});
