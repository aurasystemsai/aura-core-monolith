/* Legacy router (commented out for replacement)
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
const approvalsStore = require('./approvalsStore');
const presenceStore = require('./presenceStore');
const regressionStore = require('./regressionStore');
const traceStore = require('./traceStore');
const metricsStore = require('./metricsStore');
const router = express.Router();

function getRole(req) {
  // Prefer authenticated user role if present, else header, else viewer
  return req.user?.role || req.headers['x-user-role'] || 'viewer';
}

function requireRole(action) {
  return (req, res, next) => {
    const role = getRole(req);
    try {
      rbac.assert(role, action);
      next();
    } catch (err) {
      res.status(err.status || 403).json({ ok: false, error: err.message || 'Forbidden' });
    }
  };
}
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

async function generateContentVariants(payload = {}) {
  const { subject = '', body = '', channel = 'email', tone = 'default' } = payload;
  const prompt = `Generate 3 ${channel} message variants with subject and body. Tone: ${tone}. Subject: ${subject}. Body: ${body}. Return JSON array of objects {subject, body}.`;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a retention copywriter focusing on Klaviyo flows.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 320,
    temperature: 0.7
  });
  const text = completion.choices[0]?.message?.content?.trim() || '[]';
  try {
    return JSON.parse(text);
  } catch (_err) {
    return [{ subject: `${subject} (alt A)`, body }, { subject: `${subject} (alt B)`, body }, { subject: `${subject} (alt C)`, body }];
  }
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

router.post('/ai/next-best', async (req, res) => {
  const { context = '' } = req.body || {};
  const ideas = [
    'Send a personalized email with dynamic product picks',
    'Follow up with SMS after 24 hours if unopened',
    'Offer free shipping to high-intent users',
  ];
  res.json({ ok: true, ideas, context });
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

// Predictive scores (LTV, churn, send-time) — heuristic + AI assist
router.post('/ai/predict-scores', async (req, res) => {
  try {
    const { user = {}, history = {} } = req.body || {};
    const churnScore = Math.max(1, 100 - (history.recentPurchases || 0) * 10);
    const ltv = (history.totalSpend || 0) * 1.05;
    const sendTime = '10:00 AM local';
    const nba = 'Winback offer if no purchase in 30d';
    res.json({ ok: true, scores: { churnScore, ltv, sendTime, nextBestAction: nba, user } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Predictive error' });
  }
});

// Content variants for subject/body/SMS/push
router.post('/ai/content-variants', async (req, res) => {
  try {
    const variants = await generateContentVariants(req.body || {});
    res.json({ ok: true, variants });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Content variant error' });
  }
});

// Simple product recommendations (popularity based)
const sampleProducts = [
  { id: 'sku-1', name: 'Starter Kit', popularity: 95 },
  { id: 'sku-2', name: 'Refill Pack', popularity: 88 },
  { id: 'sku-3', name: 'Premium Bundle', popularity: 92 },
];

router.post('/ai/recommendations', (req, res) => {
  const { limit = 3 } = req.body || {};
  const sorted = [...sampleProducts].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
  res.json({ ok: true, items: sorted });
});

// Dynamic content rendering per segment
router.post('/render/dynamic', (req, res) => {
  const { segmentId, content = {} } = req.body || {};
  const segment = segmentId ? segments.get(segmentId) : null;
  const applied = {
    ...content,
    headline: segment ? `${content.headline || 'Hello'} for ${segment.name}` : content.headline || 'Hello',
    offer: segment ? content.offer || 'Segment-tailored incentive' : content.offer || 'Standard offer',
  };
  res.json({ ok: true, content: applied, segment });
});

router.post('/render/personalized', (req, res) => {
  const { user = {}, content = {} } = req.body || {};
  const traits = user.traits || {};
  const applied = {
    ...content,
    headline: `${content.headline || 'Hello'}, ${traits.firstName || user.name || 'friend'}`,
    offer: traits.loyalty === 'vip' ? 'VIP exclusive offer' : content.offer || 'Welcome offer',
  };
  res.json({ ok: true, content: applied, traits });
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
  const event = analyticsModel.recordEvent(req.body || {});
  res.json({ ok: true, event });
});

router.get('/analytics', (req, res) => {
  res.json({ ok: true, events: analyticsModel.listEvents(req.query || {}) });
});

router.get('/analytics/widgets', (_req, res) => {
  const summary = eventsStore.summary();
  res.json({ ok: true, widgets: {
    totalEvents: summary.total,
    byType: summary.byType,
    byChannel: summary.byChannel,
  }});
});

router.post('/analytics/node', (req, res) => {
  const { flowId, nodeId, metrics = {} } = req.body || {};
  const event = eventsStore.record({ type: 'node_metrics', flowId, nodeId, metrics });
  res.json({ ok: true, event });
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
router.get('/flows', requireRole('read'), (req, res) => {
  res.json({ ok: true, flows: db.list() });
});
router.get('/flows/:id', requireRole('read'), (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow });
});
router.post('/flows', requireRole('write'), (req, res) => {
  const flow = db.create(req.body || {});
  res.json({ ok: true, flow });
});
router.put('/flows/:id', requireRole('write'), (req, res) => {
  const latestApproval = approvalsStore.latest(req.params.id);
  if (!latestApproval) return res.status(412).json({ ok: false, error: 'Approval required before updating' });
  if (latestApproval.status !== 'approved') return res.status(412).json({ ok: false, error: 'Latest approval not approved' });
  const flow = db.update(req.params.id, req.body || {});
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow, approval: latestApproval.id });
});
router.delete('/flows/:id', requireRole('delete'), (req, res) => {
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

*/

