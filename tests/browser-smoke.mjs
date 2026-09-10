import { readFile, access, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import process from 'node:process';

const candidates = process.env.CHROMIUM ? [process.env.CHROMIUM] : ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'];
let browser = '';
for (const candidate of candidates) {
  try { await access(candidate); browser = candidate; break; } catch {}
}
if (!browser) {
  console.log('BROWSER ADAPTER SMOKE: SKIP (Chromium/Chrome not found)');
  process.exit(0);
}

const probe = createServer();
await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
const debugPort = probe.address().port;
await new Promise(resolve => probe.close(resolve));

const profile = await mkdtemp(join(tmpdir(), 'rms-browser-smoke-'));
const child = spawn(browser, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run',
  `--remote-debugging-address=127.0.0.1`,`--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,'about:blank'
], { stdio: ['ignore','ignore','ignore'] });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitForJson(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let ws;
let nextId = 1;
const pending = new Map();
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    const timer = setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }
    }, 8000);
    pending.get(id).timer = timer;
  });
}

try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const targets = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
  const target = targets.find(item => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) throw new Error('No Chromium page target available.');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once:true }); ws.addEventListener('error', reject, { once:true }); });
  ws.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const entry = pending.get(msg.id); pending.delete(msg.id); clearTimeout(entry.timer);
    if (msg.error) entry.reject(new Error(JSON.stringify(msg.error))); else entry.resolve(msg.result);
  });
  await cdp('Runtime.enable');

  const adapter = await readFile(new URL('../assets/ai-adapter.js', import.meta.url), 'utf8');
  const bootstrap = `
    window.RMS_RUNTIME_CONFIG = Object.freeze({version:'2.15.0',researchChatEndpoint:'https://rms-research-chat-free.example.workers.dev/',chatEndpoint:'https://rms-research-chat-free.example.workers.dev/'});
    window.__requests = [];
    window.fetch = async function(url, options={}) {
      const body = options.body ? JSON.parse(options.body) : null;
      window.__requests.push({url:String(url),method:options.method||'GET',headers:{...(options.headers||{})},body,credentials:options.credentials,cache:options.cache});
      return {ok:true,status:200,async json(){return {ok:true,message:'Check the relationship between the variable and the way it is measured.',response_kind:'guided_reasoning',scaffold_level_used:2,counts_as_stage_support:true,stage_id:7,questions_for_student:['How will you measure the outcome?'],direct_completion_guard:{student_attempt_present:true,direct_answer_withheld:false,reason:''},citations:[],safety:{status:'clear',reason:''},prohibited_completion:{did_not_replace_student_work:true,did_not_invent_sources:true,did_not_invent_data:true,did_not_calculate_unvalidated_statistics:true}};}};
    };
    ${adapter}
  `;
  const loaded = await cdp('Runtime.evaluate', { expression: bootstrap, returnByValue: true });
  if (loaded.exceptionDetails) throw new Error('Adapter bootstrap threw in Chromium.');

  const testExpression = `(async()=>{
    const fail = m => { throw new Error(m); };
    const code='browser-test-code-123456789';
    RMSAI.setAccessCode(code);
    const on=await RMSAI.chat({mode:'helper_chat',message:'Help student@example.com at +82 10-1234-5678 improve my question.',conversation_history:[{role:'assistant',message:'Earlier contact old@example.com'}],project_context:{stage_id:7,stage_title:'Literature synthesis',current_field:{key:'rawDataset',label:'Raw dataset',value:'Alice,91\\nBob,83'},data:{finalRQ:'Does light affect radish growth?',rawDataset:'Alice,91\\nBob,83',studentEmail:'student@example.com'},literature_sources:[{id:'S1',title:'A verified project source',citation:'Author. Article.',verified:true},{id:'S2',title:'An unverified source',citation:'Other. Article.',verified:false}]}});
    if(on.message!==on.answer) fail('legacy response message alias was not normalized');
    if(on.scaffold_level_used!==2||on.counts_as_stage_support!==true) fail('legacy scaffold fields were not retained');
    const first=window.__requests[0];
    if(!first||first.method!=='POST') fail('chat did not send POST');
    if(first.headers['X-RMS-Chat-Code']!==code) fail('class code missing from auth header');
    if(JSON.stringify(first.body).includes(code)) fail('class code leaked into JSON body');
    if(JSON.stringify(first.body).includes('student@example.com')||JSON.stringify(first.body).includes('old@example.com')||JSON.stringify(first.body).includes('10-1234-5678')) fail('obvious email/phone text crossed browser network boundary');
    if(first.credentials!=='omit'||first.cache!=='no-store') fail('fetch privacy/cache settings are wrong');
    if(first.body.context.focused_field.value!=='[omitted for privacy]') fail('sensitive focused field was not omitted before network');
    const serialized=JSON.stringify(first.body.context);
    if(serialized.includes('Alice,91')||serialized.includes('student@example.com')) fail('raw/identifier content crossed browser network boundary');
    if(!serialized.includes('Does light affect radish growth?')) fail('safe project context was lost');
    if(!serialized.includes('S1')||serialized.includes('S2')) fail('verified-source browser allowlist is wrong');
    await RMSAI.chat({mode:'helper_chat',message:'Explain variables generally.',use_project_context:false,project_context:{stage_id:9,data:{finalRQ:'THIS MUST NOT BE SENT'},literature_sources:[{id:'PRIVATE',title:'Must not be sent',verified:true}]}});
    const second=window.__requests[1];
    const neutral=second?.body?.context;
    if(!neutral||neutral.stage.id!==0||neutral.focused_field.value!=='') fail('context-off stage/focused field was not neutralized');
    if(Object.keys(neutral.project.summary).length||neutral.project.verified_sources.length) fail('context-off project information crossed network');
    if(JSON.stringify(second.body).includes('THIS MUST NOT BE SENT')||JSON.stringify(second.body).includes('PRIVATE')) fail('context-off payload leaked project content');
    return {pass:true,requests:window.__requests.length};
  })()`;
  const result = await cdp('Runtime.evaluate', { expression: testExpression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Chromium smoke expression failed.');
  if (result.result?.value?.pass !== true || result.result?.value?.requests !== 2) throw new Error(`Unexpected Chromium smoke result: ${JSON.stringify(result.result?.value)}`);
  console.log('BROWSER ADAPTER SMOKE: PASS');
} catch (error) {
  console.error('BROWSER ADAPTER SMOKE: FAIL');
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}

  const waitForChildClose = async (timeoutMs) => {
    if (child.exitCode != null) return;
    await Promise.race([
      new Promise(resolve => child.once('close', resolve)),
      sleep(timeoutMs)
    ]);
  };

  if (child.exitCode == null) {
    try { child.kill('SIGTERM'); } catch {}
    await waitForChildClose(1200);
  }
  if (child.exitCode == null) {
    try { child.kill('SIGKILL'); } catch {}
    await waitForChildClose(1200);
  }

  // Chromium may leave profile files briefly while child processes finish
  // shutting down. fs.rm's retry controls make cleanup deterministic instead
  // of turning a successful browser test into a transient ENOTEMPTY failure.
  await rm(profile, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 150
  });
}
