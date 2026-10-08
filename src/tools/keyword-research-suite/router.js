// Keyword Research Suite — real data only: the store's own catalogue, the merchant's Google
// Search Console queries (when connected) and AI suggestions that are clearly labelled as such.
// No search-volume or difficulty numbers are invented: those need a paid keyword-data provider.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities, gql } = require('../../core/seoStoreData');
const sc = require('../../core/searchConsole');
const KeywordClusteringEngine = require('./keyword-clustering-engine');

const router = express.Router();
const clustering = new KeywordClusteringEngine();
// Clusters and silos live in memory; remember which shop owns each so shops cannot read each other's.
const owners = new Map();

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

function clusterError(res, error) {
  const msg = error && error.message ? error.message : 'Clustering failed';
  const notFound = /not found|No matching/i.test(msg);
  const invalid = /must be|Unknown clustering|maximum|not a valid|required/i.test(msg);
  res.status(notFound ? 404 : invalid ? 400 : 500).json({ ok: false, error: msg });
}

const owns = (shop, id) => owners.get(id) === shop;

router.post('/cluster/create', withShop(async (req, res, { shop }) => {
  try {
    const { keywords, method, minClusterSize, maxClusters } = req.body || {};
    const result = await clustering.clusterKeywords(keywords, method, minClusterSize, maxClusters);
    if (result && result.id) owners.set(result.id, shop);
    res.json({ ok: true, data: result });
  } catch (error) {
    clusterError(res, error);
  }
}));

router.post('/cluster/build-silo', withShop(async (req, res, { shop }) => {
  try {
    const clusterIds = (req.body && req.body.clusterIds) || [];
    if (!Array.isArray(clusterIds) || !clusterIds.every((id) => owns(shop, id))) {
      return res.status(404).json({ ok: false, error: 'Cluster not found' });
    }
    const result = await clustering.buildContentSilo(clusterIds);
    if (result && result.id) owners.set(result.id, shop);
    res.json({ ok: true, data: result });
  } catch (error) {
    clusterError(res, error);
  }
}));

router.post('/cluster/silo-calendar', withShop(async (req, res, { shop }) => {
  try {
    const { siloId, startDate, publishingFrequency } = req.body || {};
    if (!owns(shop, siloId)) return res.status(404).json({ ok: false, error: 'Silo not found' });
    const result = await clustering.exportToContentCalendar(siloId, startDate, publishingFrequency);
    res.json({ ok: true, data: result });
  } catch (error) {
    clusterError(res, error);
  }
}));

router.get('/cluster/list', withShop(async (req, res, { shop }) => {
  const data = [...clustering.clusters.values()].filter((c) => owns(shop, c.id));
  res.json({ ok: true, data, total: data.length });
}));

async function storeDomain(shop, token) {
  try {
    const d = await gql(shop, token, '{ shop { primaryDomain { host } } }');
    return d.shop.primaryDomain.host || shop;
  } catch {
    return shop;
  }
}

async function searchConsoleQueries(shop, token, days) {
  if (!sc.getConnection(shop)) return null;
  const access = await sc.accessToken(shop);
  const domain = await storeDomain(shop, token);
  const site = await sc.findSite(access, [...new Set([domain, shop])]);
  if (!site) return null;
  return sc.queryPositions(access, site, days, 500);
}

const STOP = new Set(['the', 'and', 'for', 'with', 'your', 'our', 'a', 'an', 'of', 'to', 'in', 'on', 'by', 'set', 'new']);

