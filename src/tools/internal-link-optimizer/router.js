const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { gql, loadStoreEntities } = require('../../core/seoStoreData');
const { getOpenAIClient } = require('../../core/openaiClient');
const store = require('../../core/shopStore');
const { analyzeLinks, insertLink, linkableText, pathOf } = require('../../core/internalLinks');

const router = express.Router();
const TOOL = 'internal-link-optimizer';

const UPDATE = {
  product: { read: 'descriptionHtml', mutation: 'mutation($id:ID!,$v:String!){ productUpdate(product:{id:$id, descriptionHtml:$v}){ userErrors{message} } }', key: 'productUpdate' },
  collection: { read: 'descriptionHtml', mutation: 'mutation($id:ID!,$v:String!){ collectionUpdate(input:{id:$id, descriptionHtml:$v}){ userErrors{message} } }', key: 'collectionUpdate' },
  page: { read: 'body', mutation: 'mutation($id:ID!,$v:HTML!){ pageUpdate(id:$id, page:{body:$v}){ userErrors{message} } }', key: 'pageUpdate' },
  article: { read: 'body', mutation: 'mutation($id:ID!,$v:HTML!){ articleUpdate(id:$id, article:{body:$v}){ userErrors{message} } }', key: 'articleUpdate' },
};
const TYPE_OF_GID = { Product: 'product', Collection: 'collection', Page: 'page', Article: 'article' };
const NODE_Q = 'query($id:ID!){ node(id:$id){ ... on Product{descriptionHtml} ... on Collection{descriptionHtml} ... on Page{body} ... on Article{body} } }';

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

async function loadAnalysis(shop, token) {
  const { entities, warnings } = await loadStoreEntities(shop, token, { max: 100 });
  let hosts = [shop.toLowerCase()];
  try {
    const d = await gql(shop, token, '{ shop { primaryDomain { host } } }');
    if (d.shop.primaryDomain.host) hosts.push(d.shop.primaryDomain.host.toLowerCase());
  } catch { /* myshopify host is enough */ }
  return { entities, warnings, analysis: analyzeLinks(entities, hosts) };
}

router.post('/analyze', withShop(async (req, res, { shop, token }) => {
  const { entities, warnings, analysis } = await loadAnalysis(shop, token);
  const record = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), entityCount: entities.length, ...analysis };
  store.write(TOOL, shop, record);
  if (req.deductCredits) await req.deductCredits({ action: 'internal-link' });
  res.json({ ok: true, warnings, ...record });
}));

router.get('/latest', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, analysis: store.read(TOOL, shop, null) });
}));

// Apply approved suggestions: every id, url and anchor is re-validated against fresh store data.
router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const picks = req.body && req.body.suggestions;
  if (!Array.isArray(picks) || !picks.length || picks.length > 10) {
    return res.status(400).json({ ok: false, error: 'Provide 1-10 suggestions to apply.' });
  }
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  const byId = new Map(entities.map(e => [e.id, e]));
  const byUrl = new Map(entities.map(e => [e.url, e]));
  const results = [];

  for (const p of picks) {
    const source = byId.get(p && p.sourceId);
    const target = byUrl.get(p && p.targetUrl);
    const anchor = String((p && p.anchor) || '').trim();
    if (!source || !target || source === target || !anchor || anchor.length > 80) {
      results.push({ sourceId: p && p.sourceId, ok: false, error: 'Invalid suggestion' });
      continue;
    }
    try {
      const gidType = /^gid:\/\/shopify\/(\w+)\//.exec(source.id)[1];
      const cfg = UPDATE[TYPE_OF_GID[gidType]];
      if (!cfg) throw new Error('Unsupported content type');
      const fresh = await gql(shop, token, NODE_Q, { id: source.id });
      const html = fresh.node && fresh.node[cfg.read];
      if (!html) throw new Error('Content is empty or changed');
      const updated = insertLink(html, anchor, pathOf(target.url));
      if (!updated) throw new Error('The anchor text was not found in a linkable place; the content may have changed.');
      const r = await gql(shop, token, cfg.mutation, { id: source.id, v: updated });
      const errs = (r[cfg.key] && r[cfg.key].userErrors) || [];
      if (errs.length) throw new Error(errs.map(e => e.message).join('; '));
      results.push({ sourceId: source.id, targetUrl: target.url, anchor, ok: true });
    } catch (e) {
      results.push({ sourceId: source.id, ok: false, error: e.message });
    }
  }
  const success = results.filter(r => r.ok).length;
  res.json({ ok: true, results, success, failed: results.length - success });
}));

// AI picks the best link targets for one page; every anchor is verified to exist in the page text.
router.post('/ai/suggest', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  const source = entities.find(e => e.id === (req.body && req.body.sourceId));
  if (!source) return res.status(404).json({ ok: false, error: 'Page not found' });
  const text = linkableText(source.html);
  if (text.length < 200) return res.status(400).json({ ok: false, error: 'This page has too little text to link from.' });
  const candidates = entities.filter(e => e !== source).slice(0, 60);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Pick up to 5 internal links for the page text below. Each "anchor" must be an exact phrase (2-5 words) copied from the text. Each "target" must be one of the listed URLs. Return JSON {"links":[{"anchor":"","target":""}]}.\n\nTARGETS:\n${candidates.map(c => `${c.url} | ${c.title}`).join('\n')}\n\nTEXT:\n${text.slice(0, 3500)}`,
    }],
  });
  let links = [];
  try { links = JSON.parse(completion.choices[0].message.content).links || []; } catch { /* none */ }
  const byUrl = new Map(candidates.map(c => [c.url, c]));
  const lower = text.toLowerCase();
  const suggestions = links
    .filter(l => l && byUrl.has(l.target) && typeof l.anchor === 'string' && l.anchor.length >= 3 && lower.includes(l.anchor.toLowerCase()))
    .slice(0, 5)
    .map(l => ({
      sourceId: source.id, sourceUrl: source.url, sourceTitle: source.title, sourceType: source.type,
      targetId: byUrl.get(l.target).id, targetUrl: l.target, targetTitle: byUrl.get(l.target).title, anchor: l.anchor,
    }));
  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini', action: 'internal-link' });
  res.json({ ok: true, suggestions });
}));

module.exports = router;

