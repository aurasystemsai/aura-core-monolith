const express = require('express');
const router = express.Router();


// Live analytics endpoints using Shopify API
const { shopifyFetch } = require('../core/shopifyApi');

// Helper: get shop from query/header/session/env (App Bridge adds x-shopify-shop-domain)
function getShop(req) {
  const shop = (req.query.shop
    || req.headers['x-shopify-shop-domain']
    || req.headers['x-shopify-shop']
    || req.session?.shop
    || process.env.SHOPIFY_STORE_URL
    || '').trim();
  if (!shop) throw new Error('Missing shop parameter');
  // Normalize to bare domain (strip protocol/path)
  return shop.replace(/^https?:\/\//, '').replace(/\/.*/, '');
}

router.get('/revenue', async (req, res) => {
  try {
    const shop = getShop(req);
    // Get total sales for current month
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const end = today.toISOString();
    const orders = await shopifyFetch(shop, 'orders.json', {
      status: 'any',
      created_at_min: start,
      created_at_max: end,
      fields: 'total_price',
      limit: 250
    });
    const total = (orders.orders || []).reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    res.json({ value: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const shop = getShop(req);
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const end = today.toISOString();
    const orders = await shopifyFetch(shop, 'orders.json', {
      status: 'any',
      created_at_min: start,
      created_at_max: end,
      fields: 'id',
      limit: 250
    });
    res.json({ value: (orders.orders || []).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const shop = getShop(req);
    const customers = await shopifyFetch(shop, 'customers/count.json');
    res.json({ value: customers.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversion', async (req, res) => {
  try {
    // Shopify does not provide direct conversion rate; placeholder for real calculation
    // You may need to calculate: orders / sessions (sessions from analytics API if available)
    res.json({ value: null, error: 'Conversion rate calculation requires session data. Implement as needed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/traffic', async (req, res) => {
  try {
    // Shopify Analytics API for traffic is only available on Shopify Plus/Advanced
    res.json({ value: null, error: 'Traffic data requires Shopify Analytics API access. Implement as needed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
