import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const helper = readFileSync('scripts/deploy-cloudflare-research-chat.mjs', 'utf8');
const workerPkg = JSON.parse(readFileSync('backend/cloudflare-workers-ai/package.json', 'utf8'));
const wrangler = JSON.parse(readFileSync('backend/cloudflare-workers-ai/wrangler.jsonc', 'utf8'));

test('free deployment helper passes its offline package preflight', () => {
  const result = spawnSync(process.execPath, ['scripts/deploy-cloudflare-research-chat.mjs', '--check'], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /CLOUDFLARE FREE DEPLOYMENT HELPER CHECK: PASS/);
});

test('first deployment requires only class code and never asks for an AI API key', () => {
  assert.match(helper, /--secrets-file/);
  assert.match(helper, /JSON\.stringify\(\{ RMS_CHAT_ACCESS_CODE: classCode \}\)/);
  assert.doesNotMatch(helper, /OPENAI_API_KEY|openaiKey|Bearer/);
  assert.match(helper, /mode: 0o600/);
  assert.match(helper, /await rm\(tempDir, \{ recursive: true, force: true \}\)/);
});

test('helper makes zero-cost intent explicit before account deployment', () => {
  assert.match(helper, /Cloudflare Workers FREE account/i);
  assert.match(helper, /do not upgrade Workers/i);
  assert.match(helper, /do not enable prepaid AI Gateway billing/i);
  assert.match(helper, /Confirm you intend to keep this deployment on Cloudflare Workers Free/i);
});

test('worker config binds Workers AI and locks the verified free model', () => {
  assert.equal(wrangler.ai?.binding, 'AI');
  assert.deepEqual(wrangler.secrets?.required, ['RMS_CHAT_ACCESS_CODE']);
  assert.equal(wrangler.vars?.RMS_AI_MODEL, '@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  assert.equal(wrangler.vars?.RMS_ALLOWED_ORIGINS, 'https://gmoon-code.github.io');
  const spec = String(workerPkg.devDependencies?.wrangler || '');
  assert.match(spec, /4\.102\.0/);
  assert.doesNotMatch(helper, /--temporary/);
});
