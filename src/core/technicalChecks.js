'use strict';

const attr = (tag, name) => {
  const m = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
};

const metaTags = (html) => html.match(/<meta\b[^>]*>/gi) || [];
const linkTags = (html) => html.match(/<link\b[^>]*>/gi) || [];

function metaContent(html, key, by = 'name') {
  for (const t of metaTags(html)) {
    if ((attr(t, by) || '').toLowerCase() === key) return attr(t, 'content');
  }
  return null;
}

const text = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      blocks.push({ valid: true, data: JSON.parse(m[1].trim()) });
    } catch {
      blocks.push({ valid: false, data: null });
    }
  }
  return blocks;
}

function jsonLdTypes(blocks) {
  const types = new Set();
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n['@type']) [].concat(n['@type']).forEach(t => types.add(String(t)));
    if (n['@graph']) walk(n['@graph']);
  };
  blocks.filter(b => b.valid).forEach(b => walk(b.data));
  return [...types];
}

const f = (id, severity, title, detail) => ({ id, severity, title, detail });

/**
 * Deterministic technical checks for one rendered page.
 * `kind` is 'home' | 'product' | 'collection' | 'article' | 'page'.
 */
function checkPage({ url, status, headers = {}, html, redirects = [], ms, kind = 'page' }) {
  const findings = [];
  const passed = [];
  const add = (cond, okId, ...bad) => (cond ? passed.push(okId) : findings.push(f(...bad)));

  add(url.startsWith('https://'), 'https', 'https', 'high', 'Page is not served over HTTPS', url);
  add(status === 200, 'status-200', 'status', 'high', `Page returned HTTP ${status}`, 'Indexable pages should return 200.');
  if (redirects.length > 1) findings.push(f('redirect-chain', 'medium', 'Redirect chain', `${redirects.length} redirects before the final URL.`));

  const title = text((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1]);
  if (!title) findings.push(f('title-missing', 'high', 'Missing <title>', 'The page has no title tag.'));
  else if (title.length > 60) findings.push(f('title-long', 'medium', 'Title too long', `${title.length} characters (about 60 shown in results).`));
  else passed.push('title');

  const desc = metaContent(html, 'description');
  if (!desc) findings.push(f('desc-missing', 'high', 'Missing meta description', 'No meta description found.'));
  else if (desc.length > 160 || desc.length < 70) findings.push(f('desc-length', 'low', 'Meta description length', `${desc.length} characters; aim for 120-160.`));
  else passed.push('description');

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  add(h1s === 1, 'h1', 'h1', h1s === 0 ? 'high' : 'medium', h1s === 0 ? 'Missing H1' : 'Multiple H1 tags', `${h1s} H1 tag(s) found; use exactly one.`);

  const canonicalTag = linkTags(html).find(t => (attr(t, 'rel') || '').toLowerCase() === 'canonical');
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : null;
  if (!canonical) findings.push(f('canonical-missing', 'medium', 'Missing canonical URL', 'No rel=canonical link found.'));
  else passed.push('canonical');

  add(!!metaContent(html, 'viewport'), 'viewport', 'viewport', 'high', 'Missing viewport meta', 'Page is not mobile-friendly without a viewport tag.');
  add(/<html[^>]*\blang\s*=/i.test(html), 'lang', 'lang', 'low', 'Missing html lang attribute', 'Set lang on the <html> element.');

  const robots = (metaContent(html, 'robots') || '').toLowerCase();
  const xRobots = String(headers['x-robots-tag'] || '').toLowerCase();
  if (robots.includes('noindex') || xRobots.includes('noindex')) {
    findings.push(f('noindex', 'high', 'Page is set to noindex', 'Search engines are told not to index this page.'));
  } else passed.push('indexable');

  const ogTitle = metaContent(html, 'og:title', 'property');
  const ogImage = metaContent(html, 'og:image', 'property');
  add(!!(ogTitle && ogImage), 'open-graph', 'og', 'low', 'Incomplete Open Graph tags', 'og:title and og:image improve social sharing.');

  const jsonLd = extractJsonLd(html);
  const types = jsonLdTypes(jsonLd);
  if (jsonLd.some(b => !b.valid)) findings.push(f('jsonld-invalid', 'high', 'Invalid JSON-LD', 'A structured data block could not be parsed.'));
  const wantsType = { product: 'Product', article: 'Article', home: 'Organization' }[kind];
  if (wantsType && !types.some(t => t === wantsType || (wantsType === 'Article' && /Article|BlogPosting/.test(t)))) {
    findings.push(f('jsonld-missing', 'medium', `No ${wantsType} structured data`, `Expected ${wantsType} JSON-LD on a ${kind} page.`));
  } else if (jsonLd.length) passed.push('structured-data');

  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter(i => attr(i, 'alt') === null || attr(i, 'alt').trim() === '').length;
  if (imgs.length && noAlt) findings.push(f('img-alt', 'medium', 'Images missing alt text', `${noAlt} of ${imgs.length} images have no alt text.`));
  else if (imgs.length) passed.push('image-alt');

  const sizeKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  if (sizeKb > 500) findings.push(f('html-size', 'medium', 'Large HTML document', `${sizeKb} KB of HTML.`));
  if (typeof ms === 'number' && ms > 3000) findings.push(f('slow-response', 'medium', 'Slow server response', `${ms} ms to fetch.`));

  const hreflangs = linkTags(html).filter(t => (attr(t, 'rel') || '').toLowerCase() === 'alternate' && attr(t, 'hreflang')).length;

  return {
    url, kind, status, title, metaDescription: desc, h1Count: h1s, canonical, structuredDataTypes: types,
    imageCount: imgs.length, htmlSizeKb: sizeKb, responseMs: ms, hreflangCount: hreflangs, findings, passed,
  };
}

