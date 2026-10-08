// Pricing Advisor: suggests price changes from real stock and real sales, and applies them to Shopify only when you
// say so. Rules are plain and shown with each suggestion: slow sellers with lots of stock get a discount, fast
// sellers that are nearly out get a small rise, and anything priced too close to its cost is flagged. It never
// goes below cost (when Shopify has a cost), never moves a price more than 30%, and every change can be undone.
// AI only writes the short plan summary, from the suggestions calculated here.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const inventory = require('../inventory-forecasting/router');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TOOL = 'dynamic-pricing-engine';
const LOG = 'pricing-log';
const WINDOW = 60;
const MAX_MOVE = 0.3;
const MIN_MARGIN = 0.05;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const denied = (e) => /access denied|scope|permission/i.test(e.message);

async function loadVariants(shop, token) {
  const base = 'id displayName price compareAtPrice inventoryQuantity product { id title status }';
  let data;
  try { data = await gql(shop, token, `{ productVariants(first: 250) { nodes { ${base} inventoryItem { unitCost { amount } } } } }`); } catch (e) {
    if (!denied(e)) throw e;
    data = await gql(shop, token, `{ productVariants(first: 250) { nodes { ${base} } } }`);
  }
  return data.productVariants.nodes.filter((v) => v.product && v.product.status === 'ACTIVE').map((v) => ({
    id: v.id, productId: v.product.id, title: v.displayName || v.product.title, price: num(v.price),
    compareAt: v.compareAtPrice == null ? null : num(v.compareAtPrice), qty: Math.max(0, num(v.inventoryQuantity)),
    cost: v.inventoryItem && v.inventoryItem.unitCost ? num(v.inventoryItem.unitCost.amount) : null,
  }));
}

function floorFor(v) { return v.cost ? round(v.cost * (1 + MIN_MARGIN)) : 0.01; }

// One suggestion per variant at most; the first matching rule wins.
function suggest(variants, orders) {
  const units = {};
  orders.forEach((o) => o.lineItems.nodes.forEach((l) => { if (l.variant) units[l.variant.id] = (units[l.variant.id] || 0) + num(l.quantity); }));
  const out = [];
  for (const v of variants) {
    if (v.price <= 0) continue;
    const sold = units[v.id] || 0; const perDay = sold / WINDOW;
    const cover = perDay > 0 ? v.qty / perDay : null;
    let pct = 0; let rule = ''; let why = '';
    if (v.qty >= 10 && sold === 0) { pct = -10; rule = 'slow'; why = `${v.qty} in stock and none sold in ${WINDOW} days`; }
    else if (cover !== null && cover > 120 && v.qty >= 10) { pct = -5; rule = 'slow'; why = `${round(cover, 0)} days of stock at the current sales speed`; }
    else if (cover !== null && v.qty > 0 && cover < 14 && sold >= 5) { pct = 5; rule = 'hot'; why = `selling ${round(perDay, 1)} a day with only ${v.qty} left (${round(cover, 0)} days of cover)`; }
    else if (v.cost && v.price < v.cost * 1.2) { pct = round((v.cost * 1.3 / v.price - 1) * 100, 0); rule = 'margin'; why = `price is only ${round((v.price / v.cost - 1) * 100, 0)}% above its cost`; }
    if (!pct) continue;
    let next = round(v.price * (1 + pct / 100));
    next = Math.max(next, floorFor(v));
    if (Math.abs(next - v.price) < 0.01) continue;
    out.push({ variantId: v.id, productId: v.productId, title: v.title, rule, why, price: v.price, suggested: next, changePct: round((next / v.price - 1) * 100, 1), qty: v.qty, sold60: sold });
  }
  return out.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
}

