'use strict';

const { gql, loadStoreEntities } = require('../../core/seoStoreData');
const { safeFetchText } = require('../../core/safeFetch');
const { checkPage, checkRobotsTxt, checkSitemap, scoreAudit } = require('../../core/technicalChecks');

async function resolveBaseUrl(shop, token) {
  try {
    const data = await gql(shop, token, '{ shop { primaryDomain { url } } }');
    const url = data && data.shop && data.shop.primaryDomain && data.shop.primaryDomain.url;
    if (url) return url.replace(/\/$/, '');
  } catch { /* fall back to the myshopify domain */ }
  return `https://${shop}`;
}

async function sampleTargets(shop, token, base) {
  const targets = [{ kind: 'home', url: base + '/' }];
  const { entities } = await loadStoreEntities(shop, token, { max: 1 }).catch(() => ({ entities: [] }));
  for (const e of entities) {
    const path = e.url.replace(/^https:\/\/[^/]+/, '');
    targets.push({ kind: e.type, url: base + path });
  }
  return targets;
}

async function fetchPage(t) {
  try {
    const res = await safeFetchText(t.url);
    const passwordPage = /\/password(\?|$)/.test(res.finalUrl) || /Enter store password/i.test(res.text);
    if (passwordPage) return { url: t.url, kind: t.kind, passwordProtected: true, findings: [], passed: [] };
    return checkPage({ url: res.finalUrl, kind: t.kind, status: res.status, headers: res.headers, html: res.text, redirects: res.redirects, ms: res.ms });
  } catch (e) {
    return {
      url: t.url, kind: t.kind, findings: [{ id: 'unreachable', severity: 'high', title: 'Page could not be fetched', detail: e.message }], passed: [],
    };
  }
}

async function runTechnicalAudit(shop, token) {
  const base = await resolveBaseUrl(shop, token);
  const targets = await sampleTargets(shop, token, base);
  const [pages, robotsRes, sitemapRes] = await Promise.all([
    Promise.all(targets.map(fetchPage)),
    safeFetchText(base + '/robots.txt').catch(() => null),
    safeFetchText(base + '/sitemap.xml').catch(() => null),
  ]);
  const robots = checkRobotsTxt(robotsRes);
  const sitemap = checkSitemap(sitemapRes);
  const warnings = [];
  if (pages.some(p => p.passwordProtected)) {
    warnings.push('The storefront is password-protected, so its pages cannot be audited as search engines see them. Remove the password to get a full result.');
  }
  const audited = pages.filter(p => !p.passwordProtected);
  const siteChecks = [robots, sitemap];
  return {
    base,
    score: audited.length ? scoreAudit(audited, siteChecks) : null,
    pages: audited,
    robots,
    sitemap,
    warnings,
    totalFindings: audited.reduce((n, p) => n + p.findings.length, 0) + robots.findings.length + sitemap.findings.length,
  };
}

module.exports = { runTechnicalAudit };
