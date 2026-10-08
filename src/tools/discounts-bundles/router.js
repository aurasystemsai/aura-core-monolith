'use strict';

// Discounts & Bundles: real Shopify discount codes. AI proposes offers from real order data,
// the owner reviews and creates them, and every code can be switched off or deleted.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const CODE = /^[A-Z0-9_-]{3,30}$/;
const PRODUCT = /^gid:\/\/shopify\/Product\/\d+$/;
const DISCOUNT = /^gid:\/\/shopify\/DiscountCodeNode\/\d+$/;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Discounts needs new permissions. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const FIELDS = 'title status summary startsAt endsAt asyncUsageCount codes(first:1){ nodes{ code } }';
const LIST = `{ codeDiscountNodes(first:50, sortKey:CREATED_AT, reverse:true){ nodes{ id codeDiscount{ __typename
  ... on DiscountCodeBasic{ ${FIELDS} } ... on DiscountCodeBxgy{ ${FIELDS} } } } } }`;

const shape = (n) => {
  const d = n.codeDiscount || {};
  return {
    id: n.id, type: d.__typename === 'DiscountCodeBxgy' ? 'bundle' : d.__typename === 'DiscountCodeBasic' ? 'basic' : 'other',
    title: d.title || '', code: d.codes && d.codes.nodes[0] ? d.codes.nodes[0].code : '', status: d.status || '',
    summary: d.summary || '', startsAt: d.startsAt || null, endsAt: d.endsAt || null, used: d.asyncUsageCount || 0,
  };
};

router.get('/list', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, LIST);
  res.json({ ok: true, discounts: d.codeDiscountNodes.nodes.map(shape).filter((x) => x.type !== 'other') });
}));

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, '{ products(first:100, sortKey:TITLE){ nodes{ id title status } } }');
  res.json({ ok: true, products: d.products.nodes.filter((p) => p.status === 'ACTIVE').map((p) => ({ id: p.id, title: p.title })) });
}));

// Products really bought together in recent orders, plus the average order value.
async function orderInsight(shop, token) {
  const d = await gql(shop, token, '{ orders(first:100, sortKey:PROCESSED_AT, reverse:true){ nodes{ subtotalPriceSet{ shopMoney{ amount currencyCode } } lineItems(first:20){ nodes{ product{ id title } } } } } }');
  const orders = d.orders.nodes;
  const pairs = new Map();
  let sum = 0; let currency = '';
  for (const o of orders) {
    sum += Number(o.subtotalPriceSet.shopMoney.amount) || 0;
    currency = o.subtotalPriceSet.shopMoney.currencyCode;
    const items = [...new Map(o.lineItems.nodes.filter((l) => l.product).map((l) => [l.product.id, l.product])).values()];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const [a, b] = [items[i], items[j]].sort((x, y) => x.id.localeCompare(y.id));
      const k = `${a.id}|${b.id}`;
      const p = pairs.get(k) || { a, b, count: 0 };
      p.count += 1; pairs.set(k, p);
    }
  }
  return {
    orders: orders.length, currency, averageOrder: orders.length ? Math.round((sum / orders.length) * 100) / 100 : 0,
    pairs: [...pairs.values()].sort((x, y) => y.count - x.count).slice(0, 8),
  };
}

router.get('/insight', withShop(async (req, res, { shop, token }) => {
  res.json({ ok: true, ...(await orderInsight(shop, token)) });
}));

const cleanCode = (c) => String(c || '').trim().toUpperCase();

