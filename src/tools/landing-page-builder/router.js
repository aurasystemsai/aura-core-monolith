// Landing Page Builder: AI drafts a landing page for one of your real products and saves it to Shopify as an
// unpublished Page you can review and publish yourself. The AI's HTML is cleaned to a short list of safe tags
// before it is saved, and the product photo and price come from Shopify, not from the AI.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TOOL = 'landing-page-builder';
const LOG = 'pages';
const ALLOWED = new Set(['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'a', 'div', 'section']);

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Keeps only allowed tags; drops every attribute except a safe href on links; removes script/style bodies.
function sanitizeHtml(html) {
  let h = String(html || '').replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|iframe|object|embed|svg|form)[\s\S]*?<\/\1\s*>/gi, '');
  h = h.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (m, tag, attrs) => {
    const t = tag.toLowerCase();
    if (!ALLOWED.has(t)) return '';
    if (m.startsWith('</')) return `</${t}>`;
    if (t === 'a') {
      const href = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
      const url = href ? (href[1] || href[2] || '').trim() : '';
      return /^(https:\/\/|\/)/i.test(url) ? `<a href="${esc(url)}" rel="noopener">` : '<a>';
    }
    return `<${t}>`;
  });
  return h.trim();
}

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const d = await gql(shop, token, '{ products(first: 50, query: "status:active") { nodes { id title description featuredImage { url(transform:{maxWidth:800}) } priceRangeV2 { minVariantPrice { amount currencyCode } } } } }');
  res.json({ ok: true, products: d.products.nodes.map((p) => ({ id: p.id, title: p.title, summary: clean(p.description, 160), image: p.featuredImage && p.featuredImage.url, price: p.priceRangeV2.minVariantPrice.amount, currency: p.priceRangeV2.minVariantPrice.currencyCode })), ai: !!getOpenAIClient() });
}));

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const b = req.body || {};
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(String(b.productId || ''))) return res.status(400).json({ ok: false, error: 'Choose a product.' });
  const goal = clean(b.goal, 200); const audience = clean(b.audience, 200); const tone = clean(b.tone, 60) || 'friendly';
  const d = await gql(shop, token, 'query($id:ID!){ product(id:$id){ title description featuredImage{ url(transform:{maxWidth:800}) } priceRangeV2{ minVariantPrice{ amount currencyCode } } } }', { id: b.productId });
  const p = d.product;
  if (!p) return res.status(404).json({ ok: false, error: 'That product was not found.' });
  const resp = await client.chat.completions.create({
    model: MODEL, temperature: 0.5, max_tokens: 900, response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You write short landing pages for small online shops. Reply with JSON: {"title": string, "html": string}. The html uses only h1,h2,h3,p,ul,li,strong,em,a tags: a headline, a short intro, 3-5 benefit bullets, and a closing line. Use only facts from the product details given. Do not invent reviews, discounts, awards, stock levels or guarantees. Do not include images or prices; they are added separately.' },
      { role: 'user', content: `Product: ${p.title}\nDetails: ${clean(p.description, 1200) || '(none given)'}\nGoal: ${goal || 'sell this product'}\nAudience: ${audience || 'general shoppers'}\nTone: ${tone}` },
    ],
  });
  let out; try { out = JSON.parse(resp.choices[0].message.content); } catch { return res.status(502).json({ ok: false, error: 'AI returned something unreadable. Try again.' }); }
  const body = sanitizeHtml(out.html);
  if (!body) return res.status(502).json({ ok: false, error: 'AI returned an empty page. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'page-generate' });
  const price = `${Number(p.priceRangeV2.minVariantPrice.amount).toFixed(2)} ${p.priceRangeV2.minVariantPrice.currencyCode}`;
  const img = p.featuredImage && /^https:\/\/cdn\.shopify\.com\//.test(p.featuredImage.url) ? `<p><img src="${esc(p.featuredImage.url)}" alt="${esc(p.title)}" style="max-width:100%;height:auto"></p>` : '';
  res.json({ ok: true, title: clean(out.title, 120) || p.title, html: `${img}${body}<p><strong>From ${esc(price)}</strong></p>`, product: p.title });
}));

router.post('/publish', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const title = clean(b.title, 120);
  if (!title) return res.status(400).json({ ok: false, error: 'Give the page a title.' });
  // The product image is added back after cleaning because only Shopify's CDN is allowed.
  const imgs = [...String(b.html || '').matchAll(/<img src="(https:\/\/cdn\.shopify\.com\/[^"]+)" alt="([^"]*)"/g)].slice(0, 1).map((m) => `<p><img src="${m[1]}" alt="${m[2]}" style="max-width:100%;height:auto"></p>`).join('');
  const text = sanitizeHtml(String(b.html || ''));
  if (!text) return res.status(400).json({ ok: false, error: 'The page is empty.' });
  const body = imgs + text;
  const d = await gql(shop, token, 'mutation($p:PageCreateInput!){ pageCreate(page:$p){ page{ id handle } userErrors{ message } } }', { p: { title, body, isPublished: false } });
  const errs = d.pageCreate.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  const page = d.pageCreate.page;
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), pageId: page.id, handle: page.handle, title };
  const data = store.read(TOOL, shop, {});
  data[LOG] = [entry, ...(data[LOG] || [])].slice(0, 100);
  store.write(TOOL, shop, data);
  const num = page.id.split('/').pop();
  res.json({ ok: true, entry, adminUrl: `https://${shop}/admin/pages/${num}` });
}));

router.get('/pages', withShop(async (req, res, { shop }) => {
  res.json({ ok: true, pages: store.read(TOOL, shop, {})[LOG] || [] });
}));

module.exports = router;
module.exports._sanitize = sanitizeHtml;