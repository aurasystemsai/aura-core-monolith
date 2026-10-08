// Inventory & Cash: stock levels, sales speed, reorder suggestions by supplier, and a simple finance view.
// Sales speed comes from the last 60 days of real orders. If the store hasn't granted order access, stock still
// shows but forecasts and finance say "needs order access" instead of guessing. Supplier details are yours, entered
// by hand. AI only writes the purchase-order email and the daily brief, from the numbers calculated here.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const SUPPLIERS = 'inventory-suppliers';
const MAP = 'inventory-supplier-map';
const WINDOW = 60;
const SAFETY_DAYS = 7;
const DEFAULT_LEAD = 14;
const DAY = 86400000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const denied = (e) => /access denied|scope|permission/i.test(e.message);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

async function loadVariants(shop, token) {
  const base = 'id displayName sku price inventoryQuantity product { id title status }';
  let withCost = true; let data;
  try {
    data = await gql(shop, token, `{ productVariants(first: 250) { nodes { ${base} inventoryItem { unitCost { amount } } } } }`);
  } catch (e) {
    if (!denied(e)) throw e;
    withCost = false;
    data = await gql(shop, token, `{ productVariants(first: 250) { nodes { ${base} } } }`);
  }
  const variants = data.productVariants.nodes.filter((v) => v.product && v.product.status === 'ACTIVE').map((v) => ({
    id: v.id, productId: v.product.id, title: v.displayName || v.product.title, sku: v.sku || '', price: num(v.price),
    qty: Math.max(0, num(v.inventoryQuantity)), cost: v.inventoryItem && v.inventoryItem.unitCost ? num(v.inventoryItem.unitCost.amount) : null,
  }));
  return { variants, costAvailable: withCost };
}

// Orders for the last 60 days (up to 4 pages of 250). Returns { orders } or { unavailable }.
async function loadOrders(shop, token, now = Date.now()) {
  const since = new Date(now - WINDOW * DAY).toISOString().slice(0, 10);
  const q = 'query($after: String, $f: String) { orders(first: 250, after: $after, query: $f, sortKey: PROCESSED_AT, reverse: true) { pageInfo { hasNextPage endCursor } nodes { createdAt: processedAt totalPriceSet { shopMoney { amount currencyCode } } lineItems(first: 50) { nodes { quantity variant { id } } } } } }';
  const orders = []; let after = null;
  try {
    for (let i = 0; i < 4; i++) {
      const d = await gql(shop, token, q, { after, f: `processed_at:>=${since}` });
      orders.push(...d.orders.nodes);
      if (!d.orders.pageInfo.hasNextPage) break;
      after = d.orders.pageInfo.endCursor;
    }
  } catch (e) {
    if (denied(e)) return { unavailable: e.message };
    throw e;
  }
  return { orders };
}

function forecast(variants, orders, suppliers, map) {
  const units = {};
  orders.forEach((o) => o.lineItems.nodes.forEach((l) => { if (l.variant) units[l.variant.id] = (units[l.variant.id] || 0) + num(l.quantity); }));
  const byId = Object.fromEntries(suppliers.map((s) => [s.id, s]));
  return variants.map((v) => {
    const sold = units[v.id] || 0; const velocity = sold / WINDOW;
    const supplier = byId[map[v.productId]] || null; const lead = supplier ? supplier.leadDays : DEFAULT_LEAD;
    const cover = velocity > 0 ? round(v.qty / velocity, 1) : null;
    const need = velocity > 0 && cover < lead + SAFETY_DAYS;
    const suggested = need ? Math.max(1, Math.ceil(velocity * (lead + 30)) - v.qty) : 0;
    let status = 'ok';
    if (v.qty === 0 && velocity > 0) status = 'out';
    else if (need) status = 'reorder';
    else if (sold === 0 && v.qty > 0) status = 'no-sales';
    return { ...v, sold60: sold, perDay: round(velocity, 2), daysCover: cover, status, suggestedQty: suggested, supplierId: supplier ? supplier.id : null, supplierName: supplier ? supplier.name : null, leadDays: lead };
  });
}

function finance(orders, variants, now = Date.now()) {
  const cur = { revenue: 0, orders: 0 }; const prev = { revenue: 0, orders: 0 }; let currency = '';
  orders.forEach((o) => {
    const age = (now - new Date(o.createdAt).getTime()) / DAY; const amt = num(o.totalPriceSet && o.totalPriceSet.shopMoney.amount);
    currency = currency || (o.totalPriceSet && o.totalPriceSet.shopMoney.currencyCode) || '';
    const b = age <= 30 ? cur : prev; b.revenue += amt; b.orders++;
  });
  const pct = (a, b) => (b > 0 ? round(((a - b) / b) * 100, 1) : null);
  const withCost = variants.filter((v) => v.cost != null);
  return {
    currency,
    last30: { revenue: round(cur.revenue), orders: cur.orders, aov: cur.orders ? round(cur.revenue / cur.orders) : 0 },
    previous30: { revenue: round(prev.revenue), orders: prev.orders },
    revenueChangePct: pct(cur.revenue, prev.revenue),
    stockAtRetail: round(variants.reduce((s, v) => s + v.qty * v.price, 0)),
    stockAtCost: withCost.length === variants.length && variants.length ? round(variants.reduce((s, v) => s + v.qty * v.cost, 0)) : null,
  };
}

