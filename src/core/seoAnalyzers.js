'use strict';

const SEVERITY_WEIGHT = { high: 5, medium: 2, low: 1 };

const wordCount = (t) => (String(t || '').match(/\S+/g) || []).length;
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const FIX_TOOL = { product: 'product-seo', article: 'blog-seo', page: 'on-page-seo-engine', collection: 'on-page-seo-engine' };

function issue(severity, type, detail, fix) {
  return { severity, type, detail, fix };
}

function auditEntity(e) {
  const issues = [];
  const fix = FIX_TOOL[e.type] || 'on-page-seo-engine';
  const effectiveTitle = e.seoTitle || e.title || '';
  const label = `${e.type} "${e.title}"`;

  if (!e.seoTitle) {
    issues.push(issue('medium', 'No custom SEO title', `${label} has no SEO title set, so Shopify uses the page title.`, fix));
  }
  if (effectiveTitle.length > 60) {
    issues.push(issue('medium', 'SEO title too long', `${effectiveTitle.length} characters; Google truncates after about 60.`, fix));
  } else if (effectiveTitle.length < 20) {
    issues.push(issue('medium', 'SEO title too short', `${effectiveTitle.length} characters; aim for 30-60.`, fix));
  }

  if (!e.seoDescription) {
    issues.push(issue('high', 'Missing meta description', `${label} has no meta description.`, fix));
  } else if (e.seoDescription.length < 70) {
    issues.push(issue('medium', 'Meta description too short', `${e.seoDescription.length} characters; aim for 120-160.`, fix));
  } else if (e.seoDescription.length > 160) {
    issues.push(issue('low', 'Meta description too long', `${e.seoDescription.length} characters; it will be cut off in results.`, fix));
  }

  const words = wordCount(e.text);
  const thinLimit = { product: 50, page: 100, article: 300, collection: 30 }[e.type] || 50;
  if (words < thinLimit) {
    issues.push(issue('medium', 'Thin content', `About ${words} words; aim for at least ${thinLimit}.`, fix));
  }

  if (e.type === 'product') {
    if (!e.images.length) {
      issues.push(issue('medium', 'No product images', `${label} has no images.`, 'image-alt-media-seo'));
    } else {
      const missing = e.images.filter(i => !i.alt.trim()).length;
      if (missing) {
        issues.push(issue('medium', 'Images missing alt text', `${missing} of ${e.images.length} images have no alt text.`, 'image-alt-media-seo'));
      }
    }
  }

  if (e.type === 'page' || e.type === 'article') {
    const h1s = (String(e.html).match(/<h1[\s>]/gi) || []).length;
    if (h1s > 0) {
      issues.push(issue('low', 'H1 inside body', 'The theme already renders the title as H1; extra H1 tags in the body create duplicates.', fix));
    }
  }

  return issues;
}

/** Find values shared by more than one entity. */
function findDuplicates(entities, pick, type, detailLabel) {
  const groups = new Map();
  for (const e of entities) {
    const v = norm(pick(e));
    if (!v) continue;
    if (!groups.has(v)) groups.set(v, []);
    groups.get(v).push(e);
  }
  const out = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    for (const e of list) {
      out.push({
        url: e.url,
        issue: issue('medium', type, `${detailLabel} is shared with ${list.length - 1} other page(s): ${list.filter(x => x !== e).slice(0, 3).map(x => x.url).join(', ')}`, FIX_TOOL[e.type] || 'on-page-seo-engine'),
      });
    }
  }
  return out;
}

function auditStore(entities) {
  const pages = entities.map(e => ({ url: e.url, type: e.type, title: e.seoTitle || e.title, issues: auditEntity(e) }));
  const byUrl = new Map(pages.map(p => [p.url, p]));
  const dupes = [
    ...findDuplicates(entities, e => e.seoTitle || e.title, 'Duplicate title', 'Title'),
    ...findDuplicates(entities, e => e.seoDescription, 'Duplicate meta description', 'Meta description'),
  ];
  for (const d of dupes) byUrl.get(d.url).issues.push(d.issue);

  const issues = pages.flatMap(p => p.issues.map(i => ({ ...i, page: p.url })));
  const count = (s) => issues.filter(i => i.severity === s).length;
  const penalty = issues.reduce((n, i) => n + SEVERITY_WEIGHT[i.severity], 0);
  const score = pages.length ? Math.max(0, Math.round(100 - (penalty / pages.length) * 8)) : 0;

  return {
    pagesScanned: pages.length,
    totalIssues: issues.length,
    high: count('high'),
    medium: count('medium'),
    low: count('low'),
    score,
    issues,
    pages,
  };
}

module.exports = { auditEntity, auditStore, wordCount, norm };
