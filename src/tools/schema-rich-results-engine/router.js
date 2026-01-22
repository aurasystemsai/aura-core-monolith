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
router.get('/schemas', (req, res) => {
	res.json({ ok: true, schemas: db.list() });
});
router.get('/schemas/:id', (req, res) => {
	const schema = db.get(req.params.id);
	if (!schema) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, schema });
});
router.post('/schemas', (req, res) => {
	const schema = db.create(req.body || {});
	res.json({ ok: true, schema });
});
router.put('/schemas/:id', (req, res) => {
	const schema = db.update(req.params.id, req.body || {});
	if (!schema) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, schema });
});
router.delete('/schemas/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// AI endpoint: generate schema
router.post('/ai/generate', async (req, res) => {
	try {
		const { type, data } = req.body;
		if (!type || !data) return res.status(400).json({ ok: false, error: 'type and data required' });
		const prompt = `Generate JSON-LD schema for type ${type} with data: ${JSON.stringify(data)}`;
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a schema.org JSON-LD generator.' },
				{ role: 'user', content: prompt }
			],
			max_tokens: 256
		});
		const schema = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, schema });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message });
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
	res.json({ ok: true, message: 'Shopify sync not yet implemented.' });
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
	res.json({ ok: true, docs: 'Schema Rich Results Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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