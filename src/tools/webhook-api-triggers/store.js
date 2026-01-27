const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const storage = require("../../core/storageJson");

const STORAGE_KEY = "webhook-api-triggers";

async function loadAll() {
  return storage.get(STORAGE_KEY, { webhooks: [], apis: [], analytics: [] });
}

async function saveAll(payload) {
  return storage.set(STORAGE_KEY, payload);
}

function normalizeEntry(input = {}) {
  const now = new Date().toISOString();
  const signatureMethod = input.signatureMethod || "hmac-sha256";
  const signatureSecret = input.signatureSecret || uuidv4();
  const contractRaw = input.contract || "{}";
  const contractHash = crypto.createHash("sha256").update(contractRaw).digest("hex");
  return {
    id: uuidv4(),
    env: input.env || "dev",
    version: input.version || input.versionTag || "v1",
    approvalRequired: !!input.approvalRequired,
    approverEmail: input.approvalRequired ? input.approverEmail || null : null,
    approvalStatus: input.approvalRequired ? "pending" : "not-required",
    guardrails: input.guardrails || { rateLimit: 60, concurrencyLimit: 5, circuitBreakerEnabled: true },
    contract: contractRaw,
    contractHash,
    lastStableContractHash: input.lastStableContractHash || contractHash,
    url: input.url || null,
    endpoint: input.endpoint || null,
    status: input.status || "draft",
    enabled: input.enabled !== undefined ? !!input.enabled : true,
    ipAllow: Array.isArray(input.ipAllow) ? input.ipAllow : [],
    ipDeny: Array.isArray(input.ipDeny) ? input.ipDeny : [],
    canaryPercent: input.canaryPercent || 0,
    shadowMode: !!input.shadowMode,
    performanceBudgetMs: input.performanceBudgetMs || null,
    signature: { method: signatureMethod, secret: signatureSecret },
    lastSuccessAt: input.lastSuccessAt || null,
    lastFailureAt: input.lastFailureAt || null,
    lastError: input.lastError || null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    history: [{ ts: now, revision: 1, changes: "created" }],
    comments: [],
  };
}

function lintContract(contractRaw) {
  const warnings = [];
  const errors = [];
  let parsed = {};
  try {
    parsed = typeof contractRaw === "string" ? JSON.parse(contractRaw || "{}") : (contractRaw || {});
  } catch (_err) {
    errors.push("Contract JSON invalid");
  }
  if (parsed.type === "object" && parsed.properties && typeof parsed.properties === "object") {
    Object.entries(parsed.properties).forEach(([key, val]) => {
      if (val && val.type === "any") warnings.push(`Field ${key} has loose 'any' type`);
    });
  }
  if (Array.isArray(parsed.required) && parsed.required.length === 0) warnings.push("Required array is empty");
  return { warnings, errors, parsed };
}

function validateGuardrails(entry, previous) {
  const warnings = [];
  const g = entry.guardrails || {};
  if (g.rateLimit !== undefined && g.rateLimit <= 0) warnings.push("rateLimit must be > 0");
  if (g.concurrencyLimit !== undefined && g.concurrencyLimit <= 0) warnings.push("concurrencyLimit must be > 0");
  if (entry.enabled === false) warnings.push("Trigger is disabled");
  // Heartbeat: warn if stale success
  if (entry.lastSuccessAt) {
    const ageMinutes = (Date.now() - new Date(entry.lastSuccessAt).getTime()) / 60000;
    if (ageMinutes > 30) warnings.push("No successful events in the last 30 minutes");
  }
  const { warnings: schemaWarnings, errors: schemaErrors } = lintContract(entry.contract);
  warnings.push(...schemaWarnings);
  if (schemaErrors.length) warnings.push(...schemaErrors);
  if (entry.lastStableContractHash && entry.contractHash && entry.contractHash !== entry.lastStableContractHash) {
    warnings.push("Contract drift detected from last stable version");
  }
  if (entry.canaryPercent && entry.canaryPercent > 0 && entry.canaryPercent < 100) {
    warnings.push(`Canary rollout at ${entry.canaryPercent}%`);
  }
  if (entry.shadowMode) warnings.push("Shadow mode enabled (non-blocking)");
  if (entry.performanceBudgetMs && entry.performanceBudgetMs > 0) {
    warnings.push(`Performance budget: ${entry.performanceBudgetMs}ms`);
  }
  return warnings;
}

