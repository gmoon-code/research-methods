import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION, OUTPUT_SCHEMA, ALLOWED_MODELS, MIN_ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_LENGTH, MAX_STAGE_ID,
  authState, buildWorkersAIRequest, callWorkersAI, configurationState, enforceOutput,
  extractWorkersAIOutput, looksLikeInlineCitation, minimizeContext, parseAllowedOrigins,
  readJsonLimited, redactPII, route, timingSafeStringEqual
} from '../api/research-chat.js';

const ORIGIN = 'https://gmoon-code.github.io';
const CODE = 'class-code-12345678';
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const ENV = { RMS_CHAT_ACCESS_CODE: CODE, RMS_ALLOWED_ORIGINS: ORIGIN, RMS_AI_MODEL: MODEL };

function request(method = 'GET', { code = CODE, origin = ORIGIN, session = 'session12345678', body, rawBody, contentType = 'application/json' } = {}) {
  const headers = new Headers(); if (origin) headers.set('Origin', origin); if (code) headers.set('X-RMS-Chat-Code', code); if (session) headers.set('X-RMS-Client-Session', session);
  if (body !== undefined || rawBody !== undefined) headers.set('Content-Type', contentType);
  const payload = rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined;
  return new Request('https://worker.example/', { method, headers, body: payload });
}
function modelOutput(overrides = {}) {
  return {
    message: 'Define the outcome so another researcher could measure it in the same way.', response_kind: 'guided_reasoning',
    scaffold_level_used: 1, counts_as_stage_support: true, questions_for_student: ['What exactly will you observe?'],
    direct_completion_guard: { student_attempt_present: false, direct_answer_withheld: true, reason: 'Student should make the decision.' },
    citations: [], safety: { status: 'clear', reason: 'No additional safety review indicated.' },
    prohibited_completion: { did_not_replace_student_work: true, did_not_invent_sources: true, did_not_invent_data: true, did_not_calculate_unvalidated_statistics: true },
    ...overrides
  };
}
const aiRun = async () => ({ response: modelOutput() });

test('release is locked to one verified free Workers AI model', () => {
  assert.equal(VERSION, '2.15.0'); assert.deepEqual([...ALLOWED_MODELS], [MODEL]);
  assert.equal(MIN_ACCESS_CODE_LENGTH, 16); assert.equal(MAX_ACCESS_CODE_LENGTH, 256); assert.equal(MAX_STAGE_ID, 18);
});

test('configuration has no model API-key dependency and fails unsupported model closed', () => {
  const ok = configurationState(ENV); assert.equal(ok.ok, true); assert.equal(ok.provider, 'cloudflare-workers-ai'); assert.equal(ok.freeEdition, true); assert.equal(ok.model, MODEL);
  assert.equal(configurationState({ ...ENV, RMS_AI_MODEL: '@cf/moonshotai/kimi-k2.6' }).ok, false);
  assert.equal(configurationState({ ...ENV, RMS_CHAT_ACCESS_CODE: 'short' }).ok, false);
  assert.equal(configurationState({ ...ENV, RMS_ALLOWED_ORIGINS: '' }).ok, false);
});

test('origin parser accepts origins only and strips paths/credentials', () => {
  assert.deepEqual(parseAllowedOrigins({ RMS_ALLOWED_ORIGINS: 'https://example.com, https://example.com/, http://localhost:8000, https://bad.example/path, https://user:pass@example.org' }), ['https://example.com', 'http://localhost:8000']);
});

test('timing-safe comparison and class-code auth are bounded', () => {
  assert.equal(timingSafeStringEqual('same', 'same'), true); assert.equal(timingSafeStringEqual('same', 'different'), false);
  assert.equal(authState(request('GET'), ENV).ok, true); assert.equal(authState(request('GET', { code: 'wrong' }), ENV).ok, false);
  assert.equal(authState(request('GET'), { ...ENV, RMS_CHAT_ACCESS_CODE: 'short' }).configured, false);
  assert.equal(authState(request('GET'), { ...ENV, RMS_CHAT_ACCESS_CODE: 'x'.repeat(257) }).configured, false);
});

