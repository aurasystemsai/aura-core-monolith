const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ── AI Analyze — main endpoint the frontend calls ────────────────────────────
// POST /api/schema-rich-results-engine/ai/analyze
// Frontend sends { schema }, expects { ok, schemaReport }
router.post('/ai/analyze', async (req, res) => {
  try {
    const { schema, url, type } = req.body || {};
    if (!schema && !url) return res.status(400).json({ ok: false, error: 'schema or url is required' });

    const model = 'gpt-4o-mini';
    const context = schema || `URL: ${url}, Type: ${type || 'Product'}`;

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a schema.org and structured data expert for Shopify e-commerce stores. Analyze the input and provide:

1. **Schema Assessment** — What structured data exists or is needed
2. **Generated JSON-LD** — Complete, valid JSON-LD schema markup (wrapped in a code block)
3. **Rich Results Eligibility** — Which Google rich results this schema qualifies for (Product, FAQ, Breadcrumb, Article, Review, HowTo, etc.)
4. **Validation Issues** — Any problems with existing schema
5. **Enhancement Recommendations** — How to improve the schema for better rich results
6. **Implementation Guide** — Where to place the schema in Shopify (theme.liquid, product template, etc.)

Always generate valid JSON-LD. For Shopify products, include: name, description, image, sku, brand, offers (price, availability, priceCurrency), aggregateRating if applicable.`
        },
        { role: 'user', content: context }
      ],
      max_tokens: 1500,
      temperature: 0.5
    });

    const schemaReport = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'ai-analyze', model });

    res.json({ ok: true, schemaReport });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI Generate — general schema generation ──────────────────────────────────
router.post('/ai/generate', async (req, res) => {
  try {
    const { type, data, messages, prompt } = req.body || {};
    const model = 'gpt-4o-mini';

    const chatMessages = messages || [
      { role: 'system', content: 'You are a schema.org JSON-LD expert for Shopify stores. Generate valid, complete JSON-LD structured data. Always output clean JSON-LD in a code block.' },
      { role: 'user', content: prompt || `Generate JSON-LD schema for type "${type || 'Product'}" with data: ${JSON.stringify(data || {})}` }
    ];

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: 1024,
      temperature: 0.5
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });

    res.json({ ok: true, reply, schema: reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── History ──────────────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try { res.json({ ok: true, history: await db.listHistory() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/history', async (req, res) => {
  try { res.json({ ok: true, entry: await db.addHistory(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try { res.json({ ok: true, analytics: await db.listAnalytics() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/analytics', async (req, res) => {
  try { res.json({ ok: true, event: await db.recordEvent(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Feedback ─────────────────────────────────────────────────────────────────
router.post('/feedback', async (req, res) => {
  try {
    const { feedback } = req.body || {};
    if (!feedback) return res.status(400).json({ ok: false, error: 'feedback is required' });
    res.json({ ok: true, entry: await db.saveFeedback({ feedback }) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Import / Export ──────────────────────────────────────────────────────────
router.post('/import', async (req, res) => {
  try {
    const { data, items } = req.body || {};
    const arr = Array.isArray(data) ? data : Array.isArray(items) ? items : null;
    if (!arr) return res.status(400).json({ ok: false, error: 'data[] or items[] required' });
    const count = await db.importData(arr);
    res.json({ ok: true, count });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/export', async (req, res) => {
  try { res.json({ ok: true, history: await db.listHistory() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'schema-rich-results-engine', ts: new Date().toISOString() });
});

// ── Inject schema into a Shopify article or product body_html ─────────────────
router.post('/shopify/apply', async (req, res) => {
  try {
    const { type, entityId, blogId, schema } = req.body;
    if (!type || !entityId || !schema) return res.status(400).json({ ok: false, error: 'type, entityId and schema are required' });
    const shop = req.headers['x-shopify-shop-domain'] || req.body.shop;
    if (!shop) return res.status(400).json({ ok: false, error: 'No shop domain — add x-shopify-shop-domain header' });
    const { applySchemaToEntity } = require('../../core/shopifyApply');
    const result = await applySchemaToEntity(shop, { type, entityId, blogId, schema });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;