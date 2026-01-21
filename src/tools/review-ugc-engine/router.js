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
module.exports = router;

// CRUD
router.get('/reviews', (req, res) => res.json({ ok: true, reviews: db.list() }));
router.post('/reviews', (req, res) => {
	const review = db.create(req.body || {});
	res.json({ ok: true, review });
});
router.put('/reviews/:id', (req, res) => {
	const review = db.update(req.params.id, req.body || {});
	if (!review) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, review });
});
router.delete('/reviews/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// AI (OpenAI-powered review generator)
router.post('/ai/generate', async (req, res) => {
	try {
		const { product, sentiment } = req.body;
		if (!product) return res.status(400).json({ ok: false, error: 'Product required' });
		const prompt = `Write a ${sentiment || 'positive'} review for ${product}`;
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a review generator.' },
				{ role: 'user', content: prompt }
			],
			max_tokens: 128
		});
		const review = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, review });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message });
	}
});

// Analytics
router.post('/analytics', (req, res) => {
	const event = analyticsModel.recordEvent(req.body || {});
	res.json({ ok: true, event });
});
router.get('/analytics', (req, res) => res.json({ ok: true, analytics: analyticsModel.listEvents() }));

// Import/Export
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

// Shopify sync endpoint (to be implemented live)
// router.post('/shopify/sync', ...)

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
	res.json({ ok: true, docs: 'Review UGC Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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


// i18n endpoint (to be implemented live)
// router.get('/i18n', ...)

// Docs
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Review UGC Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

// ...existing code...
// ...existing code...