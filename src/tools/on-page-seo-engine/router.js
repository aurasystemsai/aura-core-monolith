const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const rbac = require('./rbac');
const i18n = require('./i18n');
const analytics = require('./analyticsModel');
const notificationModel = require('./notificationModel');
const webhookModel = require('./webhookModel');
const pluginSystem = require('./pluginSystem');
const complianceModel = require('./complianceModel');
const router = express.Router();

// ── Page Fetch & Auto-Analyse ─────────────────────────────────────────────────
// POST /api/on-page-seo-engine/fetch-page
// Crawls a URL and returns all SEO fields pre-extracted
router.post('/fetch-page', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'url is required' });

  try {
    const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    });

    if (!response.ok) return res.status(400).json({ ok: false, error: `Page returned HTTP ${response.status}` });

    const html = await response.text();
    const finalUrl = response.url || url;

    function matchOne(re) { const m = re.exec(html); return m && m[1] ? m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null; }
    function countMatches(re) { return (html.match(re) || []).length; }
    function decode(s) { return s ? s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim() : null; }

    const title = decode(matchOne(/<title[^>]*>([\s\S]*?)<\/title>/i));
    const metaDescription = decode(
      matchOne(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
      matchOne(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i)
    );
    const h1 = decode(matchOne(/<h1[^>]*>([\s\S]*?)<\/h1>/i));
    const h2Count = countMatches(/<h2[\s>]/gi);
    const h3Count = countMatches(/<h3[\s>]/gi);

    const canonicalMatch = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html) ||
                           /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i.exec(html);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

    const hasSchema = /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html);

    // Word count from visible text
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;

    // Links
    const parsed = new URL(finalUrl);
    const host = parsed.hostname;
    const allLinks = [...html.matchAll(/<a[^>]+href=["']([^"'#?][^"']*)["']/gi)].map(m => m[1]);
    const internalLinks = allLinks.filter(l => {
      try { return new URL(l, finalUrl).hostname === host; } catch { return l.startsWith('/'); }
    }).length;
    const externalLinks = allLinks.filter(l => {
      try { const u = new URL(l, finalUrl); return u.hostname !== host && u.protocol.startsWith('http'); } catch { return false; }
    }).length;

    // Images
    const imgTags = [...html.matchAll(/<img([^>]*)>/gi)].map(m => m[1]);
    const imageCount = imgTags.length;
    const imagesWithAlt = imgTags.filter(attrs => /alt=["'][^"']+["']/i.test(attrs)).length;

    // OG tags
    const ogTitle = matchOne(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i);
    const ogDescription = matchOne(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i);

    res.json({
      ok: true,
      url: finalUrl,
      title, metaDescription, h1,
      h2Count, h3Count,
      wordCount, canonicalUrl,
      schemaMarkup: hasSchema ? 'yes' : '',
      internalLinks, externalLinks,
      imageCount, imagesWithAlt,
      ogTitle: decode(ogTitle), ogDescription: decode(ogDescription),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// CRUD endpoints
router.get('/items', (req, res) => {
	res.json({ ok: true, items: db.list() });
});
router.get('/items/:id', (req, res) => {
	const item = db.get(req.params.id);
	if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, item });
});
router.post('/items', (req, res) => {
	const item = db.create(req.body || {});
	res.json({ ok: true, item });
});
router.put('/items/:id', (req, res) => {
	const item = db.update(req.params.id, req.body || {});
	if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true, item });
});
router.delete('/items/:id', (req, res) => {
	const ok = db.delete(req.params.id);
	if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
	res.json({ ok: true });
});

// AI endpoint
router.post('/ai/generate', async (req, res) => {
	try {
		const { messages, prompt } = req.body || {};
		if (!messages && !prompt) return res.status(400).json({ ok: false, error: 'Missing messages or prompt' });
		const chatMessages = messages || [
			{ role: 'system', content: 'You are an expert AI for on-page SEO.' },
			{ role: 'user', content: prompt }
		];
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: chatMessages,
			max_tokens: 512,
			temperature: 0.7
		});
		const reply = completion.choices[0]?.message?.content?.trim() || '';
		res.json({ ok: true, reply });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message });
	}
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
	const event = analytics.recordEvent(req.body || {});
	res.json({ ok: true, event });
});
router.get('/analytics', (req, res) => {
	res.json({ ok: true, events: analytics.listEvents(req.query || {}) });
});

// Import/export endpoints
router.post('/import', (req, res) => {
	const { items } = req.body || {};
	if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
	const result = db.import(items);
	res.json({ ok: true, result });
});
router.get('/export', (req, res) => {
	res.json({ ok: true, items: db.list() });
});

// Shopify sync endpoints

// Shopify sync endpoint (to be implemented live)
// router.post('/shopify/sync', ...)

// Notifications endpoints
router.post('/notify', (req, res) => {
	const { to, message } = req.body || {};
	if (!to || !message) return res.status(400).json({ ok: false, error: 'to and message required' });
	notificationModel.send(to, message);
	res.json({ ok: true });
});

// RBAC endpoint
router.post('/rbac/check', (req, res) => {
	const { user, action } = req.body || {};
	const allowed = rbac.check(user, action);
	res.json({ ok: true, allowed });
});

// i18n endpoint
router.get('/i18n', (req, res) => {
	res.json({ ok: true, i18n });
});

// Docs endpoint
router.get('/docs', (req, res) => {
	res.json({ ok: true, docs: 'On-Page SEO Engine API: CRUD, AI, analytics, import/export, Shopify sync, notifications, RBAC, i18n.' });
});

// Webhook endpoint
router.post('/webhook', (req, res) => {
	webhookModel.handle(req.body || {});
	res.json({ ok: true });
});

// Compliance endpoint
router.get('/compliance', (req, res) => {
	res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugin system endpoint
router.post('/plugin', (req, res) => {
	pluginSystem.run(req.body || {});
	res.json({ ok: true });
});

module.exports = router;