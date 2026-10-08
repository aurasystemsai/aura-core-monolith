// Image Alt Text: reads the real images on your Shopify products, flags the ones with no alt text or poor alt
// text, and (when you ask) has AI look at each picture and write a short description. Nothing is changed in
// Shopify until you press Apply, and every change is logged so it can be undone. AI looks at one image at a
// time and costs credits per image; typing your own alt text is always free.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TOOL = 'image-alt-media-seo';
const LOG = 'alt-log';
const PAGE = 25;
const MAX_BATCH = 10;
const MAX_ALT = 125;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

// Why an alt text is poor, or '' when it is fine.
function judge(alt) {
  const a = String(alt || '').trim();
  if (!a) return 'missing';
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(a) || (/^(img|dsc|image|photo|screenshot)[-_ ]?\d*/i.test(a) && a.length < 14)) return 'filename';
  if (a.length < 10) return 'short';
  if (a.length > MAX_ALT) return 'long';
  return '';
}

const QUERY = `query($first:Int!,$after:String){ products(first:$first, after:$after, query:"status:active"){
  pageInfo{hasNextPage endCursor}
  nodes{ id title media(first:20){ nodes{ ... on MediaImage{ id alt image{ url(transform:{maxWidth:800}) } } } } } } }`;

async function loadImages(shop, token, after) {
  const d = await gql(shop, token, QUERY, { first: PAGE, after: after || null });
  const images = [];
  for (const p of d.products.nodes) {
    (p.media.nodes || []).filter((m) => m && m.id && m.image).forEach((m, i) => {
      images.push({ id: m.id, productId: p.id, productTitle: p.title, position: i + 1, url: m.image.url, alt: m.alt || '', problem: judge(m.alt) });
    });
  }
  return { images, hasMore: d.products.pageInfo.hasNextPage, cursor: d.products.pageInfo.endCursor };
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

function clean(text) {
  let t = String(text || '').replace(/^["'\s]+|["'\s]+$/g, '').replace(/^(an? )?(image|photo|picture) of /i, '').replace(/\s+/g, ' ');
  if (t.length > MAX_ALT) t = t.slice(0, MAX_ALT).replace(/\s+\S*$/, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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
      const resp = await client.chat.completions.create({
        model: MODEL, temperature: 0.2, max_tokens: 60,
        messages: [{ role: 'user', content: [
          { type: 'text', text: `Write alt text for this product image${hint ? ` (product: ${hint})` : ''}. Describe what is actually visible in one plain sentence under 110 characters: the item, colour, and anything that sets it apart. Do not start with "image of" or "photo of". Do not invent brand names. Reply with the alt text only.` },
          { type: 'image_url', image_url: { url: m.image.url, detail: 'low' } },
        ] }],
      });
      const alt = clean(resp.choices[0].message.content);
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

router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const alt = String(b.alt || '').trim();
  if (!/^gid:\/\/shopify\/MediaImage\/\d+$/.test(String(b.id || ''))) return res.status(400).json({ ok: false, error: 'Choose an image.' });
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(String(b.productId || ''))) return res.status(400).json({ ok: false, error: 'Missing product.' });
  if (!alt) return res.status(400).json({ ok: false, error: 'Alt text cannot be empty.' });
  if (alt.length > 512) return res.status(400).json({ ok: false, error: 'Alt text is too long.' });
  const cur = await gql(shop, token, 'query($id:ID!){ node(id:$id){ ... on MediaImage{ id alt } } }', { id: b.id });
  if (!cur.node || !cur.node.id) return res.status(404).json({ ok: false, error: 'That image was not found.' });
  await setAlt(shop, token, b.productId, b.id, alt);
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), productId: b.productId, mediaId: b.id, label: String(b.label || '').slice(0, 120), from: cur.node.alt || '', to: alt, reverted: false };
  const data = store.read(TOOL, shop, {});
  data[LOG] = [entry, ...(data[LOG] || [])].slice(0, 300);
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
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
