'use strict';

// Affiliates: each partner gets a real Shopify discount code. Their sales and commission come from the
// real orders that used the code (Shopify only exposes recent orders to apps, so figures cover that window).
// Payouts are a record of money you paid them yourself; nothing is paid out from here.
const crypto = require('crypto');
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'affiliate-partners';
const MAX_PARTNERS = 25;
const CODE = /^[A-Z0-9_-]{3,30}$/;
const DISCOUNT = /^gid:\/\/shopify\/DiscountCodeNode\/\d+$/;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Affiliates needs order and discount permissions. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const bad = (res, error) => res.status(400).json({ ok: false, error });
const load = (shop) => store.read(TOOL, shop, []);
const money = (n) => Math.round(n * 100) / 100;
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// Sales made with one code, from real orders. Cancelled orders do not count; refunds are already taken off.
async function salesFor(shop, token, code) {
  const d = await gql(shop, token, `query($q:String!){ orders(first:250, query:$q, sortKey:PROCESSED_AT, reverse:true){ nodes{ cancelledAt currentSubtotalPriceSet{ shopMoney{ amount currencyCode } } } pageInfo{ hasNextPage } } }`, { q: `discount_code:${code}` });
  const nodes = d.orders.nodes.filter((o) => !o.cancelledAt);
  const sales = nodes.reduce((s, o) => s + (Number(o.currentSubtotalPriceSet.shopMoney.amount) || 0), 0);
  return { orders: nodes.length, sales: money(sales), currency: nodes[0] ? nodes[0].currentSubtotalPriceSet.shopMoney.currencyCode : '', more: d.orders.pageInfo.hasNextPage };
}

async function withStats(shop, token, p) {
  const s = await salesFor(shop, token, p.code);
  const earned = money(s.sales * p.commission / 100);
  const paid = money((p.payouts || []).reduce((t, x) => t + x.amount, 0));
  return { ...p, ...s, earned, paid, owed: money(Math.max(0, earned - paid)) };
}

router.get('/partners', withShop(async (req, res, { shop, token }) => {
  const list = load(shop);
  const partners = await Promise.all(list.map((p) => withStats(shop, token, p)));
  const totals = partners.reduce((t, p) => ({ orders: t.orders + p.orders, sales: money(t.sales + p.sales), earned: money(t.earned + p.earned), owed: money(t.owed + p.owed) }), { orders: 0, sales: 0, earned: 0, owed: 0 });
  res.json({ ok: true, partners, totals, currency: (partners.find((p) => p.currency) || {}).currency || '', max: MAX_PARTNERS });
}));

router.post('/partners', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const name = String(b.name || '').trim().slice(0, 80);
  if (!name) return bad(res, 'Enter the partner name.');
  const email = String(b.email || '').trim().toLowerCase();
  if (email && (email.length > 254 || !EMAIL.test(email))) return bad(res, 'That email address does not look right.');
  const code = String(b.code || '').trim().toUpperCase();
  if (!CODE.test(code)) return bad(res, 'The code must be 3 to 30 letters, numbers, dashes or underscores.');
  const discount = Number(b.discount);
  if (!(discount >= 1 && discount <= 90)) return bad(res, 'The customer discount must be between 1% and 90%.');
  const commission = Number(b.commission);
  if (!(commission >= 1 && commission <= 90)) return bad(res, 'The commission must be between 1% and 90%.');
  const list = load(shop);
  if (list.length >= MAX_PARTNERS) return bad(res, `You can have up to ${MAX_PARTNERS} partners. Remove one first.`);
  if (list.some((p) => p.code === code)) return bad(res, 'You already use that code for another partner.');
  const input = {
    title: `Affiliate: ${name}`.slice(0, 80), code, startsAt: new Date().toISOString(),
    customerSelection: { all: true }, appliesOncePerCustomer: false,
    customerGets: { value: { percentage: discount / 100 }, items: { all: true } },
    combinesWith: { productDiscounts: false, orderDiscounts: false, shippingDiscounts: true },
  };
  const m = await gql(shop, token, 'mutation($i:DiscountCodeBasicInput!){ discountCodeBasicCreate(basicCodeDiscount:$i){ codeDiscountNode{ id } userErrors{ message } } }', { i: input });
  const errs = m.discountCodeBasicCreate.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  const partner = { id: crypto.randomUUID(), name, email, code, discount, commission, discountId: m.discountCodeBasicCreate.codeDiscountNode.id, active: true, createdAt: new Date().toISOString(), payouts: [] };
  store.write(TOOL, shop, [partner, ...list]);
  res.json({ ok: true, partner: await withStats(shop, token, partner) });
}));

router.post('/partners/:id/payout', withShop(async (req, res, { shop, token }) => {
  const list = load(shop);
  const p = list.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'That partner no longer exists.' });
  const amount = money(Number((req.body || {}).amount));
  if (!(amount > 0 && amount < 1000000)) return bad(res, 'Enter the amount you paid.');
  const now = await withStats(shop, token, p);
  if (amount > now.owed + 0.005) return bad(res, `You can record up to ${now.owed.toFixed(2)}, which is what they are owed.`);
  p.payouts = [...(p.payouts || []), { id: crypto.randomUUID(), amount, note: String((req.body || {}).note || '').slice(0, 120), at: new Date().toISOString() }];
  store.write(TOOL, shop, list);
  res.json({ ok: true, partner: await withStats(shop, token, p) });
}));

// Stop switches the code off in Shopify and keeps the history; Remove also deletes the partner.
router.post('/partners/:id/stop', withShop(async (req, res, { shop, token }) => {
  const list = load(shop);
  const p = list.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'That partner no longer exists.' });
  if (!DISCOUNT.test(p.discountId)) return bad(res, 'This partner has no discount code to switch off.');
  const m = await gql(shop, token, 'mutation($id:ID!){ discountCodeDeactivate(id:$id){ userErrors{ message } } }', { id: p.discountId });
  const errs = m.discountCodeDeactivate.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs[0].message });
  p.active = false;
  store.write(TOOL, shop, list);
  res.json({ ok: true, partner: await withStats(shop, token, p) });
}));

router.delete('/partners/:id', withShop(async (req, res, { shop, token }) => {
  const list = load(shop);
  const p = list.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'That partner no longer exists.' });
  if (p.active && DISCOUNT.test(p.discountId)) {
    const m = await gql(shop, token, 'mutation($id:ID!){ discountCodeDeactivate(id:$id){ userErrors{ message } } }', { id: p.discountId });
    const errs = m.discountCodeDeactivate.userErrors || [];
    if (errs.length) return res.status(422).json({ ok: false, error: errs[0].message });
  }
  store.write(TOOL, shop, list.filter((x) => x.id !== p.id));
  res.json({ ok: true });
}));

module.exports = router;