// New router (Phase 1 foundation)
const express = require('express');
const crypto = require('crypto');
const OpenAI = require('openai');
const db = require('./db');
const { applyDefaults } = db;
const analyticsModel = require('./analyticsModel');
const eventsStore = require('./eventsStore');
const segments = require('./segments');
const connectors = require('./connectors');
const auditLog = require('./auditLog');
const notificationModel = require('./notificationModel');
const approvalsStore = require('./approvalsStore');
const presenceStore = require('./presenceStore');
const traceStore = require('./traceStore');
const metricsStore = require('./metricsStore');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhookModel = require('./webhookModel');
const complianceModel = require('./complianceModel');
const pluginSystem = require('./pluginSystem');
const customNodes = require('./customNodes');
const brands = require('./brands');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHANNELS = ['email', 'sms', 'push', 'web_push', 'in_app', 'whatsapp'];
const WEBHOOK_SECRET = process.env.KLAVIYO_WEBHOOK_SECRET || 'dev-secret';
const deadLetters = [];
const uxPreferences = { theme: 'light', shortcuts: true, mobileMode: false };

function getRole(req) {
  return req.user?.role || req.headers['x-user-role'] || req.headers['x-role'] || 'viewer';
}

function requireRole(action) {
  return (req, res, next) => {
    const role = getRole(req);
    try {
      rbac.assert(role, action);
      next();
    } catch (err) {
      res.status(err.status || 403).json({ ok: false, error: err.message || 'Forbidden' });
    }
  };
}

function normalizeFlow(payload = {}, existing = {}) {
  if (typeof applyDefaults === 'function') return applyDefaults(payload, existing);
  const variants = payload.variants && Array.isArray(payload.variants) && payload.variants.length
    ? payload.variants
    : [{ id: 'control', weight: 100 }];
  const channels = payload.channels && payload.channels.length ? payload.channels : ['email', 'sms'];
  return { ...existing, ...payload, variants, channels };
}

function hmacValid(raw, signature) {
  if (!signature) return false;
  try {
    const computed = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch (_err) {
    return false;
  }
}

function withRBAC(req) {
  const role = (req.headers['x-role'] || req.body?.userRole || 'viewer').toString();
  const actions = ['read', 'write', 'delete'];
  const allowed = actions.reduce((acc, action) => ({ ...acc, [action]: rbac.check(role, action) }), {});
  return { role, allowed };
}

router.get('/channels', (_req, res) => {
  res.json({ ok: true, channels: CHANNELS });
});

router.get('/flows', requireRole('read'), (req, res) => {
  const meta = withRBAC(req);
  res.json({ ok: true, flows: db.list(), rbac: meta });
});

router.get('/flows/:id', requireRole('read'), (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow, rbac: withRBAC(req) });
});

router.post('/flows', requireRole('write'), (req, res) => {
  const flow = db.create(normalizeFlow(req.body || {}));
  res.json({ ok: true, flow, rbac: withRBAC(req) });
});

router.put('/flows/:id', requireRole('write'), (req, res) => {
  const existing = db.get(req.params.id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });
  const flow = db.update(req.params.id, normalizeFlow(req.body || {}, existing));
  res.json({ ok: true, flow, rbac: withRBAC(req) });
});

router.delete('/flows/:id', requireRole('delete'), (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, rbac: withRBAC(req) });
});

router.post('/flows/bulk-clone', requireRole('write'), (req, res) => {
  const { ids = [], suffix = 'Copy' } = req.body || {};
  const cloned = ids.map((id) => {
    const flow = db.get(id);
    if (!flow) return null;
    const copy = { ...flow, id: undefined, name: `${flow.name} ${suffix}` };
    return db.create(copy);
  }).filter(Boolean);
  res.json({ ok: true, cloned });
});

