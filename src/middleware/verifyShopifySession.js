// Shopify JWT session token verification middleware for embedded app
// Place this in src/middleware/verifyShopifySession.js

const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { shopifyApiAdapterNode } = require('@shopify/shopify-api/adapters/node');
const { getShopifyConfig, isValidShopDomain } = require('../core/shopifyConfig');
const shopTokens = require('../core/shopTokens');

const shopifyConfig = getShopifyConfig();

// NOTE: These use your current Render.com env variable names.
// For best practice, consider renaming to Shopify's latest convention in the future.
const hostName = shopifyConfig.appUrl
  ? shopifyConfig.appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : (process.env.NODE_ENV === 'test' ? 'test-shop.myshopify.com' : 'localhost');

let shopify = null;
try {
  shopify = shopifyApi({
    apiKey: shopifyConfig.clientId || (process.env.NODE_ENV === 'test' ? 'test_key' : 'dev_placeholder_key'),
    apiSecretKey: shopifyConfig.clientSecret || (process.env.NODE_ENV === 'test' ? 'test_secret' : 'dev_placeholder_secret'),
    hostName,
    apiVersion: process.env.SHOPIFY_API_VERSION || LATEST_API_VERSION,
    isEmbeddedApp: true,
    adapter: shopifyApiAdapterNode,
  });
} catch (e) {
  console.warn('[verifyShopifySession] Shopify API init failed (missing env vars) — JWT verification disabled:', e.message);
}

module.exports = async function verifyShopifySession(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  if (process.env.NODE_ENV !== 'production' && (!shopifyConfig.clientId || !shopifyConfig.clientSecret)) {
    return next();
  }
  if (process.env.NODE_ENV !== 'production' && process.env.SHOPIFY_DEV_AUTH_BYPASS === 'true') {
    const shop = req.headers['x-shopify-shop-domain'] || req.query?.shop;
    if (!isValidShopDomain(shop)) return res.status(400).json({ ok: false, error: 'Valid shop domain required' });
    if (!shopTokens.getToken(shop)) return res.status(401).json({ ok: false, error: 'Shopify store is not connected' });
    req.shopify = { dest: shop };
    return next();
  }
  // If Shopify API failed to init (missing env vars in local dev), skip auth
  if (!shopify) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ ok: false, error: 'Shopify session verification is not configured' });
    }
    return next();
  }
  // Only the session-context probe is public; every other /api route needs a verified token.
  if (req.path === '/session') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('Unauthorized: No Authorization header');
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = await shopify.session.decodeSessionToken(token);
    req.shopify = payload;
    let verified = '';
    try { verified = new URL(payload.dest).hostname.toLowerCase(); } catch { /* malformed dest */ }
    if (!verified) return res.status(401).send('Invalid Shopify session token');
    const claimed = [req.headers['x-shopify-shop-domain'], req.query && req.query.shop, req.body && req.body.shop]
      .filter((v) => typeof v === 'string' && v);
    if (claimed.some((v) => v.toLowerCase() !== verified)) {
      return res.status(403).json({ ok: false, error: 'Shop does not match session' });
    }
    req.headers['x-shopify-shop-domain'] = verified;
    next();
  } catch (e) {
    res.status(401).send('Invalid Shopify session token');
  }
};
