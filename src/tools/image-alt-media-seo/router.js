
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const OpenAI = require('openai');
const db = require('./db');
const runs = require('./runs');
const storageJson = require('../../core/storageJson');
const { shopifyFetchPaginated } = require('../../core/shopifyApi');
const fetch = (...args) => globalThis.fetch(...args);
const { getToken: getShopToken } = require('../../core/shopTokens');

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

// Hook metrics for observability (persisted to disk)
const defaultHookStats = {
  push: { success: 0, error: 0 },
  pull: { success: 0, error: 0 },
  aiImprove: { success: 0, error: 0 },
  lastPush: null,
  lastReplayAt: null,
  persistedAt: null,
};
let hookStats = { ...defaultHookStats };

const HOOK_STATS_KEY = 'image-alt-media-seo-hook-stats';
const normalizeHookStats = raw => {
  if (!raw || typeof raw !== 'object') return { ...defaultHookStats };
  const coerceCounts = obj => ({
    success: Math.max(0, Number(obj?.success) || 0),
    error: Math.max(0, Number(obj?.error) || 0),
  });
  const safePush = Array.isArray(raw.lastPush) ? raw.lastPush.slice(-50).map(item => ({
    id: item?.id,
    url: item?.url,
    altText: item?.altText,
  })) : null;
  return {
    push: coerceCounts(raw.push),
    pull: coerceCounts(raw.pull),
    aiImprove: coerceCounts(raw.aiImprove),
    lastPush: safePush,
    lastReplayAt: raw.lastReplayAt && Number.isFinite(raw.lastReplayAt) ? raw.lastReplayAt : null,
    persistedAt: raw.persistedAt && Number.isFinite(raw.persistedAt) ? raw.persistedAt : null,
  };
};

const persistHookStats = async () => {
  try {
    hookStats.persistedAt = Date.now();
    await storageJson.set(HOOK_STATS_KEY, hookStats);
  } catch (err) {
    console.warn('[image-alt-media-seo] failed to persist hook stats', err.message);
  }
};

const loadHookStats = async () => {
  try {
    const saved = await storageJson.get(HOOK_STATS_KEY, null);
    if (saved) hookStats = normalizeHookStats(saved);
  } catch (err) {
    console.warn('[image-alt-media-seo] failed to load hook stats', err.message);
  }
};
(async () => { await loadHookStats(); })();