test('PII redaction removes obvious email and phone patterns', () => {
  const cleaned = redactPII('Contact student@example.com or +82 10-1234-5678'); assert.doesNotMatch(cleaned, /student@example/); assert.doesNotMatch(cleaned, /1234-5678/);
});

test('context allowlist excludes raw/identity fields and unverified sources', () => {
  const context = minimizeContext({ stage: { id: 99, title: 'Methods' }, focused_field: { key: 'rawDataset', label: 'Raw participant data', value: 'Alice,90' }, project: { summary: { research_question: 'Does light affect growth?', rawData: 'Alice', project_name: 'Private' }, verified_sources: [{ id: 'S1', title: 'Verified', citation: 'Citation', verified: true }, { id: 'S2', title: 'No', verified: false }] } });
  assert.equal(context.stage.id, 18); assert.equal(context.focused_field.value, '[omitted for privacy]'); assert.equal('rawData' in context.project.summary, false); assert.equal('project_name' in context.project.summary, false); assert.deepEqual(context.project.verified_sources.map(s => s.id), ['S1']);
});

test('request reader rejects malformed and oversized JSON before model invocation', async () => {
  await assert.rejects(() => readJsonLimited(request('POST', { rawBody: '{bad' })), /invalid_json/);
  const huge = request('POST', { body: { x: 'x'.repeat(70_000) } }); await assert.rejects(() => readJsonLimited(huge), /request_too_large/);
});

test('Workers AI request uses Cloudflare JSON Mode and bounded generation', () => {
  const context = minimizeContext({ stage: { id: 4, title: 'Question' }, project: { summary: {}, verified_sources: [] } });
  const payload = buildWorkersAIRequest({ question: 'Help.', history: [], context, requestedMode: 'question', model: MODEL });
  assert.equal(payload.model, MODEL); assert.equal(payload.input.response_format.type, 'json_schema'); assert.equal(payload.input.response_format.json_schema, OUTPUT_SCHEMA);
  assert.equal(payload.input.stream, false); assert.ok(payload.input.max_tokens <= 1100); assert.equal(payload.input.temperature, 0.2); assert.equal(payload.input.messages[0].role, 'system');
  assert.match(payload.input.messages.at(-1).content, /UNTRUSTED_STUDENT_DATA_START/);
});

test('Workers AI output parser accepts JSON object or JSON string and rejects garbage', () => {
  const output = modelOutput(); assert.equal(extractWorkersAIOutput({ response: output }), output); assert.deepEqual(extractWorkersAIOutput({ response: JSON.stringify(output) }), output);
  assert.throws(() => extractWorkersAIOutput({ response: 'not-json' }), /workers_ai_output_invalid_json/);
  assert.throws(() => extractWorkersAIOutput({}), /workers_ai_output_missing/);
});

test('missing Workers AI binding fails configured and free-quota errors are classified', async () => {
  await assert.rejects(() => callWorkersAI({ model: MODEL, input: {} }), error => error.code === 'CONFIG');
  await assert.rejects(() => callWorkersAI({ model: MODEL, input: {} }, async () => { throw new Error('10,000 Neurons daily limit reached'); }), error => error.code === 'FREE_LIMIT');
});

test('inline citation-like prose is caught before rendering', () => {
  assert.equal(looksLikeInlineCitation('Smith (2024) supports this.'), true); assert.equal(looksLikeInlineCitation('See https://example.org'), true); assert.equal(looksLikeInlineCitation('Define the measure first.'), false);
});

test('unknown citations trigger verification fallback', () => {
  const context = minimizeContext({ stage: { id: 7, title: 'Literature' }, focused_field: { key: 'synthesis', label: 'Synthesis', value: 'My attempt' }, project: { summary: {}, verified_sources: [{ id: 'S1', title: 'Verified', citation: 'Citation', verified: true }] } });
  const result = enforceOutput(modelOutput({ citations: [{ source_id: 'S2' }] }), context, 'feedback'); assert.equal(result.status, 'source_verification_needed'); assert.equal(result.citations.length, 0); assert.equal(result.stage_id, 7);
});

