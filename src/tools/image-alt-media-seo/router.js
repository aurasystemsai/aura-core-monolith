
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const OpenAI = require('openai');
const db = require('./db');
const runs = require('./runs');
const { shopifyFetchPaginated } = require('../../core/shopifyApi');

// Shopify embedding guard: optional HMAC + shop validation for embedded requests
const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_STORE_URL = (process.env.SHOPIFY_STORE_URL || '').toLowerCase();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120; // per shop/IP per window
const rateLimitStats = { hits: 0, windowStart: Date.now() };

// Lightweight metrics for ops
const openaiStats = {
  success: 0,
  errors: 0,
  latencies: [], // keep last 50
};
const pushLatency = ms => {
  openaiStats.latencies.push(ms);
  if (openaiStats.latencies.length > 50) openaiStats.latencies.shift();
};
const p95 = arr => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
};

const tokenize = str => (str || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const similarityScore = (needle, haystack) => {
  const n = new Set(tokenize(needle));
  const h = new Set(tokenize(haystack));
  if (!n.size || !h.size) return 0;
  let overlap = 0;
  n.forEach(tok => { if (h.has(tok)) overlap += 1; });
  return overlap / n.size;
};

const isValidShopDomain = shop => typeof shop === 'string' && /^[a-z0-9][a-z0-9.-]*\.myshopify\.com$/i.test(shop);

const verifyShopifyHmac = (query = {}) => {
  if (!SHOPIFY_SECRET) return true; // allow when no secret configured (local/dev)
  if (!query.hmac) return false;
  const { hmac, signature, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('&');
  const computed = crypto.createHmac('sha256', SHOPIFY_SECRET).update(message).digest('hex');
  const hmacBuf = Buffer.from(hmac, 'utf8');
  const computedBuf = Buffer.from(computed, 'utf8');
  if (hmacBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(hmacBuf, computedBuf);
};

router.use((req, res, next) => {
  // Skip health endpoints
  if (req.path.startsWith('/health')) return next();

  const shop = (req.query.shop || req.headers['x-shopify-shop-domain'] || req.session?.shop || '').toLowerCase();
  const hmac = req.query.hmac;

  if (SHOPIFY_STORE_URL && shop && shop !== SHOPIFY_STORE_URL) {
    return res.status(401).json({ ok: false, error: 'Shop mismatch' });
  }
  if (SHOPIFY_STORE_URL && !shop) {
    return res.status(401).json({ ok: false, error: 'Shop required' });
  }
  if (shop && !isValidShopDomain(shop)) {
    return res.status(400).json({ ok: false, error: 'Invalid shop domain' });
  }

  if (hmac && !verifyShopifyHmac(req.query)) {
    return res.status(401).json({ ok: false, error: 'Invalid HMAC' });
  }

  return next();
});

// Simple per-shop/IP rate limiter (sliding window approximation)
const rateBuckets = new Map();
router.use((req, res, next) => {
  if (req.path.startsWith('/health')) return next();
  const shop = (req.query.shop || req.headers['x-shopify-shop-domain'] || req.session?.shop || '').toLowerCase();
  const key = shop || req.ip || 'anon';
  const now = Date.now();
  if (now - rateLimitStats.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStats.hits = 0;
    rateLimitStats.windowStart = now;
  }
  const bucket = rateBuckets.get(key) || [];
  const fresh = bucket.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  fresh.push(now);
  rateBuckets.set(key, fresh);
  if (fresh.length > RATE_LIMIT_MAX) {
    rateLimitStats.hits += 1;
    res.set('Retry-After', '60');
    return res.status(429).json({ ok: false, error: 'Rate limit exceeded. Try again shortly.' });
  }
  // opportunistic cleanup for old buckets
  if (rateBuckets.size > 500) {
    for (const [k, arr] of rateBuckets.entries()) {
      const pruned = arr.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
      if (!pruned.length) rateBuckets.delete(k);
      else rateBuckets.set(k, pruned);
    }
  }
  next();
});

// Request timing for observability
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    // Lightweight log to aid ops without noisy stdout
    if (ms > 1000) {
      console.warn('[image-alt-media-seo]', req.method, req.originalUrl, 'slow', `${ms}ms`);
    }
  });
  next();
});

// Lazily instantiate OpenAI so we can return graceful errors when not configured
const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
};

const callOpenAIChat = async ({ openai, messages, maxTokens, n }) => {
  const start = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
      temperature: 0.4,
      n,
    });
    openaiStats.success += 1;
    pushLatency(Date.now() - start);
    return completion;
  } catch (err) {
    openaiStats.errors += 1;
    pushLatency(Date.now() - start);
    throw err;
  }
};

const withRetry = async (fn, attempts = 3) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.status || err?.statusCode || err?.response?.status;
      if (status && status < 500 && status !== 429) break;
      await sleep(250 * (i + 1));
    }
  }
  throw lastErr;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Lightweight TTL cache for analytics endpoints
const makeCache = ({ ttlMs = 60000, maxEntries = 100 } = {}) => {
  const store = new Map();
  const get = key => {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.at > ttlMs) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };
  const set = (key, value) => {
    if (store.size >= maxEntries) {
      const oldest = store.keys().next().value;
      if (typeof oldest !== 'undefined') store.delete(oldest);
    }
    store.set(key, { value, at: Date.now() });
  };
  const clear = () => store.clear();
  return { get, set, clear };
};

const analyticsCache = makeCache({ ttlMs: 60000, maxEntries: 100 });
const cacheKey = req => {
  const params = new URLSearchParams();
  Object.keys(req.query || {}).sort().forEach(k => {
    if (typeof req.query[k] !== 'undefined') params.set(k, String(req.query[k]));
  });
  return `${req.path}?${params.toString()}`;
};
const clearAnalyticsCache = () => analyticsCache.clear();
const respondWithCache = async (req, res, builder) => {
  const key = cacheKey(req);
  const cached = analyticsCache.get(key);
  if (cached) return res.json({ ok: true, cached: true, ...cached });
  const fresh = await builder();
  analyticsCache.set(key, fresh);
  return res.json({ ok: true, cached: false, ...fresh });
};

