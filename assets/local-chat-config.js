window.RMS_LOCAL_CHAT_CONFIG = Object.freeze({
  release: "v2.15",
  storageKey: "rms_research_chat_v215",
  projectStorageKey: "research_methods_studio_v1",

  model: Object.freeze({
    displayName: "SmolLM2 135M Instruct",
    id: "smollm2-135m-instruct",
    sourceRepository: "onnx-community/SmolLM2-135M-Instruct-ONNX",
    sourceRevision: "b8a5c0f183b78c55955a5364f610c36668b5e681",
    dtype: "q4",
    expectedModelBytes: 181000000,
    expectedFirstDownloadMB: 190,
    modelSha256: "eb0d67c7e3b7d40f42d681b5f2eff4cef78968afe3f76c954f987dd870327a2a"
  }),

  runtime: Object.freeze({
    transformersVersion: "4.2.0",
    preferWebGPU: true,
    allowWasmFallback: true,
    maxNewTokens: 160,
    maxHistoryTurns: 6,
    maxPromptCharacters: 12000
  }),

  minimums: Object.freeze({
    warnDeviceMemoryGB: 4,
    recommendedFreeStorageMB: 350
  })
});
