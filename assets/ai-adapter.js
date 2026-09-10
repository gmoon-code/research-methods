(() => {
  'use strict';

  const CODE_KEY = 'rms_research_chat_code_v215';
  const LEGACY_CODE_KEYS = ['rms_research_chat_code_v214', 'rms_chat_access_v2_14'];
  const SESSION_KEY = 'rms_research_chat_session_v215';
  const ENABLED_KEY = 'rms_research_chat_enabled_v215';
  const RETIRED_ENDPOINT_KEYS = ['rms_chat_backend_v2_14', 'rms_ai_backend_v1_2'];
  const MAX_HISTORY = 8;
  const MAX_ACCESS_CODE_LENGTH = 256;
  const MAX_STAGE_ID = 18;
  const SAFE_PROJECT_KEYS = new Set([
    'research_path','broad_topic','topic_choice','research_question','purpose','design',
    'predictor_or_iv','outcome_or_dv','hypothesis','sample','measurement','ethics',
    'analysis_choice','title'
  ]);
  const SENSITIVE_KEY = /(raw|dataset|data[_ -]?table|participant|respondent|student[_ -]?name|full[_ -]?name|email|phone|student[_ -]?id|identifier|address|birth|dob)/i;
  let volatileAccessCode = '';
  let volatileSession = '';
  let healthCache = { at: 0, endpoint: '', hasCode: false, value: null };

  class ChatError extends Error {
    constructor(message, code = 'chat_error', status = 0) {
      super(message);
      this.name = 'ChatError';
      this.code = code;
      this.status = status;
    }
  }

  function runtimeConfig() {
    return window.RMS_RUNTIME_CONFIG || {};
  }

  function sameOriginEndpoint() {
    // v2.15.0 FREE deliberately has no same-origin paid-provider fallback.
    // The owner must configure the deployed Cloudflare Worker HTTPS URL.
    return '';
  }

  function validEndpoint(value) {
    const raw = String(value || '').trim();
    if (!raw) return false;
    try {
      const absolute = /^[A-Za-z][A-Za-z0-9+.-]*:/.test(raw);
      if (!absolute) return false;
      const url = new URL(raw);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      const productionFreeWorker = url.protocol === 'https:' && url.hostname.endsWith('.workers.dev') && url.pathname === '/';
      const localDev = url.protocol === 'http:' && local;
      const clean = !url.username && !url.password && !url.search && !url.hash;
      return clean && (productionFreeWorker || localDev);
    } catch {
      return false;
    }
  }

  function endpoint() {
    const configured = String(runtimeConfig().researchChatEndpoint || runtimeConfig().chatEndpoint || '').trim();
    if (configured) return validEndpoint(configured) ? configured : '';
    return ''; // No fallback. GitHub Pages uses the owner-configured Cloudflare Worker URL.
  }

  function retireLegacyEndpointStorage() {
    try {
      for (const key of RETIRED_ENDPOINT_KEYS) localStorage.removeItem(key);
    } catch {}
  }

  function getAccessCode() {
    try {
      let value = String(sessionStorage.getItem(CODE_KEY) || '').trim();
      if (!value) {
        for (const legacyKey of LEGACY_CODE_KEYS) {
          const legacy = String(sessionStorage.getItem(legacyKey) || '').trim();
          if (legacy.length >= 16 && legacy.length <= MAX_ACCESS_CODE_LENGTH) {
            value = legacy;
            sessionStorage.setItem(CODE_KEY, legacy);
            break;
          }
        }
      }
      if (value) volatileAccessCode = value;
      return value || volatileAccessCode;
    } catch {
      return volatileAccessCode;
    }
  }

  function setAccessCode(value) {
    const code = String(value || '').trim();
    if (code && code.length < 16) throw new ChatError('The class Chat code must be at least 16 characters.', 'access_code_too_short');
    if (code.length > MAX_ACCESS_CODE_LENGTH) throw new ChatError('The class Chat code is unexpectedly long. Check the code and try again.', 'access_code_too_long');
    volatileAccessCode = code;
    try {
      if (code) sessionStorage.setItem(CODE_KEY, code);
      else sessionStorage.removeItem(CODE_KEY);
      for (const legacyKey of LEGACY_CODE_KEYS) sessionStorage.removeItem(legacyKey);
    } catch {}
    healthCache = { at: 0, endpoint: '', hasCode: false, value: null };
    return code;
  }

  function clearAccessCode() {
    return setAccessCode('');
  }

  function sessionId() {
    try {
      let id = String(sessionStorage.getItem(SESSION_KEY) || '');
      if (!/^[A-Za-z0-9_-]{8,128}$/.test(id)) {
        if (globalThis.crypto?.randomUUID) id = globalThis.crypto.randomUUID().replace(/-/g, '');
        else if (globalThis.crypto?.getRandomValues) {
          const bytes = new Uint8Array(18);
          globalThis.crypto.getRandomValues(bytes);
          id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        } else {
          id = `ephemeral${Date.now()}${Math.random().toString(36).slice(2, 18)}`;
        }
        sessionStorage.setItem(SESSION_KEY, id);
      }
      volatileSession = id;
      return id;
    } catch {
      if (!volatileSession) volatileSession = `ephemeral${Date.now()}${Math.random().toString(36).slice(2, 18)}`;
      return volatileSession;
    }
  }

  function preferenceEnabled() {
    try { return sessionStorage.getItem(ENABLED_KEY) !== '0'; } catch { return true; }
  }

  function getConfig() {
    const ep = endpoint();
    const isEnabled = Boolean(ep) && preferenceEnabled();
    return {
      enabled: isEnabled,
      endpoint: ep,
      chatEndpoint: ep,
      version: String(runtimeConfig().version || '2.15.0'),
      accessCodeSet: Boolean(getAccessCode())
    };
  }

  // Compatibility with the old AI-settings API. Endpoint mutation is deliberately ignored.
  // Only the owner-controlled runtime-config.js can choose the production server.
  function setConfig(config = {}) {
    if (typeof config.enabled === 'boolean') {
      try { sessionStorage.setItem(ENABLED_KEY, config.enabled ? '1' : '0'); } catch {}
    }
    if (typeof config.accessCode === 'string') setAccessCode(config.accessCode);
    return getConfig();
  }

  function enabled() { return getConfig().enabled; }
  function effectiveChatEndpoint() { return endpoint(); }
  function chatConfigured() { return Boolean(endpoint() && preferenceEnabled()); }
  function chatEnabled() { return chatConfigured(); }
  function reviewEnabled() { return chatConfigured(); }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 30_000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store', credentials: 'omit' });
    } catch (error) {
      if (error?.name === 'AbortError') throw new ChatError('Research Chat took too long to respond. Try again.', 'timeout');
      throw new ChatError('Research Chat could not reach the class server. Check your internet connection and try again.', 'network_error');
    } finally {
      clearTimeout(timer);
    }
  }

  function authHeaders(extra = {}) {
    const code = getAccessCode();
    if (!code) throw new ChatError('Research Chat needs the class code before it can send this request.', 'access_code_required', 401);
    return {
      ...extra,
      'X-RMS-Chat-Code': code,
      'X-RMS-Client-Session': sessionId()
    };
  }

  async function parseResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = response.status === 401 ? 'invalid_access_code' : response.status === 429 ? 'rate_limited' : 'request_failed';
      const message = String(data.error || (response.status === 401
        ? 'The class Research Chat code was not accepted.'
        : response.status === 429
          ? 'Research Chat is receiving too many requests. Wait a moment and try again.'
          : 'Research Chat is unavailable.'));
      throw new ChatError(message, code, response.status);
    }
    return data;
  }

  function promptForClassCode(message) {
    if (typeof window.RMSResearchChatUI?.requestAccessCode === 'function') {
      return window.RMSResearchChatUI.requestAccessCode(message);
    }
    if (typeof window.prompt !== 'function') return '';
    const value = window.prompt(message || 'Enter the class Research Chat code provided by your teacher. This is a class access code, not an AI-provider credential.');
    if (value == null) return '';
    try { return setAccessCode(value); } catch { return ''; }
  }

  async function health({ force = false, interactive = false } = {}) {
    const ep = endpoint();
    if (!ep || !preferenceEnabled()) {
      return {
        ok: false,
        state: 'endpoint_missing',
        configured: false,
        requires_access_code: false,
        message: 'Research Chat has not been connected to the class server yet.'
      };
    }
    const hasCode = Boolean(getAccessCode());
    const ttl = Math.max(5000, Number(runtimeConfig().chatHealthCacheMs || 30000));
    if (!force && healthCache.value && healthCache.endpoint === ep && healthCache.hasCode === hasCode && Date.now() - healthCache.at < ttl) {
      return healthCache.value;
    }
    if (!hasCode) {
      if (interactive) {
        const entered = await promptForClassCode('Enter the class Research Chat code provided by your teacher.');
        if (entered) return health({ force: true, interactive: false });
      }
      return {
        ok: false,
        state: 'access_code_required',
        configured: true,
        requires_access_code: true,
        message: 'Research Chat needs the class code.'
      };
    }
    let value;
    try {
      const response = await fetchWithTimeout(ep, { method: 'GET', headers: authHeaders({ Accept: 'application/json' }) }, 12_000);
      const data = await parseResponse(response);
      value = {
        ok: data.ok === true,
        state: data.ok === true ? 'online' : 'offline',
        configured: data.configured !== false,
        requires_access_code: data.requires_access_code !== false,
        model: data.model || '',
        version: data.version || data.release || '',
        message: data.message || 'Research Chat is connected.'
      };
    } catch (error) {
      if (error.code === 'invalid_access_code') {
        clearAccessCode();
        if (interactive) {
          const entered = await promptForClassCode(error.message);
          if (entered) return health({ force: true, interactive: false });
        }
      }
      value = {
        ok: false,
        state: error.code === 'invalid_access_code' || error.code === 'access_code_required' ? 'access_code_required' : 'offline',
        configured: true,
        requires_access_code: error.code === 'invalid_access_code' || error.code === 'access_code_required',
        message: error.message,
        code: error.code
      };
    }
    healthCache = { at: Date.now(), endpoint: ep, hasCode: Boolean(getAccessCode()), value };
    return value;
  }

  function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.slice(-MAX_HISTORY).map(item => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: redactClientPII(item?.content ?? item?.message, 2200).trim()
    })).filter(item => item.content.trim());
  }

  function redactClientPII(value, maxLength = 5000) {
    return String(value ?? '')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
      .replace(/(?:\+?\d[\d .()\-]{7,}\d)/g, '[phone removed]')
      .slice(0, maxLength);
  }

  function cleanClientUrl(value) {
    const text = redactClientPII(value, 1200).trim();
    if (!text) return '';
    try {
      const url = new URL(text);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
      return url.toString();
    } catch { return ''; }
  }

  function projectSummaryFromAny(project) {
    const p = project && typeof project === 'object' ? project : {};
    if (p.summary && typeof p.summary === 'object') return p.summary;
    const d = p.data && typeof p.data === 'object' ? p.data : p;
    return {
      research_path: p.pathway?.selected ?? p.research_path ?? d.research_path,
      broad_topic: d.broadTopic ?? d.broad_topic,
      topic_choice: d.topicChoice ?? d.topic_choice,
      research_question: d.finalRQ ?? d.research_question,
      purpose: d.purposeStatement ?? d.purpose,
      design: d.designType ?? d.design,
      predictor_or_iv: d.predictorIV ?? d.predictor_or_iv,
      outcome_or_dv: d.outcomeDV ?? d.outcome_or_dv,
      hypothesis: d.hypothesis,
      sample: d.samplePlan ?? d.sample,
      measurement: d.measurementPlan ?? d.measurement,
      ethics: d.ethicsPlan ?? d.ethics,
      analysis_choice: d.analysisChoice ?? d.analysis_choice,
      title: d.titleDraft ?? d.title
    };
  }

  function sourceId(source, index) {
    const explicit = String(source?.id ?? source?.source_id ?? '').trim();
    if (explicit) return redactClientPII(explicit, 100).trim();
    return `project-source-${index + 1}`;
  }

  function minimizeClientContext(context) {
    const c = context && typeof context === 'object' ? context : {};
    const stage = c.stage && typeof c.stage === 'object' ? c.stage : {};
    const focused = c.focused_field && typeof c.focused_field === 'object'
      ? c.focused_field
      : c.current_field && typeof c.current_field === 'object' ? c.current_field : {};
    const focusedKey = String(focused.key || '');
    const focusedLabel = String(focused.label || '');
    const focusedBlocked = SENSITIVE_KEY.test(focusedKey) || SENSITIVE_KEY.test(focusedLabel);

    const projectInput = c.project && typeof c.project === 'object' ? c.project : c;
    const rawSummary = projectSummaryFromAny(projectInput);
    const summary = {};
    for (const [key, value] of Object.entries(rawSummary || {})) {
      if (!SAFE_PROJECT_KEYS.has(key) || SENSITIVE_KEY.test(key)) continue;
      if (!['string','number','boolean'].includes(typeof value) || value === '') continue;
      const cleaned = redactClientPII(value, 1800).trim();
      if (cleaned) summary[key] = cleaned;
    }

    const sourceInput = Array.isArray(projectInput.verified_sources) ? projectInput.verified_sources
      : Array.isArray(projectInput.literature_sources) ? projectInput.literature_sources
      : Array.isArray(projectInput.sources) ? projectInput.sources
      : Array.isArray(c.verified_sources) ? c.verified_sources
      : Array.isArray(c.literature_sources) ? c.literature_sources
      : Array.isArray(c.sources) ? c.sources : [];
    const verified_sources = sourceInput.filter(source => source?.verified === true).slice(0, 16).map((source, index) => ({
      id: sourceId(source, index),
      title: redactClientPII(source.title || source.citation, 320).trim(),
      citation: redactClientPII(source.citation, 600).trim(),
      year: redactClientPII(source.year, 40).trim(),
      finding: redactClientPII(source.finding, 1400).trim(),
      limits: redactClientPII(source.limits, 1000).trim(),
      url: cleanClientUrl(source.url || source.source_url),
      verified: true
    })).filter(source => source.id && (source.title || source.citation));

    const stageIdRaw = Number(stage.id || c.stage_id || 0);
    const stageId = Number.isFinite(stageIdRaw) ? Math.max(0, Math.min(MAX_STAGE_ID, Math.trunc(stageIdRaw))) : 0;
    return {
      stage: { id: stageId, title: redactClientPII(stage.title || c.stage_title, 180).trim() },
      focused_field: {
        key: focusedKey.slice(0, 100),
        label: focusedLabel.slice(0, 180),
        value: focusedBlocked ? '[omitted for privacy]' : redactClientPII(focused.value, 2500).trim()
      },
      project: { summary, verified_sources }
    };
  }

  function contextExplicitlyOff(payload) {
    const candidates = [
      payload?.useProjectContext, payload?.use_project_context,
      payload?.includeProjectContext, payload?.include_project_context,
      payload?.projectContextEnabled, payload?.project_context_enabled,
      payload?.helper_policy?.useProjectContext, payload?.helper_policy?.use_project_context,
      payload?.helper_policy?.includeProjectContext, payload?.helper_policy?.include_project_context
    ];
    return candidates.some(value => value === false);
  }

  function neutralContext() {
    return {
      stage: { id: 0, title: '' },
      focused_field: { key: '', label: '', value: '' },
      project: { summary: {}, verified_sources: [] }
    };
  }

  function normalizeChatCall(payload = {}) {
    const question = redactClientPII(payload.question ?? payload.message, 3000).trim();
    const history = normalizeHistory(payload.history ?? payload.conversation_history ?? []);
    const mode = ['explain', 'question', 'feedback', 'plan'].includes(payload.mode)
      ? payload.mode
      : payload.mode === 'helper_chat' ? 'question' : 'question';
    let sourceContext;
    if (Object.prototype.hasOwnProperty.call(payload, 'context')) sourceContext = payload.context;
    else if (Object.prototype.hasOwnProperty.call(payload, 'project_context')) sourceContext = payload.project_context;
    else sourceContext = {};
    const context = contextExplicitlyOff(payload) ? neutralContext() : minimizeClientContext(sourceContext);
    return { question, history, context, mode };
  }

  function normalizeResponse(data) {
    const answer = String(data?.answer ?? data?.message ?? '');
    const nextSteps = Array.isArray(data?.next_steps) ? data.next_steps
      : Array.isArray(data?.questions_for_student) ? data.questions_for_student : [];
    const scaffold = data?.scaffold && typeof data.scaffold === 'object' ? data.scaffold : {
      stage_id: Number(data?.stage_id || 0),
      focused_field: '',
      mode: 'question',
      level: Number(data?.scaffold_level_used || 0),
      counts_as_stage_support: Boolean(data?.counts_as_stage_support)
    };
    return {
      ...data,
      answer,
      next_steps: nextSteps,
      scaffold,
      message: String(data?.message ?? answer),
      response_kind: String(data?.response_kind || (data?.status === 'source_verification_needed' ? 'source_verification_needed' : 'guided_reasoning')),
      scaffold_level_used: Number(data?.scaffold_level_used ?? scaffold.level ?? 0),
      counts_as_stage_support: Boolean(data?.counts_as_stage_support ?? scaffold.counts_as_stage_support),
      stage_id: Number(data?.stage_id ?? scaffold.stage_id ?? 0),
      questions_for_student: Array.isArray(data?.questions_for_student) ? data.questions_for_student : nextSteps
    };
  }

  async function sendChat(normalized, { interactive = true } = {}) {
    const ep = endpoint();
    if (!ep || !preferenceEnabled()) throw new ChatError('Research Chat has not been connected to the class server yet.', 'endpoint_missing');
    if (!normalized.question) throw new ChatError('Enter a question first.', 'question_required');
    if (normalized.question.length > 3000) throw new ChatError('That question is too long. Shorten it and try again.', 'question_too_long');

    async function attempt() {
      const response = await fetchWithTimeout(ep, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify({
          question: normalized.question,
          history: normalized.history,
          context: normalized.context,
          mode: normalized.mode
        })
      }, 32_000);
      return normalizeResponse(await parseResponse(response));
    }

    try {
      return await attempt();
    } catch (error) {
      if (!interactive || !['invalid_access_code', 'access_code_required'].includes(error.code)) throw error;
      clearAccessCode();
      const entered = await promptForClassCode(error.message);
      if (!entered) throw new ChatError('Research Chat needs the class code before it can send this question.', 'access_code_required', 401);
      return attempt();
    }
  }

  async function chat(payload = {}) {
    return sendChat(normalizeChatCall(payload));
  }

  // Compatibility with the older optional AI Coach review call. It goes through the same
  // fixed endpoint and client-side minimization; arbitrary legacy backend URLs are retired.
  async function review(payload = {}) {
    const stageName = String(payload.stage_title || payload.stage?.title || 'this research stage');
    const question = String(payload.question || `Review my work for ${stageName}. Identify the most important research-method issue to check next and explain how I should revise my own work.`);
    const contextSource = payload.context ?? payload.project_context ?? {
      stage: typeof payload.stage === 'object' ? payload.stage : { id: payload.stage_id, title: payload.stage_title },
      current_field: payload.focused_field ?? payload.current_field,
      project: payload.project
    };
    const result = await sendChat(normalizeChatCall({
      ...payload,
      question,
      context: contextSource,
      mode: 'feedback'
    }));
    return {
      ...result,
      verdict: result.status === 'source_verification_needed' ? 'Source verification needed' : 'Review complete',
      summary: result.message,
      strengths: [],
      concerns: result.status === 'source_verification_needed' ? [result.message] : [],
      next_actions: result.questions_for_student,
      source_notes: result.citations
    };
  }

  retireLegacyEndpointStorage();

  const api = {
    ChatError,
    getConfig,
    setConfig,
    effectiveChatEndpoint,
    enabled,
    reviewEnabled,
    chatConfigured,
    chatEnabled,
    getAccessCode,
    setAccessCode,
    clearAccessCode,
    health,
    chat,
    review,
    minimizeClientContext,
    normalizeChatCall
  };

  window.RMSAI = api;
  window.RMSChatBackend = api;
})();
