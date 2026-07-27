'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/churn-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'churn-prediction-playbooks', v: '2.0.0' })));
router.get('/summary', ah(async (req, res) => res.json({ ok: true, ...engine.getChurnSummary() })));
router.get('/rfm-segments', ah(async (req, res) => res.json({ ok: true, segments: engine.getRfmSegments() })));
router.get('/cohort-retention', ah(async (req, res) => res.json({ ok: true, ...engine.getCohortRetention(req.query) })));
router.get('/early-warnings', ah(async (req, res) => res.json({ ok: true, ...engine.getEarlyWarnings(req.query) })));
router.get('/playbooks', ah(async (req, res) => res.json({ ok: true, ...engine.getPlaybooks(req.query) })));
router.post('/churn-probability', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.calcChurnProbability(req.body) })));
router.post('/reactivation-roi', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.calcReactivationRoi(req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

