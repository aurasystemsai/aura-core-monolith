'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/launch-planner-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'ai-launch-planner', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/templates', ah(async (req, res) => res.json({ ok: true, templates: engine.getTemplates() })));
router.get('/launches', ah(async (req, res) => res.json({ ok: true, ...engine.getLaunches(req.query) })));
router.get('/launches/:id', ah(async (req, res) => { const item = engine.getLaunch(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, launch: item }); }));
router.post('/launch-plan/generate', requireCreditsOnMutation('blog-draft'), ah(async (req, res) => res.json({ ok: true, ...engine.generateLaunchPlan(req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