router.post('/flows/:id/variants', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const variants = Array.isArray(req.body?.variants) ? req.body.variants : [];
  const updated = db.update(req.params.id, { ...flow, variants });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/builder', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const preferences = { ...(flow.preferences || {}), ...(req.body?.preferences || {}) };
  const updated = db.update(req.params.id, { preferences });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/triggers', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const triggers = Array.isArray(req.body?.triggers) ? req.body.triggers : [];
  const updated = db.update(req.params.id, { triggers });
  auditLog.record({ type: 'triggers_updated', flowId: flow.id, triggersCount: triggers.length });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/conditions', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const conditions = Array.isArray(req.body?.conditions) ? req.body.conditions : [];
  const updated = db.update(req.params.id, { conditions });
  auditLog.record({ type: 'conditions_updated', flowId: flow.id, conditionsCount: conditions.length });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/schedule', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const schedule = {
    ...flow.schedule,
    ...(req.body || {}),
  };
  const updated = db.update(req.params.id, { schedule });
  auditLog.record({ type: 'schedule_updated', flowId: flow.id, schedule });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/waits', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const waits = Array.isArray(req.body?.waits) ? req.body.waits : [];
  const updated = db.update(req.params.id, { waits });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/external-data', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const externalData = Array.isArray(req.body?.sources) ? req.body.sources : [];
  const updated = db.update(req.params.id, { externalData });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/content-blocks', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const contentBlocks = Array.isArray(req.body?.blocks) ? req.body.blocks : [];
  const updated = db.update(req.params.id, { contentBlocks });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/channels', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const channels = Array.isArray(req.body?.channels) && req.body.channels.length ? req.body.channels : flow.channels;
  const updated = db.update(req.params.id, { channels });
  res.json({ ok: true, flow: updated, channels });
});

router.post('/orchestrate', (req, res) => {
  const { flowId, userId = 'anon', channelPlan = [] } = req.body || {};
  const orchestration = { flowId, userId, channelPlan, ts: Date.now() };
  eventsStore.record({ type: 'orchestration', ...orchestration });
  res.json({ ok: true, orchestration });
});

router.post('/flows/:id/throttle', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const throttling = { ...flow.throttling, ...(req.body || {}) };
  const updated = db.update(req.params.id, { throttling });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/acl', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const allowedRoles = Array.isArray(req.body?.roles) ? req.body.roles : ['admin', 'editor'];
  const updated = db.update(req.params.id, { allowedRoles });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/test-run', requireRole('run'), (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const sampleUser = req.body?.user || { id: 'sample', email: 'sample@example.com' };
  const steps = (flow.nodes || []).length || (flow.actions || []).length || (flow.triggers || []).length;
  const result = {
    flowId: flow.id,
    steps,
    sampleUser,
    status: 'simulated',
    preview: (flow.nodes || []).slice(0, 5),
  };
  eventsStore.record({ type: 'test_run', flowId: flow.id, result });
  traceStore.record({ flowId: flow.id, runId: `test-${Date.now()}`, status: 'ok', steps: (flow.nodes || []).map((n, i) => ({ idx: i + 1, label: n.label, type: n.type })) });
  res.json({ ok: true, result });
});

router.get('/flows/:id/traces', requireRole('read'), (req, res) => {
  try {
    const from = req.query?.from ? Number(req.query.from) : undefined;
    const to = req.query?.to ? Number(req.query.to) : undefined;
    const traces = traceStore.list({ flowId: req.params.id, runId: req.query?.runId, from, to });
    res.json({ ok: true, traces });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Trace fetch failed' });
  }
});

router.post('/flows/:id/metrics/targets', requireRole('metrics'), (req, res) => {
  try {
    const { name, target } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'Missing metric name' });
    const entry = metricsStore.create({ flowId: req.params.id, name, target });
    auditLog.record({ type: 'metric_target', flowId: req.params.id, name, target });
    res.json({ ok: true, metric: entry });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Metrics target error' });
  }
});

router.post('/flows/:id/metrics/record', requireRole('metrics'), (req, res) => {
  try {
    const { name, value, ts } = req.body || {};
    if (!name || value === undefined) return res.status(400).json({ ok: false, error: 'Missing name or value' });
    const entry = metricsStore.record({ flowId: req.params.id, name, value, ts });
    res.json({ ok: true, metric: entry });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Metrics record error' });
  }
});

