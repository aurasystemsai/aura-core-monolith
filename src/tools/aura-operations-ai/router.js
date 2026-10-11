'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/aura-ops-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'aura-operations-ai', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/briefing', ah(async (req, res) => res.json({ ok: true, ...engine.getDailyBriefing() })));
router.get('/workflows', ah(async (req, res) => res.json({ ok: true, ...engine.getWorkflows(req.query) })));
router.get('/alerts', ah(async (req, res) => res.json({ ok: true, ...engine.getAlerts(req.query) })));
router.post('/alerts/:id/resolve', ah(async (req, res) => res.json({ ok: true, ...engine.resolveAlert(req.params.id, req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

