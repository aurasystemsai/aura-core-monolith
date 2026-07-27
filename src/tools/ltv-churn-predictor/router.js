'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/ltv-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'ltv-churn-predictor', v: '2.0.0' })));
router.get('/summary', ah(async (req, res) => res.json({ ok: true, ...engine.getSummary() })));
router.get('/vbb-export', ah(async (req, res) => res.json({ ok: true, ...engine.getValueBasedBiddingExport() })));
router.get('/product-ltv', ah(async (req, res) => res.json({ ok: true, ...engine.getProductLtv() })));
router.get('/channel-ltv', ah(async (req, res) => res.json({ ok: true, ...engine.getChannelLtv() })));
router.get('/quintiles', ah(async (req, res) => res.json({ ok: true, ...engine.getQuintiles() })));
router.post('/predict', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.predictLtv(req.body) })));
router.post('/scenario', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.ltvScenario(req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

