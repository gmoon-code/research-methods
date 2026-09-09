import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('student shell exposes route controls without restoring the crowded toolbar', async () => {
  const html = await read('index.html');
  assert.match(html, /id="currentStageBtn"/);
  assert.match(html, /id="helpMenuBtn"/);
  assert.match(html, /id="researchChatBtn"[^>]*>Chat</);
  assert.match(html, /id="moreMenuBtn"/);
  assert.match(html, /id="phaseNav"/);
  assert.match(html, /id="progressPct"/);
});

test('privacy notice is visible in Research Chat', async () => {
  const js = await read('assets/research-chat.js');
  assert.match(js, /Your question and recent Chat messages go to the secure class Chat service/);
  assert.match(js, /Raw datasets are excluded/);
  assert.match(js, /Use my current project context/);
});

test('class code and chat history are kept outside the project JSON', async () => {
  const js = await read('assets/research-chat.js');
  assert.match(js, /sessionStorage\.setItem\(CODE_KEY/);
  assert.match(js, /sessionStorage\.setItem\(HISTORY_KEY/);
  assert.doesNotMatch(js, /localStorage\.setItem\(CODE_KEY/);
  assert.doesNotMatch(js, /localStorage\.setItem\(HISTORY_KEY/);
});

test('context-off mode sends no project-specific context', async () => {
  const js = await read('assets/research-chat.js');
  assert.match(js, /if \(!useProjectContext\)/);
  assert.match(js, /stage: \{ id: 0, title: '' \}/);
  assert.match(js, /verified_sources: \[\]/);
});

test('raw data field names are privacy-blocked in the browser contract', async () => {
  const js = await read('assets/research-chat.js');
  assert.match(js, /raw\|dataset\|data\[_ -\]\?table/);
  assert.match(js, /\[omitted for privacy\]/);
});

test('Word export uses a .doc filename and Word-compatible MIME type', async () => {
  const js = await read('assets/doc-export.js');
  assert.match(js, /\.doc`/);
  assert.match(js, /application\/msword/);
});

test('legacy arbitrary AI endpoint is disabled', async () => {
  const js = await read('assets/ai-adapter.js');
  assert.match(js, /legacy arbitrary-endpoint AI Coach is intentionally disabled/);
  assert.match(js, /function enabled\(\) \{\s*return false;/s);
});

test('browser source contains no OpenAI API secret variable', async () => {
  const files = ['index.html', 'assets/runtime-config.js', 'assets/research-chat.js', 'assets/doc-export.js', 'assets/v214-shell.js', 'assets/ai-adapter.js'];
  const contents = await Promise.all(files.map(read));
  for (const content of contents) {
    assert.doesNotMatch(content, /OPENAI_API_KEY/);
    assert.doesNotMatch(content, /sk-[A-Za-z0-9_-]{20,}/);
  }
});