const MAX_DESC_LEN = 800;
const MAX_URL_LEN = 2048;
const MAX_KEYWORDS_LEN = 400;
const MAX_ATTRIBUTES_LEN = 800;
const MAX_ITEMS = 200;
const MAX_BRAND_TERMS_LEN = 400;
const MAX_ALT_LEN = 400;

const normalizeStr = (val = '', max = 0) => {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  return max ? trimmed.slice(0, max) : trimmed;
};

const isPlainObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);

const normalizeLocale = (locale = 'default') => {
  if (typeof locale !== 'string') return 'default';
  const lower = locale.toLowerCase();
  return lower || 'default';
};

const normalizeAttributes = attrs => {
  if (!attrs) return '';
  if (typeof attrs === 'string') return normalizeStr(attrs, MAX_ATTRIBUTES_LEN);
  if (typeof attrs === 'object') {
    try {
      return normalizeStr(JSON.stringify(attrs), MAX_ATTRIBUTES_LEN);
    } catch (err) {
      return '';
    }
  }
  return '';
};

const clampInt = (val, min, max) => {
  const num = Number(val);
  if (Number.isNaN(num)) return min;
  return Math.min(Math.max(num, min), max);
};

const labelFromIndex = idx => String.fromCharCode(65 + (idx % 26));

// Optional filters derived from query params for collection/vendor substring matching on url/altText
const filterItems = (items = [], query = {}) => {
  const collection = (query.collection || '').toString().trim().toLowerCase();
  const vendor = (query.vendor || '').toString().trim().toLowerCase();
  if (!collection && !vendor) return items;
  return items.filter(item => {
    const url = (item.url || '').toLowerCase();
    const alt = (item.altText || '').toLowerCase();
    const matchesCollection = collection ? (url.includes(collection) || alt.includes(collection)) : true;
    const matchesVendor = vendor ? (url.includes(vendor) || alt.includes(vendor)) : true;
    return matchesCollection && matchesVendor;
  });
};

// Lightweight CSV parser to avoid extra deps; supports quoted fields and comma separation.
const parseCsv = (text = '') => {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && next === '\n') i++; // handle CRLF
        row.push(field);
        field = '';
        if (row.length) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.length && r.some(c => c && c.trim().length));
};

const toCsvValue = val => `"${String(typeof val === 'number' && Number.isFinite(val) ? val : (val || '')).replace(/"/g, '""')}"`;
const toSimilarCsv = (items = []) => {
  const headers = ['id', 'url', 'altText', 'score'];
  const lines = [headers.join(',')];
  items.forEach(item => {
    lines.push(headers.map(h => toCsvValue(item[h])).join(','));
  });
  return lines.join('\n');
};

const buildFallbackAlt = ({ imageDescription = '', url = '', keywords = '', productTitle = '', shotType = '' }) => {
  const base = imageDescription || productTitle || url.split('/').pop() || 'Product image';
  const trimmed = base.trim().replace(/[_-]+/g, ' ');
  const shot = shotType ? `${shotType} view` : '';
  const kw = (keywords || '').trim();
  return [trimmed, shot, kw].filter(Boolean).join(' — ').slice(0, 180) || 'Descriptive product image';
};

const toContextString = ({ productTitle, attributes, shotType, focus, variant, scene }) => {
  const parts = [];
  if (productTitle) parts.push(`Title: ${productTitle}`);
  if (variant) parts.push(`Variant: ${variant}`);
  if (shotType) parts.push(`Shot: ${shotType}`);
  if (focus) parts.push(`Focus: ${focus}`);
  if (scene) parts.push(`Scene: ${scene}`);
  if (attributes) {
    if (typeof attributes === 'string') parts.push(`Attributes: ${attributes}`);
    else if (typeof attributes === 'object') parts.push(`Attributes: ${JSON.stringify(attributes)}`);
  }
  return parts.join(' | ');
};

const lengthBands = {
  'en': { min: 25, max: 140 },
  'en-us': { min: 25, max: 140 },
  'en-gb': { min: 25, max: 140 },
  'de': { min: 25, max: 150 },
  'fr': { min: 25, max: 150 },
  'es': { min: 25, max: 150 },
  'ja': { min: 15, max: 90 },
  'ko': { min: 18, max: 100 },
  'zh': { min: 12, max: 80 },
  'default': { min: 25, max: 140 },
};

const lengthHistogram = (items = []) => {
  const buckets = [
    { label: '0-24', min: 0, max: 24, count: 0 },
    { label: '25-50', min: 25, max: 50, count: 0 },
    { label: '51-80', min: 51, max: 80, count: 0 },
    { label: '81-120', min: 81, max: 120, count: 0 },
    { label: '121-160', min: 121, max: 160, count: 0 },
    { label: '161+', min: 161, max: Infinity, count: 0 },
  ];
  items.forEach(len => {
    const bucket = buckets.find(b => len >= b.min && len <= b.max);
    if (bucket) bucket.count += 1;
  });
  return buckets;
};

const redactAlt = alt => {
  if (!alt) return alt;
  const maskEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const maskPhone = /\+?\d[\d\s().-]{6,}\d/gi;
  return alt.replace(maskEmail, '[redacted-email]').replace(maskPhone, '[redacted-phone]');
};

