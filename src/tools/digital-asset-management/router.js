'use strict';

// Media library: the images in your store's Files area, checked against real data.
// Flags missing alt text, heavy files and oversized dimensions. AI drafts alt text; you approve each one.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const { MODEL, MAX_ALT, judge, describeImage } = require('../image-alt-media-seo/alt');

const router = express.Router();
const FILE = /^gid:\/\/shopify\/MediaImage\/\d+$/;
const PAGE = 50;
const HEAVY = 500 * 1024; // above this a web image is slow to load
const WIDE = 3000; // wider than any screen needs

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) {
      if (/access denied|required access/i.test(err.message)) return res.status(403).json({ ok: false, needsScopes: true, error: 'The Media library needs file permissions. Approve the updated permissions for AURA in your Shopify admin, then try again.' });
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  };
}

const nameOf = (url) => { const m = String(url || '').match(/\/([^/?#]+)(?:\?|#|$)/); return m ? decodeURIComponent(m[1]) : ''; };
const ugly = (n) => /^(img|dsc|image|photo|screenshot|untitled|copy of)[-_ ]?\d*\.[a-z]+$/i.test(n) || /^\d{6,}\./.test(n);

function shape(n) {
  const url = n.image && n.image.url;
  const bytes = (n.originalSource && n.originalSource.fileSize) || 0;
  const w = (n.image && n.image.width) || 0;
  const file = nameOf(url);
  const issues = [];
  if (judge(n.alt)) issues.push('alt');
  if (bytes > HEAVY) issues.push('heavy');
  if (w > WIDE) issues.push('wide');
  if (ugly(file)) issues.push('name');
  return { id: n.id, file, url, alt: n.alt || '', bytes, width: w, height: (n.image && n.image.height) || 0, type: n.mimeType || '', createdAt: n.createdAt, issues };
}

router.get('/files', withShop(async (req, res, { shop, token }) => {
  const after = typeof req.query.after === 'string' && req.query.after.length < 200 ? req.query.after : null;
  const d = await gql(shop, token, `query($after:String){ files(first:${PAGE}, after:$after, query:"media_type:Image status:READY", sortKey:CREATED_AT, reverse:true){
    pageInfo{hasNextPage endCursor}
    nodes{ ... on MediaImage{ id alt createdAt mimeType image{ url width height } originalSource{ fileSize } } } } }`, { after });
  const files = d.files.nodes.filter((n) => n && n.id).map(shape);
  const count = (k) => files.filter((f) => f.issues.includes(k)).length;
  res.json({ ok: true, files, hasMore: d.files.pageInfo.hasNextPage, cursor: d.files.pageInfo.endCursor,
    summary: { shown: files.length, alt: count('alt'), heavy: count('heavy'), wide: count('wide'), name: count('name') }, limits: { heavyKB: HEAVY / 1024, wide: WIDE, maxAlt: MAX_ALT } });
}));

router.post('/draft', withShop(async (req, res, { shop, token }) => {
  const id = String((req.body && req.body.id) || '');
  if (!FILE.test(id)) return res.status(400).json({ ok: false, error: 'Choose an image.' });
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not available right now. You can still type the alt text yourself.' });
  const d = await gql(shop, token, `query($id:ID!){ node(id:$id){ ... on MediaImage{ id image{ url(transform:{maxWidth:800}) } } } }`, { id });
  const url = d.node && d.node.image && d.node.image.url;
  if (!url) return res.status(404).json({ ok: false, error: 'That image was not found.' });
  const alt = await describeImage(client, url, '');
  if (!alt) return res.status(502).json({ ok: false, error: 'AI did not return usable text. Try again, you were not charged.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'alt-text' });
  res.json({ ok: true, alt });
}));

// Saving returns the previous text so the screen can offer Undo.
router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const id = String((req.body && req.body.id) || '');
  if (!FILE.test(id)) return res.status(400).json({ ok: false, error: 'Choose an image.' });
  if (!req.body || typeof req.body.alt !== 'string') return res.status(400).json({ ok: false, error: 'Alt text is required.' });
  const alt = req.body.alt.trim().slice(0, MAX_ALT);
  const before = await gql(shop, token, `query($id:ID!){ node(id:$id){ ... on MediaImage{ id alt } } }`, { id });
  if (!before.node) return res.status(404).json({ ok: false, error: 'That image was not found.' });
  const r = await gql(shop, token, `mutation($f:[FileUpdateInput!]!){ fileUpdate(files:$f){ files{ id alt } userErrors{ message } } }`, { f: [{ id, alt }] });
  const errs = r.fileUpdate.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs[0].message });
  res.json({ ok: true, id, alt, previous: before.node.alt || '' });
}));

module.exports = router;
