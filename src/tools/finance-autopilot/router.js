'use strict';
const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');
const engine = require('./engines/finance-autopilot-engine');

router.use(verifyShopifySession);
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', asyncHandler(async (req, res) => res.json({ ok: true, service: 'finance-autopilot', version: '2.0.0' })));
router.get('/dashboard', asyncHandler(async (req, res) => res.json({ ok: true, ap: engine.getApDashboard(), reconciliation: engine.getBankReconciliation() })));
router.get('/invoices', asyncHandler(async (req, res) => res.json({ ok: true, invoices: engine.getInvoices(req.query) })));
router.get('/reconciliation', asyncHandler(async (req, res) => res.json({ ok: true, ...engine.getBankReconciliation() })));
router.post('/gl-map', asyncHandler(async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ ok: false, error: 'description required' });
  res.json({ ok: true, ...engine.mapGlAccount(description) });
}));
router.get('/duplicates', asyncHandler(async (req, res) => res.json({ ok: true, suspected: engine.detectDuplicates() })));
router.post('/shopify-reconcile', requireCreditsOnMutation('analytics-insight'), asyncHandler(async (req, res) => {
  const { payoutId } = req.body;
  if (!payoutId) return res.status(400).json({ ok: false, error: 'payoutId required' });
  res.json({ ok: true, ...engine.reconcileShopifyPayout(payoutId) });
}));
router.post('/invoices/:id/approve', asyncHandler(async (req, res) => {
  res.json({ ok: true, invoiceId: req.params.id, status: 'approved', approvedAt: new Date().toISOString() });
}));
router.use((err, req, res, next) => res.status(500).json({ ok: false, error: err.message }));
module.exports = router;
