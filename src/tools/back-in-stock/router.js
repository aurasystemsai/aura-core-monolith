'use strict';

// Back-in-Stock Alerts: shoppers who asked to be told get one email when their item is available again.
// No AI and no credits. Stock is read live from Shopify. Each waiting shopper is emailed once, then closed.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const mailer = require('../../core/mailer');
const messaging = require('../../core/messaging');

const router = express.Router();
const TOOL = 'back-in-stock';
const VARIANT = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
const MAX_WAITING = 2000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const load = (shop) => store.read(TOOL, shop, []);

const VARIANTS = `nodes(ids: $ids) { ... on ProductVariant { id title inventoryQuantity availableForSale
  product { title handle onlineStoreUrl status } } }`;

async function variantsById(shop, token, ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    const d = await gql(shop, token, `query($ids:[ID!]!){ ${VARIANTS} }`, { ids: ids.slice(i, i + 100) });
    for (const n of d.nodes) if (n && n.id) out.set(n.id, n);
  }
  return out;
}
const isBack = (v) => !!v && v.product && v.product.status === 'ACTIVE' && v.availableForSale && v.inventoryQuantity > 0;
const urlFor = (shop, v) => v.product.onlineStoreUrl || `https://${shop}/products/${v.product.handle}`;
const label = (v) => (v.title && v.title !== 'Default Title' ? `${v.product.title} (${v.title})` : v.product.title);

router.get('/status', withShop(async (req, res, { shop }) => {
  const list = load(shop);
  const base = (process.env.APP_URL || '').replace(/\/+$/, '');
  res.json({ ok: true, scriptUrl: base ? base + '/storefront/back-in-stock.js' : '', sending: mailer.isConfigured(), waiting: list.filter((s) => !s.notifiedAt).length, notified: list.filter((s) => s.notifiedAt).length });
}));

// Variants that are sold out right now, for choosing what a shopper is waiting for.
router.get('/soldout', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, '{ productVariants(first:100, query:"inventory_quantity:<=0"){ nodes{ id title product{ title status } } } }');
  res.json({ ok: true, variants: d.productVariants.nodes.filter((v) => v.product.status === 'ACTIVE').map((v) => ({ id: v.id, title: v.title && v.title !== 'Default Title' ? `${v.product.title} (${v.title})` : v.product.title })) });
}));

router.get('/subscribers', withShop(async (req, res, { shop, token }) => {
  const list = load(shop);
  const ids = [...new Set(list.filter((s) => !s.notifiedAt).map((s) => s.variantId))];
  const live = ids.length ? await variantsById(shop, token, ids) : new Map();
  const subscribers = list.map((s) => ({ ...s, inStockNow: !s.notifiedAt && isBack(live.get(s.variantId)) }));
  res.json({ ok: true, subscribers, readyToSend: subscribers.filter((s) => s.inStockNow).length });
}));

// Shared by the merchant screen and the public storefront signup. Throws errors that carry an HTTP status.
async function subscribe(shop, token, { email, variantId, consent }) {
  const fail = (status, message) => Object.assign(new Error(message), { status });
  email = clean(email, 254).toLowerCase();
  variantId = clean(variantId, 80);
  if (!mailer.isEmail(email)) throw fail(400, 'Enter a valid email address.');
  if (!VARIANT.test(variantId)) throw fail(400, 'Choose a sold-out product.');
  if (consent !== true) throw fail(400, 'Confirm the shopper asked to be emailed.');
  const v = (await variantsById(shop, token, [variantId])).get(variantId);
  if (!v) throw fail(404, 'Product not found.');
  if (isBack(v)) throw fail(409, 'This product is already in stock.');
  const list = load(shop);
  if (list.filter((s) => !s.notifiedAt).length >= MAX_WAITING) throw fail(429, 'Too many shoppers waiting. Send some alerts first.');
  if (list.some((s) => !s.notifiedAt && s.email === email && s.variantId === variantId)) throw fail(409, 'This shopper is already waiting for that product.');
  const entry = { id: crypto.randomUUID(), email, variantId, product: label(v), createdAt: new Date().toISOString(), notifiedAt: null };
  store.write(TOOL, shop, [entry, ...list]);
  return entry;
}

router.post('/add', withShop(async (req, res, { shop, token }) => {
  res.json({ ok: true, subscriber: await subscribe(shop, token, req.body || {}) });
}));
router.delete('/subscribers/:id', withShop(async (req, res, { shop }) => {
  const list = load(shop);
  if (!list.some((s) => s.id === req.params.id)) return res.status(404).json({ ok: false, error: 'Not found.' });
  store.write(TOOL, shop, list.filter((s) => s.id !== req.params.id));
  res.json({ ok: true });
}));

router.post('/send', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (b.confirm !== true) return res.status(400).json({ ok: false, error: 'Confirmation is required before emailing shoppers.' });
  if (!mailer.isConfigured()) return res.status(503).json({ ok: false, error: 'Email sending is not set up on the server yet.' });
  const list = load(shop);
  const waiting = list.filter((s) => !s.notifiedAt);
  const live = waiting.length ? await variantsById(shop, token, [...new Set(waiting.map((s) => s.variantId))]) : new Map();
  const due = waiting.filter((s) => isBack(live.get(s.variantId)));
  if (!due.length) return res.json({ ok: true, sent: 0, failed: 0, message: 'Nothing is back in stock for anyone waiting.' });
  let sent = 0; let failed = 0; let limited = 0;
  for (const s of due) {
    if (!messaging.reserve(shop, 'email', 'campaign', 1)) { limited++; continue; }
    const v = live.get(s.variantId);
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222"><p>Good news, <strong>${mailer.esc(label(v))}</strong> is back in stock.</p><p><a href="${mailer.esc(urlFor(shop, v))}" style="display:inline-block;background:#111;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">Shop it now</a></p><hr style="border:none;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#777">You asked us to tell you when this item was back. This is the only email you will get about it.</p></div>`;
    try {
      const r = await mailer.sendEmail({ to: s.email, subject: `Back in stock: ${label(v)}`.slice(0, 150), html });
      if (r.sent) { s.notifiedAt = new Date().toISOString(); sent++; } else failed++;
    } catch { failed++; }
  }
  store.write(TOOL, shop, list);
  res.json({ ok: true, sent, failed, limited });
}));

module.exports = router;
module.exports.subscribe = subscribe;
module.exports.soldOut = async (shop, token, variantId) => {
  if (!VARIANT.test(variantId)) return false;
  const v = (await variantsById(shop, token, [variantId])).get(variantId);
  return !!v && v.product.status === 'ACTIVE' && !isBack(v);
};