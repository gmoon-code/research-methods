import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RESPONSE_SCHEMA,
  authorize,
  buildOpenAIRequest,
  enforceVerifiedCitations,
  handleRequest,
  isAllowedOrigin,
  minimizeContext,
  redactPII
} from '../api/research-chat.js';

const BASE_ENV = {
  RMS_CHAT_ACCESS_CODE: 'class-2468',
  RMS_ALLOWED_ORIGINS: 'https://gmoon-code.github.io',
  OPENAI_API_KEY: 'test-key',
  OPENAI_MODEL: 'gpt-5.6-luna'
};

function req({ method = 'POST', url = '/api/research-chat', code = 'class-2468', origin = 'https://gmoon-code.github.io', body = {} } = {}) {
  return {
    method,
    url,
    headers: {
      origin,
      'x-rms-chat-code': code,
      'content-type': 'application/json'
    },
    body
  };
}

function res() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: '',
    setHeader(name, value) { headers[String(name).toLowerCase()] = value; },
    end(value = '') { this.body = String(value); }
  };
}

function json(response) {
  return JSON.parse(response.body || '{}');
}

test('authentication rejects a wrong class code and accepts the configured code', () => {
  assert.equal(authorize(req({ code: 'wrong' }), BASE_ENV).ok, false);
  assert.equal(authorize(req({ code: 'class-2468' }), BASE_ENV).ok, true);
});

test('origin restrictions allow the classroom site and reject an unrelated origin', () => {
  assert.equal(isAllowedOrigin('https://gmoon-code.github.io', BASE_ENV), true);
  assert.equal(isAllowedOrigin('https://example.com', BASE_ENV), false);
});

test('PII minimization removes obvious emails and phone numbers', () => {
  const cleaned = redactPII('Contact student@example.com or +82 10-1234-5678.');
  assert.match(cleaned, /\[email removed\]/);
  assert.match(cleaned, /\[phone removed\]/);
  assert.doesNotMatch(cleaned, /student@example\.com/);
  assert.doesNotMatch(cleaned, /10-1234-5678/);
});

test('context minimization excludes raw-data fields and unverified literature records', () => {
  const context = minimizeContext({
    stage: { id: 7, title: 'Literature synthesis' },
    focused_field: { key: 'rawDataset', label: 'Raw dataset', value: 'Alice,91\nBob,83' },
    project: {
      summary: {
        research_question: 'Does light affect growth?',
        rawData: 'participant rows',
        studentEmail: 'student@example.com'
      },
      verified_sources: [
        { id: 'S1', title: 'Verified', verified: true, finding: 'A useful finding.' },
        { id: 'S2', title: 'Unverified', verified: false, finding: 'Should not pass.' }
      ]
    }
  });
  assert.equal(context.focused_field.value, '[omitted for privacy]');
  assert.equal(context.project.summary.research_question, 'Does light affect growth?');
  assert.equal('rawData' in context.project.summary, false);
  assert.equal('studentEmail' in context.project.summary, false);
  assert.deepEqual(context.project.verified_sources.map(s => s.id), ['S1']);
});

test('Structured Outputs request uses a strict JSON schema', () => {
  const context = minimizeContext({ stage: { id: 3, title: 'Question' }, project: { summary: {}, verified_sources: [] } });
  const payload = buildOpenAIRequest({ question: 'Help me narrow this.', history: [], context, env: BASE_ENV });
  assert.equal(payload.text.format.type, 'json_schema');
  assert.equal(payload.text.format.strict, true);
  assert.deepEqual(payload.text.format.schema, RESPONSE_SCHEMA);
  assert.equal(payload.store, false);
});

test('unknown or unverified citations discard the model answer', () => {
  const result = enforceVerifiedCitations({
    answer: 'Unsupported source claim.',
    next_steps: [],
    citations: [{ source_id: 'S2', title: 'Unverified' }],
    scaffold: { stage_id: 6, focused_field: 'source', mode: 'feedback' }
  }, [{ id: 'S1', title: 'Verified', verified: true }]);
  assert.equal(result.status, 'source_verification_needed');
  assert.equal(result.citations.length, 0);
  assert.doesNotMatch(result.answer, /Unsupported source claim/);
});

test('verified citations are normalized to the verified project record', () => {
  const result = enforceVerifiedCitations({
    answer: 'Supported response.',
    next_steps: ['Check the evidence.'],
    citations: [{ source_id: 'S1', title: 'Model-provided title' }],
    scaffold: { stage_id: 6, focused_field: 'source', mode: 'feedback' }
  }, [{ id: 'S1', title: 'Canonical verified title', verified: true }]);
  assert.equal(result.status, 'ok');
  assert.equal(result.citations[0].title, 'Canonical verified title');
});

test('health check requires authentication', async () => {
  const response = res();
  await handleRequest(req({ method: 'GET', url: '/api/research-chat?health=1', code: 'wrong' }), response, { env: BASE_ENV });
  assert.equal(response.statusCode, 401);
  assert.deepEqual(json(response), { error: 'Invalid class code.' });
});

test('authenticated health check returns ok', async () => {
  const response = res();
  await handleRequest(req({ method: 'GET', url: '/api/research-chat?health=1' }), response, { env: BASE_ENV });
  assert.equal(response.statusCode, 200);
  assert.equal(json(response).ok, true);
});

test('missing server configuration fails closed', async () => {
  const response = res();
  await handleRequest(req(), response, { env: { RMS_ALLOWED_ORIGINS: 'https://gmoon-code.github.io' } });
  assert.equal(response.statusCode, 503);
  assert.deepEqual(json(response), { error: 'Chat service is not configured.' });
});

test('provider errors are sanitized before returning to students', async () => {
  const response = res();
  const fetchImpl = async () => ({
    ok: false,
    status: 500,
    async json() { return { error: { message: 'INTERNAL PROVIDER SECRET DIAGNOSTIC' } }; }
  });
  await handleRequest(req({ body: { question: 'What should I do?', context: {} } }), response, { env: BASE_ENV, fetchImpl });
  assert.equal(response.statusCode, 502);
  assert.deepEqual(json(response), { error: 'Chat service is temporarily unavailable.' });
  assert.doesNotMatch(response.body, /PROVIDER SECRET DIAGNOSTIC/);
});

test('successful request preserves stage and focused-field scaffold metadata', async () => {
  const response = res();
  let captured;
  const fetchImpl = async (_url, options) => {
    captured = JSON.parse(options.body);
    const modelResult = {
      answer: 'Your next check is whether the variables in the question are measurable.',
      next_steps: ['Define the outcome measure.'],
      citations: [],
      scaffold: { stage_id: 4, focused_field: 'finalRQ', mode: 'feedback' }
    };
    return {
      ok: true,
      status: 200,
      async json() {
        return { output: [{ content: [{ type: 'output_text', text: JSON.stringify(modelResult) }] }] };
      }
    };
  };
  await handleRequest(req({
    body: {
      question: 'Is my question measurable?',
      context: {
        stage: { id: 4, title: 'Research Question' },
        focused_field: { key: 'finalRQ', label: 'Final research question', value: 'Does light affect radish growth?' },
        project: { summary: { research_question: 'Does light affect radish growth?' }, verified_sources: [] }
      }
    }
  }), response, { env: BASE_ENV, fetchImpl });

  assert.equal(response.statusCode, 200);
  assert.equal(json(response).scaffold.stage_id, 4);
  assert.match(JSON.stringify(captured), /Final research question/);
  assert.equal(captured.text.format.type, 'json_schema');
});
