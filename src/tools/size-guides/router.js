'use strict';

// Size Guides: size tables you make, shown on matching product pages by the storefront script (public.js).
// AI can draft a table for a garment type, but sizes are a guess, so the screen tells the merchant to check them.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const MAX_GUIDES = 20;
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const guidesOf = (shop) => store.read('size-guides', shop, []);

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

// Up to 8 columns and 20 rows of short text. Every row is padded or cut to the column count.
function table(columns, rows) {
  const cols = (Array.isArray(columns) ? columns : []).slice(0, 8).map((c) => clean(c, 24));
  const out = (Array.isArray(rows) ? rows : []).slice(0, 20).map((r) => cols.map((_, i) => clean(Array.isArray(r) ? r[i] : '', 24)));
  return { columns: cols, rows: out.filter((r) => r.some(Boolean)) };
}
function normalise(b, existing) {
  const t = table(b.columns, b.rows);
  return {
    id: existing ? existing.id : crypto.randomUUID(),
    name: clean(b.name, 60),
    match: clean(b.match, 60) || 'all',
    title: clean(b.title, 60) || 'Size guide',
    note: clean(b.note, 200),
    ...t,
    active: b.active !== false,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
}

router.get('/status', withShop(async (req, res, { shop }) => {
  const base = (process.env.APP_URL || '').replace(/\/+$/, '');
  res.json({ ok: true, ai: !!getOpenAIClient(), scriptUrl: base ? `${base}/storefront/size-guide.js` : '' });
}));
router.get('/guides', withShop(async (req, res, { shop }) => res.json({ ok: true, guides: guidesOf(shop), max: MAX_GUIDES })));

router.post('/save', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  const list = guidesOf(shop);
  const existing = b.id ? list.find((g) => g.id === b.id) : null;
  if (b.id && !existing) return res.status(404).json({ ok: false, error: 'Size guide not found.' });
  if (!existing && list.length >= MAX_GUIDES) return res.status(400).json({ ok: false, error: `You can have up to ${MAX_GUIDES} size guides.` });
  const g = normalise(b, existing);
  if (!g.name) return res.status(400).json({ ok: false, error: 'Give the size guide a name.' });
  if (g.columns.length < 2 || !g.columns.every(Boolean)) return res.status(400).json({ ok: false, error: 'Add at least two column names, such as Size and Chest.' });
  if (!g.rows.length) return res.status(400).json({ ok: false, error: 'Add at least one row.' });
  store.write('size-guides', shop, existing ? list.map((x) => (x.id === g.id ? g : x)) : [g, ...list]);
  res.json({ ok: true, guide: g });
}));

router.post('/toggle', withShop(async (req, res, { shop }) => {
  const list = guidesOf(shop);
  const g = list.find((x) => x.id === (req.body || {}).id);
  if (!g) return res.status(404).json({ ok: false, error: 'Size guide not found.' });
  g.active = !g.active;
  store.write('size-guides', shop, list);
  res.json({ ok: true, guide: g });
}));

router.delete('/guides/:id', withShop(async (req, res, { shop }) => {
  const list = guidesOf(shop);
  if (!list.some((x) => x.id === req.params.id)) return res.status(404).json({ ok: false, error: 'Size guide not found.' });
  store.write('size-guides', shop, list.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

router.post('/ai-draft', withShop(async (req, res) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const item = clean((req.body || {}).item, 80);
  if (!item) return res.status(400).json({ ok: false, error: 'Say what the guide is for, such as "women\'s t-shirts".' });
  const unit = (req.body || {}).unit === 'in' ? 'inches' : 'cm';
  let out;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.2, max_tokens: 600, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You draft a typical size chart for a small online shop in ${unit}. Reply as JSON {"columns":[string],"rows":[[string]]}. First column is the size label. Use 2 to 5 measurement columns that suit the item and 4 to 8 sizes, as ranges like "86-91". Plain text only.` },
        { role: 'user', content: item },
      ],
    });
    out = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not draft the table: ${e.message}` });
  }
  const t = table(out.columns, out.rows);
  if (t.columns.length < 2 || !t.rows.length) return res.status(502).json({ ok: false, error: 'AI returned no usable table. Try again, you were not charged.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'product-description' });
  res.json({ ok: true, ...t, unit });
}));

module.exports = router;
module.exports._table = table;