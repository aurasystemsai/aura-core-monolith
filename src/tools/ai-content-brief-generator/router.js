// AI Content Brief Generator: builds a writing brief grounded in the shop's real catalogue, its existing
// blog posts (to avoid overlap and suggest internal links) and its own Search Console queries when connected.
// Briefs are stored per shop. No search volume or competitor numbers are invented.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const sc = require('../../core/searchConsole');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const TOOL = 'ai-content-brief-generator';
const MODEL = 'gpt-4o-mini';
const MAX = 50;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const arr = (v, n, len) => (Array.isArray(v) ? v : []).map((x) => clean(x, len)).filter(Boolean).slice(0, n);

async function relatedSearchQueries(shop, token, keyword) {
  if (!sc.getConnection(shop)) return [];
  try {
    const access = await sc.accessToken(shop);
    let host = shop;
    try { host = (await gql(shop, token, '{ shop { primaryDomain { host } } }')).shop.primaryDomain.host || shop; } catch { /* use shop */ }
    const site = await sc.findSite(access, [...new Set([host, shop])]);
    if (!site) return [];
    const words = keyword.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    return (await sc.queryPositions(access, site, 90, 500))
      .filter((q) => words.some((w) => q.query.toLowerCase().includes(w)))
      .sort((a, b) => b.impressions - a.impressions).slice(0, 15)
      .map((q) => ({ query: q.query, impressions: q.impressions, position: q.position }));
  } catch { return []; }
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), gsc: !!sc.getConnection(shop), briefs: store.read(TOOL, shop, []).length });
}));

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const b = req.body || {};
  const keyword = clean(b.keyword, 100);
  if (!keyword) return res.status(400).json({ ok: false, error: 'A target keyword or topic is required.' });
  const audience = clean(b.audience, 120);
  const goal = clean(b.goal, 160);

  const { entities } = await loadStoreEntities(shop, token, { max: 60, types: ['products', 'collections', 'articles'] });
  const products = entities.filter((e) => e.type !== 'article').slice(0, 30);
  const posts = entities.filter((e) => e.type === 'article').slice(0, 20);
  const queries = await relatedSearchQueries(shop, token, keyword);

  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.4, max_tokens: 1800, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an SEO content strategist for a Shopify store. Produce a writing brief a freelancer can follow. Link suggestions must use ONLY the URLs supplied. Do not state search volumes, competitor rankings or statistics. Return JSON {"title":string,"searchIntent":"informational|commercial|transactional","summary":string,"targetWordCount":number,"outline":[{"heading":string,"points":[string]}],"questionsToAnswer":[string],"relatedTerms":[string],"internalLinks":[{"anchor":string,"url":string}],"cta":string,"avoid":[string]}' },
      { role: 'user', content: `Keyword: ${keyword}\nAudience: ${audience || 'store shoppers'}\nGoal: ${goal || 'drive organic traffic and sales'}\nProducts/collections:\n${products.map((e) => `${e.title} - ${e.url}`).join('\n') || 'none'}\nExisting blog posts (do not duplicate; may link):\n${posts.map((e) => `${e.title} - ${e.url}`).join('\n') || 'none'}\nReal search queries for this store related to the keyword:\n${queries.map((q) => q.query).join('\n') || 'none (Search Console not connected or no matches)'}` },
    ],
  });
  let o;
  try { o = JSON.parse(completion.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }

  const allowed = new Set([...products, ...posts].map((e) => e.url));
  const brief = {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), keyword, audience, goal,
    title: clean(o.title, 140) || keyword,
    searchIntent: ['informational', 'commercial', 'transactional'].includes(o.searchIntent) ? o.searchIntent : 'informational',
    summary: clean(o.summary, 500),
    targetWordCount: Math.max(300, Math.min(3000, parseInt(o.targetWordCount, 10) || 900)),
    outline: (Array.isArray(o.outline) ? o.outline : []).slice(0, 12).map((s) => ({ heading: clean(s.heading, 120), points: arr(s.points, 6, 200) })).filter((s) => s.heading),
    questionsToAnswer: arr(o.questionsToAnswer, 8, 160),
    relatedTerms: arr(o.relatedTerms, 15, 60),
    internalLinks: (Array.isArray(o.internalLinks) ? o.internalLinks : []).filter((l) => allowed.has(l.url)).slice(0, 8).map((l) => ({ anchor: clean(l.anchor, 80), url: l.url })),
    cta: clean(o.cta, 200), avoid: arr(o.avoid, 6, 160),
    realQueries: queries,
  };
  if (!brief.outline.length) return res.status(502).json({ ok: false, error: 'The AI did not return an outline. Try again.' });
  store.pushCapped(TOOL, shop, brief, MAX);
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'content-brief' });
  res.json({ ok: true, brief });
}));

router.get('/briefs', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, briefs: store.read(TOOL, shop, []).map((x) => ({ id: x.id, keyword: x.keyword, title: x.title, createdAt: x.createdAt })) });
}));

router.get('/briefs/:id', withShop(async (req, res, { shop }) => {
  const brief = store.read(TOOL, shop, []).find((x) => x.id === req.params.id);
  if (!brief) return res.status(404).json({ ok: false, error: 'Brief not found' });
  res.json({ ok: true, brief });
}));

router.delete('/briefs/:id', withShop(async (req, res, { shop }) => {
  const list = store.read(TOOL, shop, []);
  const next = list.filter((x) => x.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ ok: false, error: 'Brief not found' });
  store.write(TOOL, shop, next);
  res.json({ ok: true });
}));

module.exports = router;