function checkRobotsTxt(res) {
  if (!res || res.status !== 200) {
    return { exists: false, findings: [f('robots-missing', 'medium', 'robots.txt not found', `Request returned ${res ? res.status : 'no response'}.`)] };
  }
  const lines = res.text.split(/\r?\n/).map(l => l.trim());
  const sitemaps = lines.filter(l => /^sitemap:/i.test(l)).map(l => l.replace(/^sitemap:\s*/i, ''));
  let blocksAll = false;
  let agent = null;
  for (const l of lines) {
    const ua = /^user-agent:\s*(.+)$/i.exec(l);
    if (ua) agent = ua[1].trim();
    if (agent === '*' && /^disallow:\s*\/\s*$/i.test(l)) blocksAll = true;
  }
  const findings = [];
  if (blocksAll) findings.push(f('robots-blocks-all', 'high', 'robots.txt blocks all crawlers', 'Disallow: / under User-agent: * prevents indexing.'));
  if (!sitemaps.length) findings.push(f('robots-no-sitemap', 'low', 'robots.txt has no Sitemap line', 'Add a Sitemap: directive.'));
  return { exists: true, sitemaps, blocksAll, findings };
}

function checkSitemap(res) {
  if (!res || res.status !== 200) {
    return { exists: false, urlCount: 0, findings: [f('sitemap-missing', 'high', 'sitemap.xml not found', `Request returned ${res ? res.status : 'no response'}.`)] };
  }
  const locs = (res.text.match(/<loc>/gi) || []).length;
  const isIndex = /<sitemapindex/i.test(res.text);
  const findings = [];
  if (!locs) findings.push(f('sitemap-empty', 'high', 'sitemap.xml has no URLs', 'The file loaded but lists no <loc> entries.'));
  return { exists: true, isIndex, urlCount: locs, findings };
}

function scoreAudit(pages, site) {
  const w = { high: 6, medium: 3, low: 1 };
  const all = [...pages.flatMap(p => p.findings), ...site.flatMap(s => s.findings)];
  const penalty = all.reduce((n, x) => n + w[x.severity], 0);
  const per = Math.max(1, pages.length + 1);
  return Math.max(0, Math.round(100 - (penalty / per) * 4));
}

module.exports = { checkPage, checkRobotsTxt, checkSitemap, scoreAudit, extractJsonLd, jsonLdTypes, metaContent, attr };
