'use strict';

const { wordCount } = require('./seoAnalyzers');

const lc = (s) => String(s || '').toLowerCase();
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function countOccurrences(text, kw) {
  if (!kw) return 0;
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(lc(kw))}(?=$|[^\\p{L}\\p{N}])`, 'gu');
  return (lc(text).match(re) || []).length;
}

function headingsOf(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html || ''))) out.push({ level: Number(m[1]), text: m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() });
  return out;
}

function imagesOf(html) {
  const out = [];
  const re = /<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html || ''))) {
    const alt = /\balt\s*=\s*("([^"]*)"|'([^']*)')/i.exec(m[0]);
    out.push({ alt: alt ? (alt[2] !== undefined ? alt[2] : alt[3]).trim() : '' });
  }
  return out;
}

const check = (id, label, status, detail, weight) => ({ id, label, status, detail, weight });

/** Deterministic on-page analysis of one store entity for one target keyword. */
function analyzeOnPage(entity, keyword) {
  const kw = String(keyword || '').trim();
  const title = entity.seoTitle || entity.title || '';
  const desc = entity.seoDescription || '';
  const text = entity.text || '';
  const words = wordCount(text);
  const heads = headingsOf(entity.html);
  const imgs = [...imagesOf(entity.html), ...(entity.images || [])];
  const checks = [];

  if (!entity.seoTitle) checks.push(check('title-present', 'SEO title', 'warn', 'No custom SEO title; Shopify falls back to the product title.', 6));
  checks.push(title.length >= 30 && title.length <= 60
    ? check('title-length', 'Title length', 'pass', `${title.length} characters`, 8)
    : check('title-length', 'Title length', 'fail', `${title.length} characters; aim for 30-60.`, 8));
  checks.push(desc.length >= 120 && desc.length <= 160
    ? check('meta-length', 'Meta description length', 'pass', `${desc.length} characters`, 8)
    : check('meta-length', 'Meta description length', 'fail', desc ? `${desc.length} characters; aim for 120-160.` : 'Missing meta description.', 8));
  checks.push(words >= 300
    ? check('word-count', 'Content length', 'pass', `${words} words`, 8)
    : check('word-count', 'Content length', words >= 100 ? 'warn' : 'fail', `${words} words; 300+ is recommended for ranking.`, 8));
  const h1s = heads.filter(h => h.level === 1);
  if (entity.type === 'article' || entity.type === 'page') {
    checks.push(h1s.length === 0 ? check('h1', 'H1 in body', 'pass', 'The theme supplies the page H1.', 4)
      : h1s.length === 1 ? check('h1', 'H1 in body', 'warn', 'Body has an H1; the theme usually already adds one.', 4)
        : check('h1', 'H1 in body', 'fail', `${h1s.length} H1s in body; use H2 and below.`, 4));
  }
  if (words >= 300) checks.push(heads.some(h => h.level === 2)
    ? check('subheadings', 'Subheadings', 'pass', `${heads.length} headings`, 5)
    : check('subheadings', 'Subheadings', 'warn', 'Long content with no H2 subheadings.', 5));
  if (imgs.length) {
    const missing = imgs.filter(i => !i.alt).length;
    checks.push(missing === 0 ? check('alt', 'Image alt text', 'pass', `${imgs.length} images all have alt text`, 6)
      : check('alt', 'Image alt text', 'fail', `${missing} of ${imgs.length} images have no alt text.`, 6));
  }

  let density = null;
  if (kw) {
    const inTitle = countOccurrences(title, kw) > 0;
    const inDesc = countOccurrences(desc, kw) > 0;
    const first = text.split(/\s+/).slice(0, 100).join(' ');
    const total = countOccurrences(text, kw);
    density = words ? Number(((total * kw.split(/\s+/).length / words) * 100).toFixed(2)) : 0;
    checks.push(check('kw-title', 'Keyword in title', inTitle ? 'pass' : 'fail', inTitle ? 'Present.' : `"${kw}" is not in the SEO title.`, 12));
    checks.push(check('kw-meta', 'Keyword in meta description', inDesc ? 'pass' : 'fail', inDesc ? 'Present.' : `"${kw}" is not in the meta description.`, 8));
    checks.push(check('kw-intro', 'Keyword in first 100 words', countOccurrences(first, kw) ? 'pass' : 'fail', countOccurrences(first, kw) ? 'Present.' : 'Mention it early in the content.', 8));
    checks.push(check('kw-heading', 'Keyword in a heading', heads.some(h => countOccurrences(h.text, kw)) || countOccurrences(entity.title, kw) ? 'pass' : 'warn', 'Headings and page title are strong relevance signals.', 5));
    checks.push(check('kw-url', 'Keyword in URL', countOccurrences(String(entity.handle || '').replace(/-/g, ' '), kw) ? 'pass' : 'warn', `/${entity.handle || ''}`, 4));
    checks.push(density > 3 ? check('kw-density', 'Keyword density', 'fail', `${density}% looks like keyword stuffing; stay under 3%.`, 6)
      : total === 0 ? check('kw-density', 'Keyword density', 'fail', 'Keyword never appears in the body.', 6)
        : check('kw-density', 'Keyword density', 'pass', `${density}% (${total} uses)`, 6));
  }

  const max = checks.reduce((n, c) => n + c.weight, 0);
  const got = checks.reduce((n, c) => n + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight / 2 : 0), 0);
  return {
    id: entity.id, type: entity.type, url: entity.url, title: entity.title, handle: entity.handle,
    seoTitle: entity.seoTitle, seoDescription: entity.seoDescription, keyword: kw, wordCount: words, density,
    score: max ? Math.round((got / max) * 100) : 0, checks,
  };
}

module.exports = { analyzeOnPage, countOccurrences, headingsOf, imagesOf };
