import { mkdir, writeFile } from 'node:fs/promises';

const backend = String(process.env.RMS_CHAT_BACKEND_URL || '').trim().replace(/\/$/, '');
if (!/^https:\/\//i.test(backend)) {
  throw new Error('RMS_CHAT_BACKEND_URL must be an https:// URL.');
}
const endpoint = `${backend}/api/research-chat`;
await mkdir('_site/assets', { recursive: true });
const js = `window.RMS_RUNTIME_CONFIG = Object.freeze(${JSON.stringify({ version: '2.14', researchChatEndpoint: endpoint }, null, 2)});\n`;
await writeFile('_site/assets/runtime-config.js', js, 'utf8');
console.log(`Configured Research Chat endpoint for Pages: ${endpoint}`);
