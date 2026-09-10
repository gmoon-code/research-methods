import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker, rateLimitersConfigured, aiConfigured, VERSION } from '../backend/cloudflare-workers-ai/worker.mjs';

const ORIGIN = 'https://gmoon-code.github.io';
const CODE = 'class-code-12345678';
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function limiter(sequence = [true]) {
  const calls = []; let i = 0;
  return { calls, async limit(input) { calls.push(input); const success = sequence[Math.min(i++, sequence.length - 1)]; return { success }; } };
}
function modelOutput(overrides = {}) {
  return {
    message: 'An operational definition states exactly how a variable will be observed or measured.',
    response_kind: 'concept_explanation', scaffold_level_used: 0, counts_as_stage_support: false,
    questions_for_student: [],
    direct_completion_guard: { student_attempt_present: false, direct_answer_withheld: false, reason: 'General explanation only.' },
    citations: [], safety: { status: 'clear', reason: 'No safety issue.' },
    prohibited_completion: { did_not_replace_student_work: true, did_not_invent_sources: true, did_not_invent_data: true, did_not_calculate_unvalidated_statistics: true },
    ...overrides
  };
}
function env(overrides = {}) {
  const aiCalls = [];
  const AI = { calls: aiCalls, async run(model, input) { aiCalls.push({ model, input }); return { response: modelOutput() }; } };
  return {
    RMS_CHAT_ACCESS_CODE: CODE, RMS_ALLOWED_ORIGINS: ORIGIN, RMS_AI_MODEL: MODEL,
    AI, AUTH_RATE_LIMITER: limiter(), SESSION_RATE_LIMITER: limiter(), CLASS_RATE_LIMITER: limiter(), ...overrides
  };
}
function req(method = 'GET', { code = CODE, origin = ORIGIN, session = 'session12345678', body } = {}) {
  const headers = new Headers();
  if (origin) headers.set('Origin', origin);
  if (code) headers.set('X-RMS-Chat-Code', code);
  if (session) headers.set('X-RMS-Client-Session', session);
  headers.set('CF-Connecting-IP', '203.0.113.7');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  return new Request('https://rms-research-chat-free.example.workers.dev/', { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

test('Cloudflare adapter reports free release and requires AI/rate-limit bindings', () => {
  assert.equal(VERSION, '2.15.0');
  assert.equal(rateLimitersConfigured(env()), true);
  assert.equal(rateLimitersConfigured(env({ CLASS_RATE_LIMITER: undefined })), false);
  assert.equal(aiConfigured(env()), true);
  assert.equal(aiConfigured(env({ AI: undefined })), false);
});

test('OPTIONS preserves CORS and consumes no rate-limit or AI call', async () => {
  const e = env(); const response = await createWorker().fetch(req('OPTIONS'), e);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(e.AUTH_RATE_LIMITER.calls.length + e.SESSION_RATE_LIMITER.calls.length + e.CLASS_RATE_LIMITER.calls.length, 0);
  assert.equal(e.AI.calls.length, 0);
});

test('disallowed origin is rejected without counters or inference', async () => {
  const e = env(); const response = await createWorker().fetch(req('GET', { origin: 'https://evil.example' }), e);
  assert.equal(response.status, 403); assert.equal(e.AI.calls.length, 0);
  assert.equal(e.AUTH_RATE_LIMITER.calls.length + e.SESSION_RATE_LIMITER.calls.length + e.CLASS_RATE_LIMITER.calls.length, 0);
});

test('wrong code uses only auth limiter before shared 401', async () => {
  const e = env(); const response = await createWorker().fetch(req('GET', { code: 'wrong-code-value' }), e);
  assert.equal(response.status, 401); assert.equal(e.AUTH_RATE_LIMITER.calls.length, 1);
  assert.equal(e.SESSION_RATE_LIMITER.calls.length, 0); assert.equal(e.CLASS_RATE_LIMITER.calls.length, 0); assert.equal(e.AI.calls.length, 0);
});

test('auth limiter returns browser-readable 429', async () => {
  const e = env({ AUTH_RATE_LIMITER: limiter([false]) });
  const response = await createWorker().fetch(req('GET', { code: 'wrong-code-value' }), e);
  assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60');
  assert.match(await response.text(), /too many requests/i);
});

test('health reports Cloudflare Workers AI free edition without inference', async () => {
  const e = env(); const response = await createWorker().fetch(req('GET'), e); const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.version, '2.15.0'); assert.equal(body.model, MODEL);
  assert.equal(body.provider, 'cloudflare-workers-ai'); assert.equal(body.free_edition, true); assert.equal(e.AI.calls.length, 0);
  assert.equal(e.SESSION_RATE_LIMITER.calls.length, 1); assert.equal(e.CLASS_RATE_LIMITER.calls.length, 1);
});

test('missing AI or any limiter fails closed', async () => {
  for (const e of [env({ AI: undefined }), env({ SESSION_RATE_LIMITER: undefined }), env({ CLASS_RATE_LIMITER: undefined })]) {
    const response = await createWorker().fetch(req('GET'), e); assert.equal(response.status, 503);
  }
});

test('session or class limiter exhaustion blocks inference', async () => {
  for (const e of [env({ SESSION_RATE_LIMITER: limiter([false]) }), env({ CLASS_RATE_LIMITER: limiter([false]) })]) {
    const response = await createWorker().fetch(req('POST', { body: { question: 'Explain operational definitions.', context: {} } }), e);
    assert.equal(response.status, 429); assert.equal(e.AI.calls.length, 0);
  }
});

test('successful POST uses Workers AI binding, JSON schema, bounded output and free model', async () => {
  const e = env(); const response = await createWorker().fetch(req('POST', { body: { question: 'Explain operational definitions.', context: {} } }), e);
  assert.equal(response.status, 200); const body = await response.json(); assert.equal(body.ok, true);
  assert.equal(e.AI.calls.length, 1); const call = e.AI.calls[0]; assert.equal(call.model, MODEL);
  assert.equal(call.input.response_format.type, 'json_schema'); assert.equal(call.input.response_format.json_schema.type, 'object');
  assert.equal(call.input.stream, false); assert.ok(call.input.max_tokens <= 1100); assert.ok(call.input.max_tokens >= 500);
  assert.equal(call.input.messages[0].role, 'system'); assert.match(call.input.messages.at(-1).content, /UNTRUSTED_STUDENT_DATA_START/);
});

test('free-allocation/provider-capacity error becomes clear 429 and never leaks diagnostics', async () => {
  const e = env(); e.AI.run = async () => { throw new Error('Workers AI free allocation of 10,000 Neurons exceeded'); };
  const response = await createWorker().fetch(req('POST', { body: { question: 'Help me.', context: {} } }), e);
  assert.equal(response.status, 429); const body = await response.json();
  assert.match(body.error, /free daily AI allowance/i); assert.doesNotMatch(JSON.stringify(body), /10,000 Neurons exceeded/i);
});

test('generic model failure remains sanitized', async () => {
  const e = env(); e.AI.run = async () => { throw new Error('SECRET PROVIDER DIAGNOSTIC'); };
  const response = await createWorker().fetch(req('POST', { body: { question: 'Help me.', context: {} } }), e);
  assert.equal(response.status, 502); const text = await response.text(); assert.doesNotMatch(text, /SECRET PROVIDER/); assert.match(text, /temporarily unavailable/i);
});
