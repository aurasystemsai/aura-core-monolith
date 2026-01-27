const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const storage = require("../../core/storageJson");

const STORAGE_KEY = "visual-workflow-builder";

async function loadAll() {
  return storage.get(STORAGE_KEY, { workflows: [], analytics: [] });
}

async function saveAll(payload) {
  return storage.set(STORAGE_KEY, payload);
}

function hashContract(contract) {
  const raw = typeof contract === "string" ? contract : JSON.stringify(contract || {});
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function evaluateSafety(wf) {
  let score = 100;
  const warnings = [];
  if (wf.approvalRequired && !wf.approverEmail) { score -= 20; warnings.push("Missing approver email"); }
  if (!wf.guardrails || wf.guardrails.rateLimit <= 0) { score -= 15; warnings.push("Rate limit not set"); }
  if (!wf.guardrails || wf.guardrails.concurrencyLimit <= 0) { score -= 15; warnings.push("Concurrency limit not set"); }
  try { JSON.parse(wf.contract || "{}"); } catch (_err) { score -= 20; warnings.push("Invalid contract JSON"); }
  if (!wf.definition || !Array.isArray(wf.definition.steps) || wf.definition.steps.length === 0) { score -= 10; warnings.push("No steps defined"); }
  if (wf.canaryPercent && (wf.canaryPercent < 0 || wf.canaryPercent > 100)) { score -= 5; warnings.push("Invalid canary percent"); }
  if (wf.shadowMode) { score -= 0; } // neutral
  if (wf.lastStableContractHash && wf.contractHash && wf.lastStableContractHash !== wf.contractHash) {
    score -= 5;
    warnings.push("Contract drift detected vs last promoted version");
  }
  if (score < 0) score = 0;
  return { safetyScore: score, safetyWarnings: warnings };
}

function simpleValidatePayload(contractRaw, payload) {
  const errors = [];
  const contract = typeof contractRaw === "string" ? (() => { try { return JSON.parse(contractRaw || "{}"); } catch { return {}; } })() : (contractRaw || {});
  if (contract.type === "object" && (payload === null || typeof payload !== "object" || Array.isArray(payload))) {
    errors.push("Payload must be an object");
  }
  if (Array.isArray(contract.required)) {
    contract.required.forEach(key => {
      if (!(key in payload)) errors.push(`Missing required field: ${key}`);
    });
  }
  return errors;
}

function withDefaults(input = {}) {
  const now = new Date().toISOString();
  const contract = input.contract || "{}";
  const definition = input.definition || {};
  const { safetyScore, safetyWarnings } = evaluateSafety({
    approvalRequired: !!input.approvalRequired,
    approverEmail: input.approverEmail,
    guardrails: input.guardrails,
    contract,
    definition,
    canaryPercent: input.canaryPercent,
    shadowMode: input.shadowMode,
    lastStableContractHash: input.lastStableContractHash,
  });
  return {
    id: uuidv4(),
    name: input.name || "Untitled Workflow",
    env: input.env || "dev",
    versionTag: input.versionTag || "v1",
    approvalRequired: !!input.approvalRequired,
    approverEmail: input.approvalRequired ? input.approverEmail || null : null,
    approvalStatus: input.approvalRequired ? "pending" : "not-required",
    guardrails: input.guardrails || { rateLimit: 60, concurrencyLimit: 5, circuitBreakerEnabled: true },
    contract,
    contractHash: hashContract(contract),
    lastStableContractHash: input.lastStableContractHash || hashContract(contract),
    definition,
    status: input.status || "draft",
    safetyScore,
    safetyWarnings,
    testCases: input.testCases || [],
    canaryPercent: input.canaryPercent || 0,
    shadowMode: !!input.shadowMode,
    chaosTesting: !!input.chaosTesting,
    performanceBudgetMs: input.performanceBudgetMs || null,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    history: [{ ts: now, revision: 1, changes: "created" }],
    comments: [],
  };
}

async function list(filter = {}) {
  const { workflows } = await loadAll();
  return workflows.filter(wf => {
    if (filter.env && wf.env !== filter.env) return false;
    if (filter.status && wf.status !== filter.status) return false;
    return true;
  });
}

async function get(id) {
  const { workflows } = await loadAll();
  return workflows.find(w => w.id === id) || null;
}

async function create(input) {
  const { workflows, analytics } = await loadAll();
  const wf = withDefaults(input);
  workflows.push(wf);
  analytics.push({ type: "create", id: wf.id, ts: new Date().toISOString() });
  await saveAll({ workflows, analytics });
  return wf;
}

async function update(id, input = {}, options = {}) {
  const { workflows, analytics } = await loadAll();
  const idx = workflows.findIndex(w => w.id === id);
  if (idx === -1) return null;
  const existing = workflows[idx];
  if (options.ifRevision && existing.revision !== options.ifRevision) {
    const err = new Error("Revision mismatch");
    err.code = "REVISION_MISMATCH";
    throw err;
  }
  const now = new Date().toISOString();
  const merged = {
    ...existing,
    ...input,
  };
  merged.approvalStatus = input.approvalRequired === false ? "not-required" : (input.approvalStatus || existing.approvalStatus);
  merged.contractHash = hashContract(merged.contract);
  if (merged.status === "active") {
    merged.lastStableContractHash = merged.contractHash;
  }
  const safety = evaluateSafety(merged);
  merged.safetyScore = safety.safetyScore;
  merged.safetyWarnings = safety.safetyWarnings;
  merged.revision = existing.revision + 1;
  merged.updatedAt = now;
  merged.history = [...(existing.history || []), { ts: now, revision: merged.revision, changes: Object.keys(input).join(", ") || "update" }];
  const next = merged;
  workflows[idx] = next;
  analytics.push({ type: "update", id, ts: now });
  await saveAll({ workflows, analytics });
  return next;
}

async function addTestCase(id, testCase) {
  const { workflows, analytics } = await loadAll();
  const idx = workflows.findIndex(w => w.id === id);
  if (idx === -1) return null;
  const wf = workflows[idx];
  const now = new Date().toISOString();
  const tc = { id: uuidv4(), name: testCase.name || `test-${wf.testCases.length + 1}`, payload: testCase.payload || {}, createdAt: now };
  wf.testCases = wf.testCases || [];
  wf.testCases.push(tc);
  wf.updatedAt = now;
  wf.revision += 1;
  const safety = evaluateSafety(wf);
  wf.safetyScore = safety.safetyScore;
  wf.safetyWarnings = safety.safetyWarnings;
  wf.history = [...(wf.history || []), { ts: now, revision: wf.revision, changes: `added test ${tc.name}` }];
  workflows[idx] = wf;
  analytics.push({ type: "test:add", id, ts: now });
  await saveAll({ workflows, analytics });
  return tc;
}

async function runTests(id) {
  const { workflows, analytics } = await loadAll();
  const wf = workflows.find(w => w.id === id);
  if (!wf) return null;
  const results = (wf.testCases || []).map(tc => {
    const errs = simpleValidatePayload(wf.contract, tc.payload || {});
    return { id: tc.id, name: tc.name, passed: errs.length === 0, errors: errs };
  });
  analytics.push({ type: "test:run", id, ts: new Date().toISOString(), results });
  await saveAll({ workflows, analytics });
  return results;
}

async function remove(id) {
  const { workflows, analytics } = await loadAll();
  const idx = workflows.findIndex(w => w.id === id);
  if (idx === -1) return false;
  const now = new Date().toISOString();
  workflows.splice(idx, 1);
  analytics.push({ type: "delete", id, ts: now });
  await saveAll({ workflows, analytics });
  return true;
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

async function getHistory(id) {
  const { workflows } = await loadAll();
  const wf = workflows.find(w => w.id === id);
  return wf ? (wf.history || []) : [];
}

async function addComment(id, comment) {
  const data = await loadAll();
  const idx = data.workflows.findIndex(w => w.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const entry = { id: uuidv4(), comment, ts: now };
  const wf = data.workflows[idx];
  wf.comments = [...(wf.comments || []), entry];
  wf.revision += 1;
  wf.updatedAt = now;
  wf.history = [...(wf.history || []), { ts: now, revision: wf.revision, changes: "comment added" }];
  data.workflows[idx] = wf;
  await saveAll(data);
  return entry;
}

async function listComments(id) {
  const { workflows } = await loadAll();
  const wf = workflows.find(w => w.id === id);
  return wf ? (wf.comments || []) : [];
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  recordAnalytics,
  listAnalytics,
  addTestCase,
  runTests,
  getHistory,
  addComment,
  listComments,
};
