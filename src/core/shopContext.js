'use strict';

const shopTokens = require('./shopTokens');

const SHOP_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

/** Shop from a signature-verified Shopify session token (set by verifyShopifySession), or null. */
function verifiedShop(req) {
  const dest = req.shopify && req.shopify.dest;
  if (!dest) return null;
  let host = String(dest);
  try { host = new URL(host).hostname; } catch { /* already a bare domain */ }
  host = host.toLowerCase();
  return SHOP_RE.test(host) ? host : null;
}

/**
 * Resolve the authenticated shop and its token for a request.
 * The shop comes from the verified session token when present, otherwise from the OAuth
 * cookie session. In production a bare x-shopify-shop-domain header is never trusted on its own.
 * Never falls back to another shop's token or to a global token.
 * Returns { shop, token } or { error, status }.
 */
function getShopContext(req) {
  const verified = verifiedShop(req);
  const sessionShop = req.session && req.session.shop;
  const requested = (req.headers && req.headers['x-shopify-shop-domain']) || (req.query && req.query.shop) || null;
  const authed = verified || sessionShop || null;
  if (authed && requested && String(authed).toLowerCase() !== String(requested).toLowerCase()) {
    return { status: 403, error: 'The requested shop does not match the authenticated Shopify session.' };
  }
  const shop = authed || (process.env.NODE_ENV === 'production' ? null : requested);
  if (!shop || !SHOP_RE.test(shop)) {
    return { status: 401, error: 'Shopify is not connected. Reconnect the store to continue.' };
  }
  const token = (sessionShop === shop && req.session.shopifyToken) || shopTokens.getToken(shop);
  if (!token) return { status: 401, error: 'Shopify is not connected. Reconnect the store to continue.' };
  return { shop, token };
}
module.exports = { getShopContext, SHOP_RE };
