
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const db = require('./db');
const runs = require('./runs');

// Lazily instantiate OpenAI so we can return graceful errors when not configured
const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
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
  const band = lengthBands[locale?.toLowerCase()] || lengthBands.default;
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

const lintAlt = (altText = '', keywords = '', locale = 'default') => {
  const band = lengthBands[locale.toLowerCase()] || lengthBands.default;
  const len = altText.trim().length;
  const maxRecommended = band.max;
  const minRecommended = band.min;
  const issues = [];
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
  const sanitizedAlt = sanitizeAlt(altText);
  const redactedAlt = piiHit ? redactAlt(altText) : null;
  return {
    length: len,
    withinRange: len >= minRecommended && len <= maxRecommended,
    issues,
    sanitizedAlt,
    redactedAlt,
  };
};

// CRUD endpoints (persistent)
router.get('/images', (req, res) => {
  res.json({ ok: true, images: db.list() });
});
router.get('/images/:id', (req, res) => {
  const image = db.get(req.params.id);
  if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, image });
});
router.post('/images', (req, res) => {
  const image = db.create(req.body || {});
  res.json({ ok: true, image });
});
router.put('/images/:id', (req, res) => {
  const image = db.update(req.params.id, req.body || {});
  if (!image) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, image });
});
router.delete('/images/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: generate alt text (accepts both legacy and new payloads)
router.post(['/ai/generate', '/ai/generate-alt'], async (req, res) => {
  try {
    const { input, imageDescription, url, keywords, locale = 'default', safeMode = false, productTitle = '', attributes = '', shotType = '', focus = '', variant = '', scene = '' } = req.body || {};
    const description = input || imageDescription || '';
    if (!description && !url) {
      return res.status(400).json({ ok: false, error: 'Provide input or url' });
    }

    const openai = getOpenAI();
    let reply = '';

    if (openai) {
      const contextStr = toContextString({ productTitle, attributes, shotType, focus, variant, scene });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an image SEO expert who writes concise, specific, ADA-friendly alt text without fluff.' },
          { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${keywords || '(none)'}; Context: ${contextStr || '(none)'}; Constraints: no promo language, no PII, keep concise.` },
        ],
        max_tokens: 120,
        temperature: 0.4,
      });
      reply = completion.choices?.[0]?.message?.content?.trim() || '';
    }

    if (!reply) {
      reply = buildFallbackAlt({ imageDescription: description, url, keywords, productTitle, shotType });
    }

    const lint = lintAlt(reply, keywords, locale);
    const grade = gradeAlt({ altText: reply, keywords, lint, locale });
    const sanitized = lint.sanitizedAlt && lint.sanitizedAlt !== reply ? lint.sanitizedAlt : null;

    let finalAlt = reply;
    if (safeMode) {
      if (lint.redactedAlt) finalAlt = lint.redactedAlt;
      else if (sanitized) finalAlt = sanitized;
    }

    res.json({ ok: true, result: finalAlt, lint, grade, raw: reply, sanitized });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Batch generate (sequential to respect rate limits)
router.post('/ai/batch-generate', async (req, res) => {
  try {
    const { items = [], locale = 'default', safeMode = false, keywords = '', chunkSize = 50 } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ ok: false, error: 'items[] required' });
    if (items.length > 200) return res.status(400).json({ ok: false, error: 'Max 200 items per batch' });
    const openai = getOpenAI();
    const results = [];
    const startedAt = Date.now();
    for (const item of items) {
      const { input, imageDescription, url, productTitle = '', attributes = '', shotType = '', focus = '', variant = '', scene = '' } = item || {};
      const description = input || imageDescription || '';
      if (!description && !url) {
        results.push({ ok: false, error: 'Provide input or url', item });
        continue;
      }
      let reply = '';
      if (openai) {
        const contextStr = toContextString({ productTitle, attributes, shotType, focus, variant, scene });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an image SEO expert who writes concise, specific, ADA-friendly alt text without fluff.' },
            { role: 'user', content: `Image description: ${description || '(none)'}; URL: ${url || '(none)'}; Keywords: ${item.keywords || keywords || '(none)'}; Context: ${contextStr || '(none)'}; Constraints: no promo language, no PII, keep concise.` },
          ],
          max_tokens: 120,
          temperature: 0.4,
        });
        reply = completion.choices?.[0]?.message?.content?.trim() || '';
      }
      if (!reply) {
        reply = buildFallbackAlt({ imageDescription: description, url, keywords: item.keywords || keywords, productTitle, shotType });
      }
      const lint = lintAlt(reply, item.keywords || keywords, locale);
      const grade = gradeAlt({ altText: reply, keywords: item.keywords || keywords, lint, locale });
      const sanitized = lint.sanitizedAlt && lint.sanitizedAlt !== reply ? lint.sanitizedAlt : null;
      let finalAlt = reply;
      if (safeMode) {
        if (lint.redactedAlt) finalAlt = lint.redactedAlt;
        else if (sanitized) finalAlt = sanitized;
      }
      results.push({ ok: true, result: finalAlt, lint, grade, raw: reply, sanitized, meta: { productTitle, url, shotType, focus, variant } });
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
      locale,
      safeMode,
      keywords: keywords || undefined,
    };
    runs.add(summary);
    res.json({ ok: true, results, summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// Batch runs log
router.get('/runs', (req, res) => {
  res.json({ ok: true, runs: runs.list() });
});


// Analytics endpoint (live)
router.get('/analytics', (req, res) => {
  const all = db.list();
  const lengths = all.map(i => (i.altText || '').length);
  const avgLength = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
  const missingUrl = all.filter(i => !i.url).length;
  const missingAlt = all.filter(i => !i.altText).length;
  const counts = all.reduce((acc, item) => {
    const alt = (item.altText || '').trim();
    if (!alt) return acc;
    acc[alt] = (acc[alt] || 0) + 1;
    return acc;
  }, {});
  const duplicateAlts = Object.values(counts).filter(c => c > 1).length;
  const uniqueAlts = Object.keys(counts).length;
  const coveragePct = all.length ? Math.round(((all.length - missingAlt) / all.length) * 100) : 0;
  res.json({ ok: true, analytics: { totalImages: all.length, avgLength, missingUrl, missingAlt, duplicateAlts, uniqueAlts, coveragePct } });
});

// Import/export endpoints (live)
router.post('/import', (req, res) => {
  const { items, data, dryRun } = req.body || {};
  const payload = Array.isArray(items) ? items : Array.isArray(data) ? data : null;
  if (!payload) return res.status(400).json({ ok: false, error: 'items[] required' });
  const errors = [];
  payload.forEach((item, idx) => {
    const alt = item?.altText || item?.content;
    if (!alt || typeof alt !== 'string' || !alt.trim()) {
      errors.push({ index: idx, error: 'altText required' });
    }
  });
  if (dryRun) {
    return res.json({ ok: !errors.length, dryRun: true, count: payload.length, errors });
  }
  if (errors.length) return res.status(400).json({ ok: false, errors });
  db.import(payload);
  res.json({ ok: true, count: db.list().length });
});

// Lint-only endpoint for existing alt text
router.post('/lint', (req, res) => {
  const { altText = '', keywords = '', locale = 'default' } = req.body || {};
  const lint = lintAlt(altText, keywords, locale);
  const grade = gradeAlt({ altText, keywords, lint, locale });
  res.json({ ok: true, lint, grade, sanitized: lint.sanitizedAlt, redacted: lint.redactedAlt });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

module.exports = router;