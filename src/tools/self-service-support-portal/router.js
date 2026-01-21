
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
const { querySupport } = require("./selfServiceSupportService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/tickets', (req, res) => {
  res.json({ ok: true, tickets: db.list() });
});
router.get('/tickets/:id', (req, res) => {
  const ticket = db.get(req.params.id);
  if (!ticket) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, ticket });
});
router.post('/tickets', (req, res) => {
  const ticket = db.create(req.body || {});
  res.json({ ok: true, ticket });
});
router.put('/tickets/:id', (req, res) => {
  const ticket = db.update(req.params.id, req.body || {});
  if (!ticket) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, ticket });
});
router.delete('/tickets/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: support query
router.post('/ai/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ ok: false, error: 'Query required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a self-service support expert.' },
        { role: 'user', content: query }
      ],
      max_tokens: 512
    });
    const answer = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, answer });
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
    const result = await querySupport(query);
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


// Import/export endpoints (live, persistent)
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
  res.json({ ok: true, status: "Self-Service Support Portal API running" });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your support system',
    'Configure support settings',
    'Submit your first ticket',
    'Analyze responses',
    'Export or share tickets',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
