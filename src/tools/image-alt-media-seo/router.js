
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const db = require('./db');

// CRUD endpoints (persistent)
router.get('/images', (req, res) => {
  res.json({ ok: true, images: db.list() });
});
router.get('/images/:id', (req, res) => {
  const image = db.get(req.params.id);
  if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, image });
});
router.post('/images', (req, res) => {
  const image = db.create(req.body || {});
  res.json({ ok: true, image });
});
router.put('/images/:id', (req, res) => {
  const image = db.update(req.params.id, req.body || {});
  if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, image });
});
router.delete('/images/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
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


// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: { totalImages: db.list().length } });
});

// Import/export endpoints (live)
router.post('/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  db.import(items);
  res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

module.exports = router;