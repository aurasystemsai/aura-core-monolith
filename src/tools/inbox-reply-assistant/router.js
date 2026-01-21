const express = require('express');
// ...existing code...
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
router.get('/replies', (req, res) => {
	res.json({ ok: true, replies: db.list() });
});
router.get('/replies/:id', (req, res) => {
	const reply = db.get(req.params.id);
	if (!reply) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, reply });
});
router.post('/replies', (req, res) => {
	const reply = db.create(req.body || {});
	res.json({ ok: true, reply });
});
router.put('/replies/:id', (req, res) => {
	const reply = db.update(req.params.id, req.body || {});
	if (!reply) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, reply });
});
router.delete('/replies/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// AI endpoint: generate reply
router.post('/ai/generate', async (req, res) => {
	try {
		const { message } = req.body;
		if (!message) return res.status(400).json({ ok: false, error: 'Missing message' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a customer support reply assistant.' },
				{ role: 'user', content: `Generate a helpful reply to this message: ${message}` }
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
	res.json({ ok: true, docs: 'Inbox Reply Assistant API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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

// ...existing code...


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


// Shopify sync endpoint (to be implemented live)
// router.post('/shopify/sync', ...)

// Notifications endpoint (to be implemented live)
// router.post('/notify', ...)

// RBAC check endpoint (to be implemented live)
// router.post('/rbac/check', ...)

// i18n endpoint (to be implemented live)
// router.get('/i18n', ...)

// Docs endpoint (to be implemented live)
// router.get('/docs', ...)

module.exports = router;