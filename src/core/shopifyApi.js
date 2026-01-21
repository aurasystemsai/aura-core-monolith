// src/core/shopifyApi.js
// Shopify API helpers for analytics endpoints
const fetch = require('node-fetch');
const { getToken } = require('./shopTokens');

async function shopifyFetch(shop, endpoint, params = {}) {
  const token = getToken(shop);
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
    throw new Error(`Shopify fetch failed: ${text}`);
  }
  return await resp.json();
}

module.exports = { shopifyFetch };