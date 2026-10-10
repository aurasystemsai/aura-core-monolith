'use strict';

// Remembers what a product looked like before AI text was pushed to it, so the push can be undone.
const crypto = require('crypto');
const shopTokens = require('./shopTokens');
const store = require('./shopStore');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const TOOL = 'product-seo-history';
const CAP = 100;
const numericId = (id) => String(id).replace(/^gid:\/\/shopify\/Product\//, '');
const headers = (token) => ({ 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token });

async function gql(shop, token, query, variables) {
  const r = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, { method: 'POST', headers: headers(token), body: JSON.stringify({ query, variables }) });
  if (!r.ok) throw new Error(`Shopify request failed (${r.status})`);
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error(j.errors.map((e) => e.message).join('; '));
  return j.data;
}

async function snapshot(shop, productId) {
  const token = shopTokens.getToken(shop);
  if (!token) throw new Error('Shopify is not connected.');
  const id = numericId(productId);
  const r = await fetch(`https://${shop}/admin/api/${API_VERSION}/products/${id}.json?fields=id,title,body_html,tags,handle`, { headers: headers(token) });
  if (!r.ok) throw new Error(`Could not read the product (${r.status})`);
  const { product } = await r.json();
  const d = await gql(shop, token, 'query($id:ID!){ product(id:$id){ seo{ title description } } }', { id: `gid://shopify/Product/${id}` });
  const seo = (d.product && d.product.seo) || {};
  return { title: product.title || '', body_html: product.body_html || '', tags: product.tags || '', handle: product.handle || '', seoTitle: seo.title || '', metaDescription: seo.description || '' };
}

function record(shop, productId, before, fields) {
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), productId: numericId(productId), before, changed: Object.keys(fields).filter((k) => fields[k]), reverted: false };
  store.pushCapped(TOOL, shop, entry, CAP);
  return entry;
}

const history = (shop) => store.read(TOOL, shop, []);

async function undo(shop, entryId) {
  const list = history(shop);
  const entry = list.find((e) => e.id === entryId);
  if (!entry) throw Object.assign(new Error('Change not found.'), { status: 404 });
  if (entry.reverted) throw Object.assign(new Error('That change was already undone.'), { status: 400 });
  const token = shopTokens.getToken(shop);
  if (!token) throw Object.assign(new Error('Shopify is not connected.'), { status: 401 });
  const b = entry.before;
  const put = await fetch(`https://${shop}/admin/api/${API_VERSION}/products/${entry.productId}.json`, {
    method: 'PUT', headers: headers(token),
    body: JSON.stringify({ product: { id: entry.productId, title: b.title, body_html: b.body_html, tags: b.tags, handle: b.handle } }),
  });
  if (!put.ok) throw new Error(`Could not undo (${put.status})`);
  const d = await gql(shop, token, 'mutation($product:ProductUpdateInput!){ productUpdate(product:$product){ userErrors{ message } } }', {
    product: { id: `gid://shopify/Product/${entry.productId}`, seo: { title: b.seoTitle || null, description: b.metaDescription || null } },
  });
  const errs = (d.productUpdate && d.productUpdate.userErrors) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join('; '));
  entry.reverted = true; entry.revertedAt = new Date().toISOString();
  store.write(TOOL, shop, list);
  return entry;
}

module.exports = { snapshot, record, history, undo };
