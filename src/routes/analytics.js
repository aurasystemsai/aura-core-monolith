const express = require('express');
const router = express.Router();
const storageJson = require('../core/storageJson');

// Lightweight in-memory cache (per process)
const queryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VIEWS_KEY = 'analytics-views';
const SCHEDULES_KEY = 'analytics-schedules';
const EXPORT_JOBS_KEY = 'analytics-export-jobs';
const ALERT_HISTORY_KEY = 'analytics-alert-history';
const MAX_EXPORT_JOBS = 200;
const MAX_ALERT_HISTORY = 500;

function clearCacheForShop(shop) {
  for (const key of queryCache.keys()) {
    if (key.includes(`"shop":"${shop}`)) {
      queryCache.delete(key);
    }
  }
}

async function loadViews() {
  return storageJson.get(VIEWS_KEY, []);
}

async function saveViews(data) {
  return storageJson.set(VIEWS_KEY, data);
}

async function loadSchedules() {
  return storageJson.get(SCHEDULES_KEY, []);
}

async function saveSchedules(data) {
  return storageJson.set(SCHEDULES_KEY, data);
}

async function loadExportJobs() {
  return storageJson.get(EXPORT_JOBS_KEY, []);
}

async function saveExportJobs(data) {
  const pruned = (data || []).slice(0, MAX_EXPORT_JOBS);
  return storageJson.set(EXPORT_JOBS_KEY, pruned);
}

async function loadAlertHistory(shop) {
  const all = storageJson.get(ALERT_HISTORY_KEY, []);
  return shop ? all.filter(e => e.shop === shop) : all;
}

async function saveAlertHistory(next) {
  const pruned = (next || []).slice(0, MAX_ALERT_HISTORY);
  return storageJson.set(ALERT_HISTORY_KEY, pruned);
}


// Live analytics endpoints using Shopify API
const { shopifyFetch, shopifyFetchPaginated } = require('../core/shopifyApi');
const storageJson = require('../core/storageJson');

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

