import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Research Chat Ask uses the same ready state exposed by the UI', async () => {
  const source = await readFile(
    new URL('../assets/ai-helper-ui.js', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /return \{kind:"ready",canAsk:true/,
    'Research Chat must expose a ready state after successful connection.'
  );

  assert.match(
    source,
    /const st=status\(\);if\(st\.kind!=="ready"\)return;/,
    'The Ask handler must permit sending when Research Chat is ready.'
  );

  assert.doesNotMatch(
    source,
    /st\.kind!=="online"/,
    'The obsolete online-state send gate must not return.'
  );

  assert.match(
    source,
    /id\("aiHelperForm"\)\.onsubmit=async e=>\{e\.preventDefault\(\);await send\(\)\}/,
    'The Ask form must remain wired to send().'
  );
});
