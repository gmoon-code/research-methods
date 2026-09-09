import crypto from 'node:crypto';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://gmoon-code.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    answer: { type: 'string' },
    next_steps: {
      type: 'array',
      maxItems: 4,
      items: { type: 'string' }
    },
    citations: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          source_id: { type: 'string' },
          title: { type: 'string' }
        },
        required: ['source_id', 'title']
      }
    },
    scaffold: {
      type: 'object',
      additionalProperties: false,
      properties: {
        stage_id: { type: 'integer' },
        focused_field: { type: 'string' },
        mode: {
          type: 'string',
          enum: ['explain', 'question', 'feedback', 'plan']
        }
      },
      required: ['stage_id', 'focused_field', 'mode']
    }
  },
  required: ['answer', 'next_steps', 'citations', 'scaffold']
};

const SENSITIVE_FIELD_PATTERN = /(raw|dataset|data[_ -]?table|participant|respondent|student[_ -]?name|full[_ -]?name|email|phone|student[_ -]?id|identifier|address)/i;
const MAX_TEXT = 5000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_SOURCES = 20;

function setCors(res, origin) {
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-RMS-Chat-Code');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('Cache-Control', 'no-store');
}

function getHeader(req, name) {
  const headers = req?.headers || {};
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (Array.isArray(direct)) return direct[0] || '';
  return String(direct || '');
}

function allowedOrigins(env = process.env) {
  const configured = String(env.RMS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

function isAllowedOrigin(origin, env = process.env) {
  if (!origin) return false;
  return allowedOrigins(env).has(origin);
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest();
}

function safeEqual(a, b) {
  return crypto.timingSafeEqual(digest(a), digest(b));
}

function authorize(req, env = process.env) {
  const expected = String(env.RMS_CHAT_ACCESS_CODE || '');
  if (!expected) return { ok: false, configured: false };
  const supplied = getHeader(req, 'x-rms-chat-code');
  return { ok: Boolean(supplied) && safeEqual(supplied, expected), configured: true };
}

function redactPII(text) {
  return String(text || '')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
    .replace(/(?:\+?\d[\d .()\-]{7,}\d)/g, '[phone removed]')
    .slice(0, MAX_TEXT);
}

function cleanText(value, max = MAX_TEXT) {
  return redactPII(String(value ?? '')).trim().slice(0, max);
}

function cleanStage(stage) {
  const id = Number(stage?.id || 0);
  return {
    id: Number.isFinite(id) ? Math.max(0, Math.trunc(id)) : 0,
    title: cleanText(stage?.title, 180)
  };
}

function cleanFocusedField(field) {
  const key = cleanText(field?.key, 120);
  const label = cleanText(field?.label, 180);
  const blocked = SENSITIVE_FIELD_PATTERN.test(key) || SENSITIVE_FIELD_PATTERN.test(label);
  return {
    key,
    label,
    value: blocked ? '[omitted for privacy]' : cleanText(field?.value, 2500)
  };
}

function cleanProjectContext(project) {
  const p = project && typeof project === 'object' ? project : {};
  const summary = p.summary && typeof p.summary === 'object' ? p.summary : {};
  const safeSummary = {};
  for (const [key, value] of Object.entries(summary)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      safeSummary[key] = cleanText(value, 1800);
    }
  }

  const verifiedSources = Array.isArray(p.verified_sources)
    ? p.verified_sources
        .filter(s => s && s.verified === true)
        .slice(0, MAX_SOURCES)
        .map(s => ({
          id: cleanText(s.id, 100),
          title: cleanText(s.title || s.citation, 300),
          citation: cleanText(s.citation, 500),
          year: cleanText(s.year, 40),
          finding: cleanText(s.finding, 1200),
          limits: cleanText(s.limits, 900),
          verified: true
        }))
        .filter(s => s.id && (s.title || s.citation))
    : [];

  return { summary: safeSummary, verified_sources: verifiedSources };
}

function minimizeContext(context) {
  const c = context && typeof context === 'object' ? context : {};
  return {
    stage: cleanStage(c.stage),
    focused_field: cleanFocusedField(c.focused_field),
    project: cleanProjectContext(c.project)
  };
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map(m => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: cleanText(m?.content, 2500)
    }))
    .filter(m => m.content);
}

function sourceVerificationFallback(scaffold = {}) {
  return {
    ok: true,
    answer: 'Source verification is needed before I can attach that citation. I can still help you improve the reasoning using the information already in your project.',
    next_steps: [
      'Open the Literature Workspace and verify the source record you want to use.',
      'Check that the source is marked as bibliography verified.',
      'Ask the question again after the source is verified.'
    ],
    citations: [],
    scaffold: {
      stage_id: Number(scaffold.stage_id || 0),
      focused_field: String(scaffold.focused_field || ''),
      mode: ['explain', 'question', 'feedback', 'plan'].includes(scaffold.mode) ? scaffold.mode : 'feedback'
    },
    status: 'source_verification_needed'
  };
}

function enforceVerifiedCitations(result, verifiedSources) {
  const allowed = new Map(
    (verifiedSources || [])
      .filter(s => s?.verified === true && s?.id)
      .map(s => [String(s.id), s])
  );
  const citations = Array.isArray(result?.citations) ? result.citations : [];
  for (const citation of citations) {
    const id = String(citation?.source_id || '');
    if (!id || !allowed.has(id)) return sourceVerificationFallback(result?.scaffold);
  }
  const normalized = citations.map(c => {
    const source = allowed.get(String(c.source_id));
    return {
      source_id: String(c.source_id),
      title: source?.title || source?.citation || cleanText(c.title, 300)
    };
  });
  return { ...result, ok: true, citations: normalized, status: 'ok' };
}

