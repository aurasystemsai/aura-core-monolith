// Shopify JWT session token verification middleware for embedded app
// Place this in src/middleware/verifyShopifySession.js

const { shopifyApi, LATEST_API_VERSION } = require('@shopify/shopify-api');

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

module.exports = async function verifyShopifySession(req, res, next) {
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