async function runAnalyticsQuery({ body = {}, shop: shopOverride } = {}, req = null) {
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
    financialStatus = '',
    fulfillmentStatus = '',
    currency = '',
  } = body || {};

  const rangeMap = { '7d': 7, '14d': 14, '30d': 30, '90d': 90, '180d': 180 };
  const requestedDays = rangeMap[dateRange] || 30;
  if (requestedDays > 180) {
    return { ok: false, error: 'Date range exceeds max 180 days', code: 'range_too_large', maxDays: 180 };
  }
  const days = Math.min(requestedDays, 180);

  const makeWindow = (offsetDays = 0) => {
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    end.setUTCDate(end.getUTCDate() - offsetDays);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - days + 1);
    start.setUTCHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const formatLabel = (order, dim) => {
    const created = new Date(order.created_at);
    if (dim === 'date' || dim === 'day') return created.toISOString().slice(0, 10);
    if (dim === 'week') {
      const y = created.getUTCFullYear();
      const onejan = new Date(Date.UTC(y, 0, 1));
      const week = Math.ceil((((created - onejan) / 86400000) + onejan.getUTCDay() + 1) / 7);
      return `${y}-W${String(week).padStart(2, '0')}`;
    }
    if (dim === 'month') return `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, '0')}`;
    if (dim === 'financial_status') return order.financial_status || 'unknown';
    if (dim === 'fulfillment_status') return order.fulfillment_status || 'unknown';
    if (dim === 'currency') return order.currency || order.presentment_currency || 'unknown';
    if (dim === 'country') return order.shipping_address?.country_code || order.shipping_address?.country || 'unknown';
    if (dim === 'channel') return order.source_name || 'unknown';
    if (dim === 'campaign') return (order.tags || '').split(',').map(t => t.trim()).find(Boolean) || order.note_attributes?.find(n => n.name === 'utm_campaign')?.value || 'unknown';
    if (dim === 'utm_source') return order.note_attributes?.find(n => n.name === 'utm_source')?.value || 'unknown';
    if (dim === 'utm_medium') return order.note_attributes?.find(n => n.name === 'utm_medium')?.value || 'unknown';
    if (dim === 'utm_campaign') return order.note_attributes?.find(n => n.name === 'utm_campaign')?.value || 'unknown';
    if (dim === 'device') return order.client_details?.browser_ip ? 'web' : 'unknown';
    if (dim === 'referrer_domain') {
      try {
        const url = new URL(order.landing_site || '');
        return url.hostname || 'unknown';
      } catch (_e) {
        return 'unknown';
      }
    }
    if (dim === 'landing_path') {
      try {
        const url = new URL(order.landing_site || '');
        return url.pathname || '/';
      } catch (_e) {
        return 'unknown';
      }
    }
    if (dim === 'customer_type') {
      const count = order.customer?.orders_count || 0;
      return count > 1 ? 'returning' : 'first_time';
    }
    if (dim === 'payment_gateway') return (order.payment_gateway_names?.[0]) || 'unknown';
    if (dim === 'discount_code') return (order.discount_codes?.[0]?.code) || 'none';
    if (dim === 'product') return (order.line_items?.[0]?.product_id && `product-${order.line_items[0].product_id}`) || 'unknown';
    if (dim === 'variant') return (order.line_items?.[0]?.variant_id && `variant-${order.line_items[0].variant_id}`) || 'unknown';
    return order[dim] || 'unknown';
  };

  const sumRefunds = (order) => {
    const refunds = order.refunds || [];
    let total = 0;
    for (const r of refunds) {
      if (Array.isArray(r.transactions)) {
        total += r.transactions.filter(t => t.kind === 'refund').reduce((s, t) => s + Number(t.amount || 0), 0);
      }
      if (Array.isArray(r.refund_line_items)) {
        total += r.refund_line_items.reduce((s, rli) => s + Number(
          rli.subtotal_set?.shop_money?.amount
          || rli.total
          || rli.subtotal
          || 0
        ), 0);
      }
    }
    return total;
  };

  const metricsMap = {
    gmv: bucket => bucket.gross,
    orders: bucket => bucket.orders,
    aov: bucket => bucket.orders === 0 ? 0 : bucket.gross / bucket.orders,
    discounts: bucket => bucket.discounts,
    tax: bucket => bucket.tax,
    shipping: bucket => bucket.shipping,
    refunds: bucket => bucket.refunds,
    net_revenue: bucket => bucket.net,
    margin: bucket => bucket.margin,
    repeat_rate: bucket => bucket.orders === 0 ? 0 : bucket.returning / bucket.orders,
    gross_to_net: bucket => bucket.gross === 0 ? 0 : bucket.net / bucket.gross,
  };

  const getFxRate = (currencyCode, fxTable) => {
    if (!currencyCode) return 1;
    if (fxTable && fxTable[currencyCode]) return fxTable[currencyCode];
    const fxRaw = process.env.FX_RATES_JSON || '{}';
    let fx = {};
    try { fx = JSON.parse(fxRaw); } catch (_e) { /* ignore */ }
    return fx[currencyCode] || 1;
  };

  const aggregate = (orders, dim, fxTable, cogsTable) => {
    const map = new Map();
    for (const o of orders || []) {
      const label = formatLabel(o, dim);
      const fx = getFxRate(o.currency || o.presentment_currency, fxTable);
      const gross = Number(o.total_price || 0) * fx;
      const discountsTotal = Number(o.total_discounts || 0) * fx;
      const taxTotal = Number(o.total_tax || 0) * fx;
      const shippingTotal = Number(
        o.total_shipping_price_set?.shop_money?.amount
        || o.total_shipping_price_set?.presentment_money?.amount
        || 0
      ) * fx;
      const refundsTotal = sumRefunds(o) * fx;
      let cogs = 0;
      if (Array.isArray(o.line_items)) {
        for (const li of o.line_items) {
          const key = `variant-${li.variant_id}`;
          const prodKey = `product-${li.product_id}`;
          const cogsVal = (cogsTable && (cogsTable[key] || cogsTable[prodKey])) || 0;
          cogs += Number(cogsVal) * (li.quantity || 1) * fx;
        }
      }
      const marginTotal = gross - refundsTotal - cogs;
      const bucket = map.get(label) || {
        gross: 0,
        discounts: 0,
        tax: 0,
        shipping: 0,
        refunds: 0,
        orders: 0,
        net: 0,
        margin: 0,
        returning: 0,
        firstTime: 0,
      };
      bucket.gross += gross;
      bucket.discounts += discountsTotal;
      bucket.tax += taxTotal;
      bucket.shipping += shippingTotal;
      bucket.refunds += refundsTotal;
      bucket.orders += 1;
      bucket.net += (gross - refundsTotal);
      bucket.margin += marginTotal;
      const isReturning = (o.customer?.orders_count || 0) > 1;
      if (isReturning) bucket.returning += 1; else bucket.firstTime += 1;
      map.set(label, bucket);
    }
    return Array.from(map.entries()).map(([label, agg]) => ({ label, ...agg }));
  };

  const filterOrders = (orders) => {
    return (orders || []).filter(o => {
      if (channel && (o.source_name || '').toLowerCase() !== channel.toLowerCase()) return false;
      if (campaign) {
        const tags = (o.tags || '').toLowerCase();
        if (!tags.includes(campaign.toLowerCase())) return false;
      }
      if (financialStatus && (o.financial_status || '').toLowerCase() !== financialStatus.toLowerCase()) return false;
      if (fulfillmentStatus && (o.fulfillment_status || '').toLowerCase() !== fulfillmentStatus.toLowerCase()) return false;
      if (currency && (o.currency || o.presentment_currency || '').toLowerCase() !== currency.toLowerCase()) return false;
      return true;
    });
  };

  const buildResponse = (currentAgg, prevAgg, tokenSource, meta = {}) => {
    const sorted = dimension === 'date' || dimension === 'day' || dimension === 'week' || dimension === 'month'
      ? currentAgg.sort((a, b) => a.label.localeCompare(b.label))
      : currentAgg.sort((a, b) => metricsMap[metric]?.(b) - metricsMap[metric]?.(a));

    const limitedN = Number(topN) > 0 ? Math.min(Number(topN), sorted.length) : sorted.length;
    const limited = sorted.slice(0, limitedN);
    const labels = limited.map(i => i.label);
    const values = limited.map(i => (metricsMap[metric] || metricsMap.gmv)(i));

    let prevSeries = null;
    let prevTotal = null;
    let delta = null;
    if (prevAgg && Array.isArray(prevAgg)) {
      const prevMap = new Map(prevAgg.map(p => [p.label, p]));
      const prevVals = limited.map(i => {
        const match = prevMap.get(i.label);
        if (!match) return 0;
        return (metricsMap[metric] || metricsMap.gmv)(match);
      });
      prevTotal = prevVals.reduce((a, b) => a + b, 0);
      prevSeries = { label: `prev ${metric}`, data: prevVals, borderColor: '#94a3b8', backgroundColor: 'rgba(148,163,184,0.2)' };
      const total = values.reduce((a, b) => a + b, 0);
      delta = prevTotal === 0 ? null : Math.round(((total - prevTotal) / prevTotal) * 100);
    }

    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const max = values.length ? Math.max(...values) : 0;

    const datasets = [
      {
        label: `${metric} by ${dimension}`,
        data: values,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.2)',
      },
    ];
    if (prevSeries) datasets.push(prevSeries);

    const table = limited.map((item, idx) => {
      const prevVal = prevSeries ? prevSeries.data[idx] : null;
      const rowDelta = prevVal === 0 || prevVal === null ? null : Math.round(((values[idx] - prevVal) / prevVal) * 100);
      return {
        label: item.label,
        value: values[idx],
        metric,
        dimension,
        orders: item.orders,
        gmv: item.gross,
        net: item.net,
        discounts: item.discounts,
        tax: item.tax,
        shipping: item.shipping,
        refunds: item.refunds,
        prevValue: prevVal,
        delta: rowDelta,
      };
    });

    return {
      ok: true,
      chart: { labels, datasets },
      kpis: { total, avg, max, prevTotal, delta },
      table,
      rows: values.length,
      dataset,
      dimension,
      metric,
      segment,
      channel,
      campaign,
      dateRange,
      tokenSource,
      meta,
    };
  };

  try {
    if (dataset !== 'orders') {
      return { ok: false, error: 'Only orders dataset is implemented for live query. Extend as needed.' };
    }

    const shop = shopOverride || getShop(req);
    const { token, source } = resolveToken(req, shop);
    if (!token) return { ok: false, error: `No Shopify admin token available (source=${source}).`, tokenSource: source, shop };

    const { start, end } = makeWindow(0);

    const cacheKey = JSON.stringify({ shop, dataset, metric, dimension, dateRange, comparePrev, segment, channel, campaign, topN, financialStatus, fulfillmentStatus, currency });
    const cached = queryCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.at < CACHE_TTL_MS)) {
      return { ...cached.payload, cached: true };
    }

    const params = {
      status: 'any',
      created_at_min: start,
      created_at_max: end,
      limit: 250,
      fields: 'id,created_at,source_name,financial_status,fulfillment_status,total_price,total_discounts,total_tax,total_shipping_price_set,shipping_address,refunds,currency,presentment_currency,tags,note_attributes,client_details,line_items,landing_site,payment_gateway_names,discount_codes,customer',
      order: 'created_at asc'
    };

    const { items: allOrders, headers: currentHeaders, status: currentStatus } = await shopifyFetchPaginated(shop, 'orders.json', params, token, {
      rateLimitThreshold: 0.8,
      rateLimitSleepMs: 900,
    });
    const fxTable = await storageJson.get('fx-rates', {});
    const cogsTable = await storageJson.get('cogs', {});
    const filteredCurrent = filterOrders(allOrders);
    const currentAgg = aggregate(filteredCurrent, dimension, fxTable, cogsTable);

    let prevAgg = null;
    if (comparePrev) {
      const { start: pStart, end: pEnd } = makeWindow(days);
      const prevParams = { ...params, created_at_min: pStart, created_at_max: pEnd };
      const { items: prevOrders } = await shopifyFetchPaginated(shop, 'orders.json', prevParams, token, {
        rateLimitThreshold: 0.8,
        rateLimitSleepMs: 900,
      });
      prevAgg = aggregate(filterOrders(prevOrders), dimension, fxTable, cogsTable);
    }

    if (!currentAgg.length) {
      return { ok: true, empty: true, message: 'No orders found for the selected window/filters.', dataset, dateRange, dimension, metric, tokenSource: source };
    }

    const callLimitStr = currentHeaders?.get ? currentHeaders.get('x-shopify-shop-api-call-limit') : null;
    let rateLimited = false;
    if (callLimitStr) {
      const [usedStr, totalStr] = callLimitStr.split('/');
      const used = Number(usedStr || 0);
      const total = Number(totalStr || 80);
      if (total && used / total >= 0.8) rateLimited = true;
    }
    const meta = {
      callLimit: callLimitStr,
      status: currentStatus,
      pages: Math.ceil((allOrders.length || 1) / (params.limit || 250)),
      fetched: allOrders.length,
      range: { start, end },
      rateLimited,
    };

    const response = buildResponse(currentAgg, prevAgg, source, meta);
    queryCache.set(cacheKey, { at: now, payload: response });
    return response;
  } catch (err) {
    const structured = {
      ok: false,
      error: err.message,
      status: err.status,
      endpoint: err.endpoint,
      url: err.url,
      code: err.status === 401 ? 'token_expired' : err.status === 429 ? 'throttled' : 'shopify_error',
    };
    return structured;
  }
}

