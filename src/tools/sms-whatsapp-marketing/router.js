// SMS Marketing: AI writes a short text from the real store, you send yourself a test, then send to customers who
// agreed to SMS marketing in Shopify. Delivery goes through your own Android phone (SMS gateway); without it set up this runs as a dry run.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities, gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const sms = require('../../core/sms');
const messaging = require('../../core/messaging');

const router = express.Router();
const TOOL = 'sms-whatsapp-marketing';
const MODEL = 'gpt-4o-mini';
const MAX_RECIPIENTS = 200;
const OPT_OUT = ' Reply STOP to opt out.';

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function subscribedPhones(shop, token) {
  const data = await gql(shop, token, '{ customers(first: 250, query: "sms_marketing_state:SUBSCRIBED") { nodes { defaultPhoneNumber { phoneNumber } } } }');
  return [...new Set(data.customers.nodes.map((c) => c.defaultPhoneNumber && c.defaultPhoneNumber.phoneNumber).filter(sms.isPhone))];
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), sending: sms.isConfigured(), testsLeftToday: messaging.remaining(shop, 'sms', 'test'), campaigns: store.read(TOOL, shop, []).length });
}));

router.get('/audience', withShop(async (req, res, { shop, token }) => {
  const list = await subscribedPhones(shop, token);
  res.json({ ok: true, subscribed: list.length, maxPerSend: MAX_RECIPIENTS });
}));

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const goal = clean((req.body || {}).goal, 300);
  if (!goal) return res.status(400).json({ ok: false, error: 'Tell the AI what the text is for.' });
  const { entities } = await loadStoreEntities(shop, token, { max: 30, types: ['products', 'collections'] });
  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.7, max_tokens: 300, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You write SMS marketing messages. Return JSON {"messages":[string,string,string]}: three different options, each under 130 characters, no emojis, no invented discounts, prices or deadlines. You may include one of the supplied URLs. Do not add an opt-out line; it is added automatically.' },
      { role: 'user', content: `Purpose: ${goal}\nProducts:\n${entities.map((e) => `${e.title} - ${e.url}`).join('\n') || 'none'}` },
    ],
  });
  let o;
  try { o = JSON.parse(completion.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  const messages = (Array.isArray(o.messages) ? o.messages : []).map((m) => clean(m, 140)).filter(Boolean).slice(0, 3);
  if (!messages.length) return res.status(502).json({ ok: false, error: 'The AI did not return any messages. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'sms-campaign' });
  res.json({ ok: true, messages });
}));

router.post('/send-test', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  if (!sms.isPhone(b.to)) return res.status(400).json({ ok: false, error: 'Use international format, e.g. +447960000000.' });
  if (!clean(b.body, 160)) return res.status(400).json({ ok: false, error: 'Write a message first.' });
  if (!messaging.reserve(shop, 'sms', 'test', 1)) return res.status(429).json({ ok: false, error: 'Daily test-text limit reached.' });
  const r = await sms.sendSms({ to: b.to, body: '[TEST] ' + clean(b.body, 160) + OPT_OUT });
  res.json({ ok: true, ...r });
}));

router.post('/send', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (b.confirm !== true) return res.status(400).json({ ok: false, error: 'Confirmation is required before sending to customers.' });
  if (!sms.isConfigured()) return res.status(503).json({ ok: false, error: 'Text sending is not set up on the server yet.' });
  const text = clean(b.body, 160);
  if (!text) return res.status(400).json({ ok: false, error: 'Write a message first.' });
  const recipients = (await subscribedPhones(shop, token)).slice(0, MAX_RECIPIENTS);
  if (!recipients.length) return res.status(400).json({ ok: false, error: 'No customers have agreed to SMS marketing yet.' });
  if (!messaging.reserve(shop, 'sms', 'campaign', recipients.length)) return res.status(429).json({ ok: false, error: 'Daily sending limit reached.' });
  let sent = 0; const failed = [];
  for (const to of recipients) {
    try { await sms.sendSms({ to, body: text + OPT_OUT }); sent++; } catch (e) { failed.push(e.message); }
  }
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), body: text, recipients: recipients.length, sent, failed: failed.length };
  store.pushCapped(TOOL, shop, entry, 100);
  res.json({ ok: true, ...entry, errors: failed.slice(0, 3) });
}));

router.get('/campaigns', withShop(async (req, res, { shop }) => res.json({ ok: true, campaigns: store.read(TOOL, shop, []) })));

module.exports = router;
