// Customer Intelligence: real Shopify customers and orders turned into RFM segments, lifetime value, churn risk
// and journey stages. Everything is computed from order history (no trained model, no invented data).
// AI is used only to write a win-back / nurture playbook for a segment from its real numbers.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const PAGES = 4;
const DAY = 86400000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const QUERY = `query($after: String) { customers(first: 250, after: $after) {
  pageInfo { hasNextPage endCursor }
  nodes { id displayName defaultEmailAddress { emailAddress } numberOfOrders amountSpent { amount currencyCode } createdAt lastOrder { createdAt: processedAt } }
} }`;

async function loadCustomers(shop, token) {
  const out = []; let after = null; let truncated = false;
  for (let i = 0; i < PAGES; i++) {
    const data = await gql(shop, token, QUERY, { after });
    out.push(...data.customers.nodes);
    if (!data.customers.pageInfo.hasNextPage) return { customers: out, truncated };
    after = data.customers.pageInfo.endCursor;
  }
  return { customers: out, truncated: true };
}

// Percentile rank scored 1 (worst) to 5 (best).
function scoreBy(values, higherIsBetter) {
  const sorted = [...values].sort((a, b) => a - b);
  return (v) => {
    if (sorted.length < 2) return 3;
    const below = sorted.filter((x) => x < v).length;
    const ties = sorted.filter((x) => x === v).length;
    const pct = (below + (ties - 1) / 2) / (sorted.length - 1);
    const s = Math.min(5, Math.floor((higherIsBetter ? pct : 1 - pct) * 5) + 1);
    return s;
  };
}

function segmentOf(r, f, m) {
  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 4) return 'Loyal';
  if (r >= 4 && f <= 2) return 'New & Promising';
  if (r >= 3 && f >= 2) return 'Potential Loyalists';
  if (r <= 2 && f >= 4 && m >= 3) return "Can't Lose Them";
  if (r <= 2 && f >= 2) return 'At Risk';
  return 'Hibernating';
}

function stageOf(orders) {
  if (orders === 0) return 'Signed up, no purchase';
  if (orders === 1) return 'First purchase';
  if (orders <= 3) return 'Repeat buyer';
  return 'Loyal buyer';
}

function analyse(raw, now = Date.now()) {
  const rows = raw.map((c) => {
    const orders = Number(c.numberOfOrders) || 0;
    const spent = Number(c.amountSpent && c.amountSpent.amount) || 0;
    const created = Date.parse(c.createdAt);
    const last = c.lastOrder ? Date.parse(c.lastOrder.createdAt) : null;
    const daysSince = last ? Math.max(0, Math.round((now - last) / DAY)) : null;
    const avgGap = orders >= 2 && last ? Math.max(1, Math.round((last - created) / DAY / (orders - 1))) : null;
    let churn = null;
    if (orders >= 2 && daysSince != null && avgGap) churn = daysSince > avgGap * 2 ? 'high' : daysSince > avgGap * 1.2 ? 'medium' : 'low';
    else if (orders === 1 && daysSince != null) churn = daysSince > 180 ? 'high' : daysSince > 90 ? 'medium' : 'low';
    return {
      id: c.id, name: c.displayName || 'Customer', email: (c.defaultEmailAddress && c.defaultEmailAddress.emailAddress) || null,
      orders, spent: Math.round(spent * 100) / 100, aov: orders ? Math.round((spent / orders) * 100) / 100 : 0,
      daysSinceLastOrder: daysSince, avgDaysBetweenOrders: avgGap, churnRisk: churn, stage: stageOf(orders),
    };
  });
  const buyers = rows.filter((r) => r.orders > 0 && r.daysSinceLastOrder != null);
  const rScore = scoreBy(buyers.map((r) => r.daysSinceLastOrder), false);
  const fScore = scoreBy(buyers.map((r) => r.orders), true);
  const mScore = scoreBy(buyers.map((r) => r.spent), true);
  rows.forEach((r) => {
    if (r.orders > 0 && r.daysSinceLastOrder != null) { r.rfm = { r: rScore(r.daysSinceLastOrder), f: fScore(r.orders), m: mScore(r.spent) }; r.segment = segmentOf(r.rfm.r, r.rfm.f, r.rfm.m); }
    else { r.rfm = null; r.segment = 'No purchase yet'; }
  });
  return rows;
}

