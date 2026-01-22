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

*/

// New router (Phase 1 foundation)
const express = require('express');
const crypto = require('crypto');
const OpenAI = require('openai');
const db = require('./db');
const analyticsModel = require('./analyticsModel');
const eventsStore = require('./eventsStore');
const segments = require('./segments');
const connectors = require('./connectors');
const auditLog = require('./auditLog');
const notificationModel = require('./notificationModel');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhookModel = require('./webhookModel');
const complianceModel = require('./complianceModel');
const pluginSystem = require('./pluginSystem');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHANNELS = ['email', 'sms', 'push', 'web_push', 'in_app', 'whatsapp'];
const WEBHOOK_SECRET = process.env.KLAVIYO_WEBHOOK_SECRET || 'dev-secret';
const deadLetters = [];

function normalizeFlow(payload = {}) {
  const variants = payload.variants && Array.isArray(payload.variants) && payload.variants.length
    ? payload.variants
    : [{ id: 'control', weight: 100 }];
  const channels = payload.channels && payload.channels.length ? payload.channels : ['email', 'sms'];
  return { ...payload, variants, channels };
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

router.get('/flows', (req, res) => {
  const meta = withRBAC(req);
  res.json({ ok: true, flows: db.list(), rbac: meta });
});

router.get('/flows/:id', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow, rbac: withRBAC(req) });
});

router.post('/flows', (req, res) => {
  const flow = db.create(normalizeFlow(req.body || {}));
  res.json({ ok: true, flow, rbac: withRBAC(req) });
});

router.put('/flows/:id', (req, res) => {
  const flow = db.update(req.params.id, normalizeFlow(req.body || {}));
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, flow, rbac: withRBAC(req) });
});

router.delete('/flows/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, rbac: withRBAC(req) });
});

router.post('/flows/:id/variants', (req, res) => {
  const flow = db.get(req.params.id);
  if (!flow) return res.status(404).json({ ok: false, error: 'Not found' });
  const variants = Array.isArray(req.body?.variants) ? req.body.variants : [];
  const updated = db.update(req.params.id, { ...flow, variants });
  res.json({ ok: true, flow: updated });
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

router.post('/rbac/check', (req, res) => {
  const { role, allowed } = withRBAC(req);
  res.json({ ok: true, role, allowed });
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

// Collaboration & compliance & ops (Phase 5)
router.post('/collab/comment', (req, res) => {
  const { flowId, user = 'anon', comment = '' } = req.body || {};
  const entry = auditLog.record({ type: 'comment', flowId, user, comment });
  res.json({ ok: true, entry });
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

router.post('/consent/sync', (req, res) => {
  const { userId, consent } = req.body || {};
  if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
  const rec = connectors.consentSync({ userId, consent });
  res.json({ ok: true, consent: rec });
});

router.post('/ingest/event', (req, res) => {
  const { event = {}, pii = {} } = req.body || {};
  const hashed = Object.keys(pii).reduce((acc, key) => ({ ...acc, [key]: connectors.hashPII(pii[key]) }), {});
  const recorded = eventsStore.record({ ...event, pii: hashed, type: event.type || 'ingest' });
  res.json({ ok: true, event: recorded });
});

module.exports = router;
