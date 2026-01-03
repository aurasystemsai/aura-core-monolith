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
router.get('/returns', (req, res) => {
  res.json({ ok: true, returns: db.list() });
});
router.get('/returns/:id', (req, res) => {
  const ret = db.get(req.params.id);
  if (!ret) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, return: ret });
});
router.post('/returns', (req, res) => {
  const ret = db.create(req.body || {});
  res.json({ ok: true, return: ret });
});
router.put('/returns/:id', (req, res) => {
  const ret = db.update(req.params.id, req.body || {});
  if (!ret) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, return: ret });
});
router.delete('/returns/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: suggest RMA policy
router.post('/ai/suggest', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order) return res.status(400).json({ ok: false, error: 'Missing order' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a returns automation expert.' },
        { role: 'user', content: `Suggest an RMA policy for this order: ${JSON.stringify(order)}` }
      ],
      max_tokens: 256,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, result: reply });
  } catch (err) {
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
router.post('/shopify/sync', (req, res) => {
  // Integrate with Shopify API in production
  res.json({ ok: true, message: 'Shopify sync not implemented in demo.' });
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
  res.json({ ok: true, docs: 'Returns/RMA Automation API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
  returns = data.map((r, i) => ({ ...r, id: idCounter++ }));
  res.json({ ok: true, count: returns.length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, data: returns });
});

// Shopify sync endpoint (placeholder)
router.post('/shopify/sync', (req, res) => {
  res.json({ ok: true, message: 'Shopify sync not implemented in demo.' });
});

// Notifications endpoint (placeholder)
router.post('/notify', (req, res) => {
  res.json({ ok: true, message: 'Notification sent (demo).' });
});

// RBAC check endpoint (placeholder)
router.post('/rbac/check', (req, res) => {
  res.json({ ok: true, allowed: true });
});

// i18n endpoint (placeholder)
router.get('/i18n', (req, res) => {
  res.json({ ok: true, translations: { en: 'Returns/RMA Automation', fr: 'Automatisation des retours/RMA' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Returns/RMA Automation API. Endpoints: /returns, /ai/suggest, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

// module.exports = router; (already exported above)

// CRUD endpoints
router.get('/items', (req, res) => {
  res.json({ ok: true, items: db.list() });
});
router.get('/items/:id', (req, res) => {
  const item = db.get(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, item });
});
router.post('/items', (req, res) => {
  const item = db.create(req.body || {});
  res.json({ ok: true, item });
});
router.put('/items/:id', (req, res) => {
  const item = db.update(req.params.id, req.body || {});
  if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, item });
});
router.delete('/items/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint
router.post('/ai/generate', async (req, res) => {
  try {
    const { messages, prompt } = req.body || {};
    if (!messages && !prompt) return res.status(400).json({ ok: false, error: 'Missing messages or prompt' });
    const chatMessages = messages || [
      { role: 'system', content: 'You are an expert AI for returns and RMA automation.' },
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
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
  const event = analytics.recordEvent(req.body || {});
  res.json({ ok: true, event });
});
router.get('/analytics', (req, res) => {
  res.json({ ok: true, events: analytics.listEvents(req.query || {}) });
});

// Import/export endpoints
router.post('/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  const result = db.import(items);
  res.json({ ok: true, result });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

// Shopify sync endpoints
router.post('/shopify/sync', async (req, res) => {
  // Placeholder: implement Shopify sync logic
  res.json({ ok: true, synced: true });
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
  res.json({ ok: true, docs: 'Returns/RMA Automation API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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

module.exports = router;
