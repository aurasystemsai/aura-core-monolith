const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const analyticsModel = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhookModel = require('./webhookModel');
const complianceModel = require('./complianceModel');
const pluginSystem = require('./pluginSystem');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/analyses', (req, res) => {
  res.json({ ok: true, analyses: db.list() });
});
router.get('/analyses/:id', (req, res) => {
  const analysis = db.get(req.params.id);
  if (!analysis) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, analysis });
});
router.post('/analyses', (req, res) => {
  const analysis = db.create(req.body || {});
  res.json({ ok: true, analysis });
});
router.put('/analyses/:id', (req, res) => {
  const analysis = db.update(req.params.id, req.body || {});
  if (!analysis) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, analysis });
});
router.delete('/analyses/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI (OpenAI-powered blog SEO analyzer)
router.post('/ai/analyze', async (req, res) => {
  try {
module.exports = router;
    const { messages, prompt, context } = req.body || {};
    if (!messages && !prompt) {
      return res.status(400).json({ ok: false, error: 'Missing messages or prompt' });
    }
    const chatMessages = messages || [
      { role: 'system', content: 'You are an expert AI for blog SEO optimization.' },
      { role: 'user', content: prompt }
    ];
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: chatMessages,
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, reply });
  } catch (err) {
    console.error('[Blog SEO] Error:', err);
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
  const event = analyticsModel.recordEvent(req.body || {});
  res.json({ ok: true, event });
});
router.get('/analytics', (req, res) => {
  res.json({ ok: true, events: analyticsModel.listEvents(req.query || {}) });
});

// Import/export endpoints
router.post('/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  db.import(items);
  res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

// Shopify sync endpoints
router.post('/shopify/import', (req, res) => {
  // Integrate with Shopify API in production
  res.json({ ok: true, message: 'Shopify import not implemented in demo.' });
});
router.get('/shopify/export', (req, res) => {
  res.json({ ok: true, message: 'Shopify export not implemented in demo.' });
});

// Notifications endpoints
router.post('/notify', (req, res) => {
  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ ok: false, error: 'to and message required' });
  notificationModel.send(to, message);
  res.json({ ok: true });
});

// RBAC endpoint
router.post('/rbac/check', (req, res) => {
  const { user, action } = req.body || {};
  const allowed = rbac.check(user, action);
  res.json({ ok: true, allowed });
});

// i18n endpoint
router.get('/i18n', (req, res) => {
  res.json({ ok: true, i18n });
});

// Docs endpoint
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Blog SEO API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

// Webhook endpoint
router.post('/webhook', (req, res) => {
  webhookModel.handle(req.body || {});
  res.json({ ok: true });
});

// Compliance endpoint
router.get('/compliance', (req, res) => {
  res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugin system endpoint
router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: Date.now() });
});

module.exports = router;