// Self-Service Analytics query endpoint (Shopify-backed, paginated, structured)
router.post('/query', async (req, res) => {
  const result = await runAnalyticsQuery({ body: req.body }, req);
  const status = result.ok === false && result.status ? result.status : 200;
  res.status(status).json(result);
});

// Persisted saved views (per shop)
router.get('/views', async (req, res) => {
  try {
    const shop = getShop(req);
    const all = await loadViews();
    const views = all.filter(v => v.shop === shop);
    res.json({ ok: true, views });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/views', async (req, res) => {
  try {
    const shop = getShop(req);
    const { name, payload, visibility = 'private', owner = 'system' } = req.body || {};
    if (!name || !payload) return res.status(400).json({ ok: false, error: 'name and payload are required' });
    const all = await loadViews();
    const id = `view_${Date.now()}`;
    const view = { id, shop, name, payload, visibility, owner, savedAt: Date.now() };
    const next = [view, ...all].slice(0, 200);
    await saveViews(next);
    res.json({ ok: true, view });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/views/:id', async (req, res) => {
  try {
    const shop = getShop(req);
    const id = req.params.id;
    const all = await loadViews();
    const next = all.filter(v => !(v.id === id && v.shop === shop));
    await saveViews(next);
    res.json({ ok: true, deleted: id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Persisted schedules (per shop)
router.get('/schedules', async (req, res) => {
  try {
    const shop = getShop(req);
    const all = await loadSchedules();
    const schedules = all.filter(s => s.shop === shop);
    res.json({ ok: true, schedules });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/schedules', async (req, res) => {
  try {
    const shop = getShop(req);
    const { name, payload, cadence = 'daily', channel = 'inapp', target = null, visibility = 'private', owner = 'system' } = req.body || {};
    if (!name || !payload) return res.status(400).json({ ok: false, error: 'name and payload are required' });

    const allowedChannels = ['inapp', 'email', 'webhook'];
    const cleanChannel = allowedChannels.includes(channel) ? channel : 'inapp';
    if ((cleanChannel === 'email' || cleanChannel === 'webhook') && !target) {
      return res.status(400).json({ ok: false, error: `target is required when channel=${cleanChannel}` });
    }

    const all = await loadSchedules();
    const id = `sched_${Date.now()}`;
    const schedule = { id, shop, name, payload, cadence, channel: cleanChannel, target: target || null, visibility, owner, createdAt: Date.now(), lastRunAt: null, lastStatus: null, paused: false };
    const next = [schedule, ...all].slice(0, 200);
    await saveSchedules(next);
    res.json({ ok: true, schedule });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    const shop = getShop(req);
    const id = req.params.id;
    const all = await loadSchedules();
    const next = all.filter(s => !(s.id === id && s.shop === shop));
    await saveSchedules(next);
    res.json({ ok: true, deleted: id });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/schedules/:id/pause', async (req, res) => {
  try {
    const shop = getShop(req);
    const id = req.params.id;
    const all = await loadSchedules();
    const sched = all.find(s => s.id === id && s.shop === shop);
    if (!sched) return res.status(404).json({ ok: false, error: 'not found' });
    sched.paused = true;
    await saveSchedules(all);
    res.json({ ok: true, schedule: sched });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/schedules/:id/resume', async (req, res) => {
  try {
    const shop = getShop(req);
    const id = req.params.id;
    const all = await loadSchedules();
    const sched = all.find(s => s.id === id && s.shop === shop);
    if (!sched) return res.status(404).json({ ok: false, error: 'not found' });
    sched.paused = false;
    await saveSchedules(all);
    res.json({ ok: true, schedule: sched });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Server-side CSV export
router.post('/export/csv', async (req, res) => {
  try {
    const result = await runAnalyticsQuery({ body: req.body }, req);
    if (!result.ok || result.empty) return res.status(400).json({ ok: false, error: result.error || 'No data' });
    const rows = result.table || [];
    if (!rows.length) return res.status(400).json({ ok: false, error: 'No rows to export' });
    const header = Object.keys(rows[0]);
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(header.map(h => JSON.stringify(r[h] ?? '')).join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Async export jobs (lightweight queue stored in JSON)
async function buildCsvFromResult(result) {
  const rows = result.table || [];
  if (!rows.length) throw new Error('No rows to export');
  const header = Object.keys(rows[0]);
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map(h => JSON.stringify(r[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

async function processExportJob(job) {
  const all = await loadExportJobs();
  const idx = all.findIndex(j => j.id === job.id);
  if (idx === -1) return;
  all[idx].status = 'running';
  all[idx].startedAt = Date.now();
  await saveExportJobs(all);
  try {
    const result = await runAnalyticsQuery({ body: job.payload, shop: job.shop });
    if (!result.ok || result.empty) {
      all[idx].status = 'error';
      all[idx].error = result.error || 'No data';
    } else {
      const csv = await buildCsvFromResult(result);
      all[idx].status = 'done';
      all[idx].rows = result.table?.length || 0;
      all[idx].csv = csv;
      all[idx].meta = { kpis: result.kpis, dataset: result.dataset, dimension: result.dimension, metric: result.metric };
    }
  } catch (err) {
    all[idx].status = 'error';
    all[idx].error = err.message;
  }
  all[idx].finishedAt = Date.now();
  await saveExportJobs(all);
}

router.post('/export/jobs', async (req, res) => {
  try {
    const shop = getShop(req);
    const payload = req.body || {};
    const id = `exp_${Date.now()}`;
    const job = { id, shop, payload, status: 'queued', createdAt: Date.now() };
    const all = await loadExportJobs();
    const next = [job, ...all];
    await saveExportJobs(next);
    res.json({ ok: true, job: { id, status: job.status } });
    // kick off processing async
    setTimeout(() => processExportJob(job), 10);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/export/jobs/:id', async (req, res) => {
  try {
    const shop = getShop(req);
    const all = await loadExportJobs();
    const job = all.find(j => j.id === req.params.id && j.shop === shop);
    if (!job) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, job: { id: job.id, status: job.status, error: job.error, rows: job.rows, createdAt: job.createdAt, finishedAt: job.finishedAt } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/export/jobs/:id/download', async (req, res) => {
  try {
    const shop = getShop(req);
    const all = await loadExportJobs();
    const job = all.find(j => j.id === req.params.id && j.shop === shop);
    if (!job) return res.status(404).json({ ok: false, error: 'not found' });
    if (job.status !== 'done' || !job.csv) return res.status(400).json({ ok: false, error: 'job not complete' });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${job.id}.csv"`);
    res.send(job.csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Alert history (per shop)
router.get('/alerts/history', async (req, res) => {
  try {
    const shop = getShop(req);
    const history = await loadAlertHistory(shop);
    res.json({ ok: true, history: history.slice(0, 200) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.runAnalyticsQuery = runAnalyticsQuery;
router.clearCacheForShop = clearCacheForShop;

module.exports = router;
