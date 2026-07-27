'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/advanced-finance-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'advanced-finance-inventory-planning', v: '2.0.0' })));
router.get('/budget-vs-actuals', ah(async (req, res) => res.json({ ok: true, ...engine.getBudgetVsActuals(req.query) })));
router.get('/ccc-analysis', ah(async (req, res) => res.json({ ok: true, ...engine.getCccAnalysis() })));
router.get('/otb', ah(async (req, res) => res.json({ ok: true, ...engine.getOtb(req.query) })));
router.get('/pnl', ah(async (req, res) => res.json({ ok: true, ...engine.getPnl(req.query) })));
router.get('/cash-flow', ah(async (req, res) => res.json({ ok: true, ...engine.getCashFlow(req.query) })));
router.post('/monte-carlo/run', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.runMonteCarlo(req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

