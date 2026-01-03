
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store for demo (replace with DB in production)
let autopilots = [];
let idCounter = 1;

// CRUD endpoints
router.get('/autopilots', (req, res) => {
	res.json({ ok: true, autopilots });
});
router.get('/autopilots/:id', (req, res) => {
	const autopilot = autopilots.find(a => a.id == req.params.id);
	if (!autopilot) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, autopilot });
});
router.post('/autopilots', (req, res) => {
	const autopilot = { ...req.body, id: idCounter++ };
	autopilots.push(autopilot);
	res.json({ ok: true, autopilot });
});
router.put('/autopilots/:id', (req, res) => {
	const idx = autopilots.findIndex(a => a.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	autopilots[idx] = { ...autopilots[idx], ...req.body };
	res.json({ ok: true, autopilot: autopilots[idx] });
});
router.delete('/autopilots/:id', (req, res) => {
	const idx = autopilots.findIndex(a => a.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	autopilots.splice(idx, 1);
	res.json({ ok: true });
});

// AI endpoint: suggest finance automation
router.post('/ai/suggest', async (req, res) => {
	try {
		const { financeData } = req.body;
		if (!financeData) return res.status(400).json({ ok: false, error: 'Missing financeData' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a finance automation expert.' },
				{ role: 'user', content: `Suggest a finance automation for this data: ${financeData}` }
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

// Analytics endpoint (placeholder)
router.get('/analytics', (req, res) => {
	res.json({ ok: true, analytics: { totalAutopilots: autopilots.length } });
});

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
	const { data } = req.body;
	if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
	autopilots = data.map((a, i) => ({ ...a, id: idCounter++ }));
	res.json({ ok: true, count: autopilots.length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: autopilots });
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
	res.json({ ok: true, translations: { en: 'Finance Autopilot', fr: 'Autopilote financier' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Finance Autopilot API. Endpoints: /autopilots, /ai/suggest, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

module.exports = router;