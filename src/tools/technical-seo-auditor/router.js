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

/* ==========================================================================
   FEATURE 35 & 36: Core Web Vitals + INP Assessment
   POST /api/technical-seo-auditor/cwv-assess
   Uses PageSpeed Insights API + AI to audit CWV and INP
   ========================================================================== */
router.post('/cwv-assess', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    // Try PageSpeed Insights API (requires PAGESPEED_API_KEY or falls back to simulation)
    let cwvData = null;
    const apiKey = process.env.PAGESPEED_API_KEY;
    if (apiKey) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(fullUrl)}&key=${apiKey}&strategy=mobile&category=performance`;
        const r = await fetchMod(psiUrl, { timeout: 30000 });
        if (r.ok) {
          const psi = await r.json();
          const metrics = psi.loadingExperience?.metrics || {};
          const lhr = psi.lighthouseResult?.audits || {};
          cwvData = {
            lcp: metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile / 1000 || null,
            inp: metrics.INTERACTION_TO_NEXT_PAINT?.percentile || null,
            cls: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100 || null,
            fcp: metrics.FIRST_CONTENTFUL_PAINT_MS?.percentile / 1000 || null,
            ttfb: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile / 1000 || null,
            performanceScore: Math.round((psi.lighthouseResult?.categories?.performance?.score || 0) * 100),
            speedIndex: lhr['speed-index']?.displayValue,
            tbt: lhr['total-blocking-time']?.displayValue,
            lcpStatus: metrics.LARGEST_CONTENTFUL_PAINT_MS?.category,
            inpStatus: metrics.INTERACTION_TO_NEXT_PAINT?.category,
            clsStatus: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category,
          };
        }
      } catch {}
    }

    // AI analysis with or without real data
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a Core Web Vitals optimization expert for Shopify stores.

URL: ${fullUrl}
${cwvData ? `Real CWV data from PageSpeed Insights: ${JSON.stringify(cwvData)}` : '(No API data available — provide guidance based on URL patterns)'}

Analyze and provide recommendations for all Core Web Vitals:

**LCP (Largest Contentful Paint)** — Target: <2.5s
- Common Shopify culprits: unoptimized hero images, render-blocking themes, slow Shopify CDN origin
- Fix strategies: WebP/AVIF images, preload LCP resource, lazy-load non-LCP images

**INP (Interaction to Next Paint)** — Target: <200ms (replaced FID in March 2024)
- Most critical new metric. Common Shopify culprits: heavy JavaScript (apps, chat widgets, tracking scripts), unoptimized event handlers
- Fix strategies: reduce JS execution, use passive event listeners, code split app scripts

**CLS (Cumulative Layout Shift)** — Target: <0.1
- Common Shopify culprits: images without dimensions, dynamically injected content, web fonts causing FOIT/FOUT
- Fix strategies: aspect-ratio CSS, explicit width/height on images, font-display: swap

**TTFB (Time to First Byte)** — Target: <800ms
- Common Shopify culprits: unauthenticated CDN miss, server response time, third-party scripts

Respond as JSON:
{
  "performanceScore": ${cwvData?.performanceScore || 50},
  "cwv": {
    "lcp": { "value": ${cwvData?.lcp || null}, "status": "${cwvData?.lcpStatus || 'unknown'}", "target": 2.5, "tips": ["tip1","tip2"] },
    "inp": { "value": ${cwvData?.inp || null}, "status": "${cwvData?.inpStatus || 'unknown'}", "target": 200, "tips": ["tip1","tip2"] },
    "cls": { "value": ${cwvData?.cls || null}, "status": "${cwvData?.clsStatus || 'unknown'}", "target": 0.1, "tips": ["tip1","tip2"] },
    "ttfb": { "value": ${cwvData?.ttfb || null}, "status": "unknown", "target": 0.8, "tips": ["tip1","tip2"] }
  },
  "shopifySpecificFixes": ["list of Shopify-specific performance fixes"],
  "prioritizedActions": [
    { "action": "string", "metric": "LCP|INP|CLS|TTFB", "effort": "low|medium|high", "impact": "high|medium|low" }
  ],
  "inpDeepDive": "Specific INP analysis and fixes for Shopify stores",
  "overallAssessment": "Pass|Needs Improvement|Poor"
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'cwv-assess', url });
    res.json({ ok: true, url, hasRealData: !!cwvData, rawCwvData: cwvData, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 40: Crawlability & Indexability Audit
   POST /api/technical-seo-auditor/crawl-audit
   Deep check of robots.txt, canonical, noindex, AI crawlers
   ========================================================================== */
router.post('/crawl-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const parsedUrl = new URL(fullUrl);
    const base = `${parsedUrl.protocol}//${parsedUrl.host}`;

    const fetchMod = (await import('node-fetch')).default;
    const cheerio = require('cheerio');

    // Fetch the page
    let html = '', status = 0, finalUrl = fullUrl;
    try {
      const r = await fetchMod(fullUrl, { headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }, timeout: 15000, redirect: 'follow' });
      status = r.status;
      finalUrl = r.url;
      html = await r.text();
    } catch (e) {
      return res.status(502).json({ ok: false, error: `Could not fetch URL: ${e.message}` });
    }

    // Fetch robots.txt
    let robotsTxt = '';
    try {
      const r = await fetchMod(`${base}/robots.txt`, { timeout: 8000 });
      if (r.ok) robotsTxt = await r.text();
    } catch {}

    // Fetch sitemap
    let sitemapFound = false, sitemapUrl = '';
    const sitemapMatch = robotsTxt.match(/^Sitemap:\s*(.+)$/im);
    if (sitemapMatch) { sitemapUrl = sitemapMatch[1].trim(); sitemapFound = true; }
    else {
      try {
        const r = await fetchMod(`${base}/sitemap.xml`, { timeout: 6000 });
        if (r.ok) { sitemapFound = true; sitemapUrl = `${base}/sitemap.xml`; }
      } catch {}
    }

    const $ = cheerio.load(html);

    // Core checks
    const robotsMeta = $('meta[name="robots"]').attr('content') || $('meta[name="Robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robotsMeta);
    const hasNofollow = /nofollow/i.test(robotsMeta);
    const canonicalHref = $('link[rel="canonical"]').attr('href') || '';
    const canonicalDiffersFromUrl = canonicalHref && canonicalHref !== finalUrl && canonicalHref !== url;
    const isHTTPS = finalUrl.startsWith('https://');
    const redirectHappened = finalUrl !== fullUrl;
    const statusOk = status >= 200 && status < 300;

    // Check if page blocked in robots.txt for Googlebot
    let googlebotBlocked = false;
    let inGooglebot = false, inWildcard = false;
    let googleDisallowAll = false, wildcardDisallowAll = false;
    robotsTxt.split('\n').forEach(line => {
      line = line.trim();
      if (/^user-agent:\s*googlebot$/i.test(line)) { inGooglebot = true; inWildcard = false; }
      else if (/^user-agent:\s*\*$/i.test(line)) { inWildcard = true; inGooglebot = false; }
      else if (/^user-agent:/i.test(line)) { inGooglebot = false; inWildcard = false; }
      if (/^disallow:\s*\/\s*$/.test(line)) {
        if (inGooglebot) googleDisallowAll = true;
        if (inWildcard) wildcardDisallowAll = true;
      }
    });
    googlebotBlocked = googleDisallowAll || wildcardDisallowAll;

    // Canonical pointing to different domain?
    let canonicalCrossOrigin = false;
    if (canonicalHref) {
      try { canonicalCrossOrigin = new URL(canonicalHref).host !== parsedUrl.host; } catch {}
    }

    // Check title and meta desc
    const pageTitle = $('title').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    const checks = [
      { name: 'HTTPS', pass: isHTTPS, value: finalUrl.slice(0, 50), tip: 'Serve all pages over HTTPS — required for Shopify stores.' },
      { name: 'HTTP 200 status', pass: statusOk, value: `HTTP ${status}`, tip: status === 404 ? 'Page returns 404 — ensure URL is correct and page is published.' : `Fix HTTP ${status} error.` },
      { name: 'Not blocked in robots.txt', pass: !googlebotBlocked, value: googlebotBlocked ? 'BLOCKED by robots.txt' : 'Allowed', tip: 'Your robots.txt is blocking Googlebot from crawling this page. Remove the Disallow: / rule.' },
      { name: 'No noindex meta tag', pass: !hasNoindex, value: hasNoindex ? 'noindex DETECTED' : 'Indexable', tip: 'Remove noindex from this page — it prevents Google from indexing it.' },
      { name: 'Canonical tag present', pass: !!canonicalHref, value: canonicalHref || 'Missing', tip: 'Add a canonical tag to prevent duplicate content issues.' },
      { name: 'Canonical points to same domain', pass: !canonicalCrossOrigin, value: canonicalHref, tip: `Your canonical points to ${canonicalCrossOrigin ? 'a different domain' : 'same domain'} — this may suppress your page.` },
      { name: 'Sitemap found', pass: sitemapFound, value: sitemapUrl || 'Not found', tip: 'Add your sitemap URL to robots.txt: "Sitemap: https://yourdomain.com/sitemap.xml"' },
      { name: 'Page title present', pass: pageTitle.length > 0, value: pageTitle.slice(0, 60) || 'Missing', tip: 'Add a page title — required for SEO.' },
      { name: 'Meta description present', pass: metaDesc.length > 0, value: metaDesc.slice(0, 80) || 'Missing', tip: 'Add a meta description to improve click-through rates from search results.' },
      { name: 'No problematic redirect chain', pass: !redirectHappened, value: redirectHappened ? `Redirected to: ${finalUrl.slice(0, 60)}` : 'Direct URL', tip: 'Avoid redirect chains — set up a direct 301 redirect to the final URL.' },
    ];

    const issueCount = checks.filter(c => !c.pass).length;
    const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);

    const result = { url, finalUrl, status, isHTTPS, hasNoindex, hasNofollow, canonicalHref, sitemapFound, sitemapUrl, googlebotBlocked, score, issueCount, checks };
    await db.addHistory({ type: 'crawl-audit', url, score });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 38 & 42: Image Audit + Duplicate Content Detector
   POST /api/technical-seo-auditor/image-audit
   ========================================================================== */
