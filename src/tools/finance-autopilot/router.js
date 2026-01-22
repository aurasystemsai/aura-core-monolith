const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Ensure db is required
const db = require('./db');

// CRUD endpoints (persistent)
router.get('/autopilots', (req, res) => {
	res.json({ ok: true, autopilots: db.list() });
});
router.get('/autopilots/:id', (req, res) => {
	const autopilot = db.get(req.params.id);
	if (!autopilot) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, autopilot });
});
router.post('/autopilots', (req, res) => {
	const autopilot = db.create(req.body || {});
	res.json({ ok: true, autopilot });
});
router.put('/autopilots/:id', (req, res) => {
	const autopilot = db.update(req.params.id, req.body || {});
	if (!autopilot) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, autopilot });
});
router.delete('/autopilots/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
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

// Analytics endpoint (persistent)
router.get('/analytics', (req, res) => {
	res.json({ ok: true, analytics: { totalAutopilots: db.list().length } });
});

// Import/export endpoints (persistent)
router.post('/import', (req, res) => {
	const { items } = req.body || {};
	if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
	db.import(items);
	res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, items: db.list() });
});
router.delete('/autopilots/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// Ensure router is exported
module.exports = router;