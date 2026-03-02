'use strict';
/**
 * Crawl & Indexability Engine — Technical SEO Auditor
 * Checks robots.txt, XML sitemaps, canonical tags, noindex/nofollow rules,
 * redirect chains, and crawl budget signals.
 */

const path = require('path');
const fs = require('fs');

// ── In-memory store (per-shop) ────────────────────────────────────────────
const _audits = new Map();   // shop → []
const _schedule = new Map(); // shop → { url, intervalMs, lastRun }

function _key(shop) { return shop || 'default'; }
function _shopAudits(shop) {
  if (!_audits.has(_key(shop))) _audits.set(_key(shop), []);
  return _audits.get(_key(shop));
}

// ── Robots.txt parser ─────────────────────────────────────────────────────
function parseRobotsTxt(text) {
  const rules = {};
  let currentAgent = null;
  text.split('\n').forEach(raw => {
    const line = raw.split('#')[0].trim();
    if (!line) return;
    const [key, ...rest] = line.split(':');
    const val = rest.join(':').trim();
    const k = (key || '').toLowerCase();
    if (k === 'user-agent') {
      currentAgent = val.toLowerCase();
      if (!rules[currentAgent]) rules[currentAgent] = { disallow: [], allow: [], crawlDelay: null };
    } else if (k === 'disallow' && currentAgent) {
      rules[currentAgent].disallow.push(val);
    } else if (k === 'allow' && currentAgent) {
      rules[currentAgent].allow.push(val);
    } else if (k === 'crawl-delay' && currentAgent) {
      rules[currentAgent].crawlDelay = parseFloat(val) || null;
    }
  });
  return rules;
}

function isBlocked(rules, userAgent, urlPath) {
  const agent = userAgent.toLowerCase();
  const candidates = [rules[agent], rules['*']].filter(Boolean);
  for (const rule of candidates) {
    for (const a of (rule.allow || [])) {
      if (a && urlPath.startsWith(a)) return false;
    }
    for (const d of (rule.disallow || [])) {
      if (d && urlPath.startsWith(d)) return true;
    }
  }
  return false;
}

// ── Canonical analysis ────────────────────────────────────────────────────
function analyzeCanonical(html, pageUrl) {
  const issues = [];
  const reCan = /<link[^>]+rel=["']canonical["'][^>]*>/gi;
  const reHref = /href=["']([^"']+)["']/i;
  const matches = [...html.matchAll(reCan)];

  if (matches.length === 0) {
    issues.push({ severity: 'warning', msg: 'No canonical tag found — duplicate content risk.' });
    return { canonical: null, issueCount: 1, issues, selfReferencing: false };
  }
  if (matches.length > 1) {
    issues.push({ severity: 'error', msg: `Multiple canonical tags found (${matches.length}) — only one is valid.` });
  }
  const hrefMatch = reHref.exec(matches[0][0]);
  const canonical = hrefMatch ? hrefMatch[1] : null;
  const selfRef = canonical === pageUrl || (pageUrl && canonical && canonical.replace(/\/$/, '') === pageUrl.replace(/\/$/, ''));

  if (canonical && !canonical.startsWith('http')) {
    issues.push({ severity: 'error', msg: 'Canonical URL should be absolute (start with https://).' });
  }
  if (!selfRef && canonical) {
    issues.push({ severity: 'info', msg: `Canonical points to different URL: ${canonical}` });
  }

  return { canonical, issueCount: issues.length, issues, selfReferencing: selfRef };
}

// ── Robots meta analysis ──────────────────────────────────────────────────
function analyzeRobotsMeta(html) {
  const issues = [];
  const re = /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i;
  const re2 = /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i;
  const m = re.exec(html) || re2.exec(html);
  const content = m ? m[1].toLowerCase() : '';
  const directives = content.split(',').map(s => s.trim()).filter(Boolean);

  const noindex = directives.includes('noindex');
  const nofollow = directives.includes('nofollow');
  const nosnippet = directives.includes('nosnippet');
  const noimageindex = directives.includes('noimageindex');
  const maxSnippet = directives.find(d => d.startsWith('max-snippet'));
  const maxImagePreview = directives.find(d => d.startsWith('max-image-preview'));

  if (noindex) issues.push({ severity: 'critical', msg: 'noindex directive found — page will not appear in search results.' });
  if (nosnippet) issues.push({ severity: 'warning', msg: 'nosnippet set — Google will not display a text snippet in SERPs.' });
  if (maxSnippet && maxSnippet.endsWith(':-1')) issues.push({ severity: 'info', msg: 'max-snippet:-1 allows unlimited snippet length (good).' });
  if (maxImagePreview && maxImagePreview.endsWith(':none')) issues.push({ severity: 'warning', msg: 'max-image-preview:none prevents Google from showing image previews.' });

  return { hasRobotsMeta: !!m, directives, noindex, nofollow, nosnippet, noimageindex, issues };
}

// ── Redirect chain detector ───────────────────────────────────────────────
async function detectRedirectChain(startUrl, maxHops = 5) {
  let url = startUrl;
  const chain = [];
  for (let i = 0; i < maxHops; i++) {
    try {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(url, { redirect: 'manual', timeout: 8000, headers: { 'User-Agent': 'Googlebot/2.1' } });
      chain.push({ url, status: r.status });
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) break;
        url = loc.startsWith('http') ? loc : new URL(loc, url).href;
      } else {
        break;
      }
    } catch (e) {
      chain.push({ url, error: e.message });
      break;
    }
  }
  const hasChain = chain.length > 2 || (chain.length === 2 && chain[0].status >= 300);
  return { chain, hasChain, hopCount: chain.length - 1, finalUrl: chain[chain.length - 1]?.url || startUrl };
}

