'use strict';

// Order Tracking: real Shopify orders with fulfilment and tracking status.
// Late orders are flagged and AI drafts a customer update. Nothing is sent automatically.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const ORDER = /^gid:\/\/shopify\/Order\/\d+$/;
const DAY = 86400000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'Order Tracking needs order permissions. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const NODE = `id name processedAt cancelledAt displayFulfillmentStatus displayFinancialStatus
  customer { firstName } shippingAddress { city country }
  fulfillments(first:5){ status createdAt trackingInfo{ number company url } }
  lineItems(first:5){ nodes{ title quantity } }`;

// A paid order that is not fulfilled after this many days is "late".
function stateOf(o, lateDays, now) {
  if (o.cancelledAt) return 'cancelled';
  const s = o.displayFulfillmentStatus;
  if (s === 'FULFILLED' || s === 'DELIVERED') return 'shipped';
  if (s === 'PARTIALLY_FULFILLED' || s === 'IN_PROGRESS') return 'partial';
  const age = (now - new Date(o.processedAt).getTime()) / DAY;
  return age >= lateDays ? 'late' : 'waiting';
}

function shape(o, lateDays, now) {
  const tracking = (o.fulfillments || []).flatMap((f) => f.trackingInfo || []).filter((t) => t.number);
  return {
    id: o.id, name: o.name, processedAt: o.processedAt, state: stateOf(o, lateDays, now),
    ageDays: Math.floor((now - new Date(o.processedAt).getTime()) / DAY), payment: o.displayFinancialStatus,
    customer: (o.customer && o.customer.firstName) || '', place: o.shippingAddress ? [o.shippingAddress.city, o.shippingAddress.country].filter(Boolean).join(', ') : '',
    items: o.lineItems.nodes.map((l) => `${l.quantity} x ${l.title}`), tracking,
  };
}

async function fetchOrders(shop, token, lateDays) {
  const d = await gql(shop, token, `{ orders(first:100, sortKey:PROCESSED_AT, reverse:true){ nodes{ ${NODE} } } }`);
  const now = Date.now();
  return d.orders.nodes.map((o) => shape(o, lateDays, now));
}

const lateDaysOf = (q) => Math.min(30, Math.max(1, Math.round(Number(q) || 3)));

router.get('/orders', withShop(async (req, res, { shop, token }) => {
  const orders = await fetchOrders(shop, token, lateDaysOf(req.query.lateDays));
  const counts = { late: 0, waiting: 0, partial: 0, shipped: 0, cancelled: 0 };
  orders.forEach((o) => { counts[o.state] += 1; });
  res.json({ ok: true, counts, orders });
}));

// Drafts a short update for one order. Charged only when AI really answers.
router.post('/draft', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const id = String((req.body && req.body.id) || '');
  if (!ORDER.test(id)) return res.status(400).json({ ok: false, error: 'Choose an order.' });
  const d = await gql(shop, token, `query($id:ID!){ order(id:$id){ ${NODE} } }`, { id });
  if (!d.order) return res.status(404).json({ ok: false, error: 'That order was not found.' });
  const o = shape(d.order, lateDaysOf(req.body && req.body.lateDays), Date.now());
  if (o.state === 'cancelled') return res.status(400).json({ ok: false, error: 'That order is cancelled.' });
  let out;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.4, max_tokens: 300, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You write short, warm, honest order updates for a small online shop. Use only the facts given. Never promise a delivery date or invent tracking details. If the order is late, apologise briefly and say you are on it. If it has shipped, include the tracking number and link if given. Reply as JSON: {"subject":string,"body":string}. Plain text, under 90 words, sign off with "The team".' },
        { role: 'user', content: JSON.stringify({ orderName: o.name, status: o.state, daysSinceOrder: o.ageDays, customerFirstName: o.customer, items: o.items, tracking: o.tracking }) },
      ],
    });
    out = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not write the update: ${e.message}` });
  }
  const subject = String(out.subject || '').trim().slice(0, 120);
  const body = String(out.body || '').trim().slice(0, 1500);
  if (!subject || !body) return res.status(502).json({ ok: false, error: 'AI returned no message. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'email-gen' });
  res.json({ ok: true, id, subject, body });
}));

module.exports = router;
module.exports._stateOf = stateOf;