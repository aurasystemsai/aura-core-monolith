const express = require('express');
const router = express.Router();
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Persistent DB store
// const db = require('./db');

// CRUD endpoints (persistent)
router.get('/insights', (req, res) => {
  res.json({ ok: true, insights: db.list() });
});
router.get('/insights/:id', (req, res) => {
  const insight = db.get(req.params.id);
  if (!insight) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, insight });
});
router.post('/insights', (req, res) => {
  const insight = db.create(req.body || {});
  res.json({ ok: true, insight });
});
router.put('/insights/:id', (req, res) => {
  const insight = db.update(req.params.id, req.body || {});
  if (!insight) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, insight });
});
router.delete('/insights/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: generate insight
router.post('/ai/generate', async (req, res) => {
	try {
		const { data } = req.body;
		if (!data) return res.status(400).json({ ok: false, error: 'Missing data' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a business insights expert.' },
				{ role: 'user', content: `Generate a business insight for this data: ${data}` }
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


// Import/export endpoints (live)
router.post('/import', (req, res) => {
	try {
		const { items } = req.body || {};
		db.import(items);
		res.json({ ok: true, count: db.list().length });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message });
	}
});
router.get('/export', (req, res) => {
	res.json({ ok: true, items: db.list() });
});


// All other endpoints removed or to be implemented live as needed

// i18n endpoint
router.get('/i18n', (req, res) => {
	res.json({ ok: true, i18n });
});

// Docs endpoint
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Auto Insights API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
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
	insights = data.map((i, idx) => ({ ...i, id: idCounter++ }));
	res.json({ ok: true, count: insights.length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: insights });
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
	res.json({ ok: true, translations: { en: 'Auto Insights', fr: 'Aperçus automatiques' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Auto Insights API. Endpoints: /insights, /ai/generate, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

// Remove duplicate import/export, i18n, docs, and placeholder endpoints

module.exports = router;