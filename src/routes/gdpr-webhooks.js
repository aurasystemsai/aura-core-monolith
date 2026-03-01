/**
 * GDPR Mandatory Webhooks
 * Shopify requires these three endpoints for ALL apps in the App Store.
 * They are registered via shopify.app.toml and called by Shopify's infrastructure.
 *
 * Docs: https://shopify.dev/docs/apps/build/privacy-law-compliance
 */

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// Verify the request came from Shopify using HMAC signature
function verifyShopifyWebhook(req) {
  const hmac     = req.headers['x-shopify-hmac-sha256'];
  const secret   = process.env.SHOPIFY_API_SECRET || '';
  if (!hmac || !secret) return false;
  const body     = req.rawBody || JSON.stringify(req.body);
  const digest   = crypto.createHmac('sha256', secret).update(body).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

/**
 * POST /api/webhooks/customers/data-request
 * Shopify is asking what data we hold for a specific customer.
 * Blog SEO Engine does not store customer PII — we only store blog post metadata
 * keyed by shop domain, not by customer ID.
 */
router.post('/customers/data-request', express.json({ type: '*/*' }), (req, res) => {
  // Log for audit trail — do not expose in production logs
  const shop = req.headers['x-shopify-shop-domain'] || 'unknown';
  console.log(`[GDPR] customers/data-request from shop: ${shop}`);

  // We hold no customer PII — respond 200 to confirm receipt
  res.status(200).json({ acknowledged: true, data_held: false });
});

/**
 * POST /api/webhooks/customers/redact
 * Shopify is requesting we delete data for a specific customer.
 * We hold no customer PII so nothing to delete.
 */
router.post('/customers/redact', express.json({ type: '*/*' }), (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'unknown';
  console.log(`[GDPR] customers/redact from shop: ${shop}`);
  res.status(200).json({ acknowledged: true });
});

/**
 * POST /api/webhooks/shop/redact
 * The merchant has uninstalled the app — delete all their data.
 * Blog SEO Engine stores: scan history, keyword research, content briefs (in-memory
 * until Step 4 adds SQLite — once SQLite is added, delete rows WHERE shop = ?).
 */
router.post('/shop/redact', express.json({ type: '*/*' }), async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || req.body?.shop_domain || 'unknown';
  console.log(`[GDPR] shop/redact for shop: ${shop}`);

  try {
    // Remove stored OAuth token for this shop
    const shopTokens = require('../core/shopTokens');
    if (shopTokens.removeToken) {
      shopTokens.removeToken(shop);
    }

    // Once SQLite persistence is added (Step 4), this is where we run:
    //   db.prepare('DELETE FROM scan_history WHERE shop = ?').run(shop);
    //   db.prepare('DELETE FROM keyword_research WHERE shop = ?').run(shop);
    //   db.prepare('DELETE FROM content_briefs WHERE shop = ?').run(shop);

    console.log(`[GDPR] shop/redact complete for shop: ${shop}`);
    res.status(200).json({ acknowledged: true });
  } catch (err) {
    console.error(`[GDPR] shop/redact error for ${shop}:`, err.message);
    // Still return 200 — Shopify requires 200 or it will retry
    res.status(200).json({ acknowledged: true, warning: 'partial deletion' });
  }
});

module.exports = router;