router.get('/flows/:id/metrics', requireRole('metrics'), (req, res) => {
  try {
    const items = metricsStore.list(req.params.id);
    const summary = metricsStore.summary(req.params.id);
    const rollup = metricsStore.rollup(req.params.id);
    res.json({ ok: true, metrics: items, summary, rollup });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Metrics fetch error' });
  }
});

router.post('/flows/:id/validate', requireRole('read'), (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const errors = [];
  if (!flow.triggers || !flow.triggers.length) errors.push('Flow has no triggers');
  if (!flow.actions || !flow.actions.length) errors.push('Flow has no actions');
  if ((flow.schedule?.blackout || []).length > 0 && !flow.schedule?.timezone) errors.push('Timezone required for blackout windows');
  const warnings = [];
  if ((flow.channels || []).length > 3) warnings.push('Too many channels may fatigue users');
  res.json({ ok: true, valid: errors.length === 0, errors, warnings });
});

router.get('/flows/:id/report', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const events = eventsStore.list({ flowId: flow.id });
  const report = {
    flowId: flow.id,
    sends: events.filter(e => e.type === 'send').length,
    conversions: events.filter(e => e.conversion).length,
    revenue: events.reduce((sum, e) => sum + Number(e.revenue || 0), 0),
    errors: events.filter(e => e.type === 'error').length,
  };
  res.json({ ok: true, report });
});

router.get('/flows/:id/health', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const events = eventsStore.list({ flowId: flow.id });
  const errors = events.filter(e => e.type === 'error').slice(-5);
  const status = errors.length ? 'degraded' : 'healthy';
  const health = { status, errors, lastChecked: Date.now() };
  db.update(flow.id, { health });
  res.json({ ok: true, health });
});

router.post('/flows/:id/optimize', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const suggestions = [
    'Shorten delays between key steps',
    'Add a branch for high-intent users',
    'Test SMS vs email for the second touch',
  ];
  const overrides = req.body?.overrides || {};
  const recommendation = { flowId: flow.id, suggestions, overrides };
  eventsStore.record({ type: 'optimization', flowId: flow.id, recommendation });
  res.json({ ok: true, recommendation });
});

router.get('/flows/:id/versions', requireRole('read'), (req, res) => {
  const versions = db.versions(req.params.id) || [];
  res.json({ ok: true, versions });
});

router.post('/flows/:id/version', requireRole('write'), (req, res) => {
  const snap = db.snapshot(req.params.id);
  if (!snap) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow: snap });
});

router.post('/flows/:id/rollback', requireRole('write'), (req, res) => {
  const { version } = req.body || {};
  const restored = db.rollback(req.params.id, version);
  if (!restored) return res.status(404).json({ ok: false, error: 'Version not found' });
  auditLog.record({ type: 'rollback', flowId: req.params.id, version });
  res.json({ ok: true, flow: restored });
});

router.post('/flows/:id/publish', requireRole('publish'), (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const latestApproval = approvalsStore.latest(req.params.id);
  if (!latestApproval) return res.status(412).json({ ok: false, error: 'Approval required before publish' });
  if (latestApproval.status !== 'approved') return res.status(412).json({ ok: false, error: 'Latest approval not approved' });
  const updated = db.update(req.params.id, { ...flow, status: 'published', publishedAt: Date.now() });
  auditLog.record({ type: 'publish', flowId: req.params.id, approval: latestApproval.id });
  res.json({ ok: true, flow: updated, approval: latestApproval.id });
});

router.post('/flows/:id/approvals', requireRole('approve'), (req, res) => {
  const { reason = '' } = req.body || {};
  const requestedBy = req.headers['x-user-id'] || 'unknown';
  const entry = approvalsStore.create({ flowId: req.params.id, requestedBy, reason });
  auditLog.record({ type: 'approval_requested', flowId: req.params.id, requestedBy, reason, approvalId: entry.id });
  res.json({ ok: true, approval: entry });
});

router.post('/flows/:id/approvals/:approvalId/status', requireRole('approve'), (req, res) => {
  const { status } = req.body || {};
  const actor = req.headers['x-user-id'] || 'unknown';
  const updated = approvalsStore.updateStatus(req.params.approvalId, status, actor);
  if (!updated) return res.status(404).json({ ok: false, error: 'Approval not found or invalid status' });
  auditLog.record({ type: 'approval_status', flowId: req.params.id, approvalId: req.params.approvalId, status, actor });
  res.json({ ok: true, approval: updated });
});

router.get('/flows/:id/approvals', requireRole('read'), (req, res) => {
  const approvals = approvalsStore.list(req.params.id);
  res.json({ ok: true, approvals });
});

router.post('/flows/:id/dependencies', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const dependencies = Array.isArray(req.body?.dependencies) ? req.body.dependencies : [];
  const updated = db.update(req.params.id, { dependencies });
  res.json({ ok: true, flow: updated });
});

