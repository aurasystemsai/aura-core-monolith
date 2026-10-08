// Brand & Mentions: a per-shop log of what people say about your brand (paste in reviews, tweets, comments, press).
// It cannot crawl the web or social networks by itself, so nothing is pulled in automatically. AI then labels each
// mention (sentiment, topic), finds themes, drafts replies in your brand voice, and builds that brand voice guide
// from your real products and pages. Counts and trends are calculated from your own log, never invented.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const LOG = 'brand-mentions';
const VOICE = 'brand-voice';
const SOURCES = ['review', 'social', 'press', 'forum', 'email', 'other'];
const SENT = ['positive', 'neutral', 'negative'];

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const noAi = (res) => res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });

function toMention(b) {
  const text = clean(b.text, 3000);
  if (!text) return { error: 'The mention text is required.' };
  return { mention: { id: crypto.randomUUID(), text, source: SOURCES.includes(b.source) ? b.source : 'other', author: clean(b.author, 80), url: /^https?:\/\//i.test(b.url || '') ? clean(b.url, 500) : '', sentiment: null, topic: '', reply: '', createdAt: new Date().toISOString() } };
}

function summarise(list) {
  const counts = { positive: 0, neutral: 0, negative: 0, unlabelled: 0 };
  list.forEach((m) => { if (SENT.includes(m.sentiment)) counts[m.sentiment]++; else counts.unlabelled++; });
  const labelled = counts.positive + counts.neutral + counts.negative;
  const topics = {};
  list.forEach((m) => { if (m.topic) topics[m.topic] = (topics[m.topic] || 0) + 1; });
  return {
    total: list.length, counts,
    positiveShare: labelled ? Math.round((counts.positive / labelled) * 100) : null,
    topTopics: Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([topic, n]) => ({ topic, n })),
    needAttention: list.filter((m) => m.sentiment === 'negative' && !m.reply).length,
  };
}

router.get('/state', withShop(async (req, res, { shop }) => {
  const list = store.read(LOG, shop, []);
  res.json({ ok: true, ai: !!getOpenAIClient(), mentions: list, summary: summarise(list), voice: store.read(VOICE, shop, null) });
}));

router.post('/mentions', withShop(async (req, res, { shop }) => {
  const rows = Array.isArray((req.body || {}).mentions) ? req.body.mentions.slice(0, 100) : [req.body || {}];
  const added = []; let skipped = 0;
  rows.forEach((r) => { const x = toMention(r || {}); if (x.mention) added.push(x.mention); else skipped++; });
  if (!added.length) return res.status(400).json({ ok: false, error: 'The mention text is required.' });
  store.write(LOG, shop, [...added, ...store.read(LOG, shop, [])].slice(0, 1000));
  res.json({ ok: true, added: added.length, skipped });
}));

router.delete('/mentions/:id', withShop(async (req, res, { shop }) => {
  store.write(LOG, shop, store.read(LOG, shop, []).filter((m) => m.id !== req.params.id));
  res.json({ ok: true });
}));

// AI labels every unlabelled mention (up to 40 at a time) in a single call.
router.post('/analyse', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient(); if (!openai) return noAi(res);
  const list = store.read(LOG, shop, []);
  const todo = list.filter((m) => !m.sentiment).slice(0, 40);
  if (!todo.length) return res.status(400).json({ ok: false, error: 'Nothing to analyse. Every mention is already labelled.' });
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0, max_tokens: 1500, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Label customer mentions of a brand. Return JSON {"labels":[{"id":string,"sentiment":"positive|neutral|negative","topic":string}]}. topic is 1-3 lowercase words such as "shipping", "quality", "price", "service". Use only the ids given.' },
      { role: 'user', content: JSON.stringify(todo.map((m) => ({ id: m.id, text: m.text.slice(0, 500) }))) },
    ],
  });
  const o = parseJson(out.choices[0].message.content);
  if (!o || !Array.isArray(o.labels)) return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  let labelled = 0;
  o.labels.forEach((l) => {
    const m = todo.find((x) => x.id === l.id);
    if (m && SENT.includes(l.sentiment)) { m.sentiment = l.sentiment; m.topic = clean(l.topic, 30).toLowerCase(); labelled++; }
  });
  store.write(LOG, shop, list);
  res.json({ ok: true, labelled, remaining: list.filter((m) => !m.sentiment).length });
}));

