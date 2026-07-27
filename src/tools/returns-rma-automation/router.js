'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/returns-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'returns-rma-automation', v: '2.0.0' })));
router.get('/kpis', ah(async (req, res) => res.json({ ok: true, ...engine.getKpis() })));
router.get('/dispositions', ah(async (req, res) => res.json({ ok: true, dispositions: engine.getDispositions() })));
router.get('/fraud-flags', ah(async (req, res) => res.json({ ok: true, ...engine.getFraudFlags(req.query) })));
router.get('/reasons', ah(async (req, res) => res.json({ ok: true, reasons: engine.getReturnReasons() })));
router.get('/overview', ah(async (req, res) => res.json({ ok: true, ...engine.getReturnsOverview() })));
router.post('/propensity-score', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.scoreReturnPropensity(req.body) })));
router.post('/exchange/suggest', requireCreditsOnMutation('email-gen'), ah(async (req, res) => res.json({ ok: true, ...engine.suggestExchange(req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

