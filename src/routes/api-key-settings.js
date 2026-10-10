'use strict';

// Merchant-facing key management (signed in with the Shopify session). The key itself is only ever returned
// by POST /regenerate, once.
const express = require('express');
const { getShopContext } = require('../core/shopContext');
const apiKeys = require('../core/apiKeys');
const webhooks = require('../core/webhooks');

const router = express.Router();

router.use((req, res, next) => {
  const ctx = getShopContext(req);
  if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
  req.ctxShop = ctx.shop;
  next();
});

router.get('/api-key', (req, res) => res.json({ ok: true, ...apiKeys.status(req.ctxShop) }));
router.post('/api-key/regenerate', (req, res) => res.json({ ok: true, key: apiKeys.regenerate(req.ctxShop), ...apiKeys.status(req.ctxShop) }));
router.delete('/api-key', (req, res) => { apiKeys.revoke(req.ctxShop); res.json({ ok: true, exists: false }); });

const fail = (res, e) => res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : 'Something went wrong.' });
router.get('/webhooks', (req, res) => res.json({ ok: true, ...webhooks.list(req.ctxShop) }));
router.post('/webhooks', async (req, res) => {
  try { res.json({ ok: true, webhook: await webhooks.add(req.ctxShop, req.body || {}) }); } catch (e) { fail(res, e); }
});
router.post('/webhooks/:id/test', async (req, res) => {
  try { res.json({ ok: true, ...(await webhooks.sendTest(req.ctxShop, req.params.id)) }); } catch (e) { fail(res, e); }
});
router.post('/webhooks/:id/active', (req, res) => {
  if (!webhooks.setActive(req.ctxShop, req.params.id, req.body && req.body.active)) return res.status(404).json({ ok: false, error: 'Webhook not found.' });
  res.json({ ok: true, ...webhooks.list(req.ctxShop) });
});
router.delete('/webhooks/:id', (req, res) => {
  if (!webhooks.remove(req.ctxShop, req.params.id)) return res.status(404).json({ ok: false, error: 'Webhook not found.' });
  res.json({ ok: true });
});

module.exports = router;
