'use strict';

// Popups & Email Capture: merchant screen. Shoppers see the popups through the storefront script
// (see public.js). No credits except the optional AI copywriter, which charges only when AI answers.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const MAX_POPUPS = 10;
const TYPES = ['email', 'announcement'];
const TRIGGERS = ['delay', 'exit', 'scroll'];
const CODE = /^[A-Za-z0-9_-]{3,40}$/;

const popupsOf = (shop) => store.read('popups', shop, []);
const leadsOf = (shop) => store.read('popup-leads', shop, []);
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const num = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

// Only known fields survive, each cut to a safe length. Text is shown as plain text on the storefront.
function normalise(b, existing) {
  const type = TYPES.includes(b.type) ? b.type : 'email';
  const trigger = TRIGGERS.includes(b.trigger) ? b.trigger : 'delay';
  const code = clean(b.discountCode, 40);
  const p = {
    id: existing ? existing.id : crypto.randomUUID(),
    name: clean(b.name, 60),
    type, trigger,
    headline: clean(b.headline, 80),
    body: clean(b.body, 240),
    button: clean(b.button, 30) || (type === 'email' ? 'Subscribe' : 'Got it'),
    delaySeconds: num(b.delaySeconds, 0, 120, 8),
    discountCode: type === 'email' && CODE.test(code) ? code : '',
    active: b.active === true,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    signups: existing ? existing.signups || 0 : 0,
  };
  return p;
}
function problem(p) {
  if (!p.name) return 'Give the popup a name.';
  if (!p.headline) return 'Write a headline.';
  return '';
}

router.get('/status', withShop(async (req, res, { shop }) => {
  const base = (process.env.APP_URL || '').replace(/\/+$/, '');
  res.json({ ok: true, ai: !!getOpenAIClient(), scriptUrl: base ? `${base}/storefront/popup.js` : '', shop, leads: leadsOf(shop).length });
}));

router.get('/popups', withShop(async (req, res, { shop }) => res.json({ ok: true, popups: popupsOf(shop), max: MAX_POPUPS })));

router.post('/save', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  const list = popupsOf(shop);
  const existing = b.id ? list.find((p) => p.id === b.id) : null;
  if (b.id && !existing) return res.status(404).json({ ok: false, error: 'Popup not found.' });
  if (!existing && list.length >= MAX_POPUPS) return res.status(400).json({ ok: false, error: `You can have up to ${MAX_POPUPS} popups.` });
  const p = normalise(b, existing);
  const bad = problem(p);
  if (bad) return res.status(400).json({ ok: false, error: bad });
  store.write('popups', shop, existing ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list]);
  res.json({ ok: true, popup: p });
}));

router.post('/toggle', withShop(async (req, res, { shop }) => {
  const list = popupsOf(shop);
  const p = list.find((x) => x.id === (req.body || {}).id);
  if (!p) return res.status(404).json({ ok: false, error: 'Popup not found.' });
  p.active = !p.active;
  store.write('popups', shop, list);
  res.json({ ok: true, popup: p });
}));

router.delete('/popups/:id', withShop(async (req, res, { shop }) => {
  const list = popupsOf(shop);
  if (!list.some((x) => x.id === req.params.id)) return res.status(404).json({ ok: false, error: 'Popup not found.' });
  store.write('popups', shop, list.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

router.get('/leads', withShop(async (req, res, { shop }) => res.json({ ok: true, leads: leadsOf(shop) })));

router.delete('/leads/:id', withShop(async (req, res, { shop }) => {
  const list = leadsOf(shop);
  if (!list.some((x) => x.id === req.params.id)) return res.status(404).json({ ok: false, error: 'Not found.' });
  store.write('popup-leads', shop, list.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

// AI writes the words only. Nothing is invented about offers: a discount is mentioned only if the merchant gives one.
router.post('/ai-write', withShop(async (req, res, { shop }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const b = req.body || {};
  const goal = clean(b.goal, 160) || 'grow the email list';
  const offer = clean(b.offer, 80);
  // Words that promise something. Allowed only when the merchant gave an offer.
  const PROMISE = /exclusive|discount|% ?off|\bsale\b|\bfree\b|\bdeals?\b|\bsave\b|savings|special offer|limited|last chance|\bgift\b|reward/i;
  const ask = async (strict) => {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.7, max_tokens: 300, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You write short website popup copy for a small online shop. Use only what is given. Never invent a discount, offer, deadline, scarcity, stock claim or benefit.' + (offer ? ' Mention the offer using its exact wording.' : ' No offer was provided, so do not mention offers, deals, savings, news or perks. Just invite the visitor to join the list.') + (strict ? ' Your last answer promised something that was not provided. Remove it.' : '') + ' Reply as JSON {"headline":string (max 60 chars),"body":string (max 160 chars),"button":string (max 20 chars)}. Plain text only.' },
        { role: 'user', content: JSON.stringify({ goal, offer: offer || undefined, popupType: b.type === 'announcement' ? 'announcement' : 'email signup' }) },
      ],
    });
    return JSON.parse(resp.choices[0].message.content);
  };
  let out;
  try {
    out = await ask(false);
    if (!offer && PROMISE.test(`${out.headline} ${out.body} ${out.button}`)) out = await ask(true);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not write the popup: ${e.message}` });
  }
  const headline = clean(out.headline, 80); const body = clean(out.body, 240); const button = clean(out.button, 30);
  if (!headline || !body) return res.status(502).json({ ok: false, error: 'AI returned no copy. Try again, you were not charged.' });
  if (!offer && PROMISE.test(`${headline} ${body} ${button}`)) return res.status(502).json({ ok: false, error: 'AI promised something you did not offer. Try again, you were not charged.' });  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'email-gen' });
  res.json({ ok: true, headline, body, button });
}));

module.exports = router;
module.exports._normalise = normalise;