router.get('/flows/dependencies', (_req, res) => {
  const flows = db.list();
  const map = flows.map(f => ({ id: f.id, name: f.name, dependsOn: f.dependencies || [] }));
  res.json({ ok: true, dependencies: map });
});

router.post('/flows/:id/consent', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const consentMode = req.body?.mode || 'standard';
  const updated = db.update(req.params.id, { consentMode });
  res.json({ ok: true, flow: updated });
});

router.post('/flows/:id/brand', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const brandId = req.body?.brandId || 'default';
  const updated = db.update(req.params.id, { brandId });
  res.json({ ok: true, flow: updated });
});

router.get('/journeys', (_req, res) => {
  const flows = db.list();
  const journeys = flows.map(f => ({
    id: f.id,
    name: f.name,
    dependencies: f.dependencies || [],
    channels: f.channels || [],
  }));
  res.json({ ok: true, journeys });
});

router.post('/experiments/assign', (req, res) => {
  const { flowId, userId = 'anon' } = req.body || {};
  const flow = db.get(flowId);
  if (!flow) return res.status(404).json({ ok: false, error: 'Flow not found' });
  const variants = flow.variants || [{ id: 'control', weight: 100 }];
  const hash = crypto.createHash('sha256').update(String(userId)).digest('hex');
  const seed = parseInt(hash.slice(0, 8), 16) % 10000;
  let cursor = 0;
  const chosen = variants.find(v => {
    const weight = Number(v.weight || 0);
    const end = cursor + Math.floor(weight * 100);
    const hit = seed < end && seed >= cursor;
    cursor = end;
    return hit;
  }) || variants[0];
  res.json({ ok: true, variant: chosen.id, variants });
});

router.get('/segments', (_req, res) => {
  res.json({ ok: true, segments: segments.list() });
});

router.post('/segments', (req, res) => {
  const seg = segments.create(req.body || {});
  res.json({ ok: true, segment: seg });
});

router.put('/segments/:id', (req, res) => {
  const seg = segments.update(req.params.id, req.body || {});
  if (!seg) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, segment: seg });
});

router.delete('/segments/:id', (req, res) => {
  const ok = segments.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

router.post('/segments/smart-split', (req, res) => {
  const { audience = [], buckets = 2 } = req.body || {};
  const enriched = audience.map((u, idx) => ({ ...u, score: (u.score || 50) + (idx % buckets) }));
  const splits = Array.from({ length: buckets }).map((_, i) => ({ bucket: i, users: enriched.filter((_, idx) => idx % buckets === i) }));
  res.json({ ok: true, splits });
});

router.post('/flows/:id/segments', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const segmentIds = Array.isArray(req.body?.segmentIds) ? req.body.segmentIds : [];
  const updated = db.update(req.params.id, { ...flow, segmentIds });
  res.json({ ok: true, flow: updated });
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
    const { flow, channel = 'email' } = req.body || {};
    if (!flow) return res.status(400).json({ ok: false, error: 'Missing flow' });
    const steps = flow.split('->').map(s => s.trim()).filter(Boolean);
    const analytics = {
      summary: 'Automation simulated successfully',
      steps: steps.length,
      triggers: steps.filter(s => /trigger/i.test(s)).length,
      actions: steps.filter(s => /action|email|sms|notify|push|in-app|web push/i.test(s)).length,
      branches: steps.filter(s => /if|branch|condition|variant/i.test(s)).length,
      preview: steps.slice(0, 5),
      channel,
      timestamp: Date.now(),
    };
    analyticsModel.recordEvent({ type: 'run', analytics });
    eventsStore.record({ type: 'run', channel, flowId: req.body?.flowId, analytics });
    res.json({ ok: true, analytics });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Automation error' });
  }
});

router.post('/events', (req, res) => {
  const event = eventsStore.record(req.body || {});
  res.json({ ok: true, event });
});

router.get('/events', (req, res) => {
  res.json({ ok: true, events: eventsStore.list(req.query || {}) });
});

router.post('/triggers/iot', (req, res) => {
  const { deviceId, flowId, payload = {} } = req.body || {};
  const event = eventsStore.record({ type: 'iot_trigger', flowId, deviceId, payload });
  res.json({ ok: true, event });
});

router.post('/triggers/voice', (req, res) => {
  const { provider = 'alexa', utterance = '', flowId } = req.body || {};
  const event = eventsStore.record({ type: 'voice_trigger', provider, utterance, flowId });
  res.json({ ok: true, event });
});

router.get('/analytics/funnel', (_req, res) => {
  const summary = eventsStore.summary();
  res.json({ ok: true, summary });
});