router.get('/overview', withShop(async (req, res, { shop, token }) => {
  const { variants, costAvailable } = await loadVariants(shop, token);
  const o = await loadOrders(shop, token);
  const suppliers = store.read(SUPPLIERS, shop, []); const map = store.read(MAP, shop, {});
  const ordersOk = !o.unavailable;
  const items = forecast(variants, ordersOk ? o.orders : [], suppliers, map);
  const counts = { out: 0, reorder: 0, 'no-sales': 0, ok: 0 }; items.forEach((i) => { counts[i.status]++; });
  res.json({
    ok: true, ai: !!getOpenAIClient(), ordersAvailable: ordersOk, costAvailable,
    note: ordersOk ? null : 'Order history is not available to this app yet, so sales speed and finance are off. Stock levels below are real.',
    windowDays: WINDOW, counts: ordersOk ? counts : null, items, suppliers, map,
    finance: ordersOk ? finance(o.orders, variants) : null,
  });
}));

router.post('/suppliers', withShop(async (req, res, { shop }) => {
  const b = req.body || {}; const name = clean(b.name, 100);
  if (!name) return res.status(400).json({ ok: false, error: 'Supplier name is required.' });
  const lead = Math.round(num(b.leadDays));
  if (lead < 1 || lead > 365) return res.status(400).json({ ok: false, error: 'Lead time must be 1 to 365 days.' });
  const email = clean(b.email, 200);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'That email address looks wrong.' });
  const s = { id: crypto.randomUUID(), name, email, leadDays: lead };
  store.write(SUPPLIERS, shop, [s, ...store.read(SUPPLIERS, shop, [])].slice(0, 100));
  res.json({ ok: true, supplier: s });
}));

router.delete('/suppliers/:id', withShop(async (req, res, { shop }) => {
  store.write(SUPPLIERS, shop, store.read(SUPPLIERS, shop, []).filter((s) => s.id !== req.params.id));
  const map = store.read(MAP, shop, {}); Object.keys(map).forEach((k) => { if (map[k] === req.params.id) delete map[k]; });
  store.write(MAP, shop, map);
  res.json({ ok: true });
}));

router.put('/assign', withShop(async (req, res, { shop }) => {
  const { productId, supplierId } = req.body || {};
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(String(productId))) return res.status(400).json({ ok: false, error: 'Invalid product.' });
  const map = store.read(MAP, shop, {});
  if (!supplierId) delete map[productId];
  else if (!store.read(SUPPLIERS, shop, []).some((s) => s.id === supplierId)) return res.status(404).json({ ok: false, error: 'Supplier not found.' });
  else map[productId] = supplierId;
  store.write(MAP, shop, map);
  res.json({ ok: true });
}));

router.post('/po-draft', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const suppliers = store.read(SUPPLIERS, shop, []); const sup = suppliers.find((s) => s.id === (req.body || {}).supplierId);
  if (!sup) return res.status(404).json({ ok: false, error: 'Supplier not found.' });
  const o = await loadOrders(shop, token);
  if (o.unavailable) return res.status(409).json({ ok: false, error: 'Reorder quantities need order history, which this app cannot read yet.' });
  const { variants } = await loadVariants(shop, token);
  const lines = forecast(variants, o.orders, suppliers, store.read(MAP, shop, {})).filter((i) => i.supplierId === sup.id && i.suggestedQty > 0);
  if (!lines.length) return res.status(400).json({ ok: false, error: 'Nothing needs reordering from this supplier right now.' });
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 500,
    messages: [
      { role: 'system', content: 'Write a short, polite purchase-order email from a small shop to a supplier. List each item with its quantity exactly as given. Do not mention prices, discounts, payment terms or delivery dates. Sign off as "[Your name]".' },
      { role: 'user', content: JSON.stringify({ supplier: sup.name, items: lines.map((l) => ({ item: l.title, sku: l.sku, quantity: l.suggestedQty })) }) },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  res.json({ ok: true, supplier: sup, lines: lines.map((l) => ({ title: l.title, sku: l.sku, qty: l.suggestedQty })), email: clean(out.choices[0].message.content, 3000) });
}));

router.post('/brief', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const o = await loadOrders(shop, token);
  if (o.unavailable) return res.status(409).json({ ok: false, error: 'The brief needs order history, which this app cannot read yet.' });
  const { variants } = await loadVariants(shop, token);
  const items = forecast(variants, o.orders, store.read(SUPPLIERS, shop, []), store.read(MAP, shop, {}));
  const facts = { finance: finance(o.orders, variants), outOfStock: items.filter((i) => i.status === 'out').slice(0, 8).map((i) => i.title), reorderSoon: items.filter((i) => i.status === 'reorder').slice(0, 8).map((i) => ({ item: i.title, daysCover: i.daysCover })), notSelling: items.filter((i) => i.status === 'no-sales').length };
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 400,
    messages: [
      { role: 'system', content: 'Write a brief for a shop owner: 3 to 5 short bullet points covering the most important money and stock points. Use only the numbers given. No predictions or invented figures.' },
      { role: 'user', content: JSON.stringify(facts) },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  res.json({ ok: true, brief: clean(out.choices[0].message.content, 2000), facts });
}));

module.exports = router;
module.exports._forecast = forecast;
module.exports._finance = finance;
