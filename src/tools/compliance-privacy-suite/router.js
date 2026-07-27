'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(verifyShopifySession);
const engine = require('./engines/compliance-privacy-engine');
router.get('/health', ah(async (req, res) => res.json({ ok: true, service: 'compliance-privacy-suite', v: '2.0.0' })));
router.get('/dashboard', ah(async (req, res) => res.json({ ok: true, ...engine.getDashboardStats() })));
router.get('/compliance-checks', ah(async (req, res) => res.json({ ok: true, ...engine.getComplianceChecks() })));
router.get('/consents', ah(async (req, res) => res.json({ ok: true, ...engine.getConsents(req.query) })));
router.get('/dsar', ah(async (req, res) => res.json({ ok: true, ...engine.getDsarRequests(req.query) })));
router.get('/dsar/:id', ah(async (req, res) => { const item = engine.getDsarRequest(req.params.id); if (!item) return res.status(404).json({ ok: false, error: 'not found' }); res.json({ ok: true, request: item }); }));
router.post('/dsar', ah(async (req, res) => res.json({ ok: true, ...engine.createDsarRequest(req.body) })));
router.post('/customers/:id/delete', ah(async (req, res) => res.json({ ok: true, ...engine.deleteCustomerData(req.params.id, req.body) })));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;

