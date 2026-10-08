// Abandoned Checkout Winback: reads real abandoned checkouts from Shopify, AI writes a recovery email from the
// actual cart, and the merchant sends it (a test to themselves, or to the shopper if they agreed to marketing).
// The recovery link and unsubscribe note are added by the server, never by the AI.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const mailer = require('../../core/mailer');
const messaging = require('../../core/messaging');

const router = express.Router();
const TOOL = 'abandoned-checkout-winback';
const MODEL = 'gpt-4o-mini';
const RESEND_AFTER_MS = 24 * 3600 * 1000;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const safeText = (html) => String(html || '').replace(/<\s*(script|style|iframe)[\s\S]*?<\/\s*\1\s*>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '').replace(/<a\s[^>]*>([\s\S]*?)<\/a>/gi, '$1');

const QUERY = `{ abandonedCheckouts(first: 50, reverse: true) { nodes {
  id createdAt abandonedCheckoutUrl totalPriceSet { shopMoney { amount currencyCode } }
  customer { firstName email defaultEmailAddress { marketingState } }
  lineItems(first: 10) { nodes { title quantity } } } } }`;

async function loadCheckouts(shop, token) {
  const data = await gql(shop, token, QUERY);
  const log = store.read(TOOL, shop, []);
  return data.abandonedCheckouts.nodes.map((n) => {
    const email = n.customer && n.customer.email || '';
    const lastSent = log.find((l) => l.checkoutId === n.id && l.mode === 'customer');
    return {
      id: n.id, createdAt: n.createdAt, url: n.abandonedCheckoutUrl,
      total: n.totalPriceSet && n.totalPriceSet.shopMoney ? `${n.totalPriceSet.shopMoney.amount} ${n.totalPriceSet.shopMoney.currencyCode}` : '',
      firstName: n.customer && n.customer.firstName || '', email,
      canEmail: mailer.isEmail(email) && !!(n.customer.defaultEmailAddress && n.customer.defaultEmailAddress.marketingState === 'SUBSCRIBED'),
      items: n.lineItems.nodes.map((l) => ({ title: l.title, quantity: l.quantity })),
      lastSentAt: lastSent ? lastSent.at : null,
    };
  });
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), sending: mailer.isConfigured(), testsLeftToday: messaging.remaining(shop, 'email', 'test'), sent: store.read(TOOL, shop, []).filter((l) => l.mode === 'customer').length });
}));

router.get('/checkouts', withShop(async (req, res, { shop, token }) => {
  const checkouts = await loadCheckouts(shop, token);
  res.json({ ok: true, checkouts, reachable: checkouts.filter((c) => c.canEmail).length });
}));

router.post('/preview', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const b = req.body || {};
  const c = (await loadCheckouts(shop, token)).find((x) => x.id === b.checkoutId);
  if (!c) return res.status(404).json({ ok: false, error: 'Checkout not found.' });
  const tone = clean(b.tone, 40) || 'friendly';
  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.7, max_tokens: 600, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You write short cart-recovery emails. Return JSON {"subject":string,"bodyHtml":string}. bodyHtml uses only p, strong, em, br; under 90 words; mention the items left in the cart by name. Do not invent discounts, deadlines, scarcity or stock claims. Do not include links, a button or an unsubscribe line; they are added automatically.' },
      { role: 'user', content: `Tone: ${tone}\nCustomer first name: ${c.firstName || 'unknown'}\nCart: ${c.items.map((i) => `${i.quantity} x ${i.title}`).join(', ')}\nCart total: ${c.total}` },
    ],
  });
  let o;
  try { o = JSON.parse(completion.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  if (!clean(o.subject, 150) || !safeText(o.bodyHtml)) return res.status(502).json({ ok: false, error: 'The AI did not return a complete email. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'email-gen' });
  res.json({ ok: true, email: { subject: clean(o.subject, 150), bodyHtml: safeText(o.bodyHtml) } });
}));

router.post('/send', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const subject = clean(b.subject, 200);
  const body = safeText(b.bodyHtml);
  if (!subject || !body) return res.status(400).json({ ok: false, error: 'Subject and body are required.' });
  const c = (await loadCheckouts(shop, token)).find((x) => x.id === b.checkoutId);
  if (!c) return res.status(404).json({ ok: false, error: 'Checkout not found.' });
  const test = b.testTo !== undefined && b.testTo !== '';
  let to;
  if (test) {
    if (!mailer.isEmail(b.testTo)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
    if (!messaging.reserve(shop, 'email', 'test', 1)) return res.status(429).json({ ok: false, error: 'Daily test-email limit reached.' });
    to = b.testTo;
  } else {
    if (b.confirm !== true) return res.status(400).json({ ok: false, error: 'Confirmation is required before emailing a shopper.' });
    if (!mailer.isConfigured()) return res.status(503).json({ ok: false, error: 'Email sending is not set up on the server yet.' });
    if (!c.canEmail) return res.status(422).json({ ok: false, error: 'This shopper has not agreed to marketing emails, so we cannot email them.' });
    if (c.lastSentAt && Date.now() - Date.parse(c.lastSentAt) < RESEND_AFTER_MS) return res.status(429).json({ ok: false, error: 'This shopper was already emailed in the last 24 hours.' });
    if (!messaging.reserve(shop, 'email', 'campaign', 1)) return res.status(429).json({ ok: false, error: 'Daily sending limit reached.' });
    to = c.email;
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">${body}<p><a href="${mailer.esc(c.url)}" style="display:inline-block;background:#111;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">Return to your cart</a></p><hr style="border:none;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#777">You are receiving this because you started a checkout with us and agreed to marketing emails. Reply with "unsubscribe" to stop.</p></div>`;
  const r = await mailer.sendEmail({ to, subject: test ? `[TEST] ${subject}` : subject, html });
  store.pushCapped(TOOL, shop, { id: crypto.randomUUID(), at: new Date().toISOString(), checkoutId: c.id, to, mode: test ? 'test' : 'customer', delivered: r.sent, dryRun: !!r.dryRun }, 200);
  res.json({ ok: true, ...r, mode: test ? 'test' : 'customer' });
}));

router.get('/log', withShop(async (req, res, { shop }) => res.json({ ok: true, log: store.read(TOOL, shop, []).slice(0, 50) })));

module.exports = router;
