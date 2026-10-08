// Returns: your own log of return requests. You enter the order number, the app looks the real order up in Shopify
// (customer, items, total) and you move the request through requested, approved, received, refunded or rejected.
// It does not refund money in Shopify; that stays a deliberate step in your Shopify admin. AI only drafts a reply
// to the customer, grounded in the order and your store's returns policy page.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TOOL = 'returns-rma-automation';
const STATUSES = ['requested', 'approved', 'received', 'refunded', 'rejected'];
const REASONS = ['wrong size', 'faulty', 'not as described', 'changed mind', 'arrived late', 'other'];
// Moves you can make from each status.
const NEXT = { requested: ['approved', 'rejected'], approved: ['received', 'rejected'], received: ['refunded'], refunded: [], rejected: [] };

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const read = (shop) => store.read(TOOL, shop, []);

async function findOrder(shop, token, name) {
  const n = String(name || '').replace(/[^0-9A-Za-z#-]/g, '');
  if (!n) return null;
  const d = await gql(shop, token, `query($q: String!) { orders(first: 1, query: $q) { nodes { id name email processedAt totalPriceSet { shopMoney { amount currencyCode } } customer { displayName } lineItems(first: 20) { nodes { title quantity } } } } }`,
    { q: 'name:' + (n.startsWith('#') ? n : '#' + n) });
  const o = d.orders.nodes[0];
  if (!o) return null;
  return { id: o.id, name: o.name, email: o.email || '', customer: o.customer ? o.customer.displayName : '', total: Number(o.totalPriceSet.shopMoney.amount), currency: o.totalPriceSet.shopMoney.currencyCode, placed: o.processedAt, items: o.lineItems.nodes.map((l) => ({ title: l.title, quantity: l.quantity })) };
}

function stats(list) {
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const byReason = {};
  list.forEach((r) => { byStatus[r.status]++; byReason[r.reason] = (byReason[r.reason] || 0) + 1; });
  const open = list.filter((r) => r.status === 'requested' || r.status === 'approved' || r.status === 'received').length;
  return { total: list.length, open, byStatus, byReason };
}

router.get('/overview', withShop(async (req, res, { shop }) => {
  const list = read(shop);
  res.json({ ok: true, returns: list, stats: stats(list), reasons: REASONS, next: NEXT, ai: !!getOpenAIClient() });
}));

router.post('/returns', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const reason = REASONS.includes(b.reason) ? b.reason : null;
  if (!reason) return res.status(400).json({ ok: false, error: 'Choose a return reason.' });
  const order = await findOrder(shop, token, b.order);
  if (!order) return res.status(404).json({ ok: false, error: 'No order with that number was found in your store.' });
  const items = clean(b.items, 300) || order.items.map((i) => `${i.quantity} x ${i.title}`).join(', ');
  const r = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'requested', reason, note: clean(b.note, 500), items, order, history: [{ at: new Date().toISOString(), status: 'requested' }] };
  store.write(TOOL, shop, [r, ...read(shop)].slice(0, 500));
  res.json({ ok: true, return: r });
}));

router.put('/returns/:id', withShop(async (req, res, { shop }) => {
  const list = read(shop); const r = list.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ ok: false, error: 'Return not found.' });
  const to = req.body && req.body.status;
  if (!(NEXT[r.status] || []).includes(to)) return res.status(400).json({ ok: false, error: `A return that is ${r.status} cannot be moved to ${to}.` });
  r.status = to; r.history.push({ at: new Date().toISOString(), status: to });
  store.write(TOOL, shop, list);
  res.json({ ok: true, return: r });
}));

router.delete('/returns/:id', withShop(async (req, res, { shop }) => {
  const list = read(shop);
  if (!list.some((x) => x.id === req.params.id)) return res.status(404).json({ ok: false, error: 'Return not found.' });
  store.write(TOOL, shop, list.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

async function policyText(shop, token) {
  try {
    const d = await gql(shop, token, '{ pages(first: 5, query: "title:*return* OR title:*refund*") { nodes { title body } } }');
    return d.pages.nodes.map((p) => `${p.title}: ${String(p.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500)}`).join('\n');
  } catch (e) { return ''; }
}

router.post('/reply/:id', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const r = read(shop).find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ ok: false, error: 'Return not found.' });
  const policy = await policyText(shop, token);
  const facts = `Order ${r.order.name}, customer ${r.order.customer || 'unknown'}, items: ${r.items}. Reason: ${r.reason}. Status: ${r.status}. ${r.note ? 'Note: ' + r.note + '.' : ''}`;
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 300,
    messages: [{ role: 'system', content: 'You write a short, kind email reply to a customer about their return request. Use only the facts and returns policy given. Do not promise anything the policy does not say; if the policy is missing, do not state deadlines or fees. Plain text, under 120 words, no subject line.' }, { role: 'user', content: `Facts: ${facts}\nReturns policy:\n${policy || '(no policy page found)'}` }],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  res.json({ ok: true, reply: (resp.choices[0].message.content || '').trim(), usedPolicy: !!policy });
}));

module.exports = router;
module.exports._stats = stats;