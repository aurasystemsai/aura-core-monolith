// Shopify JWT session token verification middleware for embedded app
// Place this in src/middleware/verifyShopifySession.js

const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');
const { shopifyApiAdapterNode } = require('@shopify/shopify-api/adapters/node');

// NOTE: These use your current Render.com env variable names.
// For best practice, consider renaming to Shopify's latest convention in the future.
const hostName = process.env.SHOPIFY_APP_URL
  ? process.env.SHOPIFY_APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : (process.env.NODE_ENV === 'test' ? 'test-shop.myshopify.com' : undefined);

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_CLIENT_ID || (process.env.NODE_ENV === 'test' ? 'test_key' : undefined), // Render.com: SHOPIFY_CLIENT_ID
  apiSecretKey: process.env.SHOPIFY_CLIENT_SECRET || (process.env.NODE_ENV === 'test' ? 'test_secret' : undefined), // Render.com: SHOPIFY_CLIENT_SECRET
  hostName, // Render.com: SHOPIFY_APP_URL
  apiVersion: process.env.SHOPIFY_API_VERSION || LATEST_API_VERSION, // Add SHOPIFY_API_VERSION to Render.com for explicit versioning
  isEmbeddedApp: true,
  adapter: shopifyApiAdapterNode,
});

module.exports = async function verifyShopifySession(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
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
    req.path.startsWith('/image-alt-media-seo')
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
