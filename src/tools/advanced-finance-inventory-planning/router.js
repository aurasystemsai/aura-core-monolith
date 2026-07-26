'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/advanced-finance-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'advanced-finance-inventory-planning', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => {
  const pnl = engine.getPnl();
  const cf = engine.getCashFlow();
  const otb = engine.getOtb();
  res.json({ ok: true, revenue: pnl.revenue, grossMargin: pnl.grossMarginPct, ebitda: pnl.ebitda, netCashFlow: cf.netCashFlow, otbOpen: otb.open, yoyGrowth: pnl.yoyRevenueGrowth });
}));
router.get('/cashflow', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getCashFlow() })));
router.get('/pnl', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getPnl() })));
router.get('/otb', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getOtb() })));
router.get('/budget-actuals', asyncHandler(async (req, res) => res.json({ ok: true, items: engine.getBudgetVsActuals() })));
router.get('/ccc', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getCccAnalysis() })));
router.post('/monte-carlo', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { simulations = 1000 } = req.body;
  res.json({ ok: true, ...engine.runMonteCarlo(simulations) });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
