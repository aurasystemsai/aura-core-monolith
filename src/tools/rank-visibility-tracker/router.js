const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');
const provider = require('../../core/rankProvider');
const sc = require('../../core/searchConsole');

const router = express.Router();
const TOOL = 'rank-visibility-tracker';
const MAX_KEYWORDS = 25;
const MAX_CHECKS = 60;

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

async function storeDomain(shop, token) {
  try {
    const d = await gql(shop, token, '{ shop { primaryDomain { host } } }');
    return d.shop.primaryDomain.host || shop;
  } catch {
    return shop;
  }
}

const summarize = (k) => {
  const [latest, previous] = k.checks;
  return {
    id: k.id, keyword: k.keyword, country: k.country, createdAt: k.createdAt,
    latest: latest || null,
    change: latest && previous && latest.position && previous.position ? previous.position - latest.position : null,
    history: k.checks.slice(0, 30).map(c => ({ at: c.at, position: c.position })),
  };
};

router.get('/status', withShop(async (req, res, { shop }) => {
  res.json({
    ok: true, configured: provider.isConfigured(), provider: provider.PROVIDER, countries: provider.COUNTRIES,
    gsc: { available: sc.isConfigured(), connected: !!sc.getConnection(shop) },
  });
}));

// Free, official data: the merchant's own Google Search Console. Opens Google's consent screen.
router.get('/gsc/connect', withShop(async (req, res, { shop }) => {
  if (!sc.isConfigured()) return res.status(503).json({ ok: false, error: 'Google connection is not set up on the server yet.' });
  res.json({ ok: true, url: sc.authUrl(req, shop) });
}));

router.post('/gsc/disconnect', withShop(async (req, res, { shop }) => {
  sc.disconnect(shop);
  res.json({ ok: true });
}));

router.get('/gsc/queries', withShop(async (req, res, { shop, token }) => {
  if (!sc.getConnection(shop)) return res.status(400).json({ ok: false, error: 'Connect Google Search Console first.' });
  const days = Math.max(7, Math.min(90, parseInt(req.query.days, 10) || 28));
  try {
    const access = await sc.accessToken(shop);
    const domain = await storeDomain(shop, token);
    const site = await sc.findSite(access, [...new Set([domain, shop])]);
    if (!site) {
      return res.status(404).json({ ok: false, error: `No verified Search Console property was found for ${domain} on the connected Google account. Add and verify your store there first.` });
    }
    const queries = await sc.queryPositions(access, site, days);
    res.json({ ok: true, site, days, queries });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
}));

router.get('/keywords', withShop(async (req, res, { shop }) => {
  const data = store.read(TOOL, shop, { keywords: [] });
  res.json({ ok: true, configured: provider.isConfigured(), keywords: data.keywords.map(summarize) });
}));

async function runCheck(shop, token, entry) {
  const domain = await storeDomain(shop, token);
  const r = await provider.checkRank(entry.keyword, domain, entry.country);
  entry.checks.unshift({ at: new Date().toISOString(), position: r.position, url: r.url });
  entry.checks = entry.checks.slice(0, MAX_CHECKS);
  return r;
}

// Adds a keyword (if new) and checks it now; 1 credit per live check.
router.post('/track', withShop(async (req, res, { shop, token }) => {
  if (!provider.isConfigured()) {
    return res.status(503).json({ ok: false, error: 'No rank data provider is connected. Set SERPAPI_KEY on the server.' });
  }
  const keyword = String((req.body && req.body.keyword) || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  const country = provider.COUNTRIES.includes(req.body && req.body.country) ? req.body.country : 'us';
  if (keyword.length < 2) return res.status(400).json({ ok: false, error: 'Enter a keyword.' });

  const data = store.read(TOOL, shop, { keywords: [] });
  let entry = data.keywords.find(k => k.keyword.toLowerCase() === keyword.toLowerCase() && k.country === country);
  if (!entry) {
    if (data.keywords.length >= MAX_KEYWORDS) return res.status(400).json({ ok: false, error: `You can track up to ${MAX_KEYWORDS} keywords.` });
    entry = { id: crypto.randomUUID(), keyword, country, createdAt: new Date().toISOString(), checks: [] };
    data.keywords.unshift(entry);
  }
  try {
    await runCheck(shop, token, entry);
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
  store.write(TOOL, shop, data);
  if (req.deductCredits) await req.deductCredits({ action: 'rank-check' });
  res.json({ ok: true, keyword: summarize(entry) });
}));

// Re-check one tracked keyword.
router.post('/recheck/:id', withShop(async (req, res, { shop, token }) => {
  if (!provider.isConfigured()) return res.status(503).json({ ok: false, error: 'No rank data provider is connected.' });
  const data = store.read(TOOL, shop, { keywords: [] });
  const entry = data.keywords.find(k => k.id === req.params.id);
  if (!entry) return res.status(404).json({ ok: false, error: 'Keyword not found.' });
  try {
    await runCheck(shop, token, entry);
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
  store.write(TOOL, shop, data);
  if (req.deductCredits) await req.deductCredits({ action: 'rank-check' });
  res.json({ ok: true, keyword: summarize(entry) });
}));

router.delete('/keywords/:id', withShop(async (req, res, { shop }) => {
  const data = store.read(TOOL, shop, { keywords: [] });
  const next = data.keywords.filter(k => k.id !== req.params.id);
  if (next.length === data.keywords.length) return res.status(404).json({ ok: false, error: 'Keyword not found.' });
  store.write(TOOL, shop, { keywords: next });
  res.json({ ok: true });
}));

module.exports = router;
