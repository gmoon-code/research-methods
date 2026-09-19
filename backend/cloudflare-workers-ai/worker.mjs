// Research Methods Studio v3 development Worker entry.
// Runtime-only Durable Object exports live here. Node regression tests use worker-core.mjs.

import {
  ContentReleaseCoordinator
} from "./content-durable-object.mjs";

import {
  VERSION,
  RATE_LIMIT_MESSAGE,
  aiConfigured,
  allowedOrigin,
  applyRateLimits,
  createWorker,
  rateLimitersConfigured
} from "./worker-core.mjs";

const worker =
  createWorker();

export default worker;

export {
  VERSION,
  RATE_LIMIT_MESSAGE,
  ContentReleaseCoordinator,
  aiConfigured,
  allowedOrigin,
  applyRateLimits,
  createWorker,
  rateLimitersConfigured
};