router.get('/suggestions', withShop(async (req, res, { shop, token }) => {
  const variants = await loadVariants(shop, token);
  const o = await inventory._loadOrders(shop, token);
  if (o.unavailable) return res.json({ ok: true, ordersAvailable: false, suggestions: [], note: 'Order history is not available to this app yet, so sales speed is unknown and no price suggestions can be made.', ai: !!getOpenAIClient() });
  const suggestions = suggest(variants, o.orders);
  res.json({ ok: true, ordersAvailable: true, suggestions, checked: variants.length, windowDays: WINDOW, ai: !!getOpenAIClient() });
}));

router.get('/log', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, log: store.read(TOOL, shop, {})[LOG] || [] });
}));

async function setPrice(shop, token, v, price, compareAt) {
  const d = await gql(shop, token,
    'mutation($pid: ID!, $vs: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $pid, variants: $vs) { userErrors { message } } }',
    { pid: v.productId, vs: [{ id: v.id, price: price.toFixed(2), compareAtPrice: compareAt == null ? null : compareAt.toFixed(2) }] });
  const errs = d.productVariantsBulkUpdate.userErrors || [];
  if (errs.length) throw Object.assign(new Error(errs.map((e) => e.message).join('; ')), { status: 422 });
}

router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const price = round(num(b.price));
  if (!b.variantId || price <= 0) return res.status(400).json({ ok: false, error: 'Choose a variant and a price above zero.' });
  const v = (await loadVariants(shop, token)).find((x) => x.id === b.variantId);
  if (!v) return res.status(404).json({ ok: false, error: 'That product variant was not found or is not active.' });
  if (Math.abs(price / v.price - 1) > MAX_MOVE + 1e-9) return res.status(400).json({ ok: false, error: `A single change can move the price by at most ${MAX_MOVE * 100}%.` });
  if (price < floorFor(v)) return res.status(400).json({ ok: false, error: v.cost ? `That is below cost plus ${MIN_MARGIN * 100}% (${floorFor(v)}).` : 'Price is too low.' });
  // A discount shows as a sale by keeping the old price as the "compare at" price.
  const compareAt = price < v.price ? (v.compareAt && v.compareAt > v.price ? v.compareAt : v.price) : null;
  await setPrice(shop, token, v, price, compareAt);
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), variantId: v.id, productId: v.productId, title: v.title, from: v.price, fromCompareAt: v.compareAt, to: price, reverted: false };
  const data = store.read(TOOL, shop, {});
  data[LOG] = [entry, ...(data[LOG] || [])].slice(0, 200);
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
}));

router.post('/revert', withShop(async (req, res, { shop, token }) => {
  const data = store.read(TOOL, shop, {});
  const entry = (data[LOG] || []).find((e) => e.id === (req.body && req.body.id));
  if (!entry) return res.status(404).json({ ok: false, error: 'Change not found.' });
  if (entry.reverted) return res.status(400).json({ ok: false, error: 'That change was already undone.' });
  await setPrice(shop, token, { id: entry.variantId, productId: entry.productId }, entry.from, entry.fromCompareAt);
  entry.reverted = true; entry.revertedAt = new Date().toISOString();
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
}));

router.post('/brief', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const o = await inventory._loadOrders(shop, token);
  if (o.unavailable) return res.status(403).json({ ok: false, error: 'Order access has not been granted for this store.' });
  const list = suggest(await loadVariants(shop, token), o.orders).slice(0, 15);
  if (!list.length) return res.status(400).json({ ok: false, error: 'There are no price suggestions to summarise.' });
  const lines = list.map((s) => `${s.title}: ${s.price} to ${s.suggested} (${s.changePct}%), because ${s.why}`).join('\n');
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 350,
    messages: [{ role: 'system', content: 'You help a small shop owner decide on price changes. Use only the lines given. In under 120 words, say which 2-3 changes to make first and the main risk. Plain text, no markdown.' }, { role: 'user', content: lines }],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  res.json({ ok: true, brief: (resp.choices[0].message.content || '').trim() });
}));

module.exports = router;
module.exports._suggest = suggest;