
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
const { trackSERP } = require("./serpTrackerService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/tracks', (req, res) => {
  res.json({ ok: true, tracks: db.list() });
});
router.get('/tracks/:id', (req, res) => {
  const track = db.get(req.params.id);
  if (!track) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, track });
});
router.post('/tracks', (req, res) => {
  const track = db.create(req.body || {});
  res.json({ ok: true, track });
});
router.put('/tracks/:id', (req, res) => {
  const track = db.update(req.params.id, req.body || {});
  if (!track) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, track });
});
router.delete('/tracks/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: analyze SERP
router.post('/ai/analyze', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ ok: false, error: 'Query required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a SERP tracking and analysis expert.' },
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

// Legacy track endpoint
router.post("/track", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await trackSERP(query);
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
  res.json({ ok: true, status: "SERP Tracker API running" });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your site',
    'Configure SERP tracking',
    'Run your first track',
    'Analyze results',
    'Export or share reports',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
