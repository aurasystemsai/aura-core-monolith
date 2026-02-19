// ...existing code...
// Product SEO Engine: Express Router
const express = require('express');
const router = express.Router();
const model = require('./model');

const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();
const analytics = require('./analytics');
const notifications = require('./notifications');
const rbac = require('./rbac');
const i18n = require('./i18n');
const webhooks = require('./webhooks');
const fs = require('fs');
const path = require('path');


// LLM-powered SEO generation endpoint (single)
router.post('/generate', async (req, res) => {
  try {
    const { productName, productDescription, focusKeywords } = req.body;
    if (!productName || !productDescription) {
      return res.status(400).json({ ok: false, error: 'Missing productName or productDescription' });
    }
    if (!openai) {
      return res.status(503).json({ ok: false, error: 'OpenAI not configured' });
    }
    const kwList = focusKeywords
      ? focusKeywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];
    const allKwWords = kwList.length
      ? [...new Set(kwList.flatMap(k => k.toLowerCase().split(/\s+/)).filter(w => w.length > 2))]
      : [];

    const systemPrompt = `You are an elite e-commerce conversion copywriter and SEO expert who has written for top Shopify brands generating millions in revenue. Your copy is sharp, customer-focused, and built to rank AND sell.

Your philosophy:
- Lead with the customer benefit and emotional hook, not the product name
- Use power words: premium, proven, built for, effortless, unleash, dominate, elevate, trusted, top-rated
- Create urgency and desire without being spammy
- Every sentence must earn its place - no filler, no keyword-stuffing that reads as robotic
- SEO titles should be click-worthy, not just a product name + keyword
- Meta descriptions should make the reader think "that's exactly what I want" and click
- Respond ONLY with valid JSON, no markdown, no explanation whatsoever`;

    const kwBlock = kwList.length
      ? `\nTarget Keywords (weave these naturally into your copy - do NOT list them robotically, integrate them into compelling sentences):\n${kwList.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n\nKey words to ensure appear somewhere in the description: ${allKwWords.join(', ')}\n`
      : '';

    const userPrompt = `Write high-converting SEO copy for this product:

Product: ${productName}
Details: ${productDescription}
${kwBlock}
Requirements:
- seoTitle: 40-60 characters. Compelling, click-worthy. Include the most important keyword naturally. Think Google ad headline - make them WANT to click.
- metaDescription: 145-165 characters. Benefit-first, emotionally engaging, naturally includes keywords, ends with a punchy CTA (Shop Now, Get Yours Today, etc.). NO robotic keyword lists.
- slug: clean URL slug, lowercase, hyphens, keyword-focused
- keywords: comma-separated list of the target keywords provided
- altText: vivid, descriptive alt text for the main product image, 10-15 words

Return ONLY this JSON:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "slug": "...",
  "keywords": "...",
  "altText": "..."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.75
    });
    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    let parsed = {};
    try { parsed = JSON.parse(raw); } catch (_) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch (_) {} }
    }
    res.json({ ok: true, result: raw, parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Bulk AI generation endpoint
router.post('/bulk-generate', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ ok: false, error: 'No products provided' });
    }
    if (!openai) {
      return res.status(503).json({ ok: false, error: 'OpenAI not configured' });
    }
    const bulkSystemPrompt = `You are an elite e-commerce conversion copywriter and SEO expert. Your copy ranks in Google AND converts browsers into buyers. Lead with customer benefits and emotion. Use power words. Make every word earn its place. Never produce robotic keyword lists. Respond ONLY with valid JSON, no markdown.`;
    const results = [];
    for (const p of products) {
      const bKwList = p.focusKeywords ? p.focusKeywords.split(',').map(k => k.trim()).filter(Boolean) : [];
      const bAllWords = bKwList.length
        ? [...new Set(bKwList.flatMap(k => k.toLowerCase().split(/\s+/)).filter(w => w.length > 2))]
        : [];
      const bKwBlock = bKwList.length
        ? `\nTarget Keywords (weave naturally into copy):\n${bKwList.map((k, i) => `${i + 1}. ${k}`).join('\n')}\nKey words to include: ${bAllWords.join(', ')}\n`
        : '';
      const prompt = `Write high-converting SEO copy for this product:\n\nProduct: ${p.productName}\nDetails: ${p.productDescription}\n${bKwBlock}\nRequirements:\n- seoTitle: 40-60 chars, compelling click-worthy headline with primary keyword\n- metaDescription: 145-165 chars, benefit-first, naturally includes keywords, punchy CTA\n- slug: lowercase hyphens, keyword-focused\n- keywords: comma-separated target keywords\n- altText: vivid 10-15 word product image description\n\nReturn ONLY this JSON:\n{\n  "seoTitle": "...",\n  "metaDescription": "...",\n  "slug": "...",\n  "keywords": "...",\n  "altText": "..."\n}`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: bulkSystemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.75
      });
      const raw2 = completion.choices[0]?.message?.content?.trim() || '{}';
      let parsed2 = {};
      try { parsed2 = JSON.parse(raw2); } catch (_) {
        const match2 = raw2.match(/\{[\s\S]*\}/);
        if (match2) { try { parsed2 = JSON.parse(match2[0]); } catch (_) {} }
      }
      results.push({ input: p, result: raw2, parsed: parsed2 });
    }
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Import (CSV/JSON)
router.post('/import', async (req, res) => {
  try {
    const { data, format } = req.body;
    if (!data) return res.status(400).json({ ok: false, error: 'No data provided' });
    let imported = [];
    if (format === 'csv') {
      // Simple CSV parser (expects header row)
      const lines = data.split('\n').filter(Boolean);
      const headers = lines[0].split(',');
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const obj = {};
        headers.forEach((h, idx) => { obj[h.trim()] = row[idx]?.trim(); });
        imported.push(await model.create(obj));
      }
    } else if (format === 'json') {
      const arr = Array.isArray(data) ? data : JSON.parse(data);
      for (const obj of arr) imported.push(await model.create(obj));
    } else {
      return res.status(400).json({ ok: false, error: 'Invalid format' });
    }
    res.json({ ok: true, imported });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Export (CSV/JSON)
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const all = await model.getAll();
    if (format === 'csv') {
      const headers = Object.keys(all[0] || {});
      const csv = [headers.join(',')].concat(all.map(row => headers.map(h => row[h]).join(','))).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } else {
      res.json({ ok: true, data: all });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
  try {
    const event = analytics.recordEvent(req.body || {});
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.get('/analytics', (req, res) => {
  const { type } = req.query;
  const events = analytics.listEvents({ type });
  res.json({ ok: true, events });
});

// Shopify sync endpoints (import/export, update)
router.post('/shopify/import', async (req, res) => {
  // Expects { shop, token, limit }
  try {
    const { shop, token, limit } = req.body;
    if (!shop || !token) return res.status(400).json({ ok: false, error: 'Missing shop or token' });
    // Use global fetchShopifyProducts from server.js or reimplement here
    // For now, just return ok
    res.json({ ok: true, imported: [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
router.post('/shopify/export', async (req, res) => {
  // Expects { shop, token, products }
  try {
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Notifications (webhook/event)
router.post('/notify', (req, res) => {
  try {
    notifications.send(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// RBAC: check permission
router.get('/rbac/check', (req, res) => {
  try {
    const { user, action } = req.query;
    const allowed = rbac.check(user, action);
    res.json({ ok: true, allowed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Docs endpoint
router.get('/docs', (req, res) => {
  res.json({ ok: true, docs: 'Product SEO Engine API. Endpoints: /, /:id, /generate, /bulk-generate, /import, /export, /analytics, /shopify/import, /shopify/export, /shopify-products, /notify, /rbac/check, /docs, /i18n' });
});

// i18n endpoint
router.get('/i18n', (req, res) => {
  res.json({ ok: true, i18n: i18n.getAll() });
});

// Shopify products endpoint (guarded to avoid 500s)
router.get('/shopify-products', (req, res, next) => {
  // Let the server-level /api/product-seo/shopify-products route handle this request.
  // Calling next('router') skips the rest of this router (avoids /:id capture) and
  // allows the app-level handler to resolve with session-backed Shopify credentials.
  return next('router');
});


// CRUD endpoints
router.get('/', async (req, res) => {
  res.json({ ok: true, data: await model.getAll() });
});

router.get('/:id', async (req, res) => {
  const data = await model.getById(req.params.id);
  if (!data) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, data });
});

router.post('/', async (req, res) => {
  const created = await model.create(req.body);
  res.json({ ok: true, data: created });
});

router.put('/:id', async (req, res) => {
  const updated = await model.update(req.params.id, req.body);
  res.json({ ok: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  await model.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
