'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/supplier-sync-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'inventory-supplier-sync', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => {
  const suppliers = engine.getSuppliers();
  const alerts = engine.getDisruptionAlerts();
  res.json({ ok: true, totalSuppliers: suppliers.length, preferred: suppliers.filter(s => s.status === 'preferred').length, watch: suppliers.filter(s => s.status === 'watch').length, activeAlerts: alerts.length, avgScore: Math.round(suppliers.reduce((s, sup) => s + sup.overallScore, 0) / suppliers.length) });
}));
router.get('/suppliers', asyncHandler(async (req, res) => res.json({ ok: true, suppliers: engine.getSuppliers(req.query) })));
router.get('/suppliers/:id/scorecard', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getScorecard(req.params.id) })));
router.get('/suppliers/:id/lead-time', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getLeadTimePrediction(req.params.id) })));
router.get('/alerts', asyncHandler(async (req, res) => res.json({ ok: true, alerts: engine.getDisruptionAlerts() })));
router.get('/alternatives', asyncHandler(async (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ ok: false, error: 'category required' });
  res.json({ ok: true, alternatives: engine.getAlternativeSuppliers(category) });
}));
router.get('/carbon', asyncHandler(async (req, res) => res.json({ ok: true, footprint: engine.getCarbonFootprint() })));
router.get('/benchmarks', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getBenchmarks() })));
router.post('/suppliers/analyze', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const suppliers = engine.getSuppliers();
  res.json({ ok: true, analysis: suppliers.map(s => engine.getScorecard(s.id)) });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
