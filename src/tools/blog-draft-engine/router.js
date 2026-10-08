// Blog Draft Engine: AI-written blog drafts grounded in the shop's real catalogue and Search Console data.
// Drafts are stored per shop and can be edited, improved with AI, and published to Shopify (live or as a hidden draft).
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities, gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const sc = require('../../core/searchConsole');
const { publishArticle } = require('../../core/shopifyApply');

const router = express.Router();
const TOOL = 'blog-draft-engine';
const MODEL = 'gpt-4o-mini';
const MAX_DRAFTS = 50;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  };
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const wordCount = (html) => String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

// Plain checks on the draft itself; no invented scores.
function checkDraft(d) {
  const kw = (d.keyword || '').toLowerCase();
  const text = (d.bodyHtml || '').toLowerCase();
  const words = wordCount(d.bodyHtml);
  const checks = [
    { id: 'length', ok: words >= 600, detail: `${words} words (aim for 600+)` },
    { id: 'headings', ok: (d.bodyHtml.match(/<h2/gi) || []).length >= 3, detail: 'At least 3 H2 sections' },
    { id: 'meta', ok: d.metaDescription.length >= 70 && d.metaDescription.length <= 160, detail: `Meta description ${d.metaDescription.length} characters (70-160)` },
  ];
  if (kw) {
    checks.push({ id: 'kw-title', ok: d.title.toLowerCase().includes(kw), detail: 'Keyword in title' });
    checks.push({ id: 'kw-intro', ok: text.slice(0, 600).includes(kw), detail: 'Keyword in the first paragraph' });
  }
  return { words, checks, passed: checks.filter((c) => c.ok).length, total: checks.length };
}

// Strip anything executable the model might emit before the HTML is stored or published.
function safeHtml(html) {
  return String(html || '')
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

async function aiJson(openai, system, user, maxTokens) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.6,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    throw Object.assign(new Error('The AI returned an unreadable answer. Try again.'), { status: 502 });
  }
}

async function storeContext(shop, token) {
  const { entities } = await loadStoreEntities(shop, token, { max: 40, types: ['products', 'collections'] });
  return entities.map((e) => ({ type: e.type, title: e.title, url: e.url }));
}

async function storeName(shop, token) {
  try {
    const d = await gql(shop, token, '{ shop { name } }');
    return d.shop.name || shop;
  } catch {
    return shop;
  }
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, ai: !!getOpenAIClient(), gsc: !!sc.getConnection(shop), drafts: store.read(TOOL, shop, []).length });
}));

router.post('/ideas', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const catalogue = await storeContext(shop, token);
  const topic = clean(req.body && req.body.topic, 120);
  if (!catalogue.length && !topic) return res.status(400).json({ ok: false, error: 'Add a topic, or add products to your store first.' });
  const out = await aiJson(openai,
    'You plan blog content for a Shopify store. Suggest 8 blog post ideas that help real shoppers and lead to the store\'s products. Return JSON {"ideas":[{"title":string,"keyword":string,"angle":string}]}. No traffic or volume claims.',
    `Products and collections: ${catalogue.map((c) => c.title).join('; ') || 'n/a'}\nTopic: ${topic || 'none'}`, 900);
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'keyword-research' });
  const ideas = (Array.isArray(out.ideas) ? out.ideas : []).slice(0, 8).map((i) => ({
    title: clean(i.title, 120), keyword: clean(i.keyword, 80), angle: clean(i.angle, 200),
  })).filter((i) => i.title);
  res.json({ ok: true, ideas });
}));

router.post('/drafts/generate', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const b = req.body || {};
  const title = clean(b.title, 140);
  if (!title) return res.status(400).json({ ok: false, error: 'A working title is required.' });
  const keyword = clean(b.keyword, 80);
  const tone = clean(b.tone, 60) || 'friendly and practical';
  const notes = clean(b.notes, 600);
  const [catalogue, brand] = await Promise.all([storeContext(shop, token), storeName(shop, token)]);

  const out = await aiJson(openai,
    'You write blog posts for a Shopify store. Write original, helpful content of 700-1000 words. Use <h2> section headings (at least 4), short paragraphs, and HTML only (<h2>,<h3>,<p>,<ul>,<li>,<a>,<strong>). Do not include <h1>. Link to the store\'s products only using the exact URLs supplied, and never invent products, statistics, prices or customer quotes. Return JSON {"title":string,"metaDescription":string (110-155 chars),"bodyHtml":string,"tags":[string]}.',
    `Store: ${brand}\nTitle: ${title}\nPrimary keyword: ${keyword || 'none'}\nTone: ${tone}\nNotes: ${notes || 'none'}\nProducts you may link to:\n${catalogue.map((c) => `${c.title} - ${c.url}`).join('\n') || 'none'}`, 2800);

  const draft = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: clean(out.title, 140) || title,
    keyword,
    metaDescription: clean(out.metaDescription, 200),
    bodyHtml: safeHtml(out.bodyHtml),
    tags: (Array.isArray(out.tags) ? out.tags : []).map((t) => clean(t, 30)).filter(Boolean).slice(0, 8),
    status: 'draft',
    published: null,
  };
  if (!draft.bodyHtml) return res.status(502).json({ ok: false, error: 'The AI did not return an article. Try again.' });
  store.pushCapped(TOOL, shop, draft, MAX_DRAFTS);
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'blog-draft' });
  res.json({ ok: true, draft: { ...draft, quality: checkDraft(draft) } });
}));