// Candidate keywords derived deterministically from what the store actually sells.
function catalogueKeywords(entities) {
  const found = new Map();
  const add = (keyword, source) => {
    const k = String(keyword || '').toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (k.length < 3 || k.length > 60 || STOP.has(k)) return;
    const row = found.get(k) || { keyword: k, sources: new Set(), count: 0 };
    row.sources.add(source);
    row.count += 1;
    found.set(k, row);
  };
  for (const e of entities) {
    if (e.type === 'product' || e.type === 'collection') add(e.title, e.type);
    for (const t of e.tags || []) add(t, 'tag');
    const words = String(e.title || '').toLowerCase().split(/[^a-z0-9']+/).filter((w) => w && !STOP.has(w));
    for (let i = 0; i < words.length - 1; i++) add(`${words[i]} ${words[i + 1]}`, 'title-phrase');
  }
  return [...found.values()]
    .map((r) => ({ keyword: r.keyword, sources: [...r.sources], count: r.count }))
    .sort((a, b) => b.sources.length - a.sources.length || b.count - a.count);
}

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({
    ok: true,
    ai: !!getOpenAIClient(),
    gsc: { available: sc.isConfigured(), connected: !!sc.getConnection(shop) },
    volumeData: false,
  });
}));

router.get('/store-keywords', withShop(async (req, res, { shop, token }) => {
  const { entities, warnings } = await loadStoreEntities(shop, token, { max: 100, types: ['products', 'collections', 'articles'] });
  const keywords = catalogueKeywords(entities).slice(0, 150);
  res.json({ ok: true, total: keywords.length, keywords, warnings, scanned: entities.length });
}));

// "Striking distance" queries: real Search Console rows ranking just off page one.
router.get('/opportunities', withShop(async (req, res, { shop, token }) => {
  if (!sc.getConnection(shop)) return res.status(400).json({ ok: false, error: 'Connect Google Search Console in Rank Tracker first.' });
  const days = Math.max(7, Math.min(90, parseInt(req.query.days, 10) || 28));
  let queries;
  try {
    queries = await searchConsoleQueries(shop, token, days);
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
  if (!queries) return res.status(404).json({ ok: false, error: 'No verified Search Console property was found for this store.' });
  const opportunities = queries
    .filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 50);
  res.json({ ok: true, days, total: opportunities.length, opportunities });
}));

const INTENTS = new Set(['informational', 'commercial', 'transactional', 'navigational']);

router.post('/ideas', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const seed = String((req.body && req.body.seed) || '').trim().slice(0, 120);

  const { entities } = await loadStoreEntities(shop, token, { max: 40, types: ['products', 'collections'] });
  if (!entities.length && !seed) {
    return res.status(400).json({ ok: false, error: 'Add a seed topic, or add products to your store first.' });
  }
  const catalogue = entities.slice(0, 40).map((e) => e.title).join('; ');
  let realQueries = [];
  try {
    realQueries = (await searchConsoleQueries(shop, token, 28)) || [];
  } catch {
    realQueries = [];
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an SEO strategist for a Shopify store. Suggest 20 search keywords real shoppers might use: long-tail, question and buying-intent phrases that fit the store. Do NOT give search volumes or difficulty. Return JSON: {"ideas":[{"keyword":string,"intent":"informational|commercial|transactional|navigational","why":string}]}.' },
      { role: 'user', content: `Store catalogue: ${catalogue || 'n/a'}\nSeed topic: ${seed || 'none'}` },
    ],
  });
  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch {
    return res.status(502).json({ ok: false, error: 'The AI returned an unreadable answer. Try again.' });
  }
  const byQuery = new Map(realQueries.map((q) => [q.query.toLowerCase(), q]));
  const seen = new Set();
  const ideas = (Array.isArray(parsed.ideas) ? parsed.ideas : [])
    .map((i) => ({
      keyword: String(i.keyword || '').toLowerCase().trim().slice(0, 80),
      intent: INTENTS.has(i.intent) ? i.intent : 'informational',
      why: String(i.why || '').slice(0, 200),
    }))
    .filter((i) => i.keyword && !seen.has(i.keyword) && seen.add(i.keyword))
    .map((i) => {
      const hit = byQuery.get(i.keyword);
      return { ...i, source: 'ai', searchConsole: hit ? { impressions: hit.impressions, clicks: hit.clicks, position: hit.position } : null };
    });

  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini', action: 'keyword-research' });
  res.json({ ok: true, total: ideas.length, ideas });
}));

module.exports = router;