router.post('/mentions/:id/reply', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient(); if (!openai) return noAi(res);
  const list = store.read(LOG, shop, []); const m = list.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ ok: false, error: 'Mention not found.' });
  const voice = store.read(VOICE, shop, null);
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.5, max_tokens: 300,
    messages: [
      { role: 'system', content: 'Write a short, genuine public reply from a small shop to this mention. Max 60 words. Do not offer refunds, discounts or promises, and do not invent facts. If the mention is a complaint, apologise briefly and invite them to contact the shop. ' + (voice ? 'Brand voice: ' + voice.summary : '') },
      { role: 'user', content: m.text.slice(0, 1000) },
    ],
  });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'generic-ai' });
  m.reply = clean(out.choices[0].message.content, 1000);
  store.write(LOG, shop, list);
  res.json({ ok: true, mention: m });
}));

router.post('/insights', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient(); if (!openai) return noAi(res);
  const list = store.read(LOG, shop, []);
  if (list.length < 3) return res.status(400).json({ ok: false, error: 'Add at least 3 mentions first.' });
  const s = summarise(list);
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 600, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Summarise brand perception for a shop owner. Return JSON {"themes":[string],"praise":[string],"concerns":[string],"actions":[string]} with at most 4 short items each. Base everything only on the mentions and counts given.' },
      { role: 'user', content: JSON.stringify({ counts: s.counts, topTopics: s.topTopics, mentions: list.slice(0, 40).map((m) => ({ sentiment: m.sentiment, text: m.text.slice(0, 300) })) }) },
    ],
  });
  const o = parseJson(out.choices[0].message.content);
  if (!o) return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'analytics-insight' });
  const arr = (v) => (Array.isArray(v) ? v.slice(0, 4).map((x) => clean(x, 200)) : []);
  res.json({ ok: true, insights: { themes: arr(o.themes), praise: arr(o.praise), concerns: arr(o.concerns), actions: arr(o.actions) } });
}));

// Brand voice guide, built from your real products, pages and articles.
router.post('/voice', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient(); if (!openai) return noAi(res);
  const d = await gql(shop, token, '{ products(first: 15) { nodes { title description } } pages(first: 10) { nodes { title body } } articles(first: 10) { nodes { title body } } }');
  const strip = (h, n) => clean(String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), n);
  const sample = [
    ...d.products.nodes.map((p) => ({ type: 'product', title: p.title, text: strip(p.description, 250) })),
    ...d.pages.nodes.map((p) => ({ type: 'page', title: p.title, text: strip(p.body, 250) })),
    ...d.articles.nodes.map((a) => ({ type: 'article', title: a.title, text: strip(a.body, 250) })),
  ].filter((x) => x.text);
  if (sample.length < 3) return res.status(400).json({ ok: false, error: 'Not enough store content to learn your voice from. Add product descriptions or pages first.' });
  const out = await openai.chat.completions.create({
    model: MODEL, temperature: 0.3, max_tokens: 500, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Describe the writing voice of this shop from its own copy. Return JSON {"summary":string (max 60 words),"traits":[string] (3-5 adjectives),"doList":[string] (max 4),"avoidList":[string] (max 4)}. Base it only on the samples.' },
      { role: 'user', content: JSON.stringify(sample.slice(0, 30)) },
    ],
  });
  const o = parseJson(out.choices[0].message.content);
  if (!o || !o.summary) return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'competitive-analysis' });
  const arr = (v, n) => (Array.isArray(v) ? v.slice(0, n).map((x) => clean(x, 120)) : []);
  const voice = { summary: clean(o.summary, 500), traits: arr(o.traits, 5), doList: arr(o.doList, 4), avoidList: arr(o.avoidList, 4), basedOn: sample.length, createdAt: new Date().toISOString() };
  store.write(VOICE, shop, voice);
  res.json({ ok: true, voice });
}));

module.exports = router;
module.exports._summarise = summarise;
