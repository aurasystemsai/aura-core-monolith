const express = require('express');
const router = express.Router();
const shopTokens = require('../core/shopTokens');

// Check Shopify connection health
router.get('/shopify/status', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || req.query.shop;
  let connected = false;

  if (shop) {
    const token = shopTokens.getToken ? shopTokens.getToken(shop) : null;
    connected = !!token;
  } else {
    // No specific shop header — check if any shop is authenticated
    const all = shopTokens.loadAll ? shopTokens.loadAll() : {};
    connected = Object.keys(all).length > 0;
  }

  res.json({ connected, ok: true });
});

module.exports = router;
