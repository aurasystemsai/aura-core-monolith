/**
 * GDPR mandatory webhooks, called by Shopify's infrastructure (no session auth).
 * Every request must carry a valid HMAC signature over the raw body, otherwise it is rejected with 401.
 * Docs: https://shopify.dev/docs/apps/build/privacy-law-compliance
 */
const express = require('express');
const crypto = require('crypto');
const privacy = require('../core/dataPrivacy');
const shopTokens = require('../core/shopTokens');

const router = express.Router();

function verifyShopifyWebhook(req) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_CLIENT_SECRET || '';
  if (!hmac || !secret || !req.rawBody) return false;
  const digest = crypto.createHmac('sha256', secret).update(req.rawBody).digest();
  const given = Buffer.from(String(hmac), 'base64');
  return given.length === digest.length && crypto.timingSafeEqual(digest, given);
}

function guard(handler) {
  return (req, res) => {
    if (!verifyShopifyWebhook(req)) return res.status(401).json({ ok: false, error: 'Invalid webhook signature.' });
    try { handler(req, res); } catch (err) {
      console.error('[GDPR] handler error:', err.message);
      res.status(500).json({ ok: false, error: 'Failed to process request.' });
    }
  };
}
const shopOf = (req) => String((req.body && req.body.shop_domain) || req.headers['x-shopify-shop-domain'] || '');

// Reports which stored records mention the customer. Shopify's merchant sends the data on to the customer.
router.post('/customers/data-request', guard((req, res) => {
  const found = privacy.exportCustomer(shopOf(req), req.body.customer);
  console.log(`[GDPR] customers/data-request shop=${shopOf(req)} records=${found.reduce((n, f) => n + f.records, 0)}`);
  res.status(200).json({ acknowledged: true, data_held: found.length > 0, locations: found });
}));

router.post('/customers/redact', guard((req, res) => {
  const found = privacy.redactCustomer(shopOf(req), req.body.customer);
  console.log(`[GDPR] customers/redact shop=${shopOf(req)} records=${found.reduce((n, f) => n + f.records, 0)}`);
  res.status(200).json({ acknowledged: true, redacted: found });
}));

router.post('/shop/redact', guard((req, res) => {
  const shop = shopOf(req);
  const files = privacy.deleteShopData(shop);
  const token = shopTokens.removeToken(shop);
  console.log(`[GDPR] shop/redact shop=${shop} files=${files} token=${token}`);
  res.status(200).json({ acknowledged: true, files_deleted: files, token_removed: token });
}));

module.exports = router;
module.exports._verify = verifyShopifyWebhook;