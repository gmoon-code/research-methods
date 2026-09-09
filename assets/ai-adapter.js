/* v2.14 compatibility shim.
   The legacy arbitrary-endpoint AI Coach is intentionally disabled.
   Student-facing model access now goes only through Research Chat and /api/research-chat. */
window.RMSAI = (() => {
  function getConfig() {
    return { enabled: false, endpoint: '' };
  }
  function setConfig() {
    try { localStorage.removeItem('rms_ai_backend_v1_2'); } catch {}
    return getConfig();
  }
  function enabled() {
    return false;
  }
  async function review() {
    throw new Error('Use Chat for secure class research support.');
  }
  return { getConfig, setConfig, enabled, review };
})();
