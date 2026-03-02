'use strict';
/**
 * Performance & Core Web Vitals Engine — Technical SEO Auditor
 * Analyzes page speed, LCP, INP, CLS, TTFB, FCP and Shopify-specific
 * performance patterns. Integrates with PageSpeed Insights API when available.
 */

// ── CWV thresholds ────────────────────────────────────────────────────────
const THRESHOLDS = {
  lcp:  { good: 2.5, poor: 4.0, unit: 's', label: 'Largest Contentful Paint' },
  inp:  { good: 200, poor: 500, unit: 'ms', label: 'Interaction to Next Paint' },
  cls:  { good: 0.1, poor: 0.25, unit: '', label: 'Cumulative Layout Shift' },
  fcp:  { good: 1.8, poor: 3.0, unit: 's', label: 'First Contentful Paint' },
  ttfb: { good: 0.8, poor: 1.8, unit: 's', label: 'Time to First Byte' },
  tbt:  { good: 200, poor: 600, unit: 'ms', label: 'Total Blocking Time' },
};

function rateMetric(key, value) {
  if (value === null || value === undefined) return 'unknown';
  const t = THRESHOLDS[key];
  if (!t) return 'unknown';
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs-improvement';
  return 'poor';
}

// ── HTML-based performance signals ───────────────────────────────────────
function analyzeHtmlPerformance(html, url) {
  const issues = [];
  const opportunities = [];

  if (!html) return { issues, opportunities, score: 50, signals: {} };

  // Render-blocking resources
  const blockingScripts = (html.match(/<script\s+src=["'][^"']+["']\s*>/gi) || [])
    .filter(s => !/async|defer/i.test(s)).length;
  const blockingStyles = (html.match(/<link[^>]+rel=["']stylesheet["'][^>]+>/gi) || [])
    .filter(s => !/media=["']print["']/i.test(s)).length;

  if (blockingScripts > 3) {
    issues.push({ type: 'render-blocking', severity: 'high', msg: `${blockingScripts} render-blocking <script> tags — add async or defer attribute.` });
    opportunities.push({ action: 'Add async/defer to script tags', impact: 'high', effort: 'low' });
  }

  // Unoptimized images
  const imgs = html.match(/<img[^>]+>/gi) || [];
  const noLazyLoad = imgs.filter(i => !/loading=["']lazy["']/i.test(i)).length;
  const noModernFormat = imgs.filter(i => !/\.webp|\.avif/i.test(i)).length;
  const noDimensions = imgs.filter(i => !/width=|height=/i.test(i)).length;

  if (noLazyLoad > 3) {
    opportunities.push({ action: `Add loading="lazy" to ${noLazyLoad} images below the fold`, impact: 'medium', effort: 'low' });
  }
  if (noModernFormat > 5) {
    issues.push({ type: 'image-format', severity: 'medium', msg: `${noModernFormat} images not using WebP/AVIF — convert for 25-35% size reduction.` });
    opportunities.push({ action: 'Convert images to WebP/AVIF format', impact: 'high', effort: 'medium' });
  }
  if (noDimensions > 3) {
    issues.push({ type: 'layout-shift', severity: 'medium', msg: `${noDimensions} images without explicit width/height — causes CLS.` });
    opportunities.push({ action: 'Set explicit width and height on all images', impact: 'high', effort: 'low' });
  }

  // Inline styles (possible CLS risk from injected content)
  const inlineStyles = (html.match(/style=/gi) || []).length;

  // Page weight estimate
  const htmlSizeKB = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  if (htmlSizeKB > 100) {
    issues.push({ type: 'page-weight', severity: 'medium', msg: `HTML size is ${htmlSizeKB}KB — over 100KB may harm TTFB and LCP.` });
    opportunities.push({ action: 'Minify HTML and remove unused code', impact: 'medium', effort: 'medium' });
  }

  // Critical CSS
  const hasCriticalCss = /<style[^>]*>[^<]{100,}<\/style>/i.test(html);

  // Preload LCP resource
  const hasPreload = /<link[^>]+rel=["']preload["']/i.test(html);
  if (!hasPreload) {
    opportunities.push({ action: 'Add <link rel="preload"> for LCP image or font', impact: 'high', effort: 'low' });
  }

  // Third-party scripts (common Shopify apps)
  const thirdPartyDomains = new Set();
  const srcMatches = html.matchAll(/src=["']([^"']+)["']/gi);
  for (const m of srcMatches) {
    try {
      const host = new URL(m[1]).hostname;
      if (!host.includes(url ? new URL(url).hostname : '')) {
        thirdPartyDomains.add(host);
      }
    } catch {}
  }

  const shopifySignals = {
    hasAppBridge: html.includes('app-bridge') || html.includes('@shopify/app-bridge'),
    hasThemeKit: html.includes('shopify.com/s/files'),
    hasCriticalCss,
    htmlSizeKB,
    blockingScripts,
    blockingStyles,
    imageCount: imgs.length,
    noLazyLoad,
    noModernFormat,
    noDimensions,
    inlineStyleCount: inlineStyles,
    thirdPartyCount: thirdPartyDomains.size,
    thirdPartyDomains: [...thirdPartyDomains].slice(0, 10),
    hasPreload,
  };

  // Score based on checks
  let score = 100;
  if (blockingScripts > 3) score -= 15;
  if (noModernFormat > 5) score -= 12;
  if (noDimensions > 3) score -= 12;
  if (htmlSizeKB > 100) score -= 10;
  if (!hasPreload) score -= 8;
  if (noLazyLoad > 3) score -= 8;
  score = Math.max(0, Math.min(100, score));

  return { issues, opportunities, score, signals: shopifySignals };
}

// ── PageSpeed Insights integration ───────────────────────────────────────
async function fetchPSI(url, strategy = 'mobile') {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;
  try {
    const fetchMod = (await import('node-fetch')).default;
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=performance&category=seo&category=best-practices&category=accessibility`;
    const resp = await fetchMod(psiUrl, { timeout: 45000 });
    if (!resp.ok) return null;
    const psi = await resp.json();
    const lhr = psi.lighthouseResult || {};
    const audits = lhr.audits || {};
    const cats = lhr.categories || {};
    const metrics = psi.loadingExperience?.metrics || {};

    return {
      performanceScore: Math.round((cats.performance?.score || 0) * 100),
      seoScore: Math.round((cats.seo?.score || 0) * 100),
      bestPracticesScore: Math.round((cats['best-practices']?.score || 0) * 100),
      accessibilityScore: Math.round((cats.accessibility?.score || 0) * 100),
      cwv: {
        lcp: { value: metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile / 1000 || null, status: metrics.LARGEST_CONTENTFUL_PAINT_MS?.category || 'unknown' },
        inp: { value: metrics.INTERACTION_TO_NEXT_PAINT?.percentile || null, status: metrics.INTERACTION_TO_NEXT_PAINT?.category || 'unknown' },
        cls: { value: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100 || null, status: metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category || 'unknown' },
        fcp: { value: metrics.FIRST_CONTENTFUL_PAINT_MS?.percentile / 1000 || null, status: metrics.FIRST_CONTENTFUL_PAINT_MS?.category || 'unknown' },
        ttfb: { value: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile / 1000 || null, status: metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.category || 'unknown' },
      },
      opportunities: Object.values(audits)
        .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 0.9)
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, 10)
        .map(a => ({ id: a.id, title: a.title, score: Math.round((a.score || 0) * 100), description: a.description?.replace(/\[.*?\]\(.*?\)/g, '').slice(0, 200) })),
      diagnostics: Object.values(audits)
        .filter(a => a.details?.type === 'table' && a.score !== null && a.score < 0.9)
        .slice(0, 6)
        .map(a => ({ id: a.id, title: a.title, description: a.description?.slice(0, 150) })),
      strategy,
      dataSource: 'pagespeed-insights',
    };
  } catch {
    return null;
  }
}

// ── Estimated CWV from HTML (when PSI not available) ─────────────────────
function estimateCWV(htmlSignals) {
  // Heuristic estimates based on HTML analysis
  const lcp = htmlSignals.noModernFormat > 3 ? 3.2 : htmlSignals.blockingScripts > 3 ? 2.8 : 2.1;
  const inp = htmlSignals.thirdPartyCount > 5 ? 350 : htmlSignals.blockingScripts > 3 ? 250 : 180;
  const cls = htmlSignals.noDimensions > 5 ? 0.18 : htmlSignals.noDimensions > 2 ? 0.12 : 0.05;
  const fcp = htmlSignals.blockingStyles > 3 ? 2.2 : 1.5;
  const ttfb = htmlSignals.htmlSizeKB > 150 ? 1.2 : 0.6;

  return {
    lcp: { value: lcp, status: rateMetric('lcp', lcp), estimated: true },
    inp: { value: inp, status: rateMetric('inp', inp), estimated: true },
    cls: { value: cls, status: rateMetric('cls', cls), estimated: true },
    fcp: { value: fcp, status: rateMetric('fcp', fcp), estimated: true },
    ttfb: { value: ttfb, status: rateMetric('ttfb', ttfb), estimated: true },
  };
}

// ── Speed recommendations for Shopify ────────────────────────────────────
function getShopifySpeedTips() {
  return [
    { category: 'Images', tip: 'Use Shopify\'s native WebP conversion — append ?width=X&format=webp to CDN image URLs.' },
    { category: 'Apps', tip: 'Audit third-party app scripts — each adds 50-200ms. Remove unused apps from Shopify admin.' },
    { category: 'Theme', tip: 'Enable lazy loading in theme settings. Use Dawn or Sense as the fastest Shopify base themes.' },
    { category: 'Fonts', tip: 'Use font-display: swap and preload critical fonts with <link rel="preload" as="font">.' },
    { category: 'LCP', tip: 'Preload the hero image using fetchpriority="high" and <link rel="preload" as="image">.' },
    { category: 'JavaScript', tip: 'Defer non-critical scripts. Move analytics and chat widgets to worker threads where possible.' },
    { category: 'CDN', tip: 'Shopify CDN serves assets from 200+ edge nodes — ensure CDN cache hits are maximized (no ?v= cache busting).' },
    { category: 'TTFB', tip: 'Shopify server response times are typically 200-400ms. Optimize Liquid template logic and collection filtering.' },
  ];
}

// ── History store ─────────────────────────────────────────────────────────
const _history = new Map();
function savePerformanceRecord(shop, record) {
  const key = shop || 'default';
  if (!_history.has(key)) _history.set(key, []);
  const list = _history.get(key);
  list.unshift({ id: Date.now(), createdAt: new Date().toISOString(), ...record });
  if (list.length > 100) list.splice(100);
  return list[0];
}
function listPerformanceHistory(shop, limit = 30) {
  return (_history.get(shop || 'default') || []).slice(0, limit);
}
function getPerformanceTrend(shop) {
  const hist = listPerformanceHistory(shop, 10);
  if (hist.length < 2) return { trend: 'insufficient-data', delta: null };
  const latest = hist[0].performanceScore || 0;
  const oldest = hist[hist.length - 1].performanceScore || 0;
  return {
    trend: latest > oldest ? 'improving' : latest < oldest ? 'declining' : 'stable',
    delta: latest - oldest,
    latest,
    oldest,
    dataPoints: hist.map(h => ({ date: h.createdAt, score: h.performanceScore })),
  };
}

module.exports = {
  THRESHOLDS, rateMetric,
  analyzeHtmlPerformance, fetchPSI, estimateCWV, getShopifySpeedTips,
  savePerformanceRecord, listPerformanceHistory, getPerformanceTrend,
};
