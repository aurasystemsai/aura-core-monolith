'use strict';

// Public read-only API, called with a shop's API key: Authorization: Bearer aura_live_...
// It can read account info and the log of changes AURA has made. It cannot change anything and spends no credits.
const express = require('express');
const apiKeys = require('../core/apiKeys');
const credits = require('../core/creditLedger');
const productSnapshot = require('../core/productSnapshot');
const store = require('../core/shopStore');
const { rateLimit } = require('../core/rateLimit');

const router = express.Router();

router.use(rateLimit({ max: Number(process.env.RATE_LIMIT_API_PER_MIN) || 60, keyFn: (req) => req.ip }));

router.use((req, res, next) => {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  const shop = m && apiKeys.verify(m[1]);
  if (!shop) return res.status(401).json({ ok: false, error: 'Missing or invalid API key. Send it as "Authorization: Bearer <key>".' });
  req.apiShop = shop;
  apiKeys.touch(shop);
  next();
});

const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (e) { res.status(500).json({ ok: false, error: 'Something went wrong.' }); }
};
const limitOf = (req) => Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));

router.get('/me', wrap(async (req, res) => {
  const c = await credits.getCreditStatus(req.apiShop);
  res.json({ ok: true, shop: req.apiShop, plan: c.plan, credits: { balance: c.balance, used: c.used, planCredits: c.plan_credits } });
}));

router.get('/changes', wrap(async (req, res) => {
  const n = limitOf(req);
  const product = productSnapshot.history(req.apiShop).slice(0, n)
    .map((h) => ({ id: h.id, at: h.at, productId: h.productId, fieldsChanged: h.changed, undone: !!h.reverted }));
  const alt = (store.read('image-alt-media-seo', req.apiShop, {})['alt-log'] || []).slice(0, n)
    .map((e) => ({ id: e.id, at: e.at, productId: e.productId, label: e.label, from: e.from, to: e.to, undone: !!e.reverted }));
  res.json({ ok: true, productSeo: product, altText: alt });
}));

router.use((req, res) => res.status(404).json({ ok: false, error: 'Unknown endpoint.' }));

module.exports = router;
