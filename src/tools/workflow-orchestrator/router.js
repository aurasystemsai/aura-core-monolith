const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = require('./db');
const analyticsModel = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhookModel = require('./webhookModel');
const complianceModel = require('./complianceModel');
const pluginSystem = require('./pluginSystem');
module.exports = router;


// CRUD endpoints (persistent)
router.get('/workflows', (req, res) => {
	res.json({ ok: true, workflows: db.list() });
});
router.get('/workflows/:id', (req, res) => {
	const wf = db.get(req.params.id);
	if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, workflow: wf });
});
router.post('/workflows', (req, res) => {
	const wf = db.create(req.body || {});
	res.json({ ok: true, workflow: wf });
});
router.put('/workflows/:id', (req, res) => {
	const wf = db.update(req.params.id, req.body || {});
	if (!wf) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, workflow: wf });
});
router.delete('/workflows/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// AI (OpenAI-powered orchestration suggestion)
router.post('/ai/suggest', async (req, res) => {
	try {
		const { description } = req.body;
		if (!description) return res.status(400).json({ ok: false, error: 'Description required' });
		   const completion = await openai.chat.completions.create({
			   model: 'gpt-4',
			   messages: [
				   { role: 'system', content: 'You are an expert workflow orchestrator.' },
				   { role: 'user', content: description }
			   ],
			   max_tokens: 256
		   });
		   res.json({ ok: true, suggestion: completion.choices[0].message.content });
	   } catch (err) {
		   res.status(500).json({ ok: false, error: err.message });
	   }
   });