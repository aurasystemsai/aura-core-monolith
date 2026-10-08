// AI Copilot: a chat assistant that answers questions about this shop using a live snapshot of its real
// products, stock and recent sales. It is told to use only that snapshot, so it says so when it does not know.
// It only reads; it never changes anything in Shopify. Each answer costs credits.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const inventory = require('../inventory-forecasting/router');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const SNAPSHOT_TTL = 5 * 60 * 1000;
const cache = new Map();
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

async function buildSnapshot(shop, token) {
  const hit = cache.get(shop);
  if (hit && Date.now() - hit.at < SNAPSHOT_TTL) return hit.snap;
  const d = await gql(shop, token, '{ shop { name currencyCode } productVariants(first: 250) { nodes { id displayName price inventoryQuantity product { title status } } } }');
  const variants = d.productVariants.nodes.filter((v) => v.product && v.product.status === 'ACTIVE');
  const byId = Object.fromEntries(variants.map((v) => [v.id, v]));
  const o = await inventory._loadOrders(shop, token);
  const snap = {
    shop: d.shop.name, currency: d.shop.currencyCode, generatedAt: new Date().toISOString(),
    products: variants.slice(0, 40).map((v) => `${v.displayName || v.product.title}: price ${v.price}, ${Math.max(0, num(v.inventoryQuantity))} in stock`),
    productCount: variants.length, truncated: variants.length > 40,
    lowStock: variants.filter((v) => num(v.inventoryQuantity) <= 5).slice(0, 15).map((v) => `${v.displayName || v.product.title} (${Math.max(0, num(v.inventoryQuantity))} left)`),
  };
  if (o.unavailable) snap.sales = 'Order history is not available to this app, so sales questions cannot be answered.';
  else {
    const revenue = o.orders.reduce((s, x) => s + num(x.totalPriceSet.shopMoney.amount), 0);
    const units = {};
    o.orders.forEach((x) => x.lineItems.nodes.forEach((l) => { if (l.variant && byId[l.variant.id]) { const n = byId[l.variant.id].displayName; units[n] = (units[n] || 0) + num(l.quantity); } }));
    snap.sales = {
      windowDays: 60, orders: o.orders.length, revenue: round(revenue), averageOrderValue: o.orders.length ? round(revenue / o.orders.length) : 0,
      topProductsByUnits: Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, q]) => `${n}: ${q}`),
    };
  }
  cache.set(shop, { at: Date.now(), snap });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return snap;
}

router.get('/prompts', (req, res) => res.json({ ok: true, prompts: [
  'What are my best sellers over the last 60 days?',
  'Which products are running low on stock?',
  'How much did I sell recently and what is my average order value?',
  'Suggest three ways to sell more of my slowest products.',
] }));

router.post('/chat', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const message = String((req.body && req.body.message) || '').trim().slice(0, 1000);
  if (!message) return res.status(400).json({ ok: false, error: 'Type a question first.' });
  const history = (Array.isArray(req.body.history) ? req.body.history : []).slice(-6)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  const snap = await buildSnapshot(shop, token);
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 500,
    messages: [
      { role: 'system', content: `You are the assistant for the Shopify store described in the data below. Answer using only this data. If the data does not contain the answer, say you do not have it; never invent numbers, products or customers. Be brief and practical, in plain text.\n\nSTORE DATA:\n${JSON.stringify(snap)}` },
      ...history, { role: 'user', content: message },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'ai-chat' });
  res.json({ ok: true, reply: (resp.choices[0].message.content || '').trim(), dataAsOf: snap.generatedAt });
}));

module.exports = router;
module.exports._clearCache = () => cache.clear();