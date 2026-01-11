// Abandoned Checkout Winback Tool Router (flagship version)
// Provides endpoints for winback message generation, scheduling, segmentation, analytics, and Shopify integration

const express = require('express');
const router = express.Router();

// --- Models (to be implemented in separate files) ---
const openai = require('./openai');
const scheduleModel = require('./scheduleModel');
const segmentModel = require('./segmentModel');
const analyticsModel = require('./analyticsModel');
const shopify = require('./shopify');

// --- Generate Winback Message ---
router.post('/generate-message', async (req, res) => {
  try {
    const { customerName, cartItems, discountCode, brand, tone, prompt, language } = req.body || {};
    if (!customerName || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ ok: false, error: 'customerName and cartItems[] are required' });
    }
    const result = await openai.generateWinbackMessage({ customerName, cartItems, discountCode, brand, tone, prompt, language });
    return res.json({ ok: true, message: result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Scheduling Endpoints ---
router.post('/schedules', (req, res) => {
  try {
    const schedule = scheduleModel.createSchedule(req.body || {});
    res.json({ ok: true, schedule });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/schedules', (req, res) => {
  res.json({ ok: true, schedules: scheduleModel.listSchedules() });
});
router.get('/schedules/:id', (req, res) => {
  const schedule = scheduleModel.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, schedule });
});
router.put('/schedules/:id', (req, res) => {
  const schedule = scheduleModel.updateSchedule(req.params.id, req.body || {});
  if (!schedule) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, schedule });
});
router.delete('/schedules/:id', (req, res) => {
  const ok = scheduleModel.deleteSchedule(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// --- Segmentation Endpoints ---
router.post('/segments', (req, res) => {
  try {
    const segment = segmentModel.createSegment(req.body || {});
    res.json({ ok: true, segment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/segments', (req, res) => {
  res.json({ ok: true, segments: segmentModel.listSegments() });
});
router.get('/segments/:id', (req, res) => {
  const segment = segmentModel.getSegment(req.params.id);
  if (!segment) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, segment });
});
router.put('/segments/:id', (req, res) => {
  const segment = segmentModel.updateSegment(req.params.id, req.body || {});
  if (!segment) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, segment });
});
router.delete('/segments/:id', (req, res) => {
  const ok = segmentModel.deleteSegment(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// --- Analytics Endpoints ---
router.post('/analytics', (req, res) => {
  try {
    const event = analyticsModel.recordEvent(req.body || {});
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/analytics', (req, res) => {
  const { campaignId, variantId, type } = req.query;
  const events = analyticsModel.listEvents({ campaignId, variantId, type });
  res.json({ ok: true, events });
});

// --- Shopify Integration ---
router.get('/shopify/abandoned-checkouts', async (req, res) => {
  const shop = req.query.shop;
  let token = req.query.token || process.env.SHOPIFY_ADMIN_TOKEN || '';
  try {
    const apiVersion = req.query.apiVersion || process.env.SHOPIFY_API_VERSION || '2023-10';
    const checkouts = await shopify.fetchAbandonedCheckouts({ shop, token, apiVersion });
    res.json({ ok: true, abandonedCheckouts: checkouts });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
