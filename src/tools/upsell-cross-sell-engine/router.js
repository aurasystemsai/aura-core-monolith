// Upsell & Cross-sell: what to recommend next to each product. Uses real "bought together" counts from your
// recent orders when the store allows order access; otherwise falls back to catalogue similarity (type, tags,
// title words) and says so. AI only writes the pitch wording. It never invents discounts or numbers.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const STOP = new Set(['the', 'and', 'for', 'with', 'your', 'our', 'set', 'new', 'a', 'of', 'in', 'to']);

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

async function loadProducts(shop, token) {
  const d = await gql(shop, token, '{ products(first: 100, query: "status:active") { nodes { id title handle productType tags onlineStoreUrl priceRangeV2 { minVariantPrice { amount currencyCode } } featuredImage { url } } } }');
  return d.products.nodes.map((p) => ({
    id: p.id, title: p.title, type: p.productType || '', tags: p.tags || [], url: p.onlineStoreUrl || `https://${shop}/products/${p.handle}`,
    price: p.priceRangeV2 ? Number(p.priceRangeV2.minVariantPrice.amount) : null, currency: p.priceRangeV2 ? p.priceRangeV2.minVariantPrice.currencyCode : '',
    image: p.featuredImage ? p.featuredImage.url : null,
  }));
}

// Returns { baskets: string[][] } of product ids per order, or { unavailable } when orders can't be read.
async function loadBaskets(shop, token) {
  try {
    const d = await gql(shop, token, '{ orders(first: 250, sortKey: PROCESSED_AT, reverse: true) { nodes { lineItems(first: 25) { nodes { product { id } } } } } }');
    const baskets = d.orders.nodes.map((o) => [...new Set(o.lineItems.nodes.map((l) => l.product && l.product.id).filter(Boolean))]);
    return { baskets: baskets.filter((b) => b.length > 0) };
  } catch (e) {
    if (/access denied|scope|permission/i.test(e.message)) return { unavailable: e.message };
    throw e;
  }
}

function coPurchase(baskets) {
  const pair = {}; const count = {};
  baskets.forEach((b) => {
    b.forEach((a) => { count[a] = (count[a] || 0) + 1; });
    for (let i = 0; i < b.length; i++) for (let j = 0; j < b.length; j++) if (i !== j) { const k = b[i] + '|' + b[j]; pair[k] = (pair[k] || 0) + 1; }
  });
  return { pair, count };
}

const words = (t) => new Set(String(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));
function similarity(a, b) {
  let s = 0; const why = [];
  if (a.type && a.type === b.type) { s += 3; why.push(`same type (${a.type})`); }
  const tags = a.tags.filter((t) => b.tags.includes(t));
  if (tags.length) { s += Math.min(tags.length, 3) * 1.5; why.push(`shared tags: ${tags.slice(0, 3).join(', ')}`); }
  const wa = words(a.title); const shared = [...words(b.title)].filter((w) => wa.has(w));
  if (shared.length) { s += shared.length; why.push(`similar name (${shared.slice(0, 2).join(', ')})`); }
  return { s, why };
}

function recommend(product, products, orderData, limit = 5) {
  const others = products.filter((p) => p.id !== product.id);
  if (orderData && orderData.baskets && orderData.baskets.length) {
    const { pair, count } = coPurchase(orderData.baskets);
    const bought = count[product.id] || 0;
    const ranked = others.map((p) => ({ p, together: pair[product.id + '|' + p.id] || 0 })).filter((x) => x.together > 0).sort((a, b) => b.together - a.together).slice(0, limit);
    if (ranked.length) {
      return { basis: 'orders', items: ranked.map((x) => ({ ...x.p, score: x.together, reason: `bought together in ${x.together} of ${bought} recent orders with this product` })) };
    }
  }
  const ranked = others.map((p) => ({ p, ...similarity(product, p) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit);
  return { basis: 'catalogue', items: ranked.map((x) => ({ ...x.p, score: Math.round(x.s * 10) / 10, reason: x.why.join('; ') })) };
}

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const products = await loadProducts(shop, token);
  res.json({ ok: true, ai: !!getOpenAIClient(), products });
}));

router.get('/related', withShop(async (req, res, { shop, token }) => {
  const products = await loadProducts(shop, token);
  const product = products.find((p) => p.id === req.query.productId);
  if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
  const orderData = await loadBaskets(shop, token);
  const r = recommend(product, products, orderData);
  res.json({ ok: true, product, ...r, ordersAvailable: !orderData.unavailable, ordersNote: orderData.unavailable ? 'Order history is not available to this app yet, so suggestions use catalogue similarity.' : null });
}));

router.get('/bundles', withShop(async (req, res, { shop, token }) => {
  const orderData = await loadBaskets(shop, token);
  if (orderData.unavailable) return res.json({ ok: true, bundles: [], ordersAvailable: false, note: 'Bundle ideas need order history, which this app cannot read yet.' });
  const products = await loadProducts(shop, token);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const { pair } = coPurchase(orderData.baskets);
  const bundles = Object.entries(pair).map(([k, n]) => { const [a, b] = k.split('|'); return { a, b, n }; })
    .filter((x) => x.a < x.b && byId[x.a] && byId[x.b]).sort((x, y) => y.n - x.n).slice(0, 10)
    .map((x) => ({ products: [byId[x.a], byId[x.b]], orders: x.n }));
  res.json({ ok: true, ordersAvailable: true, ordersAnalysed: orderData.baskets.length, bundles });
}));

router.post('/pitch', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const b = req.body || {};
  const products = await loadProducts(shop, token);
  const a = products.find((p) => p.id === b.productId); const c = products.find((p) => p.id === b.relatedId);
  if (!a || !c) return res.status(404).json({ ok: false, error: 'Product not found.' });
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.7, max_tokens: 250, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Write upsell/cross-sell copy for a small online shop. Return JSON {"cartLine":string,"emailLine":string,"bundleName":string}. cartLine under 90 characters, emailLine under 160. No discounts, prices or claims that are not in the input.' },
      { role: 'user', content: JSON.stringify({ bought: a.title, suggest: c.title, why: String(b.reason || '').slice(0, 200) }) },
    ],
  });
  let o; try { o = JSON.parse(out.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  const t = (v, n) => String(v == null ? '' : v).slice(0, n);
  res.json({ ok: true, pitch: { cartLine: t(o.cartLine, 120), emailLine: t(o.emailLine, 220), bundleName: t(o.bundleName, 80) } });
}));

module.exports = router;
module.exports._recommend = recommend;
