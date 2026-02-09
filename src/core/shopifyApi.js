// src/core/shopifyApi.js
// Shopify API helpers for analytics endpoints
// Use global fetch (Node 18+) to avoid ESM/require conflicts in tests
const fetch = (...args) => globalThis.fetch(...args);
const { getToken } = require('./shopTokens');
const storageJson = require('./storageJson');

function resolveToken(shop, tokenOverride = null) {
  return tokenOverride
    || getToken(shop)
    || process.env.SHOPIFY_ACCESS_TOKEN
    || process.env.SHOPIFY_ADMIN_API_TOKEN
    || process.env.SHOPIFY_API_TOKEN
    || process.env.SHOPIFY_ADMIN_TOKEN
    || null;
}

async function getFxRates() {
  return storageJson.get('fx-rates', {});
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function shopifyRequest(shop, endpoint, params = {}, tokenOverride = null) {
  const token = resolveToken(shop, tokenOverride);
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
  const text = await resp.text();
  const json = text ? JSON.parse(text) : {};
  if (!resp.ok) {
    const err = new Error(`Shopify fetch failed (${resp.status}) for ${endpoint}: ${text}`);
    err.status = resp.status;
    err.body = text;
    err.endpoint = endpoint;
    err.url = url;
    throw err;
  }
  return { json, headers: resp.headers };
}

async function shopifyFetch(shop, endpoint, params = {}, tokenOverride = null) {
  const { json } = await shopifyRequest(shop, endpoint, params, tokenOverride);
  return json;
}

function parseLinkHeader(linkHeader) {
  if (!linkHeader) return null;
  const parts = linkHeader.split(',');
  for (const p of parts) {
    const match = p.match(/<([^>]+)>; rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function shopifyFetchPaginated(shop, endpoint, params = {}, tokenOverride = null, options = {}) {
  const {
    maxPages = 40,
    rateLimitThreshold = 0.8,
    rateLimitSleepMs = 800,
    onPage = null,
  } = options;

  const token = resolveToken(shop, tokenOverride);
  if (!token) throw new Error('No Shopify token for shop: ' + shop);
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
  const base = `https://${shop}/admin/api/${apiVersion}/${endpoint}`;
  let nextUrl = null;
  let page = 0;
  let aggregated = [];
  let lastHeaders = null;
  let lastStatus = null;
  let queryParams = { ...params };
  if (!queryParams.limit) queryParams.limit = 250;

  while (page < maxPages) {
    const url = nextUrl || `${base}?${new URLSearchParams(queryParams).toString()}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
    });
    lastHeaders = resp.headers;
    lastStatus = resp.status;
    const text = await resp.text();
    const json = text ? JSON.parse(text) : {};
    if (!resp.ok) {
      const err = new Error(`Shopify fetch failed (${resp.status}) for ${endpoint}: ${text}`);
      err.status = resp.status;
      err.body = text;
      err.endpoint = endpoint;
      err.url = url;
      throw err;
    }

    // Infer primary payload key from endpoint (e.g., orders.json -> orders)
    const key = endpoint.replace(/\.json.*$/, '').split('/').pop();
    const pageItems = json[key] || [];
    aggregated = aggregated.concat(pageItems);
    page += 1;
    if (typeof onPage === 'function') {
      await onPage({ page, items: pageItems, headers: resp.headers });
    }

    const link = parseLinkHeader(resp.headers.get('link'));
    if (!link) break;
    nextUrl = link;

    // Rate limit awareness
    const bucket = resp.headers.get('x-shopify-shop-api-call-limit');
    if (bucket) {
      const [usedStr, totalStr] = bucket.split('/');
      const used = Number(usedStr || 0);
      const total = Number(totalStr || 80);
      if (total && used / total >= rateLimitThreshold) {
        await sleep(rateLimitSleepMs);
      }
    }
  }

  return { items: aggregated, headers: lastHeaders, status: lastStatus };
}

async function shopifyUpdate(shop, endpoint, data, tokenOverride = null, method = 'PUT') {
  const token = resolveToken(shop, tokenOverride);
  if (!token) throw new Error('No Shopify token for shop: ' + shop);
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
  const url = `https://${shop}/admin/api/${apiVersion}/${endpoint}`;
  
  const resp = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify(data),
  });
  
  const text = await resp.text();
  const json = text ? JSON.parse(text) : {};
  
  if (!resp.ok) {
    const err = new Error(`Shopify update failed (${resp.status}) for ${endpoint}: ${text}`);
    err.status = resp.status;
    err.body = text;
    err.endpoint = endpoint;
    err.url = url;
    throw err;
  }
  
  return { json, headers: resp.headers, status: resp.status };
}

module.exports = { shopifyFetch, shopifyFetchPaginated, shopifyRequest, shopifyUpdate };