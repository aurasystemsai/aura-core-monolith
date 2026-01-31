const express = require('express');
const router = express.Router();


// Live analytics endpoints using Shopify API
const { shopifyFetch } = require('../core/shopifyApi');

// Helper: get shop from query/header/session/env or persisted tokens
function getShop(req) {
  const shopTokens = require('../core/shopTokens');
  const fromReq = (req.query.shop
    || req.headers['x-shopify-shop-domain']
    || req.headers['x-shopify-shop']
    || req.session?.shop
    || process.env.SHOPIFY_STORE_URL
    || '').trim();
  if (fromReq) {
    return fromReq.replace(/^https?:\/\//, '').replace(/\/.*/, '');
  }
  // Fallback: if only one persisted shop, use it
  const persistedAll = shopTokens.loadAll?.() || shopTokens._loadAll?.() || null;
  if (persistedAll && typeof persistedAll === 'object') {
    const keys = Object.keys(persistedAll);
    if (keys.length === 1) {
      return keys[0];
    }
  }
  throw new Error('Missing shop parameter');
}

function envTokenNames() {
  return Object.entries({
    SHOPIFY_ACCESS_TOKEN: !!process.env.SHOPIFY_ACCESS_TOKEN,
    SHOPIFY_ADMIN_API_TOKEN: !!process.env.SHOPIFY_ADMIN_API_TOKEN,
    SHOPIFY_API_TOKEN: !!process.env.SHOPIFY_API_TOKEN,
    SHOPIFY_ADMIN_TOKEN: !!process.env.SHOPIFY_ADMIN_TOKEN,
    SHOPIFY_CLIENT_SECRET: !!process.env.SHOPIFY_CLIENT_SECRET,
  }).filter(([, present]) => present).map(([name]) => name);
}

// Resolve token with fallbacks: session -> persisted -> env
function resolveToken(req, shop) {
  const sessionToken = req.session?.shopifyToken || null;
  if (sessionToken) {
    return { token: sessionToken, source: 'session' };
  }
  const shopTokens = require('../core/shopTokens');
  const persisted = shopTokens.getToken(shop);
  if (persisted) {
    return { token: persisted, source: 'persisted' };
  }
  // If only one persisted token exists, use it even if shop missing
  if (!shop) {
    const all = shopTokens.loadAll?.() || shopTokens._loadAll?.() || null;
    if (all && typeof all === 'object') {
      const entries = Object.entries(all);
      if (entries.length === 1) {
        return { token: entries[0][1].token || entries[0][1], source: 'persisted-default' };
      }
    }
  }
  const envToken = process.env.SHOPIFY_ACCESS_TOKEN
    || process.env.SHOPIFY_ADMIN_API_TOKEN
    || process.env.SHOPIFY_API_TOKEN
    || process.env.SHOPIFY_ADMIN_TOKEN
    || process.env.SHOPIFY_CLIENT_SECRET
    || null;
  if (envToken) {
    return { token: envToken, source: 'env' };
  }
  return { token: null, source: 'none' };
}

router.get('/revenue', async (req, res) => {
  let shop;
  try {
    shop = getShop(req);
    const { token, source } = resolveToken(req, shop);
    if (!token) return res.json({ ok: false, error: `No Shopify admin token available (source=${source}). Reinstall or set SHOPIFY_ACCESS_TOKEN.`, tokenSource: source, shop });
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
    }, token);
    const total = (orders.orders || []).reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    res.json({ value: total, tokenSource: source });
  } catch (err) {
    res.json({ ok: false, error: err.message, source: err?.source || 'shopify', shop });
  }
});

router.get('/orders', async (req, res) => {
  let shop;
  try {
    shop = getShop(req);
    const { token, source } = resolveToken(req, shop);
    if (!token) return res.json({ ok: false, error: `No Shopify admin token available (source=${source}).`, tokenSource: source, shop });
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const end = today.toISOString();
    const orders = await shopifyFetch(shop, 'orders.json', {
      status: 'any',
      created_at_min: start,
      created_at_max: end,
      fields: 'id',
      limit: 250
    }, token);
    res.json({ value: (orders.orders || []).length, tokenSource: source });
  } catch (err) {
    res.json({ ok: false, error: err.message, source: err?.source || 'shopify', shop });
  }
});

router.get('/customers', async (req, res) => {
  let shop;
  try {
    shop = getShop(req);
    const { token, source } = resolveToken(req, shop);
    if (!token) return res.json({ ok: false, error: `No Shopify admin token available (source=${source}).`, tokenSource: source, shop });
    const customers = await shopifyFetch(shop, 'customers/count.json', {}, token);
    res.json({ value: customers.count, tokenSource: source });
  } catch (err) {
    res.json({ ok: false, error: err.message, source: err?.source || 'shopify', shop });
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

// Self-Service Analytics mock query endpoint
router.post('/query', async (req, res) => {
  try {
    const {
      dataset = 'orders',
      metric = 'gmv',
      dimension = 'channel',
      query = 'sum(gmv) by channel last 30',
      dateRange = '30d',
      comparePrev = true,
      segment = '',
      channel = '',
      campaign = '',
      topN = 5,
    } = req.body || {};

    const rangeMap = { '7d': 7, '14d': 14, '30d': 30 };
    let n = rangeMap[dateRange] || 10;
    const match = typeof query === 'string' ? query.match(/last\s+(\d+)/i) : null;
    if (match) n = Math.min(Math.max(parseInt(match[1], 10) || n, 3), 60);
    const labels = [];
    const data = [];
    for (let i = 0; i < n; i++) {
      labels.push(`${dimension}-${i + 1}`);
      data.push(Math.round(100 + Math.random() * 900));
    }

    const limitedN = Number(topN) > 0 ? Math.min(Number(topN), labels.length) : labels.length;
    const limitedLabels = labels.slice(0, limitedN);
    const limitedData = data.slice(0, limitedN);

    const total = limitedData.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / limitedData.length);
    const max = Math.max(...limitedData);
    let prevTotal = null;
    let delta = null;
    if (comparePrev) {
      const prev = limitedData.map(v => Math.round(v * (0.75 + Math.random() * 0.2)));
      prevTotal = prev.reduce((a, b) => a + b, 0);
      delta = prevTotal === 0 ? null : Math.round(((total - prevTotal) / prevTotal) * 100);
    }

    const chart = {
      labels: limitedLabels,
      datasets: [
        {
          label: `${metric} by ${dimension}`,
          data: limitedData,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.2)',
        },
      ],
    };

    const table = limitedLabels.map((label, idx) => ({ label, value: limitedData[idx], metric, dimension }));

    res.json({
      ok: true,
      chart,
      kpis: { total, avg, max, prevTotal, delta },
      table,
      rows: limitedData.length,
      dataset,
      dimension,
      metric,
      segment,
      channel,
      campaign,
      dateRange,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
