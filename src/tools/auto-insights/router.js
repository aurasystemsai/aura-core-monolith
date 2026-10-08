// Reports & Insights: a sales report built from real Shopify orders (this period vs the one before), CSV downloads,
// an emailed copy, and an AI plain-English read of the numbers. All figures are calculated here; the AI only
// explains them and is told not to invent anything. If the store has not granted order access it says so.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const mailer = require('../../core/mailer');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const DAY = 86400000;
const PERIODS = [7, 30, 90];
const PAGE = 100;
const MAX_PAGES = 5;

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
const periodOf = (v) => { const n = parseInt(v, 10); return PERIODS.includes(n) ? n : 30; };

const ORDERS_Q = 'query($after: String, $f: String) { orders(first: 100, after: $after, query: $f, sortKey: PROCESSED_AT, reverse: true) { pageInfo { hasNextPage endCursor } nodes { name createdAt: processedAt totalPriceSet { shopMoney { amount currencyCode } } lineItems(first: 50) { nodes { title quantity originalTotalSet { shopMoney { amount } } } } } } }';

// Orders from the last 2 x days, up to MAX_PAGES x 100. Returns { orders, truncated } or { unavailable }.
async function loadOrders(shop, token, days, now = Date.now()) {
  const since = new Date(now - 2 * days * DAY).toISOString().slice(0, 10);
  const orders = []; let after = null; let truncated = false;
  try {
    for (let i = 0; i < MAX_PAGES; i++) {
      const d = await gql(shop, token, ORDERS_Q, { after, f: `processed_at:>=${since}` });
      orders.push(...d.orders.nodes);
      if (!d.orders.pageInfo.hasNextPage) break;
      if (i === MAX_PAGES - 1) truncated = true;
      after = d.orders.pageInfo.endCursor;
    }
  } catch (e) {
    if (denied(e)) return { unavailable: true };
    throw e;
  }
  return { orders, truncated };
}

function summarise(orders, days, now = Date.now()) {
  const start = now - days * DAY; const prevStart = now - 2 * days * DAY;
  const cur = []; const prev = [];
  for (const o of orders) {
    const t = Date.parse(o.createdAt);
    if (t >= start) cur.push(o); else if (t >= prevStart) prev.push(o);
  }
  const total = (list) => list.reduce((s, o) => s + num(o.totalPriceSet.shopMoney.amount), 0);
  const revenue = total(cur); const prevRevenue = total(prev);
  const currency = (orders[0] && orders[0].totalPriceSet.shopMoney.currencyCode) || '';
  const products = {};
  let units = 0;
  for (const o of cur) for (const li of o.lineItems.nodes) {
    const p = products[li.title] || (products[li.title] = { title: li.title, units: 0, revenue: 0 });
    p.units += num(li.quantity); p.revenue += num(li.originalTotalSet && li.originalTotalSet.shopMoney.amount); units += num(li.quantity);
  }
  const daily = {};
  for (let i = days - 1; i >= 0; i--) daily[new Date(now - i * DAY).toISOString().slice(0, 10)] = { orders: 0, revenue: 0 };
  for (const o of cur) { const k = o.createdAt.slice(0, 10); if (daily[k]) { daily[k].orders++; daily[k].revenue += num(o.totalPriceSet.shopMoney.amount); } }
  const change = (a, b) => (b > 0 ? round(((a - b) / b) * 100, 1) : null);
  return {
    days, currency,
    orders: cur.length, revenue: round(revenue), aov: cur.length ? round(revenue / cur.length) : 0, units,
    previous: { orders: prev.length, revenue: round(prevRevenue), aov: prev.length ? round(prevRevenue / prev.length) : 0 },
    change: { orders: change(cur.length, prev.length), revenue: change(revenue, prevRevenue) },
    topProducts: Object.values(products).sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 10).map((p) => ({ ...p, revenue: round(p.revenue) })),
    daily: Object.entries(daily).map(([date, v]) => ({ date, orders: v.orders, revenue: round(v.revenue) })),
    currentOrders: cur,
  };
}
const publicSummary = ({ currentOrders, ...rest }) => rest;

