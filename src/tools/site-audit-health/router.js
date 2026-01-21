
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
const { auditSite } = require("./siteAuditHealthService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/audits', (req, res) => {
  res.json({ ok: true, audits: db.list() });
});
router.get('/audits/:id', (req, res) => {
  const audit = db.get(req.params.id);
  if (!audit) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, audit });
});
router.post('/audits', (req, res) => {
  const audit = db.create(req.body || {});
  res.json({ ok: true, audit });
});
router.put('/audits/:id', (req, res) => {
  const audit = db.update(req.params.id, req.body || {});
  if (!audit) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, audit });
});
router.delete('/audits/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: analyze audit
router.post('/ai/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a site audit and health analysis expert.' },
        { role: 'user', content: url }
      ],
      max_tokens: 512
    });
    const analysis = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Legacy audit endpoint
router.post("/audit", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.json({ ok: false, error: "Missing or invalid URL" });
    }
    const result = await auditSite(url);
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
  res.json({ ok: true, status: "Site Audit Health API running" });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your site',
    'Configure audit settings',
    'Run your first audit',
    'Analyze results',
    'Export or share reports',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
