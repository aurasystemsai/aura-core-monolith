'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/forecasting-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const shop = req => req.headers['x-shopify-shop-domain'] || 'unknown';

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'inventory-forecasting', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => {
  const skus = engine.getSkus();
  const risks = engine.getStockoutRisks();
  res.json({ ok: true, totalSkus: skus.length, criticalStockouts: risks.filter(r => r.urgency === 'critical').length, highRiskSkus: risks.length, reorderNeeded: skus.filter(s => s.reorderNeeded).length, avgForecastAccuracy: parseFloat((skus.reduce((s, k) => s + k.forecastAccuracy, 0) / skus.length).toFixed(2)) });
}));
router.get('/skus', asyncHandler(async (req, res) => res.json({ ok: true, skus: engine.getSkus(req.query) })));
router.get('/skus/:sku/forecast', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getForecast(req.params.sku) })));
router.get('/skus/:sku/safety-stock', asyncHandler(async (req, res) => {
  const skus = engine.getSkus();
  const sku = skus.find(s => s.sku === req.params.sku) || skus[0];
  res.json({ ok: true, ...engine.calcSafetyStock(sku, parseFloat(req.query.serviceLevel) || 0.95) });
}));
router.get('/skus/:sku/eoq', asyncHandler(async (req, res) => {
  const skus = engine.getSkus();
  const sku = skus.find(s => s.sku === req.params.sku) || skus[0];
  res.json({ ok: true, ...engine.calcEoq(sku) });
}));
router.get('/skus/:sku/po', asyncHandler(async (req, res) => {
  const skus = engine.getSkus();
  const sku = skus.find(s => s.sku === req.params.sku) || skus[0];
  res.json({ ok: true, purchaseOrder: engine.generatePurchaseOrder(sku) });
}));
router.get('/abc-xyz', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getAbcXyzMatrix() })));
router.get('/stockout-risks', asyncHandler(async (req, res) => res.json({ ok: true, risks: engine.getStockoutRisks() })));
router.get('/seasonal', asyncHandler(async (req, res) => res.json({ ok: true, seasonal: engine.getSeasonalIndex() })));
router.post('/what-if', asyncHandler(async (req, res) => {
  const { demandMultiplier = 1.3, leadTimeMultiplier = 1.5 } = req.body;
  res.json({ ok: true, scenarios: engine.whatIfScenario(demandMultiplier, leadTimeMultiplier) });
}));
router.post('/forecast/run', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { sku } = req.body;
  if (!sku) return res.status(400).json({ ok: false, error: 'sku required' });
  res.json({ ok: true, ...engine.getForecast(sku) });
}));
router.post('/po/bulk-generate', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const skus = engine.getSkus({ highRisk: true });
  res.json({ ok: true, purchaseOrders: skus.map(s => engine.generatePurchaseOrder(s)) });
}));

router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
