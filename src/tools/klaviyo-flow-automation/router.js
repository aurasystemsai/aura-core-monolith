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
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints (persistent JSON store)
router.get('/flows', (req, res) => {
  res.json({ ok: true, flows: db.list() });
});

router.get('/flows/:id', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow });
});

router.post('/flows', (req, res) => {
  const flow = db.create(req.body || {});
  res.json({ ok: true, flow });
});

router.put('/flows/:id', (req, res) => {
  const flow = db.update(req.params.id, req.body || {});
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow });
});

router.delete('/flows/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI helpers
async function generateFlowSuggestion(goal) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a Klaviyo automation expert.' },
      { role: 'user', content: `Suggest a Klaviyo flow for this goal: ${goal}` }
    ],
    max_tokens: 256,
    temperature: 0.7
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

router.post('/ai/generate', async (req, res) => {
  try {
    const { goal } = req.body || {};
    if (!goal) return res.status(400).json({ ok: false, error: 'Missing goal' });
    const suggestion = await generateFlowSuggestion(goal);
    res.json({ ok: true, result: suggestion });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

router.post('/ai/suggest', async (req, res) => {
  try {
    const { flow, goal } = req.body || {};
    const promptGoal = goal || (flow ? `Improve this flow: ${flow}` : null);
    if (!promptGoal) return res.status(400).json({ ok: false, error: 'Missing goal or flow' });
    const suggestion = await generateFlowSuggestion(promptGoal);
    res.json({ ok: true, suggestion });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

router.post('/ai/automate', async (req, res) => {
  try {
    const { flow } = req.body || {};
    if (!flow) return res.status(400).json({ ok: false, error: 'Missing flow' });
    const steps = flow.split('->').map(s => s.trim()).filter(Boolean);
    const analytics = {
      summary: 'Automation simulated successfully',
      steps: steps.length,
      triggers: steps.filter(s => /trigger/i.test(s)).length,
      actions: steps.filter(s => /action|email|sms|notify/i.test(s)).length,
      branches: steps.filter(s => /if|branch|condition/i.test(s)).length,
      preview: steps.slice(0, 5),
      timestamp: Date.now(),
    };
    analyticsModel.recordEvent({ type: 'run', analytics });
    res.json({ ok: true, analytics });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Automation error' });
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

// Import/export endpoints
router.post('/import', (req, res) => {
  try {
    const { items } = req.body || {};
    db.import(items);
    res.json({ ok: true, count: db.list().length });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

// i18n endpoint
router.get('/i18n', (req, res) => {
  res.json({ ok: true, i18n });
});

// Docs endpoint
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Klaviyo Flow Automation API: CRUD, AI (suggest/automate), analytics, import/export, webhook, notifications, RBAC, i18n.' });
});

// Webhook endpoint
router.post('/webhook', (req, res) => {
  webhookModel.handle(req.body || {});
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

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: Date.now() });
});

// Notify endpoint
router.post('/notify', (req, res) => {
  const { to = 'ops@aura', message = 'Notification' } = req.body || {};
  notificationModel.send(to, message);
  res.json({ ok: true, message: 'Notification queued', to });
});

// RBAC check endpoint
router.post('/rbac/check', (req, res) => {
  const { userRole = 'viewer', action = 'read' } = req.body || {};
  const allowed = rbac.check(userRole, action);
  res.json({ ok: true, allowed });
});

module.exports = router;const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const analyticsModel = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhookModel = require('./webhookModel');
const complianceModel = require('./complianceModel');
const pluginSystem = require('./pluginSystem');
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// Persistent DB store
// const db = require('./db');

// CRUD endpoints (persistent)
router.get('/flows', (req, res) => {
  res.json({ ok: true, flows: db.list() });
});
router.get('/flows/:id', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow });
});
router.post('/flows', (req, res) => {
  const flow = db.create(req.body || {});
  res.json({ ok: true, flow });
});
router.put('/flows/:id', (req, res) => {
  const flow = db.update(req.params.id, req.body || {});
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow });
});
router.delete('/flows/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

async function generateFlowSuggestion(goal) {
	const completion = await openai.chat.completions.create({
		model: 'gpt-4',
		messages: [
			{ role: 'system', content: 'You are a Klaviyo automation expert.' },
			{ role: 'user', content: `Suggest a Klaviyo flow for this goal: ${goal}` }
		],
		max_tokens: 256,
		temperature: 0.7
	});
	return completion.choices[0]?.message?.content?.trim() || '';
}

router.post('/ai/generate', async (req, res) => {
	try {
		const { goal } = req.body;
		if (!goal) return res.status(400).json({ ok: false, error: 'Missing goal' });
		const suggestion = await generateFlowSuggestion(goal);
		res.json({ ok: true, result: suggestion });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message || 'AI error' });
	}
});

router.post('/ai/suggest', async (req, res) => {
	try {
		const { flow, goal } = req.body || {};
		const promptGoal = goal || (flow ? `Improve this flow: ${flow}` : null);
		if (!promptGoal) return res.status(400).json({ ok: false, error: 'Missing goal or flow' });
		const suggestion = await generateFlowSuggestion(promptGoal);
		res.json({ ok: true, suggestion });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message || 'AI error' });
	}
});