router.get('/analytics/cohort', (_req, res) => {
  const events = eventsStore.list();
  const cohorts = {};
  events.forEach(e => {
    const day = new Date(e.ts || Date.now()).toISOString().slice(0, 10);
    const cohort = e.cohort || day;
    cohorts[cohort] = cohorts[cohort] || { cohort, count: 0 };
    cohorts[cohort].count += 1;
  });
  res.json({ ok: true, cohorts: Object.values(cohorts) });
});

router.get('/analytics/attribution', (_req, res) => {
  const events = eventsStore.list();
  const bySource = {};
  events.forEach(e => {
    const src = e.source || 'unknown';
    const rev = Number(e.revenue || 0);
    const conv = e.type === 'conversion' ? 1 : 0;
    bySource[src] = bySource[src] || { source: src, revenue: 0, conversions: 0, count: 0 };
    bySource[src].revenue += rev;
    bySource[src].conversions += conv;
    bySource[src].count += 1;
  });
  res.json({ ok: true, sources: Object.values(bySource) });
});

router.post('/analytics', (req, res) => {
  const event = analyticsModel.recordEvent(req.body || {});
  res.json({ ok: true, event });
});

router.get('/analytics', (req, res) => {
  res.json({ ok: true, events: analyticsModel.listEvents(req.query || {}) });
});

router.get('/experiments/results', (_req, res) => {
  const events = eventsStore.list({ type: 'experiment' });
  const byVariant = {};
  events.forEach(e => {
    const v = e.variant || 'control';
    const conv = e.conversion ? 1 : 0;
    const rev = Number(e.revenue || 0);
    byVariant[v] = byVariant[v] || { variant: v, impressions: 0, conversions: 0, revenue: 0 };
    byVariant[v].impressions += 1;
    byVariant[v].conversions += conv;
    byVariant[v].revenue += rev;
  });
  res.json({ ok: true, results: Object.values(byVariant) });
});

router.post('/experiments/mab', (req, res) => {
  const { flowId, arms = [] } = req.body || {};
  if (!flowId || !arms.length) return res.status(400).json({ ok: false, error: 'Missing flowId/arms' });
  const assignment = arms.map((arm, idx) => ({ arm, probability: Number(arm.weight || 1) / arms.length, idx }));
  eventsStore.record({ type: 'experiment', flowId, variant: assignment[0]?.arm, assignment });
  res.json({ ok: true, assignment });
});

router.post('/import', (req, res) => {
  try {
    const { items } = req.body || {};
    db.import(items);
    res.json({ ok: true, count: db.list().length });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get('/export', (_req, res) => {
  res.json({ ok: true, items: db.list() });
});

router.post('/ingest/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const signature = req.headers['x-aura-signature'];
  const raw = req.body instanceof Buffer ? req.body : Buffer.from('');
  if (!hmacValid(raw, signature)) return res.status(401).json({ ok: false, error: 'Invalid signature' });
  const parsed = (() => {
    try { return JSON.parse(raw.toString('utf8')); } catch (_err) { return {}; }
  })();
  webhookModel.handle(parsed || {});
  eventsStore.record({ type: 'webhook', payload: parsed });
  res.json({ ok: true });
});

router.get('/compliance', (_req, res) => {
  res.json({ ok: true, compliance: complianceModel.get() });
});

router.post('/compliance/scan', (req, res) => {
  const { flowId } = req.body || {};
  const flow = flowId ? db.get(flowId) : null;
  const issues = [];
  if (flow) {
    if ((flow.channels || []).includes('sms') && !complianceModel.get().tcpa) issues.push('TCPA consent missing');
    if ((flow.schedule?.blackout || []).length && !flow.schedule?.timezone) issues.push('Timezone required for blackout');
  }
  res.json({ ok: true, issues, passed: issues.length === 0 });
});

router.post('/security/mask', (req, res) => {
  const fields = Array.isArray(req.body?.fields) ? req.body.fields : [];
  const masked = fields.reduce((acc, f) => ({ ...acc, [f]: '***masked***' }), {});
  res.json({ ok: true, masked });
});

router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

router.post('/notify', (req, res) => {
  const { to = 'ops@aura', message = 'Notification' } = req.body || {};
  notificationModel.send(to, message);
  res.json({ ok: true, message: 'Notification queued', to });
});

router.post('/alerts', (req, res) => {
  const { to = 'ops@aura', message = 'Alert', severity = 'info' } = req.body || {};
  try {
    notificationModel.send(to, `[${severity}] ${message}`);
    res.json({ ok: true, message: 'Alert queued', to, severity });
  } catch (err) {
    deadLetters.push({ to, message, severity, error: err.message, ts: Date.now() });
    res.status(500).json({ ok: false, error: 'Alert failed, moved to dead-letter' });
  }
});

router.get('/dead-letter', (_req, res) => {
  res.json({ ok: true, items: deadLetters });
});

router.post('/dead-letter/retry', (_req, res) => {
  const retried = deadLetters.splice(0, deadLetters.length);
  retried.forEach(item => eventsStore.record({ type: 'dead_letter_retry', item }));
  res.json({ ok: true, retried: retried.length });
});

router.post('/rbac/check', (req, res) => {
  const { role, allowed } = withRBAC(req);
  res.json({ ok: true, role, allowed });
});

router.post('/ux/preferences', (req, res) => {
  Object.assign(uxPreferences, req.body || {});
  res.json({ ok: true, preferences: uxPreferences });
});

router.post('/mobile/mode', (req, res) => {
  uxPreferences.mobileMode = Boolean(req.body?.enabled);
  res.json({ ok: true, mobileMode: uxPreferences.mobileMode });
});

router.get('/i18n', (_req, res) => {
  res.json({ ok: true, i18n });
});

router.get('/docs', (_req, res) => {
  res.json({ ok: true, docs: 'Klaviyo Flow Automation API: CRUD, AI (suggest/automate), analytics, events, segments, experiments, import/export, webhook ingest (signed), notifications/alerts, RBAC, channels.' });
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: Date.now(), counts: { flows: db.list().length, events: eventsStore.summary().total, segments: segments.list().length } });
});

