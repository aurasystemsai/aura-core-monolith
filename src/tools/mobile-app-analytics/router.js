'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/mobile-app-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'mobile-app-analytics', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/push-campaigns', ah(async (req, res) => res.json({ ok: true, ...engine.getPushCampaigns(req.query) })));
router.get('/events', ah(async (req, res) => res.json({ ok: true, ...engine.getEvents(req.query) })));
router.get('/screens', ah(async (req, res) => res.json({ ok: true, ...engine.getScreens(req.query) })));
router.get('/metrics', ah(async (req, res) => res.json({ ok: true, ...engine.getAppMetrics(req.query) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

