'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/ltv-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'ltv-churn-predictor', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getSummary() })));
router.get('/quintiles', asyncHandler(async (req, res) => res.json({ ok: true, quintiles: engine.getQuintiles() })));
router.get('/channels', asyncHandler(async (req, res) => res.json({ ok: true, channels: engine.getChannelLtv() })));
router.get('/products', asyncHandler(async (req, res) => res.json({ ok: true, products: engine.getProductLtv() })));
router.get('/vbb-export', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getValueBasedBiddingExport() })));
router.post('/predict', requireCreditsOnMutation('churn-predict'), asyncHandler(async (req, res) => {
  const { customerId, purchaseHistory = [] } = req.body;
  if (!customerId) return res.status(400).json({ ok: false, error: 'customerId required' });
  res.json({ ok: true, ...engine.predictLtv(customerId, purchaseHistory) });
}));
router.post('/scenario', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { repeatRateChange = 0.1 } = req.body;
  res.json({ ok: true, scenarios: engine.ltvScenario(repeatRateChange), repeatRateChange });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