function summarise(rows, currency) {
  const group = (key) => {
    const g = {};
    rows.forEach((r) => { const k = r[key] || 'Unknown'; (g[k] = g[k] || { name: k, customers: 0, revenue: 0 }); g[k].customers++; g[k].revenue += r.spent; });
    return Object.values(g).map((x) => ({ ...x, revenue: Math.round(x.revenue * 100) / 100, avgSpend: Math.round((x.revenue / x.customers) * 100) / 100 })).sort((a, b) => b.revenue - a.revenue);
  };
  const buyers = rows.filter((r) => r.orders > 0);
  const total = rows.reduce((s, r) => s + r.spent, 0);
  const repeat = buyers.filter((r) => r.orders >= 2).length;
  const top = [...rows].sort((a, b) => b.spent - a.spent).slice(0, Math.max(1, Math.ceil(rows.length * 0.1)));
  const stageOrder = ['Signed up, no purchase', 'First purchase', 'Repeat buyer', 'Loyal buyer'];
  const stages = group('stage').sort((a, b) => stageOrder.indexOf(a.name) - stageOrder.indexOf(b.name));
  return {
    totals: {
      customers: rows.length, buyers: buyers.length, revenue: Math.round(total * 100) / 100, currency,
      repeatRate: buyers.length ? Math.round((repeat / buyers.length) * 1000) / 10 : null,
      avgLifetimeValue: buyers.length ? Math.round((total / buyers.length) * 100) / 100 : null,
      top10PercentShare: total ? Math.round((top.reduce((s, r) => s + r.spent, 0) / total) * 1000) / 10 : null,
      highChurnRisk: rows.filter((r) => r.churnRisk === 'high').length,
    },
    segments: group('segment'),
    stages,
  };
}

async function snapshot(shop, token) {
  const { customers, truncated } = await loadCustomers(shop, token);
  const currency = (customers.find((c) => c.amountSpent) || { amountSpent: {} }).amountSpent.currencyCode || '';
  const rows = analyse(customers);
  return { rows, truncated, currency };
}

router.get('/overview', withShop(async (req, res, { shop, token }) => {
  const { rows, truncated, currency } = await snapshot(shop, token);
  res.json({ ok: true, ai: !!getOpenAIClient(), truncated, ...summarise(rows, currency) });
}));

router.get('/customers', withShop(async (req, res, { shop, token }) => {
  const { rows } = await snapshot(shop, token);
  const seg = String(req.query.segment || ''); const risk = String(req.query.risk || '');
  let list = rows;
  if (seg) list = list.filter((r) => r.segment === seg);
  if (risk) list = list.filter((r) => r.churnRisk === risk);
  list = [...list].sort((a, b) => b.spent - a.spent);
  res.json({ ok: true, total: list.length, customers: list.slice(0, 100) });
}));

const csvCell = (v) => { const s = v == null ? '' : String(v); return /^[=+\-@\t\r]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

router.get('/export', withShop(async (req, res, { shop, token }) => {
  const { rows } = await snapshot(shop, token);
  const seg = String(req.query.segment || '');
  const list = rows.filter((r) => !seg || r.segment === seg);
  const head = ['name', 'email', 'segment', 'orders', 'spent', 'days_since_last_order', 'churn_risk'];
  const csv = [head.join(','), ...list.map((r) => [r.name, r.email, r.segment, r.orders, r.spent, r.daysSinceLastOrder, r.churnRisk].map(csvCell).join(','))].join('\n');
  res.set('Content-Type', 'text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="customers.csv"').send(csv);
}));

router.post('/playbook', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const segment = String((req.body || {}).segment || '').slice(0, 60);
  const { rows, currency } = await snapshot(shop, token);
  const s = summarise(rows, currency).segments.find((x) => x.name === segment);
  if (!s) return res.status(404).json({ ok: false, error: 'No customers in that segment.' });
  const members = rows.filter((r) => r.segment === segment);
  const facts = { segment, customers: s.customers, avgSpend: s.avgSpend, currency, avgDaysSinceLastOrder: Math.round(members.filter((m) => m.daysSinceLastOrder != null).reduce((a, m) => a + m.daysSinceLastOrder, 0) / Math.max(1, members.filter((m) => m.daysSinceLastOrder != null).length)), avgOrders: Math.round((members.reduce((a, m) => a + m.orders, 0) / members.length) * 10) / 10 };
  const c = await openai.chat.completions.create({
    model: MODEL, temperature: 0.5, max_tokens: 600, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a retention marketer for a small online shop. Given real numbers for one customer segment, return JSON {"goal":string,"steps":[{"when":string,"channel":"email"|"sms","message":string}],"avoid":[string]}. Max 4 steps. No invented discounts, prices or stats; if you suggest an offer say "consider offering" and leave the amount to the owner.' },
      { role: 'user', content: JSON.stringify(facts) },
    ],
  });
  let o; try { o = JSON.parse(c.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  const t = (v, n) => String(v == null ? '' : v).slice(0, n);
  res.json({ ok: true, segment, facts, playbook: {
    goal: t(o.goal, 300),
    steps: (Array.isArray(o.steps) ? o.steps : []).slice(0, 4).map((x) => ({ when: t(x.when, 80), channel: x.channel === 'sms' ? 'sms' : 'email', message: t(x.message, 500) })),
    avoid: (Array.isArray(o.avoid) ? o.avoid : []).slice(0, 4).map((x) => t(x, 200)),
  } });
}));

module.exports = router;
module.exports._analyse = analyse;
module.exports._summarise = summarise;
