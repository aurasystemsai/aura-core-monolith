'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/dam-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'digital-asset-management', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/collections', ah(async (req, res) => res.json({ ok: true, ...engine.getCollections(req.query) })));
router.get('/assets', ah(async (req, res) => res.json({ ok: true, ...engine.getAssets(req.query) })));
router.get('/assets/:id', ah(async (req, res) => { const item = engine.getAsset(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, asset: item }); }));
router.post('/assets/:id/alt-text', requireCreditsOnMutation('seo-scan'), ah(async (req, res) => res.json({ ok: true, ...engine.generateAltText(req.params.id) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

