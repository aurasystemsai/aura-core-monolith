const express = require('express');
const OpenAI = require('openai');
const cheerio = require('cheerio');
const researchEngine = require('./research-intent-engine');
const keywordEngine = require('./keyword-cluster-engine');
const briefEngine = require('./content-brief-engine');
const outlineEngine = require('./outline-optimization-engine');
const onpageEngine = require('./onpage-technical-engine');
const linkingEngine = require('./internal-linking-engine');
const performanceEngine = require('./performance-analytics-engine');

const router = express.Router();

/* ── Flesch-Kincaid readability helpers ──────────────────────────────────── */
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word.length) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function computeFlesch(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (!words.length || !sentences.length) return { ease: 50, grade: 9, easeLabel: 'Standard', gradeLabel: 'High School', syllables: 0 };
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const awps = words.length / sentences.length;   // avg words per sentence
  const aspw = totalSyllables / words.length;     // avg syllables per word
  const ease = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * awps - 84.6 * aspw)));
  const grade = Math.max(1, Math.min(22, Math.round((0.39 * awps + 11.8 * aspw - 15.59) * 10) / 10));
  const easeLabel = ease >= 90 ? 'Very Easy' : ease >= 80 ? 'Easy' : ease >= 70 ? 'Fairly Easy'
    : ease >= 60 ? 'Standard' : ease >= 50 ? 'Fairly Difficult' : ease >= 30 ? 'Difficult' : 'Very Difficult';
  const gradeLabel = grade <= 6 ? 'Elementary' : grade <= 9 ? 'Middle School'
    : grade <= 12 ? 'High School' : grade <= 16 ? 'College' : 'Post-Graduate';
  return { ease, grade, easeLabel, gradeLabel, syllables: totalSyllables, totalWords: words.length, totalSentences: sentences.length };
}

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/* ── In-memory history store ─────────────────────────────────────────────── */
const historyStore = new Map();
let historySeq = 0;

/* =========================================================================
   HEALTH
   ========================================================================= */
router.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'Blog SEO Engine online', version: '2.0.0' });
});

/* =========================================================================
   ANALYZE — crawl a blog URL and score blog-specific SEO signals
   ========================================================================= */
