const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let creatives = [];
let analytics = [];


// Persistent DB store
const db = require('./db');

// CRUD endpoints (persistent)
router.get('/creatives', (req, res) => {
  res.json({ ok: true, creatives: db.list() });
});
router.post('/creatives', (req, res) => {
  const creative = db.create(req.body || {});
  res.json({ ok: true, creative });
});
router.put('/creatives/:id', (req, res) => {
  const creative = db.update(req.params.id, req.body || {});
  if (!creative) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, creative });
});
router.delete('/creatives/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI (OpenAI-powered creative generator)
router.post('/ai/generate', async (req, res) => {
	try {
		const { brief } = req.body;
		if (!brief) return res.status(400).json({ ok: false, error: 'Brief required' });
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a creative content generator for marketing and ads.' },
				{ role: 'user', content: brief }
			],
			max_tokens: 256
		});
		res.json({ ok: true, result: completion.choices[0]?.message?.content });
	} catch (e) {
		res.status(500).json({ ok: false, error: e.message });
	}
});


// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
	res.json({ ok: true, analytics: { totalCreatives: db.list().length } });
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