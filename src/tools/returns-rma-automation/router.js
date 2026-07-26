'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/returns-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'returns-rma-automation', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getReturnsOverview() })));
router.get('/reasons', asyncHandler(async (req, res) => res.json({ ok: true, reasons: engine.getReturnReasons() })));
router.get('/fraud', asyncHandler(async (req, res) => res.json({ ok: true, fraudFlags: engine.getFraudFlags() })));
router.get('/dispositions', asyncHandler(async (req, res) => res.json({ ok: true, dispositions: engine.getDispositions() })));
router.get('/kpis', asyncHandler(async (req, res) => res.json({ ok: true, kpis: engine.getKpis() })));
router.post('/propensity', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { customerId, productId } = req.body;
  if (!customerId || !productId) return res.status(400).json({ ok: false, error: 'customerId and productId required' });
  res.json({ ok: true, ...engine.scoreReturnPropensity(customerId, productId) });
}));
router.post('/exchange-suggest', asyncHandler(async (req, res) => {
  const { returnReason, originalProduct } = req.body;
  if (!returnReason) return res.status(400).json({ ok: false, error: 'returnReason required' });
  res.json({ ok: true, ...engine.suggestExchange(returnReason, originalProduct || 'unknown') });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
