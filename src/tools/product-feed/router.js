// Product Feed: checks every active product against what Google Shopping (Merchant Center) needs, exports a
// ready-to-upload feed built from your real Shopify data, and (when you ask) has AI rewrite a weak title or
// description. Nothing changes in Shopify until you press Apply; every change is logged and can be undone.
const express = require('express');
const crypto = require('crypto');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { gql } = require('../../core/seoStoreData');
const store = require('../../core/shopStore');

const router = express.Router();
const MODEL = 'gpt-4o-mini';
const TOOL = 'product-feed';
const LOG = 'feed-log';
const PAGE = 50;
const MAX_PAGES = 20;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const QUERY = `query($first:Int!,$after:String){
  shop{ currencyCode }
  products(first:$first, after:$after, query:"status:active"){
    pageInfo{hasNextPage endCursor}
    nodes{ id title handle descriptionHtml vendor productType onlineStoreUrl
      media(first:1){ nodes{ ... on MediaImage{ image{ url } } } }
      variants(first:50){ nodes{ id title sku barcode price inventoryQuantity inventoryPolicy } } } } }`;

async function loadProducts(shop, token, maxPages) {
  const products = []; let after = null; let currency = 'GBP'; let more = false;
  for (let i = 0; i < maxPages; i++) {
    const d = await gql(shop, token, QUERY, { first: PAGE, after });
    currency = d.shop.currencyCode || currency;
    products.push(...d.products.nodes);
    more = d.products.pageInfo.hasNextPage;
    if (!more) break;
    after = d.products.pageInfo.endCursor;
  }
  return { products, currency, more };
}