const sanitizeAlt = alt => {
  if (!alt) return alt;
  return alt
    .replace(/\b(image of|picture of)\b[:]?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const gradeAlt = ({ altText = '', keywords = '', lint, locale }) => {
  const band = lengthBands[normalizeLocale(locale)] || lengthBands.default;
  const len = altText.trim().length;
  const lengthScore = len < band.min ? 0 : len > band.max ? 40 : 100;
  const issuesPenalty = (lint?.issues?.length || 0) * 8;
  const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  const lower = altText.toLowerCase();
  const kwScore = !kwList.length ? 70 : Math.min(100, kwList.reduce((acc, k) => acc + (lower.includes(k) ? 40 / kwList.length : 0), 60));
  const base = Math.max(0, Math.min(100, Math.round((lengthScore * 0.4) + (kwScore * 0.3) + 30 - issuesPenalty)));
  const grade = base >= 90 ? 'A' : base >= 80 ? 'B' : base >= 70 ? 'C' : base >= 60 ? 'D' : 'E';
  return { score: base, grade };
};

const buildDeterministicVariants = (base, count = 1) => {
  const variants = [];
  for (let i = 0; i < count; i++) {
    const suffix = i === 0 ? '' : ` (${labelFromIndex(i)} variant)`;
    variants.push((base + suffix).trim());
  }
  return variants;
};

const lintAlt = (altText = '', keywords = '', locale = 'default', brandTerms = '') => {
  const band = lengthBands[normalizeLocale(locale)] || lengthBands.default;
  const len = altText.trim().length;
  const maxRecommended = band.max;
  const minRecommended = band.min;
  const issues = [];
  const warnings = [];
  if (len < minRecommended) issues.push('Too short for good description');
  if (len > maxRecommended) issues.push('Too long; may be truncated');
  if (/\b(image of|picture of)\b/i.test(altText)) issues.push('Redundant phrasing detected');
  if (/https?:\/\//i.test(altText)) issues.push('Contains a URL which screen readers will read');
  if (/\b(click here\b|buy now\b|sale\b)/i.test(altText)) issues.push('Promotional language not suitable for alt text');
  const piiHit = /\b(email|@|\+?\d[\d\s().-]{6,}\d)/i.test(altText);
  if (piiHit) issues.push('Possible PII or contact info detected');
  const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  if (kwList.length) {
    const lower = altText.toLowerCase();
    const stuffed = kwList.filter(k => (lower.match(new RegExp(k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length > 2);
    if (stuffed.length) issues.push('Possible keyword stuffing');
  }
  const brandList = brandTerms.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  if (brandList.length) {
    const lower = altText.toLowerCase();
    const missingBrand = brandList.filter(k => !lower.includes(k));
    if (missingBrand.length) issues.push('Brand vocab not present');
  }
  const vague = /(nice|beautiful|amazing|awesome|great|wonderful|lovely|cool)/i.test(altText);
  if (vague) warnings.push('Vague adjective detected; be specific');
  const repeatedWord = /\b(\w{3,})\b\s+\1\b/i.test(altText);
  if (repeatedWord) warnings.push('Repeated word detected');
  const shouting = /\b[A-Z]{8,}\b/.test(altText);
  if (shouting) warnings.push('Possible casing/shouting detected');
  if (/\b(click|tap|press)\b/i.test(altText)) warnings.push('Avoid instructional verbs in alt text');
  if (/\b(color|colour)\b/i.test(altText) && !/\b(red|blue|green|black|white|gray|grey|yellow|orange|purple|pink|beige|brown|navy|teal|olive|gold|silver)\b/i.test(altText)) {
    warnings.push('Color mentioned but not specified');
  }
  const sanitizedAlt = sanitizeAlt(altText);
  const redactedAlt = piiHit ? redactAlt(altText) : null;
  return {
    length: len,
    withinRange: len >= minRecommended && len <= maxRecommended,
    issueCount: issues.length,
    warningCount: warnings.length,
    totalFindings: issues.length + warnings.length,
    issues,
    warnings,
    sanitizedAlt,
    redactedAlt,
  };
};

const generateVariants = async ({ openai, messages, maxTokens, variantCount, fallbackText }) => {
  if (openai) {
    const completion = await withRetry(() => callOpenAIChat({ openai, messages, maxTokens, n: variantCount }));
    const alts = (completion.choices || [])
      .map(c => c.message?.content?.trim())
      .filter(Boolean);
    if (alts.length >= variantCount) return alts;
    return alts.concat(buildDeterministicVariants(fallbackText, variantCount - alts.length));
  }
  return buildDeterministicVariants(fallbackText, variantCount);
};

// CRUD endpoints (persistent, Postgres)
router.get('/images', async (req, res) => {
  try {
    const limit = clampInt(req.query.limit || 50, 1, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const search = normalizeStr(req.query.search || '', 200);
    const { items, total } = await (db.listPaged ? db.listPaged({ limit, offset, search }) : { items: await db.list(), total: (await db.list()).length });
    res.json({ ok: true, images: items, total, limit, offset, search });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Import images directly from Shopify products (uses Admin API token)
router.post('/images/import-shopify', async (req, res) => {
  try {
    const shop = (req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'] || '').toLowerCase();
    if (!shop) return res.status(400).json({ ok: false, error: 'shop required (e.g., mystore.myshopify.com)' });
    if (!isValidShopDomain(shop)) return res.status(400).json({ ok: false, error: 'Invalid shop domain' });

    const maxImages = clampInt(req.body?.maxImages || req.query?.maxImages || 500, 1, 5000);
    const productLimit = clampInt(req.body?.productLimit || req.query?.productLimit || maxImages, 1, 5000);

    const { items: products } = await shopifyFetchPaginated(
      shop,
      'products.json',
      { limit: 250, fields: 'id,title,handle,images' },
      null,
      {
        maxPages: Math.ceil(productLimit / 250),
        rateLimitThreshold: 0.7,
        rateLimitSleepMs: 900,
      }
    );

    const trimmedProducts = products.slice(0, productLimit);
    const existing = await db.list();
    const seen = new Set((existing || []).map(i => (i.url || '').toLowerCase()).filter(Boolean));

    const toCreate = [];
    let skipped = 0;

    for (const product of trimmedProducts) {
      for (const image of product.images || []) {
        if (toCreate.length >= maxImages) break;
        const url = normalizeStr(image.src || image.original_src || '', MAX_URL_LEN);
        if (!url) {
          skipped += 1;
          continue;
        }
        const key = url.toLowerCase();
        if (seen.has(key)) {
          skipped += 1;
          continue;
        }
        seen.add(key);
        const altText = normalizeStr(image.alt || image.alt_text || '', MAX_ALT_LEN);
        toCreate.push({ url, altText });
      }
      if (toCreate.length >= maxImages) break;
    }

    const created = [];
    for (const item of toCreate) {
      const row = await db.create(item);
      created.push(row);
    }

    clearAnalyticsCache();

    res.json({
      ok: true,
      imported: created.length,
      skipped,
      total: toCreate.length + skipped,
      productCount: trimmedProducts.length,
      shop,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ ok: false, error: err.message || 'Shopify import failed' });
  }
});

// Similarity search (token overlap on alt/url)
router.get('/images/similar', async (req, res) => {
  try {
    const queryText = normalizeStr(req.query.q || req.query.query || '', 400);
    const limit = clampInt(req.query.limit || 10, 1, 50);
    const format = normalizeStr(req.query.format || req.query.f || '', 10).toLowerCase();
    if (!queryText) return res.status(400).json({ ok: false, error: 'q required' });
    const all = await db.list();
    const scored = all
      .map(item => {
        const score = similarityScore(queryText, `${item.altText || ''} ${item.url || ''}`);
        return { item, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => ({ ...s.item, score: Number(s.score.toFixed(3)) }));
    if (format === 'csv') {
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="images-similar.csv"');
      return res.send(toSimilarCsv(scored));
    }
    res.json({ ok: true, items: scored, query: queryText, limit });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

router.get('/images/:id', async (req, res) => {
  try {
    const image = await db.get(req.params.id);
    if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, image });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});
router.post('/images', async (req, res) => {
  try {
    const image = await db.create(req.body || {});
    clearAnalyticsCache();
    res.json({ ok: true, image });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});
router.put('/images/:id', async (req, res) => {
  try {
    const image = await db.update(req.params.id, req.body || {});
    if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
    clearAnalyticsCache();
    res.json({ ok: true, image });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});
router.delete('/images/:id', async (req, res) => {
  try {
    const ok = await db.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    clearAnalyticsCache();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Bulk update alts
router.post('/images/bulk-update', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    const updated = [];
    for (const item of items) {
      if (!isPlainObject(item) || !item.id) {
        updated.push({ ok: false, error: 'id required', item });
        continue;
      }
      const altText = normalizeStr(item.altText || item.alt || '', MAX_ALT_LEN);
      const url = item.url ? normalizeStr(item.url, MAX_URL_LEN) : undefined;
      const payload = {};
      if (altText) payload.altText = altText;
      if (url) payload.url = url;
      const image = await db.update(item.id, payload);
      updated.push(image ? { ok: true, image } : { ok: false, error: 'Not found', item });
    }
    clearAnalyticsCache();
    res.json({ ok: true, updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// AI endpoint: generate alt text (accepts both legacy and new payloads)
router.post(['/ai/generate', '/ai/generate-alt'], async (req, res) => {
  try {
    const body = req.body || {};
    const locale = normalizeLocale(body.locale || 'default');
    const safeMode = body.safeMode !== false;
    const keywords = normalizeStr(body.keywords || '', MAX_KEYWORDS_LEN);
    const brandTerms = normalizeStr(body.brandTerms || '', MAX_BRAND_TERMS_LEN);
    const tone = normalizeStr(body.tone || 'balanced', 40); // minimalist | balanced | expressive
    const verbosity = normalizeStr(body.verbosity || 'balanced', 40); // terse | balanced | detailed
    const productTitle = normalizeStr(body.productTitle || '', 200);
    const attributes = normalizeAttributes(body.attributes);
    const shotType = normalizeStr(body.shotType || '', 120);
    const focus = normalizeStr(body.focus || '', 120);
    const variant = normalizeStr(body.variant || '', 160);
    const scene = normalizeStr(body.scene || '', 200);
    const url = normalizeStr(body.url || '', MAX_URL_LEN);
    const description = normalizeStr(body.input || body.imageDescription || '', MAX_DESC_LEN);
    const variantCount = clampInt(body.variantCount || body.variants || 1, 1, 5);

    if (!description && !url) {
      return res.status(400).json({ ok: false, error: 'Provide input or url' });
    }
    if (keywords.length > MAX_KEYWORDS_LEN) {
      return res.status(400).json({ ok: false, error: 'Keywords too long' });
    }
    if (url && url.length > MAX_URL_LEN) {
      return res.status(400).json({ ok: false, error: 'URL too long' });
    }

    const openai = getOpenAI();
    const contextStr = toContextString({ productTitle, attributes, shotType, focus, variant, scene });
    const toneHint = tone === 'minimalist' ? 'Keep language spare and factual.' : tone === 'expressive' ? 'Allow a touch more descriptiveness but stay factual.' : 'Balanced tone.';
    const verbosityHint = verbosity === 'terse' ? 'Keep it short.' : verbosity === 'detailed' ? 'Include one extra specific detail.' : 'Keep concise.';
    const maxTokens = verbosity === 'terse' ? 80 : verbosity === 'detailed' ? 160 : 120;
    const messages = [
      { role: 'system', content: 'You are an image SEO expert who writes concise, specific, ADA-friendly alt text without fluff.' },
      { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${keywords || '(none)'}; Brand vocab: ${brandTerms || '(none)'}; Context: ${contextStr || '(none)'}; Constraints: no promo language, no PII, keep concise. ${toneHint} ${verbosityHint}` },
    ];

    const variantTexts = await generateVariants({ openai, messages, maxTokens, variantCount, fallbackText: buildFallbackAlt({ imageDescription: description, url, keywords, productTitle, shotType }) });
    const variants = variantTexts.map((text, idx) => {
      const lint = lintAlt(text, keywords, locale, brandTerms);
      const grade = gradeAlt({ altText: text, keywords, lint, locale });
      return { label: labelFromIndex(idx), altText: text, lint, grade };
    });
    const primary = variants[0];
    const sanitized = primary?.lint?.sanitizedAlt && primary.lint.sanitizedAlt !== primary.altText ? primary.lint.sanitizedAlt : null;

    let finalAlt = primary?.altText || '';
    if (safeMode && primary) {
      if (primary.lint.redactedAlt) finalAlt = primary.lint.redactedAlt;
      else if (sanitized) finalAlt = sanitized;
    }
    if (finalAlt && finalAlt.length > MAX_ALT_LEN) {
      finalAlt = finalAlt.slice(0, MAX_ALT_LEN);
    }

    res.json({ ok: true, result: finalAlt, variants, lint: primary?.lint, grade: primary?.grade, raw: primary?.altText, sanitized });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// AI endpoint: generate concise caption (single sentence)
router.post('/ai/caption', async (req, res) => {
  try {
    const body = req.body || {};
    const locale = normalizeLocale(body.locale || 'default');
    const safeMode = body.safeMode !== false;
    const keywords = normalizeStr(body.keywords || '', MAX_KEYWORDS_LEN);
    const brandTerms = normalizeStr(body.brandTerms || '', MAX_BRAND_TERMS_LEN);
    const productTitle = normalizeStr(body.productTitle || '', 200);
    const attributes = normalizeAttributes(body.attributes);
    const shotType = normalizeStr(body.shotType || '', 120);
    const focus = normalizeStr(body.focus || '', 120);
    const variant = normalizeStr(body.variant || '', 160);
    const scene = normalizeStr(body.scene || '', 200);
    const url = normalizeStr(body.url || '', MAX_URL_LEN);
    const description = normalizeStr(body.input || body.imageDescription || '', MAX_DESC_LEN);

    if (!description && !url) {
      return res.status(400).json({ ok: false, error: 'Provide input or url' });
    }

    const openai = getOpenAI();
    const contextStr = toContextString({ productTitle, attributes, shotType, focus, variant, scene });
    const messages = [
      { role: 'system', content: 'You write concise, specific, single-sentence image captions without promo language or PII.' },
      { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${keywords || '(none)'}; Brand vocab: ${brandTerms || '(none)'}; Context: ${contextStr || '(none)'}; Style: concise, human-friendly, single sentence.` },
    ];
    const [captionRaw] = await generateVariants({ openai, messages, maxTokens: 80, variantCount: 1, fallbackText: buildFallbackAlt({ imageDescription: description, url, keywords, productTitle, shotType }) });
    const caption = captionRaw || '';
    const lint = lintAlt(caption, keywords, locale, brandTerms);
    const sanitized = lint?.sanitizedAlt && lint.sanitizedAlt !== caption ? lint.sanitizedAlt : null;
    let finalCaption = caption;
    if (safeMode) {
      if (lint?.redactedAlt) finalCaption = lint.redactedAlt;
      else if (sanitized) finalCaption = sanitized;
    }
    if (finalCaption && finalCaption.length > 240) finalCaption = finalCaption.slice(0, 240);

    res.json({ ok: true, caption: finalCaption, raw: caption, sanitized, lint });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Batch generate (sequential to respect rate limits)
router.post('/ai/batch-generate', async (req, res) => {
  try {
    const body = req.body || {};
    const locale = normalizeLocale(body.locale || 'default');
    const safeMode = body.safeMode !== false;
    const keywords = normalizeStr(body.keywords || '', MAX_KEYWORDS_LEN);
    const brandTerms = normalizeStr(body.brandTerms || '', MAX_BRAND_TERMS_LEN);
    const tone = normalizeStr(body.tone || 'balanced', 40);
    const verbosity = normalizeStr(body.verbosity || 'balanced', 40);
    const chunkSize = Math.min(Math.max(Number(body.chunkSize) || 50, 1), 100);
    const paceMs = Math.min(Math.max(Number(body.paceMs) || 0, 0), 2000); // optional delay between chunks
    const variantCountDefault = clampInt(body.variantCount || body.variants || 1, 1, 5);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    if (items.length > MAX_ITEMS) return res.status(400).json({ ok: false, error: `Max ${MAX_ITEMS} items per batch` });
    if (keywords.length > MAX_KEYWORDS_LEN) return res.status(400).json({ ok: false, error: 'Keywords too long' });
    if (brandTerms.length > MAX_BRAND_TERMS_LEN) return res.status(400).json({ ok: false, error: 'Brand terms too long' });

    const openai = getOpenAI();
    const results = [];
    const startedAt = Date.now();

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      for (const item of chunk) {
        if (!isPlainObject(item)) {
          results.push({ ok: false, error: 'Item must be an object', item });
          continue;
        }
        const description = normalizeStr(item?.input || item?.imageDescription || '', MAX_DESC_LEN);
        const url = normalizeStr(item?.url || '', MAX_URL_LEN);
        const productTitle = normalizeStr(item?.productTitle || '', 200);
        const attributes = normalizeAttributes(item?.attributes || item?.attrs);
        const shotType = normalizeStr(item?.shotType || '', 120);
        const focus = normalizeStr(item?.focus || '', 120);
        const variant = normalizeStr(item?.variant || '', 160);
        const scene = normalizeStr(item?.scene || '', 200);
        const itemKeywords = normalizeStr(item?.keywords || keywords || '', MAX_KEYWORDS_LEN);
        const itemBrandTerms = normalizeStr(item?.brandTerms || brandTerms || '', MAX_BRAND_TERMS_LEN);
        const itemVariantCount = clampInt(item?.variantCount || item?.variants || variantCountDefault, 1, 5);
        const itemTone = normalizeStr(item?.tone || tone, 40);
        const itemVerbosity = normalizeStr(item?.verbosity || verbosity, 40);

        if (!description && !url) {
          results.push({ ok: false, error: 'Provide input or url', item });
          continue;
        }
        if (itemKeywords.length > MAX_KEYWORDS_LEN) {
          results.push({ ok: false, error: 'Keywords too long', item });
          continue;
        }
        if (itemBrandTerms.length > MAX_BRAND_TERMS_LEN) {
          results.push({ ok: false, error: 'Brand terms too long', item });
          continue;
        }

        const contextStr = toContextString({ productTitle, attributes, shotType, focus, variant, scene });
        const toneHint = itemTone === 'minimalist' ? 'Keep language spare and factual.' : itemTone === 'expressive' ? 'Allow a touch more descriptiveness but stay factual.' : 'Balanced tone.';
        const verbosityHint = itemVerbosity === 'terse' ? 'Keep it short.' : itemVerbosity === 'detailed' ? 'Include one extra specific detail.' : 'Keep concise.';
        const maxTokens = itemVerbosity === 'terse' ? 80 : itemVerbosity === 'detailed' ? 160 : 120;
        const messages = [
          { role: 'system', content: 'You are an image SEO expert who writes concise, specific, ADA-friendly alt text without fluff.' },
          { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${itemKeywords || '(none)'}; Brand vocab: ${itemBrandTerms || '(none)'}; Context: ${contextStr || '(none)'}; Constraints: no promo language, no PII, keep concise. ${toneHint} ${verbosityHint}` },
        ];
        const variantTexts = await generateVariants({ openai, messages, maxTokens, variantCount: itemVariantCount, fallbackText: buildFallbackAlt({ imageDescription: description, url, keywords: itemKeywords, productTitle, shotType }) });
        const variants = variantTexts.map((text, idx) => {
          const lint = lintAlt(text, itemKeywords, locale, itemBrandTerms);
          const grade = gradeAlt({ altText: text, keywords: itemKeywords, lint, locale });
          return { label: labelFromIndex(idx), altText: text, lint, grade };
        });
        const primary = variants[0];
        const sanitized = primary?.lint?.sanitizedAlt && primary.lint.sanitizedAlt !== primary.altText ? primary.lint.sanitizedAlt : null;
        let finalAlt = primary?.altText || '';
        if (safeMode && primary) {
          if (primary.lint.redactedAlt) finalAlt = primary.lint.redactedAlt;
          else if (sanitized) finalAlt = sanitized;
        }
        if (finalAlt && finalAlt.length > MAX_ALT_LEN) {
          finalAlt = finalAlt.slice(0, MAX_ALT_LEN);
        }
        results.push({ ok: true, result: finalAlt, variants, lint: primary?.lint, grade: primary?.grade, raw: primary?.altText, sanitized, meta: { productTitle, url, shotType, focus, variant, brandTerms: itemBrandTerms, tone: itemTone, verbosity: itemVerbosity, variantCount: itemVariantCount } });
      }
      if (paceMs && i + chunkSize < items.length) {
        await sleep(paceMs);
      }
    }
    const endedAt = Date.now();
    const summary = {
      id: `run-${startedAt}`,
      startedAt,
      durationMs: endedAt - startedAt,
      total: results.length,
      ok: results.filter(r => r.ok).length,
      errors: results.filter(r => !r.ok).length,
      chunkSize,
      paceMs,
      locale,
      safeMode,
      keywords: keywords || undefined,
      brandTerms: brandTerms || undefined,
      tone,
      verbosity,
    };
    await runs.add(summary);
    if (paceMs || chunkSize !== 50) {
      console.info('[image-alt-media-seo] batch summary', { total: summary.total, ok: summary.ok, errors: summary.errors, chunkSize: summary.chunkSize, paceMs: summary.paceMs, durationMs: summary.durationMs });
    }
    res.json({ ok: true, results, summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Batch runs log
router.get('/runs', async (req, res) => {
  try {
    const all = await runs.list();
    res.json({ ok: true, runs: all });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Metrics endpoint: aggregate batch run summaries
router.get('/metrics', async (req, res) => {
  try {
    const all = await runs.list();
    const totalRuns = all.length;
    const totals = all.reduce((acc, run) => {
      acc.items += run.total || 0;
      acc.ok += run.ok || 0;
      acc.errors += run.errors || 0;
      acc.duration += run.durationMs || 0;
      acc.chunkSum += run.chunkSize || 0;
      acc.paceSum += typeof run.paceMs === 'number' ? run.paceMs : 0;
      return acc;
    }, { items: 0, ok: 0, errors: 0, duration: 0, chunkSum: 0, paceSum: 0 });
    const avgDurationMs = totalRuns ? Math.round(totals.duration / totalRuns) : 0;
    const avgChunkSize = totalRuns ? Math.round(totals.chunkSum / totalRuns) : 0;
    const avgPaceMs = totalRuns ? Math.round(totals.paceSum / totalRuns) : 0;
    const lastRun = all[0] || null;
    res.json({
      ok: true,
      metrics: {
        totalRuns,
        totalItems: totals.items,
        totalOk: totals.ok,
        totalErrors: totals.errors,
        avgDurationMs,
        avgChunkSize,
        avgPaceMs,
        lastRun,
        rateLimit: { hits: rateLimitStats.hits, windowStart: rateLimitStats.windowStart },
        openai: {
          success: openaiStats.success,
          errors: openaiStats.errors,
          p95ms: p95(openaiStats.latencies),
          sampleSize: openaiStats.latencies.length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Metrics error' });
  }
});


// Analytics endpoint (live)
router.get('/analytics', async (req, res) => {
  try {
    return respondWithCache(req, res, async () => {
      const all = await db.list();
      const scoped = filterItems(all, req.query);
      const lengths = scoped.map(i => (i.altText || '').length);
      const avgLength = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
      const missingUrl = scoped.filter(i => !i.url).length;
      const missingAlt = scoped.filter(i => !i.altText).length;
      const counts = scoped.reduce((acc, item) => {
        const alt = (item.altText || '').trim();
        if (!alt) return acc;
        acc[alt] = (acc[alt] || 0) + 1;
        return acc;
      }, {});
      const duplicateAlts = Object.values(counts).filter(c => c > 1).length;
      const uniqueAlts = Object.keys(counts).length;
      const coveragePct = scoped.length ? Math.round(((scoped.length - missingAlt) / scoped.length) * 100) : 0;
      return { analytics: { totalImages: scoped.length, avgLength, missingUrl, missingAlt, duplicateAlts, uniqueAlts, coveragePct } };
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Duplicate alt text finder (returns alts with count > 1 and their IDs)
router.get('/analytics/duplicates', async (req, res) => {
  try {
    return respondWithCache(req, res, async () => {
      const all = await db.list();
      const scoped = filterItems(all, req.query);
      const map = new Map();
      scoped.forEach(item => {
        const alt = (item.altText || '').trim();
        if (!alt) return;
        if (!map.has(alt)) map.set(alt, []);
        map.get(alt).push(item.id);
      });
      const duplicates = Array.from(map.entries())
        .filter(([, ids]) => ids.length > 1)
        .map(([altText, ids]) => ({ altText, count: ids.length, ids }));
      return { duplicates, totalDuplicates: duplicates.length };
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Meta endpoint to expose presets for UI
router.get('/meta', (req, res) => {
  res.json({
    ok: true,
    presets: {
      tone: ['minimalist', 'balanced', 'expressive'],
      verbosity: ['terse', 'balanced', 'detailed'],
      safeModeDefault: true,
      brandVocabHint: 'Add brand nouns/adjectives, comma-separated (e.g., acme, recycled, vegan)' ,
      bundles: [
        { key: 'catalog-minimal', tone: 'minimalist', verbosity: 'terse', description: 'Concise catalog-ready alt text focusing on key attributes.' },
        { key: 'storytelling', tone: 'expressive', verbosity: 'detailed', description: 'More descriptive alt for lookbooks and lifestyle shots.' },
        { key: 'accessibility-balanced', tone: 'balanced', verbosity: 'balanced', description: 'Balanced clarity for accessibility-first contexts.' },
      ],
    },
    limits: {
      maxItems: MAX_ITEMS,
      maxKeywords: MAX_KEYWORDS_LEN,
      maxBrandTerms: MAX_BRAND_TERMS_LEN,
      maxAltLen: MAX_ALT_LEN,
      maxUrlLen: MAX_URL_LEN,
    },
  });
});

// Length band histogram
router.get('/analytics/length-bands', async (req, res) => {
  try {
    return respondWithCache(req, res, async () => {
      const all = await db.list();
      const scoped = filterItems(all, req.query);
      const lengths = scoped.map(i => (i.altText || '').length);
      const bands = lengthHistogram(lengths);
      return { bands, total: lengths.length };
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Missing/broken alt finder
router.get('/analytics/missing', async (req, res) => {
  try {
    return respondWithCache(req, res, async () => {
      const all = await db.list();
      const scoped = filterItems(all, req.query);
      const missingAlt = scoped.filter(i => !i.altText || !i.altText.trim()).map(i => i.id);
      const missingUrl = scoped.filter(i => !i.url || !i.url.trim()).map(i => i.id);
      return { missingAlt, missingUrl, counts: { missingAlt: missingAlt.length, missingUrl: missingUrl.length, total: scoped.length } };
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Clear analytics cache (useful after bulk changes or for tests)
router.post('/analytics/cache/clear', (req, res) => {
  clearAnalyticsCache();
  res.json({ ok: true, cleared: true });
});

// Import/export endpoints (live)
router.post('/import', async (req, res) => {
  try {
    const { items, data, dryRun, errorExport } = req.body || {};
    const payload = Array.isArray(items) ? items : Array.isArray(data) ? data : null;
    if (!payload) return res.status(400).json({ ok: false, error: 'items[] required' });
    if (payload.length > MAX_ITEMS) return res.status(400).json({ ok: false, error: `Max ${MAX_ITEMS} items per import` });
    const errors = [];
    const sanitized = [];
    payload.forEach((item, idx) => {
      if (!isPlainObject(item)) {
        errors.push({ index: idx, error: 'Item must be an object' });
        return;
      }
      const altRaw = item.altText || item.content;
      const urlRaw = item.url || '';
      const alt = normalizeStr(altRaw, MAX_ALT_LEN);
      const url = normalizeStr(urlRaw, MAX_URL_LEN);
      if (!alt) {
        errors.push({ index: idx, error: 'altText required' });
        return;
      }
      if (typeof urlRaw !== 'undefined' && !urlRaw) {
        errors.push({ index: idx, error: 'url cannot be empty string' });
        return;
      }
      if (urlRaw && urlRaw.length > MAX_URL_LEN) {
        errors.push({ index: idx, error: 'url too long' });
        return;
      }
      sanitized.push({ ...item, altText: alt, url });
    });
    if (dryRun) {
      if (errors.length && errorExport) {
        res.set('Content-Disposition', 'attachment; filename=import-errors.json');
        return res.status(200).json({ ok: false, dryRun: true, count: payload.length, errors });
      }
      return res.json({ ok: !errors.length, dryRun: true, count: payload.length, errors });
    }
    if (errors.length) {
      if (errorExport) {
        res.set('Content-Disposition', 'attachment; filename=import-errors.json');
      }
      return res.status(400).json({ ok: false, errors });
    }
      await db.import(sanitized);
      clearAnalyticsCache();
      const count = (await db.list()).length;
      res.json({ ok: true, count });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// CSV import endpoint: accepts text/csv payload in body.csv or raw string
router.post('/import/csv', async (req, res) => {
  try {
    const csvText = typeof req.body === 'string' ? req.body : req.body?.csv;
    if (!csvText || !csvText.trim()) return res.status(400).json({ ok: false, error: 'csv required' });

    const rows = parseCsv(csvText.trim());
    if (!rows.length) return res.status(400).json({ ok: false, error: 'no rows found' });

    // Determine headers
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const hasHeader = headers.includes('url') || headers.includes('alttext') || headers.includes('alt_text');
    const startIdx = hasHeader ? 1 : 0;
    const payload = [];

    const getField = (row, nameOrIndex) => {
      if (typeof nameOrIndex === 'number') return row[nameOrIndex] || '';
      const idx = headers.indexOf(nameOrIndex);
      return idx >= 0 ? row[idx] || '' : '';
    };

    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      const url = hasHeader ? getField(row, 'url') || getField(row, 'image_url') : row[0] || '';
      const alt = hasHeader ? getField(row, 'alttext') || getField(row, 'alt_text') || getField(row, 'alt') : row[1] || '';
      payload.push({ url, altText: alt });
    }

    if (!payload.length) return res.status(400).json({ ok: false, error: 'no data rows found' });

    // Reuse JSON import logic for validation
    const errors = [];
    const sanitized = [];
    payload.forEach((item, idx) => {
      if (!isPlainObject(item)) {
        errors.push({ index: idx, error: 'Item must be an object' });
        return;
      }
      const altRaw = item.altText || item.content;
      const urlRaw = item.url || '';
      const alt = normalizeStr(altRaw, MAX_ALT_LEN);
      const url = normalizeStr(urlRaw, MAX_URL_LEN);
      if (!alt) {
        errors.push({ index: idx, error: 'altText required' });
        return;
      }
      if (typeof urlRaw !== 'undefined' && !urlRaw) {
        errors.push({ index: idx, error: 'url cannot be empty string' });
        return;
      }
      if (urlRaw && urlRaw.length > MAX_URL_LEN) {
        errors.push({ index: idx, error: 'url too long' });
        return;
      }
      sanitized.push({ ...item, altText: alt, url });
    });

    if (errors.length) {
      res.set('Content-Disposition', 'attachment; filename=import-errors.json');
      return res.status(400).json({ ok: false, errors });
    }

      await db.import(sanitized);
      clearAnalyticsCache();
      const count = (await db.list()).length;
      res.json({ ok: true, count });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Lint-only endpoint for existing alt text
router.post('/lint', (req, res) => {
  const { altText = '', keywords = '', locale = 'default', brandTerms = '' } = req.body || {};
  const normAlt = normalizeStr(altText, MAX_ALT_LEN);
  const normKeywords = normalizeStr(keywords, MAX_KEYWORDS_LEN);
  const normBrand = normalizeStr(brandTerms, MAX_BRAND_TERMS_LEN);
  if (normKeywords.length > MAX_KEYWORDS_LEN) return res.status(400).json({ ok: false, error: 'Keywords too long' });
  if (normBrand.length > MAX_BRAND_TERMS_LEN) return res.status(400).json({ ok: false, error: 'Brand terms too long' });
  const lint = lintAlt(normAlt, normKeywords, locale, normBrand);
  const grade = gradeAlt({ altText: normAlt, keywords: normKeywords, lint, locale });
  res.json({ ok: true, lint, grade, sanitized: lint.sanitizedAlt, redacted: lint.redactedAlt });
});
router.get('/export', (req, res) => {
  db.list()
    .then(items => filterItems(items, req.query))
    .then(items => {
      const queryText = normalizeStr(req.query.q || req.query.query || '', 400);
      const limit = clampInt(req.query.limit || items.length || 0, 1, 1000);
      if (queryText) {
        const scored = items
          .map(item => ({ ...item, score: Number(similarityScore(queryText, `${item.altText || ''} ${item.url || ''}`).toFixed(3)) }))
          .filter(i => i.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
        return res.json({ ok: true, items: scored, query: queryText, limit, scored: true });
      }
      return res.json({ ok: true, items, limit: items.length });
    })
    .catch(err => res.status(500).json({ ok: false, error: err.message || 'DB error' }));
});

// CSV export endpoint
router.get('/export/csv', async (req, res) => {
  try {
    const items = filterItems(await db.list(), req.query);
    const includeHeaders = req.query.includeHeaders !== 'false';
    const queryText = normalizeStr(req.query.q || req.query.query || '', 400);
    const limit = clampInt(req.query.limit || items.length || 0, 1, 1000);
    const header = ['id', 'url', 'altText', 'createdAt'];
    const scored = queryText
      ? items
          .map(row => ({ ...row, score: Number(similarityScore(queryText, `${row.altText || ''} ${row.url || ''}`).toFixed(3)) }))
          .filter(r => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
      : items;
    if (queryText) header.push('score');
    const escape = value => {
      const str = (value ?? '').toString();
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const bodyLines = scored.map(row => [row.id, row.url || '', row.altText || '', row.createdAt || '', queryText ? row.score : undefined].filter(v => typeof v !== 'undefined').map(escape).join(','));
    const lines = includeHeaders ? [header.join(',')].concat(bodyLines) : bodyLines;
    const csv = lines.join('\n');
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename=image-alt-media.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// Health check for DB connectivity
router.get('/health/db', async (req, res) => {
  try {
    const result = await db.health();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});

// OpenAI health (config presence only; avoids live call to stay cheap)
router.get('/health/openai', (req, res) => {
  const configured = Boolean(process.env.OPENAI_API_KEY);
  res.json({ ok: true, configured });
});

// Full health: app + DB + config
router.get('/health/full', async (req, res) => {
  try {
    const dbOk = await db.health();
    const openaiReady = Boolean(process.env.OPENAI_API_KEY);
    const shopLock = SHOPIFY_STORE_URL || null;
    res.json({
      ok: true,
      checks: {
        db: dbOk,
        openai: openaiReady,
        shopLock,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Health error' });
  }
});

module.exports = router;