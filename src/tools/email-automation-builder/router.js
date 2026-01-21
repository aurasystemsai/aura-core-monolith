
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Persistent DB store
const emailDb = require('../../core/emailAutomation');

// CRUD endpoints

router.get('/emails', (req, res) => {
	res.json({ ok: true, emails: emailDb.listEmails(100) });
});
router.get('/emails/:id', (req, res) => {
	const email = emailDb.getEmail(req.params.id);
	if (!email) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, email });
});
router.post('/emails', (req, res) => {
	const { subject, body } = req.body;
	if (!subject || !body) return res.status(400).json({ ok: false, error: 'Missing subject or body' });
	const email = emailDb.addEmail({ subject, body });
	res.json({ ok: true, email });
});
router.put('/emails/:id', (req, res) => {
	const { subject, body } = req.body;
	if (!subject || !body) return res.status(400).json({ ok: false, error: 'Missing subject or body' });
	const updated = emailDb.updateEmail(req.params.id, { subject, body });
	res.json({ ok: true, email: updated });
});
router.delete('/emails/:id', (req, res) => {
	emailDb.deleteEmail(req.params.id);
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


// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
	res.json({ ok: true, analytics: { totalEmails: emailDb.totalEmails() } });
});


// Import/export endpoints (live)
router.post('/import', (req, res) => {
	try {
		const { data } = req.body;
		const count = emailDb.importEmails(data);
		res.json({ ok: true, count });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message });
	}
});
router.get('/export', (req, res) => {
	res.json({ ok: true, data: emailDb.exportEmails(1000) });
});


// All other endpoints removed or to be implemented live as needed

module.exports = router;