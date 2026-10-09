'use strict';

// AI Shopping Readiness: checks live Shopify products against the fields AI shopping assistants
// (ChatGPT shopping, Google AI Mode) need, and writes an llms.txt file for the store.
// Rule-based and read-only, so it uses no AI and no credits.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql } = require('../../core/seoStoreData');

const router = express.Router();
const PAGE = 50;
const MAX_PAGES = 10;
const MAX_LLMS_PRODUCTS = 100;

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}

const QUERY = `query($first:Int!,$after:String){
  shop{ name currencyCode primaryDomain{ url } }
  products(first:$first, after:$after, query:"status:active"){
    pageInfo{hasNextPage endCursor}
    nodes{ id title handle descriptionHtml vendor productType onlineStoreUrl
      media(first:1){ nodes{ ... on MediaImage{ image{ url } } } }
      variants(first:50){ nodes{ id sku barcode price inventoryQuantity inventoryPolicy } } } } }`;

async function load(shop, token) {
  const products = []; let after = null; let info = {}; let more = false;
  for (let i = 0; i < MAX_PAGES; i++) {
    const d = await gql(shop, token, QUERY, { first: PAGE, after });
    info = d.shop;
    products.push(...d.products.nodes);
    more = d.products.pageInfo.hasNextPage;
    if (!more) break;
    after = d.products.pageInfo.endCursor;
  }
  // Policies need an extra permission; without it the rest of the tool still works.
  try {
    const p = await gql(shop, token, 'query{ shop{ shopPolicies{ type url body } } }');
    info = { ...info, shopPolicies: p.shop.shopPolicies };
  } catch (e) { info = { ...info, shopPolicies: null }; }
  return { products, shop: info, truncated: more };
}

const plain = (html) => String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// The fields the ChatGPT shopping feed requires that a merchant can actually fix.
// The item id and seller name always exist in Shopify.
const REQUIRED = [
  ['title', 'Title'], ['description', 'Description'], ['url', 'Product page link'], ['brand', 'Brand'],
  ['image', 'Image'], ['availability', 'Stock status'], ['price', 'Price'],
];
// Not required, but AI assistants use them to match and rank products.
const HELPFUL = [['gtin', 'Barcode (GTIN)'], ['type', 'Product type'], ['longDescription', 'Description of 150+ characters']];

function inspect(p) {
  const variants = (p.variants && p.variants.nodes) || [];
  const desc = plain(p.descriptionHtml);
  const image = p.media && p.media.nodes && p.media.nodes[0] && p.media.nodes[0].image;
  const has = {
    title: !!String(p.title || '').trim(),
    description: desc.length > 0,
    url: !!p.onlineStoreUrl,
    brand: !!String(p.vendor || '').trim(),
    image: !!image,
    availability: variants.length > 0,
    price: variants.length > 0 && variants.every((v) => Number(v.price) > 0),
    gtin: variants.some((v) => String(v.barcode || '').trim()),
    type: !!String(p.productType || '').trim(),
    longDescription: desc.length >= 150,
  };
  const missingRequired = REQUIRED.filter(([k]) => !has[k]).map(([, label]) => label);
  const missingHelpful = HELPFUL.filter(([k]) => !has[k]).map(([, label]) => label);
  const score = Math.max(0, 100 - missingRequired.length * 20 - missingHelpful.length * 6);
  return { id: p.id, title: p.title, has, missingRequired, missingHelpful, score, ready: missingRequired.length === 0 };
}

function policiesOf(shop) {
  if (!shop || !shop.shopPolicies) return null;
  const list = shop.shopPolicies;
  const find = (t) => list.find((x) => x.type === t && String(x.body || '').trim());
  return {
    refund: !!find('REFUND_POLICY'), shipping: !!find('SHIPPING_POLICY'), privacy: !!find('PRIVACY_POLICY'), terms: !!find('TERMS_OF_SERVICE'),
  };
}

router.get('/scan', withShop(async (req, res, { shop, token }) => {
  const data = await load(shop, token);
  const rows = data.products.map(inspect).sort((a, b) => a.score - b.score);
  const total = rows.length;
  const coverage = {};
  for (const [k, label] of [...REQUIRED, ...HELPFUL]) {
    coverage[k] = { label, count: rows.filter((r) => r.has[k]).length, required: REQUIRED.some(([x]) => x === k) };
  }
  const average = total ? Math.round(rows.reduce((n, r) => n + r.score, 0) / total) : 0;
  res.json({
    ok: true, truncated: data.truncated, total, ready: rows.filter((r) => r.ready).length, average,
    coverage, policies: policiesOf(data.shop), products: rows.slice(0, 100),
  });
}));

// Builds llms.txt: a short plain-text guide to the store for AI assistants. Only public information.
function buildLlms(data, summary) {
  const base = String((data.shop.primaryDomain && data.shop.primaryDomain.url) || '').replace(/\/$/, '');
  const lines = [`# ${data.shop.name || 'Store'}`, ''];
  const intro = String(summary || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (intro) lines.push(`> ${intro}`, '');
  const pol = (data.shop.shopPolicies || []).filter((p) => p.url && String(p.body || '').trim());
  const names = { REFUND_POLICY: 'Refund policy', SHIPPING_POLICY: 'Shipping policy', PRIVACY_POLICY: 'Privacy policy', TERMS_OF_SERVICE: 'Terms of service' };
  const shown = pol.filter((p) => names[p.type]);
  if (shown.length) {
    lines.push('## Policies', '');
    for (const p of shown) lines.push(`- [${names[p.type]}](${p.url})`);
    lines.push('');
  }
  const linked = data.products.filter((p) => p.onlineStoreUrl);
  const items = linked.slice(0, MAX_LLMS_PRODUCTS);
  if (items.length) {
    lines.push('## Products', '');
    for (const p of items) {
      const d = plain(p.descriptionHtml).slice(0, 140);
      lines.push(`- [${String(p.title).replace(/[[\]]/g, '')}](${p.onlineStoreUrl})${d ? `: ${d}` : ''}`);
    }
    lines.push('');
  }
  if (base) lines.push('## Store', '', `- [Home](${base})`, '');
  return { text: lines.join('\n'), productCount: items.length, truncated: linked.length > items.length };
}

router.get('/llms-txt', withShop(async (req, res, { shop, token }) => {
  const data = await load(shop, token);
  res.json({ ok: true, ...buildLlms(data, req.query.summary) });
}));

router.buildLlmsForShop = async (shop, token, summary) => buildLlms(await load(shop, token), summary).text;
router._inspect = inspect;
router._buildLlms = buildLlms;
module.exports = router;
