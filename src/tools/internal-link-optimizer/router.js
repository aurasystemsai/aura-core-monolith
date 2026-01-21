
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Persistent DB store
const db = require('./db');


// CRUD endpoints (persistent)
router.get('/links', (req, res) => {
  res.json({ ok: true, links: db.list() });
});
router.get('/links/:id', (req, res) => {
  const link = db.get(req.params.id);
  if (!link) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, link });
});
router.post('/links', (req, res) => {
  const link = db.create(req.body || {});
  res.json({ ok: true, link });
});
router.put('/links/:id', (req, res) => {
  const link = db.update(req.params.id, req.body || {});
  if (!link) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, link });
});
router.delete('/links/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
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


// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: { totalLinks: db.list().length } });
});


// Import/export endpoints (live)
router.post('/import', (req, res) => {
	try {
		const { data } = req.body;
		db.import(data);
		res.json({ ok: true, count: db.list().length });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message });
	}
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: db.list() });
});


// All other endpoints removed or to be implemented live as needed

module.exports = router;