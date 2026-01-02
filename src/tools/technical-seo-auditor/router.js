const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let audits = [];
let analytics = [];

// CRUD
router.get('/audits', (req, res) => res.json({ ok: true, audits }));
router.post('/audits', (req, res) => {
	const audit = { ...req.body, id: Date.now().toString() };
	audits.push(audit);
	res.json({ ok: true, audit });
});
router.put('/audits/:id', (req, res) => {
	const idx = audits.findIndex(a => a.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	audits[idx] = { ...audits[idx], ...req.body };
	res.json({ ok: true, audit: audits[idx] });
});
router.delete('/audits/:id', (req, res) => {
	const idx = audits.findIndex(a => a.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	audits.splice(idx, 1);
	res.json({ ok: true });
});

// AI (OpenAI-powered SEO audit)
router.post('/ai/audit', async (req, res) => {
	try {
		const { url } = req.body;
		if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a technical SEO auditor.' },
				{ role: 'user', content: `Audit this URL: ${url}` }
			],
			max_tokens: 512
		});
		const report = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, report });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message });
	}
});

// Analytics
router.post('/analytics', (req, res) => {
	analytics.push({ ...req.body, ts: Date.now() });
	res.json({ ok: true });
});
router.get('/analytics', (req, res) => res.json({ ok: true, analytics }));

// Import/Export
router.post('/import', (req, res) => {
	if (!Array.isArray(req.body.audits)) return res.status(400).json({ ok: false, error: 'audits[] required' });
	audits = req.body.audits;
	res.json({ ok: true, count: audits.length });
});
router.get('/export', (req, res) => res.json({ ok: true, audits }));

// Shopify sync (placeholder)
router.post('/shopify/sync', (req, res) => {
	res.json({ ok: true, message: 'Shopify sync not yet implemented' });
});

// Notifications (placeholder)
router.post('/notify', (req, res) => {
	res.json({ ok: true, message: 'Notification sent (demo)' });
});

// RBAC (demo)
router.post('/rbac/check', (req, res) => {
	res.json({ ok: true, allowed: true });
});

// i18n (demo)
router.get('/i18n', (req, res) => {
	res.json({ ok: true, translations: { en: 'SEO Audit', es: 'Auditoría SEO' } });
});

// Docs
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Technical SEO Auditor API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

module.exports = router;