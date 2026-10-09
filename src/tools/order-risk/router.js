'use strict';

// Order Risk: flags recent orders worth a second look before they ship, from Shopify's own fraud
// analysis plus a few plain rules on real order data. It only flags. It never cancels, holds or
// refunds anything, and it is read-only, so it uses no AI and no credits.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const PAGE = 100;
const MAX_PAGES = 5;
const DAY = 86400000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Order Risk needs order permissions. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const QUERY = `query($q:String!,$after:String){
  shop{ currencyCode }
  orders(first:${PAGE}, after:$after, query:$q, sortKey:PROCESSED_AT, reverse:true){
    pageInfo{hasNextPage endCursor}
    nodes{ id name email phone processedAt displayFinancialStatus displayFulfillmentStatus
      totalPriceSet{shopMoney{amount}} totalDiscountsSet{shopMoney{amount}} subtotalPriceSet{shopMoney{amount}}
      billingAddress{ countryCodeV2 } shippingAddress{ countryCodeV2 }
      risk{ recommendation assessments{ riskLevel facts{ description sentiment } } }
      customer{ numberOfOrders } } } }`;

const amt = (x) => Number(x && x.shopMoney && x.shopMoney.amount) || 0;

// Each signal has a plain reason and a weight. Weights only decide the order; the reasons are what matter.
function assess(o, ctx) {
  const signals = [];
  const add = (weight, reason) => signals.push({ weight, reason });
  const rec = o.risk && o.risk.recommendation;
  const levels = ((o.risk && o.risk.assessments) || []).map((a) => a.riskLevel);
  if (rec === 'CANCEL' || levels.includes('HIGH')) add(60, 'Shopify rates this order high risk.');
  else if (rec === 'INVESTIGATE' || levels.includes('MEDIUM')) add(35, 'Shopify suggests looking into this order.');
  const bad = ((o.risk && o.risk.assessments) || []).flatMap((a) => a.facts || []).filter((f) => f.sentiment === 'NEGATIVE');
  for (const f of bad.slice(0, 2)) add(10, f.description);
  const total = amt(o.totalPriceSet);
  const orders = Number(o.customer && o.customer.numberOfOrders) || 0;
  if (orders <= 1 && ctx.avg > 0 && total >= ctx.avg * 3) add(25, `First order from this customer and ${(total / ctx.avg).toFixed(1)}x your average order.`);
  const b = o.billingAddress && o.billingAddress.countryCodeV2; const s = o.shippingAddress && o.shippingAddress.countryCodeV2;
  if (b && s && b !== s) add(20, `Billing country (${b}) differs from shipping country (${s}).`);
  const sub = amt(o.subtotalPriceSet) + amt(o.totalDiscountsSet);
  if (sub > 0 && amt(o.totalDiscountsSet) / sub >= 0.5) add(15, 'Discounted by half or more.');
  const email = String(o.email || '').toLowerCase();
  if (email && (ctx.byEmail.get(email) || 0) >= 3) add(20, 'Three or more orders from this email in 24 hours.');
  if (!email && !o.phone) add(10, 'No email or phone number.');
  const score = Math.min(100, signals.reduce((n, x) => n + x.weight, 0));
  return { id: o.id, name: o.name, email: o.email || '', processedAt: o.processedAt, total, payment: o.displayFinancialStatus, fulfilment: o.displayFulfillmentStatus, score, level: score >= 50 ? 'high' : score >= 20 ? 'review' : 'ok', reasons: signals.map((x) => x.reason) };
}

function analyse(orders) {
  const total = orders.reduce((n, o) => n + amt(o.totalPriceSet), 0);
  const ctx = { avg: orders.length ? total / orders.length : 0, byEmail: new Map() };
  const sorted = orders.filter((o) => o.email).map((o) => ({ e: o.email.toLowerCase(), t: Date.parse(o.processedAt) })).sort((a, b) => a.t - b.t);
  for (const x of sorted) {
    const near = sorted.filter((y) => y.e === x.e && Math.abs(y.t - x.t) <= DAY).length;
    ctx.byEmail.set(x.e, Math.max(ctx.byEmail.get(x.e) || 0, near));
  }
  return orders.map((o) => assess(o, ctx)).sort((a, b) => b.score - a.score || (a.processedAt < b.processedAt ? 1 : -1));
}

router.get('/orders', withShop(async (req, res, { shop, token }) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
  const since = new Date(Date.now() - days * DAY).toISOString();
  const orders = []; let after = null; let currency = ''; let more = false;
  for (let i = 0; i < MAX_PAGES; i++) {
    const d = await gql(shop, token, QUERY, { q: `processed_at:>=${since} AND status:any`, after });
    currency = d.shop.currencyCode;
    orders.push(...d.orders.nodes);
    more = d.orders.pageInfo.hasNextPage;
    if (!more) break;
    after = d.orders.pageInfo.endCursor;
  }
  const rows = analyse(orders);
  res.json({
    ok: true, days, currency, truncated: more, total: rows.length,
    high: rows.filter((r) => r.level === 'high').length, review: rows.filter((r) => r.level === 'review').length,
    orders: rows.filter((r) => r.level !== 'ok').slice(0, 100),
  });
}));

router._assess = assess;
router._analyse = analyse;
module.exports = router;
