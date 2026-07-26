'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/churn-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'churn-prediction-playbooks', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getChurnSummary() })));
router.get('/rfm', asyncHandler(async (req, res) => res.json({ ok: true, segments: engine.getRfmSegments() })));
router.get('/cohorts', asyncHandler(async (req, res) => res.json({ ok: true, cohorts: engine.getCohortRetention() })));
router.get('/early-warnings', asyncHandler(async (req, res) => res.json({ ok: true, warnings: engine.getEarlyWarnings() })));
router.get('/playbooks', asyncHandler(async (req, res) => res.json({ ok: true, playbooks: engine.getPlaybooks(req.query.segment) })));
router.post('/churn-probability', requireCreditsOnMutation('churn-predict'), asyncHandler(async (req, res) => {
  const { customerId, rfmScore } = req.body;
  if (!customerId || rfmScore === undefined) return res.status(400).json({ ok: false, error: 'customerId and rfmScore required' });
  res.json({ ok: true, ...engine.calcChurnProbability(customerId, rfmScore) });
}));
router.post('/reactivation-roi', asyncHandler(async (req, res) => {
  const { segment, campaignCost = 2000, revenuePerCustomer = 180 } = req.body;
  if (!segment) return res.status(400).json({ ok: false, error: 'segment required' });
  res.json({ ok: true, ...engine.calcReactivationRoi(segment, campaignCost, revenuePerCustomer) });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
