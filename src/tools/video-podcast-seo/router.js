'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/video-podcast-seo-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'video-podcast-seo', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/videos', ah(async (req, res) => res.json({ ok: true, ...engine.getVideos(req.query) })));
router.get('/videos/:id', ah(async (req, res) => { const item = engine.getVideo(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, video: item }); }));
router.post('/videos/:id/analyze-transcript', requireCreditsOnMutation('content-brief'), ah(async (req, res) => res.json({ ok: true, ...engine.analyzeTranscript(req.params.id, req.body) })));
router.post('/videos/:id/generate-description', requireCreditsOnMutation('email-gen'), ah(async (req, res) => res.json({ ok: true, ...engine.generateDescription(req.params.id, req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