const recordHook = (name, ok, meta = {}) => {
  if (!hookStats[name]) hookStats[name] = { success: 0, error: 0 };
  hookStats[name][ok ? 'success' : 'error'] += 1;
  if (name === 'push' && ok && meta.items) {
    const trimmed = Array.isArray(meta.items) ? meta.items.slice(-50).map(item => ({
      id: item?.id,
      url: item?.url,
      altText: item?.altText || item?.alt,
    })) : null;
    hookStats.lastPush = trimmed;
  }
  if (name === 'replay' && ok) hookStats.lastReplayAt = Date.now();
  // Persist asynchronously; errors are logged but non-blocking
  persistHookStats();
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

// Lightweight persistence for approvals + action log
const STATE_KEY = 'image-alt-media-seo-state';
const DEFAULT_STATE = { approvals: [], actionLog: [] };
const sanitizeApproval = entry => {
  if (!entry || typeof entry !== 'object') return null;
  const items = Array.isArray(entry.items) ? entry.items.map(i => ({
    id: i?.id,
    altText: i?.altText,
  })).filter(i => i.id && i.altText).slice(0, 50) : [];
  const validStatuses = new Set(['pending', 'approved', 'rejected', 'applied']);
  return {
    id: entry.id || `appr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: entry.label || 'Alt update',
    items,
    status: validStatuses.has(entry.status) ? entry.status : 'pending',
    requestedBy: entry.requestedBy || 'unknown',
    requestedAt: entry.requestedAt || Date.now(),
    approvedBy: entry.approvedBy || null,
    approvedAt: entry.approvedAt || null,
  };
};
const sanitizeAction = entry => {
  if (!entry || typeof entry !== 'object') return null;
  return {
    action: entry.action || 'action',
    count: Number.isFinite(entry.count) ? entry.count : Number(entry.count) || 0,
    role: entry.role || 'unknown',
    ts: entry.ts || Date.now(),
    label: entry.label,
  };
};
const loadState = async () => {
  const raw = await storageJson.get(STATE_KEY, DEFAULT_STATE);
  const approvals = Array.isArray(raw.approvals) ? raw.approvals.map(sanitizeApproval).filter(Boolean).slice(0, 100) : [];
  const actionLog = Array.isArray(raw.actionLog) ? raw.actionLog.map(sanitizeAction).filter(Boolean).slice(-200) : [];
  return { approvals, actionLog };
};
const saveState = async ({ approvals = [], actionLog = [] } = {}) => {
  const payload = {
    approvals: (approvals || []).map(sanitizeApproval).filter(Boolean).slice(0, 100),
    actionLog: (actionLog || []).map(sanitizeAction).filter(Boolean).slice(-200),
  };
  await storageJson.set(STATE_KEY, payload);
  return payload;
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

  let shop = (req.query.shop || req.headers['x-shopify-shop-domain'] || req.session?.shop || req.body?.shop || '').toLowerCase();
  const hmac = req.query.hmac;

  // Fallback to configured store if none provided
  if (!shop && SHOPIFY_STORE_URL) {
    shop = SHOPIFY_STORE_URL;
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

const SEGMENT_PROMPTS = {
  apparel: 'Mention cut, material, color, fit; avoid marketing fluff. Prioritize accessibility and practical descriptors.',
  electronics: 'Note device type, key specs, ports/buttons placement, and color; avoid speculative claims.',
  home: 'Include material, finish, size cues, and room context when visible; keep concise.',
  beauty: 'Name product type, shade, finish, applicator/packaging; avoid benefits/claims.',
  general: 'Describe the subject precisely with one distinguishing detail.',
};

const detectCategory = ({ productTitle = '', attributes = '', url = '', keywords = '', productType = '', tags = '' }) => {
  const haystack = [productTitle, attributes, url, keywords, productType, Array.isArray(tags) ? tags.join(' ') : tags].join(' ').toLowerCase();
  if (/(dress|shirt|hoodie|jacket|pants|jeans|sneaker|boot|apparel|cotton|denim|polyester|athleisure)/.test(haystack)) return 'apparel';
  if (/(laptop|tablet|phone|camera|headphone|charger|monitor|keyboard|mouse|electronics|smartwatch|wearable)/.test(haystack)) return 'electronics';
  if (/(sofa|chair|table|lamp|rug|bedding|pillow|kitchen|cookware|home decor|furniture)/.test(haystack)) return 'home';
  if (/(lipstick|mascara|serum|moisturizer|palette|skincare|fragrance|perfume|beauty)/.test(haystack)) return 'beauty';
  return 'general';
};

const enrichKeywords = ({ keywords = '', productTitle = '', vendor = '', productType = '', tags = [], collections = [] }) => {
  const bag = [];
  const pushTokens = val => {
    if (!val) return;
    const items = Array.isArray(val) ? val : String(val).split(/[,|]/);
    items.forEach(entry => {
      const token = (entry || '').toString().trim().toLowerCase();
      if (token) bag.push(token);
    });
  };
  pushTokens(keywords);
  pushTokens(productTitle.split(/\s+/));
  pushTokens(vendor);
  pushTokens(productType);
  pushTokens(tags);
  pushTokens(collections);
  const deduped = Array.from(new Set(bag)).filter(Boolean).slice(0, 20);
  return { enrichedKeywords: deduped.join(', '), keywordsUsed: deduped };
};

const detectLocaleFromText = text => {
  const sample = (text || '').toLowerCase();
  if (!sample) return null;
  if (/[äöüß]/.test(sample) || / und /.test(sample)) return 'de';
  if (/ el | la | una | un | los | las /.test(sample) || /ñ/.test(sample)) return 'es';
  if (/ le | la | une | des | avec /.test(sample) || /é|è|à|ç/.test(sample)) return 'fr';
  if (/が|です|ます/.test(sample)) return 'ja';
  if (/的/.test(sample)) return 'zh';
  if (/의/.test(sample)) return 'ko';
  return null;
};

const localeStyleGuide = locale => {
  const norm = normalizeLocale(locale);
  if (norm.startsWith('de')) return 'Deutsch: sentence-case nouns, avoid English adjectives, concise yet specific.';
  if (norm.startsWith('fr')) return 'Français: sentence-case, avoid English borrow words, concise descriptive phrase.';
  if (norm.startsWith('es')) return 'Español: neutral tone, avoid promotional phrasing, concise description.';
  if (norm.startsWith('ja')) return 'Japanese: short descriptive phrase, avoid katakana loanwords if unnecessary, no punctuation.';
  if (norm.startsWith('ko')) return 'Korean: concise noun-first phrasing, avoid honorifics, no marketing tone.';
  if (norm.startsWith('zh')) return 'Chinese: concise, simplified Chinese, noun-first, avoid marketing tone.';
  return 'Keep concise, factual, ADA-friendly phrasing.';
};

const diffAlt = (previous = '', next = '') => {
  const prevLen = (previous || '').length;
  const nextLen = (next || '').length;
  const overlap = similarityScore(previous || '', next || '');
  return { prevLen, nextLen, lengthDelta: nextLen - prevLen, overlap: Number(overlap.toFixed(3)) };
};

const visionCheck = ({ altText = '', url = '', productTitle = '' }) => {
  const urlTokens = tokenize(url).slice(0, 12);
  const titleTokens = tokenize(productTitle).slice(0, 12);
  const altTokens = tokenize(altText).slice(0, 50);
  const joined = new Set([...urlTokens, ...titleTokens].filter(Boolean));
  let overlap = 0;
  altTokens.forEach(tok => { if (joined.has(tok)) overlap += 1; });
  const coverage = altTokens.length ? overlap / altTokens.length : 0;
  const mismatch = coverage < 0.15;
  return { overlap: Number(coverage.toFixed(3)), mismatch };
};

const ENFORCE_ROLES = process.env.IMAGE_ALT_ENFORCE_ROLES === 'true';
const writerRoles = new Set(['admin', 'editor']);
const getRole = req => (req.headers['x-role'] || req.query.role || req.body?.role || 'editor').toString().toLowerCase();
const requireWriter = (req, res, next) => {
  if (!ENFORCE_ROLES) return next();
  const role = getRole(req);
  if (writerRoles.has(role)) return next();
  return res.status(403).json({ ok: false, error: 'Forbidden: editor or admin role required', role });
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
router.post('/images/import-shopify', requireWriter, async (req, res) => {
  let tokenSource = 'none';
  try {
    const shop = (req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'] || '').toLowerCase();
    if (!shop) return res.status(400).json({ ok: false, error: 'shop required (e.g., mystore.myshopify.com)' });
    if (!isValidShopDomain(shop)) return res.status(400).json({ ok: false, error: 'Invalid shop domain' });

    const maxImages = clampInt(req.body?.maxImages || req.query?.maxImages || 500, 1, 5000);
    const productLimit = clampInt(req.body?.productLimit || req.query?.productLimit || maxImages, 1, 5000);

    // Use admin-capable tokens only: request body/session first, then env, then persisted shop token
    const tokenSourceMap = {
      body: req.body?.token,
      session: req.session?.shopifyToken,
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
      SHOPIFY_ADMIN_API_TOKEN: process.env.SHOPIFY_ADMIN_API_TOKEN,
      SHOPIFY_API_TOKEN: process.env.SHOPIFY_API_TOKEN,
      SHOPIFY_ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_TOKEN,
      shopTokens: getShopToken(shop),
    };
    const tokenEntry = Object.entries(tokenSourceMap).find(([, val]) => !!val);
    const resolvedToken = tokenEntry ? tokenEntry[1] : null;
    tokenSource = tokenEntry ? tokenEntry[0] : 'none';

    console.log('[image-alt import-shopify] shop:', shop, 'tokenSource:', tokenSource, 'maxImages:', maxImages, 'productLimit:', productLimit);

    if (!resolvedToken) {
      return res.status(401).json({ ok: false, error: 'No Shopify admin token available for this shop. Reinstall the app or set SHOPIFY_ACCESS_TOKEN.', tokenSource });
    }

    const { items: products } = await shopifyFetchPaginated(
      shop,
      'products.json',
      { limit: 250, fields: 'id,title,handle,images' },
      resolvedToken,
      {
        maxPages: Math.ceil(productLimit / 250),
        rateLimitThreshold: 0.7,
        rateLimitSleepMs: 900,
      }
    );

    const trimmedProducts = products.slice(0, productLimit);

    const toCreate = [];
    let skipped = 0;
    const seenUrls = new Set();

    for (const product of trimmedProducts) {
      for (const image of product.images || []) {
        if (toCreate.length >= maxImages) break;
        const url = normalizeStr(image.src || image.original_src || '', MAX_URL_LEN);
        if (!url) {
          skipped += 1;
          continue;
        }
        const key = url.toLowerCase();
        // Skip duplicates within this import batch
        if (seenUrls.has(key)) {
          skipped += 1;
          continue;
        }
        seenUrls.add(key);
        const altText = normalizeStr(image.alt || image.alt_text || '', MAX_ALT_LEN);
        toCreate.push({ 
          url, 
          altText,
          productTitle: product.title || null,
          productHandle: product.handle || null,
          productId: String(product.id || '')
        });
      }
      if (toCreate.length >= maxImages) break;
    }

    const upserted = [];
    for (const item of toCreate) {
      const row = await db.upsertByUrl(item);
      upserted.push(row);
    }

    clearAnalyticsCache();

    res.json({
      ok: true,
      imported: upserted.length,
      skipped,
      total: toCreate.length + skipped,
      productCount: trimmedProducts.length,
      shop,
    });
  } catch (err) {
    const status = err.status || 500;
    console.warn('[image-alt import-shopify] failed', {
      status: err.status || 500,
      message: err.message,
      endpoint: err.endpoint,
      body: err.body,
      shop: (req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'] || '').toLowerCase(),
      tokenSource,
    });
    res.status(status).json({ ok: false, error: err.message || 'Shopify import failed', detail: err.body || undefined, endpoint: err.endpoint || undefined, tokenSource: tokenSource || undefined });
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
router.post('/images', requireWriter, async (req, res) => {
  try {
    const image = await db.create(req.body || {});
    clearAnalyticsCache();
    res.json({ ok: true, image });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});
router.put('/images/:id', requireWriter, async (req, res) => {
  try {
    const image = await db.update(req.params.id, req.body || {});
    if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
    clearAnalyticsCache();
    res.json({ ok: true, image });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'DB error' });
  }
});
router.delete('/images/:id', requireWriter, async (req, res) => {
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
router.post('/images/bulk-update', requireWriter, async (req, res) => {
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
    let locale = normalizeLocale(body.locale || 'default');
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
    const { enrichedKeywords, keywordsUsed } = enrichKeywords({ keywords, productTitle, vendor: body.vendor, productType: body.productType, tags: body.tags, collections: body.collections });
    const appliedKeywords = enrichedKeywords || keywords;
    const detectedCategory = detectCategory({ productTitle, attributes, url, keywords: appliedKeywords, productType: body.productType, tags: body.tags });
    const detectedLocale = detectLocaleFromText(description || productTitle || keywords) || null;
    if (detectedLocale && locale === 'default') {
      locale = normalizeLocale(detectedLocale);
    }

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
      { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${appliedKeywords || '(none)'}; Brand vocab: ${brandTerms || '(none)'}; Context: ${contextStr || '(none)'}; Segment: ${detectedCategory}; Style guide: ${localeStyleGuide(locale)}; Constraints: no promo language, no PII, keep concise. ${SEGMENT_PROMPTS[detectedCategory] || SEGMENT_PROMPTS.general} ${toneHint} ${verbosityHint}` },
    ];

    const variantTexts = await generateVariants({ openai, messages, maxTokens, variantCount, fallbackText: buildFallbackAlt({ imageDescription: description, url, keywords, productTitle, shotType }) });
    const variants = variantTexts.map((text, idx) => {
      const lint = lintAlt(text, appliedKeywords, locale, brandTerms);
      const grade = gradeAlt({ altText: text, keywords: appliedKeywords, lint, locale });
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

    res.json({ ok: true, result: finalAlt, variants, lint: primary?.lint, grade: primary?.grade, raw: primary?.altText, sanitized, appliedKeywords: keywordsUsed, appliedSegment: detectedCategory, detectedLocale: locale });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// AI endpoint: generate concise caption (single sentence)
router.post('/ai/caption', async (req, res) => {
  try {
    const body = req.body || {};
    let locale = normalizeLocale(body.locale || 'default');
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
    const { enrichedKeywords, keywordsUsed } = enrichKeywords({ keywords, productTitle, vendor: body.vendor, productType: body.productType, tags: body.tags, collections: body.collections });
    const appliedKeywords = enrichedKeywords || keywords;
    const detectedCategory = detectCategory({ productTitle, attributes, url, keywords: appliedKeywords, productType: body.productType, tags: body.tags });
    const detectedLocale = detectLocaleFromText(description || productTitle || keywords) || null;
    if (detectedLocale && locale === 'default') {
      locale = normalizeLocale(detectedLocale);
    }

    if (!description && !url) {
      return res.status(400).json({ ok: false, error: 'Provide input or url' });
    }

    const openai = getOpenAI();
    const contextStr = toContextString({ productTitle, attributes, shotType, focus, variant, scene });
    const messages = [
      { role: 'system', content: 'You write concise, specific, single-sentence image captions without promo language or PII.' },
      { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${appliedKeywords || '(none)'}; Brand vocab: ${brandTerms || '(none)'}; Context: ${contextStr || '(none)'}; Segment: ${detectedCategory}; Style: concise, human-friendly, single sentence. ${localeStyleGuide(locale)}` },
    ];
    const [captionRaw] = await generateVariants({ openai, messages, maxTokens: 80, variantCount: 1, fallbackText: buildFallbackAlt({ imageDescription: description, url, keywords, productTitle, shotType }) });
    const caption = captionRaw || '';
    const lint = lintAlt(caption, appliedKeywords, locale, brandTerms);
    const sanitized = lint?.sanitizedAlt && lint.sanitizedAlt !== caption ? lint.sanitizedAlt : null;
    let finalCaption = caption;
    if (safeMode) {
      if (lint?.redactedAlt) finalCaption = lint.redactedAlt;
      else if (sanitized) finalCaption = sanitized;
    }
    if (finalCaption && finalCaption.length > 240) finalCaption = finalCaption.slice(0, 240);

    res.json({ ok: true, caption: finalCaption, raw: caption, sanitized, lint, appliedKeywords: keywordsUsed, appliedSegment: detectedCategory, detectedLocale: locale });
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
    const simulateOnly = body.simulateOnly === true;
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
        const { enrichedKeywords, keywordsUsed } = enrichKeywords({ keywords: itemKeywords, productTitle, vendor: item.vendor, productType: item.productType, tags: item.tags, collections: item.collections });
        const appliedKeywords = enrichedKeywords || itemKeywords;
        const detectedCategory = detectCategory({ productTitle, attributes, url, keywords: appliedKeywords, productType: item.productType, tags: item.tags });
        const detectedLocale = detectLocaleFromText(description || productTitle || itemKeywords) || null;
        const itemLocale = normalizeLocale(item?.locale || detectedLocale || locale);

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
        
        // Build prompt text
        const promptText = `Generate a concise, ADA-friendly alt text for this product image.
Keywords to incorporate: ${appliedKeywords || '(none)'}
Brand vocabulary: ${itemBrandTerms || '(none)'}
Product context: ${contextStr || '(none)'}
Category: ${detectedCategory}
Style guide: ${localeStyleGuide(itemLocale)}
${SEGMENT_PROMPTS[detectedCategory] || SEGMENT_PROMPTS.general}
${toneHint} ${verbosityHint}

Constraints:
- Write in plain, accessible language
- NO promotional language or PII
- Be specific about what you SEE in the image
- Keep concise (under 125 characters)
${description ? `\nExisting description (may be inaccurate): ${description}` : ''}`;

        // Use vision API if URL provided, otherwise text-only
        const messages = url 
          ? [
              { role: 'system', content: 'You are an image SEO expert who writes concise, specific, ADA-friendly alt text based on what you actually see in images.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: promptText },
                  { type: 'image_url', image_url: { url: url, detail: 'low' } }
                ]
              },
            ]
          : [
              { role: 'system', content: 'You are an image SEO expert who writes concise, specific, ADA-friendly alt text without fluff.' },
              { role: 'user', content: promptText },
            ];
        
        const variantTexts = await generateVariants({ openai, messages, maxTokens, variantCount: itemVariantCount, fallbackText: buildFallbackAlt({ imageDescription: description, url, keywords: itemKeywords, productTitle, shotType }) });
        const variants = variantTexts.map((text, idx) => {
          const lint = lintAlt(text, appliedKeywords, itemLocale, itemBrandTerms);
          const grade = gradeAlt({ altText: text, keywords: appliedKeywords, lint, locale: itemLocale });
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
        const diff = item.originalAlt ? diffAlt(item.originalAlt, finalAlt) : null;
        const hitRate = primary?.lint ? Math.max(0, Math.min(100, 100 - (primary.lint.totalFindings || 0) * 5)) : null;
        results.push({ ok: true, result: finalAlt, variants, lint: primary?.lint, grade: primary?.grade, raw: primary?.altText, sanitized, diff, hitRate, appliedKeywords: keywordsUsed, appliedSegment: detectedCategory, detectedLocale: itemLocale, meta: { productTitle, url, shotType, focus, variant, brandTerms: itemBrandTerms, tone: itemTone, verbosity: itemVerbosity, variantCount: itemVariantCount } });
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
    const hitRates = results.filter(r => typeof r.hitRate === 'number').map(r => r.hitRate);
    const hitRateAvg = hitRates.length ? Math.round(hitRates.reduce((a, b) => a + b, 0) / hitRates.length) : null;
    if (hitRateAvg !== null) summary.hitRateAvg = hitRateAvg;
    summary.simulateOnly = simulateOnly;
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
router.post('/import', requireWriter, async (req, res) => {
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
router.post('/import/csv', requireWriter, async (req, res) => {
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

// Translate alt text to a target locale (batch-friendly)
router.post('/ai/translate', async (req, res) => {
  try {
    const targetLocale = normalizeLocale(req.body?.targetLocale || req.body?.locale || 'default');
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    const openai = getOpenAI();
    const results = [];
    for (const item of items) {
      const alt = normalizeStr(item?.altText || item?.alt || '', MAX_ALT_LEN);
      const id = item?.id;
      if (!alt) {
        results.push({ ok: false, error: 'altText required', id });
        continue;
      }
      const sourceLocale = detectLocaleFromText(alt) || 'unknown';
      let translated = alt;
      if (openai) {
        const messages = [
          { role: 'system', content: 'Translate the provided image alt text to the target locale. Keep meaning, keep length similar, avoid marketing tone. Return only the translated alt text.' },
          { role: 'user', content: `Target locale: ${targetLocale}. Alt text: ${alt}` },
        ];
        const completion = await withRetry(() => callOpenAIChat({ openai, messages, maxTokens: 120, n: 1 }));
        translated = completion.choices?.[0]?.message?.content?.trim() || alt;
      } else {
        translated = `[${targetLocale}] ${alt}`;
      }
      const lint = lintAlt(translated, '', targetLocale, '');
      results.push({ ok: true, id, altText: translated, sourceLocale, targetLocale, lint });
    }
    res.json({ ok: true, results, targetLocale });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Translate error' });
  }
});

// Heuristic vision/semantic QC (token overlap between URL/title and alt text)
router.post('/vision/qc', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    const results = items.map(item => {
      const altText = normalizeStr(item?.altText || item?.alt || '', MAX_ALT_LEN);
      const url = normalizeStr(item?.url || '', MAX_URL_LEN);
      const productTitle = normalizeStr(item?.productTitle || '', 200);
      const qc = visionCheck({ altText, url, productTitle });
      const note = qc.mismatch ? 'Alt may not match product context' : 'Alt seems aligned with product context';
      return { id: item?.id, url, altText, overlap: qc.overlap, mismatch: qc.mismatch, note };
    });
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Vision QC error' });
  }
});

// Cross-check with Shopify live data to detect drift (optionally auto-heal by syncing alt text)
router.post('/images/shopify-drift', requireWriter, async (req, res) => {
  let tokenSource = 'none';
  try {
    const shop = (req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'] || '').toLowerCase();
    if (!shop) return res.status(400).json({ ok: false, error: 'shop required (e.g., mystore.myshopify.com)' });
    if (!isValidShopDomain(shop)) return res.status(400).json({ ok: false, error: 'Invalid shop domain' });
    const limit = clampInt(req.body?.limit || req.query?.limit || 100, 1, 500);
    const autoHeal = req.body?.autoHeal === true;

    const tokenSourceMap = {
      body: req.body?.token,
      session: req.session?.shopifyToken,
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
      SHOPIFY_ADMIN_API_TOKEN: process.env.SHOPIFY_ADMIN_API_TOKEN,
      SHOPIFY_API_TOKEN: process.env.SHOPIFY_API_TOKEN,
      SHOPIFY_ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_TOKEN,
      shopTokens: getShopToken(shop),
    };
    const tokenEntry = Object.entries(tokenSourceMap).find(([, val]) => !!val);
    const resolvedToken = tokenEntry ? tokenEntry[1] : null;
    tokenSource = tokenEntry ? tokenEntry[0] : 'none';
    if (!resolvedToken) {
      return res.status(401).json({ ok: false, error: 'No Shopify admin token available', tokenSource });
    }

    const { items: products } = await shopifyFetchPaginated(
      shop,
      'products.json',
      { limit: 250, fields: 'id,title,handle,images' },
      resolvedToken,
      {
        maxPages: Math.ceil(limit / 250),
        rateLimitThreshold: 0.7,
        rateLimitSleepMs: 900,
      }
    );

    const trimmed = products.slice(0, Math.ceil(limit / 1));
    const existing = await db.list();
    const map = new Map();
    existing.forEach(row => { if (row.url) map.set(row.url.toLowerCase(), row); });
    const drift = [];
    const missing = [];
    for (const product of trimmed) {
      for (const image of product.images || []) {
        const url = normalizeStr(image.src || image.original_src || '', MAX_URL_LEN);
        if (!url) continue;
        const key = url.toLowerCase();
        const shopifyAlt = normalizeStr(image.alt || image.alt_text || '', MAX_ALT_LEN);
        const stored = map.get(key);
        if (!stored) {
          missing.push({ url, shopifyAlt });
          continue;
        }
        if ((stored.altText || '') !== shopifyAlt) {
          drift.push({ id: stored.id, url, storedAlt: stored.altText || '', shopifyAlt });
          if (autoHeal && shopifyAlt) {
            await db.upsertByUrl({ url, altText: shopifyAlt });
          }
        }
      }
    }
    if (autoHeal && drift.length) clearAnalyticsCache();
    res.json({ ok: true, drift, missing, shop, autoHeal, tokenSource, checked: drift.length + missing.length });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ ok: false, error: err.message || 'Shopify drift check failed', tokenSource });
  }
});

// Persisted collaboration state (approvals + action log)
router.get('/state', async (_req, res) => {
  try {
    const state = await loadState();
    res.json({ ok: true, ...state, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Failed to load state' });
  }
});

router.post('/state', requireWriter, async (req, res) => {
  try {
    const approvals = Array.isArray(req.body?.approvals) ? req.body.approvals : [];
    const actionLog = Array.isArray(req.body?.actionLog) ? req.body.actionLog : [];
    const saved = await saveState({ approvals, actionLog });
    res.json({ ok: true, approvals: saved.approvals.length, actionLog: saved.actionLog.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'Failed to save state' });
  }
});

// API hooks for CI / programmatic integrations
router.post('/hooks/push', requireWriter, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    const results = [];
    for (const item of items) {
      const url = normalizeStr(item?.url || '', MAX_URL_LEN);
      const altText = normalizeStr(item?.altText || item?.alt || '', MAX_ALT_LEN);
      if (!url || !altText) {
        results.push({ ok: false, error: 'url and altText required', item });
        continue;
      }
      const saved = await db.upsertByUrl({ url, altText });
      results.push(saved ? { ok: true, id: saved.id, url: saved.url } : { ok: false, error: 'upsert failed', url });
    }
    clearAnalyticsCache();
    recordHook('push', true, { items });
    res.json({ ok: true, results });
  } catch (err) {
    recordHook('push', false);
    res.status(500).json({ ok: false, error: err.message || 'Push error' });
  }
});

router.get('/hooks/pull', async (req, res) => {
  try {
    const limit = clampInt(req.query.limit || 50, 1, 500);
    const items = (await db.list()).slice(0, limit);
    recordHook('pull', true);
    res.json({ ok: true, items, limit });
  } catch (err) {
    recordHook('pull', false);
    res.status(500).json({ ok: false, error: err.message || 'Pull error' });
  }
});

router.post('/hooks/ai-improve', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const locale = normalizeLocale(req.body?.locale || 'default');
    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    const openai = getOpenAI();
    const results = [];
    for (const item of items) {
      const description = normalizeStr(item?.altText || item?.input || item?.imageDescription || '', MAX_DESC_LEN);
      const url = normalizeStr(item?.url || '', MAX_URL_LEN);
      const keywords = normalizeStr(item?.keywords || '', MAX_KEYWORDS_LEN);
      if (!description && !url) {
        results.push({ ok: false, error: 'altText or url required', item });
        continue;
      }
      const { enrichedKeywords, keywordsUsed } = enrichKeywords({ keywords, productTitle: item.productTitle, vendor: item.vendor, productType: item.productType, tags: item.tags });
      const appliedKeywords = enrichedKeywords || keywords;
      const detectedCategory = detectCategory({ productTitle: item.productTitle, attributes: item.attributes, url, keywords: appliedKeywords, productType: item.productType, tags: item.tags });
      const messages = [
        { role: 'system', content: 'Rewrite image alt text to improve clarity and accessibility. Keep concise, avoid marketing tone, avoid PII.' },
        { role: 'user', content: `Existing alt: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${appliedKeywords || '(none)'}; Segment: ${detectedCategory}; Style: ${localeStyleGuide(locale)}` },
      ];
      const completion = openai ? await withRetry(() => callOpenAIChat({ openai, messages, maxTokens: 120, n: 1 })) : null;
      const candidate = completion?.choices?.[0]?.message?.content?.trim() || description;
      const lint = lintAlt(candidate, appliedKeywords, locale, item.brandTerms || '');
      results.push({ ok: true, result: candidate, lint, appliedKeywords: keywordsUsed, appliedSegment: detectedCategory });
    }
    recordHook('aiImprove', true);
    res.json({ ok: true, results });
  } catch (err) {
    recordHook('aiImprove', false);
    res.status(500).json({ ok: false, error: err.message || 'AI improve error' });
  }
});

// Hook metrics and replay
router.get('/hooks/metrics', async (_req, res) => {
  res.json({ ok: true, hookStats });
});

router.post('/hooks/metrics/reset', requireWriter, async (_req, res) => {
  hookStats = { ...defaultHookStats };
  await persistHookStats();
  res.json({ ok: true, reset: true, hookStats });
});

router.post('/hooks/replay', requireWriter, async (_req, res) => {
  try {
    const items = Array.isArray(hookStats.lastPush) ? hookStats.lastPush : [];
    if (!items.length) return res.status(400).json({ ok: false, error: 'No previous push payload to replay' });
    const results = [];
    for (const item of items) {
      const url = normalizeStr(item?.url || '', MAX_URL_LEN);
      const altText = normalizeStr(item?.altText || item?.alt || '', MAX_ALT_LEN);
      if (!url || !altText) {
        results.push({ ok: false, error: 'url and altText required', item });
        continue;
      }
      const saved = await db.upsertByUrl({ url, altText });
      results.push(saved ? { ok: true, id: saved.id, url: saved.url } : { ok: false, error: 'upsert failed', url });
    }
    clearAnalyticsCache();
    recordHook('replay', true, { items });
    res.json({ ok: true, results, replayed: items.length });
  } catch (err) {
    recordHook('replay', false);
    res.status(500).json({ ok: false, error: err.message || 'Replay error' });
  }
});

// Push local alt text back to Shopify images (by matching image URL)
router.post('/images/push-shopify', requireWriter, async (req, res) => {
  let tokenSource = 'none';
  try {
    const shop = (req.body?.shop || req.query?.shop || req.headers['x-shopify-shop-domain'] || '').toLowerCase();
    if (!shop) return res.status(400).json({ ok: false, error: 'shop required (e.g., mystore.myshopify.com)' });
    if (!isValidShopDomain(shop)) return res.status(400).json({ ok: false, error: 'Invalid shop domain' });
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ ok: false, error: 'items[] required (url + altText)' });
    if (items.length > 500) return res.status(400).json({ ok: false, error: 'Max 500 items per push' });

    const tokenSourceMap = {
      body: req.body?.token,
      session: req.session?.shopifyToken,
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
      SHOPIFY_ADMIN_API_TOKEN: process.env.SHOPIFY_ADMIN_API_TOKEN,
      SHOPIFY_API_TOKEN: process.env.SHOPIFY_API_TOKEN,
      SHOPIFY_ADMIN_TOKEN: process.env.SHOPIFY_ADMIN_TOKEN,
      shopTokens: getShopToken(shop),
    };
    const tokenEntry = Object.entries(tokenSourceMap).find(([, val]) => !!val);
    const resolvedToken = tokenEntry ? tokenEntry[1] : null;
    tokenSource = tokenEntry ? tokenEntry[0] : 'none';
    if (!resolvedToken) {
      return res.status(401).json({ ok: false, error: 'No Shopify admin token available', tokenSource });
    }

    // Pull a product image map to resolve URLs -> image IDs
    const maxProducts = clampInt(req.body?.productLimit || req.query?.productLimit || 400, 50, 2000);
    const { items: products } = await shopifyFetchPaginated(
      shop,
      'products.json',
      { limit: 250, fields: 'id,images' },
      resolvedToken,
      {
        maxPages: Math.ceil(maxProducts / 250),
        rateLimitThreshold: 0.75,
        rateLimitSleepMs: 900,
      }
    );

    const imageMap = new Map(); // urlLower -> { productId, imageId }
    products.forEach(p => {
      (p.images || []).forEach(img => {
        const url = normalizeStr(img.src || img.original_src || '', MAX_URL_LEN);
        if (url) imageMap.set(url.toLowerCase(), { productId: p.id, imageId: img.id });
      });
    });

    const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
    const results = [];
    let synced = 0;
    let notFound = 0;
    let errors = 0;

    for (const item of items) {
      const url = normalizeStr(item?.url || '', MAX_URL_LEN);
      const altText = normalizeStr(item?.altText || item?.alt || '', MAX_ALT_LEN);
      if (!url || !altText) {
        results.push({ ok: false, error: 'url and altText required', url });
        errors += 1;
        continue;
      }
      const mapping = imageMap.get(url.toLowerCase());
      if (!mapping) {
        results.push({ ok: false, error: 'not found in Shopify catalog', url });
        notFound += 1;
        continue;
      }

      const endpoint = `https://${shop}/admin/api/${apiVersion}/products/${mapping.productId}/images/${mapping.imageId}.json`;
      try {
        const resp = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': resolvedToken,
          },
          body: JSON.stringify({ image: { id: mapping.imageId, alt: altText } }),
        });
        const text = await resp.text();
        const json = text ? JSON.parse(text) : {};
        if (!resp.ok) {
          results.push({ ok: false, error: json?.errors || text || `HTTP ${resp.status}`, url, productId: mapping.productId, imageId: mapping.imageId });
          errors += 1;
          continue;
        }
        synced += 1;
        results.push({ ok: true, url, altText, productId: mapping.productId, imageId: mapping.imageId });
      } catch (err) {
        results.push({ ok: false, error: err.message || 'Shopify push failed', url, productId: mapping.productId, imageId: mapping.imageId });
        errors += 1;
      }
    }

    recordHook('push', errors === 0, { items: items.slice(0, 50) });
    res.json({ ok: true, synced, notFound, errors, total: items.length, products: products.length, tokenSource, results });
  } catch (err) {
    recordHook('push', false);
    const status = err.status || 500;
    res.status(status).json({ ok: false, error: err.message || 'Shopify push failed', tokenSource });
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