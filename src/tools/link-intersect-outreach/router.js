
const express = require("express");
const OpenAI = require("openai");
const db = require("./db");
const analyticsModel = require("./analyticsModel");
const notificationModel = require("./notificationModel");
const rbac = require("./rbac");
const i18n = require("./i18n");
const webhookModel = require("./webhookModel");
const complianceModel = require("./complianceModel");
const pluginSystem = require("./pluginSystem");
const { analyzeLinkIntersect } = require("./linkIntersectOutreachService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/campaigns', (req, res) => {
  res.json({ ok: true, campaigns: db.list() });
});
router.get('/campaigns/:id', (req, res) => {
  const campaign = db.get(req.params.id);
  if (!campaign) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, campaign });
});
router.post('/campaigns', (req, res) => {
  const campaign = db.create(req.body || {});
  res.json({ ok: true, campaign });
});
router.put('/campaigns/:id', (req, res) => {
  const campaign = db.update(req.params.id, req.body || {});
  if (!campaign) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, campaign });
});
router.delete('/campaigns/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: analyze link intersect
router.post('/ai/analyze', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ ok: false, error: 'Query required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a link intersect outreach expert.' },
        { role: 'user', content: query }
      ],
      max_tokens: 512
    });
    const analysis = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Legacy analyze endpoint
router.post("/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await analyzeLinkIntersect(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
  const event = analyticsModel.recordEvent(req.body || {});
  res.json({ ok: true, event });
});
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: analyticsModel.list() });
});

// Import/export
  // Placeholder: implement import logic
  res.json({ ok: true, message: 'Import not implemented' });
});
router.get('/export', (req, res) => {
  // Placeholder: implement export logic
  res.json({ ok: true, data: db.list() });
});

// Import/export endpoints (persistent)
router.post('/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  db.import(items);
  res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

// Notifications
router.post('/notify', (req, res) => {
  notificationModel.send(req.body || {});
  res.json({ ok: true });
});

// RBAC example
router.post('/rbac/check', (req, res) => {
  const allowed = rbac.check(req.body.user, req.body.action);
  res.json({ ok: true, allowed });
});

// i18n example
router.get('/i18n/:lang', (req, res) => {
  res.json({ ok: true, strings: i18n.getStrings(req.params.lang) });
});

// Compliance
router.get('/compliance', (req, res) => {
  res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugins
router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

// Webhooks
router.post('/webhook', (req, res) => {
  webhookModel.trigger(req.body || {});
  res.json({ ok: true });
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Link Intersect Outreach API running" });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your outreach data',
    'Configure link intersect settings',
    'Run your first campaign',
    'Analyze results',
    'Export or share campaigns',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