test('server controls stage and attempt metadata even when model claims otherwise', () => {
  const context = minimizeContext({ stage: { id: 7, title: 'Literature' }, focused_field: { key: 'synthesis', label: 'Synthesis', value: 'My attempt' }, project: { summary: {}, verified_sources: [] } });
  const result = enforceOutput(modelOutput({ scaffold_level_used: 99, direct_completion_guard: { student_attempt_present: false, direct_answer_withheld: false, reason: 'model guess' } }), context, 'feedback');
  assert.equal(result.stage_id, 7); assert.equal(result.scaffold_level_used, 5); assert.equal(result.direct_completion_guard.student_attempt_present, true);
});

test('neutral context forces support accounting to zero', () => {
  const result = enforceOutput(modelOutput({ scaffold_level_used: 5, counts_as_stage_support: true }), minimizeContext({}), 'question');
  assert.equal(result.scaffold_level_used, 0); assert.equal(result.counts_as_stage_support, false); assert.equal(result.scaffold.stage_id, 0);
});

test('legacy and normalized response aliases are emitted together', () => {
  const result = enforceOutput(modelOutput(), minimizeContext({ stage: { id: 4, title: 'Question' }, project: { summary: {}, verified_sources: [] } }), 'feedback');
  assert.equal(result.answer, result.message); assert.deepEqual(result.next_steps, result.questions_for_student); assert.equal(result.stage_id, 4);
});

test('OPTIONS and health preserve CORS/security and free-edition metadata', async () => {
  const options = await route(request('OPTIONS'), { env: ENV, aiRun }); assert.equal(options.status, 204); assert.equal(options.headers.get('access-control-allow-origin'), ORIGIN);
  const health = await route(request('GET'), { env: ENV, aiRun }); const body = await health.json(); assert.equal(health.status, 200); assert.equal(body.version, '2.15.0'); assert.equal(body.model, MODEL); assert.equal(body.provider, 'cloudflare-workers-ai'); assert.equal(body.free_edition, true);
});

test('health fails closed for wrong code, missing binding, unsupported model, and disallowed origin', async () => {
  assert.equal((await route(request('GET', { code: 'wrong' }), { env: ENV, aiRun })).status, 401);
  assert.equal((await route(request('GET'), { env: ENV })).status, 503);
  assert.equal((await route(request('GET'), { env: { ...ENV, RMS_AI_MODEL: '@cf/moonshotai/kimi-k2.6' }, aiRun })).status, 503);
  assert.equal((await route(request('GET', { origin: 'https://evil.example' }), { env: ENV, aiRun })).status, 403);
});

test('POST requires JSON and uses Workers AI binding without external API credentials', async () => {
  assert.equal((await route(request('POST', { body: { question: 'Help' }, contentType: 'text/plain' }), { env: ENV, aiRun })).status, 415);
  const calls = []; const run = async (model, input) => { calls.push({ model, input }); return { response: modelOutput() }; };
  const response = await route(request('POST', { body: { question: 'Review my question.', mode: 'feedback', context: { stage: { id: 4, title: 'Question' }, focused_field: { key: 'finalRQ', label: 'Final question', value: 'Does light affect growth?' }, project: { summary: {}, verified_sources: [] } } } }), { env: ENV, aiRun: run });
  assert.equal(response.status, 200); assert.equal(calls.length, 1); assert.equal(calls[0].model, MODEL); assert.doesNotMatch(JSON.stringify(calls[0]), /OPENAI_API_KEY|Bearer|api\.openai\.com/);
});

test('free limit and provider failures are sanitized for students', async () => {
  const free = await route(request('POST', { body: { question: 'Help', context: {} } }), { env: ENV, aiRun: async () => { throw new Error('neuron quota exhausted SECRET'); } });
  assert.equal(free.status, 429); assert.doesNotMatch(await free.text(), /SECRET/);
  const failed = await route(request('POST', { body: { question: 'Help', context: {} } }), { env: ENV, aiRun: async () => { throw new Error('SECRET INTERNAL'); } });
  assert.equal(failed.status, 502); assert.doesNotMatch(await failed.text(), /SECRET/);
});
