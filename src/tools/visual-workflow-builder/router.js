const express = require("express");
const { v4: uuidv4 } = require("uuid");
const store = require("./store");
const { handleWorkflowQuery } = require("./visualWorkflowBuilderService");
const router = express.Router();

function safeJsonParse(raw, fallback = null) {
  try { return JSON.parse(raw); } catch (_err) { return fallback; }
}

function validatePayloadAgainstContract(contractRaw, payload) {
  const errors = [];
  const contract = safeJsonParse(contractRaw || "{}", {});
  if (contract.type === "object" && (payload === null || typeof payload !== "object" || Array.isArray(payload))) {
    errors.push("Payload must be an object");
  }
  if (Array.isArray(contract.required)) {
    contract.required.forEach((key) => {
      if (!(key in payload)) errors.push(`Missing required field: ${key}`);
    });
  }
  return { contract, errors };
}

function validateWorkflowBody(body = {}) {
  const errors = [];
  if (body.approvalRequired && !body.approverEmail) errors.push("Approver email required when approvals are enabled");
  if (body.contract) {
    const parsed = safeJsonParse(body.contract, undefined);
    if (parsed === undefined) errors.push("Contract JSON is invalid");
  }
  if (body.guardrails) {
    const { rateLimit, concurrencyLimit } = body.guardrails;
    if (rateLimit !== undefined && rateLimit <= 0) errors.push("rateLimit must be > 0");
    if (concurrencyLimit !== undefined && concurrencyLimit <= 0) errors.push("concurrencyLimit must be > 0");
  }
  if (body.canaryPercent !== undefined) {
    if (typeof body.canaryPercent !== "number" || body.canaryPercent < 0 || body.canaryPercent > 100) errors.push("canaryPercent must be between 0 and 100");
  }
  if (body.performanceBudgetMs !== undefined) {
    if (body.performanceBudgetMs !== null && body.performanceBudgetMs <= 0) errors.push("performanceBudgetMs must be > 0 when set");
  }
  return errors;
}

// CRUD endpoints with versioning + approvals
router.get('/workflows', async (req, res) => {
  const workflows = await store.list({ env: req.query.env, status: req.query.status });
  res.json({ ok: true, workflows });
});

router.get('/workflows/:id', async (req, res) => {
  const wf = await store.get(req.params.id);
  if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, workflow: wf });
});

router.post('/workflows', async (req, res) => {
  const body = req.body || {};
  const errors = validateWorkflowBody(body);
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join('; ') });
  const wf = await store.create(body);
  res.json({ ok: true, workflow: wf });
});