// ── Sitemap analysis ──────────────────────────────────────────────────────
function analyzeSitemap(xml) {
  if (!xml) return { urlCount: 0, hasSitemapIndex: false, sitemaps: [], issues: [{ severity: 'warning', msg: 'No sitemap content available.' }] };
  const issues = [];
  const urlCount = (xml.match(/<loc>/g) || []).length;
  const hasSitemapIndex = xml.includes('<sitemapindex') || xml.includes('<sitemap>');
  const sitemaps = [];
  const re = /<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/sitemap>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) sitemaps.push(m[1]);

  if (urlCount === 0 && !hasSitemapIndex) issues.push({ severity: 'warning', msg: 'Sitemap contains no <loc> entries.' });
  if (urlCount > 50000) issues.push({ severity: 'error', msg: `Sitemap exceeds 50,000 URLs (${urlCount}) — split into sitemap index.` });
  if (!xml.includes('<?xml')) issues.push({ severity: 'warning', msg: 'Sitemap missing XML declaration header.' });

  const hasLastmod = xml.includes('<lastmod>');
  const hasChangefreq = xml.includes('<changefreq>');
  const hasPriority = xml.includes('<priority>');

  return { urlCount, hasSitemapIndex, sitemaps, hasLastmod, hasChangefreq, hasPriority, issues };
}

// ── Audit result store ────────────────────────────────────────────────────
function saveAudit(shop, audit) {
  const list = _shopAudits(shop);
  list.unshift({ id: Date.now(), createdAt: new Date().toISOString(), ...audit });
  if (list.length > 200) list.splice(200);
  return list[0];
}

function listAudits(shop, limit = 50) {
  return _shopAudits(shop).slice(0, limit);
}

function getAudit(shop, id) {
  return _shopAudits(shop).find(a => a.id === Number(id)) || null;
}

function deleteAudit(shop, id) {
  const list = _shopAudits(shop);
  const idx = list.findIndex(a => a.id === Number(id));
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}

// ── Crawl schedule ────────────────────────────────────────────────────────
function setSchedule(shop, config) {
  _schedule.set(_key(shop), { ...config, lastRun: null });
}

function getSchedule(shop) {
  return _schedule.get(_key(shop)) || null;
}