function responseText(apiResponse) {
  if (typeof apiResponse?.output_text === 'string' && apiResponse.output_text.trim()) return apiResponse.output_text;
  for (const item of Array.isArray(apiResponse?.output) ? apiResponse.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

function buildSystemPrompt(context) {
  const verified = context.project.verified_sources || [];
  const sourceRule = verified.length
    ? `Verified source IDs available for citation: ${verified.map(s => s.id).join(', ')}. If you cite a project source, cite only one of these IDs and include every cited source in the citations array.`
    : 'There are no verified project sources available. Do not provide source citations. You may explain general research concepts without citing a project source.';

  return [
    'You are Research Chat inside a scaffolded secondary-school research methods learning environment.',
    'Help the student make the next research decision while preserving student ownership of the work.',
    'Explain unfamiliar research language in plain language before relying on specialized terminology.',
    'Use the current stage and focused field when they are relevant. Do not invent data, participant information, statistical results, sources, quotations, or findings.',
    'Do not claim a source supports a statement unless that source is supplied in the verified-source context.',
    'If a question involves human participants, sensitive topics, hazardous procedures, or school interventions, remind the student that teacher or institutional review may be required before data collection.',
    'Do not ask the student to paste raw datasets or personally identifying participant information into chat.',
    sourceRule,
    'Keep the response concise enough to be useful inside a side panel. Give concrete next actions when appropriate.'
  ].join('\n');
}

function buildOpenAIRequest({ question, history, context, env = process.env }) {
  const messages = [
    { role: 'system', content: buildSystemPrompt(context) }
  ];
  for (const message of history) messages.push(message);
  messages.push({
    role: 'user',
    content: [
      `Student question: ${question}`,
      `Current stage: ${context.stage.id} ${context.stage.title}`,
      `Focused field: ${context.focused_field.label || context.focused_field.key || 'none'}`,
      `Focused field value: ${context.focused_field.value || 'none provided'}`,
      `Project context: ${JSON.stringify(context.project)}`
    ].join('\n')
  });

  return {
    model: env.OPENAI_MODEL || 'gpt-5.6-luna',
    input: messages,
    store: false,
    max_output_tokens: 1400,
    text: {
      format: {
        type: 'json_schema',
        name: 'rms_research_chat_response',
        strict: true,
        schema: RESPONSE_SCHEMA
      }
    }
  };
}

async function callOpenAI(payload, { fetchImpl = fetch, env = process.env } = {}) {
  const apiKey = String(env.OPENAI_API_KEY || '');
  if (!apiKey) {
    const err = new Error('missing_openai_configuration');
    err.code = 'CONFIG';
    throw err;
  }
  const upstream = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!upstream.ok) {
    const err = new Error('provider_request_failed');
    err.code = 'UPSTREAM';
    err.status = upstream.status;
    throw err;
  }
  const data = await upstream.json();
  const text = responseText(data);
  if (!text) {
    const err = new Error('provider_response_missing_text');
    err.code = 'UPSTREAM';
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error('provider_response_invalid_json');
    err.code = 'UPSTREAM';
    throw err;
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function handleRequest(req, res, { fetchImpl = fetch, env = process.env } = {}) {
  const origin = getHeader(req, 'origin');
  if (!isAllowedOrigin(origin, env)) {
    setCors(res, '');
    return sendJson(res, 403, { error: 'Origin not allowed.' });
  }
  setCors(res, origin);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const auth = authorize(req, env);
  if (!auth.configured) return sendJson(res, 503, { error: 'Chat service is not configured.' });
  if (!auth.ok) return sendJson(res, 401, { error: 'Invalid class code.' });

  if (req.method === 'GET') {
    const url = new URL(req.url || '/api/research-chat', 'https://rms.invalid');
    if (url.searchParams.get('health') === '1') {
      return sendJson(res, 200, { ok: true, service: 'research-chat', version: '2.14' });
    }
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const question = cleanText(body.question, 3000);
  if (!question) return sendJson(res, 400, { error: 'Enter a question first.' });

  const context = minimizeContext(body.context);
  const history = cleanHistory(body.history);
  const requestBody = buildOpenAIRequest({ question, history, context, env });

  try {
    const raw = await callOpenAI(requestBody, { fetchImpl, env });
    const result = enforceVerifiedCitations(raw, context.project.verified_sources);
    return sendJson(res, 200, result);
  } catch (err) {
    if (err?.code === 'CONFIG') return sendJson(res, 503, { error: 'Chat service is not configured.' });
    console.error('research-chat request failed', { code: err?.code || 'UNKNOWN', status: err?.status || 0 });
    return sendJson(res, 502, { error: 'Chat service is temporarily unavailable.' });
  }
}

export default async function handler(req, res) {
  return handleRequest(req, res);
}

export {
  RESPONSE_SCHEMA,
  authorize,
  buildOpenAIRequest,
  cleanHistory,
  cleanProjectContext,
  enforceVerifiedCitations,
  handleRequest,
  isAllowedOrigin,
  minimizeContext,
  redactPII,
  responseText,
  sourceVerificationFallback
};
