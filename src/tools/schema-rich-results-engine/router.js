const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let schemas = [];
let analytics = [];

// CRUD
router.get('/schemas', (req, res) => res.json({ ok: true, schemas }));
router.post('/schemas', (req, res) => {
	const schema = { ...req.body, id: Date.now().toString() };
	schemas.push(schema);
	res.json({ ok: true, schema });
});
router.put('/schemas/:id', (req, res) => {
	const idx = schemas.findIndex(s => s.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	schemas[idx] = { ...schemas[idx], ...req.body };
	res.json({ ok: true, schema: schemas[idx] });
});
router.delete('/schemas/:id', (req, res) => {
	const idx = schemas.findIndex(s => s.id === req.params.id);
	if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
	schemas.splice(idx, 1);
	res.json({ ok: true });
});

// AI (OpenAI-powered schema generator)
router.post('/ai/generate', async (req, res) => {
	try {
		const { type, data } = req.body;
		if (!type || !data) return res.status(400).json({ ok: false, error: 'type and data required' });
		const prompt = `Generate JSON-LD schema for type ${type} with data: ${JSON.stringify(data)}`;
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: 'You are a schema.org JSON-LD generator.' },
				{ role: 'user', content: prompt }
			],
			max_tokens: 256
		});
		const schema = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, schema });
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
	if (!Array.isArray(req.body.schemas)) return res.status(400).json({ ok: false, error: 'schemas[] required' });
	schemas = req.body.schemas;
	res.json({ ok: true, count: schemas.length });
});
router.get('/export', (req, res) => res.json({ ok: true, schemas }));

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
	res.json({ ok: true, translations: { en: 'Schema', es: 'Esquema' } });
});

// Docs
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Schema Rich Results Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

module.exports = router;