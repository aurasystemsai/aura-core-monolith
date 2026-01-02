const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store for demo (replace with DB in prod)
let workflows = [];
let analytics = [];

// CRUD
router.get('/workflows', (req, res) => res.json({ ok: true, workflows }));
router.post('/workflows', (req, res) => {
	const wf = { ...req.body, id: Date.now().toString() };
	workflows.push(wf);
	res.json({ ok: true, workflow: wf });
});
router.put('/workflows/:id', (req, res) => {
	const idx = workflows.findIndex(w => w.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	workflows[idx] = { ...workflows[idx], ...req.body };
	res.json({ ok: true, workflow: workflows[idx] });
});
router.delete('/workflows/:id', (req, res) => {
	const idx = workflows.findIndex(w => w.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	workflows.splice(idx, 1);
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
		const suggestion = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, suggestion });
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
	if (!Array.isArray(req.body.workflows)) return res.status(400).json({ ok: false, error: 'workflows[] required' });
	workflows = req.body.workflows;
	res.json({ ok: true, count: workflows.length });
});
router.get('/export', (req, res) => res.json({ ok: true, workflows }));

// Shopify sync (placeholder)
router.post('/shopify/sync', (req, res) => {
	// Implement Shopify sync logic here
	res.json({ ok: true, message: 'Shopify sync not yet implemented' });
});

// Notifications (placeholder)
router.post('/notify', (req, res) => {
	// Implement notification logic here
	res.json({ ok: true, message: 'Notification sent (demo)' });
});

// RBAC (demo)
router.post('/rbac/check', (req, res) => {
	const { user, action } = req.body;
	// Implement real RBAC logic
	res.json({ ok: true, allowed: true });
});

// i18n (demo)
router.get('/i18n', (req, res) => {
	res.json({ ok: true, translations: { en: 'Workflow', es: 'Flujo de trabajo' } });
});

// Docs
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Workflow Orchestrator API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

module.exports = router;