router.get('/health/flows', (_req, res) => {
  const flows = db.list();
  const report = flows.map(f => ({ id: f.id, name: f.name, status: (f.health || {}).status || 'unknown', channels: f.channels || [] }));
  res.json({ ok: true, report });
});

router.post('/presence', requireRole('read'), (req, res) => {
  const user = req.headers['x-user-id'] || req.body?.user || 'anon';
  const status = req.body?.status || 'editing';
  const locale = req.body?.locale || 'en';
  const flowId = req.body?.flowId || null;
  const record = presenceStore.upsert({ user, status, locale, flowId });
  res.json({ ok: true, presence: record });
});

router.get('/presence', requireRole('read'), (_req, res) => {
  res.json({ ok: true, presence: presenceStore.list() });
});

// Collaboration & compliance & ops (Phase 5)
router.post('/collab/comment', (req, res) => {
  const { flowId, user = 'anon', comment = '' } = req.body || {};
  const entry = auditLog.record({ type: 'comment', flowId, user, comment });
  res.json({ ok: true, entry });
});

router.post('/collab/annotate', (req, res) => {
  const { flowId, nodeId, user = 'anon', note = '' } = req.body || {};
  const entry = auditLog.record({ type: 'annotation', flowId, nodeId, user, note });
  res.json({ ok: true, entry });
});

router.post('/collab/presence', requireRole('read'), (req, res) => {
  const { user = 'anon', flowId, status = 'editing', locale = 'en' } = req.body || {};
  const record = presenceStore.upsert({ user, flowId, status, locale });
  res.json({ ok: true, presence: presenceStore.list(), record });
});

router.post('/collab/approve', (req, res) => {
  const { flowId, user = 'admin' } = req.body || {};
  const entry = auditLog.record({ type: 'approval', flowId, user, status: 'approved' });
  res.json({ ok: true, entry });
});

router.post('/collab/version', (req, res) => {
  const { flowId, label = 'v1' } = req.body || {};
  const entry = auditLog.record({ type: 'version', flowId, label });
  res.json({ ok: true, entry });
});

router.post('/collab/share-link', (req, res) => {
  const { flowId } = req.body || {};
  const token = Buffer.from(`${flowId}-${Date.now()}`).toString('base64url');
  const link = `/share/${token}`;
  const entry = auditLog.record({ type: 'share', flowId, link });
  res.json({ ok: true, link, entry });
});

router.get('/audit/logs', (_req, res) => {
  res.json({ ok: true, entries: auditLog.list() });
});

let complianceToggles = { HIPAA: false, TCPA: true, CCPA: true };
router.post('/compliance/toggles', (req, res) => {
  complianceToggles = { ...complianceToggles, ...(req.body || {}) };
  res.json({ ok: true, toggles: complianceToggles });
});

router.post('/compliance/dsr', (req, res) => {
  const { userId, action = 'export' } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
  const entry = auditLog.record({ type: 'dsr', userId, action });
  res.json({ ok: true, request: entry });
});

