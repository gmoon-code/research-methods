#!/usr/bin/env node
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const WORKER_DIR = join(ROOT, 'backend', 'cloudflare-workers-ai');
const WRANGLER_MIN = [4, 102, 0];
const ORIGIN = 'https://gmoon-code.github.io';
const FREE_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function fail(message, code = 1) {
  console.error(`\nCLOUDFLARE FREE RESEARCH CHAT DEPLOYMENT: FAIL\n${message}`);
  process.exit(code);
}
function parseVersion(text) {
  const match = String(text || '').match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}
function versionAtLeast(actual, minimum) {
  for (let i = 0; i < 3; i += 1) {
    if (actual[i] > minimum[i]) return true;
    if (actual[i] < minimum[i]) return false;
  }
  return true;
}
function command(name) { return process.platform === 'win32' ? `${name}.cmd` : name; }
function runCapture(exe, args, cwd = ROOT, env = process.env) {
  return spawnSync(exe, args, { cwd, env, encoding: 'utf8', windowsHide: true });
}
function runInteractive(exe, args, cwd = ROOT, env = process.env) {
  const result = spawnSync(exe, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
async function hiddenPrompt(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Secret entry requires Terminal, PowerShell, or Command Prompt.');
  }
  process.stdout.write(label);
  const stdin = process.stdin;
  const wasRaw = Boolean(stdin.isRaw);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  return await new Promise((resolvePrompt, rejectPrompt) => {
    let value = '';
    const cleanup = () => { stdin.off('data', onData); stdin.setRawMode(wasRaw); process.stdout.write('\n'); };
    const onData = chunk => {
      for (const ch of String(chunk)) {
        if (ch === '\u0003') { cleanup(); rejectPrompt(new Error('Cancelled.')); return; }
        if (ch === '\r' || ch === '\n') { cleanup(); resolvePrompt(value); return; }
        if (ch === '\u007f' || ch === '\b') { value = value.slice(0, -1); continue; }
        if (ch >= ' ') value += ch;
      }
    };
    stdin.on('data', onData);
  });
}
async function yesNo(question, defaultYes = true) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(question + (defaultYes ? ' [Y/n] ' : ' [y/N] '))).trim().toLowerCase();
    if (!answer) return defaultYes;
    return answer === 'y' || answer === 'yes';
  } finally { rl.close(); }
}
function extractWorkerUrl(text) {
  const matches = String(text || '').match(/https:\/\/[A-Za-z0-9.-]+\.workers\.dev(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?/g) || [];
  return matches.length ? matches[matches.length - 1].replace(/[),.;]+$/, '') : '';
}

async function packagePreflight() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(nodeMajor) || nodeMajor < 20) throw new Error(`Node.js 20+ is required; detected ${process.versions.node}.`);
  for (const path of [
    join(WORKER_DIR, 'worker.mjs'), join(WORKER_DIR, 'wrangler.jsonc'), join(WORKER_DIR, 'package.json'),
    join(ROOT, 'scripts', 'configure-chat-endpoint.mjs'), join(ROOT, 'scripts', 'test-production-chat.mjs'),
    join(ROOT, 'assets', 'runtime-config.js')
  ]) await readFile(path);

  const config = JSON.parse(await readFile(join(WORKER_DIR, 'wrangler.jsonc'), 'utf8'));
  const requiredSecrets = new Set(config?.secrets?.required || []);
  if (requiredSecrets.size !== 1 || !requiredSecrets.has('RMS_CHAT_ACCESS_CODE')) {
    throw new Error('wrangler.jsonc must require only RMS_CHAT_ACCESS_CODE. The free edition must not require an AI API key.');
  }
  if (config?.ai?.binding !== 'AI') throw new Error('wrangler.jsonc must declare the Cloudflare Workers AI binding as AI.');
  if (config?.vars?.RMS_AI_MODEL !== FREE_MODEL) throw new Error(`RMS_AI_MODEL must remain ${FREE_MODEL} for this verified free release.`);
  if (config?.vars?.RMS_ALLOWED_ORIGINS !== ORIGIN) throw new Error(`RMS_ALLOWED_ORIGINS must be exactly ${ORIGIN}.`);
  const rateNames = new Set((config.ratelimits || []).map(item => item?.name));
  for (const name of ['AUTH_RATE_LIMITER', 'SESSION_RATE_LIMITER', 'CLASS_RATE_LIMITER']) {
    if (!rateNames.has(name)) throw new Error(`Missing rate-limit binding: ${name}`);
  }
  const pkg = JSON.parse(await readFile(join(WORKER_DIR, 'package.json'), 'utf8'));
  const wranglerVersion = parseVersion(String(pkg?.devDependencies?.wrangler || ''));
  if (!wranglerVersion || !versionAtLeast(wranglerVersion, WRANGLER_MIN)) throw new Error('Wrangler 4.102.0+ is required.');
  console.log('PASS zero-cost package preflight');
  console.log(`PASS Workers AI binding: AI`);
  console.log(`PASS free-model release lock: ${FREE_MODEL}`);
  console.log('PASS only RMS_CHAT_ACCESS_CODE is secret');
  console.log(`PASS GitHub Pages origin: ${ORIGIN}`);
}