const plain = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const PROMO = /\b(free shipping|sale|% ?off|best price|cheap(est)?|buy now|limited offer|#1)\b/i;

// Problems Google Merchant Center rejects ("error") or ranks lower for ("warn"), each with a plain fix.
function audit(p) {
  const issues = [];
  const add = (level, code, msg) => issues.push({ level, code, msg });
  const title = String(p.title || '').trim();
  const desc = plain(p.descriptionHtml);
  const variants = (p.variants && p.variants.nodes) || [];
  const image = p.media && p.media.nodes && p.media.nodes[0] && p.media.nodes[0].image;
  if (!image) add('error', 'no-image', 'No product image. Google needs at least one.');
  if (!p.onlineStoreUrl) add('error', 'no-link', 'Not on your Online Store, so there is no product page to link to.');
  if (!desc) add('error', 'no-description', 'No description.');
  else if (desc.length < 150) add('warn', 'short-description', `Description is only ${desc.length} characters. Aim for 150 or more.`);
  if (title.length < 25) add('warn', 'short-title', `Title is short (${title.length} characters). Add the type, colour, size or material.`);
  if (title.length > 150) add('error', 'long-title', 'Title is over the 150 character limit.');
  if (title.length > 5 && title === title.toUpperCase()) add('warn', 'caps-title', 'Title is all capitals, which Google can reject.');
  if (PROMO.test(title) || PROMO.test(desc.slice(0, 300))) add('warn', 'promo-text', 'Promotional wording (sale, free shipping...) is not allowed in titles or descriptions.');
  if (!String(p.vendor || '').trim()) add('warn', 'no-brand', 'No brand (vendor).');
  if (!variants.some((v) => String(v.barcode || '').trim())) add('warn', 'no-gtin', 'No barcode (GTIN). Products with one perform better.');
  if (variants.some((v) => !(Number(v.price) > 0))) add('error', 'bad-price', 'A variant has no price.');
  if (!String(p.productType || '').trim()) add('info', 'no-type', 'No product type, which helps categorise it.');
  const score = Math.max(0, 100 - issues.reduce((n, i) => n + (i.level === 'error' ? 30 : i.level === 'warn' ? 10 : 3), 0));
  return { id: p.id, title, handle: p.handle, vendor: p.vendor || '', image: image ? image.url : '', issues, score, ready: !issues.some((i) => i.level === 'error') };
}

router.get('/audit', withShop(async (req, res, { shop, token }) => {
  const { products, more } = await loadProducts(shop, token, MAX_PAGES);
  const rows = products.map(audit).sort((a, b) => a.score - b.score);
  const count = (lvl) => rows.filter((r) => r.issues.some((i) => i.level === lvl)).length;
  res.json({
    ok: true, products: rows, truncated: more,
    summary: {
      total: rows.length, ready: rows.filter((r) => r.ready).length, withErrors: count('error'), withWarnings: count('warn'),
      average: rows.length ? Math.round(rows.reduce((n, r) => n + r.score, 0) / rows.length) : 0,
    },
    ai: !!getOpenAIClient(),
  });
}));

const money = (v, cur) => `${Number(v).toFixed(2)} ${cur}`;
const cell = (s) => String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ').trim();

// Tab-separated feed in Google's column names, one row per variant. Products that cannot pass (no image,
// link, description or price) are left out and counted so the merchant knows why.
function buildFeed(products, currency) {
  const cols = ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price', 'brand', 'gtin', 'mpn', 'condition', 'product_type', 'item_group_id'];
  const lines = [cols.join('\t')]; let skipped = 0; let rows = 0;
  for (const p of products) {
    if (audit(p).issues.some((i) => i.level === 'error')) { skipped++; continue; }
    const image = p.media.nodes[0].image.url;
    const desc = plain(p.descriptionHtml).slice(0, 5000);
    for (const v of p.variants.nodes) {
      const inStock = v.inventoryPolicy === 'CONTINUE' || Number(v.inventoryQuantity) > 0;
      const sep = p.onlineStoreUrl.includes('?') ? '&' : '?';
      const vid = String(v.id).split('/').pop();
      const title = p.variants.nodes.length > 1 && v.title && v.title !== 'Default Title' ? `${p.title} - ${v.title}` : p.title;
      lines.push([
        vid, title.slice(0, 150), desc, `${p.onlineStoreUrl}${sep}variant=${vid}`, image, inStock ? 'in_stock' : 'out_of_stock',
        money(v.price, currency), p.vendor || '', v.barcode || '', v.sku || '', 'new', p.productType || '', String(p.id).split('/').pop(),
      ].map(cell).join('\t'));
      rows++;
    }
  }
  return { text: lines.join('\n') + '\n', skipped, rows };
}

router.get('/export', withShop(async (req, res, { shop, token }) => {
  const { products, currency } = await loadProducts(shop, token, MAX_PAGES);
  const f = buildFeed(products, currency);
  res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="aura-product-feed.tsv"');
  res.setHeader('X-Feed-Rows', String(f.rows));
  res.setHeader('X-Feed-Skipped', String(f.skipped));
  res.send(f.text);
}));

const GID = /^gid:\/\/shopify\/Product\/\d+$/;

// Suggests a better title and description for one product. Charged only when AI really answers.
router.post('/suggest', withShop(async (req, res, { shop, token }) => {
  const client = getOpenAIClient();
  if (!client) return res.status(503).json({ ok: false, error: 'AI is not configured on this server.' });
  const id = String((req.body && req.body.id) || '');
  if (!GID.test(id)) return res.status(400).json({ ok: false, error: 'Choose a product.' });
  const d = await gql(shop, token, 'query($id:ID!){ product(id:$id){ id title descriptionHtml vendor productType tags } }', { id });
  const p = d.product;
  if (!p) return res.status(404).json({ ok: false, error: 'That product was not found.' });
  let out;
  try {
    const resp = await client.chat.completions.create({
      model: MODEL, temperature: 0.3, max_tokens: 500, response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You write product listings for Google Shopping. Use only facts present in the input; never invent materials, sizes, brands, certifications or claims. No promotional words (sale, free shipping, best). Title: under 150 characters, starts with the main product type, includes brand, colour or material only if given. Description: plain text, 150 to 500 characters, factual. Reply as JSON {"title":"...","description":"..."}.' },
        { role: 'user', content: JSON.stringify({ title: p.title, description: plain(p.descriptionHtml).slice(0, 1500), brand: p.vendor, type: p.productType, tags: (p.tags || []).slice(0, 15) }) },
      ],
    });
    out = JSON.parse(resp.choices[0].message.content);
  } catch (e) {
    return res.status(502).json({ ok: false, error: `AI could not write a suggestion: ${e.message}` });
  }
  const title = String(out.title || '').replace(/\s+/g, ' ').trim().slice(0, 150);
  const description = String(out.description || '').replace(/\s+/g, ' ').trim().slice(0, 1000);
  if (!title || !description) return res.status(502).json({ ok: false, error: 'AI returned an incomplete suggestion. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: MODEL, action: 'product-description' });
  res.json({ ok: true, id, current: { title: p.title, description: plain(p.descriptionHtml) }, suggestion: { title, description } });
}));

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  if (!GID.test(String(b.id || ''))) return res.status(400).json({ ok: false, error: 'Choose a product.' });
  const title = String(b.title || '').trim();
  const description = String(b.description || '').trim();
  if (!title || title.length > 255) return res.status(400).json({ ok: false, error: 'Title must be 1 to 255 characters.' });
  if (!description || description.length > 5000) return res.status(400).json({ ok: false, error: 'Description must be 1 to 5000 characters.' });
  const cur = await gql(shop, token, 'query($id:ID!){ product(id:$id){ id title descriptionHtml } }', { id: b.id });
  if (!cur.product) return res.status(404).json({ ok: false, error: 'That product was not found.' });
  const html = `<p>${esc(description)}</p>`;
  const d = await gql(shop, token, 'mutation($input:ProductInput!){ productUpdate(input:$input){ product{ id } userErrors{ message } } }', { input: { id: b.id, title, descriptionHtml: html } });
  const errs = d.productUpdate.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), productId: b.id, fromTitle: cur.product.title, fromHtml: cur.product.descriptionHtml || '', toTitle: title, reverted: false };
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
  const d = await gql(shop, token, 'mutation($input:ProductInput!){ productUpdate(input:$input){ product{ id } userErrors{ message } } }', { input: { id: entry.productId, title: entry.fromTitle, descriptionHtml: entry.fromHtml } });
  const errs = d.productUpdate.userErrors || [];
  if (errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  entry.reverted = true; entry.revertedAt = new Date().toISOString();
  store.write(TOOL, shop, data);
  res.json({ ok: true, entry });
}));

module.exports = router;
module.exports._audit = audit;
module.exports._buildFeed = buildFeed;