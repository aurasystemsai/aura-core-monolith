'use strict';

// Ad Creative Optimizer: AI writes ad copy for a real product, cut to each platform's own limits.
// It needs no ad account. Charged (ad-copy) only when AI really answers.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const PRODUCT = /^gid:\/\/shopify\/Product\/\d+$/;

// Character limits set by each ad platform.
const PLATFORMS = {
  google: { name: 'Google Ads', headline: 30, text: 90, headlines: 5, texts: 3 },
  meta: { name: 'Meta Ads', headline: 40, text: 125, headlines: 3, texts: 3 },
  tiktok: { name: 'TikTok Ads', headline: 40, text: 100, headlines: 3, texts: 3 },
};

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

router.get('/platforms', (req, res) => {
  res.json({ ok: true, platforms: Object.entries(PLATFORMS).map(([id, p]) => ({ id, ...p })) });
});

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, '{ products(first:100, sortKey:TITLE){ nodes{ id title status } } }');
  res.json({ ok: true, products: d.products.nodes.filter((p) => p.status === 'ACTIVE').map((p) => ({ id: p.id, title: p.title })) });
}));

// Keep only non-empty, unique lines that fit the limit. Over-long lines are dropped, never cut mid-word.
function fit(list, limit, max) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(list) ? list : []) {
    const s = String(v || '').replace(/\s+/g, ' ').trim();
    if (!s || s.length > limit || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push({ text: s, length: s.length });
    if (out.length >= max) break;
  }
  return out;
}

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const { productId, platform = 'google', angle } = req.body || {};
  const p = PLATFORMS[platform];
  if (!p) return res.status(400).json({ ok: false, error: 'Choose Google, Meta or TikTok.' });
  if (!PRODUCT.test(String(productId || ''))) return res.status(400).json({ ok: false, error: 'Choose a product.' });
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const d = await gql(shop, token, 'query($id:ID!){ product(id:$id){ title description productType vendor priceRangeV2{ minVariantPrice{ amount currencyCode } } } }', { id: productId });
  if (!d.product) return res.status(404).json({ ok: false, error: 'Product not found.' });
  const pr = d.product;
  let out;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.7, max_tokens: 700, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You write ${p.name} ad copy for a small online shop. Use only facts given about the product. Never invent discounts, reviews, guarantees, delivery times or claims. Headlines must be at most ${p.headline} characters and descriptions at most ${p.text} characters, counting spaces. Give ${p.headlines + 2} headlines and ${p.texts + 1} descriptions, each a different angle. Reply as JSON {"headlines":[string],"descriptions":[string]}.` },
        { role: 'user', content: JSON.stringify({ product: pr.title, description: String(pr.description || '').slice(0, 600), type: pr.productType, brand: pr.vendor, price: pr.priceRangeV2 && pr.priceRangeV2.minVariantPrice, angle: String(angle || '').slice(0, 120) || undefined }) },
      ],
    });
    out = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not write the ads: ${e.message}` });
  }
  const headlines = fit(out.headlines, p.headline, p.headlines);
  const descriptions = fit(out.descriptions, p.text, p.texts);
  if (!headlines.length || !descriptions.length) return res.status(502).json({ ok: false, error: 'AI returned copy that did not fit the limits. Try again, you were not charged.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'ad-copy' });
  res.json({ ok: true, platform, limits: { headline: p.headline, description: p.text }, product: pr.title, headlines, descriptions });
}));

module.exports = router;
module.exports._fit = fit;