const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let reviews = [];
let analytics = [];

// CRUD
router.get('/reviews', (req, res) => res.json({ ok: true, reviews }));
router.post('/reviews', (req, res) => {
	const review = { ...req.body, id: Date.now().toString() };
	reviews.push(review);
	res.json({ ok: true, review });
});
router.put('/reviews/:id', (req, res) => {
	const idx = reviews.findIndex(r => r.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	reviews[idx] = { ...reviews[idx], ...req.body };
	res.json({ ok: true, review: reviews[idx] });
});
router.delete('/reviews/:id', (req, res) => {
	const idx = reviews.findIndex(r => r.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	reviews.splice(idx, 1);
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
	analytics.push({ ...req.body, ts: Date.now() });
	res.json({ ok: true });
});
router.get('/analytics', (req, res) => res.json({ ok: true, analytics }));

// Import/Export
router.post('/import', (req, res) => {
	if (!Array.isArray(req.body.reviews)) return res.status(400).json({ ok: false, error: 'reviews[] required' });
	reviews = req.body.reviews;
	res.json({ ok: true, count: reviews.length });
});
router.get('/export', (req, res) => res.json({ ok: true, reviews }));

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
	res.json({ ok: true, translations: { en: 'Review', es: 'Reseña' } });
});

// Docs
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Review UGC Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

module.exports = router;