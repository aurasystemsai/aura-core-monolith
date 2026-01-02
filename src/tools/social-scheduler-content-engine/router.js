const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let posts = [];
let analytics = [];

// CRUD
router.get('/posts', (req, res) => res.json({ ok: true, posts }));
router.post('/posts', (req, res) => {
	const post = { ...req.body, id: Date.now().toString() };
	posts.push(post);
	res.json({ ok: true, post });
});
router.put('/posts/:id', (req, res) => {
	const idx = posts.findIndex(p => p.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	posts[idx] = { ...posts[idx], ...req.body };
	res.json({ ok: true, post: posts[idx] });
});
router.delete('/posts/:id', (req, res) => {
	const idx = posts.findIndex(p => p.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	posts.splice(idx, 1);
	res.json({ ok: true });
});

// AI (OpenAI-powered social post generator)
router.post('/ai/generate', async (req, res) => {
	try {
		const { topic } = req.body;
		if (!topic) return res.status(400).json({ ok: false, error: 'Topic required' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a social media content generator.' },
				{ role: 'user', content: topic }
			],
			max_tokens: 256
		});
		const content = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, content });
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
	if (!Array.isArray(req.body.posts)) return res.status(400).json({ ok: false, error: 'posts[] required' });
	posts = req.body.posts;
	res.json({ ok: true, count: posts.length });
});
router.get('/export', (req, res) => res.json({ ok: true, posts }));

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
	res.json({ ok: true, translations: { en: 'Social Post', es: 'Publicación social' } });
});

// Docs
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Social Scheduler Content Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

module.exports = router;