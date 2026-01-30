// Express router exposing advanced AI/analytics backend capabilities
// Routes return { ok, ... } and follow Aura conventions

const express = require('express');
const router = express.Router();

const aiCopilot = require('../core/aiCopilot');
const realTime = require('../core/realTimeAnalytics');
const scenarioSimulator = require('../core/scenarioSimulator');
const crossChannel = require('../core/crossChannelAttribution');
const complianceMonitor = require('../core/complianceMonitor');
const humanLoop = require('../core/humanLoop');
const programmableApi = require('../core/programmableApi');
const securityShield = require('../core/securityShield');

// Basic per-IP rate limiting for this router
router.use((req, res, next) => {
  const key = `adv-ai:${req.ip}`;
  const { ok } = securityShield.rateLimit(key, 120, 60_000); // 120 requests/min per IP
  if (!ok) return res.status(429).json({ ok: false, error: 'Too many requests' });
  next();
});

// Helper for uniform error handling
function sendError(res, message, code = 400) {
  return res.status(code).json({ ok: false, error: message });
}

// --------- Copilot ---------
router.post('/copilot/profile', async (req, res) => {
  try {
    const { userId, profile } = req.body || {};
    if (!userId) return sendError(res, 'userId is required');
    const updated = await aiCopilot.upsertProfile(userId, profile || {});
    return res.json({ ok: true, profile: updated });
  } catch (err) {
    console.error('[copilot/profile] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/copilot/signals', async (req, res) => {
  try {
    const { userId, signals } = req.body || {};
    if (!userId) return sendError(res, 'userId is required');
    const entry = await aiCopilot.ingestSignals(userId, signals || {});
    return res.json({ ok: true, entry });
  } catch (err) {
    console.error('[copilot/signals] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/copilot/chat', async (req, res) => {
  try {
    const { userId, message, context } = req.body || {};
    if (!userId || !message) return sendError(res, 'userId and message are required');
    const response = await aiCopilot.respondToQuery(userId, message, context || {});
    return res.json(response);
  } catch (err) {
    console.error('[copilot/chat] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/copilot/next-actions', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return sendError(res, 'userId is required');
    const response = await aiCopilot.nextBestActions(userId, {});
    return res.json(response);
  } catch (err) {
    console.error('[copilot/next-actions] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.get('/copilot/state', async (req, res) => {
  try {
    const { userId } = req.query || {};
    if (!userId) return sendError(res, 'userId is required');
    const state = await aiCopilot.getUserState(userId);
    return res.json({ ok: true, state });
  } catch (err) {
    console.error('[copilot/state] error', err);
    return sendError(res, 'internal error', 500);
  }
});

// --------- Real-time analytics ---------
router.post('/realtime/ingest', (req, res) => {
  const { metric, value, meta } = req.body || {};
  if (!metric || value === undefined) return sendError(res, 'metric and value are required');
  const point = realTime.ingest(metric, value, meta || {});
  return res.json({ ok: true, point });
});

router.get('/realtime/stats', (req, res) => {
  const { metric, windowMs } = req.query || {};
  if (!metric) return sendError(res, 'metric is required');
  const stats = realTime.stats(metric, Number(windowMs) || 60_000);
  return res.json({ ok: true, stats });
});

router.get('/realtime/forecast', (req, res) => {
  const { metric, horizonMs, windowMs } = req.query || {};
  if (!metric) return sendError(res, 'metric is required');
  const result = realTime.forecast(metric, Number(horizonMs) || 30_000, Number(windowMs) || 120_000);
  if (result.ok === false) return sendError(res, result.error);
  return res.json({ ok: true, forecast: result.forecast, slope: result.slope, intercept: result.intercept });
});

// --------- Scenario simulation ---------
router.post('/scenario/deterministic', (req, res) => {
  const { baseline, adjustments } = req.body || {};
  const result = scenarioSimulator.runDeterministic({ baseline, adjustments });
  return res.json(result);
});

router.post('/scenario/monte-carlo', (req, res) => {
  const { baseline, adjustments, iterations, volatility } = req.body || {};
  const result = scenarioSimulator.runMonteCarlo({ baseline, adjustments, iterations, volatility });
  return res.json(result);
});

// --------- Cross-channel attribution ---------
router.post('/attribution/ingest', async (req, res) => {
  try {
    const { channel, userId, timestamp, type, meta } = req.body || {};
    if (!channel || !userId || !type) return sendError(res, 'channel, userId, and type are required');
    const event = await crossChannel.ingestEvent({ channel, userId, timestamp, type, meta });
    return res.json({ ok: true, event });
  } catch (err) {
    console.error('[attribution/ingest] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.get('/attribution/journey', async (req, res) => {
  try {
    const { userId } = req.query || {};
    if (!userId) return sendError(res, 'userId is required');
    const journey = await crossChannel.getUserJourney(userId);
    return res.json({ ok: true, journey });
  } catch (err) {
    console.error('[attribution/journey] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.get('/attribution/compute', async (req, res) => {
  try {
    const { userId, conversionType, model } = req.query || {};
    if (!userId || !conversionType) return sendError(res, 'userId and conversionType are required');
    const result = await crossChannel.attribute(userId, conversionType, model || 'last-touch');
    if (result.ok === false) return sendError(res, result.error);
    return res.json(result);
  } catch (err) {
    console.error('[attribution/compute] error', err);
    return sendError(res, 'internal error', 500);
  }
});

// --------- Compliance monitor ---------
router.post('/compliance/log', (req, res) => {
  const { model, input, output, meta } = req.body || {};
  if (!model) return sendError(res, 'model is required');
  const record = complianceMonitor.logInference({ model, input, output, meta });
  return res.json({ ok: true, record });
});

router.get('/compliance/report', (req, res) => {
  const { limit } = req.query || {};
  const report = complianceMonitor.auditReport(Number(limit) || 50);
  return res.json({ ok: true, report });
});

// --------- Human-in-the-loop ---------
router.post('/hitl/task', async (req, res) => {
  try {
    const { type, payload, assignee } = req.body || {};
    if (!type) return sendError(res, 'type is required');
    const task = await humanLoop.createTask(type, payload || {}, { assignee });
    return res.json({ ok: true, task });
  } catch (err) {
    console.error('[hitl/task] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/hitl/feedback', async (req, res) => {
  try {
    const { taskId, reviewer, decision, notes } = req.body || {};
    if (!taskId || !reviewer || !decision) return sendError(res, 'taskId, reviewer, decision are required');
    const result = await humanLoop.recordFeedback(taskId, { reviewer, decision, notes });
    if (result.ok === false) return sendError(res, result.error);
    return res.json(result);
  } catch (err) {
    console.error('[hitl/feedback] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/hitl/finalize', async (req, res) => {
  try {
    const { taskId } = req.body || {};
    if (!taskId) return sendError(res, 'taskId is required');
    const result = await humanLoop.finalizeTask(taskId);
    if (result.ok === false) return sendError(res, result.error);
    return res.json(result);
  } catch (err) {
    console.error('[hitl/finalize] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/hitl/idea', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return sendError(res, 'text is required');
    const idea = await humanLoop.submitIdea(text);
    return res.json({ ok: true, idea });
  } catch (err) {
    console.error('[hitl/idea] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/hitl/idea/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body || {};
    const result = await humanLoop.voteIdea(id, Number(delta) || 1);
    if (result.ok === false) return sendError(res, result.error);
    return res.json(result);
  } catch (err) {
    console.error('[hitl/idea/vote] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.get('/hitl/ideas/top', async (req, res) => {
  try {
    const { limit } = req.query || {};
    const ideas = await humanLoop.topIdeas(Number(limit) || 10);
    return res.json({ ok: true, ideas });
  } catch (err) {
    console.error('[hitl/ideas/top] error', err);
    return sendError(res, 'internal error', 500);
  }
});

// --------- Programmable API / webhooks ---------
router.post('/webhooks/register', async (req, res) => {
  try {
    const { url, events } = req.body || {};
    if (!url) return sendError(res, 'url is required');
    const hook = await programmableApi.registerWebhook(url, events || []);
    return res.json({ ok: true, hook });
  } catch (err) {
    console.error('[webhooks/register] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.post('/webhooks/emit', async (req, res) => {
  try {
    const { event, payload } = req.body || {};
    if (!event) return sendError(res, 'event is required');
    const deliveries = await programmableApi.emitEvent(event, payload || {});
    return res.json(deliveries);
  } catch (err) {
    console.error('[webhooks/emit] error', err);
    return sendError(res, 'internal error', 500);
  }
});

router.get('/webhooks/queue', async (req, res) => {
  try {
    const { limit } = req.query || {};
    const items = await programmableApi.pollQueue(Number(limit) || 20);
    return res.json({ ok: true, deliveries: items });
  } catch (err) {
    console.error('[webhooks/queue] error', err);
    return sendError(res, 'internal error', 500);
  }
});

module.exports = router;
