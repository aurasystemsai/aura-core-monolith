
// --- Integrations flagship endpoints ---
// List all integrations
router.get('/integrations', async (req, res) => {
  try {
    const integrations = await db.listIntegrations?.(req.query) || [];
    res.json({ ok: true, integrations });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// Connect an integration
router.post('/integrations/:id/connect', async (req, res) => {
  try {
    const integration = await db.connectIntegration?.(req.params.id);
    res.json({ ok: true, integration });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
// Disconnect an integration
router.post('/integrations/:id/disconnect', async (req, res) => {
  try {
    const integration = await db.disconnectIntegration?.(req.params.id);
    res.json({ ok: true, integration });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
// --- Automation flagship endpoints ---
// List all automation rules
router.get('/automation', async (req, res) => {
  try {
    const rules = await db.listAutomationRules?.(req.query) || [];
    res.json({ ok: true, rules });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
// Create a new automation rule
router.post('/automation', async (req, res) => {
  try {
    const rule = await db.createAutomationRule?.(req.body);
    res.status(201).json({ ok: true, rule });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});
// Delete an automation rule by ID
router.delete('/automation/:id', async (req, res) => {
  try {
    const ok = await db.deleteAutomationRule?.(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const rbac = require('./rbac');
const i18n = require('./i18n');
const analytics = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const webhookModel = require('./webhookModel');
const pluginSystem = require('./pluginSystem');
const complianceModel = require('./complianceModel');
const bandit = require('./bandit');
const apiKeys = require('./apiKeys');
const { sendSlackNotification } = require('./slackNotify');
const auditModel = require('./auditModel');
const openaiUtil = require('./openai');
const router = express.Router();

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
router.get('/compliance', (req, res) => {
  res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugin system endpoint
router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

// --- Abandoned Checkout flagship endpoints ---

// List all abandoned checkouts
router.get('/abandonedcheckout', async (req, res) => {
  try {
    // Replace with real DB/model call
    const checkouts = await db.listAbandonedCheckouts?.(req.query) || [];
    res.json({ ok: true, checkouts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get a single abandoned checkout by ID
router.get('/abandonedcheckout/:id', async (req, res) => {
  try {
    const checkout = await db.getAbandonedCheckout?.(req.params.id);
    if (!checkout) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, checkout });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Create a new abandoned checkout record
router.post('/abandonedcheckout', async (req, res) => {
  try {
    const created = await db.createAbandonedCheckout?.(req.body);
    res.status(201).json({ ok: true, checkout: created });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Update abandoned checkout by ID
router.put('/abandonedcheckout/:id', async (req, res) => {
  try {
    const updated = await db.updateAbandonedCheckout?.(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, checkout: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Delete abandoned checkout by ID
router.delete('/abandonedcheckout/:id', async (req, res) => {
  try {
    const ok = await db.deleteAbandonedCheckout?.(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Analyze abandoned checkouts (e.g., for winback insights)
router.post('/abandonedcheckout/analyze', async (req, res) => {
  try {
    // Placeholder: implement real analytics logic
    const { from, to, filters } = req.body || {};
    const analysis = await analytics.analyzeAbandonedCheckouts?.({ from, to, filters }) || {};
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Create a winback campaign for abandoned checkouts
router.post('/abandonedcheckout/winback-campaign', async (req, res) => {
  try {
    // Placeholder: implement real campaign creation logic
    const { checkoutIds, templateId, discount, schedule } = req.body || {};
    const campaign = await db.createWinbackCampaign?.({ checkoutIds, templateId, discount, schedule });
    res.status(201).json({ ok: true, campaign });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Preview winback email for a checkout
router.post('/abandonedcheckout/winback-preview', async (req, res) => {
  try {
    const { checkoutId, templateId, customMessage } = req.body || {};
    // Placeholder: implement real preview logic
    const preview = await openaiUtil.generateWinbackMessagePreview?.({ checkoutId, templateId, customMessage });
    res.json({ ok: true, preview });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Get analytics for winback campaigns
router.get('/abandonedcheckout/winback-analytics', async (req, res) => {
  try {
    // Placeholder: implement real analytics logic
    const analyticsData = await analytics.getWinbackCampaignAnalytics?.(req.query) || {};
    res.json({ ok: true, analytics: analyticsData });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Abandoned Checkout Winback Templates ---

// List all winback templates
router.get('/abandonedcheckout/templates', async (req, res) => {
  try {
    const templates = await db.listWinbackTemplates?.(req.query) || [];
    res.json({ ok: true, templates });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get a single winback template by ID
router.get('/abandonedcheckout/templates/:id', async (req, res) => {
  try {
    const template = await db.getWinbackTemplate?.(req.params.id);
    if (!template) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, template });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Create a new winback template
router.post('/abandonedcheckout/templates', async (req, res) => {
  try {
    const created = await db.createWinbackTemplate?.(req.body);
    res.status(201).json({ ok: true, template: created });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Update a winback template
router.put('/abandonedcheckout/templates/:id', async (req, res) => {
  try {
    const updated = await db.updateWinbackTemplate?.(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, template: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Delete a winback template
router.delete('/abandonedcheckout/templates/:id', async (req, res) => {
  try {
    const ok = await db.deleteWinbackTemplate?.(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Winback Send Scheduling & Tracking ---

// Schedule a winback send for a checkout
router.post('/abandonedcheckout/schedule-send', async (req, res) => {
  try {
    const { checkoutId, templateId, sendAt } = req.body || {};
    const scheduled = await db.scheduleWinbackSend?.({ checkoutId, templateId, sendAt });
    res.status(201).json({ ok: true, scheduled });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// List scheduled winback sends
router.get('/abandonedcheckout/scheduled-sends', async (req, res) => {
  try {
    const sends = await db.listScheduledWinbackSends?.(req.query) || [];
    res.json({ ok: true, sends });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Track winback send status (delivered, opened, clicked, etc.)
router.get('/abandonedcheckout/send-status/:sendId', async (req, res) => {
  try {
    const status = await db.getWinbackSendStatus?.(req.params.sendId);
    if (!status) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, status });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Customer-level Winback History ---

// Get winback history for a customer
router.get('/abandonedcheckout/customer/:customerId/history', async (req, res) => {
  try {
    const history = await db.getCustomerWinbackHistory?.(req.params.customerId);
    res.json({ ok: true, history: history || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Winback Performance & Experimentation ---

// Get winback performance summary (open/click/recovery rates, revenue, etc.)
router.get('/abandonedcheckout/performance', async (req, res) => {
  try {
    const summary = await analytics.getWinbackPerformanceSummary?.(req.query) || {};
    res.json({ ok: true, performance: summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Run an A/B test on winback templates
router.post('/abandonedcheckout/ab-test', async (req, res) => {
  try {
    const { templateAId, templateBId, audienceSize } = req.body || {};
    const abTest = await db.createWinbackAbTest?.({ templateAId, templateBId, audienceSize });
    res.status(201).json({ ok: true, abTest });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Get results for a winback A/B test
router.get('/abandonedcheckout/ab-test/:testId/results', async (req, res) => {
  try {
    const results = await analytics.getWinbackAbTestResults?.(req.params.testId);
    if (!results) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// List all winback A/B tests
router.get('/abandonedcheckout/ab-tests', async (req, res) => {
  try {
    const abTests = await db.listWinbackAbTests?.(req.query) || [];
    res.json({ ok: true, abTests });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Winback Webhook & Integration Endpoints ---

// Receive webhook for checkout updates (e.g., Shopify abandoned checkout webhook)
router.post('/abandonedcheckout/webhook', async (req, res) => {
  try {
    // Validate and process webhook payload
    await webhookModel.handleAbandonedCheckoutWebhook?.(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Trigger winback flow for a checkout (manual or automated)
router.post('/abandonedcheckout/trigger', async (req, res) => {
  try {
    const { checkoutId, templateId, channel } = req.body || {};
    const result = await db.triggerWinbackFlow?.({ checkoutId, templateId, channel });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// List available winback channels/integrations (e.g., email, SMS, WhatsApp)
router.get('/abandonedcheckout/channels', async (req, res) => {
  try {
    const channels = await db.listWinbackChannels?.() || ['email', 'sms', 'whatsapp'];
    res.json({ ok: true, channels });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Integration status for winback (e.g., Klaviyo, Mailchimp, SMS providers)
router.get('/abandonedcheckout/integrations', async (req, res) => {
  try {
    const integrations = await db.getWinbackIntegrationsStatus?.() || [];
    res.json({ ok: true, integrations });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Connect or update a winback integration
router.post('/abandonedcheckout/integrations', async (req, res) => {
  try {
    const { provider, credentials } = req.body || {};
    const result = await db.connectWinbackIntegration?.({ provider, credentials });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
