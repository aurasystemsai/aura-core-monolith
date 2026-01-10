const express = require('express');
const router = express.Router();
// ...existing code...
// Residency/compliance endpoints
router.post('/compliance/export', (req, res) => {
  const { userId } = req.body || {};
  const reqObj = complianceModel.requestDataExport(userId);
  res.json({ ok: true, request: reqObj });
});
router.post('/compliance/delete', (req, res) => {
  const { userId } = req.body || {};
  const reqObj = complianceModel.requestDataDelete(userId);
  res.json({ ok: true, request: reqObj });
});
router.get('/compliance/requests', (req, res) => {
  const reqs = complianceModel.listRequests(req.query || {});
  res.json({ ok: true, requests: reqs });
});
router.post('/compliance/update', (req, res) => {
  const { id, status } = req.body || {};
  const updated = complianceModel.updateRequestStatus(id, status);
  res.json({ ok: true, updated });
});
const bandit = require('./bandit');
// Bandit optimization endpoints
router.post('/bandit/select', (req, res) => {
  const { variantIds } = req.body || {};
  if (!Array.isArray(variantIds) || !variantIds.length) return res.status(400).json({ ok: false, error: 'variantIds[] required' });
  const selected = bandit.selectVariant(variantIds);
  res.json({ ok: true, selected });
});
router.post('/bandit/reward', (req, res) => {
  const { variantId, reward } = req.body || {};
  if (!variantId || typeof reward !== 'number') return res.status(400).json({ ok: false, error: 'variantId and reward required' });
  bandit.recordResult(variantId, reward);
  res.json({ ok: true });
});
const apiKeys = require('./apiKeys');
// API key management endpoints
router.post('/apikeys/create', (req, res) => {
  const { userId } = req.body || {};
  const key = apiKeys.createKey(userId);
  res.json({ ok: true, key });
});
router.post('/apikeys/revoke', (req, res) => {
  const { key } = req.body || {};
  apiKeys.revokeKey(key);
  res.json({ ok: true });
});
router.get('/apikeys', (req, res) => {
  const { userId } = req.query || {};
  const keys = apiKeys.listKeys(userId);
  res.json({ ok: true, keys });
});
const { sendSlackNotification } = require('./slackNotify');
// Slack notification endpoint
router.post('/notify/slack', async (req, res) => {
  try {
    const { webhookUrl, message } = req.body || {};
    await sendSlackNotification(webhookUrl, message);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
const auditModel = require('./auditModel');
// RBAC check endpoint (flagship)
router.post('/rbac/check', (req, res) => {
  const { role, action } = req.body || {};
  const allowed = rbac.can(role, action);
  res.json({ ok: true, allowed });
});

// Audit log endpoints
router.post('/audit', (req, res) => {
  const entry = auditModel.recordAudit(req.body || {});
  res.json({ ok: true, entry });
});
router.get('/audit', (req, res) => {
  const entries = auditModel.listAudits(req.query || {});
  res.json({ ok: true, entries });
});
const openaiUtil = require('./openai');
// AI-powered content/segmentation endpoint
router.post('/ai/content', async (req, res) => {
  try {
    const { customerName, cartItems, discount, brand, tone, channel, language, customPrompt } = req.body || {};
    const content = await openaiUtil.generateWinbackMessage({ customerName, cartItems, discount, brand, tone, channel, language, customPrompt });
    res.json({ ok: true, content });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// ...existing code...
const OpenAI = require('openai');
const db = require('./db');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// ...existing code...
const i18n = require('./i18n');
const analytics = require('./analyticsModel');
// Removed duplicate notificationModel declaration
const webhookModel = require('./webhookModel');
const pluginSystem = require('./pluginSystem');
// Removed duplicate complianceModel declaration
// ...existing code...

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
  try {
    const event = analytics.recordEvent(req.body || {});
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/analytics', (req, res) => {
  try {
    const events = analytics.listEvents(req.query || {});
    res.json({ ok: true, events });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
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
// (Removed duplicate placeholder)

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


// Shopify sync endpoint (real implementation)
const shopify = require('./shopify');
router.post('/shopify/sync', async (req, res) => {
  try {
    const { shop, token, apiVersion } = req.body || {};
    const checkouts = await shopify.fetchAbandonedCheckouts({ shop, token, apiVersion });
    res.json({ ok: true, checkouts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Notifications endpoint (real implementation)
// ...existing code...
router.post('/notify', (req, res) => {
  try {
    const notification = notificationModel.addNotification(req.body || {});
    res.json({ ok: true, notification });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/notifications', (req, res) => {
  try {
    const notifications = notificationModel.listNotifications(req.query || {});
    res.json({ ok: true, notifications });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/notifications/read', (req, res) => {
  try {
    const { id } = req.body || {};
    const ok = notificationModel.markAsRead(id);
    res.json({ ok });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// RBAC check endpoint (real implementation)
const rbac = require('./rbac');
router.post('/rbac/check', (req, res) => {
  try {
    const { role, action } = req.body || {};
    const allowed = rbac.can(role, action);
    res.json({ ok: true, allowed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// i18n endpoint (real implementation)
// ...existing code...
router.get('/i18n', (req, res) => {
  try {
    const { lang, key } = req.query || {};
    const value = i18n.t(lang || 'en', key || 'subject');
    res.json({ ok: true, value });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Docs endpoint (returns static docs for now)
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Abandoned Checkout Winback API documentation.' });
});

// Compliance endpoint (real implementation)
// ...existing code...
router.get('/compliance', (req, res) => {
  try {
    const compliance = complianceModel.get();
    res.json({ ok: true, compliance });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Plugin system endpoint
router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

module.exports = router;