// ── Full crawlability report ──────────────────────────────────────────────
function buildCrawlReport({ url, html, robotsTxt, sitemapXml, status, redirectChain, shop }) {
  const robotsRules = parseRobotsTxt(robotsTxt || '');
  let urlPath = '/';
  try { urlPath = new URL(url).pathname; } catch {}

  const googlebotBlocked = isBlocked(robotsRules, 'googlebot', urlPath);
  const wildcardBlocked = isBlocked(robotsRules, '*', urlPath);
  const crawlDelay = (robotsRules['googlebot'] || robotsRules['*'])?.crawlDelay || null;

  const canonicalAnalysis = analyzeCanonical(html || '', url);
  const robotsMetaAnalysis = analyzeRobotsMeta(html || '');
  const sitemapAnalysis = analyzeSitemap(sitemapXml);

  const checks = [
    { id: 'https', name: 'HTTPS', pass: url.startsWith('https://'), category: 'security', tip: 'Serve all pages over HTTPS.' },
    { id: 'status-ok', name: 'HTTP 200 response', pass: status >= 200 && status < 300, category: 'crawlability', tip: `Fix HTTP ${status} errors.` },
    { id: 'not-blocked', name: 'Not blocked in robots.txt', pass: !googlebotBlocked && !wildcardBlocked, category: 'crawlability', tip: 'Remove Disallow: / rule from robots.txt.' },
    { id: 'no-noindex', name: 'No noindex meta tag', pass: !robotsMetaAnalysis.noindex, category: 'indexability', tip: 'Remove noindex to allow Google to index this page.' },
    { id: 'canonical', name: 'Canonical tag present', pass: !!canonicalAnalysis.canonical, category: 'duplication', tip: 'Add a canonical tag to signal the preferred URL.' },
    { id: 'sitemap', name: 'Sitemap accessible', pass: sitemapAnalysis.urlCount > 0 || sitemapAnalysis.hasSitemapIndex, category: 'discoverability', tip: 'Ensure sitemap.xml is accessible and contains URLs.' },
    { id: 'no-redirect-chain', name: 'No redirect chain', pass: !(redirectChain?.hasChain), category: 'crawl-budget', tip: 'Fix redirect chains — use direct 301 redirects.' },
  ];

  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';

  const allIssues = [
    ...canonicalAnalysis.issues,
    ...robotsMetaAnalysis.issues,
    ...sitemapAnalysis.issues,
  ].filter(i => i.severity !== 'info');

  return {
    url, score, grade, checks,
    googlebotBlocked, wildcardBlocked, crawlDelay,
    canonical: canonicalAnalysis,
    robotsMeta: robotsMetaAnalysis,
    sitemap: sitemapAnalysis,
    redirectChain,
    issues: allIssues,
    issueCount: allIssues.length,
    passedCount: passed,
    crawlBudgetNotes: crawlDelay ? `Crawl delay of ${crawlDelay}s detected — may slow Googlebot crawling.` : null,
  };
}

// ── Bulk crawl ────────────────────────────────────────────────────────────
function bulkSummary(audits) {
  if (!audits.length) return { avgScore: 0, topIssues: [], urlCount: 0 };
  const avgScore = Math.round(audits.reduce((s, a) => s + (a.score || 0), 0) / audits.length);
  const issueFreq = {};
  audits.forEach(a => {
    (a.checks || []).filter(c => !c.pass).forEach(c => {
      issueFreq[c.id] = (issueFreq[c.id] || 0) + 1;
    });
  });
  const topIssues = Object.entries(issueFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count, pct: Math.round((count / audits.length) * 100) }));
  return { avgScore, topIssues, urlCount: audits.length };
}

module.exports = {
  parseRobotsTxt, isBlocked, analyzeCanonical, analyzeRobotsMeta,
  detectRedirectChain, analyzeSitemap, buildCrawlReport,
  saveAudit, listAudits, getAudit, deleteAudit,
  setSchedule, getSchedule, bulkSummary,
};
