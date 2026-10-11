const express = require("express");
const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const { handleWebhookApiQuery } = require("./webhookApiTriggersService");
const router = express.Router();

function safeJson(raw, fallback = null) {
  try { return JSON.parse(raw); } catch (_err) { return fallback; }
}

function validateBody(body = {}) {
  const errors = [];
  if (body.approvalRequired && !body.approverEmail) errors.push("Approver email required when approvals enabled");
  if (body.guardrails) {
    const { rateLimit, concurrencyLimit } = body.guardrails;
    if (rateLimit !== undefined && rateLimit <= 0) errors.push("rateLimit must be > 0");
    if (concurrencyLimit !== undefined && concurrencyLimit <= 0) errors.push("concurrencyLimit must be > 0");
  }
  if (body.contract) {
    const parsed = safeJson(body.contract, undefined);
    if (parsed === undefined) errors.push("Contract JSON invalid");
  }
  if (body.canaryPercent !== undefined) {
    if (typeof body.canaryPercent !== "number" || body.canaryPercent < 0 || body.canaryPercent > 100) errors.push("canaryPercent must be 0-100");
  }
  if (body.performanceBudgetMs !== undefined) {
    if (body.performanceBudgetMs !== null && body.performanceBudgetMs <= 0) errors.push("performanceBudgetMs must be > 0 when set");
  }
  return errors;
}

router.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Webhook & API Triggers API running" });
});

router.get("/configs", async (_req, res) => {
  const data = await store.list();
  res.json({ ok: true, ...data });
});

router.get("/trash", async (_req, res) => {
  const data = await store.listTrash();
  res.json({ ok: true, ...data });
});

router.post("/webhooks", async (req, res) => {
  const body = req.body || {};
  const errors = validateBody(body);
  if (!body.url) errors.push("Webhook url is required");
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join("; ") });
  const overlap = await store.findOverlap("webhook", { env: body.env || "dev", version: body.version || body.versionTag || "v1", url: body.url });
  if (overlap) return res.status(409).json({ ok: false, error: "Duplicate webhook exists for env/version" });
  const created = await store.addWebhook(body);
  res.json({ ok: true, webhook: created });
});

router.put("/webhooks/:id", async (req, res) => {
  const body = req.body || {};
  const errors = validateBody(body);
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join("; ") });
  const overlap = await store.findOverlap("webhook", { env: body.env || "dev", version: body.version || body.versionTag || "v1", url: body.url, id: req.params.id });
  if (overlap) return res.status(409).json({ ok: false, error: "Duplicate webhook exists for env/version" });
  const ifRevision = req.headers["if-match-revision"] ? Number(req.headers["if-match-revision"]) : undefined;
  try {
    const updated = await store.updateWebhook(req.params.id, body, { ifRevision });
    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, webhook: updated });
  } catch (err) {
    if (err.code === "REVISION_MISMATCH") return res.status(409).json({ ok: false, error: "Revision mismatch" });
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete("/webhooks/:id", async (req, res) => {
  const removed = await store.removeWebhook(req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true });
});

router.post("/webhooks/:id/restore", async (req, res) => {
  const restored = await store.restoreWebhook(req.params.id);
  if (!restored) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, webhook: restored });
});

router.post("/webhooks/:id/rotate-secret", async (req, res) => {
  const sig = await store.rotateSecret("webhook", req.params.id);
  if (!sig) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, signature: sig });
});

router.get("/webhooks/:id/history", async (req, res) => {
  const history = await store.getHistory("webhook", req.params.id);
  if (!history) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, history });
});

router.get("/webhooks/:id/comments", async (req, res) => {
  const comments = await store.listComments("webhook", req.params.id);
  if (!comments) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, comments });
});

router.post("/webhooks/:id/comments", async (req, res) => {
  const c = req.body?.comment;
  if (!c) return res.status(400).json({ ok: false, error: "comment required" });
  const added = await store.addComment("webhook", req.params.id, c);
  if (!added) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, comment: added });
});