router.put('/workflows/:id', async (req, res) => {
  const body = req.body || {};
  const errors = validateWorkflowBody(body);
  if (errors.length) return res.status(400).json({ ok: false, error: errors.join('; ') });
  const ifRevision = req.headers["if-match-revision"] ? Number(req.headers["if-match-revision"]) : undefined;
  try {
    const wf = await store.update(req.params.id, body, { ifRevision });
    if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, workflow: wf });
  } catch (err) {
    if (err.code === 'REVISION_MISMATCH') {
      return res.status(409).json({ ok: false, error: 'Revision mismatch' });
    }
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/workflows/:id', async (req, res) => {
  const ok = await store.remove(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

router.post('/workflows/:id/approve', async (req, res) => {
  try {
    const wf = await store.update(req.params.id, {
      approvalStatus: 'approved',
      approvedBy: req.body?.approvedBy || 'system',
      approvedAt: new Date().toISOString(),
    });
    if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, workflow: wf });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/promote', async (req, res) => {
  try {
    const wf = await store.get(req.params.id);
    if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
    if (wf.approvalRequired && wf.approvalStatus !== 'approved') {
      return res.status(400).json({ ok: false, error: 'Approval required before promote' });
    }
    // Require tests to pass if present
    const testResults = await store.runTests(req.params.id);
    if (Array.isArray(testResults) && testResults.length) {
      const failed = testResults.filter(r => !r.passed);
      if (failed.length) {
        return res.status(400).json({ ok: false, error: 'Tests must pass before promote' });
      }
    }
    // Block promotion if warnings exist
    const payload = {};
    const { contract, errors: contractErrors } = validatePayloadAgainstContract(wf.contract, payload);
    const warnings = [];
    if (wf.approvalRequired && wf.approvalStatus !== 'approved') warnings.push('Approval pending');
    if (wf.guardrails?.rateLimit && wf.guardrails.rateLimit < 1) warnings.push('Rate limit invalid');
    if (wf.lastStableContractHash && wf.contractHash && wf.lastStableContractHash !== wf.contractHash) warnings.push('Contract drift detected');
    if (contractErrors.length) warnings.push(...contractErrors);
    if (warnings.length) {
      return res.status(400).json({ ok: false, error: 'Resolve warnings before promote', warnings });
    }
    const updated = await store.update(req.params.id, { status: 'active' });
    res.json({ ok: true, workflow: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/rollback', async (req, res) => {
  try {
    const wf = await store.update(req.params.id, { status: 'draft' });
    if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, workflow: wf });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/simulate', async (req, res) => {
  try {
    const wf = await store.get(req.params.id);
    if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
    const payload = req.body?.payload || {};
    const { contract, errors: contractErrors } = validatePayloadAgainstContract(wf.contract, payload);
    const actions = Array.isArray(wf.definition?.steps) ? wf.definition.steps.map((s, i) => s.title || `step-${i + 1}`) : [];
    const warnings = [];
    if (wf.approvalRequired && wf.approvalStatus !== 'approved') warnings.push('Approval pending');
    if (wf.guardrails?.rateLimit && wf.guardrails.rateLimit < 1) warnings.push('Rate limit invalid');
    if (wf.lastStableContractHash && wf.contractHash && wf.lastStableContractHash !== wf.contractHash) warnings.push('Contract drift vs promoted');
    if (contractErrors.length) warnings.push(...contractErrors);
    res.json({ ok: true, simulation: { id: uuidv4(), payload, contract, actions, warnings, env: wf.env, version: wf.versionTag } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Test case management
router.post('/workflows/:id/tests', async (req, res) => {
  try {
    const tc = await store.addTestCase(req.params.id, req.body || {});
    if (!tc) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, testCase: tc });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/workflows/:id/tests/run', async (req, res) => {
  try {
    const results = await store.runTests(req.params.id);
    if (!results) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// AI endpoint: suggest workflow (delegated)
router.post('/ai/suggest', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ ok: false, error: 'Description required' });
    const result = await handleWorkflowQuery(description);
    res.json({ ok: true, suggestion: result });
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
    const result = await handleWorkflowQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
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

// Import/export endpoints (persistent)
router.post('/import', async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  for (const item of items) {
    await store.create(item);
  }
  const workflows = await store.list();
  res.json({ ok: true, count: workflows.length });
});
router.get('/export', async (_req, res) => {
  const workflows = await store.list();
  res.json({ ok: true, items: workflows });
});

router.get('/workflows/:id/history', async (req, res) => {
  const history = await store.getHistory(req.params.id);
  if (!history) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, history });
});

router.get('/workflows/:id/comments', async (req, res) => {
  const comments = await store.listComments(req.params.id);
  if (!comments) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, comments });
});

router.post('/workflows/:id/comments', async (req, res) => {
  const c = req.body?.comment;
  if (!c) return res.status(400).json({ ok: false, error: 'comment required' });
  const added = await store.addComment(req.params.id, c);
  if (!added) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, comment: added });
});

// Health check
router.get("/health", (_req, res) => {
  res.json({ ok: true, status: "Visual Workflow Builder API running" });
});

// Onboarding/help
router.get('/onboarding', (_req, res) => {
  res.json({ ok: true, steps: [
    'Connect your integrations',
    'Describe your workflow visually',
    'Build and review automation',
    'Test and deploy',
    'Export or share workflows',
    'Set up approvals and guardrails',
    'Integrate webhooks and APIs'
  ] });
});

module.exports = router;
