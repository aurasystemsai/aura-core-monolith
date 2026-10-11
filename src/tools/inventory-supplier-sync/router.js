'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/supplier-sync-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'inventory-supplier-sync', v: '2.0.0' })));
router.get('/benchmarks', ah(async (req, res) => res.json({ ok: true, ...engine.getBenchmarks() })));
router.get('/alerts/disruption', ah(async (req, res) => res.json({ ok: true, ...engine.getDisruptionAlerts() })));
router.get('/suppliers', ah(async (req, res) => res.json({ ok: true, ...engine.getSuppliers(req.query) })));
router.get('/suppliers/:id/scorecard', ah(async (req, res) => { const item = engine.getScorecard(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, scorecard: item }); }));
router.get('/suppliers/:id/lead-time', ah(async (req, res) => { const item = engine.getLeadTimePrediction(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, prediction: item }); }));
router.get('/suppliers/:id/alternatives', ah(async (req, res) => res.json({ ok: true, ...engine.getAlternativeSuppliers(req.params.id) })));
router.get('/suppliers/:id/carbon', ah(async (req, res) => res.json({ ok: true, ...engine.getCarbonFootprint(req.params.id) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

