import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'configure-chat-endpoint.mjs');

async function tempRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), 'rms-endpoint-test-'));
  await mkdir(path.join(dir, 'assets'));
  await writeFile(path.join(dir, 'assets', 'runtime-config.js'), 'window.RMS_RUNTIME_CONFIG={};\n', 'utf8');
  return dir;
}

test('configure-chat-endpoint writes only a clean public HTTPS endpoint and release version', async () => {
  const dir = await tempRepo();
  try {
    const result = spawnSync(process.execPath, [script, 'https://rms-research-chat.example.workers.dev/'], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const output = await readFile(path.join(dir, 'assets', 'runtime-config.js'), 'utf8');
    assert.match(output, /version: '2\.15\.0'|"version": "2\.15\.0"/);
    assert.match(output, /https:\/\/rms-research-chat\.example\.workers\.dev\//);
    assert.match(output, /researchChatEndpoint/);
    assert.match(output, /chatEndpoint/);
    assert.doesNotMatch(output, /OPENAI_API_KEY|RMS_CHAT_ACCESS_CODE|Bearer/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('configure-chat-endpoint rejects insecure or credential-bearing production URLs', async () => {
  const dir = await tempRepo();
  try {
    for (const endpoint of [
      'http://rms-chat.example/api/research-chat',
      'https://user:pass@rms-chat.example/api/research-chat',
      'https://rms-chat.example/api/research-chat?token=secret',
      'https://rms-chat.example/#fragment',
      'javascript:alert(1)'
    ]) {
      const result = spawnSync(process.execPath, [script, endpoint], { cwd: dir, encoding: 'utf8' });
      assert.notEqual(result.status, 0, endpoint);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});


test('configure-chat-endpoint accepts only the free workers.dev production root', async () => {
  const dir = await tempRepo();
  try {
    const ok = spawnSync(process.execPath, [script, 'https://rms-research-chat-free.example.workers.dev/'], { cwd: dir, encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stderr);
    const output = await readFile(path.join(dir, 'assets', 'runtime-config.js'), 'utf8');
    assert.match(output, /freeEdition/);
    assert.match(output, /2\.15\.0/);
    for (const endpoint of [
      'https://rms-chat.example/api/research-chat',
      'https://rms-research-chat-free.example.workers.dev/custom-path'
    ]) {
      const bad = spawnSync(process.execPath, [script, endpoint], { cwd: dir, encoding: 'utf8' });
      assert.notEqual(bad.status, 0, endpoint);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