router.post("/apis", async (req, res) => {
  const body = req.body || {};
  const errors = validateBody(body);
  if (!body.endpoint) errors.push("API endpoint is required");
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join("; ") });
  const overlap = await store.findOverlap("api", { env: body.env || "dev", version: body.version || body.versionTag || "v1", endpoint: body.endpoint });
  if (overlap) return res.status(409).json({ ok: false, error: "Duplicate API trigger exists for env/version" });
  const created = await store.addApi(body);
  res.json({ ok: true, api: created });
});

router.put("/apis/:id", async (req, res) => {
  const body = req.body || {};
  const errors = validateBody(body);
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join("; ") });
  const overlap = await store.findOverlap("api", { env: body.env || "dev", version: body.version || body.versionTag || "v1", endpoint: body.endpoint, id: req.params.id });
  if (overlap) return res.status(409).json({ ok: false, error: "Duplicate API trigger exists for env/version" });
  const ifRevision = req.headers["if-match-revision"] ? Number(req.headers["if-match-revision"]) : undefined;
  try {
    const updated = await store.updateApi(req.params.id, body, { ifRevision });
    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, api: updated });
  } catch (err) {
    if (err.code === "REVISION_MISMATCH") return res.status(409).json({ ok: false, error: "Revision mismatch" });
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete("/apis/:id", async (req, res) => {
  const removed = await store.removeApi(req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true });
});

router.post("/apis/:id/restore", async (req, res) => {
  const restored = await store.restoreApi(req.params.id);
  if (!restored) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, api: restored });
});

router.post("/apis/:id/rotate-secret", async (req, res) => {
  const sig = await store.rotateSecret("api", req.params.id);
  if (!sig) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, signature: sig });
});

router.get("/apis/:id/history", async (req, res) => {
  const history = await store.getHistory("api", req.params.id);
  if (!history) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, history });
});

router.get("/apis/:id/comments", async (req, res) => {
  const comments = await store.listComments("api", req.params.id);
  if (!comments) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, comments });
});

router.post("/apis/:id/comments", async (req, res) => {
  const c = req.body?.comment;
  if (!c) return res.status(400).json({ ok: false, error: "comment required" });
  const added = await store.addComment("api", req.params.id, c);
  if (!added) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, comment: added });
});

// AI endpoint: suggest trigger
router.post('/ai/suggest', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ ok: false, error: 'Description required' });
    const suggestion = await handleWebhookApiQuery(description);
    res.json({ ok: true, suggestion });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Legacy query endpoint
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleWebhookApiQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Simulation
router.post('/simulate', async (req, res) => {
  try {
    const { webhooks, apis } = await store.list();
    const payload = req.body?.payload || {};
    const contract = safeJson(req.body?.contract || "{}", {});
    const actions = [];
    if (webhooks.length) actions.push(`${webhooks.length} webhook listener(s)`);
    if (apis.length) actions.push(`${apis.length} API trigger(s)`);
    const warnings = [
      ...webhooks.flatMap(w => w.warnings || []),
      ...apis.flatMap(a => a.warnings || []),
    ];
    res.json({ ok: true, simulation: { id: uuidv4(), payload, contract, actions, warnings } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Import/export endpoints (persistent)
router.post('/import', async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  const result = await store.importAll(items);
  res.json({ ok: true, ...result });
});
router.get('/export', async (_req, res) => {
  const data = await store.exportAll();
  res.json({ ok: true, ...data });
});

// Analytics endpoints
router.post('/analytics', async (req, res) => {
  const event = await store.recordAnalytics(req.body || {});
  res.json({ ok: true, event });
});
router.get('/analytics', async (_req, res) => {
  const analytics = await store.listAnalytics();
  res.json({ ok: true, analytics });
});

router.get('/analytics/summary', async (_req, res) => {
  const analytics = await store.listAnalytics();
  const summary = analytics.reduce((acc, evt) => {
    const key = evt.type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  res.json({ ok: true, summary, total: analytics.length });
});

// Feedback
router.post('/feedback', async (req, res) => {
  await store.recordAnalytics({ type: 'feedback', feedback: req.body?.feedback });
  res.json({ ok: true });
});

// Onboarding/help
router.get('/onboarding', (_req, res) => {
  res.json({ ok: true, steps: [
    'Connect your integrations',
    'Describe your trigger',
    'Test and deploy',
    'Export or share triggers',
    'Set up approvals and guardrails',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