async function list() {
  const data = await loadAll();
  return { webhooks: data.webhooks.filter(w => !w.deletedAt), apis: data.apis.filter(a => !a.deletedAt) };
}

async function addWebhook(input) {
  const data = await loadAll();
  const entry = normalizeEntry(input);
  const warnings = validateGuardrails(entry);
  entry.warnings = warnings;
  data.webhooks.push(entry);
  data.analytics.push({ type: "webhook:add", id: entry.id, ts: new Date().toISOString() });
  await saveAll(data);
  return entry;
}

async function addApi(input) {
  const data = await loadAll();
  const entry = normalizeEntry(input);
  const warnings = validateGuardrails(entry);
  entry.warnings = warnings;
  data.apis.push(entry);
  data.analytics.push({ type: "api:add", id: entry.id, ts: new Date().toISOString() });
  await saveAll(data);
  return entry;
}

async function updateWebhook(id, input = {}, options = {}) {
  const data = await loadAll();
  const idx = data.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const existing = data.webhooks[idx];
  if (options.ifRevision && existing.revision !== options.ifRevision) {
    const err = new Error("Revision mismatch");
    err.code = "REVISION_MISMATCH";
    throw err;
  }
  const now = new Date().toISOString();
  const contractRaw = input.contract !== undefined ? input.contract : existing.contract;
  const contractHash = crypto.createHash("sha256").update(contractRaw || "{}").digest("hex");
  const merged = {
    ...existing,
    ...input,
    contract: contractRaw,
    contractHash,
    updatedAt: now,
    revision: existing.revision + 1,
  };
  merged.warnings = validateGuardrails(merged, existing);
  merged.history = [...(existing.history || []), { ts: now, revision: merged.revision, changes: Object.keys(input).join(", ") || "update" }];
  data.webhooks[idx] = merged;
  data.analytics.push({ type: "webhook:update", id, ts: now });
  await saveAll(data);
  return merged;
}

async function updateApi(id, input = {}, options = {}) {
  const data = await loadAll();
  const idx = data.apis.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const existing = data.apis[idx];
  if (options.ifRevision && existing.revision !== options.ifRevision) {
    const err = new Error("Revision mismatch");
    err.code = "REVISION_MISMATCH";
    throw err;
  }
  const now = new Date().toISOString();
  const contractRaw = input.contract !== undefined ? input.contract : existing.contract;
  const contractHash = crypto.createHash("sha256").update(contractRaw || "{}").digest("hex");
  const merged = {
    ...existing,
    ...input,
    contract: contractRaw,
    contractHash,
    updatedAt: now,
    revision: existing.revision + 1,
  };
  merged.warnings = validateGuardrails(merged, existing);
  merged.history = [...(existing.history || []), { ts: now, revision: merged.revision, changes: Object.keys(input).join(", ") || "update" }];
  data.apis[idx] = merged;
  data.analytics.push({ type: "api:update", id, ts: now });
  await saveAll(data);
  return merged;
}

async function removeWebhook(id) {
  const data = await loadAll();
  const idx = data.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  const now = new Date().toISOString();
  data.webhooks[idx] = { ...data.webhooks[idx], deletedAt: now, revision: data.webhooks[idx].revision + 1, updatedAt: now, history: [...(data.webhooks[idx].history || []), { ts: now, revision: data.webhooks[idx].revision + 1, changes: "deleted" }] };
  data.analytics.push({ type: "webhook:delete", id, ts: now });
  await saveAll(data);
  return true;
}

async function removeApi(id) {
  const data = await loadAll();
  const idx = data.apis.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  const now = new Date().toISOString();
  data.apis[idx] = { ...data.apis[idx], deletedAt: now, revision: data.apis[idx].revision + 1, updatedAt: now, history: [...(data.apis[idx].history || []), { ts: now, revision: data.apis[idx].revision + 1, changes: "deleted" }] };
  data.analytics.push({ type: "api:delete", id, ts: now });
  await saveAll(data);
  return true;
}