// A cell starting with = + - @ is read as a formula by spreadsheets, so it gets a leading apostrophe.
function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';

router.get('/summary', withShop(async (req, res, { shop, token }) => {
  const days = periodOf(req.query.days);
  const r = await loadOrders(shop, token, days);
  if (r.unavailable) return res.json({ ok: true, unavailable: true, days, note: 'This store has not given AURA access to orders, so sales numbers cannot be shown. Add the read_orders permission and try again.', ai: !!process.env.OPENAI_API_KEY });
  const s = publicSummary(summarise(r.orders, days));
  res.json({ ok: true, ...s, truncated: r.truncated, note: r.truncated ? `Very busy store: only the newest ${MAX_PAGES * PAGE} orders were read, so totals may be low.` : '', ai: !!process.env.OPENAI_API_KEY });
}));

router.get('/export', withShop(async (req, res, { shop, token }) => {
  const days = periodOf(req.query.days);
  const type = req.query.type === 'products' ? 'products' : 'orders';
  const r = await loadOrders(shop, token, days);
  if (r.unavailable) return res.status(403).json({ ok: false, error: 'Order access has not been granted for this store.' });
  const s = summarise(r.orders, days);
  const rows = type === 'products'
    ? [['Product', 'Units sold', `Revenue (${s.currency})`], ...Object.values(s.currentOrders.reduce((m, o) => { for (const li of o.lineItems.nodes) { const p = m[li.title] || (m[li.title] = [li.title, 0, 0]); p[1] += num(li.quantity); p[2] += num(li.originalTotalSet && li.originalTotalSet.shopMoney.amount); } return m; }, {})).map((p) => [p[0], p[1], round(p[2])])]
    : [['Order', 'Date', 'Total', 'Currency', 'Items'], ...s.currentOrders.map((o) => [o.name, o.createdAt, o.totalPriceSet.shopMoney.amount, o.totalPriceSet.shopMoney.currencyCode, o.lineItems.nodes.map((li) => `${li.quantity} x ${li.title}`).join('; ')])];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-last-${days}-days.csv"`);
  res.send(toCsv(rows));
}));

function textReport(s) {
  const m = (n) => `${s.currency} ${n.toFixed(2)}`;
  const ch = (v) => (v === null ? 'no earlier period to compare' : `${v >= 0 ? '+' : ''}${v}% vs the previous ${s.days} days`);
  return [
    `Sales report: last ${s.days} days`,
    `Revenue: ${m(s.revenue)} (${ch(s.change.revenue)})`,
    `Orders: ${s.orders} (${ch(s.change.orders)})`,
    `Average order: ${m(s.aov)}`,
    `Units sold: ${s.units}`,
    '', 'Top products:', ...s.topProducts.slice(0, 5).map((p, i) => `${i + 1}. ${p.title}: ${p.units} sold, ${m(p.revenue)}`),
  ].join('\n');
}

router.post('/email', withShop(async (req, res, { shop, token }) => {
  const to = String((req.body && req.body.to) || '').trim();
  if (!mailer.isEmail(to)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  const days = periodOf(req.body && req.body.days);
  const r = await loadOrders(shop, token, days);
  if (r.unavailable) return res.status(403).json({ ok: false, error: 'Order access has not been granted for this store.' });
  const text = textReport(summarise(r.orders, days));
  const sent = await mailer.sendEmail({ to, subject: `AURA sales report: last ${days} days`, html: `<pre style="font-family:inherit">${mailer.esc(text)}</pre>` });
  res.json({ ok: true, sent: !!sent.sent, dryRun: !!sent.dryRun, message: sent.sent ? `Sent to ${to}.` : 'Email is not set up on this server, so nothing was sent.' });
}));

router.post('/insights', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const days = periodOf(req.body && req.body.days);
  const r = await loadOrders(shop, token, days);
  if (r.unavailable) return res.status(403).json({ ok: false, error: 'Order access has not been granted for this store.' });
  const s = summarise(r.orders, days);
  if (!s.orders && !s.previous.orders) return res.status(400).json({ ok: false, error: 'There are no orders in this period to look at yet.' });
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 450,
    messages: [
      { role: 'system', content: 'You explain shop sales numbers to a small shop owner. Use only the figures given. Do not guess causes you cannot see in the data. Give: a 2 sentence summary, then up to 3 short things worth acting on. Plain text, no markdown.' },
      { role: 'user', content: textReport(s) },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  res.json({ ok: true, insight: (resp.choices[0].message.content || '').trim() });
}));