// Proposes an offer from real order data. Charged only when AI really answers.
router.post('/suggest', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const goal = String((req.body && req.body.goal) || '').trim().slice(0, 300);
  const insight = await orderInsight(shop, token);
  if (!insight.orders) return res.status(400).json({ ok: false, error: 'There are no orders yet, so there is nothing to base an offer on. You can still create a code by hand.' });
  let out;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.4, max_tokens: 700, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You design discount offers for a small online shop. Protect margin: percent between 5 and 30, prefer small offers. Use only the facts given. Reply as JSON: {"offers":[{"kind":"basic"|"bundle","title":string,"code":string (A-Z0-9 only, 4-12 chars),"percent":number,"minSubtotal":number|null,"days":number (1-60),"buyProductId":string|null,"getProductId":string|null,"reason":string}]}. Give 2 or 3 offers. A "bundle" must use a pair from bundlePairs (buy one, get the other at the percent off). A "basic" has null product ids.' },
        { role: 'user', content: JSON.stringify({ goal: goal || 'Increase average order value', averageOrder: insight.averageOrder, currency: insight.currency, orders: insight.orders, bundlePairs: insight.pairs.map((p) => ({ buyProductId: p.a.id, buyTitle: p.a.title, getProductId: p.b.id, getTitle: p.b.title, timesBoughtTogether: p.count })) }) },
      ],
    });
    out = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not suggest offers: ${e.message}` });
  }
  const valid = new Set(insight.pairs.flatMap((p) => [p.a.id, p.b.id]));
  const offers = (Array.isArray(out.offers) ? out.offers : []).map((o) => {
    const bundle = o.kind === 'bundle' && valid.has(o.buyProductId) && valid.has(o.getProductId) && o.buyProductId !== o.getProductId;
    return {
      kind: bundle ? 'bundle' : 'basic', title: String(o.title || '').slice(0, 80), code: cleanCode(o.code).replace(/[^A-Z0-9]/g, '').slice(0, 12),
      percent: Math.min(30, Math.max(5, Math.round(Number(o.percent) || 0))),
      minSubtotal: bundle || !(Number(o.minSubtotal) > 0) ? null : Math.round(Number(o.minSubtotal)),
      days: Math.min(60, Math.max(1, Math.round(Number(o.days) || 14))),
      buyProductId: bundle ? o.buyProductId : null, getProductId: bundle ? o.getProductId : null, reason: String(o.reason || '').slice(0, 300),
    };
  }).filter((o) => o.title && o.code.length >= 4);
  if (!offers.length) return res.status(502).json({ ok: false, error: 'AI returned no usable offer. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'campaign-gen' });
  res.json({ ok: true, offers, pairs: insight.pairs });
}));

router.post('/create', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const code = cleanCode(b.code);
  if (!CODE.test(code)) return res.status(400).json({ ok: false, error: 'The code must be 3 to 30 letters, numbers, dashes or underscores.' });
  const percent = Number(b.percent);
  if (!(percent >= 1 && percent <= 90)) return res.status(400).json({ ok: false, error: 'The discount must be between 1% and 90%.' });
  const days = Math.min(365, Math.max(1, Math.round(Number(b.days) || 14)));
  const input = {
    title: String(b.title || code).trim().slice(0, 80), code,
    startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + days * 86400000).toISOString(),
    customerSelection: { all: true }, appliesOncePerCustomer: b.oncePerCustomer !== false,
  };
  let m; let key;
  if (b.kind === 'bundle') {
    if (!PRODUCT.test(String(b.buyProductId)) || !PRODUCT.test(String(b.getProductId))) return res.status(400).json({ ok: false, error: 'Choose both products for the bundle.' });
    if (b.buyProductId === b.getProductId) return res.status(400).json({ ok: false, error: 'Choose two different products.' });
    Object.assign(input, {
      usesPerOrderLimit: 1,
      customerBuys: { value: { quantity: '1' }, items: { products: { productsToAdd: [b.buyProductId] } } },
      customerGets: { value: { discountOnQuantity: { quantity: '1', effect: { percentage: percent / 100 } } }, items: { products: { productsToAdd: [b.getProductId] } } },
    });
    key = 'discountCodeBxgyCreate';
    m = await gql(shop, token, 'mutation($i:DiscountCodeBxgyInput!){ discountCodeBxgyCreate(bxgyCodeDiscount:$i){ codeDiscountNode{ id } userErrors{ message } } }', { i: input });
  } else {
    Object.assign(input, {
      customerGets: { value: { percentage: percent / 100 }, items: { all: true } },
      combinesWith: { productDiscounts: false, orderDiscounts: false, shippingDiscounts: true },
    });
    const min = Number(b.minSubtotal);
    if (min > 0) input.minimumRequirement = { subtotal: { greaterThanOrEqualToSubtotal: String(min) } };
    const limit = Math.round(Number(b.usageLimit));
    if (limit > 0) input.usageLimit = limit;
    key = 'discountCodeBasicCreate';
    m = await gql(shop, token, 'mutation($i:DiscountCodeBasicInput!){ discountCodeBasicCreate(basicCodeDiscount:$i){ codeDiscountNode{ id } userErrors{ message } } }', { i: input });
  }
  const errs = m[key].userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  res.json({ ok: true, id: m[key].codeDiscountNode.id, code });
}));

const ACTIONS = {
  activate: ['discountCodeActivate', 'mutation($id:ID!){ discountCodeActivate(id:$id){ userErrors{ message } } }'],
  deactivate: ['discountCodeDeactivate', 'mutation($id:ID!){ discountCodeDeactivate(id:$id){ userErrors{ message } } }'],
  delete: ['discountCodeDelete', 'mutation($id:ID!){ discountCodeDelete(id:$id){ userErrors{ message } } }'],
};

for (const action of Object.keys(ACTIONS)) {
  router.post('/' + action, withShop(async (req, res, { shop, token }) => {
    const id = String((req.body && req.body.id) || '');
    if (!DISCOUNT.test(id)) return res.status(400).json({ ok: false, error: 'Choose a discount.' });
    const [key, query] = ACTIONS[action];
    const m = await gql(shop, token, query, { id });
    const errs = m[key].userErrors || [];
    if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
    res.json({ ok: true });
  }));
}
module.exports = router;