router.post('/image-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const fetchMod = (await import('node-fetch')).default;
    const cheerio = require('cheerio');

    const r = await fetchMod(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    if (!r.ok) return res.status(502).json({ ok: false, error: `HTTP ${r.status}` });
    const html = await r.text();
    const $ = cheerio.load(html);

    const images = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const alt = $(el).attr('alt');
      const width = $(el).attr('width');
      const height = $(el).attr('height');
      const loading = $(el).attr('loading');
      const isInViewport = !$(el).parents('[class*="hide"], [style*="display:none"]').length;

      images.push({
        src: src.slice(0, 100),
        hasAlt: alt !== undefined && alt !== null,
        altText: (alt || '').slice(0, 60),
        altIsEmpty: alt === '',
        altIsDescriptive: alt && alt.length > 5 && !/^\s*$/.test(alt),
        hasDimensions: !!(width && height),
        isLazyLoaded: loading === 'lazy',
        isWebP: src.includes('.webp'),
        isModern: src.includes('.webp') || src.includes('.avif'),
        isCDN: src.includes('cdn.shopify') || src.includes('cdninstagram') || src.includes('cloudfront'),
      });
    });

    const totalImages = images.length;
    const missingAlt = images.filter(i => !i.hasAlt || i.altIsEmpty);
    const poorAlt = images.filter(i => i.hasAlt && !i.altIsDescriptive);
    const missingDimensions = images.filter(i => !i.hasDimensions);
    const notLazyLoaded = images.filter(i => !i.isLazyLoaded && !i.isCDN);
    const notModernFormat = images.filter(i => !i.isModern);

    const checks = [
      { name: 'All images have alt text', pass: missingAlt.length === 0, detail: `${missingAlt.length} images missing alt`, tip: 'Add descriptive alt text to all images for SEO and accessibility.' },
      { name: 'Alt texts are descriptive (> 5 chars)', pass: poorAlt.length === 0, detail: `${poorAlt.length} images with empty/generic alt`, tip: 'Alt text like "image1.jpg" or single-word descriptions hurt SEO.' },
      { name: 'Images have explicit width/height', pass: missingDimensions.length < totalImages * 0.3, detail: `${missingDimensions.length} missing dimensions`, tip: 'Set explicit width and height attributes to prevent CLS (layout shift).' },
      { name: 'Images are lazy-loaded', pass: notLazyLoaded.length < 3, detail: `${notLazyLoaded.length} not lazy-loaded`, tip: 'Add loading="lazy" to images below the fold to improve LCP and page speed.' },
      { name: 'Modern image formats (WebP/AVIF)', pass: notModernFormat.length < totalImages * 0.5, detail: `${notModernFormat.length}/${totalImages} not in WebP/AVIF`, tip: 'Convert images to WebP or AVIF — Shopify supports WebP natively. Use .webp format in theme settings.' },
    ];

    const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
    res.json({
      ok: true, url, totalImages, score,
      missingAltCount: missingAlt.length,
      poorAltCount: poorAlt.length,
      notModernFormatCount: notModernFormat.length,
      checks,
      sampleMissingAlt: missingAlt.slice(0, 5).map(i => i.src),
      improvements: checks.filter(c => !c.pass).map(c => ({ issue: c.name, detail: c.detail, tip: c.tip })),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 44: Schema Validator
   POST /api/technical-seo-auditor/schema-validate
   Validates structured data on a page
   ========================================================================== */
router.post('/schema-validate', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const fetchMod = (await import('node-fetch')).default;
    const cheerio = require('cheerio');

    const r = await fetchMod(fullUrl, { headers: { 'User-Agent': 'Googlebot/2.1' }, timeout: 15000 });
    if (!r.ok) return res.status(502).json({ ok: false, error: `HTTP ${r.status}` });
    const html = await r.text();
    const $ = cheerio.load(html);

    const schemas = [];
    const errors = [];

    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const raw = $(el).html();
        const data = JSON.parse(raw);
        const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
        items.forEach(item => {
          const type = item['@type'] || 'Unknown';
          const issues = [];

          if (type === 'Product') {
            if (!item.name) issues.push('Missing required: name');
            if (!item.image) issues.push('Missing recommended: image');
            if (!item.offers) issues.push('Missing: offers (price, availability)');
            else {
              const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (!offer.price && !offer.priceRange) issues.push('Offer missing: price');
              if (!offer.availability) issues.push('Offer missing: availability');
              if (!offer.priceCurrency) issues.push('Offer missing: priceCurrency');
            }
            if (!item.brand) issues.push('Missing recommended: brand');
          }
          if (type === 'Article' || type === 'BlogPosting') {
            if (!item.headline) issues.push('Missing required: headline');
            if (!item.author) issues.push('Missing required: author');
            if (!item.datePublished) issues.push('Missing required: datePublished');
            if (!item.image) issues.push('Missing recommended: image');
          }
          if (type === 'FAQPage') {
            if (!item.mainEntity || !Array.isArray(item.mainEntity) || item.mainEntity.length === 0) {
              issues.push('mainEntity (Q&A pairs) is missing or empty');
            }
          }
          if (type === 'BreadcrumbList') {
            if (!item.itemListElement || !Array.isArray(item.itemListElement)) {
              issues.push('itemListElement missing');
            }
          }
          if (type === 'Organization') {
            if (!item.name) issues.push('Missing: name');
            if (!item.url) issues.push('Missing: url');
          }

          schemas.push({
            type,
            hasContext: !!(item['@context']),
            issueCount: issues.length,
            issues,
            valid: issues.length === 0,
            preview: JSON.stringify(item).slice(0, 200),
          });
        });
      } catch (e) {
        errors.push(`Script block ${i + 1}: JSON parse error — ${e.message}`);
      }
    });

    // Check for microdata
    const microdataItems = $('[itemtype]').length;

    const totalSchemaItems = schemas.length;
    const validSchemas = schemas.filter(s => s.valid).length;
    const schemaTypes = [...new Set(schemas.map(s => s.type))];

    res.json({
      ok: true,
      url,
      totalSchemaItems,
      validSchemas,
      schemaTypes,
      schemas,
      parseErrors: errors,
      microdataItemCount: microdataItems,
      score: totalSchemaItems > 0 ? Math.round((validSchemas / totalSchemaItems) * 100) : 0,
      hasProductSchema: schemaTypes.includes('Product'),
      hasArticleSchema: schemaTypes.some(t => ['Article', 'BlogPosting', 'NewsArticle'].includes(t)),
      hasFaqSchema: schemaTypes.includes('FAQPage'),
      hasBreadcrumbSchema: schemaTypes.includes('BreadcrumbList'),
      recommendations: totalSchemaItems === 0 ? ['No structured data found — add at minimum a BreadcrumbList and relevant page schema (Product, Article, FAQPage).'] : schemas.flatMap(s => s.issues.map(i => `${s.type}: ${i}`)),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 43 & 46: Sitemap Health + Hreflang Audit
   POST /api/technical-seo-auditor/sitemap-hreflang
   ========================================================================== */
router.post('/sitemap-hreflang', async (req, res) => {
  try {
    const { domain, model = 'gpt-4o-mini' } = req.body || {};
    if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });

    const base = domain.startsWith('http') ? domain : `https://${domain}`;
    const fetchMod = (await import('node-fetch')).default;

    // Fetch robots.txt
    let robotsTxt = '', sitemapUrl = `${base}/sitemap.xml`;
    try {
      const r = await fetchMod(`${base}/robots.txt`, { timeout: 8000 });
      if (r.ok) {
        robotsTxt = await r.text();
        const m = robotsTxt.match(/^Sitemap:\s*(.+)$/im);
        if (m) sitemapUrl = m[1].trim();
      }
    } catch {}

    // Fetch sitemap
    let sitemapXml = '', sitemapStatus = 0, urlCount = 0, hasImageSitemap = false, hasNewsSitemap = false;
    try {
      const r = await fetchMod(sitemapUrl, { timeout: 12000 });
      sitemapStatus = r.status;
      if (r.ok) {
        sitemapXml = await r.text();
        urlCount = (sitemapXml.match(/<loc>/g) || []).length;
        hasImageSitemap = sitemapXml.includes('image:') || sitemapXml.includes('image-sitemap');
        hasNewsSitemap = sitemapXml.includes('news:');
      }
    } catch {}

    // Check hreflang
    const hreflangTags = [];
    try {
      const r = await fetchMod(base, { timeout: 10000 });
      if (r.ok) {
        const html = await r.text();
        const matches = html.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi);
        for (const m of matches) hreflangTags.push({ lang: m[1], url: m[2] });
        // Also check opposite pattern
        const matches2 = html.matchAll(/<link[^>]+hreflang=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/gi);
        for (const m of matches2) hreflangTags.push({ lang: m[1], url: m[2] });
      }
    } catch {}

    const checks = [
      { name: 'Sitemap accessible', pass: sitemapStatus === 200, value: `${sitemapUrl} — HTTP ${sitemapStatus}`, tip: 'Ensure sitemap.xml is publicly accessible. Shopify generates /sitemap.xml automatically.' },
      { name: 'Sitemap referenced in robots.txt', pass: robotsTxt.includes('Sitemap:'), value: robotsTxt.includes('Sitemap:') ? 'Found' : 'Not in robots.txt', tip: 'Add "Sitemap: https://yourdomain.com/sitemap.xml" to robots.txt.' },
      { name: 'Sitemap contains URLs', pass: urlCount > 0, value: `${urlCount} URLs found`, tip: 'Empty sitemap — check Shopify theme settings.' },
      { name: 'Sitemap URL count reasonable', pass: urlCount > 0 && urlCount < 50000, value: `${urlCount} URLs`, tip: urlCount >= 50000 ? 'Sitemap exceeds 50,000 URLs — split into sitemap index files.' : 'URL count is healthy.' },
    ];

    const hreflangIssues = [];
    if (hreflangTags.length > 0) {
      hreflangTags.forEach(tag => {
        if (!tag.url.startsWith('http')) hreflangIssues.push(`Relative URL in hreflang: ${tag.lang} → ${tag.url}`);
      });
      const hasXDefault = hreflangTags.some(t => t.lang === 'x-default');
      if (!hasXDefault) hreflangIssues.push('Missing hreflang x-default tag — required for proper international SEO');
    }

    res.json({
      ok: true,
      domain,
      sitemapUrl,
      sitemapStatus,
      urlCount,
      hasImageSitemap,
      hasNewsSitemap,
      robotsTxtHasSitemap: robotsTxt.includes('Sitemap:'),
      hreflangTags,
      hreflangIssues,
      hasHreflang: hreflangTags.length > 0,
      checks,
      score: Math.round((checks.filter(c => c.pass).length / checks.length) * 100),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 45: Mobile Usability Checker
   POST /api/technical-seo-auditor/mobile-check
   ========================================================================== */
router.post('/mobile-check', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const fetchMod = (await import('node-fetch')).default;
    const cheerio = require('cheerio');

    const r = await fetchMod(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
      timeout: 15000,
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: `HTTP ${r.status}` });
    const html = await r.text();
    const $ = cheerio.load(html);

    // Mobile checks
    const viewportMeta = $('meta[name="viewport"]').attr('content') || '';
    const hasViewport = viewportMeta.length > 0;
    const hasWidthDevice = viewportMeta.includes('width=device-width');
    const viewportFixed = /width=\d{3,4}/.test(viewportMeta); // fixed-pixel viewport

    // Text sizes (check font-size in inline styles)
    const tinyText = $('[style*="font-size:"]').filter((_, el) => {
      const style = $(el).attr('style') || '';
      const match = style.match(/font-size:\s*(\d+)px/);
      return match && parseInt(match[1]) < 12;
    }).length;

    // Touch targets (links and buttons that are likely too small)
    const smallLinks = $('a').filter((_, el) => {
      const text = $(el).text().trim();
      return text.length <= 2 && !$(el).find('img').length;
    }).length;

    // Intrusive interstitials (common patterns)
    const hasPopupModal = $('[class*="popup"], [class*="modal"], [id*="popup"], [id*="modal"]').length > 0;
    const hasEmailCapture = $('input[type="email"]').closest('[class*="popup"], [class*="overlay"]').length > 0;

    // Flash / non-mobile content
    const hasFlash = html.includes('.swf') || html.includes('ShockwaveFlash');
    const hasHorizontalScroll = $('[style*="overflow-x: scroll"], [style*="overflow-x:scroll"]').length > 0;

    // Tap target spacing
    const adjacentLinks = $('nav a, .nav a, header a').length > 15;

    const checks = [
      { name: 'Viewport meta tag present', pass: hasViewport, value: viewportMeta || 'Missing', tip: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your theme\'s <head>.' },
      { name: 'Viewport uses device-width', pass: hasWidthDevice, value: viewportMeta, tip: 'Set viewport to "width=device-width" — fixed-width viewports cause mobile usability failures.' },
      { name: 'No fixed-pixel viewport', pass: !viewportFixed, value: viewportFixed ? 'Fixed width detected' : 'Responsive', tip: 'Remove fixed pixel widths from viewport meta — use "width=device-width" instead.' },
      { name: 'No tiny text (< 12px)', pass: tinyText === 0, value: `${tinyText} instances of tiny text`, tip: 'Use minimum 16px font size for body text. Google flags text under 12px as mobile usability failure.' },
      { name: 'No Flash content', pass: !hasFlash, value: hasFlash ? 'Flash detected' : 'None', tip: 'Remove Flash content — it does not work on mobile devices.' },
      { name: 'No intrusive interstitials', pass: !hasEmailCapture, value: hasEmailCapture ? 'Intrusive popup detected' : 'OK', tip: 'Avoid full-screen popups that block content on mobile — Google penalizes these in mobile search.' },
    ];

    const score = Math.round((checks.filter(c => c.pass).length / checks.length) * 100);
    res.json({ ok: true, url, score, hasViewport, hasWidthDevice, hasPopupModal, checks, mobileReady: score >= 80 });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;