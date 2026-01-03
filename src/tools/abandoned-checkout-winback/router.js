const express = require('express');
// ...existing code...
const OpenAI = require('openai');
const db = require('./db');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const rbac = require('./rbac');
const i18n = require('./i18n');
const analytics = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const webhookModel = require('./webhookModel');
const pluginSystem = require('./pluginSystem');
const complianceModel = require('./complianceModel');
const router = express.Router();

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
      { role: 'system', content: 'You are an expert AI for abandoned checkout winback.' },
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
// i18n endpoint
router.get('/i18n', (req, res) => {
  res.json({ ok: true, i18n });
});

// Docs endpoint (returns static docs for now)
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Abandoned Checkout Winback API documentation.' });
});

// Winback email AI generation endpoint
router.post('/ai/winback-email', async (req, res) => {
  try {
    const { customer, cart } = req.body;
    if (!customer || !cart) return res.status(400).json({ ok: false, error: 'Missing customer or cart' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an ecommerce winback expert.' },
        { role: 'user', content: `Generate a winback email for customer ${customer} with cart: ${JSON.stringify(cart)}` }
      ],
      max_tokens: 256,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    webhookModel.handle(req.body || {});
    res.json({ ok: true, result: reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Compliance endpoint
// Analytics endpoint (placeholder)
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: { totalItems: db.list().length } });
});

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
  const { data } = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
  data.forEach(item => db.create(item));
  res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, data: db.list() });
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
  res.json({ ok: true, translations: { en: 'Abandoned Checkout Winback', fr: 'Relance panier abandonné' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Abandoned Checkout Winback API. Endpoints: /items, /ai/generate, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});
router.get('/compliance', (req, res) => {
  res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugin system endpoint
router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

module.exports = router;
