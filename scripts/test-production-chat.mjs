import process from 'node:process';
import { randomUUID } from 'node:crypto';

const endpoint = String(process.env.RMS_CHAT_ENDPOINT || '').trim();
const code = String(process.env.RMS_CHAT_ACCESS_CODE || '').trim();
const origin = String(process.env.RMS_CHAT_ORIGIN || '').trim();
const EXPECTED_VERSION = '2.15.0';
const EXPECTED_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function fail(message) {
  console.error(`PRODUCTION FREE RESEARCH CHAT SMOKE TEST: FAIL\n${message}`);
  process.exit(1);
}
function safeEndpoint(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
if (!safeEndpoint(endpoint)) fail('RMS_CHAT_ENDPOINT must be a clean HTTPS URL.');
if (code.length < 16 || code.length > 256) fail('RMS_CHAT_ACCESS_CODE must be 16-256 characters.');
if (!/^https:\/\//.test(origin)) fail('RMS_CHAT_ORIGIN must be the exact HTTPS browser origin.');

const session = `smoketest_${randomUUID().replace(/-/g, '')}`;
const headers = { Origin: origin, 'X-RMS-Chat-Code': code, 'X-RMS-Client-Session': session, Accept: 'application/json' };
async function timedFetch(url, options, timeoutMs = 45_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal, redirect: 'error' }); }
  catch (error) { if (error?.name === 'AbortError') fail(`Request timed out after ${timeoutMs} ms.`); throw error; }
  finally { clearTimeout(timer); }
}

const noOrigin = await timedFetch(endpoint, { method: 'GET', headers: { 'X-RMS-Chat-Code': code, 'X-RMS-Client-Session': session, Accept: 'application/json' } });
if (noOrigin.status !== 403) fail(`Missing-Origin check expected 403 but received ${noOrigin.status}.`);
const wrong = await timedFetch(endpoint, { method: 'GET', headers: { ...headers, 'X-RMS-Chat-Code': `${code}__wrong` } });
if (wrong.status !== 401) fail(`Wrong-code check expected 401 but received ${wrong.status}.`);

const health = await timedFetch(endpoint, { method: 'GET', headers });
const healthBody = await health.json().catch(() => ({}));
if (!health.ok || healthBody.ok !== true || healthBody.version !== EXPECTED_VERSION) fail(`Health check failed (${health.status}): ${JSON.stringify(healthBody)}`);
if (healthBody.model !== EXPECTED_MODEL) fail(`Unexpected model: ${healthBody.model}`);
if (healthBody.provider !== 'cloudflare-workers-ai' || healthBody.free_edition !== true) fail('Health did not report the zero-cost Cloudflare Workers AI edition.');
if (healthBody.configured !== true || healthBody.requires_access_code !== true) fail('Health compatibility flags are missing.');
console.log(`Health PASS · v${healthBody.version} · FREE · ${healthBody.model}`);

const payload = {
  question: 'Explain the difference between a variable and an operational definition in plain language. Do not cite sources.',
  history: [], mode: 'explain',
  context: { stage: { id: 0, title: '' }, focused_field: { key: '', label: '', value: '' }, project: { summary: {}, verified_sources: [] } }
};
const response = await timedFetch(endpoint, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
const body = await response.json().catch(() => ({}));
if (response.status === 429 && /free daily ai allowance/i.test(String(body.error || ''))) fail('Cloudflare free daily Workers AI allowance is currently exhausted. Wait for the daily reset and rerun this test.');
if (!response.ok) fail(`Real Workers AI request failed (${response.status}): ${JSON.stringify(body)}`);
if (body.ok !== true || typeof body.answer !== 'string' || body.answer.trim().length < 20) fail('Response contract did not include a usable normalized answer.');
if (body.message !== body.answer) fail('Legacy message alias is missing or inconsistent.');
if (!Array.isArray(body.next_steps) || !Array.isArray(body.questions_for_student) || !Array.isArray(body.citations)) fail('Response contract arrays are missing.');
if (body.scaffold?.stage_id !== 0 || body.scaffold?.mode !== 'explain') fail('Server-controlled scaffold metadata is incorrect.');
if (body.stage_id !== 1 || body.scaffold_level_used !== 0 || body.counts_as_stage_support !== false) fail('Legacy neutral-context scaffold aliases are incorrect.');
if (body.citations.length !== 0) fail('Context-off smoke test unexpectedly returned a citation.');
if (!body.direct_completion_guard || !body.safety || !body.prohibited_completion) fail('Structured safety fields are missing.');

console.log('Real Cloudflare Workers AI response PASS');
console.log('PRODUCTION FREE RESEARCH CHAT SMOKE TEST: PASS');
