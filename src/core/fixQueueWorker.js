// src/core/fixQueueWorker.js
const {
  dueItems,
  markInFlight,
  markSent,
  markFailed,
  incrementAttempts,
  markDead,
  computeBackoffMs,
  addMs,
  nowIso,
} = require("./fixQueueStore");
const { postApplyFixQueue } = require("./makeClient");

const MAX_ATTEMPTS = 6;

async function processOne(item) {
  await markInFlight(item.id);

  // increment attempt count before trying
  const afterInc = await incrementAttempts(item.id);
  const attempt = Number(afterInc?.attempts || item.attempts || 0);

  const payload = {
    type: "aura_apply_fix_queue",
    version: "1.0",
    eventId: item.id,
    projectId: item.projectId,
    url: item.url,
    field: item.field,
    value: item.value,
    priority: item.priority,
    requestedBy: item.requestedBy,
    platform: item.platform,
    externalId: item.externalId,
    notes: item.notes,
    createdAt: item.createdAt,
    attempt,
    sentAt: nowIso(),
  };

  try {
    const result = await postApplyFixQueue(payload);
    await markSent(item.id);
    return { ok: true, id: item.id, result };
  } catch (err) {
    const msg = err?.message || "Unknown dispatch error";

    if (attempt >= MAX_ATTEMPTS) {
      await markDead(item.id, msg);
      return { ok: false, id: item.id, dead: true, error: msg };
    }

    const backoffMs = computeBackoffMs(attempt);
    const nextAttemptAt = addMs(nowIso(), backoffMs);
    await markFailed(item.id, msg, nextAttemptAt);

    return { ok: false, id: item.id, dead: false, error: msg, nextAttemptAt };
  }
}

async function runOnce(limit = 10) {
  const items = await dueItems(limit);
  const results = [];

  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const r = await processOne(item);
    results.push(r);
  }

  return {
    ok: true,
    processed: results.length,
    results,
  };
}

let intervalHandle = null;

function startFixQueueWorker() {
  const enabled = String(process.env.FIX_QUEUE_WORKER_ENABLED || "").toLowerCase() === "true";
  if (!enabled) return;

  if (intervalHandle) return;

  const intervalMs = Number(process.env.FIX_QUEUE_WORKER_INTERVAL_MS || 30000);

  console.log(`[FixQueueWorker] enabled=true interval=${intervalMs}ms`);

  intervalHandle = setInterval(async () => {
    try {
      const out = await runOnce(10);
      if (out.processed > 0) {
        console.log(`[FixQueueWorker] processed=${out.processed}`);
      }
    } catch (err) {
      console.error("[FixQueueWorker] error", err);
    }
  }, intervalMs);
}

module.exports = {
  runOnce,
  startFixQueueWorker,
};
