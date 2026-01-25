// src/core/shopifyApi.js
// Shopify API helpers for analytics endpoints
// Use global fetch (Node 18+) to avoid ESM/require conflicts in tests
const fetch = (...args) => globalThis.fetch(...args);
const { getToken } = require('./shopTokens');

async function shopifyFetch(shop, endpoint, params = {}, tokenOverride = null) {
  const token = tokenOverride
    || getToken(shop)
    || process.env.SHOPIFY_ACCESS_TOKEN
    || process.env.SHOPIFY_ADMIN_API_TOKEN
    || process.env.SHOPIFY_API_TOKEN
    || process.env.SHOPIFY_ADMIN_TOKEN
    || process.env.SHOPIFY_CLIENT_SECRET
    || null;
  if (!token) throw new Error('No Shopify token for shop: ' + shop);
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
  let url = `https://${shop}/admin/api/${apiVersion}/${endpoint}`;
  if (params && Object.keys(params).length) {
    const usp = new URLSearchParams(params);
    url += `?${usp.toString()}`;
  }
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`Shopify fetch failed (${resp.status}) for ${endpoint}: ${text}`);
    err.status = resp.status;
    err.body = text;
    err.endpoint = endpoint;
    err.url = url;
    throw err;
  }
  return await resp.json();
}

module.exports = { shopifyFetch };