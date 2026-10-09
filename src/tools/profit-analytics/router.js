'use strict';

// Profit Analytics: real Shopify orders minus the costs the merchant has told us about.
// Rule-based and read-only (settings are stored), so it uses no AI and no credits.
// It never guesses: products with no cost price are counted separately and left out of profit.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
router.use(express.json({ limit: '20kb' }));
const TOOL = 'profit-settings';
const PAGE = 100;
const MAX_PAGES = 20;
const DAY = 86400000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Profit Analytics needs order and product permissions. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const DEFAULTS = { feePercent: 2.9, feeFixed: 0.3, shippingCostPerOrder: 0, adSpend: [] };
const num = (v, max) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0; };
const round = (n) => Math.round(n * 100) / 100;

function cleanSettings(b) {
  const ads = Array.isArray(b.adSpend) ? b.adSpend : [];
  const seen = new Set();
  const adSpend = [];
  for (const a of ads.slice(0, 60)) {
    const month = String((a && a.month) || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || seen.has(month)) continue;
    seen.add(month);
    adSpend.push({ month, amount: round(num(a.amount, 10000000)) });
  }
  adSpend.sort((x, y) => (x.month < y.month ? 1 : -1));
  return { feePercent: round(num(b.feePercent, 30)), feeFixed: round(num(b.feeFixed, 10)), shippingCostPerOrder: round(num(b.shippingCostPerOrder, 1000)), adSpend };
}

const readSettings = (shop) => ({ ...DEFAULTS, ...store.read(TOOL, shop, {}) });

router.get('/settings', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, settings: readSettings(shop) });
}));
router.post('/settings', withShop(async (req, res, { shop }) => {
  const settings = cleanSettings(req.body || {});
  store.write(TOOL, shop, settings);
  res.json({ ok: true, settings });
}));

// Monthly ad spend spread evenly over the days of that month that fall inside the window.
function adSpendFor(entries, from, to) {
  let total = 0;
  for (const e of entries) {
    const [y, m] = e.month.split('-').map(Number);
    const start = Date.UTC(y, m - 1, 1); const end = Date.UTC(y, m, 1);
    const overlap = Math.max(0, Math.min(end, to) - Math.max(start, from));
    total += e.amount * (overlap / (end - start));
  }
  return total;
}

const QUERY = `query($q:String!,$after:String){
  shop{ currencyCode }
  orders(first:${PAGE}, after:$after, query:$q){
    pageInfo{hasNextPage endCursor}
    nodes{ id totalPriceSet{shopMoney{amount}} totalTaxSet{shopMoney{amount}} totalRefundedSet{shopMoney{amount}}
      lineItems(first:50){ nodes{ quantity name discountedTotalSet{shopMoney{amount}}
        variant{ id product{ id title } inventoryItem{ unitCost{ amount } } } } } } } }`;

async function loadOrders(shop, token, sinceIso) {
  const orders = []; let after = null; let currency = ''; let more = false;
  for (let i = 0; i < MAX_PAGES; i++) {
    const d = await gql(shop, token, QUERY, { q: `processed_at:>=${sinceIso} AND status:any`, after });
    currency = d.shop.currencyCode;
    orders.push(...d.orders.nodes);
    more = d.orders.pageInfo.hasNextPage;
    if (!more) break;
    after = d.orders.pageInfo.endCursor;
  }
  return { orders, currency, more };
}

const amt = (x) => Number(x && x.shopMoney && x.shopMoney.amount) || 0;

// Pure calculation so it can be tested without Shopify.
function compute(orders, settings, from, to) {
  let revenue = 0; let refunds = 0; let tax = 0; let cogs = 0; let costedRevenue = 0; let lineRevenue = 0; let unitsNoCost = 0;
  const products = new Map();
  for (const o of orders) {
    revenue += amt(o.totalPriceSet); refunds += amt(o.totalRefundedSet); tax += amt(o.totalTaxSet);
    for (const li of (o.lineItems && o.lineItems.nodes) || []) {
      const rev = amt(li.discountedTotalSet); const qty = Number(li.quantity) || 0;
      const v = li.variant;
      const costRaw = v && v.inventoryItem && v.inventoryItem.unitCost ? Number(v.inventoryItem.unitCost.amount) : null;
      const key = (v && v.product && v.product.id) || li.name;
      const row = products.get(key) || { title: (v && v.product && v.product.title) || li.name, units: 0, revenue: 0, cost: 0, uncostedUnits: 0 };
      row.units += qty; row.revenue += rev; lineRevenue += rev;
      if (costRaw != null && Number.isFinite(costRaw) && costRaw > 0) {
        row.cost += costRaw * qty; cogs += costRaw * qty; costedRevenue += rev;
      } else { row.uncostedUnits += qty; unitsNoCost += qty; }
      products.set(key, row);
    }
  }
  const net = revenue - tax - refunds;
  const fees = (revenue * settings.feePercent) / 100 + orders.length * settings.feeFixed;
  const shipping = orders.length * settings.shippingCostPerOrder;
  const ads = adSpendFor(settings.adSpend, from, to);
  const profit = net - cogs - fees - shipping - ads;
  const rows = [...products.values()].map((r) => ({
    title: r.title, units: r.units, revenue: round(r.revenue), cost: r.uncostedUnits ? null : round(r.cost),
    profit: r.uncostedUnits ? null : round(r.revenue - r.cost),
    margin: !r.uncostedUnits && r.revenue > 0 ? round(((r.revenue - r.cost) / r.revenue) * 100) : null,
  })).sort((a, b) => b.revenue - a.revenue);
  return {
    orders: orders.length, revenue: round(revenue), tax: round(tax), refunds: round(refunds), netRevenue: round(net), productCost: round(cogs),
    fees: round(fees), shippingCost: round(shipping), adSpend: round(ads), profit: round(profit),
    margin: net > 0 ? round((profit / net) * 100) : null,
    // Profit is only complete when every sold item has a cost price, so say how much of sales is covered.
    costCoverage: lineRevenue > 0 ? Math.round((costedRevenue / lineRevenue) * 100) : 0, unitsWithoutCost: unitsNoCost, products: rows,
  };
}

router.get('/report', withShop(async (req, res, { shop, token }) => {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  const to = Date.now(); const from = to - days * DAY;
  const { orders, currency, more } = await loadOrders(shop, token, new Date(from).toISOString());
  const settings = readSettings(shop);
  res.json({ ok: true, days, currency, truncated: more, settings, ...compute(orders, settings, from, to) });
}));

router._compute = compute;
router._adSpendFor = adSpendFor;
router._cleanSettings = cleanSettings;
module.exports = router;
