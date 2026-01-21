
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
const { crawlSite } = require("./seoSiteCrawlerService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/crawls', (req, res) => {
  res.json({ ok: true, crawls: db.list() });
});
router.get('/crawls/:id', (req, res) => {
  const crawl = db.get(req.params.id);
  if (!crawl) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, crawl });
});
router.post('/crawls', (req, res) => {
  const crawl = db.create(req.body || {});
  res.json({ ok: true, crawl });
});
router.put('/crawls/:id', (req, res) => {
  const crawl = db.update(req.params.id, req.body || {});
  if (!crawl) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, crawl });
});
router.delete('/crawls/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: analyze crawl
router.post('/ai/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an SEO site crawler and analyzer.' },
        { role: 'user', content: `Crawl and analyze this URL: ${url}` }
      ],
      max_tokens: 512
    });
    const analysis = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Crawl endpoint (legacy)
router.post("/crawl", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.json({ ok: false, error: "Missing or invalid URL" });
    }
    const result = await crawlSite(url);
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
  res.json({ ok: true, status: "SEO Site Crawler API running" });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your site',
    'Configure crawl settings',
    'Run your first crawl',
    'Analyze results',
    'Export or share reports',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;
