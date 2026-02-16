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
    const { productName, productDescription } = req.body;
    if (!productName || !productDescription) {
      return res.status(400).json({ ok: false, error: 'Missing productName or productDescription' });
    }
    if (!openai) {
      return res.status(503).json({ ok: false, error: 'OpenAI not configured' });
    }
    const prompt = `Generate an SEO title, meta description, slug, and keyword set for the following product.\nProduct Name: ${productName}\nProduct Description: ${productDescription}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert e-commerce SEO assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, result: reply });
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
    const results = [];
    for (const p of products) {
      const prompt = `Generate an SEO title, meta description, slug, and keyword set for the following product.\nProduct Name: ${p.productName}\nProduct Description: ${p.productDescription}`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert e-commerce SEO assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7
      });
      const reply = completion.choices[0]?.message?.content?.trim() || '';
      results.push({ input: p, result: reply });
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
router.get('/shopify-products', async (req, res) => {
  // This endpoint normally lives in server.js; add a safe guard here so /:id does not catch it.
  try {
    // If a token is not provided, return a helpful 400 instead of falling through to /:id
    const shop = req.query.shop || req.session?.shop || null;
    const token = req.query.token || null;
    if (!shop || !token) {
      return res.status(400).json({ ok: false, error: 'Missing shop or token. Please connect Shopify.' });
    }
    // If implemented elsewhere, respond with 501 to indicate not implemented here
    return res.status(501).json({ ok: false, error: 'Use server-level shopify-products endpoint' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
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