router.post('/analyze', async (req, res) => {
  try {
    const { url, keywords } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url is required' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AuraBlogSEOBot/2.0 (+https://aurasystems.ai)', Accept: 'text/html' },
        redirect: 'follow',
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(502).json({ ok: false, error: `Failed to fetch: ${fetchErr.message}` });
    }
    clearTimeout(timeout);

    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, noscript, svg, iframe').remove();

    /* ── META ── */
    const title = $('title').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
    const h1 = $('h1').first().text().trim();
    const h1Count = $('h1').length;
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const langTag = $('html').attr('lang') || '';
    const viewportMeta = $('meta[name="viewport"]').attr('content') || '';
    const authorMeta = $('meta[name="author"]').attr('content') || '';
    const datePublished = $('meta[property="article:published_time"]').attr('content')
      || $('time[datetime]').first().attr('datetime') || '';
    const dateModified = $('meta[property="article:modified_time"]').attr('content') || '';

    /* ── OG ── */
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogType = $('meta[property="og:type"]').attr('content') || '';

    /* ── CONTENT ── */
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 10);
    const avgParagraphLength = paragraphs.length
      ? Math.round(paragraphs.reduce((s, p) => s + p.split(/\s+/).length, 0) / paragraphs.length)
      : 0;
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 120).length;
    const readingTimeMinutes = Math.ceil(wordCount / 238);

    /* ── HEADINGS ── */
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      headings.push({ tag: el.tagName.toLowerCase(), text: $(el).text().trim().slice(0, 120) });
    });
    const h2Count = headings.filter(h => h.tag === 'h2').length;
    const h3Count = headings.filter(h => h.tag === 'h3').length;
    const subheadingDistribution = {
      h2: h2Count, h3: h3Count, h4: headings.filter(h => h.tag === 'h4').length,
    };

    /* ── LINKS ── */
    const allLinks = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().slice(0, 80);
      const rel = $(el).attr('rel') || '';
      try {
        const parsed = new URL(href, url);
        const baseHost = new URL(url).hostname;
        const isInternal = parsed.hostname === baseHost;
        allLinks.push({ href: parsed.href, text, rel, isInternal });
      } catch { /* ignore bad URLs */ }
    });
    const internalLinks = allLinks.filter(l => l.isInternal).length;
    const externalLinks = allLinks.filter(l => !l.isInternal).length;
    const internalLinkDetails = allLinks.filter(l => l.isInternal).slice(0, 50);
    const externalLinkDetails = allLinks.filter(l => !l.isInternal).slice(0, 50);

    /* ── IMAGES ── */
    const images = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt');
      const hasWidth = !!$(el).attr('width');
      const hasHeight = !!$(el).attr('height');
      images.push({ src: src.slice(0, 200), alt: alt ?? null, hasAlt: alt != null && alt.length > 0, hasWidth, hasHeight });
    });
    const imageCount = images.length;
    const imagesWithAlt = images.filter(i => i.hasAlt).length;
    const imagesMissingDimensions = images.filter(i => !i.hasWidth || !i.hasHeight).length;

    /* ── SCHEMA ── */
    const schemaTypes = [];
    const schemaRawData = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        items.forEach(item => {
          if (item['@type']) { schemaTypes.push(item['@type']); schemaRawData.push(item); }
          if (item['@graph']) item['@graph'].forEach(g => {
            if (g['@type']) { schemaTypes.push(g['@type']); schemaRawData.push(g); }
          });
        });
      } catch { /* ignore invalid JSON-LD */ }
    });
    const schemaMarkup = schemaTypes.length > 0;

    /* ── KEYWORD ANALYSIS ── */
    const kwList = (keywords || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const kwDensity = {};
    const lowerBody = bodyText.toLowerCase();
    kwList.forEach(kw => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerBody.match(regex);
      kwDensity[kw] = {
        count: matches ? matches.length : 0,
        density: matches ? Math.round(matches.length / wordCount * 10000) / 100 : 0,
      };
    });
    const keywordInTitle = kwList.some(kw => title.toLowerCase().includes(kw));
    const keywordInH1 = kwList.some(kw => h1.toLowerCase().includes(kw));
    const keywordInMeta = kwList.some(kw => metaDescription.toLowerCase().includes(kw));
    const keywordInUrl = kwList.some(kw => url.toLowerCase().includes(kw));
    const keywordInFirstParagraph = kwList.some(kw => (paragraphs[0] || '').toLowerCase().includes(kw));

    /* ── READABILITY ── */
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const avgSentenceLength = sentences.length
      ? Math.round(sentences.reduce((s, sent) => s + sent.trim().split(/\s+/).length, 0) / sentences.length)
      : 0;
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 25).length;
    const readabilityScore = Math.max(0, Math.min(100,
      100 - longSentences * 3 - Math.max(0, avgSentenceLength - 15) * 2 - Math.max(0, avgParagraphLength - 80)));

    /* ── TECHNICAL ── */
    const pageSizeKB = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
    const isHttps = url.startsWith('https');
    const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"]').length > 0;
    const hasCharset = $('meta[charset]').length > 0 || html.toLowerCase().includes('charset=');

    /* ── URL ANALYSIS ── */
    let urlAnalysis = {};
    try {
      const parsed = new URL(url);
      urlAnalysis = {
        isHttps: parsed.protocol === 'https:',
        pathLength: parsed.pathname.length,
        hasTrailingSlash: parsed.pathname.endsWith('/') && parsed.pathname !== '/',
        depth: parsed.pathname.split('/').filter(Boolean).length,
        hasNumbers: /\d/.test(parsed.pathname),
        hasUnderscores: parsed.pathname.includes('_'),
        isClean: !parsed.search && !parsed.pathname.includes('_') && parsed.pathname.length < 80,
      };
    } catch { /* ignore */ }

    /* ── FLESCH-KINCAID ── */
    const flesch = computeFlesch(bodyText.slice(0, 80000));

    /* ── CONTENT FRESHNESS ── */
    let contentAgeDays = null;
    let daysSinceModified = null;
    let isContentStale = false;
    if (datePublished) {
      try {
        const pubDate = new Date(datePublished);
        if (!isNaN(pubDate)) {
          contentAgeDays = Math.floor((Date.now() - pubDate.getTime()) / 86400000);
          if (dateModified) {
            const modDate = new Date(dateModified);
            if (!isNaN(modDate)) daysSinceModified = Math.floor((Date.now() - modDate.getTime()) / 86400000);
          }
          isContentStale = (daysSinceModified ?? contentAgeDays) > 365;
        }
      } catch { /* ignore */ }
    }

    /* ── TABLE OF CONTENTS ── */
    let hasTableOfContents = false;
    const tocCandidates = ['nav', '.toc', '#toc', '[class*="table-of-contents"]', '[id*="table-of-contents"]', '[class*="toc-"]', '[class*="-toc"]', 'details[class*="toc"]'];
    for (const sel of tocCandidates) {
      try { if ($(sel).find('a[href^="#"]').length >= 3) { hasTableOfContents = true; break; } } catch {}
    }
    if (!hasTableOfContents) {
      $('ul, ol').each((_, list) => {
        if ($(list).find('a[href^="#"]').length >= 3) { hasTableOfContents = true; return false; }
      });
    }

    /* ── FEATURED SNIPPET SIGNALS ── */
    const qRegex = /^(how|what|why|when|where|who|which|is|are|can|do|does|did|will|should|would)\b/i;
    const questionHeadings = headings.filter(h => qRegex.test(h.text.trim()));
    const questionHeadingCount = questionHeadings.length;
    const hasFaqSection = !!$('[itemtype*="FAQPage"]').length
      || !!$('[class*="faq"],[id*="faq"]').length
      || !!$('h2, h3').filter((_, el) => /faq|frequently asked/i.test($(el).text())).length;

    /* ── TWITTER CARD ── */
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
    const twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
    const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
    const hasTwitterCard = !!twitterCard;

    /* ── KEYWORD IN FIRST 100 WORDS ── */
    const first100WordsText = bodyText.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
    const keywordInFirst100Words = kwList.some(kw => first100WordsText.includes(kw.toLowerCase()));

    /* ── LINK ANCHOR QUALITY ── */
    const genericAnchorRx = /^(click here|here|read more|learn more|this|this post|more info|link|this link|read this|find out|visit|check out|see more|more details|see also|more|continue reading)$/i;
    const genericAnchorCount = allLinks.filter(l => genericAnchorRx.test((l.text || '').trim())).length;

    /* ── E-E-A-T SIGNALS ── */
    const hasAuthorInBody = !!$('[class*="author"],[rel~="author"],[itemprop="author"],[class*="byline"],[class*="post-author"]').length;
    const hasAuthorPageLink = allLinks.some(l => /\/author\/|\/about\/|\/team\/|\/staff\/|\/profile\//i.test(l.href || ''));
    const eeatSignals = {
      hasAuthorMeta: !!authorMeta,
      hasAuthorInBody,
      hasAuthorPageLink,
      hasDatePublished: !!datePublished,
      hasDateModified: !!dateModified,
      score: [!!authorMeta, hasAuthorInBody, hasAuthorPageLink, !!datePublished].filter(Boolean).length,
    };

    /* ── SCORING ── */
    const scored = computeBlogScore({
      title, metaDescription, h1, h1Count, wordCount, headings, h2Count, h3Count,
      internalLinks, externalLinks, imageCount, imagesWithAlt, imagesMissingDimensions,
      schemaMarkup, schemaTypes, canonicalUrl, robotsMeta, langTag, viewportMeta, pageSizeKB,
      isHttps, authorMeta, datePublished, dateModified, readabilityScore,
      longParagraphs, avgSentenceLength, avgParagraphLength,
      keywordInTitle, keywordInH1, keywordInMeta, keywordInUrl, keywordInFirstParagraph,
      keywordInFirst100Words,
      kwDensity, kwList, ogTitle, ogDescription, ogImage, urlAnalysis, hasFavicon, hasCharset,
      hasTwitterCard, flesch, isContentStale, contentAgeDays, hasTableOfContents,
      questionHeadingCount, hasFaqSection, genericAnchorCount, eeatSignals,
    });

    res.json({
      ok: true, url, title, metaDescription, canonicalUrl, h1, h1Count, robotsMeta, langTag,
      viewportMeta, authorMeta, datePublished, dateModified,
      ogTitle, ogDescription, ogImage, ogType,
      twitterCard, twitterTitle, twitterDescription, twitterImage, hasTwitterCard,
      wordCount, readingTimeMinutes, paragraphCount: paragraphs.length, avgParagraphLength, longParagraphs,
      headings, h2Count, h3Count, subheadingDistribution,
      internalLinks, externalLinks, internalLinkDetails, externalLinkDetails,
      imageCount, imagesWithAlt, imagesMissingDimensions, images: images.slice(0, 30),
      schemaMarkup, schemaTypes, schemaRawData,
      keywordDensity: kwDensity, keywordInTitle, keywordInH1, keywordInMeta, keywordInUrl,
      keywordInFirstParagraph, keywordInFirst100Words,
      readabilityScore, avgSentenceLength, longSentences, flesch,
      pageSizeKB, isHttps, hasFavicon, hasCharset, urlAnalysis,
      contentAgeDays, daysSinceModified, isContentStale,
      hasTableOfContents,
      questionHeadingCount, questionHeadings, hasFaqSection,
      genericAnchorCount, eeatSignals,
      scored,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   BLOG SCORING — blog-specific weighted scoring system
   ========================================================================= */
function computeBlogScore(d) {
  const issues = [];
  function addIssue(cat, sev, impact, msg) { issues.push({ cat, sev, impact, msg }); }

  let content = 100, meta = 100, technical = 100, keywords = 100, structure = 100;

  /* ── CONTENT ── */
  if (d.wordCount < 300)       { content -= 25; addIssue('content', 'high', 25, `Only ${d.wordCount} words — blog posts should be 300+ words minimum`); }
  else if (d.wordCount < 800)  { content -= 15; addIssue('content', 'medium', 15, `${d.wordCount} words is thin — aim for 800+ for competitive blog content`); }
  else if (d.wordCount < 1500) { content -= 5;  addIssue('content', 'low', 5, `${d.wordCount} words — consider expanding to 1500+ for comprehensive coverage`); }
  if (d.wordCount > 5000)      { content -= 5;  addIssue('content', 'low', 5, 'Very long post (5000+ words) — consider splitting into a series'); }

  if (d.readabilityScore < 40) { content -= 20; addIssue('content', 'high', 20, `Readability score ${d.readabilityScore}/100 is poor — simplify sentences and paragraphs`); }
  else if (d.readabilityScore < 60) { content -= 10; addIssue('content', 'medium', 10, `Readability ${d.readabilityScore}/100 — could be more accessible`); }

  if (d.flesch && d.flesch.grade > 14) { content -= 8; addIssue('content', 'medium', 8, `Flesch-Kincaid grade ${d.flesch.grade} — writing is college-level+, consider simplifying for broader audience`); }

  if (d.longParagraphs > 0) { content -= Math.min(15, d.longParagraphs * 5); addIssue('content', 'medium', Math.min(15, d.longParagraphs * 5), `${d.longParagraphs} paragraph(s) exceed 120 words — break them up`); }
  if (d.avgSentenceLength > 25) { content -= 10; addIssue('content', 'medium', 10, `Average sentence length ${d.avgSentenceLength} words — aim under 20`); }

  if (!d.authorMeta && !(d.eeatSignals?.hasAuthorInBody)) { content -= 10; addIssue('content', 'medium', 10, 'No author signal found — add author meta tag and visible byline (important for E-E-A-T)'); }
  else if (!d.authorMeta) { content -= 4; addIssue('content', 'low', 4, 'No author meta tag — add <meta name="author"> for E-E-A-T'); }
  if (!d.eeatSignals?.hasAuthorPageLink) { content -= 4; addIssue('content', 'low', 4, 'No link to author page — add a byline linking to author profile (/about, /author/name)'); }

  if (!d.datePublished && !d.dateModified) { content -= 8; addIssue('content', 'medium', 8, 'No published/modified date — freshness signals are a blog ranking factor'); }
  if (d.isContentStale) { content -= 12; addIssue('content', 'high', 12, `Content published ${d.contentAgeDays} days ago with no recent modification — consider refreshing this post`); }

  /* ── META TAGS ── */
  if (!d.title) { meta -= 30; addIssue('meta', 'high', 30, 'Missing title tag'); }
  else {
    const tLen = d.title.length;
    if (tLen < 30)      { meta -= 15; addIssue('meta', 'high', 15, `Title too short (${tLen} chars) — aim for 50-60`); }
    else if (tLen > 60) { meta -= 10; addIssue('meta', 'medium', 10, `Title too long (${tLen} chars) — may be truncated in SERP`); }
  }

  if (!d.metaDescription) { meta -= 25; addIssue('meta', 'high', 25, 'Missing meta description'); }
  else {
    const dLen = d.metaDescription.length;
    if (dLen < 120)      { meta -= 12; addIssue('meta', 'medium', 12, `Meta description short (${dLen} chars) — aim for 150-160`); }
    else if (dLen > 165) { meta -= 8;  addIssue('meta', 'medium', 8, `Meta description long (${dLen} chars) — may be truncated`); }
  }

  if (!d.h1) { meta -= 20; addIssue('meta', 'high', 20, 'Missing H1 heading'); }
  if (d.h1Count > 1) { meta -= 10; addIssue('meta', 'medium', 10, `${d.h1Count} H1 tags found — use exactly one`); }
  if (!d.ogTitle || !d.ogDescription || !d.ogImage) { meta -= 8; addIssue('meta', 'medium', 8, 'Incomplete Open Graph tags — important for social sharing'); }
  if (!d.hasTwitterCard) { meta -= 5; addIssue('meta', 'low', 5, 'Missing Twitter Card meta tags (twitter:card, twitter:title) — needed for rich Twitter previews'); }
  if (!d.canonicalUrl) { meta -= 5; addIssue('meta', 'low', 5, 'No canonical URL set'); }

  /* ── TECHNICAL ── */
  if (!d.isHttps)      { technical -= 20; addIssue('technical', 'high', 20, 'Not served over HTTPS'); }
  if (!d.langTag)      { technical -= 8;  addIssue('technical', 'medium', 8, 'Missing lang attribute on <html>'); }
  if (!d.viewportMeta) { technical -= 12; addIssue('technical', 'medium', 12, 'Missing viewport meta — not mobile-friendly'); }
  if (!d.schemaMarkup) { technical -= 10; addIssue('technical', 'medium', 10, 'No structured data — add Article/BlogPosting schema for rich results'); }
  else {
    const hasArticle = (d.schemaTypes || []).some(t => /Article|BlogPosting/i.test(t));
    if (!hasArticle) { technical -= 5; addIssue('technical', 'low', 5, 'Schema found but no Article/BlogPosting type — add blog-specific schema'); }
  }
  if (d.wordCount > 1200 && !d.hasTableOfContents) { technical -= 6; addIssue('technical', 'low', 6, 'Long post with no table of contents — add a ToC for better UX and potential sitelinks'); }
  if (d.questionHeadingCount === 0 && d.wordCount > 800) { technical -= 4; addIssue('technical', 'low', 4, 'No question-form headings — add How/What/Why H2s to win featured snippets'); }
  if (d.pageSizeKB > 200) { technical -= 8; addIssue('technical', 'medium', 8, `Page size ${d.pageSizeKB}KB — consider optimizing`); }
  if (!d.hasFavicon) { technical -= 3; addIssue('technical', 'low', 3, 'No favicon detected'); }
  if (!d.hasCharset)  { technical -= 3; addIssue('technical', 'low', 3, 'No charset declaration'); }
  if (d.urlAnalysis?.hasUnderscores) { technical -= 5; addIssue('technical', 'low', 5, 'URL contains underscores — use hyphens instead'); }
  if (d.urlAnalysis?.pathLength > 80) { technical -= 5; addIssue('technical', 'low', 5, 'URL path is too long'); }

  /* ── KEYWORDS ── */
  if (d.kwList.length > 0) {
    if (!d.keywordInTitle) { keywords -= 20; addIssue('keywords', 'high', 20, 'Primary keyword not in title tag'); }
    if (!d.keywordInH1)    { keywords -= 15; addIssue('keywords', 'high', 15, 'Primary keyword not in H1'); }
    if (!d.keywordInMeta)  { keywords -= 12; addIssue('keywords', 'medium', 12, 'Primary keyword not in meta description'); }
    if (!d.keywordInUrl)   { keywords -= 8;  addIssue('keywords', 'medium', 8, 'Primary keyword not in URL'); }
    if (!d.keywordInFirst100Words) { keywords -= 12; addIssue('keywords', 'medium', 12, 'Primary keyword not in first 100 words — Google weights early keyword placement heavily'); }
    else if (!d.keywordInFirstParagraph) { keywords -= 4; addIssue('keywords', 'low', 4, 'Keyword appears in first 100 words but not the opening paragraph — move it earlier'); }
    const primaryKw = d.kwList[0];
    const primaryDensity = d.kwDensity[primaryKw]?.density || 0;
    if (primaryDensity === 0)     { keywords -= 15; addIssue('keywords', 'high', 15, `"${primaryKw}" not found in content at all`); }
    else if (primaryDensity < 0.5) { keywords -= 8;  addIssue('keywords', 'medium', 8, `"${primaryKw}" density ${primaryDensity}% — aim for 0.5-2.5%`); }
    else if (primaryDensity > 3)   { keywords -= 10; addIssue('keywords', 'medium', 10, `"${primaryKw}" density ${primaryDensity}% — keyword stuffing risk`); }
  } else {
    keywords -= 5; addIssue('keywords', 'low', 5, 'No target keywords specified — keyword optimization cannot be evaluated');
  }

  /* ── STRUCTURE ── */
  if (d.h2Count === 0)                   { structure -= 20; addIssue('structure', 'high', 20, 'No H2 subheadings — blog content needs clear structure'); }
  else if (d.h2Count < 3 && d.wordCount > 800) { structure -= 10; addIssue('structure', 'medium', 10, `Only ${d.h2Count} H2s for ${d.wordCount} words — add more subheadings`); }
  if (d.h3Count === 0 && d.wordCount > 1000) { structure -= 5; addIssue('structure', 'low', 5, 'No H3 subheadings — consider adding for longer content'); }
  if (d.internalLinks === 0)         { structure -= 15; addIssue('structure', 'high', 15, 'No internal links — critical for blog SEO and site structure'); }
  else if (d.internalLinks < 3)      { structure -= 8;  addIssue('structure', 'medium', 8, `Only ${d.internalLinks} internal link(s) — aim for 3-10`); }
  if (d.externalLinks === 0)         { structure -= 8;  addIssue('structure', 'medium', 8, 'No external links — citing authoritative sources improves credibility'); }
  if (d.genericAnchorCount > 0)      { structure -= Math.min(8, d.genericAnchorCount * 3); addIssue('structure', 'low', Math.min(8, d.genericAnchorCount * 3), `${d.genericAnchorCount} link(s) with generic anchor text ("click here", "read more") — use descriptive anchors`); }
  if (d.imageCount === 0)            { structure -= 10; addIssue('structure', 'medium', 10, 'No images — blog posts benefit from visual content'); }
  else if (d.imagesWithAlt < d.imageCount) { structure -= Math.min(10, (d.imageCount - d.imagesWithAlt) * 3); addIssue('structure', 'medium', Math.min(10, (d.imageCount - d.imagesWithAlt) * 3), `${d.imageCount - d.imagesWithAlt} image(s) missing alt text`); }
  if (d.imagesMissingDimensions > 0) { structure -= Math.min(8, d.imagesMissingDimensions * 2); addIssue('structure', 'low', Math.min(8, d.imagesMissingDimensions * 2), `${d.imagesMissingDimensions} image(s) missing width/height dimensions`); }

  content   = Math.max(0, Math.min(100, content));
  meta      = Math.max(0, Math.min(100, meta));
  technical = Math.max(0, Math.min(100, technical));
  keywords  = Math.max(0, Math.min(100, keywords));
  structure = Math.max(0, Math.min(100, structure));

  const overall = Math.round(content * 0.25 + meta * 0.25 + technical * 0.15 + keywords * 0.20 + structure * 0.15);

  return {
    overall,
    categories: {
      content: { score: content, weight: 25 },
      meta: { score: meta, weight: 25 },
      technical: { score: technical, weight: 15 },
      keywords: { score: keywords, weight: 20 },
      structure: { score: structure, weight: 15 },
    },
    issues,
    issueCount: issues.length,
    highIssues: issues.filter(i => i.sev === 'high').length,
    mediumIssues: issues.filter(i => i.sev === 'medium').length,
    lowIssues: issues.filter(i => i.sev === 'low').length,
    grade: overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 40 ? 'D' : 'F',
  };
}

/* =========================================================================
   AI: DEEP BLOG ANALYSIS — GPT-powered content analysis
   ========================================================================= */
router.post('/ai/analyze', async (req, res) => {
  try {
    const { url, title, metaDescription, h1, wordCount, headings, keywords, scored } = req.body || {};
    const systemPrompt = `You are an expert blog SEO consultant for Shopify e-commerce stores. Analyze the blog post data and return actionable recommendations. Return JSON with: { assessment: string, strengths: string[], weaknesses: string[], contentGaps: string[], recommendations: [{ priority: "critical"|"recommended"|"optional", title: string, description: string }], topicSuggestions: string[], estimatedTrafficPotential: string }`;
    const userPrompt = `Analyze this blog post:\nURL: ${url}\nTitle: ${title}\nH1: ${h1}\nMeta Description: ${metaDescription}\nWord Count: ${wordCount}\nHeadings: ${JSON.stringify((headings || []).slice(0, 20))}\nKeywords: ${keywords || 'none specified'}\nSEO Score: ${scored?.overall || 'N/A'}/100\nIssues: ${scored?.issueCount || 0} (${scored?.highIssues || 0} high)\n\nProvide a thorough blog SEO analysis with actionable recommendations.`;

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    let structured; try { structured = JSON.parse(raw); } catch { structured = null; }
    res.json({ ok: true, analysis: raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI: CONTENT BRIEF — AI-powered brief generation
   ========================================================================= */
router.post('/ai/content-brief', async (req, res) => {
  try {
    const { topic, primaryKeyword, secondaryKeywords, audience, tone } = req.body || {};
    if (!topic && !primaryKeyword) return res.status(400).json({ ok: false, error: 'topic or primaryKeyword required' });

    const systemPrompt = `You are an expert content strategist for e-commerce blogs. Generate a comprehensive content brief. Return JSON with: { title: string, metaTitle: string, metaDescription: string, h1: string, targetWordCount: number, outline: [{ heading: string, subheadings: string[], wordCount: number, notes: string }], keywordStrategy: { primary: string, secondary: string[], lsi: string[] }, searchIntent: string, competitorGaps: string[], uniqueAngles: string[], cta: string, estimatedRank: string }`;
    const userPrompt = `Create a content brief for:\nTopic: ${topic || primaryKeyword}\nPrimary Keyword: ${primaryKeyword || topic}\nSecondary Keywords: ${(secondaryKeywords || []).join(', ') || 'none'}\nAudience: ${audience || 'Shopify merchants'}\nTone: ${tone || 'Professional and actionable'}`;

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    let structured; try { structured = JSON.parse(raw); } catch { structured = null; }
    res.json({ ok: true, brief: raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI: KEYWORD RESEARCH — discover keywords from a seed
   ========================================================================= */
router.post('/ai/keyword-research', async (req, res) => {
  try {
    const { seedKeyword, niche, audience } = req.body || {};
    if (!seedKeyword) return res.status(400).json({ ok: false, error: 'seedKeyword required' });

    const systemPrompt = `You are an expert SEO keyword researcher for Shopify e-commerce blogs. Generate keyword research data. Return JSON with: { seedKeyword: string, clusters: [{ name: string, intent: "informational"|"commercial"|"navigational"|"transactional", keywords: [{ keyword: string, estimatedVolume: string, difficulty: string, priority: "high"|"medium"|"low" }] }], longTailKeywords: string[], questionsToAnswer: string[], contentIdeas: [{ title: string, type: "guide"|"listicle"|"how-to"|"comparison"|"case-study", targetKeyword: string }] }`;
    const userPrompt = `Research keywords for:\nSeed Keyword: ${seedKeyword}\nNiche: ${niche || 'Shopify e-commerce'}\nAudience: ${audience || 'Online store owners'}`;

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    let structured; try { structured = JSON.parse(raw); } catch { structured = null; }
    res.json({ ok: true, research: raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI: REWRITE META — generate title / description / H1 variants
   ========================================================================= */
router.post('/ai/rewrite', async (req, res) => {
  try {
    const { field, currentValue, keywords, url } = req.body || {};
    if (!field || !currentValue) return res.status(400).json({ ok: false, error: 'field and currentValue required' });

    const limits = { title: '50-60 characters', metaDescription: '150-160 characters', h1: '20-70 characters' };
    const systemPrompt = `You are an SEO copywriter for e-commerce blogs. Generate 5 optimized variants for the blog post's ${field}. Each variant should be ${limits[field] || 'concise'}, include the target keyword naturally, and be compelling for CTR. Return JSON with: { field: string, variants: [{ text: string, charCount: number, keywordPresent: boolean, ctaStrength: string }] }`;
    const userPrompt = `Current ${field}: "${currentValue}"\nKeywords: ${keywords || 'none'}\nURL: ${url || 'N/A'}\n\nGenerate 5 SEO-optimized variants.`;

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    let structured; try { structured = JSON.parse(raw); } catch { structured = null; }
    res.json({ ok: true, field, suggestions: raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI: FIX CODE — generate a fix for a specific SEO issue
   ========================================================================= */
router.post('/ai/fix-code', async (req, res) => {
  try {
    const { issue, url, pageContext } = req.body || {};
    if (!issue) return res.status(400).json({ ok: false, error: 'issue is required' });

    const systemPrompt = `You are an expert web developer specializing in Shopify blog SEO. Given an SEO issue, provide the exact code fix. Return JSON with: { priority: "critical"|"recommended"|"optional", fixType: "html"|"liquid"|"schema"|"meta"|"css", location: string, explanation: string, code: string }`;
    const userPrompt = `Fix this blog SEO issue:\nIssue: ${issue}\nURL: ${url || 'N/A'}\nPage: ${pageContext ? JSON.stringify(pageContext) : 'N/A'}`;

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    let fix; try { fix = JSON.parse(raw); } catch { fix = { explanation: raw, code: '', fixType: 'html', priority: 'recommended', location: 'unknown' }; }
    res.json({ ok: true, fix });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI: INTERNAL LINK SUGGESTIONS
   ========================================================================= */
router.post('/ai/internal-links', async (req, res) => {
  try {
    const { url, title, headings, internalLinkDetails, keywords } = req.body || {};
    const systemPrompt = `You are an internal linking strategist for Shopify blogs. Analyze the blog post and suggest internal linking improvements. Return JSON with: { currentLinkCount: number, idealLinkCount: number, suggestions: [{ anchorText: string, targetPage: string, section: string, reason: string, priority: "high"|"medium"|"low" }], orphanedRisk: boolean, siloPlan: string, hubPageSuggestion: string }`;
    const userPrompt = `Analyze internal links for:\nURL: ${url}\nTitle: ${title}\nHeadings: ${JSON.stringify((headings || []).slice(0, 15))}\nCurrent Internal Links: ${JSON.stringify((internalLinkDetails || []).slice(0, 20))}\nKeywords: ${keywords || 'none'}`;

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    let structured; try { structured = JSON.parse(raw); } catch { structured = null; }
    res.json({ ok: true, links: raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI: CHAT — blog SEO assistant
   ========================================================================= */
router.post('/ai/generate', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!messages || !messages.length) return res.status(400).json({ ok: false, error: 'messages required' });

    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are an expert blog SEO assistant for Shopify e-commerce stores. Give specific, actionable advice about blog SEO strategy, content optimization, keyword targeting, and technical SEO. Be concise but thorough.' }, ...messages.slice(-20)],
      temperature: 0.6,
    });
    const reply = completion.choices[0]?.message?.content || '';
    res.json({ ok: true, reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   BULK ANALYZE — scan up to 10 blog URLs
   ========================================================================= */
router.post('/bulk-analyze', async (req, res) => {
  try {
    const { urls, keywords } = req.body || {};
    if (!urls || !Array.isArray(urls) || !urls.length) return res.status(400).json({ ok: false, error: 'urls array required' });
    const toScan = urls.filter(u => u && typeof u === 'string').slice(0, 10);
    const results = [];
    for (const blogUrl of toScan) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 10000);
        const resp = await fetch(blogUrl, { signal: ctrl.signal, headers: { 'User-Agent': 'AuraBlogSEOBot/2.0' }, redirect: 'follow' });
        clearTimeout(t);
        const html = await resp.text();
        const $ = cheerio.load(html);
        $('script, style, noscript, svg, iframe').remove();
        const title = $('title').first().text().trim();
        const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
        const h1 = $('h1').first().text().trim();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
        const headings = []; $('h1, h2, h3').each((_, el) => headings.push({ tag: el.tagName.toLowerCase(), text: $(el).text().trim().slice(0, 80) }));
        const h2Count = headings.filter(h => h.tag === 'h2').length;
        const intLinks = $('a[href]').filter((_, el) => { try { return new URL($(el).attr('href'), blogUrl).hostname === new URL(blogUrl).hostname; } catch { return false; } }).length;
        const imgCount = $('img').length;
        const imgAlt = $('img[alt]').filter((_, el) => ($(el).attr('alt') || '').length > 0).length;
        const schema = $('script[type="application/ld+json"]').length > 0;
        const size = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
        const scored = computeBlogScore({
          title, metaDescription: metaDesc, h1, h1Count: $('h1').length, wordCount, headings, h2Count,
          h3Count: headings.filter(h => h.tag === 'h3').length,
          internalLinks: intLinks, externalLinks: $('a[href]').length - intLinks, imageCount: imgCount, imagesWithAlt: imgAlt,
          imagesMissingDimensions: 0, schemaMarkup: schema, canonicalUrl: $('link[rel="canonical"]').attr('href') || '',
          robotsMeta: '', langTag: $('html').attr('lang') || '', viewportMeta: $('meta[name="viewport"]').attr('content') || '',
          pageSizeKB: size, isHttps: blogUrl.startsWith('https'), authorMeta: $('meta[name="author"]').attr('content') || '',
          datePublished: '', dateModified: '', readabilityScore: 70, longParagraphs: 0, avgSentenceLength: 18, avgParagraphLength: 50,
          keywordInTitle: false, keywordInH1: false, keywordInMeta: false, keywordInUrl: false, keywordInFirstParagraph: false,
          kwDensity: {}, kwList: (keywords || '').split(',').map(k => k.trim()).filter(Boolean),
          ogTitle: '', ogDescription: '', ogImage: '', urlAnalysis: {}, hasFavicon: $('link[rel="icon"]').length > 0, hasCharset: true,
        });
        results.push({ status: 'ok', url: blogUrl, title, wordCount, score: scored.overall, grade: scored.grade, issueCount: scored.issueCount, highIssues: scored.highIssues, h2Count, internalLinks: intLinks, imageCount: imgCount, pageSizeKB: size });
      } catch (e) {
        results.push({ status: 'error', url: blogUrl, error: e.message });
      }
    }
    const ok = results.filter(r => r.status === 'ok');
    res.json({ ok: true, results, summary: { scanned: ok.length, failed: results.length - ok.length, avgScore: ok.length ? Math.round(ok.reduce((s, r) => s + r.score, 0) / ok.length) : 0, totalIssues: ok.reduce((s, r) => s + (r.issueCount || 0), 0) } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SCHEMA GENERATOR — generate BlogPosting JSON-LD from scan data
   ========================================================================= */
router.post('/schema/generate', (req, res) => {
  try {
    const {
      url, title, metaDescription, h1, datePublished, dateModified,
      authorName, authorUrl, publisherName, publisherUrl, publisherLogo,
      imageUrl, articleBody, keywords,
    } = req.body || {};

    if (!url) return res.status(400).json({ ok: false, error: 'url is required' });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      ...(h1 || title ? { headline: (h1 || title).slice(0, 110) } : {}),
      ...(metaDescription ? { description: metaDescription } : {}),
      ...(url ? { url, mainEntityOfPage: { '@type': 'WebPage', '@id': url } } : {}),
      ...(imageUrl ? { image: [imageUrl] } : {}),
      ...(datePublished ? { datePublished } : {}),
      ...(dateModified ? { dateModified } : {}),
      ...(articleBody ? { articleBody: articleBody.slice(0, 500) } : {}),
      ...(keywords ? { keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords } : {}),
    };

    if (authorName) {
      schema.author = {
        '@type': 'Person',
        name: authorName,
        ...(authorUrl ? { url: authorUrl } : {}),
      };
    }

    if (publisherName) {
      schema.publisher = {
        '@type': 'Organization',
        name: publisherName,
        ...(publisherUrl ? { url: publisherUrl } : {}),
        ...(publisherLogo ? { logo: { '@type': 'ImageObject', url: publisherLogo } } : {}),
      };
    }

    const jsonLd = JSON.stringify(schema, null, 2);
    const scriptTag = `<script type="application/ld+json">\n${jsonLd}\n</script>`;

    res.json({ ok: true, schema, jsonLd, scriptTag });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   HISTORY CRUD
   ========================================================================= */
router.post('/items', (req, res) => {
  const id = ++historySeq;
  const item = { id, ...req.body, ts: req.body.ts || new Date().toISOString() };
  historyStore.set(id, item);
  res.json({ ok: true, item });
});

router.get('/items', (_req, res) => {
  res.json({ ok: true, items: Array.from(historyStore.values()) });
});

router.delete('/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  historyStore.delete(id);
  res.json({ ok: true });
});

/* =========================================================================
   DETERMINISTIC HELPERS (from engine modules)
   ========================================================================= */
router.post('/metadata/analyze', (req, res) => {
  const { title, description, keywords } = req.body || {};
  res.json({ ok: true, ...onpageEngine.analyzeMetadata(title || '', description || '', keywords || []) });
});

router.post('/keywords/evaluate', (req, res) => {
  const { keyword } = req.body || {};
  res.json({ ok: true, ...keywordEngine.evaluateKeyword(keyword) });
});

router.post('/research/score', (req, res) => {
  res.json({ ok: true, ...researchEngine.scoreIntent(req.body || {}) });
});

/* =========================================================================
   SERP PREVIEW — compute character counts, truncation, warnings
   ========================================================================= */
router.post('/serp/preview', (req, res) => {
  try {
    const { title = '', metaDescription = '', url = '' } = req.body || {};
    const titleLen   = title.length;
    const descLen    = metaDescription.length;

    let breadcrumb = url;
    try {
      const u = new URL(url);
      breadcrumb = u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {}

    const warnings = [];
    if (titleLen > 0 && titleLen < 30)  warnings.push({ field: 'title', type: 'too_short', msg: `Title only ${titleLen} chars — aim for 50-60` });
    if (titleLen > 60)                  warnings.push({ field: 'title', type: 'too_long',  msg: `Title is ${titleLen} chars — may be truncated in Google (≤60 recommended)` });
    if (descLen > 0 && descLen < 50)    warnings.push({ field: 'description', type: 'too_short', msg: `Description only ${descLen} chars — aim for 150-160` });
    if (descLen > 160)                  warnings.push({ field: 'description', type: 'too_long',  msg: `Description is ${descLen} chars — will be truncated (≤160 recommended)` });

    // Pixel-width approximation: avg ~7px/char for Google Roboto 14px
    const titlePixels = Math.round(titleLen * 6.8);
    const descPixels  = Math.round(descLen  * 6.15);

    res.json({
      ok: true, titleLen, descLen, breadcrumb, warnings,
      titlePixels, descPixels,
      truncatedTitle: title.slice(0, 60),
      truncatedDesc:  metaDescription.slice(0, 160),
      titleOk: titleLen >= 30 && titleLen <= 60,
      descOk:  descLen  >= 50 && descLen  <= 160,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   FAQ SCHEMA GENERATOR — build FAQPage JSON-LD from question headings
   ========================================================================= */
router.post('/faq-schema/generate', async (req, res) => {
  try {
    const { questionHeadings = [], useAI = false, url, model = 'gpt-4o-mini' } = req.body || {};
    if (!questionHeadings.length) return res.status(400).json({ ok: false, error: 'questionHeadings array is required' });

    let faqs;

    if (useAI) {
      const openai = getOpenAI();
      const prompt = `You are an SEO content expert. For the blog post${url ? ` at ${url}` : ''}, write concise 2-3 sentence answers for each FAQ question below. Answers must be factual, helpful, and suitable for a Google featured answer box.\n\nQuestions:\n${questionHeadings.map((h, i) => `${i + 1}. ${h.text}`).join('\n')}\n\nRespond as JSON: {"faqs": [{"question": "string", "answer": "string"}]}`;
      const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
      faqs = JSON.parse(resp.choices[0].message.content).faqs || [];
      if (req.deductCredits) req.deductCredits({ model });
    } else {
      faqs = questionHeadings.map(h => ({ question: h.text, answer: `[Enter your answer to: "${h.text}"]` }));
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    };

    const jsonLd    = JSON.stringify(schema, null, 2);
    const scriptTag = `<script type="application/ld+json">\n${jsonLd}\n</script>`;
    res.json({ ok: true, schema, jsonLd, scriptTag, faqs, aiGenerated: useAI });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   BROKEN LINK CHECKER — HEAD-check every link on the page
   ========================================================================= */
router.post('/links/check', async (req, res) => {
  try {
    const { url, links } = req.body || {};
    if (!url && (!links || !links.length)) return res.status(400).json({ ok: false, error: 'url or links required' });

    let linksToCheck = links ? [...links] : [];

    if (url && !linksToCheck.length) {
      // Fetch page and extract all links
      const fetchMod = (await import('node-fetch')).default;
      const pageResp = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
      const html     = await pageResp.text();
      const $        = cheerio.load(html);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || /^(#|mailto:|tel:|javascript:)/.test(href)) return;
        try {
          const abs  = new URL(href, url).href;
          const text = $(el).text().trim().slice(0, 80) || href;
          if (!linksToCheck.find(l => l.url === abs)) linksToCheck.push({ url: abs, text });
        } catch {}
      });
    }

    // Cap at 60 links
    linksToCheck = linksToCheck.slice(0, 60);

    const checkLink = async (link) => {
      const start = Date.now();
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(link.url, {
          method: 'HEAD', redirect: 'manual',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' },
          timeout: 8000,
        });
        const status = r.status;
        return {
          url: link.url, text: link.text, status,
          ok: status >= 200 && status < 300,
          redirect: status >= 300 && status < 400,
          broken: status >= 400,
          redirectUrl: r.headers.get('location') || null,
          duration: Date.now() - start,
        };
      } catch (err) {
        return { url: link.url, text: link.text, status: null, ok: false, redirect: false, broken: true, error: err.message, duration: Date.now() - start };
      }
    };

    // Check in batches of 10 to avoid hammering
    const results = [];
    for (let i = 0; i < linksToCheck.length; i += 10) {
      const batch = linksToCheck.slice(i, i + 10);
      results.push(...(await Promise.all(batch.map(checkLink))));
    }

    const summary = {
      total:     results.length,
      ok:        results.filter(r => r.ok).length,
      redirects: results.filter(r => r.redirect).length,
      broken:    results.filter(r => r.broken).length,
    };

    res.json({ ok: true, results, summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   LSI / SEMANTIC KEYWORDS — AI suggests related terms (2 credits)
   ========================================================================= */
router.post('/keywords/lsi', async (req, res) => {
  try {
    const { keyword, url, title, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });

    const openai = getOpenAI();
    const prompt = `You are an expert SEO content strategist. For the primary keyword "${keyword}"${title ? ` in a blog post titled "${title}"` : ''}${niche ? ` in the ${niche} niche` : ''}, generate 18-22 semantically related (LSI) keywords and phrases that should naturally appear throughout the content to demonstrate topical depth to Google.

Include a mix of: synonyms, related concepts, supporting terminology, common questions, long-tail variations, and entities (people/places/products).

Respond ONLY as JSON:
{
  "lsi": [
    { "keyword": "string", "type": "synonym|related|longtail|question|entity", "priority": "high|medium|low", "usage": "one-line tip on where to use this" }
  ],
  "topicClusters": ["cluster name", ...],
  "contentGaps": ["topic or angle missing from typical content on this keyword"],
  "tip": "Single actionable optimization tip"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   LLM / AI OPTIMIZATION SCORE — 2026 readability for LLMs (Backlinko/Semrush)
   ========================================================================= */
router.post('/llm/score', async (req, res) => {
  try {
    const { url, content } = req.body || {};
    let html = content || '';

    if (!html && url) {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
      html = await r.text();
    }
    if (!html) return res.status(400).json({ ok: false, error: 'url or content required' });

    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    const words = bodyText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Semantic chunking — H2s present
    const h2Count = $('h2').length;
    const hasSemanticChunking = h2Count >= 3;

    // 2. Lead-with-answer — first paragraph after first H1/H2 is short (<= 60 words)
    let firstParaWords = 0;
    const firstH = $('h1, h2').first();
    if (firstH.length) {
      const nextP = firstH.nextAll('p').first();
      firstParaWords = nextP.text().trim().split(/\s+/).filter(Boolean).length;
    } else {
      firstParaWords = $('p').first().text().trim().split(/\s+/).filter(Boolean).length;
    }
    const hasLeadAnswer = firstParaWords > 0 && firstParaWords <= 60;

    // 3. FAQ section present
    const hasFaq = /\bfaq\b|frequently asked|common question/i.test(bodyText) || $('h2, h3').toArray().some(el => /\bfaq\b|frequently asked/i.test($(el).text()));

    // 4. Statistics / data citations (numbers in text)
    const statsMatches = bodyText.match(/\b\d+(\.\d+)?%|\b\d{4}\b|\b\d+ (studies|research|survey|report)/gi) || [];
    const hasStatistics = statsMatches.length >= 3;

    // 5. Quotable standalone sentences (short sentence < 20 words ending with period, surrounded by longer text)
    const sentences = bodyText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    const shortSentences = sentences.filter(s => s.split(/\s+/).length <= 20 && s.split(/\s+/).length >= 5);
    const hasQuotable = shortSentences.length >= 5;

    // 6. Self-contained paragraphs — avg paragraph word count reasonable (30-120 words)
    const paras = $('p').toArray().map(el => $(el).text().trim()).filter(t => t.length > 20);
    const avgParaLen = paras.length ? Math.round(paras.reduce((s, p) => s + p.split(/\s+/).length, 0) / paras.length) : 0;
    const hasSelfContained = avgParaLen >= 25 && avgParaLen <= 130;

    // 7. Table of contents present
    const hasToc = $('nav').length > 0 || /table of contents|jump to/i.test(bodyText) || $('a[href^="#"]').length >= 4;

    // 8. Subheadings describe content (at least 3 H2s with 3+ words each)
    const descriptiveH2s = $('h2').toArray().filter(el => $(el).text().trim().split(/\s+/).length >= 3).length;
    const hasDescriptiveHeadings = descriptiveH2s >= 3;

    const signals = [
      { name: 'Semantic H2 chunking (≥3 H2 sections)', pass: hasSemanticChunking, value: `${h2Count} H2s found`, tip: 'Break content into clear H2 sections — LLMs extract and summarize section by section.' },
      { name: 'Lead-with-answer pattern (≤60 words)', pass: hasLeadAnswer, value: `First para: ${firstParaWords} words`, tip: 'Open each section with a direct answer sentence before elaborating.' },
      { name: 'FAQ section present', pass: hasFaq, value: hasFaq ? 'Detected' : 'Not found', tip: 'Add an FAQ section — LLMs heavily weight Q&A structured content for featured answers.' },
      { name: 'Statistics & data citations (≥3)', pass: hasStatistics, value: `${statsMatches.length} data points found`, tip: 'Include specific numbers, percentages, and study references to signal authority.' },
      { name: 'Quotable sentences (≥5 short sentences)', pass: hasQuotable, value: `${shortSentences.length} found`, tip: 'Write punchy declarative sentences (5-20 words) that can be extracted as standalone answers.' },
      { name: 'Self-contained paragraphs (25-130 words avg)', pass: hasSelfContained, value: `Avg ${avgParaLen} words/para`, tip: 'Each paragraph should make sense on its own — LLMs may pull only one paragraph.' },
      { name: 'Table of contents', pass: hasToc, value: hasToc ? 'Detected' : 'Not found', tip: 'Add a TOC with anchor links — helps LLMs understand document structure.' },
      { name: 'Descriptive H2 headings (≥3 words each)', pass: hasDescriptiveHeadings, value: `${descriptiveH2s} descriptive H2s`, tip: 'H2 text should fully describe the section — avoid single-word headings.' },
    ];

    const passed = signals.filter(s => s.pass).length;
    const score = Math.round((passed / signals.length) * 100);
    const grade = score >= 80 ? 'AI-Ready' : score >= 55 ? 'Needs Work' : 'Not Optimized';

    res.json({ ok: true, score, grade, passed, total: signals.length, signals, wordCount });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   TECHNICAL AUDIT — canonical, HTTPS, URL slug, above-fold, image formats, mobile meta
   ========================================================================= */
router.post('/technical/audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    // HTTPS check
    const isHttps = url.startsWith('https://');

    // Canonical check
    const canonicalEl = $('link[rel="canonical"]');
    const canonicalHref = canonicalEl.attr('href') || null;
    let canonicalStatus = 'missing';
    if (canonicalHref) {
      try {
        const canon = new URL(canonicalHref, url).href;
        const pageCleaned = url.split('#')[0].split('?')[0];
        canonicalStatus = canon.startsWith(pageCleaned) ? 'self' : 'points-elsewhere';
      } catch { canonicalStatus = 'invalid'; }
    }

    // URL slug quality
    let slug = '/';
    try { slug = new URL(url).pathname; } catch {}
    const slugParts = slug.replace(/^\/|\/$/g, '').split('/').pop() || slug;
    const slugWords = slugParts.split(/[-_]/).filter(w => w && !/^\d{4,}$/.test(w) && !/^[a-f0-9]{8,}$/i.test(w));
    const slugHasDate = /\d{4}[-/]\d{2}[-/]\d{2}|\d{8}/.test(slug);
    const slugHasId = /[?&]id=|\d{6,}/.test(url);
    const slugWordCount = slugWords.length;
    const slugQuality = !slugHasDate && !slugHasId && slugWordCount >= 2 && slugWordCount <= 7 ? 'good' : 'needs-improvement';
    const slugIssues = [];
    if (slugHasDate) slugIssues.push('Contains date — dates cause freshness confusion and increase slug length');
    if (slugHasId) slugIssues.push('Contains numeric ID — use descriptive words instead');
    if (slugWordCount < 2) slugIssues.push('Slug too short — aim for 2-5 descriptive words');
    if (slugWordCount > 7) slugIssues.push('Slug too long — trim to 3-6 words max');
    if (slugParts.includes('_')) slugIssues.push('Uses underscores — use hyphens instead');

    // Above-the-fold check — large images before first substantial paragraph
    let aboveFold = 'good';
    const firstParaPos = $('p').index($('p').filter((_, el) => $(el).text().trim().split(/\s+/).length > 20).first());
    const bigImgsBeforePara = $('img').filter((_, el) => {
      const w = parseInt($(el).attr('width') || '0');
      const h = parseInt($(el).attr('height') || '0');
      return (w > 600 || h > 400) && $('img').index($(el)) < firstParaPos;
    }).length;
    if (bigImgsBeforePara > 0) aboveFold = 'large-image-before-content';

    // Image format audit
    const imgs = $('img').toArray();
    const imageAudit = {
      total: imgs.length,
      webp: 0, jpg: 0, png: 0, other: 0,
      missingLazy: 0, missingDimensions: 0, missingAlt: 0,
    };
    imgs.forEach(el => {
      const src = ($(el).attr('src') || '').toLowerCase();
      if (src.includes('.webp')) imageAudit.webp++;
      else if (src.match(/\.(jpg|jpeg)/)) imageAudit.jpg++;
      else if (src.includes('.png')) imageAudit.png++;
      else imageAudit.other++;
      if (!$(el).attr('loading')) imageAudit.missingLazy++;
      if (!$(el).attr('width') || !$(el).attr('height')) imageAudit.missingDimensions++;
      if (!$(el).attr('alt')) imageAudit.missingAlt++;
    });
    const hasWebP = imageAudit.webp > 0 || imgs.length === 0;
    const lazyOk = imageAudit.missingLazy === 0 || imgs.length === 0;
    const dimsOk = imageAudit.missingDimensions === 0 || imgs.length === 0;

    // Meta description mobile length
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaDescLen = metaDesc.length;
    const metaMobileOk = metaDescLen <= 105;
    const metaMobileTip = metaDescLen > 105 ? `${metaDescLen} chars — aim for ≤105 for mobile (currently truncated on mobile SERPs)` : metaDescLen === 0 ? 'No meta description found' : `${metaDescLen} chars — good for mobile`;

    // Score
    const checks = [isHttps, canonicalStatus === 'self', slugQuality === 'good', aboveFold === 'good', hasWebP, lazyOk, dimsOk, metaMobileOk];
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    res.json({
      ok: true, score,
      https: { pass: isHttps, tip: isHttps ? 'Page is served over HTTPS' : 'Switch to HTTPS — it is a confirmed Google ranking signal' },
      canonical: { status: canonicalStatus, href: canonicalHref, pass: canonicalStatus === 'self', tip: canonicalStatus === 'missing' ? 'Add <link rel="canonical"> to prevent duplicate content issues' : canonicalStatus === 'points-elsewhere' ? `Canonical points to ${canonicalHref} — should self-reference this page` : 'Canonical correctly self-references this page' },
      urlSlug: { slug: slugParts, wordCount: slugWordCount, quality: slugQuality, issues: slugIssues, pass: slugQuality === 'good' },
      aboveFold: { status: aboveFold, pass: aboveFold === 'good', tip: aboveFold === 'good' ? 'Content appears early — good above-the-fold experience' : 'Large image detected before first paragraph — consider moving it below or reducing size' },
      imageFormats: { ...imageAudit, webpPass: hasWebP, lazyPass: lazyOk, dimsPass: dimsOk },
      metaMobile: { length: metaDescLen, pass: metaMobileOk, tip: metaMobileTip },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   TITLE CTR SIGNALS — keyword position, emotion, power modifiers, year
   ========================================================================= */
router.post('/title/ctr-signals', (req, res) => {
  try {
    const { title = '', keyword = '' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });

    const tLower = title.toLowerCase();
    const kLower = keyword.toLowerCase().trim();

    // Keyword position
    let keywordPosition = 'not-found';
    let kwPosScore = 0;
    if (kLower && tLower.includes(kLower)) {
      const pos = tLower.indexOf(kLower);
      const thirds = Math.floor(title.length / 3);
      if (pos <= thirds) { keywordPosition = 'start'; kwPosScore = 30; }
      else if (pos <= thirds * 2) { keywordPosition = 'middle'; kwPosScore = 20; }
      else { keywordPosition = 'end'; kwPosScore = 10; }
    } else if (kLower) {
      keywordPosition = 'not-found';
      kwPosScore = 0;
    } else {
      keywordPosition = 'no-keyword';
      kwPosScore = 15;
    }

    // Year in title
    const yearMatch = title.match(/\b(202[3-9]|203\d)\b/);
    const hasYear = !!yearMatch;

    // Emotional words
    const positiveWords = ['best', 'amazing', 'ultimate', 'proven', 'powerful', 'easy', 'simple', 'effective', 'essential', 'top', 'expert', 'free', 'new', 'fast', 'quick', 'boost', 'grow', 'success', 'boost', 'winning', 'perfect'];
    const negativeWords = ['avoid', 'never', 'worst', 'stop', 'mistake', 'wrong', 'fail', 'danger', 'warning', 'bad', 'terrible'];
    const positiveFound = positiveWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(title));
    const negativeFound = negativeWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(title));
    const emotionType = positiveFound.length > negativeFound.length ? 'positive' : negativeFound.length > 0 ? 'negative' : 'neutral';
    const emotionScore = positiveFound.length >= 2 ? 20 : positiveFound.length === 1 || negativeFound.length > 0 ? 10 : 0;

    // Power modifiers
    const powerMods = ['best', 'guide', 'checklist', 'review', 'fast', 'complete', 'ultimate', 'free', 'how to', 'how-to', 'tips', 'strategies', 'ideas', 'examples', 'tutorial', 'step by step', 'beginners', 'advanced', 'experts'];
    const foundMods = powerMods.filter(m => tLower.includes(m));

    // Title length
    const titleLen = title.length;
    const titleLengthOk = titleLen >= 40 && titleLen <= 60;

    // Score
    const yearScore = hasYear ? 10 : 0;
    const modsScore = Math.min(20, foundMods.length * 7);
    const lenScore = titleLengthOk ? 20 : titleLen >= 30 && titleLen < 40 ? 10 : titleLen > 60 && titleLen <= 70 ? 10 : 0;
    const ctrScore = Math.min(100, kwPosScore + emotionScore + yearScore + modsScore + lenScore);

    const tips = [];
    if (keywordPosition === 'not-found' && kLower) tips.push(`Include "${keyword}" in your title for keyword relevance`);
    if (keywordPosition === 'end' || keywordPosition === 'middle') tips.push('Move keyword closer to the start of the title for better CTR');
    if (!hasYear) tips.push('Consider adding the current year for time-sensitive topics (e.g., "2025 Guide")');
    if (emotionType === 'neutral') tips.push('Add an emotional trigger word (best, ultimate, proven, avoid) to increase click appeal');
    if (foundMods.length === 0) tips.push('Add a power modifier like "guide", "checklist", "tips", or "how to"');
    if (!titleLengthOk) tips.push(titleLen < 40 ? 'Title is too short — aim for 50-60 characters' : 'Title exceeds 60 chars — may be truncated in SERPs');

    res.json({
      ok: true, title, keyword, ctrScore,
      keywordPosition, hasYear, yearMatch: yearMatch ? yearMatch[0] : null,
      emotionType, emotionScore, positiveWords: positiveFound, negativeWords: negativeFound,
      powerModifiers: foundMods, titleLength: titleLen, titleLengthOk,
      tips,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   ARTICLE SCHEMA VALIDATOR — check existing JSON-LD on a page
   ========================================================================= */
router.post('/article-schema/validate', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    // Extract all JSON-LD blocks
    const schemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try { schemas.push(JSON.parse($(el).html())); } catch {}
    });

    // Find Article/BlogPosting
    const articleTypes = ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'];
    let found = null;
    for (const s of schemas) {
      const arr = Array.isArray(s['@graph']) ? s['@graph'] : [s];
      found = arr.find(n => articleTypes.includes(n['@type']));
      if (found) break;
    }

    if (!found) {
      return res.json({ ok: true, found: false, type: null, fields: [], missingRequired: ['@type Article/BlogPosting', 'headline', 'image', 'datePublished', 'author', 'publisher'], missingRecommended: ['dateModified', 'description', 'author.url', 'wordCount'], score: 0, tip: 'No Article or BlogPosting JSON-LD schema found — add structured data to unlock rich results in Google.' });
    }

    const requiredFields = [
      { name: '@context', get: (s) => s['@context'], required: true, tip: 'Must be "https://schema.org"' },
      { name: '@type Article/BlogPosting', get: (s) => articleTypes.includes(s['@type']) ? s['@type'] : null, required: true, tip: 'Set @type to "BlogPosting" or "Article"' },
      { name: 'headline', get: (s) => s.headline, required: true, tip: 'headline must match or be close to the page title (max 110 chars)' },
      { name: 'image', get: (s) => s.image, required: true, tip: 'Provide image at 16:9, 4:3 and 1:1 ratios for full rich-result eligibility' },
      { name: 'datePublished', get: (s) => s.datePublished, required: true, tip: 'ISO 8601 format, e.g. 2025-01-15T09:00:00Z' },
      { name: 'dateModified', get: (s) => s.dateModified, required: false, tip: 'Update whenever content changes significantly' },
      { name: 'author', get: (s) => s.author, required: true, tip: 'author must be present' },
      { name: 'author.@type (Person/Organization)', get: (s) => s.author?.['@type'] || (Array.isArray(s.author) && s.author[0]?.['@type']), required: true, tip: 'Set author @type to "Person" or "Organization"' },
      { name: 'author.url', get: (s) => s.author?.url || (Array.isArray(s.author) && s.author[0]?.url), required: false, tip: 'Link to an author profile page to strengthen E-E-A-T signals' },
      { name: 'publisher', get: (s) => s.publisher, required: true, tip: 'publisher must include name and optionally logo' },
      { name: 'publisher.@type', get: (s) => s.publisher?.['@type'], required: false, tip: 'Set to "Organization"' },
      { name: 'description', get: (s) => s.description, required: false, tip: 'Add a summary description of the article' },
    ];

    const fieldResults = requiredFields.map(f => {
      const value = f.get(found);
      return { name: f.name, present: !!value, value: value ? (typeof value === 'object' ? JSON.stringify(value).slice(0, 80) : String(value).slice(0, 80)) : null, required: f.required, tip: f.tip };
    });

    const missingRequired = fieldResults.filter(f => f.required && !f.present).map(f => f.name);
    const missingRecommended = fieldResults.filter(f => !f.required && !f.present).map(f => f.name);
    const requiredPassed = fieldResults.filter(f => f.required && f.present).length;
    const totalRequired = fieldResults.filter(f => f.required).length;
    const score = Math.round((fieldResults.filter(f => f.present).length / fieldResults.length) * 100);

    res.json({ ok: true, found: true, type: found['@type'], fields: fieldResults, missingRequired, missingRecommended, score, requiredPassed, totalRequired });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   ADVANCED READABILITY — sentence/paragraph/transition analysis
   ========================================================================= */
router.post('/content/advanced-readability', async (req, res) => {
  try {
    const { url, content } = req.body || {};
    let html = content || '';

    if (!html && url) {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
      html = await r.text();
    }
    if (!html) return res.status(400).json({ ok: false, error: 'url or content required' });

    const $ = cheerio.load(html);
    const paras = $('p').toArray().map(el => $(el).text().trim()).filter(t => t.split(/\s+/).length > 5);
    const allText = paras.join(' ');
    const sentences = allText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 4);

    // Avg sentence length
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgSentenceLen = sentenceLengths.length ? Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length) : 0;
    const longSentences = sentenceLengths.filter(l => l > 25).length;
    const longSentencePct = sentenceLengths.length ? Math.round((longSentences / sentenceLengths.length) * 100) : 0;

    // Avg paragraph length
    const paraLengths = paras.map(p => p.split(/\s+/).length);
    const avgParaLen = paraLengths.length ? Math.round(paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length) : 0;
    const longParaCount = paraLengths.filter(l => l > 150).length;

    // Transition words
    const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'in addition', 'consequently', 'as a result', 'for example', 'for instance', 'in other words', 'in conclusion', 'first', 'second', 'third', 'finally', 'meanwhile', 'although', 'because', 'since', 'thus', 'hence', 'yet', 'but', 'also', 'next', 'then', 'lastly'];
    const lowerText = allText.toLowerCase();
    const transitionCount = transitionWords.reduce((count, tw) => {
      const re = new RegExp(`\\b${tw}\\b`, 'gi');
      return count + (lowerText.match(re) || []).length;
    }, 0);
    const transitionWordPct = sentences.length ? Math.round((transitionCount / sentences.length) * 100) : 0;

    // Passive voice estimate (rough: "was/were/been + past participle")
    const passiveMatches = allText.match(/\b(was|were|been|is|are|be)\s+\w+ed\b/gi) || [];
    const passiveVoicePct = sentences.length ? Math.round((passiveMatches.length / sentences.length) * 100) : 0;

    // Grade
    const issues = [];
    if (avgSentenceLen > 25) issues.push({ sev: 'high', msg: `Average sentence length is ${avgSentenceLen} words — aim for ≤20 words for easy reading` });
    if (longSentencePct > 25) issues.push({ sev: 'medium', msg: `${longSentencePct}% of sentences exceed 25 words — break up long sentences` });
    if (avgParaLen > 150) issues.push({ sev: 'high', msg: `Average paragraph has ${avgParaLen} words — aim for ≤100 words per paragraph` });
    if (longParaCount > 2) issues.push({ sev: 'medium', msg: `${longParaCount} paragraphs exceed 150 words — these may lose reader attention` });
    if (transitionWordPct < 20) issues.push({ sev: 'medium', msg: `Only ${transitionWordPct}% transition word ratio — Yoast recommends ≥30% for readability` });
    if (passiveVoicePct > 20) issues.push({ sev: 'low', msg: `${passiveVoicePct}% passive voice — aim for ≤10% for clearer, more engaging writing` });

    const score = Math.max(0, 100 - issues.filter(i => i.sev === 'high').length * 25 - issues.filter(i => i.sev === 'medium').length * 10 - issues.filter(i => i.sev === 'low').length * 5);
    const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

    res.json({
      ok: true, score, grade,
      avgSentenceLen, longSentences, longSentencePct,
      avgParaLen, longParaCount, paraCount: paras.length, sentenceCount: sentences.length,
      transitionWordPct, transitionCount,
      passiveVoicePct,
      issues,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   INTERNAL LINK SUGGESTIONS — AI suggests contextual internal links (2 credits)
   ========================================================================= */
router.post('/links/internal-suggestions', async (req, res) => {
  try {
    const { url, title, content, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!url && !title && !content) return res.status(400).json({ ok: false, error: 'url, title or content required' });

    const openai = getOpenAI();
    const contextInfo = [url && `URL: ${url}`, title && `Title: "${title}"`, niche && `Niche: ${niche}`].filter(Boolean).join('\n');

    const prompt = `You are an expert SEO content strategist specializing in internal linking strategy. 

For the blog post:
${contextInfo}
${content ? `\nContent excerpt:\n${content.slice(0, 1200)}` : ''}

Generate 6 specific internal link suggestions for this page. For each suggestion, provide:
1. Ideal anchor text (3-6 words, keyword-rich, describes the linked page's topic)
2. The context sentence where this link would fit naturally in the content (quote or write a sentence the blogger could insert)
3. Topic of the target page this should link to
4. Brief rationale for why this link strengthens topical authority

The suggestions should cover different subtopics to maximize topical coverage and PageRank distribution.

Respond ONLY as JSON:
{
  "suggestions": [
    {
      "anchorText": "string",
      "contextSentence": "string",
      "targetTopic": "string",
      "rationale": "string",
      "placement": "introduction|body|conclusion"
    }
  ],
  "tip": "One overall internal linking tip for this page"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
