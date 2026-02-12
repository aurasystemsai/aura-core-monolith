
const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const analyticsModel = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhookModel = require('./webhookModel');
const complianceModel = require('./complianceModel');
const pluginSystem = require('./pluginSystem');
const { evaluatePrice } = require('./engine');
const { validateRule } = require('./validation');
const signalsStore = require('./signalsStore');
const experiments = require('./experiments');

const router = express.Router();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const requestId = () => `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// CRUD endpoints
router.get('/rules', (req, res) => {
	res.json({ ok: true, rules: db.list() });
});

router.get('/rules/:id', (req, res) => {
	const rule = db.get(req.params.id);
	if (!rule) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, rule });
});

router.post('/rules', (req, res) => {
	const payload = req.body || {};
	const { valid, errors } = validateRule(payload);
	if (!valid) return res.status(400).json({ ok: false, errors });
	const rule = db.create(payload);
	res.json({ ok: true, rule });
});

router.put('/rules/:id', (req, res) => {
	const payload = req.body || {};
	const { valid, errors } = validateRule(payload);
	if (!valid) return res.status(400).json({ ok: false, errors });
	const rule = db.update(req.params.id, payload);
	if (!rule) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, rule });
});

router.delete('/rules/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

router.post('/rules/:id/publish', (req, res) => {
	const rule = db.publish(req.params.id);
	if (!rule) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, rule });
});

router.post('/rules/:id/rollback', (req, res) => {
	const rule = db.rollback(req.params.id);
	if (!rule) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, rule });
});

router.post('/rules/validate', (req, res) => {
	const { valid, errors } = validateRule(req.body || {});
	if (!valid) {
		return res.status(400).json({ ok: false, valid: false, errors });
	}
	res.json({ ok: true, valid: true, errors: [] });
});

// Pricing endpoints
router.post('/pricing/evaluate', (req, res) => {
	const id = requestId();
	const result = evaluatePrice({ ...req.body, requestId: id });
	analyticsModel.recordEvent({ type: 'pricing.evaluate', requestId: id, input: req.body });
	res.json({ ok: true, requestId: id, price: result.price, diagnostics: result.diagnostics });
});

router.post('/ai/price', async (req, res) => {
	const id = requestId();
	try {
		if (!openai) {
			const fallback = evaluatePrice({ ...req.body, requestId: id });
			return res.json({ ok: true, requestId: id, price: fallback.price, diagnostics: { ...fallback.diagnostics, ai: 'fallback:no-key' } });
		}

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: 'You are a dynamic pricing expert. Output only the numeric recommended price.' },
				{ role: 'user', content: `Product: ${req.body?.productId || 'unknown'} | Base price: ${req.body?.basePrice} | Signals: ${JSON.stringify(req.body?.signals || {})}` }
			],
			max_tokens: 64,
			temperature: 0.4
		});

		const aiText = completion.choices[0]?.message?.content || '';
		const aiNumber = parseFloat(aiText.replace(/[^0-9.]/g, ''));
		const result = evaluatePrice({ ...req.body, basePrice: Number.isFinite(aiNumber) ? aiNumber : req.body.basePrice, requestId: id });

		analyticsModel.recordEvent({ type: 'pricing.ai', requestId: id, aiModel: 'gpt-4o-mini' });
		return res.json({ ok: true, requestId: id, aiSuggestion: aiNumber, price: result.price, diagnostics: { ...result.diagnostics, ai: aiText } });
	} catch (err) {
		const fallback = evaluatePrice({ ...req.body, requestId: id });
		res.status(500).json({ ok: false, requestId: id, error: err.message || 'AI error', fallback: { price: fallback.price, diagnostics: fallback.diagnostics } });
	}
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
	const event = analyticsModel.recordEvent(req.body || {});
	res.json({ ok: true, event });
});

router.get('/analytics', (req, res) => {
	res.json({ ok: true, events: analyticsModel.listEvents(req.query || {}) });
});

router.get('/analytics/summary', (req, res) => {
	res.json({ ok: true, summary: analyticsModel.summary() });
});

// Signals
router.post('/signals/ingest', (req, res) => {
	const items = req.body?.items;
	if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
	const ingested = signalsStore.ingest(items);
	res.json({ ok: true, count: ingested.length, summary: signalsStore.summary() });
});

router.get('/signals/summary', (req, res) => {
	res.json({ ok: true, summary: signalsStore.summary() });
});

// Import/export endpoints
router.post('/import', (req, res) => {
	const { items } = req.body || {};
	if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
	db.import(items);
	res.json({ ok: true, count: db.list().length });
});

router.get('/export', (req, res) => {
	res.json({ ok: true, items: db.list() });
});

// Shopify sync endpoints
router.post('/shopify/sync', (req, res) => {
	res.json({ ok: true, message: 'Shopify sync not implemented in demo.' });
});

// Notifications endpoints
router.post('/notify', (req, res) => {
	const { to, message } = req.body || {};
	if (!to || !message) return res.status(400).json({ ok: false, error: 'to and message required' });
	notificationModel.send(to, message);
	res.json({ ok: true });
});

// RBAC endpoint
router.post('/rbac/check', (req, res) => {
	const { user, action } = req.body || {};
	const allowed = rbac.check(user, action);
	res.json({ ok: true, allowed });
});

// i18n endpoint
router.get('/i18n', (req, res) => {
	res.json({ ok: true, i18n });
});

// Docs endpoint
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Dynamic Pricing Engine API: /rules, /pricing/evaluate, /ai/price, /analytics, /signals, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});

// Webhook endpoints
router.post('/webhooks/subscribe', (req, res) => {
	webhookModel.handle({ type: 'subscribe', ...req.body });
	res.json({ ok: true });
});

router.post('/webhooks/test', (req, res) => {
	webhookModel.handle({ type: 'test', payload: req.body });
	res.json({ ok: true });
});

// Compliance endpoint
router.get('/compliance', (req, res) => {
	res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugin system endpoint
router.post('/plugin', (req, res) => {
	pluginSystem.run(req.body || {});
	res.json({ ok: true });
});

// Feedback endpoint
router.post('/feedback', (req, res) => {
	const feedback = req.body?.feedback;
	if (!feedback) return res.status(400).json({ ok: false, error: 'feedback required' });
	analyticsModel.recordEvent({ type: 'feedback', feedback });
	res.json({ ok: true });
});

// Experiments endpoints
router.post('/experiments', (req, res) => {
	const experiment = experiments.createExperiment(req.body);
	res.json({ ok: true, experiment });
});

router.get('/experiments', (req, res) => {
	const list = experiments.listExperiments(req.query);
	res.json({ ok: true, experiments: list });
});

router.get('/experiments/:id', (req, res) => {
	const results = experiments.getExperimentResults(Number(req.params.id));
	if (!results) return res.status(404).json({ ok: false, error: 'Experiment not found' });
	res.json({ ok: true, ...results });
});

router.post('/experiments/:id/start', (req, res) => {
	const experiment = experiments.startExperiment(Number(req.params.id));
	if (!experiment) return res.status(404).json({ ok: false, error: 'Experiment not found' });
	res.json({ ok: true, experiment });
});

router.post('/experiments/:id/pause', (req, res) => {
	const experiment = experiments.pauseExperiment(Number(req.params.id), req.body?.reason);
	if (!experiment) return res.status(404).json({ ok: false, error: 'Experiment not found' });
	res.json({ ok: true, experiment });
});

router.post('/experiments/:id/complete', (req, res) => {
	const experiment = experiments.completeExperiment(Number(req.params.id));
	if (!experiment) return res.status(404).json({ ok: false, error: 'Experiment not found' });
	res.json({ ok: true, experiment });
});

router.post('/experiments/:id/assign', (req, res) => {
	const { userId, context } = req.body;
	if (!userId) return res.status(400).json({ ok: false, error: 'userId required' });
	
	const assignment = experiments.assignVariant(Number(req.params.id), userId, context);
	if (!assignment) return res.status(404).json({ ok: false, error: 'Experiment not active' });
	
	res.json({ ok: true, assignment });
});

router.post('/experiments/:id/outcome', (req, res) => {
	const { userId, outcome } = req.body;
	if (!userId || !outcome) return res.status(400).json({ ok: false, error: 'userId and outcome required' });
	
	const result = experiments.recordOutcome(Number(req.params.id), userId, outcome);
	if (!result) return res.status(404).json({ ok: false, error: 'Assignment not found' });
	
	res.json({ ok: true, ...result });
});

// Health check endpoint
router.get('/health', (req, res) => {
	res.json({ ok: true, status: 'healthy', timestamp: Date.now() });
});

module.exports = router;