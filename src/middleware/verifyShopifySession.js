// Shopify JWT session token verification middleware for embedded app
// Place this in src/middleware/verifyShopifySession.js

const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { shopifyApiAdapterNode } = require('@shopify/shopify-api/adapters/node');

// NOTE: These use your current Render.com env variable names.
// For best practice, consider renaming to Shopify's latest convention in the future.
const hostName = process.env.SHOPIFY_APP_URL
  ? process.env.SHOPIFY_APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : (process.env.NODE_ENV === 'test' ? 'test-shop.myshopify.com' : 'localhost');

let shopify = null;
try {
  shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_CLIENT_ID || (process.env.NODE_ENV === 'test' ? 'test_key' : 'dev_placeholder_key'),
    apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET || (process.env.NODE_ENV === 'test' ? 'test_secret' : 'dev_placeholder_secret'),
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
  // If Shopify API failed to init (missing env vars in local dev), skip auth
  if (!shopify) {
    return next();
  }
  // Allow public for specific endpoints (session context, analytics dashboards, notifications, attribution)
  if (req.path && (
    req.path === '/session' ||
    req.path.startsWith('/analytics') ||
    req.path.startsWith('/notifications') ||
    req.path.startsWith('/advanced-analytics-attribution') ||
    req.path.startsWith('/advanced-ai') ||
    req.path.startsWith('/integration') ||
    req.path.startsWith('/main-suite') ||
    req.path.startsWith('/conditional-logic-automation') ||
    req.path.startsWith('/shopify/products') ||
    req.path.startsWith('/product-seo') ||
    req.path.startsWith('/blog-seo') ||
    req.path.startsWith('/image-alt-media-seo') ||
    req.path.startsWith('/tools/seo-site-crawler') ||
    req.path.startsWith('/ai-visibility-tracker') ||
    req.path.startsWith('/rank-tracker') ||
    req.path.startsWith('/seo') ||
    req.path.startsWith('/keyword-research-suite') ||
    req.path.startsWith('/rank-visibility-tracker') ||
    req.path.startsWith('/on-page-seo-engine') ||
    req.path.startsWith('/technical-seo-auditor') ||
    req.path.startsWith('/schema-rich-results-engine') ||
    req.path.startsWith('/content-scoring-optimization') ||
    req.path.startsWith('/link-intersect-outreach') ||
    req.path.startsWith('/internal-link-optimizer') ||
    req.path.startsWith('/ai-content-brief-generator') ||
    req.path.startsWith('/weekly-blog-content-engine') ||
    req.path.startsWith('/blog-draft-engine') ||
    req.path.startsWith('/abandoned-checkout-winback') ||
    req.path.startsWith('/review-ugc-engine') ||
    req.path.startsWith('/ai-content-image-gen') ||
    req.path.startsWith('/email-automation-builder')
  )) {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('Unauthorized: No Authorization header');
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = await shopify.session.decodeSessionToken(token);
    req.shopify = payload;
    next();
  } catch (e) {
    res.status(401).send('Invalid Shopify session token');
  }
};
