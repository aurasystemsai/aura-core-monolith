'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/competitive-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'competitive-analysis', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/keyword-gaps', ah(async (req, res) => res.json({ ok: true, ...engine.getKeywordGaps(req.query) })));
router.get('/competitors', ah(async (req, res) => res.json({ ok: true, ...engine.getCompetitors(req.query) })));
router.get('/competitors/:id', ah(async (req, res) => { const item = engine.getCompetitor(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, competitor: item }); }));
router.post('/pricing/analyze', requireCreditsOnMutation('competitive-analysis'), ah(async (req, res) => res.json({ ok: true, ...engine.analyzePricing(req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