// Straight-line trend through the last 90 days of daily revenue, projected 30 days ahead. It is a simple
// extrapolation, not a promise: the range shown is the spread the days actually had around that line.
const FORECAST_HISTORY = 90;
const FORECAST_AHEAD = 30;
const MIN_ORDER_DAYS = 14;

function forecast(orders, now = Date.now()) {
  const start = now - FORECAST_HISTORY * DAY;
  const byDay = new Array(FORECAST_HISTORY).fill(0).map(() => ({ revenue: 0, orders: 0 }));
  for (const o of orders) {
    const idx = Math.floor((Date.parse(o.createdAt) - start) / DAY);
    if (idx >= 0 && idx < FORECAST_HISTORY) { byDay[idx].revenue += num(o.totalPriceSet.shopMoney.amount); byDay[idx].orders++; }
  }
  const daysWithOrders = byDay.filter((d) => d.orders > 0).length;
  const currency = (orders[0] && orders[0].totalPriceSet.shopMoney.currencyCode) || '';
  if (daysWithOrders < MIN_ORDER_DAYS) return { enough: false, daysWithOrders, needed: MIN_ORDER_DAYS, currency };
  const n = byDay.length;
  const xs = byDay.map((_, i) => i); const ys = byDay.map((d) => d.revenue);
  const mx = xs.reduce((a, b) => a + b, 0) / n; const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0; let sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxx ? sxy / sxx : 0; const intercept = my - slope * mx;
  const resid = ys.map((y, i) => y - (intercept + slope * i));
  const sd = Math.sqrt(resid.reduce((a, b) => a + b * b, 0) / Math.max(1, n - 2));
  let next = 0;
  for (let i = n; i < n + FORECAST_AHEAD; i++) next += Math.max(0, intercept + slope * i);
  const spread = sd * Math.sqrt(FORECAST_AHEAD);
  const last30 = ys.slice(-30).reduce((a, b) => a + b, 0);
  const weekday = [0, 0, 0, 0, 0, 0, 0]; const wcount = [0, 0, 0, 0, 0, 0, 0];
  byDay.forEach((d, i) => { const w = new Date(start + i * DAY).getUTCDay(); weekday[w] += d.revenue; wcount[w]++; });
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const strongest = weekday.map((v, i) => ({ day: names[i], avg: round(v / Math.max(1, wcount[i])) })).sort((a, b) => b.avg - a.avg);
  return {
    enough: true, currency, daysWithOrders,
    last30: round(last30), next30: round(next), low: round(Math.max(0, next - spread)), high: round(next + spread),
    changePct: last30 > 0 ? round(((next - last30) / last30) * 100, 1) : null,
    trend: Math.abs(slope) < my * 0.002 ? 'flat' : slope > 0 ? 'up' : 'down',
    bestDay: strongest[0], quietestDay: strongest[strongest.length - 1],
  };
}

router.get('/forecast', withShop(async (req, res, { shop, token }) => {
  const r = await loadOrders(shop, token, FORECAST_HISTORY / 2);
  if (r.unavailable) return res.json({ ok: true, unavailable: true, note: 'This store has not given AURA access to orders, so a forecast is not possible.' });
  res.json({ ok: true, ...forecast(r.orders), truncated: r.truncated, ai: !!process.env.OPENAI_API_KEY });
}));

router.get('/health', (req, res) => res.json({ ok: true, service: 'auto-insights', v: '3.0.0' }));

module.exports = router;
module.exports._summarise = summarise;
module.exports._csvCell = csvCell;
module.exports._forecast = forecast;