'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/daily-cfo-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'daily-cfo-pack', version: '2.0.0' })));
router.get('/briefing', asyncHandler(async (req, res) => res.json({ ok: true, briefing: engine.getBriefing() })));
router.get('/kpis', asyncHandler(async (req, res) => res.json({ ok: true, kpis: engine.getKpis() })));
router.get('/ticker', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getRevenueTicker() })));
router.get('/benchmarks', asyncHandler(async (req, res) => res.json({ ok: true, benchmarks: engine.getCompetitiveBenchmarks() })));
router.get('/thresholds', asyncHandler(async (req, res) => res.json({ ok: true, thresholds: engine.getAdaptiveThresholds() })));
router.post('/nlp-query', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  res.json({ ok: true, ...engine.answerNlpQuery(query) });
}));
router.post('/board-pack', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  res.json({ ok: true, pack: engine.generateBoardPack() });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
