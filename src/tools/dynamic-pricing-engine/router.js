
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
router.get('/rules', (req, res) => {
	res.json({ ok: true, rules: db.list() });
});
router.get('/rules/:id', (req, res) => {
	const rule = db.get(req.params.id);
	if (!rule) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, rule });
});
router.post('/rules', (req, res) => {
	const rule = db.create(req.body || {});
	res.json({ ok: true, rule });
});
router.put('/rules/:id', (req, res) => {
	const rule = db.update(req.params.id, req.body || {});
	if (!rule) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, rule });
});
router.delete('/rules/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// AI endpoint: suggest pricing rule
router.post('/ai/suggest', async (req, res) => {
	try {
		const { productData } = req.body;
		if (!productData) return res.status(400).json({ ok: false, error: 'Missing productData' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a dynamic pricing expert.' },
				{ role: 'user', content: `Suggest a pricing rule for this product data: ${productData}` }
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
	res.json({ ok: true, docs: 'Dynamic Pricing Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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

router.post('/notify', (req, res) => {
	res.json({ ok: true, message: 'Notification sent (demo).' });
});

// RBAC check endpoint (placeholder)
router.post('/rbac/check', (req, res) => {
	res.json({ ok: true, allowed: true });
});

// i18n endpoint (placeholder)
router.get('/i18n', (req, res) => {
	res.json({ ok: true, translations: { en: 'Dynamic Pricing Engine', fr: 'Moteur de tarification dynamique' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Dynamic Pricing Engine API. Endpoints: /rules, /ai/suggest, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

module.exports = router;