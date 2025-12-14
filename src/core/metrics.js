// src/core/metrics.js

// Track when this instance started
const startedAt = new Date();

// Internal state
const state = {
  http: {
    total: 0,
    failures: 0,
    totalLatencyMs: 0,
    perRoute: {} // route -> { total, failures, totalLatencyMs }
  },
  openai: {
    total: 0,
    failures: 0,
    totalLatencyMs: 0,
    lastError: null,
    lastSuccessAt: null
  }
};

// ---------------- HTTP METRICS ----------------

/**
 * Record a HTTP request.
 * @param {string} route - Express route path or URL.
 * @param {number} latencyMs - Duration in milliseconds.
 * @param {boolean} ok - Whether the request was successful (status < 500).
 */
function recordHttp(route, latencyMs, ok) {
  state.http.total += 1;
  state.http.totalLatencyMs += latencyMs;
  if (!ok) state.http.failures += 1;

  if (!state.http.perRoute[route]) {
    state.http.perRoute[route] = {
      total: 0,
      failures: 0,
      totalLatencyMs: 0
    };
  }

  const r = state.http.perRoute[route];
  r.total += 1;
  r.totalLatencyMs += latencyMs;
  if (!ok) r.failures += 1;
}

// ---------------- OPENAI METRICS ----------------

/**
 * Record an OpenAI API call.
 * @param {number} latencyMs
 * @param {boolean} ok
 * @param {string} [errorMessage]
 */
function recordOpenAI(latencyMs, ok, errorMessage) {
  state.openai.total += 1;
  state.openai.totalLatencyMs += latencyMs;

  if (!ok) {
    state.openai.failures += 1;
    state.openai.lastError = {
      message: errorMessage || null,
      at: new Date().toISOString()
    };
  } else {
    state.openai.lastSuccessAt = new Date().toISOString();
  }
}

/**
 * Get a snapshot of current metrics.
 */
function snapshot() {
  const now = Date.now();
  const uptimeMs = now - startedAt.getTime();

  const httpAvg =
    state.http.total === 0 ? 0 : state.http.totalLatencyMs / state.http.total;

  const openaiAvg =
    state.openai.total === 0
      ? 0
      : state.openai.totalLatencyMs / state.openai.total;

  const perRoute = {};
  for (const [route, r] of Object.entries(state.http.perRoute)) {
    perRoute[route] = {
      total: r.total,
      failures: r.failures,
      avgLatencyMs: r.total === 0 ? 0 : r.totalLatencyMs / r.total
    };
  }

  return {
    startedAt: startedAt.toISOString(),
    uptimeMs,
    http: {
      total: state.http.total,
      failures: state.http.failures,
      avgLatencyMs: httpAvg,
      perRoute
    },
    openai: {
      total: state.openai.total,
      failures: state.openai.failures,
      avgLatencyMs: openaiAvg,
      lastError: state.openai.lastError,
      lastSuccessAt: state.openai.lastSuccessAt
    }
  };
}

module.exports = {
  recordHttp,
  recordOpenAI,
  snapshot
};