router.post('/ops/replay', (req, res) => {
  const { eventIds = [] } = req.body || {};
  const replayed = eventsStore.list().filter(e => eventIds.includes(e.id));
  replayed.forEach(e => auditLog.record({ type: 'replay', eventId: e.id }));
  res.json({ ok: true, replayed: replayed.length });
});

router.post('/ops/scheduler', (req, res) => {
  const { job = 'sync', slaMs = 60000 } = req.body || {};
  auditLog.record({ type: 'scheduler', job, slaMs });
  res.json({ ok: true, scheduled: job, slaMs });
});

// Integrations & data (Phase 3)
router.get('/connectors', (_req, res) => {
  res.json({ ok: true, connectors: connectors.all() });
});

router.post('/connect/segment', (req, res) => {
  const { writeKey } = req.body || {};
  if (!writeKey) return res.status(400).json({ ok: false, error: 'Missing writeKey' });
  const cfg = connectors.set('segment', { writeKey });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/salesforce', (req, res) => {
  const { token, instanceUrl } = req.body || {};
  if (!token) return res.status(400).json({ ok: false, error: 'Missing token' });
  const cfg = connectors.set('salesforce', { token, instanceUrl });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/hubspot', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ ok: false, error: 'Missing token' });
  const cfg = connectors.set('hubspot', { token });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/zapier', (req, res) => {
  const { hookUrl } = req.body || {};
  if (!hookUrl) return res.status(400).json({ ok: false, error: 'Missing hookUrl' });
  const cfg = connectors.set('zapier', { hookUrl });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/warehouse/snowflake', (req, res) => {
  const { account, user, warehouse, database, schema, role } = req.body || {};
  if (!account || !user) return res.status(400).json({ ok: false, error: 'Missing account/user' });
  const cfg = connectors.set('snowflake', { account, user, warehouse, database, schema, role });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/warehouse/bigquery', (req, res) => {
  const { project, dataset } = req.body || {};
  if (!project || !dataset) return res.status(400).json({ ok: false, error: 'Missing project/dataset' });
  const cfg = connectors.set('bigquery', { project, dataset });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/slack', (req, res) => {
  const { token, channel } = req.body || {};
  if (!token || !channel) return res.status(400).json({ ok: false, error: 'Missing token/channel' });
  const cfg = connectors.set('slack', { token, channel });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/twilio', (req, res) => {
  const { accountSid, authToken, from } = req.body || {};
  if (!accountSid || !authToken || !from) return res.status(400).json({ ok: false, error: 'Missing twilio credentials' });
  const cfg = connectors.set('twilio', { accountSid, authToken, from });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/whatsapp', (req, res) => {
  const { provider = 'twilio', number } = req.body || {};
  if (!number) return res.status(400).json({ ok: false, error: 'Missing number' });
  const cfg = connectors.set('whatsapp', { provider, number });
  res.json({ ok: true, connector: cfg });
});

router.post('/connect/push', (req, res) => {
  const { provider = 'onesignal', apiKey } = req.body || {};
  if (!apiKey) return res.status(400).json({ ok: false, error: 'Missing apiKey' });
  const cfg = connectors.set('push', { provider, apiKey });
  res.json({ ok: true, connector: cfg });
});

router.post('/consent/sync', (req, res) => {
  const { userId, consent } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
  const rec = connectors.consentSync({ userId, consent });
  res.json({ ok: true, consent: rec });
});

router.get('/custom-nodes', (_req, res) => {
  res.json({ ok: true, nodes: customNodes.list() });
});

router.post('/custom-nodes', (req, res) => {
  const node = customNodes.create(req.body || {});
  res.json({ ok: true, node });
});

router.put('/custom-nodes/:id', (req, res) => {
  const node = customNodes.update(req.params.id, req.body || {});
  if (!node) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, node });
});

router.delete('/custom-nodes/:id', (req, res) => {
  const ok = customNodes.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

router.get('/brands', (_req, res) => {
  res.json({ ok: true, brands: brands.list() });
});

router.post('/brands', (req, res) => {
  const brand = brands.create(req.body || {});
  res.json({ ok: true, brand });
});

router.put('/brands/:id', (req, res) => {
  const brand = brands.update(req.params.id, req.body || {});
  if (!brand) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, brand });
});

router.delete('/brands/:id', (req, res) => {
  const ok = brands.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

router.post('/ingest/event', (req, res) => {
  const { event = {}, pii = {} } = req.body || {};
  const hashed = Object.keys(pii).reduce((acc, key) => ({ ...acc, [key]: connectors.hashPII(pii[key]) }), {});
  const recorded = eventsStore.record({ ...event, pii: hashed, type: event.type || 'ingest' });
  res.json({ ok: true, event: recorded });
});

module.exports = router;
