
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store for demo (replace with DB in production)
let links = [];
let idCounter = 1;

// CRUD endpoints
router.get('/links', (req, res) => {
	res.json({ ok: true, links });
});
router.get('/links/:id', (req, res) => {
	const link = links.find(l => l.id == req.params.id);
	if (!link) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, link });
});
router.post('/links', (req, res) => {
	const link = { ...req.body, id: idCounter++ };
	links.push(link);
	res.json({ ok: true, link });
});
router.put('/links/:id', (req, res) => {
	const idx = links.findIndex(l => l.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	links[idx] = { ...links[idx], ...req.body };
	res.json({ ok: true, link: links[idx] });
});
router.delete('/links/:id', (req, res) => {
	const idx = links.findIndex(l => l.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	links.splice(idx, 1);
	res.json({ ok: true });
});

// AI endpoint: suggest internal links
router.post('/ai/suggest', async (req, res) => {
	try {
		const { pageContent } = req.body;
		if (!pageContent) return res.status(400).json({ ok: false, error: 'Missing pageContent' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are an SEO internal linking expert.' },
				{ role: 'user', content: `Suggest internal links for this page content: ${pageContent}` }
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
	res.json({ ok: true, analytics: { totalLinks: links.length } });
});

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
	const { data } = req.body;
	if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
	links = data.map((l, i) => ({ ...l, id: idCounter++ }));
	res.json({ ok: true, count: links.length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: links });
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
	res.json({ ok: true, translations: { en: 'Internal Link Optimizer', fr: 'Optimiseur de liens internes' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Internal Link Optimizer API. Endpoints: /links, /ai/suggest, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

module.exports = router;