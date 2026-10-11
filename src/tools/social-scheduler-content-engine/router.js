'use strict';

// Social post planner: AI writes a caption from one of your real products, and you keep a simple
// calendar of what to post and when. Nothing is posted for you (no social accounts are connected),
// so you copy the caption and post it yourself. Only the AI writing step costs credits.
const crypto = require('crypto');
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');
const { getOpenAIClient } = require('../../core/openaiClient');
const store = require('../../core/shopStore');

const router = express.Router();
const TOOL = 'social-posts';
const MODEL = 'gpt-4o-mini';
const MAX_POSTS = 100;
const PLATFORMS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', x: 'X', pinterest: 'Pinterest', linkedin: 'LinkedIn' };
const TONES = ['friendly', 'playful', 'professional', 'urgent'];
const PRODUCT = /^gid:\/\/shopify\/Product\/\d+$/;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const bad = (res, error) => res.status(400).json({ ok: false, error });
const load = (shop) => store.read(TOOL, shop, []);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const productFields = 'id title handle onlineStoreUrl description featuredImage{ url } priceRangeV2{ minVariantPrice{ amount currencyCode } }';
const shape = (p) => ({ id: p.id, title: p.title, url: p.onlineStoreUrl || '', image: p.featuredImage ? p.featuredImage.url : '', description: String(p.description || '').slice(0, 400), price: p.priceRangeV2 ? `${p.priceRangeV2.minVariantPrice.currencyCode} ${Number(p.priceRangeV2.minVariantPrice.amount).toFixed(2)}` : '' });

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, `{ products(first:30, sortKey:UPDATED_AT, reverse:true, query:"status:active"){ nodes{ ${productFields} } } }`);
  res.json({ ok: true, products: d.products.nodes.map(shape), platforms: PLATFORMS, tones: TONES });
}));

router.post('/write', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (!PRODUCT.test(String(b.productId || ''))) return bad(res, 'Choose a product first.');
  if (!PLATFORMS[b.platform]) return bad(res, 'Choose a platform.');
  const tone = TONES.includes(b.tone) ? b.tone : 'friendly';
  const d = await gql(shop, token, `query($id:ID!){ product(id:$id){ ${productFields} } }`, { id: b.productId });
  if (!d.product) return res.status(404).json({ ok: false, error: 'That product was not found in your store.' });
  const p = shape(d.product);
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not available right now. You can still write a post by hand and save it.' });
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.7, max_tokens: 300,
    messages: [{ role: 'user', content: `Write one ${PLATFORMS[b.platform]} post in a ${tone} tone for a Shopify shop. Use only these facts, do not invent discounts, reviews, stock levels or claims.\nProduct: ${p.title}\nPrice: ${p.price}\nDescription: ${p.description}\nLink: ${p.url || '(no link yet)'}\nFit the usual length for ${PLATFORMS[b.platform]}, add a few fitting hashtags where the platform uses them, and include the link if there is one. Return only the post text.` }],
  });
  const text = String(resp.choices[0].message.content || '').trim().slice(0, 1500);
  if (text.length < 20) return res.status(502).json({ ok: false, error: 'AI did not return a usable post. Try again, you were not charged.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'social-post' });
  res.json({ ok: true, text, product: { id: p.id, title: p.title, url: p.url, image: p.image } });
}));

router.get('/posts', withShop(async (req, res, { shop }) => {
  const posts = load(shop).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  res.json({ ok: true, posts, max: MAX_POSTS });
}));

router.post('/posts', withShop(async (req, res, { shop }) => {
  const b = req.body || {};
  const text = String(b.text || '').trim().slice(0, 1500);
  if (text.length < 3) return bad(res, 'Write the post text first.');
  if (!PLATFORMS[b.platform]) return bad(res, 'Choose a platform.');
  const date = String(b.date || '');
  if (date && (!DATE.test(date) || Number.isNaN(Date.parse(date)))) return bad(res, 'Use a valid date.');
  const posts = load(shop);
  if (posts.length >= MAX_POSTS) return bad(res, `You can keep up to ${MAX_POSTS} posts. Delete old ones first.`);
  const post = { id: crypto.randomUUID(), platform: b.platform, text, date, product: String(b.product || '').slice(0, 120), done: false, createdAt: new Date().toISOString() };
  posts.push(post);
  store.write(TOOL, shop, posts);
  res.json({ ok: true, post });
}));

router.patch('/posts/:id', withShop(async (req, res, { shop }) => {
  const posts = load(shop);
  const p = posts.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'Post not found.' });
  const b = req.body || {};
  if (b.done !== undefined) p.done = !!b.done;
  if (b.date !== undefined) {
    if (b.date && (!DATE.test(b.date) || Number.isNaN(Date.parse(b.date)))) return bad(res, 'Use a valid date.');
    p.date = b.date;
  }
  if (b.text !== undefined) {
    const t = String(b.text).trim().slice(0, 1500);
    if (t.length < 3) return bad(res, 'The post text cannot be empty.');
    p.text = t;
  }
  store.write(TOOL, shop, posts);
  res.json({ ok: true, post: p });
}));

router.delete('/posts/:id', withShop(async (req, res, { shop }) => {
  const posts = load(shop);
  const next = posts.filter((x) => x.id !== req.params.id);
  if (next.length === posts.length) return res.status(404).json({ ok: false, error: 'Post not found.' });
  store.write(TOOL, shop, next);
  res.json({ ok: true });
}));

module.exports = router;
