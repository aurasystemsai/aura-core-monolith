'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/dashboard-builder-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'custom-dashboard-builder', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/widget-catalog', ah(async (req, res) => res.json({ ok: true, ...engine.getWidgetCatalog() })));
router.get('/dashboards', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboards(req.query) })));
router.get('/dashboards/:id', ah(async (req, res) => { const item = engine.getDashboard(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, dashboard: item }); }));
router.get('/widgets/:id/data', ah(async (req, res) => res.json({ ok: true, ...engine.getWidgetData(req.params.id, req.query) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

