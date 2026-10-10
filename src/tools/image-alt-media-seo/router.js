// Image Alt Text: reads the real images on your Shopify products, flags the ones with no alt text or poor alt
// text, and (when you ask) has AI look at each picture and write a short description. Nothing is changed in
// Shopify until you press Apply, and every change is logged so it can be undone. AI looks at one image at a
// time and costs credits per image; typing your own alt text is always free.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const { MODEL, judge, clean, loadImages, describeImage } = require('./alt');
const store = require('../../core/shopStore');
const schedule = require('../../core/altSchedule');
const webhooks = require('../../core/webhooks');

const router = express.Router();
const TOOL = 'image-alt-media-seo';
const LOG = 'alt-log';
const MAX_BATCH = 10;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

router.get('/images', withShop(async (req, res, { shop, token }) => {
  const r = await loadImages(shop, token, req.query.after);
  const count = (k) => r.images.filter((i) => i.problem === k).length;
  res.json({
    ok: true, ...r,
    summary: { total: r.images.length, missing: count('missing'), filename: count('filename'), short: count('short'), long: count('long'), good: r.images.filter((i) => !i.problem).length },
    ai: !!getOpenAIClient(),
  });
}));

// Suggests alt text for up to MAX_BATCH images. Only images that were really described are charged.
router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const ids = Array.isArray(req.body && req.body.ids) ? [...new Set(req.body.ids)].filter((i) => /^gid:\/\/shopify\/MediaImage\/\d+$/.test(String(i))).slice(0, MAX_BATCH) : [];
  if (!ids.length) return res.status(400).json({ ok: false, error: `Choose between 1 and ${MAX_BATCH} images.` });
  const hints = (req.body && req.body.titles) || {};
  const d = await gql(shop, token, 'query($ids:[ID!]!){ nodes(ids:$ids){ ... on MediaImage{ id alt image{ url(transform:{maxWidth:800}) } } } }', { ids });
  const found = (d.nodes || []).filter((n) => n && n.id && n.image);
  const results = [];
  for (const m of found) {
    const hint = String(hints[m.id] || '').slice(0, 120);
    try {
      const alt = await describeImage(client, m.image.url, hint);
      if (!alt) { results.push({ id: m.id, error: 'AI returned nothing for this image.' }); continue; }
      if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'alt-text' });
      results.push({ id: m.id, alt, previous: m.alt || '' });
    } catch (e) {
      results.push({ id: m.id, error: `AI could not read this image: ${e.message}` });
    }
  }
  ids.filter((i) => !found.some((m) => m.id === i)).forEach((i) => results.push({ id: i, error: 'Image not found or not a product image.' }));
  res.json({ ok: true, results });
}));

async function setAlt(shop, token, productId, id, alt) {
  const d = await gql(shop, token,
    'mutation($p:ID!,$m:[UpdateMediaInput!]!){ productUpdateMedia(productId:$p, media:$m){ media{ alt } mediaUserErrors{ message } } }',
    { p: productId, m: [{ id, alt }] });
  const errs = d.productUpdateMedia.mediaUserErrors || [];
  if (errs.length) throw Object.assign(new Error(errs.map((e) => e.message).join('; ')), { status: 422 });
}

// Validates, sets the alt text in Shopify and writes the undo log entry.
async function applyAlt(shop, token, b) {
  const alt = String(b.alt || '').trim();
  const fail = (status, message) => Object.assign(new Error(message), { status });
  if (!/^gid:\/\/shopify\/MediaImage\/\d+$/.test(String(b.id || ''))) throw fail(400, 'Choose an image.');
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(String(b.productId || ''))) throw fail(400, 'Missing product.');
  if (!alt) throw fail(400, 'Alt text cannot be empty.');
  if (alt.length > 512) throw fail(400, 'Alt text is too long.');
  const cur = await gql(shop, token, 'query($id:ID!){ node(id:$id){ ... on MediaImage{ id alt } } }', { id: b.id });
  if (!cur.node || !cur.node.id) throw fail(404, 'That image was not found.');
  await setAlt(shop, token, b.productId, b.id, alt);
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), productId: b.productId, mediaId: b.id, label: String(b.label || '').slice(0, 120), from: cur.node.alt || '', to: alt, reverted: false };
  const data = store.read(TOOL, shop, {});
  data[LOG] = [entry, ...(data[LOG] || [])].slice(0, 300);
  store.write(TOOL, shop, data);
  webhooks.emit(shop, 'change.applied', { tool: 'image-alt-text', productId: entry.productId, mediaId: entry.mediaId, from: entry.from, to: entry.to, changeId: entry.id });
  return entry;
}

router.post('/apply', withShop(async (req, res, { shop, token }) => {
  res.json({ ok: true, entry: await applyAlt(shop, token, req.body || {}) });
}));

// Scheduled drafts: AI writes drafts on a schedule, nothing reaches Shopify until the merchant approves it.
router.get('/schedule', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, schedule: schedule.load(shop), maxPerRun: schedule.MAX_PER_RUN });
}));

router.post('/schedule', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, schedule: schedule.update(shop, req.body || {}) });
}));

router.post('/schedule/run', withShop(async (req, res, { shop }) => {
  const result = await schedule.runForShop(shop);
  res.json({ ok: true, ...result, schedule: schedule.load(shop) });
}));

router.post('/schedule/approve', withShop(async (req, res, { shop, token }) => {
  const draft = schedule.load(shop).drafts.find((d) => d.id === (req.body && req.body.id));
  if (!draft) return res.status(404).json({ ok: false, error: 'Draft not found.' });
  const alt = String((req.body && req.body.alt) || draft.alt);
  const entry = await applyAlt(shop, token, { id: draft.mediaId, productId: draft.productId, alt, label: draft.label });
  schedule.removeDraft(shop, draft.id);
  res.json({ ok: true, entry });
}));

router.post('/schedule/dismiss', withShop(async (req, res, { shop }) => {
  if (!schedule.removeDraft(shop, req.body && req.body.id)) return res.status(404).json({ ok: false, error: 'Draft not found.' });
  res.json({ ok: true });
}));

router.get('/log', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, log: store.read(TOOL, shop, {})[LOG] || [] });
}));

router.post('/revert', withShop(async (req, res, { shop, token }) => {
  const data = store.read(TOOL, shop, {});
  const entry = (data[LOG] || []).find((e) => e.id === (req.body && req.body.id));
  if (!entry) return res.status(404).json({ ok: false, error: 'Change not found.' });
  if (entry.reverted) return res.status(400).json({ ok: false, error: 'That change was already undone.' });
  await setAlt(shop, token, entry.productId, entry.mediaId, entry.from);
  entry.reverted = true; entry.revertedAt = new Date().toISOString();
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
}));

module.exports = router;
module.exports._judge = judge;
module.exports._clean = clean;