router.get('/drafts', withShop(async (req, res, { shop }) => {
  const drafts = store.read(TOOL, shop, []).map((d) => ({
    id: d.id, title: d.title, keyword: d.keyword, status: d.status, updatedAt: d.updatedAt, words: wordCount(d.bodyHtml),
  }));
  res.json({ ok: true, drafts });
}));

function findDraft(shop, id) {
  const list = store.read(TOOL, shop, []);
  const idx = list.findIndex((d) => d.id === id);
  return { list, idx, draft: idx >= 0 ? list[idx] : null };
}

router.get('/drafts/:id', withShop(async (req, res, { shop }) => {
  const { draft } = findDraft(shop, req.params.id);
  if (!draft) return res.status(404).json({ ok: false, error: 'Draft not found' });
  res.json({ ok: true, draft: { ...draft, quality: checkDraft(draft) } });
}));

router.put('/drafts/:id', withShop(async (req, res, { shop }) => {
  const { list, idx, draft } = findDraft(shop, req.params.id);
  if (!draft) return res.status(404).json({ ok: false, error: 'Draft not found' });
  const b = req.body || {};
  if (b.title !== undefined) draft.title = clean(b.title, 140);
  if (b.keyword !== undefined) draft.keyword = clean(b.keyword, 80);
  if (b.metaDescription !== undefined) draft.metaDescription = clean(b.metaDescription, 200);
  if (b.bodyHtml !== undefined) draft.bodyHtml = safeHtml(b.bodyHtml).slice(0, 60000);
  draft.updatedAt = new Date().toISOString();
  list[idx] = draft;
  store.write(TOOL, shop, list);
  res.json({ ok: true, draft: { ...draft, quality: checkDraft(draft) } });
}));

router.delete('/drafts/:id', withShop(async (req, res, { shop }) => {
  const { list, idx } = findDraft(shop, req.params.id);
  if (idx < 0) return res.status(404).json({ ok: false, error: 'Draft not found' });
  list.splice(idx, 1);
  store.write(TOOL, shop, list);
  res.json({ ok: true });
}));

router.post('/drafts/:id/improve', withShop(async (req, res, { shop }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const { list, idx, draft } = findDraft(shop, req.params.id);
  if (!draft) return res.status(404).json({ ok: false, error: 'Draft not found' });
  const instruction = clean(req.body && req.body.instruction, 300) || 'Tighten the writing, fix any weak sections and make sure the keyword is used naturally.';
  const out = await aiJson(openai,
    'You edit a Shopify store blog post. Apply the instruction, keep it factual, keep existing links, do not invent facts or products. HTML only, no <h1>. Return JSON {"metaDescription":string,"bodyHtml":string}.',
    `Instruction: ${instruction}\nKeyword: ${draft.keyword || 'none'}\nMeta description: ${draft.metaDescription}\nBody:\n${draft.bodyHtml}`, 2800);
  const html = safeHtml(out.bodyHtml);
  if (!html) return res.status(502).json({ ok: false, error: 'The AI did not return an article. Try again.' });
  draft.bodyHtml = html;
  if (out.metaDescription) draft.metaDescription = clean(out.metaDescription, 200);
  draft.updatedAt = new Date().toISOString();
  list[idx] = draft;
  store.write(TOOL, shop, list);
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'blog-draft' });
  res.json({ ok: true, draft: { ...draft, quality: checkDraft(draft) } });
}));

router.post('/drafts/:id/publish', withShop(async (req, res, { shop }) => {
  const { list, idx, draft } = findDraft(shop, req.params.id);
  if (!draft) return res.status(404).json({ ok: false, error: 'Draft not found' });
  const asDraft = !(req.body && req.body.live === true);
  const result = await publishArticle(shop, {
    title: draft.title, bodyHtml: draft.bodyHtml, metaDescription: draft.metaDescription,
    tags: draft.tags.join(', '), asDraft,
  });
  draft.status = asDraft ? 'shopify-draft' : 'published';
  draft.published = { articleId: result.articleId, blogId: result.blogId, handle: result.handle, at: new Date().toISOString(), live: !asDraft };
  list[idx] = draft;
  store.write(TOOL, shop, list);
  res.json({ ok: true, published: draft.published });
}));

module.exports = router;
