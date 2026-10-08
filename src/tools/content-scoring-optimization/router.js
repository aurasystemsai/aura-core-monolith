// Content Scoring: grades the real copy on a store's products, pages, collections and articles
// for length, readability and structure, then offers an AI rewrite that is only applied on request.
// Scores come from fixed, explainable rules over the actual text; nothing is simulated.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities } = require('../../core/seoStoreData');
const { headingsOf } = require('../../core/onPage');
const { applyProductFields } = require('../../core/shopifyApply');

const router = express.Router();
const MODEL = 'gpt-4o-mini';

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/** Flesch reading ease (0-100+, higher is easier) plus basic text stats. */
function readability(text) {
  const sentences = (String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map((s) => s.trim()).filter(Boolean);
  const words = String(text).match(/[A-Za-z][A-Za-z'-]*/g) || [];
  if (!words.length || !sentences.length) return { words: words.length, sentences: sentences.length, flesch: null, avgSentence: 0 };
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const avgSentence = words.length / sentences.length;
  const flesch = 206.835 - 1.015 * avgSentence - 84.6 * (syl / words.length);
  return { words: words.length, sentences: sentences.length, flesch: Math.round(Math.max(0, Math.min(100, flesch))), avgSentence: Math.round(avgSentence * 10) / 10 };
}

const MIN_WORDS = { product: 80, collection: 50, page: 150, article: 600 };

function scoreEntity(e) {
  const r = readability(e.text);
  const min = MIN_WORDS[e.type] || 100;
  const heads = headingsOf(e.html).filter((h) => h.level >= 2).length;
  const bullets = (e.html.match(/<li\b/gi) || []).length;
  const issues = [];
  let score = 100;

  if (r.words === 0) { score = 0; issues.push({ severity: 'high', text: 'No description or body copy at all.' }); }
  else {
    if (r.words < min) {
      const lost = Math.min(40, Math.round(((min - r.words) / min) * 40));
      score -= lost;
      issues.push({ severity: r.words < min / 2 ? 'high' : 'medium', text: `Only ${r.words} words; aim for at least ${min} for a ${e.type}.` });
    }
    if (r.flesch !== null && r.flesch < 50) {
      score -= r.flesch < 30 ? 25 : 12;
      issues.push({ severity: r.flesch < 30 ? 'high' : 'medium', text: `Hard to read (Flesch ${r.flesch}). Use shorter sentences and simpler words.` });
    }
    if (r.avgSentence > 25) { score -= 10; issues.push({ severity: 'medium', text: `Sentences average ${r.avgSentence} words; keep them under 25.` }); }
    if (r.words >= 300 && heads < 2) { score -= 10; issues.push({ severity: 'medium', text: 'Long copy with fewer than 2 subheadings; break it up with H2s.' }); }
    if (e.type === 'product' && r.words >= min && bullets === 0) { score -= 5; issues.push({ severity: 'low', text: 'No bullet list; shoppers scan for key features.' }); }
    const dup = new Set(); let repeated = 0;
    String(e.text).split(/(?<=[.!?])\s+/).forEach((s) => { const k = s.toLowerCase().trim(); if (k.length > 20) { if (dup.has(k)) repeated++; dup.add(k); } });
    if (repeated) { score -= 10; issues.push({ severity: 'medium', text: `${repeated} repeated sentence${repeated > 1 ? 's' : ''}.` }); }
  }
  return { score: Math.max(0, Math.min(100, score)), ...r, headings: heads, bullets, issues };
}

const summary = (e, s) => ({ id: e.id, type: e.type, title: e.title, url: e.url, score: s.score, words: s.words, flesch: s.flesch, issues: s.issues.length });

router.get('/overview', withShop(async (req, res, { shop, token }) => {
  const { entities, warnings } = await loadStoreEntities(shop, token, { max: 100 });
  const items = entities.map((e) => summary(e, scoreEntity(e))).sort((a, b) => a.score - b.score);
  const avg = items.length ? Math.round(items.reduce((n, i) => n + i.score, 0) / items.length) : null;
  const bands = { good: items.filter((i) => i.score >= 80).length, ok: items.filter((i) => i.score >= 50 && i.score < 80).length, poor: items.filter((i) => i.score < 50).length };
  res.json({ ok: true, average: avg, total: items.length, bands, items, warnings });
}));

router.post('/score', withShop(async (req, res, { shop, token }) => {
  const id = String(req.body && req.body.id || '');
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  const e = entities.find((x) => x.id === id);
  if (!e) return res.status(404).json({ ok: false, error: 'Item not found in your store.' });
  res.json({ ok: true, item: { id: e.id, type: e.type, title: e.title, url: e.url, text: e.text }, result: scoreEntity(e) });
}));

// Rewrites the copy for one item and re-scores the result. Nothing is saved to Shopify here.
router.post('/ai/rewrite', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const id = String(req.body && req.body.id || '');
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  const e = entities.find((x) => x.id === id);
  if (!e) return res.status(404).json({ ok: false, error: 'Item not found in your store.' });
  const before = scoreEntity(e);
  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.5, max_tokens: 1400, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `You improve ecommerce copy. Rewrite the ${e.type} description so it is clear, easy to read (short sentences), well structured and at least ${MIN_WORDS[e.type] || 100} words. Use only facts present in the original text or title; never invent materials, sizes, dimensions, claims, prices or reviews. If facts are thin, write about benefits and use without specifics. HTML only (<p>,<ul>,<li>,<h2>,<strong>), no <h1>. Return JSON {"html":string}.` },
      { role: 'user', content: `Title: ${e.title}\nCurrent copy:\n${e.text || '(empty)'}` },
    ],
  });
  let html = '';
  try { html = JSON.parse(completion.choices[0].message.content).html || ''; } catch { /* handled below */ }
  html = html.replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\/\s*\1\s*>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '');
  if (!html.trim()) return res.status(502).json({ ok: false, error: 'The AI returned nothing usable. Try again.' });
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const after = scoreEntity({ ...e, html, text });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'content-brief' });
  res.json({ ok: true, id: e.id, html, before: before.score, after: after.score, result: after });
}));

// Only product descriptions can be written back; other types are copy-and-paste.
router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const id = String(req.body && req.body.id || '');
  const html = String(req.body && req.body.html || '').slice(0, 60000);
  if (!html.trim()) return res.status(400).json({ ok: false, error: 'No copy to apply.' });
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  const e = entities.find((x) => x.id === id);
  if (!e) return res.status(404).json({ ok: false, error: 'Item not found in your store.' });
  if (e.type !== 'product') return res.status(400).json({ ok: false, error: 'Only product descriptions can be applied automatically. Copy this text into your Shopify admin.' });
  const safe = html.replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\/\s*\1\s*>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '');
  await applyProductFields(shop, id.split('/').pop(), { body_html: safe });
  res.json({ ok: true });
}));

module.exports = router;
