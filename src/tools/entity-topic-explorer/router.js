// Entity & Topic Explorer: finds the topics and entities the store's own content covers, and where coverage is thin.
// Coverage counts come from the real catalogue and posts; AI only proposes related topics, clearly labelled.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities } = require('../../core/seoStoreData');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const STOP = new Set('the and for with your our you are this that from have has was will can all any new one two not but out get use into also more most very than then them they their what when where which who why how its it is last long made make just like each every only over such some in on of to a an by or as at be we'.split(' '));

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const tokens = (t) => String(t).toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));

// Terms (single words and two-word phrases) ranked by how many distinct pages use them.
function topicsFrom(entities) {
  const byTerm = new Map();
  for (const e of entities) {
    const w = tokens(`${e.title} ${e.text}`);
    const seen = new Set();
    for (let i = 0; i < w.length; i++) {
      seen.add(w[i]);
      if (i < w.length - 1) seen.add(`${w[i]} ${w[i + 1]}`);
    }
    for (const t of seen) {
      const row = byTerm.get(t) || { term: t, pages: 0, inTitles: 0, types: new Set() };
      row.pages += 1;
      row.types.add(e.type);
      if (tokens(e.title).join(' ').includes(t)) row.inTitles += 1;
      byTerm.set(t, row);
    }
  }
  return [...byTerm.values()].filter((r) => r.pages >= 2 && (r.term.includes(' ') || r.pages >= 3))
    .map((r) => ({ term: r.term, pages: r.pages, inTitles: r.inTitles, types: [...r.types] }))
    .sort((a, b) => b.pages - a.pages || b.term.length - a.term.length).slice(0, 60);
}

router.get('/status', withShop(async (req, res) => res.json({ ok: true, ai: !!getOpenAIClient() })));

router.get('/topics', withShop(async (req, res, { shop, token }) => {
  const { entities, warnings } = await loadStoreEntities(shop, token, { max: 100 });
  const counts = entities.reduce((m, e) => ({ ...m, [e.type]: (m[e.type] || 0) + 1 }), {});
  const topics = topicsFrom(entities);
  // Topics seen only on products, never in an article, are content gaps.
  const articleText = entities.filter((e) => e.type === 'article').map((e) => `${e.title} ${e.text}`.toLowerCase()).join(' ');
  const gaps = topics.filter((t) => t.types.includes('product') && !articleText.includes(t.term)).slice(0, 20);
  res.json({ ok: true, scanned: entities.length, counts, topics, gaps, warnings });
}));

// Which pages mention a topic, so the merchant can link them together.
router.get('/topic', withShop(async (req, res, { shop, token }) => {
  const term = String(req.query.term || '').toLowerCase().trim().slice(0, 60);
  if (!term) return res.status(400).json({ ok: false, error: 'term is required' });
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  const pages = entities.filter((e) => `${e.title} ${e.text}`.toLowerCase().includes(term))
    .map((e) => ({ type: e.type, title: e.title, url: e.url, inTitle: e.title.toLowerCase().includes(term) }));
  res.json({ ok: true, term, total: pages.length, pages });
}));

router.post('/ai/expand', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const { entities } = await loadStoreEntities(shop, token, { max: 60 });
  const topics = topicsFrom(entities).slice(0, 25).map((t) => t.term);
  if (!topics.length) return res.status(400).json({ ok: false, error: 'Not enough content in your store to find topics yet.' });
  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.4, max_tokens: 1000, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an SEO strategist. Given topics a store already covers, suggest related topics and entities a shopper researching these would expect the store to cover, which are not already listed. Return JSON {"suggestions":[{"topic":string,"type":"topic|entity|question","why":string,"contentIdea":string}]} with at most 12 items. No statistics.' },
      { role: 'user', content: `Covered topics: ${topics.join(', ')}` },
    ],
  });
  let o;
  try { o = JSON.parse(completion.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  const have = new Set(topics);
  const suggestions = (Array.isArray(o.suggestions) ? o.suggestions : []).map((s) => ({
    topic: String(s.topic || '').trim().slice(0, 80), type: ['topic', 'entity', 'question'].includes(s.type) ? s.type : 'topic',
    why: String(s.why || '').slice(0, 200), contentIdea: String(s.contentIdea || '').slice(0, 200), source: 'ai',
  })).filter((s) => s.topic && !have.has(s.topic.toLowerCase())).slice(0, 12);
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'seo-analysis' });
  res.json({ ok: true, basedOn: topics.length, suggestions });
}));

module.exports = router;
