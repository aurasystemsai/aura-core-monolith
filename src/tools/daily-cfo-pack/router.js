
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store for demo (replace with DB in production)
let reports = [];
let idCounter = 1;

// CRUD endpoints
router.get('/reports', (req, res) => {
	res.json({ ok: true, reports });
});
router.get('/reports/:id', (req, res) => {
	const report = reports.find(r => r.id == req.params.id);
	if (!report) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, report });
});
router.post('/reports', (req, res) => {
	const report = { ...req.body, id: idCounter++ };
	reports.push(report);
	res.json({ ok: true, report });
});
router.put('/reports/:id', (req, res) => {
	const idx = reports.findIndex(r => r.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	reports[idx] = { ...reports[idx], ...req.body };
	res.json({ ok: true, report: reports[idx] });
});
router.delete('/reports/:id', (req, res) => {
	const idx = reports.findIndex(r => r.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	reports.splice(idx, 1);
	res.json({ ok: true });
});

// AI endpoint: generate daily summary
router.post('/ai/generate-summary', async (req, res) => {
	try {
		const { data } = req.body;
		if (!data) return res.status(400).json({ ok: false, error: 'Missing data' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a CFO financial reporting assistant.' },
				{ role: 'user', content: `Generate a daily financial summary for this data: ${data}` }
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
	res.json({ ok: true, analytics: { totalReports: reports.length } });
});

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
	const { data } = req.body;
	if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
	reports = data.map((r, i) => ({ ...r, id: idCounter++ }));
	res.json({ ok: true, count: reports.length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: reports });
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
	res.json({ ok: true, translations: { en: 'Daily CFO Pack', fr: 'Pack CFO quotidien' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Daily CFO Pack API. Endpoints: /reports, /ai/generate-summary, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

module.exports = router;