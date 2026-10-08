// Email Campaign Builder: AI writes a marketing email from your real products, you send yourself a test,
// then send to customers who have agreed to email marketing in Shopify. Delivery goes through Resend.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities, gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const mailer = require('../../core/mailer');
const messaging = require('../../core/messaging');

const router = express.Router();
const TOOL = 'email-automation-builder';
const MODEL = 'gpt-4o-mini';
const MAX_RECIPIENTS = 200;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

function safeHtml(html) {
  return String(html || '')
    .replace(/<\s*(script|style|iframe|object|embed|form)[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

async function storeName(shop, token) {
  try { return (await gql(shop, token, '{ shop { name } }')).shop.name || shop; } catch { return shop; }
}

function wrap(bodyHtml, name) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">${safeHtml(bodyHtml)}<hr style="border:none;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#777">You are receiving this because you subscribed to marketing from ${mailer.esc(name)}. Reply to this email with "unsubscribe" to stop receiving it.</p></div>`;
}

async function subscribedCustomers(shop, token) {
  const data = await gql(shop, token, '{ customers(first: 250, query: "email_marketing_state:SUBSCRIBED") { nodes { email } } }');
  return [...new Set(data.customers.nodes.map((c) => (c.email || '').toLowerCase()).filter(mailer.isEmail))];
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), sending: mailer.isConfigured(), testsLeftToday: messaging.remaining(shop, 'email', 'test'), campaigns: store.read(TOOL, shop, []).length });
}));

router.get('/audience', withShop(async (req, res, { shop, token }) => {
  const list = await subscribedCustomers(shop, token);
  res.json({ ok: true, subscribed: list.length, capped: list.length > MAX_RECIPIENTS, maxPerSend: MAX_RECIPIENTS });
}));

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const goal = clean((req.body || {}).goal, 300);
  const tone = clean((req.body || {}).tone, 40) || 'friendly';
  if (!goal) return res.status(400).json({ ok: false, error: 'Tell the AI what the email is for.' });
  const { entities } = await loadStoreEntities(shop, token, { max: 40, types: ['products', 'collections'] });
  const name = await storeName(shop, token);
  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.7, max_tokens: 1200, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You write marketing emails for a Shopify store. Return JSON {"subject":string,"preheader":string,"bodyHtml":string}. bodyHtml uses only p, h2, ul, li, strong, em, a, br. Link ONLY to the URLs supplied, with descriptive text. Do not invent discounts, prices, deadlines or stock claims. Under 180 words. Do not add an unsubscribe line; it is added automatically.' },
      { role: 'user', content: `Store: ${name}\nPurpose: ${goal}\nTone: ${tone}\nProducts and collections you may mention:\n${entities.map((e) => `${e.title} - ${e.url}`).join('\n') || 'none'}` },
    ],
  });
  let o;
  try { o = JSON.parse(completion.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  const allowed = new Set(entities.map((e) => e.url));
  // Links the AI invented are unwrapped to plain text.
  const bodyHtml = safeHtml(o.bodyHtml).replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, text) => (allowed.has(href) ? m : text));
  if (!clean(o.subject, 150) || !bodyHtml) return res.status(502).json({ ok: false, error: 'The AI did not return a complete email. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'email-gen' });
  res.json({ ok: true, email: { subject: clean(o.subject, 150), preheader: clean(o.preheader, 150), bodyHtml } });
}));

router.post('/send-test', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (!mailer.isEmail(b.to)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  if (!clean(b.subject, 200) || !clean(b.bodyHtml, 50000)) return res.status(400).json({ ok: false, error: 'Subject and body are required.' });
  if (!messaging.reserve(shop, 'email', 'test', 1)) return res.status(429).json({ ok: false, error: 'Daily test-email limit reached.' });
  const name = await storeName(shop, token);
  const r = await mailer.sendEmail({ to: b.to, subject: `[TEST] ${clean(b.subject, 190)}`, html: wrap(b.bodyHtml, name) });
  res.json({ ok: true, ...r });
}));

router.post('/send', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (b.confirm !== true) return res.status(400).json({ ok: false, error: 'Confirmation is required before sending to customers.' });
  if (!mailer.isConfigured()) return res.status(503).json({ ok: false, error: 'Email sending is not set up on the server yet.' });
  const subject = clean(b.subject, 200);
  if (!subject || !clean(b.bodyHtml, 50000)) return res.status(400).json({ ok: false, error: 'Subject and body are required.' });
  const recipients = (await subscribedCustomers(shop, token)).slice(0, MAX_RECIPIENTS);
  if (!recipients.length) return res.status(400).json({ ok: false, error: 'No customers have agreed to email marketing yet.' });
  if (!messaging.reserve(shop, 'email', 'campaign', recipients.length)) return res.status(429).json({ ok: false, error: 'Daily sending limit reached.' });
  const name = await storeName(shop, token);
  const html = wrap(b.bodyHtml, name);
  let sent = 0; const failed = [];
  for (const to of recipients) {
    try { await mailer.sendEmail({ to, subject, html }); sent++; } catch (e) { failed.push({ to, error: e.message }); }
  }
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), subject, recipients: recipients.length, sent, failed: failed.length };
  store.pushCapped(TOOL, shop, entry, 100);
  res.json({ ok: true, ...entry, errors: failed.slice(0, 5) });
}));

router.get('/campaigns', withShop(async (req, res, { shop }) => res.json({ ok: true, campaigns: store.read(TOOL, shop, []) })));

module.exports = router;
