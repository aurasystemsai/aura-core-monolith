'use strict';

function getShopifyConfig(env = process.env) {
  return {
    clientId: env.SHOPIFY_CLIENT_ID || env.SHOPIFY_API_KEY || '',
    clientSecret: env.SHOPIFY_CLIENT_SECRET || env.SHOPIFY_API_SECRET || '',
    appUrl: env.HOST_URL || env.SHOPIFY_APP_URL || env.APP_URL || env.RENDER_EXTERNAL_URL || '',
    scopes: env.SHOPIFY_SCOPES || 'read_products,write_products',
  };
}

function isValidShopDomain(shop) {
  return typeof shop === 'string' && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop);
}

function verifyOAuthHmac(query, secret) {
  if (!secret || !query?.hmac) return false;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === 'hmac' || key === 'signature' || value == null) continue;
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, String(entry));
  }
  const message = [...params.entries()]
    .sort(([keyA, valueA], [keyB, valueB]) => keyA.localeCompare(keyB) || valueA.localeCompare(valueB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const expected = require('crypto').createHmac('sha256', secret).update(message).digest();
  const suppliedHex = String(query.hmac);
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  const supplied = Buffer.from(suppliedHex, 'hex');
  return supplied.length === expected.length && require('crypto').timingSafeEqual(supplied, expected);
}

module.exports = { getShopifyConfig, isValidShopDomain, verifyOAuthHmac };