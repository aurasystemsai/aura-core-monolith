'use strict';

// Merchant-facing key management (signed in with the Shopify session). The key itself is only ever returned
// by POST /regenerate, once.
const express = require('express');
const { getShopContext } = require('../core/shopContext');
const apiKeys = require('../core/apiKeys');

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

module.exports = router;