async function restoreWebhook(id) {
  const data = await loadAll();
  const idx = data.webhooks.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  data.webhooks[idx] = { ...data.webhooks[idx], deletedAt: null, updatedAt: now, revision: data.webhooks[idx].revision + 1, history: [...(data.webhooks[idx].history || []), { ts: now, revision: data.webhooks[idx].revision + 1, changes: "restored" }] };
  await saveAll(data);
  return data.webhooks[idx];
}

async function restoreApi(id) {
  const data = await loadAll();
  const idx = data.apis.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  data.apis[idx] = { ...data.apis[idx], deletedAt: null, updatedAt: now, revision: data.apis[idx].revision + 1, history: [...(data.apis[idx].history || []), { ts: now, revision: data.apis[idx].revision + 1, changes: "restored" }] };
  await saveAll(data);
  return data.apis[idx];
}

async function exportAll() {
  const data = await loadAll();
  return { webhooks: data.webhooks, apis: data.apis };
}

async function importAll(items = []) {
  const data = await loadAll();
  const now = new Date().toISOString();
  let imported = 0;
  for (const item of items) {
    const entry = normalizeEntry(item);
    entry.importedAt = now;
    entry.warnings = validateGuardrails(entry);
    if (item.endpoint) {
      data.apis.push(entry);
    } else {
      data.webhooks.push(entry);
    }
    imported += 1;
  }
  await saveAll(data);
  return { count: imported };
}

async function recordAnalytics(event) {
  const data = await loadAll();
  data.analytics.push({ ...event, ts: new Date().toISOString() });
  await saveAll(data);
  return event;
}

async function listAnalytics() {
  const { analytics } = await loadAll();
  return analytics;
}

async function listTrash() {
  const data = await loadAll();
  return {
    webhooks: data.webhooks.filter(w => w.deletedAt),
    apis: data.apis.filter(a => a.deletedAt)
  };
}

async function rotateSecret(kind, id) {
  const data = await loadAll();
  const collection = kind === "webhook" ? "webhooks" : "apis";
  const idx = data[collection].findIndex((item) => item.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const newSecret = uuidv4();
  const updated = {
    ...data[collection][idx],
    signature: { method: data[collection][idx].signature?.method || "hmac-sha256", secret: newSecret },
    updatedAt: now,
    revision: data[collection][idx].revision + 1,
    history: [...(data[collection][idx].history || []), { ts: now, revision: data[collection][idx].revision + 1, changes: "rotated secret" }]
  };
  data[collection][idx] = updated;
  await saveAll(data);
  return updated.signature;
}

async function getHistory(kind, id) {
  const data = await loadAll();
  const collection = kind === "webhook" ? data.webhooks : data.apis;
  const item = collection.find((i) => i.id === id);
  return item ? (item.history || []) : [];
}

async function addComment(kind, id, comment) {
  const data = await loadAll();
  const collectionKey = kind === "webhook" ? "webhooks" : "apis";
  const idx = data[collectionKey].findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const entry = { id: uuidv4(), comment, ts: now };
  const existing = data[collectionKey][idx];
  const next = { ...existing, comments: [...(existing.comments || []), entry], revision: existing.revision + 1, updatedAt: now };
  data[collectionKey][idx] = next;
  await saveAll(data);
  return entry;
}

async function listComments(kind, id) {
  const data = await loadAll();
  const collection = kind === "webhook" ? data.webhooks : data.apis;
  const item = collection.find((i) => i.id === id);
  return item ? (item.comments || []) : [];
}

async function findOverlap(kind, { env, version, url, endpoint, id }) {
  const data = await loadAll();
  const collection = kind === "webhook" ? data.webhooks : data.apis;
  return collection.find(i => !i.deletedAt && i.env === env && (i.version || i.versionTag || "v1") === version && (kind === "webhook" ? i.url === url : i.endpoint === endpoint) && i.id !== id);
}

module.exports = {
  list,
  addWebhook,
  addApi,
  updateWebhook,
  updateApi,
  removeWebhook,
  removeApi,
  restoreWebhook,
  restoreApi,
  exportAll,
  importAll,
  recordAnalytics,
  listAnalytics,
  listTrash,
  rotateSecret,
  getHistory,
  addComment,
  listComments,
  findOverlap,
};
