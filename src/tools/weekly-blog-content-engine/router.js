// Weekly Blog Content Engine: AI plans a week of posts grounded in the real catalogue, existing posts and
// (when connected) Search Console queries. Plans are stored per shop; items are tracked as planned/written/skipped.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'weekly-blog-content-engine';
const MODEL = 'gpt-4o-mini';
const STATUSES = ['planned', 'written', 'skipped'];

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const isoDay = (d) => d.toISOString().slice(0, 10);

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), items: store.read(TOOL, shop, []).length });
}));

router.get('/items', withShop(async (req, res, { shop }) => {
  const items = store.read(TOOL, shop, []).sort((a, b) => a.date.localeCompare(b.date));
  res.json({ ok: true, items });
}));

router.post('/plan', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const perWeek = Math.max(1, Math.min(7, parseInt((req.body || {}).postsPerWeek, 10) || 3));
  const focus = clean((req.body || {}).focus, 160);
  const startRaw = clean((req.body || {}).startDate, 10);
  const start = /^\d{4}-\d{2}-\d{2}$/.test(startRaw) ? new Date(startRaw + 'T00:00:00Z') : new Date();
  const { entities } = await loadStoreEntities(shop, token, { max: 60, types: ['products', 'collections', 'articles'] });
  const sellable = entities.filter((e) => e.type !== 'article').slice(0, 30);
  const posts = entities.filter((e) => e.type === 'article').slice(0, 30);
  if (!sellable.length) return res.status(400).json({ ok: false, error: 'Add some products first so the plan has something to be about.' });

  const completion = await openai.chat.completions.create({
    model: MODEL, temperature: 0.7, max_tokens: 1500, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `You plan a week of blog posts for a Shopify store. Return JSON {"items":[{"title":string,"keyword":string,"angle":string,"linkedProduct":string}]} with exactly ${perWeek} items. Each must be about the store's real products or customers' needs, and must not repeat an existing post. linkedProduct must be one of the supplied product titles. No statistics.` },
      { role: 'user', content: `Focus: ${focus || 'none'}\nProducts/collections: ${sellable.map((e) => e.title).join('; ')}\nExisting posts: ${posts.map((e) => e.title).join('; ') || 'none'}` },
    ],
  });
  let o;
  try { o = JSON.parse(completion.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' }); }
  const raw = (Array.isArray(o.items) ? o.items : []).slice(0, perWeek).filter((i) => clean(i.title, 140));
  if (!raw.length) return res.status(502).json({ ok: false, error: 'The AI did not return any posts. Try again.' });

  // Spread posts evenly across the 7 days starting at `start`.
  const step = 7 / raw.length;
  const byTitle = new Map(sellable.map((e) => [e.title.toLowerCase(), e]));
  const created = raw.map((i, n) => {
    const day = new Date(start.getTime() + Math.floor(n * step) * 86400000);
    const link = byTitle.get(clean(i.linkedProduct, 140).toLowerCase());
    return {
      id: crypto.randomUUID(), date: isoDay(day), title: clean(i.title, 140), keyword: clean(i.keyword, 80),
      angle: clean(i.angle, 300), linkedProduct: link ? { title: link.title, url: link.url } : null,
      status: 'planned', createdAt: new Date().toISOString(),
    };
  });
  store.write(TOOL, shop, [...store.read(TOOL, shop, []), ...created].slice(-200));
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'blog-outline' });
  res.json({ ok: true, items: created });
}));

router.post('/items', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  const title = clean(b.title, 140);
  if (!title) return res.status(400).json({ ok: false, error: 'A title is required.' });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(clean(b.date, 10)) ? clean(b.date, 10) : isoDay(new Date());
  const item = { id: crypto.randomUUID(), date, title, keyword: clean(b.keyword, 80), angle: clean(b.angle, 300), linkedProduct: null, status: 'planned', createdAt: new Date().toISOString() };
  store.write(TOOL, shop, [...store.read(TOOL, shop, []), item].slice(-200));
  res.json({ ok: true, item });
}));

router.patch('/items/:id', withShop(async (req, res, { shop }) => {
  const list = store.read(TOOL, shop, []);
  const item = list.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Item not found' });
  const b = req.body || {};
  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) return res.status(400).json({ ok: false, error: 'Invalid status' });
    item.status = b.status;
  }
  if (b.title !== undefined && clean(b.title, 140)) item.title = clean(b.title, 140);
  if (b.keyword !== undefined) item.keyword = clean(b.keyword, 80);
  if (b.date !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(clean(b.date, 10))) item.date = clean(b.date, 10);
  store.write(TOOL, shop, list);
  res.json({ ok: true, item });
}));

router.delete('/items/:id', withShop(async (req, res, { shop }) => {
  const list = store.read(TOOL, shop, []);
  const next = list.filter((x) => x.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ ok: false, error: 'Item not found' });
  store.write(TOOL, shop, next);
  res.json({ ok: true });
}));

module.exports = router;
