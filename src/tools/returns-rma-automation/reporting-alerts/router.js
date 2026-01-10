
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
const { reportAndAlert } = require("./reportingAlertsService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/alerts', (req, res) => {
  res.json({ ok: true, alerts: db.list() });
});
router.get('/alerts/:id', (req, res) => {
  const alert = db.get(req.params.id);
  if (!alert) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, alert });
});
router.post('/alerts', (req, res) => {
  const alert = db.create(req.body || {});
  res.json({ ok: true, alert });
});
router.put('/alerts/:id', (req, res) => {
  const alert = db.update(req.params.id, req.body || {});
  if (!alert) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, alert });
});
router.delete('/alerts/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: alert suggestion
router.post('/ai/suggest', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ ok: false, error: 'Description required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a reporting alerts expert.' },
        { role: 'user', content: description }
      ],
      max_tokens: 256
    });
    res.json({ ok: true, suggestion: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Legacy report endpoint
router.post("/report", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await reportAndAlert(query);
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
router.post('/import', (req, res) => {
  // Placeholder: implement import logic
  res.json({ ok: true, message: 'Import not implemented' });
});
router.get('/export', (req, res) => {
  // Placeholder: implement export logic
  res.json({ ok: true, data: db.list() });
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
  res.json({ ok: true, status: "Reporting Alerts API running" });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your alert sources',
    'Configure alert settings',
    'Run your first alert',
    'Analyze results',
    'Export or share alerts',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