router.post('/ai/automate', async (req, res) => {
	try {
		const { flow } = req.body || {};
		if (!flow) return res.status(400).json({ ok: false, error: 'Missing flow' });
		// Lightweight analytics derived from the flow text
		const steps = flow.split('->').map(s => s.trim()).filter(Boolean);
		const analytics = {
			summary: 'Automation simulated successfully',
			steps: steps.length,
			triggers: steps.filter(s => /trigger/i.test(s)).length,
			actions: steps.filter(s => /action|email|sms|notify/i.test(s)).length,
			branches: steps.filter(s => /if|branch|condition/i.test(s)).length,
			preview: steps.slice(0, 5),
			timestamp: Date.now(),
		};
		analyticsModel.recordEvent({ type: 'run', analytics });
		res.json({ ok: true, analytics });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message || 'Automation error' });
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


// Import/export endpoints (live)
router.post('/import', (req, res) => {
	try {
		const { items } = req.body || {};
		db.import(items);
		res.json({ ok: true, count: db.list().length });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message });
	}
});
router.get('/export', (req, res) => {
	res.json({ ok: true, items: db.list() });
});


// All other endpoints removed or to be implemented live as needed

// i18n endpoint
router.get('/i18n', (req, res) => {
	res.json({ ok: true, i18n });
});

// Docs endpoint
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Klaviyo Flow Automation API: CRUD, AI (suggest/automate), analytics, import/export, webhook, notifications, RBAC, i18n.' });
});

// Webhook endpoint
router.post('/notify', (req, res) => {
	const { to = 'ops@aura', message = 'Notification' } = req.body || {};
	notificationModel.send(to, message);
	res.json({ ok: true, message: 'Notification queued', to });
});
});

// Compliance endpoint
	const { userRole = 'viewer', action = 'read' } = req.body || {};
	const allowed = rbac.check(userRole, action);
	res.json({ ok: true, allowed });
	res.json({ ok: true, message: 'Notification sent (demo).' });
});

// RBAC check endpoint (placeholder)
router.post('/rbac/check', (req, res) => {
	res.json({ ok: true, allowed: true });
});

// i18n endpoint (placeholder)
router.get('/i18n', (req, res) => {
	res.json({ ok: true, translations: { en: 'Klaviyo Flow Automation', fr: 'Automatisation Klaviyo' } });
});

// Docs endpoint (placeholder)
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'Klaviyo Flow Automation API. Endpoints: /flows, /ai/generate, /analytics, /import, /export, /shopify/sync, /notify, /rbac/check, /i18n, /docs' });
});
router.post('/notify', (req, res) => {
	const { to = 'ops@aura', message = 'Notification' } = req.body || {};
	notificationModel.send(to, message);
	res.json({ ok: true, message: 'Notification queued', to });