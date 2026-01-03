
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store for demo (replace with DB in production)
let emails = [];
let idCounter = 1;

// CRUD endpoints
router.get('/emails', (req, res) => {
	res.json({ ok: true, emails });
});
router.get('/emails/:id', (req, res) => {
	const email = emails.find(e => e.id == req.params.id);
	if (!email) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, email });
});
router.post('/emails', (req, res) => {
	const email = { ...req.body, id: idCounter++ };
	emails.push(email);
	res.json({ ok: true, email });
});
router.put('/emails/:id', (req, res) => {
	const idx = emails.findIndex(e => e.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	emails[idx] = { ...emails[idx], ...req.body };
	res.json({ ok: true, email: emails[idx] });
});
router.delete('/emails/:id', (req, res) => {
	const idx = emails.findIndex(e => e.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	emails.splice(idx, 1);
	res.json({ ok: true });
});

// AI endpoint: generate email
router.post('/ai/generate', async (req, res) => {
	try {
		const { topic } = req.body;
		if (!topic) return res.status(400).json({ ok: false, error: 'Missing topic' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are an email marketing expert.' },
				{ role: 'user', content: `Generate an email for this topic: ${topic}` }
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
	res.json({ ok: true, analytics: { totalEmails: emails.length } });
});

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
	const { data } = req.body;
	if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
	emails = data.map((e, i) => ({ ...e, id: idCounter++ }));
	res.json({ ok: true, count: emails.length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: emails });
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
	res.json({ ok: true, translations: { en: 'Email Automation Builder', fr: 'Générateur d\'automatisation des e-mails' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Email Automation Builder API. Endpoints: /emails, /ai/generate, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

module.exports = router;