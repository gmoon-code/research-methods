import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const allowLocalhost = args.includes('--allow-localhost');
const filtered = args.filter(arg => arg !== '--allow-localhost');
const endpointArg = filtered[0];

if (!endpointArg) {
  console.error('Usage: node scripts/configure-chat-endpoint.mjs <https://research-chat-endpoint> [--allow-localhost]');
  process.exit(2);
}

let url;
try {
  url = new URL(endpointArg);
} catch {
  console.error('The Chat endpoint is not a valid URL.');
  process.exit(2);
}

const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
if (url.protocol !== 'https:' && !(allowLocalhost && local && url.protocol === 'http:')) {
  console.error('Production Chat endpoints must use HTTPS.');
  process.exit(2);
}
if (!local && !url.hostname.endsWith('.workers.dev')) {
  console.error('The v2.15.0 FREE production endpoint must be the Cloudflare workers.dev URL created by the included Worker.');
  process.exit(2);
}
if (!local && url.pathname !== '/') {
  console.error('The v2.15.0 FREE Worker endpoint must use the workers.dev origin root with no custom path.');
  process.exit(2);
}
if (url.username || url.password || url.search || url.hash) {
  console.error('The Chat endpoint must not contain credentials, a query string, or a fragment.');
  process.exit(2);
}
// Keep a root slash when the provider uses the Worker origin itself as the endpoint.
// For non-root paths, normalize only redundant trailing slashes.
if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
const endpoint = url.toString();
const target = path.resolve(process.cwd(), 'assets', 'runtime-config.js');
const content = `window.RMS_RUNTIME_CONFIG = Object.freeze(${JSON.stringify({
  version: '2.15.0',
  freeEdition: true,
  researchChatEndpoint: endpoint,
  chatEndpoint: endpoint
}, null, 2)});\n`;
await writeFile(target, content, 'utf8');
console.log(`Configured public Research Chat endpoint: ${endpoint}`);
console.log(`Updated: ${target}`);
