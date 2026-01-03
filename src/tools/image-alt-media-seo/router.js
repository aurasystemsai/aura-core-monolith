
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store for demo (replace with DB in production)
let images = [];
let idCounter = 1;

// CRUD endpoints
router.get('/images', (req, res) => {
	res.json({ ok: true, images });
});
router.get('/images/:id', (req, res) => {
	const image = images.find(i => i.id == req.params.id);
	if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, image });
});
router.post('/images', (req, res) => {
	const image = { ...req.body, id: idCounter++ };
	images.push(image);
	res.json({ ok: true, image });
});
router.put('/images/:id', (req, res) => {
	const idx = images.findIndex(i => i.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	images[idx] = { ...images[idx], ...req.body };
	res.json({ ok: true, image: images[idx] });
});
router.delete('/images/:id', (req, res) => {
	const idx = images.findIndex(i => i.id == req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	images.splice(idx, 1);
	res.json({ ok: true });
});

// AI endpoint: generate alt text
router.post('/ai/generate-alt', async (req, res) => {
	try {
		const { imageDescription } = req.body;
		if (!imageDescription) return res.status(400).json({ ok: false, error: 'Missing imageDescription' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are an image SEO expert.' },
				{ role: 'user', content: `Generate alt text for this image: ${imageDescription}` }
			],
			max_tokens: 128,
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
	res.json({ ok: true, analytics: { totalImages: images.length } });
});

// Import/export endpoints (placeholder logic)
router.post('/import', (req, res) => {
	const { data } = req.body;
	if (!Array.isArray(data)) return res.status(400).json({ ok: false, error: 'Invalid data' });
	images = data.map((i, idx) => ({ ...i, id: idCounter++ }));
	res.json({ ok: true, count: images.length });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: images });
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
	res.json({ ok: true, translations: { en: 'Image Alt Media SEO', fr: 'SEO des médias alternatifs d\'image' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Image Alt Media SEO API. Endpoints: /images, /ai/generate-alt, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

module.exports = router;