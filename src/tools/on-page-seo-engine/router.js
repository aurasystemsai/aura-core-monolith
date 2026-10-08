const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { loadStoreEntities } = require('../../core/seoStoreData');
const { analyzeOnPage } = require('../../core/onPage');
const { applyProductFields } = require('../../core/shopifyApply');
const { getOpenAIClient } = require('../../core/openaiClient');

const router = express.Router();

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

const findEntity = async (shop, token, id) => {
  const { entities } = await loadStoreEntities(shop, token, { max: 100 });
  return { entities, entity: entities.find(e => e.id === id) };
};

router.get('/items', withShop(async (req, res, { shop, token }) => {
  const { entities, warnings } = await loadStoreEntities(shop, token, { max: 100 });
  res.json({ ok: true, warnings, items: entities.map(e => ({ id: e.id, type: e.type, title: e.title, url: e.url })) });
}));

router.post('/analyze', withShop(async (req, res, { shop, token }) => {
  const keyword = String((req.body && req.body.keyword) || '').trim().slice(0, 80);
  const id = req.body && req.body.id;
  if (!id) return res.status(400).json({ ok: false, error: 'Choose a page to analyze.' });
  const { entity } = await findEntity(shop, token, id);
  if (!entity) return res.status(404).json({ ok: false, error: 'Page not found in your store.' });
  if (req.deductCredits) await req.deductCredits({ action: 'seo-analysis' });
  res.json({ ok: true, result: analyzeOnPage(entity, keyword) });
}));

// AI rewrites the title and meta for the keyword; nothing is saved until /apply.
router.post('/ai/optimize', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const keyword = String((req.body && req.body.keyword) || '').trim().slice(0, 80);
  if (!keyword) return res.status(400).json({ ok: false, error: 'Enter a target keyword first.' });
  const { entity } = await findEntity(shop, token, req.body && req.body.id);
  if (!entity) return res.status(404).json({ ok: false, error: 'Page not found in your store.' });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Write SEO fields for this ${entity.type}. Include the exact keyword "${keyword}" in both. Do not invent facts. Return JSON {"seoTitle":"30-60 chars","metaDescription":"120-160 chars"}.\nName: ${entity.title}\nContent: ${entity.text.slice(0, 600) || '(none)'}`,
    }],
  });
  let p = {};
  try { p = JSON.parse(completion.choices[0].message.content || '{}'); } catch { /* handled below */ }
  const seoTitle = String(p.seoTitle || '').slice(0, 70);
  const metaDescription = String(p.metaDescription || '').slice(0, 170);
  if (!seoTitle || !metaDescription) return res.status(502).json({ ok: false, error: 'AI returned no usable suggestion. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini', action: 'seo-analysis' });
  const after = analyzeOnPage({ ...entity, seoTitle, seoDescription: metaDescription }, keyword);
  res.json({ ok: true, suggestion: { seoTitle, metaDescription }, projectedScore: after.score });
}));

// Only products can be written back today; other types are analysis-only.
router.post('/apply', withShop(async (req, res, { shop }) => {
  const { id, seoTitle, metaDescription } = req.body || {};
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(String(id || ''))) {
    return res.status(400).json({ ok: false, error: 'Only products can be updated from here.' });
  }
  if (!seoTitle && !metaDescription) return res.status(400).json({ ok: false, error: 'Nothing to apply.' });
  try {
    await applyProductFields(shop, id, { seoTitle, metaDescription });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e.message });
  }
  res.json({ ok: true });
}));

module.exports = router;
