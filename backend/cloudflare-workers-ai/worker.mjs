// Research Methods Studio v2.15.0 FREE Research Chat
// Cloudflare Workers AI adapter. No OpenAI API key or paid model provider is used.
// RMS_CHAT_ACCESS_CODE is the only required Worker secret.

import {
  VERSION,
  authState,
  parseAllowedOrigins,
  route
} from '../../api/research-chat.js';

const RATE_LIMIT_MESSAGE = 'Research Chat is receiving too many requests. Wait a moment and try again.';

function allowedOrigin(request, env) {
  const origin = String(request.headers.get('origin') || '').trim();
  return parseAllowedOrigins(env).includes(origin) ? origin : '';
}

function responseHeaders(request, env, extra = {}) {
  const origin = allowedOrigin(request, env);
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin',
    ...extra
  });
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function rateLimitResponse(request, env) {
  return new Response(JSON.stringify({ error: RATE_LIMIT_MESSAGE }), {
    status: 429,
    headers: responseHeaders(request, env, { 'Retry-After': '60' })
  });
}

function configurationResponse(request, env) {
  return new Response(JSON.stringify({ error: 'Chat service is not configured.' }), {
    status: 503,
    headers: responseHeaders(request, env)
  });
}

function limiterConfigured(limiter) {
  return Boolean(limiter && typeof limiter.limit === 'function');
}

function rateLimitersConfigured(env) {
  return limiterConfigured(env?.AUTH_RATE_LIMITER)
    && limiterConfigured(env?.SESSION_RATE_LIMITER)
    && limiterConfigured(env?.CLASS_RATE_LIMITER);
}

function aiConfigured(env) {
  return Boolean(env?.AI && typeof env.AI.run === 'function');
}

function rateKeyPart(value, fallback = 'missing') {
  const text = String(value || '').trim();
  return /^[A-Za-z0-9_.:-]{1,160}$/.test(text) ? text : fallback;
}

async function applyRateLimits(request, env) {
  if (request.method === 'OPTIONS') return null;
  if (!allowedOrigin(request, env)) return null;
  if (!rateLimitersConfigured(env) || !aiConfigured(env)) return configurationResponse(request, env);

  const auth = authState(request, env);
  const ip = rateKeyPart(request.headers.get('cf-connecting-ip'), 'unknown-ip');

  if (auth.configured && !auth.ok) {
    const result = await env.AUTH_RATE_LIMITER.limit({ key: `auth:${ip}` });
    return result?.success === false ? rateLimitResponse(request, env) : null;
  }
  if (!auth.configured) return null;

  const session = rateKeyPart(request.headers.get('x-rms-client-session'), `ip:${ip}`);
  const [sessionResult, classResult] = await Promise.all([
    env.SESSION_RATE_LIMITER.limit({ key: `session:${session}` }),
    env.CLASS_RATE_LIMITER.limit({ key: 'research-methods-studio-class' })
  ]);
  if (sessionResult?.success === false || classResult?.success === false) return rateLimitResponse(request, env);
  return null;
}

function createWorker() {
  return {
    async fetch(request, env) {
      const limited = await applyRateLimits(request, env);
      if (limited) return limited;
      const aiRun = aiConfigured(env) ? (model, input) => env.AI.run(model, input) : undefined;
      return route(request, { env, aiRun });
    }
  };
}

const worker = createWorker();
export default worker;
export {
  VERSION,
  RATE_LIMIT_MESSAGE,
  aiConfigured,
  allowedOrigin,
  applyRateLimits,
  createWorker,
  rateLimitersConfigured
};
