
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Persistent DB store
const db = require('./db');


// CRUD endpoints (persistent)
router.get('/reports', (req, res) => {
  res.json({ ok: true, reports: db.list() });
});
router.get('/reports/:id', (req, res) => {
  const report = db.get(req.params.id);
  if (!report) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, report });
});
router.post('/reports', (req, res) => {
  const report = db.create(req.body || {});
  res.json({ ok: true, report });
});
router.put('/reports/:id', (req, res) => {
  const report = db.update(req.params.id, req.body || {});
  if (!report) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, report });
});
router.delete('/reports/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
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


// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: { totalReports: db.list().length } });
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