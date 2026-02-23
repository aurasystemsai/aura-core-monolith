const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ── AI Audit — main endpoint ─────────────────────────────────────────────────
// POST /api/technical-seo-auditor/ai/audit
// Frontend sends { site }, expects { ok, auditReport }
router.post('/ai/audit', async (req, res) => {
  try {
    const { site, url } = req.body || {};
    const target = site || url;
    if (!target) return res.status(400).json({ ok: false, error: 'site or url is required' });

    const model = 'gpt-4o-mini';

    // First, try to crawl the page for real data
    let pageData = null;
    try {
      const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
      const response = await fetch(target.startsWith('http') ? target : `https://${target}`, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'AURA Technical SEO Auditor (+https://aurasystemsai.com)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
      });
      if (response.ok) {
        const html = await response.text();
        const matchOne = (re) => { const m = re.exec(html); return m && m[1] ? m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null; };

        pageData = {
          url: response.url || target,
          statusCode: response.status,
          https: (response.url || target).startsWith('https'),
          title: matchOne(/<title[^>]*>([\s\S]*?)<\/title>/i),
          metaDescription: matchOne(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i),
          h1: matchOne(/<h1[^>]*>([\s\S]*?)<\/h1>/i),
          hasCanonical: /<link[^>]+rel=["']canonical["']/i.test(html),
          hasSchema: /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
          hasRobotsMeta: /<meta[^>]+name=["']robots["']/i.test(html),
          hasSitemap: html.includes('sitemap') || html.includes('Sitemap'),
          hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
          pageSizeKB: Math.round(Buffer.byteLength(html, 'utf8') / 1024),
          imageCount: (html.match(/<img[\s>]/gi) || []).length,
          imagesWithAlt: (html.match(/<img[^>]+alt=["'][^"']+["']/gi) || []).length,
          inlineStyles: (html.match(/style=["']/gi) || []).length,
          h2Count: (html.match(/<h2[\s>]/gi) || []).length,
          h3Count: (html.match(/<h3[\s>]/gi) || []).length,
        };
      }
    } catch (crawlErr) {
      // Crawl failed — AI will analyze based on URL alone
    }

    const pageContext = pageData
      ? `\n\nCrawled page data:\n${JSON.stringify(pageData, null, 2)}`
      : '\n\n(Could not crawl page — provide general technical SEO guidance for this URL)';

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert technical SEO auditor for Shopify e-commerce stores. Perform a comprehensive technical SEO audit and provide:

1. **Overall Health Score** (0-100) with letter grade
2. **Critical Issues** — problems that are actively hurting SEO
3. **Warnings** — issues that should be addressed soon
4. **Passed Checks** — things the site does well
5. **Performance Notes** — page size, load concerns
6. **Mobile Readiness** — viewport, responsive design signals
7. **Structured Data** — schema markup assessment
8. **Recommendations** — prioritized action items (most impactful first)

Be specific with findings. Reference actual data when available. Format with clear markdown headers.`
        },
        { role: 'user', content: `Audit this site: ${target}${pageContext}` }
      ],
      max_tokens: 1500,
      temperature: 0.5
    });

    const auditReport = completion.choices[0]?.message?.content?.trim() || '';

    // Deduct credits
    if (req.deductCredits) req.deductCredits({ model });

    // Record analytics
    await db.recordEvent({ type: 'ai-audit', site: target, model });

    res.json({ ok: true, auditReport, pageData });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── History ──────────────────────────────────────────────────────────────────
// GET /api/technical-seo-auditor/history
router.get('/history', async (req, res) => {
  try { res.json({ ok: true, history: await db.listHistory() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
// POST /api/technical-seo-auditor/history
router.post('/history', async (req, res) => {
  try {
    const entry = await db.addHistory(req.body || {});
    res.json({ ok: true, entry });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try { res.json({ ok: true, analytics: await db.listAnalytics() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/analytics', async (req, res) => {
  try { res.json({ ok: true, event: await db.recordEvent(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Feedback ─────────────────────────────────────────────────────────────────
router.post('/feedback', async (req, res) => {
  try {
    const { feedback } = req.body || {};
    if (!feedback) return res.status(400).json({ ok: false, error: 'feedback is required' });
    const entry = await db.saveFeedback({ feedback });
    res.json({ ok: true, entry });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Import / Export ──────────────────────────────────────────────────────────
router.post('/import', async (req, res) => {
  try {
    const { data, items } = req.body || {};
    const arr = Array.isArray(data) ? data : Array.isArray(items) ? items : null;
    if (!arr) return res.status(400).json({ ok: false, error: 'data[] or items[] required' });
    const count = await db.importData(arr);
    res.json({ ok: true, count });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/export', async (req, res) => {
  try { res.json({ ok: true, history: await db.listHistory() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'technical-seo-auditor', ts: new Date().toISOString() });
});

module.exports = router;