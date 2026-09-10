import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/ai-adapter.js', import.meta.url), 'utf8');

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    _map: map
  };
}

function successBody(overrides = {}) {
  return {
    ok: true,
    version: '2.15.0',
    status: 'ok',
    answer: 'Check the measurement rule.',
    next_steps: ['Define the unit.'],
    citations: [],
    scaffold: { stage_id: 4, focused_field: 'finalRQ', mode: 'feedback', level: 2, counts_as_stage_support: true },
    message: 'Check the measurement rule.',
    response_kind: 'feedback_on_attempt',
    scaffold_level_used: 2,
    counts_as_stage_support: true,
    stage_id: 4,
    questions_for_student: ['Define the unit.'],
    direct_completion_guard: { student_attempt_present: true, direct_answer_withheld: false, reason: 'Feedback.' },
    safety: { status: 'clear', reason: 'Clear.' },
    prohibited_completion: {
      did_not_replace_student_work: true,
      did_not_invent_sources: true,
      did_not_invent_data: true,
      did_not_calculate_unvalidated_statistics: true
    },
    ...overrides
  };
}

function makeContext(fetchImpl, { runtime = {}, sessionSeed = {}, localSeed = {}, promptValue = null } = {}) {
  const session = storage(sessionSeed);
  const local = storage(localSeed);
  const capturedPrompts = [];
  const context = {
    window: {
      RMS_RUNTIME_CONFIG: {
        version: '2.15.0',
        researchChatEndpoint: 'https://rms-research-chat-free.example.workers.dev/',
        chatEndpoint: 'https://rms-research-chat-free.example.workers.dev/',
        ...runtime
      },
      prompt: message => { capturedPrompts.push(message); return promptValue; }
    },
    sessionStorage: session,
    localStorage: local,
    fetch: fetchImpl || (async () => new Response(JSON.stringify({ ok: true, configured: true, requires_access_code: true, version: '2.15.0', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
    Headers, Response, Request, URL, AbortController,
    setTimeout, clearTimeout, Math, Date, Uint8Array,
    crypto: globalThis.crypto,
    location: { hostname: 'gmoon-code.github.io', origin: 'https://gmoon-code.github.io' },
    globalThis: null,
    console
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return { ctx: context, session, local, capturedPrompts };
}

test('adapter retains the full v2.13-compatible RMSAI surface plus current Chat API', () => {
  const { ctx } = makeContext();
  for (const name of [
    'chat','review','health','enabled','effectiveChatEndpoint','reviewEnabled','chatConfigured','chatEnabled',
    'getConfig','setConfig','getAccessCode','setAccessCode','clearAccessCode','minimizeClientContext','normalizeChatCall'
  ]) assert.equal(typeof ctx.window.RMSAI[name], 'function', name);
  assert.equal(typeof ctx.window.RMSAI.ChatError, 'function');
  assert.equal(ctx.window.RMSChatBackend, ctx.window.RMSAI);
});

test('legacy arbitrary endpoint settings are retired and browser settings cannot replace owner runtime endpoint', () => {
  const { ctx, local } = makeContext(undefined, {
    localSeed: {
      rms_chat_backend_v2_14: JSON.stringify({ endpoint: 'https://evil.example/api/research-chat' }),
      rms_ai_backend_v1_2: JSON.stringify({ endpoint: 'https://old.example/api/research-chat' })
    }
  });
  assert.equal(local.getItem('rms_chat_backend_v2_14'), null);
  assert.equal(local.getItem('rms_ai_backend_v1_2'), null);
  ctx.window.RMSAI.setConfig({ endpoint: 'https://evil.example/api/research-chat', chatEndpoint: 'https://evil.example/api/research-chat', enabled: true });
  assert.equal(ctx.window.RMSAI.effectiveChatEndpoint(), 'https://rms-research-chat-free.example.workers.dev/');
  assert.equal(ctx.window.RMSAI.getConfig().endpoint, 'https://rms-research-chat-free.example.workers.dev/');
});

test('class code is session-only, migrates only bounded legacy session code, and enforces length bounds', () => {
  const { ctx, session } = makeContext(undefined, { sessionSeed: { rms_chat_access_v2_14: 'legacy-class-code-1234' } });
  assert.equal(ctx.window.RMSAI.getAccessCode(), 'legacy-class-code-1234');
  assert.equal(session.getItem('rms_research_chat_code_v215'), 'legacy-class-code-1234');
  assert.throws(() => ctx.window.RMSAI.setAccessCode('short'), /at least 16/);
  assert.throws(() => ctx.window.RMSAI.setAccessCode('x'.repeat(257)), /unexpectedly long/);
  ctx.window.RMSAI.setAccessCode('new-class-code-123456');
  assert.equal(ctx.window.RMSAI.getAccessCode(), 'new-class-code-123456');
  assert.doesNotMatch(source, /localStorage\.setItem\([^\n]*CODE/i);
});

test('health preserves legacy non-throwing state contract and sends pseudonymous session header', async () => {
  let captured;
  const { ctx } = makeContext(async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify({ ok: true, configured: true, requires_access_code: true, version: '2.15.0', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', message: 'Connected.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  let state = await ctx.window.RMSAI.health();
  assert.equal(state.ok, false);
  assert.equal(state.state, 'access_code_required');
  ctx.window.RMSAI.setAccessCode('class-code-12345678');
  state = await ctx.window.RMSAI.health({ force: true });
  assert.equal(state.ok, true);
  assert.equal(state.state, 'online');
  assert.equal(captured.url, 'https://rms-research-chat-free.example.workers.dev/');
  assert.equal(captured.options.headers['X-RMS-Chat-Code'], 'class-code-12345678');
  assert.match(captured.options.headers['X-RMS-Client-Session'], /^[A-Za-z0-9_-]{8,128}$/);
  assert.equal(captured.options.credentials, 'omit');
});

test('health can use legacy interactive code prompt after 401 without persisting endpoint settings', async () => {
  let calls = 0;
  const { ctx, capturedPrompts } = makeContext(async (_url, options) => {
    calls++;
    if (options.headers['X-RMS-Chat-Code'] !== 'prompted-class-code-1234') {
      return new Response(JSON.stringify({ error: 'Invalid class code.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ ok: true, configured: true, requires_access_code: true, version: '2.15.0', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }, { promptValue: 'prompted-class-code-1234' });
  ctx.window.RMSAI.setAccessCode('wrong-code-but-long');
  const state = await ctx.window.RMSAI.health({ force: true, interactive: true });
  assert.equal(state.ok, true);
  assert.ok(calls >= 2);
  assert.ok(capturedPrompts.length >= 1);
});

test('client minimization prevents raw project data/unverified sources crossing network and maps legacy current_field/literature_sources', () => {
  const { ctx } = makeContext();
  const minimized = ctx.window.RMSAI.minimizeClientContext({
    stage: { id: 9, title: 'Methods' },
    current_field: { key: 'rawDataset', label: 'Raw participant dataset', value: 'Alice,90\nBob,80' },
    finalRQ: 'Does light affect growth? person@example.com',
    samplePlan: '+82 10-1234-5678',
    rawData: 'Alice,90',
    literature_sources: [
      { citation: 'Verified citation', source_url: 'https://example.org/study', verified: true, finding: 'Contact author@example.com' },
      { id: 'S2', citation: 'Unverified', verified: false }
    ]
  });
  assert.equal(minimized.stage.id, 9);
  assert.equal(minimized.focused_field.value, '[omitted for privacy]');
  assert.match(minimized.project.summary.research_question, /\[email removed\]/);
  assert.equal(minimized.project.summary.sample, '[phone removed]');
  assert.equal('rawData' in minimized.project.summary, false);
  assert.equal(minimized.project.verified_sources.length, 1);
  assert.equal(minimized.project.verified_sources[0].id, 'project-source-1');
  assert.equal(minimized.project.verified_sources[0].url, 'https://example.org/study');
});

test('old v2.13 helper_chat payload is translated instead of silently dropping conversation/project context', async () => {
  let requestBody;
  const { ctx } = makeContext(async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify(successBody()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  ctx.window.RMSAI.setAccessCode('class-code-12345678');
  const response = await ctx.window.RMSAI.chat({
    mode: 'helper_chat',
    question: 'Review this.',
    conversation_history: [{ role: 'assistant', message: 'Earlier help.' }],
    project_context: {
      stage: { id: 4, title: 'Research question' },
      current_field: { key: 'finalRQ', label: 'Final research question', value: 'Does light affect growth?' },
      finalRQ: 'Does light affect growth?',
      rawData: 'DO NOT SEND',
      literature_sources: [{ id: 'S1', citation: 'Verified source', verified: true }]
    },
    helper_policy: { preserve_student_authorship: true }
  });
  assert.equal(requestBody.context.stage.id, 4);
  assert.equal(requestBody.context.focused_field.key, 'finalRQ');
  assert.equal(requestBody.context.focused_field.value, 'Does light affect growth?');
  assert.equal(requestBody.context.project.summary.research_question, 'Does light affect growth?');
  assert.equal(requestBody.history[0].content, 'Earlier help.');
  assert.doesNotMatch(JSON.stringify(requestBody), /DO NOT SEND/);
  assert.equal(response.message, 'Check the measurement rule.');
  assert.equal(response.answer, 'Check the measurement rule.');
  assert.equal(response.scaffold_level_used, 2);
  assert.deepEqual(Array.from(response.questions_for_student), ['Define the unit.']);
});

test('explicit context-off flag overrides even a populated legacy project_context before network serialization', async () => {
  let requestBody;
  const { ctx } = makeContext(async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify(successBody({ stage_id: 1, scaffold: { stage_id: 0, focused_field: '', mode: 'question', level: 0, counts_as_stage_support: false } })), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const classCode = 'class-code-12345678';
  ctx.window.RMSAI.setAccessCode(classCode);
  await ctx.window.RMSAI.chat({
    question: 'What is a variable?',
    use_project_context: false,
    project_context: { stage: { id: 8, title: 'Should not send' }, finalRQ: 'PRIVATE PROJECT QUESTION', literature_sources: [{ id: 'S1', citation: 'Private source', verified: true }] }
  });
  assert.deepEqual(JSON.parse(JSON.stringify(requestBody.context)), {
    stage: { id: 0, title: '' },
    focused_field: { key: '', label: '', value: '' },
    project: { summary: {}, verified_sources: [] }
  });
  assert.doesNotMatch(JSON.stringify(requestBody), /PRIVATE PROJECT QUESTION|Private source|Should not send/);
  assert.doesNotMatch(JSON.stringify(requestBody), new RegExp(classCode));
});

test('review compatibility uses the same fixed secure endpoint and returns legacy aliases', async () => {
  let captured;
  const { ctx } = makeContext(async (url, options) => {
    captured = { url, options };
    return new Response(JSON.stringify(successBody()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  ctx.window.RMSAI.setAccessCode('class-code-12345678');
  const result = await ctx.window.RMSAI.review({
    stage_id: 4,
    stage_title: 'Question',
    focused_field: { key: 'finalRQ', label: 'Final question', value: 'My attempt' },
    project: { summary: { research_question: 'My attempt' } }
  });
  assert.equal(captured.url, 'https://rms-research-chat-free.example.workers.dev/');
  assert.equal(result.verdict, 'Review complete');
  assert.equal(result.summary, 'Check the measurement rule.');
  assert.deepEqual(Array.from(result.next_actions), ['Define the unit.']);
});

test('disabled preference disables Chat without changing the owner endpoint', () => {
  const { ctx } = makeContext();
  ctx.window.RMSAI.setConfig({ enabled: false, endpoint: 'https://evil.example/api/research-chat' });
  assert.equal(ctx.window.RMSAI.enabled(), false);
  assert.equal(ctx.window.RMSAI.effectiveChatEndpoint(), 'https://rms-research-chat-free.example.workers.dev/');
  ctx.window.RMSAI.setConfig({ enabled: true });
  assert.equal(ctx.window.RMSAI.enabled(), true);
});


test('client clamps Stage to the real 18-stage route and redacts obvious email/phone text before network serialization', async () => {
  let requestBody;
  const { ctx } = makeContext(async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify(successBody()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  ctx.window.RMSAI.setAccessCode('class-code-12345678');
  await ctx.window.RMSAI.chat({
    question: 'Please contact student@example.com or +82 10-1234-5678 about this question.',
    conversation_history: [{ role: 'user', message: 'Earlier email was old@example.com' }],
    project_context: { stage: { id: 99, title: 'Impossible Stage' }, finalRQ: 'Does light affect growth?' }
  });
  assert.equal(requestBody.context.stage.id, 18);
  assert.match(requestBody.question, /\[email removed\]/);
  assert.match(requestBody.question, /\[phone removed\]/);
  assert.match(requestBody.history[0].content, /\[email removed\]/);
  assert.doesNotMatch(JSON.stringify(requestBody), /student@example\.com|old@example\.com|10-1234-5678/);
});

test('free edition requires an owner-configured absolute endpoint and has no same-origin paid-provider fallback', () => {
  const relativeConfigured = makeContext(undefined, { runtime: { researchChatEndpoint: '/api/research-chat', chatEndpoint: '/api/research-chat' } });
  assert.equal(relativeConfigured.ctx.window.RMSAI.effectiveChatEndpoint(), '');
  const noFallback = makeContext(undefined, { runtime: { researchChatEndpoint: '', chatEndpoint: '' } });
  noFallback.ctx.location.hostname = 'demo.vercel.app';
  noFallback.ctx.location.origin = 'https://demo.vercel.app';
  assert.equal(noFallback.ctx.window.RMSAI.effectiveChatEndpoint(), '');
});

test('free Workers endpoint remains valid on opaque-origin local preview pages', () => {
  const { ctx } = makeContext();
  ctx.location.origin = 'null';
  ctx.location.hostname = '';
  assert.equal(ctx.window.RMSAI.effectiveChatEndpoint(), 'https://rms-research-chat-free.example.workers.dev/');
  assert.equal(ctx.window.RMSAI.chatConfigured(), true);
});

test('Cloudflare workers.dev root endpoint is accepted when supplied by owner-controlled runtime config', () => {
  const { ctx } = makeContext(undefined, { runtime: {
    researchChatEndpoint: 'https://rms-research-chat.example.workers.dev/',
    chatEndpoint: 'https://rms-research-chat.example.workers.dev/'
  } });
  assert.equal(ctx.window.RMSAI.effectiveChatEndpoint(), 'https://rms-research-chat.example.workers.dev/');
  assert.equal(ctx.window.RMSAI.chatConfigured(), true);
});
