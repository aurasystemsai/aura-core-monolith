const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { loadStoreEntities } = require('../../core/seoStoreData');
const { auditStore } = require('../../core/seoAnalyzers');
const { applyProductFields } = require('../../core/shopifyApply');
const { getOpenAIClient } = require('../../core/openaiClient');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'seo-site-crawler';

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

async function runCrawl(req, res, { shop, token }) {
  const max = Math.max(1, Math.min(250, parseInt(req.body && req.body.limit, 10) || 100));
  const { entities, warnings } = await loadStoreEntities(shop, token, { max });
  const result = auditStore(entities);
  const entry = store.pushCapped(TOOL, shop, {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    summary: { pagesScanned: result.pagesScanned, totalIssues: result.totalIssues, high: result.high, medium: result.medium, low: result.low, score: result.score },
    result,
  });
  if (req.deductCredits) await req.deductCredits({ action: 'seo-scan' });
  res.json({ ok: true, id: entry.id, result, warnings });
}

router.post('/crawl', withShop(runCrawl));
router.post('/ai/crawl', withShop(runCrawl));

router.get('/history', withShop(async (req, res, { shop }) => {
  const history = store.read(TOOL, shop, []).map(h => ({ id: h.id, createdAt: h.createdAt, summary: h.summary }));
  res.json({ ok: true, history });
}));

router.get('/history/:id', withShop(async (req, res, { shop }) => {
  const entry = store.read(TOOL, shop, []).find(h => h.id === req.params.id);
  if (!entry) return res.status(404).json({ ok: false, error: 'Crawl not found' });
  res.json({ ok: true, entry });
}));

router.get('/compare', withShop(async (req, res, { shop }) => {
  const { a, b } = req.query;
  const list = store.read(TOOL, shop, []);
  const A = list.find(h => h.id === a);
  const B = list.find(h => h.id === b);
  if (!A || !B) return res.status(404).json({ ok: false, error: 'One or both crawls were not found' });
  const key = (i) => `${i.page}|${i.type}`;
  const aKeys = new Set(A.result.issues.map(key));
  const bKeys = new Set(B.result.issues.map(key));
  res.json({
    ok: true,
    scoreChange: B.summary.score - A.summary.score,
    resolved: A.result.issues.filter(i => !bKeys.has(key(i))),
    introduced: B.result.issues.filter(i => !aKeys.has(key(i))),
  });
}));

// AI suggestions for product SEO fields; nothing is written until /apply-fixes.
router.post('/suggest-fixes', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const wanted = new Set(Array.isArray(req.body && req.body.urls) ? req.body.urls : []);
  const { entities } = await loadStoreEntities(shop, token, { max: 100, types: ['products'] });
  const targets = entities.filter(e => wanted.has(e.url)).slice(0, 10);
  if (!targets.length) return res.status(400).json({ ok: false, error: 'Select up to 10 product URLs from the latest crawl.' });

  const fixes = [];
  for (const p of targets) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: `Write SEO fields for a Shopify product. Return JSON {"seoTitle":"<=60 chars","metaDescription":"120-160 chars, benefit-first"}.\nName: ${p.title}\nDescription: ${p.text.slice(0, 500) || '(none)'}`,
        }],
      });
      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      fixes.push({
        productId: p.id, url: p.url, productName: p.title,
        seoTitle: String(parsed.seoTitle || '').slice(0, 70),
        metaDescription: String(parsed.metaDescription || '').slice(0, 170),
      });
    } catch (e) {
      fixes.push({ productId: p.id, url: p.url, productName: p.title, error: 'Could not generate a suggestion.' });
    }
  }
  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
  res.json({ ok: true, fixes });
}));

router.post('/apply-fixes', withShop(async (req, res, { shop }) => {
  const fixes = req.body && req.body.fixes;
  if (!Array.isArray(fixes) || !fixes.length || fixes.length > 25) {
    return res.status(400).json({ ok: false, error: 'Provide 1-25 fixes to apply.' });
  }
  const results = [];
  for (const f of fixes) {
    if (!f || !/^gid:\/\/shopify\/Product\/\d+$/.test(String(f.productId || '')) || (!f.seoTitle && !f.metaDescription)) {
      results.push({ productId: f && f.productId, ok: false, error: 'Invalid fix' });
      continue;
    }
    try {
      await applyProductFields(shop, f.productId, { seoTitle: f.seoTitle, metaDescription: f.metaDescription });
      results.push({ productId: f.productId, ok: true });
    } catch (e) {
      results.push({ productId: f.productId, ok: false, error: e.message });
    }
  }
  const success = results.filter(r => r.ok).length;
  res.json({ ok: true, results, success, failed: results.length - success });
}));

module.exports = router;
