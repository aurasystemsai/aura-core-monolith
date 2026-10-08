// Reviews & UGC: a per-shop review inbox. You add or paste in real reviews, then AI drafts replies, finds themes
// and writes review-request emails from your real products. No review data is generated or invented.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const mailer = require('../../core/mailer');
const messaging = require('../../core/messaging');

const router = express.Router();
const TOOL = 'review-ugc-engine';
const MODEL = 'gpt-4o-mini';
const MAX_REVIEWS = 500;
const STATUSES = ['pending', 'approved', 'rejected'];

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const load = (shop) => store.read(TOOL, shop, []);
const save = (shop, list) => store.write(TOOL, shop, list.slice(0, MAX_REVIEWS));

function toReview(b) {
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) return { error: 'Rating must be 1 to 5.' };
  const text = clean(b.text, 3000);
  if (!text) return { error: 'Review text is required.' };
  return { review: { id: crypto.randomUUID(), productTitle: clean(b.productTitle, 200), author: clean(b.author, 80) || 'Customer', rating, text, status: 'pending', reply: '', createdAt: new Date().toISOString() } };
}

async function ai(res, fn) {
  const openai = getOpenAIClient();
  if (!openai) { res.status(503).json({ ok: false, error: 'AI is not configured on the server.' }); return null; }
  return fn(openai);
}
function parseJson(s) { try { return JSON.parse(s); } catch { return null; } }

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), sending: mailer.isConfigured(), testsLeftToday: messaging.remaining(shop, 'email', 'test') });
}));

router.get('/reviews', withShop(async (req, res, { shop }) => {
  const reviews = load(shop);
  const n = reviews.length;
  const avg = n ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10 : null;
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => { counts[r.rating]++; });
  res.json({ ok: true, reviews, summary: { total: n, average: avg, counts, pending: reviews.filter((r) => r.status === 'pending').length, unanswered: reviews.filter((r) => r.status === 'approved' && !r.reply).length } });
}));

router.post('/reviews', withShop(async (req, res, { shop }) => {
  const { review, error } = toReview(req.body || {});
  if (error) return res.status(400).json({ ok: false, error });
  save(shop, [review, ...load(shop)]);
  res.json({ ok: true, review });
}));

router.post('/reviews/import', withShop(async (req, res, { shop }) => {
  const rows = Array.isArray((req.body || {}).reviews) ? req.body.reviews.slice(0, 100) : [];
  const added = []; let skipped = 0;
  rows.forEach((r) => { const x = toReview(r || {}); if (x.review) added.push(x.review); else skipped++; });
  if (!added.length) return res.status(400).json({ ok: false, error: 'No valid reviews found. Each needs a rating (1-5) and text.' });
  save(shop, [...added, ...load(shop)]);
  res.json({ ok: true, added: added.length, skipped });
}));

router.post('/reviews/:id/status', withShop(async (req, res, { shop }) => {
  const status = (req.body || {}).status;
  if (!STATUSES.includes(status)) return res.status(400).json({ ok: false, error: 'Status must be pending, approved or rejected.' });
  const list = load(shop); const r = list.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ ok: false, error: 'Review not found.' });
  r.status = status; save(shop, list);
  res.json({ ok: true, review: r });
}));

router.post('/reviews/:id/reply', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  const list = load(shop); const r = list.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ ok: false, error: 'Review not found.' });
  if (typeof b.reply === 'string') { r.reply = clean(b.reply, 1500); save(shop, list); return res.json({ ok: true, review: r }); }
  const draft = await ai(res, async (openai) => {
    const c = await openai.chat.completions.create({
      model: MODEL, temperature: 0.6, max_tokens: 220,
      messages: [
        { role: 'system', content: 'You reply to customer reviews for a small online shop. Warm, specific, under 70 words, no emojis. For low ratings apologise sincerely and invite them to contact support; never promise refunds, discounts or timelines. Reply with the text only.' },
        { role: 'user', content: `Product: ${r.productTitle || 'n/a'}\nRating: ${r.rating}/5\nReview: ${r.text}` },
      ],
    });
    return String(c.choices[0].message.content || '').trim();
  });
  if (draft === null) return;
  if (!draft) return res.status(502).json({ ok: false, error: 'The AI returned nothing. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  res.json({ ok: true, draft });
}));

router.delete('/reviews/:id', withShop(async (req, res, { shop }) => {
  save(shop, load(shop).filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

router.post('/insights', withShop(async (req, res, { shop }) => {
  const reviews = load(shop).slice(0, 60);
  if (reviews.length < 3) return res.status(400).json({ ok: false, error: 'Add at least 3 reviews first.' });
  const out = await ai(res, async (openai) => {
    const c = await openai.chat.completions.create({
      model: MODEL, temperature: 0.2, max_tokens: 600, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Analyse the shop reviews. Return JSON {"summary":string,"praise":[string],"complaints":[string],"actions":[string]} using only what the reviews say. Max 4 items per list, each under 20 words.' },
        { role: 'user', content: reviews.map((r) => `${r.rating}/5 ${r.productTitle ? '[' + r.productTitle + '] ' : ''}${r.text}`).join('\n') },
      ],
    });
    return parseJson(c.choices[0].message.content);
  });
  if (out === null && !res.headersSent) return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  if (!out) return;
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  const list = (v) => (Array.isArray(v) ? v.map((x) => clean(x, 200)).filter(Boolean).slice(0, 4) : []);
  res.json({ ok: true, insights: { summary: clean(out.summary, 500), praise: list(out.praise), complaints: list(out.complaints), actions: list(out.actions), basedOn: reviews.length } });
}));

router.post('/request/preview', withShop(async (req, res, { shop, token }) => {
  const { entities } = await loadStoreEntities(shop, token, { max: 30, types: ['products'] });
  const product = entities.find((e) => e.id === (req.body || {}).productId) || entities[0];
  if (!product) return res.status(400).json({ ok: false, error: 'No products found in your store.' });
  const out = await ai(res, async (openai) => {
    const c = await openai.chat.completions.create({
      model: MODEL, temperature: 0.7, max_tokens: 350, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Write a short, friendly email asking a customer to review a product they bought. Return JSON {"subject":string,"bodyHtml":string} using simple <p> tags. No discounts, no incentives, no links (a button is added automatically).' },
        { role: 'user', content: `Product: ${product.title}` },
      ],
    });
    return parseJson(c.choices[0].message.content);
  });
  if (out === null && !res.headersSent) return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  if (!out) return;
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'email-gen' });
  res.json({ ok: true, product: { id: product.id, title: product.title, url: product.url }, subject: clean(out.subject, 150), bodyHtml: clean(out.bodyHtml, 3000).replace(/<(?!\/?p\b)[^>]*>/gi, '') });
}));

router.post('/request/send-test', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  if (!mailer.isEmail(b.to)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' });
  if (!clean(b.subject, 150) || !clean(b.bodyHtml, 3000)) return res.status(400).json({ ok: false, error: 'Subject and body are required.' });
  if (!messaging.reserve(shop, 'email', 'test', 1)) return res.status(429).json({ ok: false, error: 'Daily test-email limit reached.' });
  const url = /^https:\/\//.test(String(b.url || '')) ? String(b.url) : '';
  const button = url ? `<p><a href="${mailer.esc(url)}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Leave a review</a></p>` : '';
  const r = await mailer.sendEmail({ to: b.to, subject: `[TEST] ${clean(b.subject, 140)}`, html: clean(b.bodyHtml, 3000).replace(/<(?!\/?p\b)[^>]*>/gi, '') + button });
  res.json({ ok: true, ...r });
}));

module.exports = router;