async function main() {
  const checkOnly = process.argv.slice(2).includes('--check');
  await packagePreflight();
  if (checkOnly) { console.log('CLOUDFLARE FREE DEPLOYMENT HELPER CHECK: PASS'); return; }

  console.log('\nZERO-COST REQUIREMENT');
  console.log('Use a Cloudflare Workers FREE account. Do not upgrade Workers and do not enable prepaid AI Gateway billing.');
  console.log('On Workers Free, Cloudflare currently provides a daily Workers AI free allocation; when exhausted, AI operations fail instead of creating overage charges.');
  if (!(await yesNo('Confirm you intend to keep this deployment on Cloudflare Workers Free with no paid AI billing.', false))) {
    throw new Error('Deployment cancelled. The v2.15.0 FREE release is intended for a zero-cost Cloudflare Workers Free setup.');
  }

  const npm = command('npm');
  const npx = command('npx');
  console.log('\nInstalling package-scoped Wrangler...');
  if (runInteractive(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund'], WORKER_DIR) !== 0) throw new Error('npm install failed.');

  const versionResult = runCapture(npx, ['wrangler', '--version'], WORKER_DIR);
  const version = parseVersion(`${versionResult.stdout || ''}\n${versionResult.stderr || ''}`);
  if (versionResult.status !== 0 || !version || !versionAtLeast(version, WRANGLER_MIN)) throw new Error('Wrangler version check failed.');
  console.log(`PASS Wrangler ${version.join('.')}`);

  let who = runCapture(npx, ['wrangler', 'whoami'], WORKER_DIR);
  if (who.status !== 0) {
    console.log('\nCloudflare sign-in is required. A browser window will open.');
    if (runInteractive(npx, ['wrangler', 'login', '--use-keyring'], WORKER_DIR) !== 0) throw new Error('Cloudflare login failed.');
    who = runCapture(npx, ['wrangler', 'whoami'], WORKER_DIR);
  }
  if (who.status !== 0) throw new Error('Wrangler is not authenticated.');

  const classCode = (await hiddenPrompt('Enter RMS_CHAT_ACCESS_CODE, 16-256 characters (input hidden): ')).trim();
  if (classCode.length < 16 || classCode.length > 256) throw new Error('RMS_CHAT_ACCESS_CODE must be 16-256 characters.');

  const tempDir = await mkdtemp(join(tmpdir(), 'rms-free-cloudflare-secret-'));
  const secretFile = join(tempDir, 'secrets.json');
  try {
    await writeFile(secretFile, JSON.stringify({ RMS_CHAT_ACCESS_CODE: classCode }), { encoding: 'utf8', mode: 0o600 });
    console.log('\nDeploying the free Workers AI backend...');
    const deployed = runCapture(npx, ['wrangler', 'deploy', '--strict', '--secrets-file', secretFile], WORKER_DIR);
    process.stdout.write(deployed.stdout || '');
    process.stderr.write(deployed.stderr || '');
    if (deployed.status !== 0) throw new Error('Cloudflare Worker deployment failed. runtime-config.js was not changed.');

    const endpoint = extractWorkerUrl(`${deployed.stdout || ''}\n${deployed.stderr || ''}`);
    if (!endpoint) throw new Error('Deployment succeeded, but the workers.dev endpoint could not be detected. Configure it manually with scripts/configure-chat-endpoint.mjs.');
    const configured = runCapture(process.execPath, [join(ROOT, 'scripts', 'configure-chat-endpoint.mjs'), endpoint], ROOT);
    process.stdout.write(configured.stdout || '');
    process.stderr.write(configured.stderr || '');
    if (configured.status !== 0) throw new Error('Worker deployed, but runtime-config.js could not be updated safely.');

    if (await yesNo('Run one real free Workers AI smoke test now?', true)) {
      const smokeEnv = { ...process.env, RMS_CHAT_ENDPOINT: endpoint, RMS_CHAT_ACCESS_CODE: classCode, RMS_CHAT_ORIGIN: ORIGIN };
      if (runInteractive(process.execPath, [join(ROOT, 'scripts', 'test-production-chat.mjs')], ROOT, smokeEnv) !== 0) {
        throw new Error('Worker deployed, but the production smoke test failed. Keep Research Chat NOT YET GO.');
      }
    } else {
      console.log('Smoke test skipped. Research Chat remains NOT YET GO.');
    }

    console.log('\nCLOUDFLARE FREE RESEARCH CHAT DEPLOYMENT: COMPLETE');
    console.log(`Worker endpoint: ${endpoint}`);
    console.log('Only assets/runtime-config.js changed locally. No model API key exists in this architecture.');
    console.log('Upload the website to GitHub only when you are ready.');
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch(error => fail(error?.message || String(error)));
