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

/* =========================================================================
   CORE WEB VITALS — PageSpeed Insights API (LCP / CLS / FID / INP / FCP)
   ========================================================================= */
router.post('/core-web-vitals', async (req, res) => {
  try {
    const { url, strategy = 'mobile' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const apiKey = process.env.PAGESPEED_API_KEY || '';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}${apiKey ? `&key=${apiKey}` : ''}`;

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(apiUrl, { timeout: 30000 });
    if (!r.ok) return res.status(502).json({ ok: false, error: `PageSpeed API error ${r.status}` });

    const data = await r.json();
    const cats = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};
    const metrics = data.loadingExperience?.metrics || {};

    function cwvRating(metric) {
      if (!metric) return { value: null, rating: 'unknown' };
      return { value: metric.percentile, rating: metric.category?.toLowerCase().replace('_', ' ') || 'unknown', histogram: metric.distributions };
    }

    const lcp = cwvRating(metrics.LARGEST_CONTENTFUL_PAINT_MS);
    const cls = cwvRating(metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE);
    const fid = cwvRating(metrics.FIRST_INPUT_DELAY_MS);
    const inp = cwvRating(metrics.INTERACTION_TO_NEXT_PAINT);
    const fcp = cwvRating(metrics.FIRST_CONTENTFUL_PAINT_MS);

    const perfScore = Math.round((cats.performance?.score || 0) * 100);
    const accessScore = Math.round((cats.accessibility?.score || 0) * 100);
    const bestPracticesScore = Math.round((cats['best-practices']?.score || 0) * 100);
    const seoScore = Math.round((cats.seo?.score || 0) * 100);

    // Key opportunities
    const opps = [];
    const oppAudits = ['render-blocking-resources', 'unused-css-rules', 'unused-javascript', 'uses-optimized-images', 'uses-webp-images', 'uses-text-compression', 'server-response-time'];
    for (const id of oppAudits) {
      const a = audits[id];
      if (a && a.score !== null && a.score < 0.9) {
        opps.push({ id, title: a.title, description: a.description, score: Math.round((a.score || 0) * 100), displayValue: a.displayValue || '' });
      }
    }

    const overallGood = [lcp, cls, fid, inp, fcp].filter(m => m.rating === 'good').length;
    const overallRating = overallGood >= 4 ? 'Good' : overallGood >= 2 ? 'Needs Improvement' : 'Poor';

    res.json({ ok: true, url, strategy, perfScore, accessScore, bestPracticesScore, seoScore, lcp, cls, fid, inp, fcp, overallRating, opportunities: opps });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI CRAWLER ACCESS AUDIT — parse robots.txt for AI bots & all crawlers
   ========================================================================= */
router.post('/crawler-access', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const origin = new URL(url).origin;
    const robotsUrl = `${origin}/robots.txt`;
    const fetchMod = (await import('node-fetch')).default;

    let robotsTxt = '';
    try {
      const r = await fetchMod(robotsUrl, { timeout: 10000 });
      if (r.ok) robotsTxt = await r.text();
    } catch {}

    const aiCrawlers = [
      { name: 'GPTBot (ChatGPT)', agent: 'GPTBot', owner: 'OpenAI' },
      { name: 'OAI-SearchBot', agent: 'OAI-SearchBot', owner: 'OpenAI' },
      { name: 'ClaudeBot', agent: 'ClaudeBot', owner: 'Anthropic' },
      { name: 'anthropic-ai', agent: 'anthropic-ai', owner: 'Anthropic' },
      { name: 'PerplexityBot', agent: 'PerplexityBot', owner: 'Perplexity' },
      { name: 'GoogleExtended', agent: 'Google-Extended', owner: 'Google (Gemini/Bard)' },
      { name: 'Googlebot', agent: 'Googlebot', owner: 'Google Search' },
      { name: 'Bingbot', agent: 'Bingbot', owner: 'Microsoft Bing' },
      { name: 'DuckDuckBot', agent: 'DuckDuckBot', owner: 'DuckDuckGo' },
      { name: 'Amazonbot', agent: 'Amazonbot', owner: 'Amazon Alexa' },
    ];

    // Simple robots.txt parser
    function isCrawlerBlocked(txt, agentName) {
      if (!txt) return 'unknown';
      const lines = txt.split('\n').map(l => l.trim());
      let inBlock = false;
      let blocked = false;
      let allowed = false;
      for (const line of lines) {
        if (/^user-agent:/i.test(line)) {
          const agent = line.replace(/^user-agent:\s*/i, '').trim();
          inBlock = agent === '*' || agent.toLowerCase() === agentName.toLowerCase();
        }
        if (inBlock && /^disallow:\s*\//i.test(line)) {
          const path = line.replace(/^disallow:\s*/i, '').trim();
          if (path === '/' || path === '') blocked = true;
        }
        if (inBlock && /^allow:\s*\//i.test(line)) {
          allowed = true;
        }
      }
      if (blocked && !allowed) return 'blocked';
      return 'allowed';
    }

    const results = aiCrawlers.map(c => ({
      ...c,
      status: isCrawlerBlocked(robotsTxt, c.agent),
    }));

    const aiResults = results.filter(c => ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended'].includes(c.agent));
    const blockedAI = aiResults.filter(c => c.status === 'blocked');
    const aiAccessScore = Math.round(((aiResults.length - blockedAI.length) / aiResults.length) * 100);

    const issues = [];
    if (!robotsTxt) issues.push({ sev: 'medium', msg: 'Could not fetch robots.txt — ensure it exists at /robots.txt' });
    blockedAI.forEach(c => issues.push({ sev: 'high', msg: `${c.name} is blocked — this stops ${c.owner} from indexing your content for AI search` }));

    res.json({ ok: true, robotsUrl, robotsTxtFound: !!robotsTxt, results, aiAccessScore, blockedAI: blockedAI.length, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   TITLE / H1 ALIGNMENT — compare <title> vs <h1>, detect mismatch + rewrite risk
   ========================================================================= */
router.post('/title-h1-alignment', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const title = $('title').first().text().trim();
    const h1 = $('h1').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';

    // Similarity (word overlap)
    const titleWords = new Set(title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const h1Words = new Set(h1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const common = [...titleWords].filter(w => h1Words.has(w));
    const similarity = titleWords.size > 0 ? Math.round((common.length / Math.max(titleWords.size, h1Words.size)) * 100) : 0;
    const aligned = similarity >= 50;

    // Google title rewrite risk (based on Zyppy 61.6% rewrite study)
    const titleLen = title.length;
    const rewriteRisks = [];
    if (titleLen > 60) rewriteRisks.push(`Title is ${titleLen} chars — Google truncates at ~60 chars`);
    if (titleLen < 30) rewriteRisks.push(`Title is very short (${titleLen} chars) — Google may expand it`);
    if (!aligned) rewriteRisks.push('Title and H1 differ significantly — Google may prefer H1 text as title');
    if (/[|]{2,}/.test(title) || (title.match(/[\|—\-]/g) || []).length > 2) rewriteRisks.push('Title contains excessive delimiters (|, —) which triggers rewrites');
    const brandInTitle = /[\|—\-]\s*\w+$/.test(title);
    const rewriteRisk = rewriteRisks.length >= 2 ? 'High' : rewriteRisks.length === 1 ? 'Medium' : 'Low';

    // H1 audit
    const h1Count = $('h1').length;
    const h1Issues = [];
    if (h1Count === 0) h1Issues.push({ sev: 'high', msg: 'No H1 tag found — every page needs exactly one H1' });
    if (h1Count > 1) h1Issues.push({ sev: 'medium', msg: `${h1Count} H1 tags found — use only one H1 per page` });
    if (h1.length > 70) h1Issues.push({ sev: 'low', msg: `H1 is ${h1.length} chars — keep under 70 chars for clean display` });
    if (!aligned && h1 && title) h1Issues.push({ sev: 'medium', msg: 'Title and H1 don\'t share enough keywords — align them to prevent Google rewrites' });

    res.json({ ok: true, title, h1, metaDesc: metaDesc.slice(0, 200), titleLen, h1Length: h1.length, h1Count, similarity, aligned, rewriteRisk, rewriteRisks, brandInTitle, h1Issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   HEADING HIERARCHY VALIDATOR — detect H1 count, skipped levels, structure issues
   ========================================================================= */
router.post('/heading-hierarchy', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const headings = [];
    $('h1,h2,h3,h4,h5,h6').each((_, el) => {
      headings.push({ level: parseInt(el.tagName[1]), text: $(el).text().trim().slice(0, 120) });
    });

    const issues = [];
    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    headings.forEach(h => counts[`h${h.level}`]++);

    if (counts.h1 === 0) issues.push({ sev: 'high', msg: 'Missing H1 tag — every page must have exactly one H1' });
    if (counts.h1 > 1) issues.push({ sev: 'high', msg: `${counts.h1} H1 tags found — use only one H1 (the page title)` });

    // Detect skipped levels
    let prevLevel = 1;
    for (const h of headings) {
      if (h.level > prevLevel + 1) {
        issues.push({ sev: 'medium', msg: `Heading jump: H${prevLevel} → H${h.level} detected at "${h.text.slice(0, 40)}" — don't skip heading levels` });
      }
      prevLevel = h.level;
    }

    if (counts.h2 === 0 && headings.length > 1) issues.push({ sev: 'medium', msg: 'No H2 tags found — use H2s as main section headers to structure long content' });

    // Empty headings
    const emptyHeadings = headings.filter(h => !h.text.trim());
    if (emptyHeadings.length > 0) issues.push({ sev: 'high', msg: `${emptyHeadings.length} empty heading tag(s) found — remove or fill them` });

    const score = Math.max(0, 100 - issues.filter(i => i.sev === 'high').length * 30 - issues.filter(i => i.sev === 'medium').length * 15);
    res.json({ ok: true, headings, counts, issues, score, totalHeadings: headings.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   IMAGE SEO AUDIT — alt text, file names, lazy loading, count
   ========================================================================= */
router.post('/image-seo', async (req, res) => {
  try {
    const { url, keyword = '' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const images = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt');
      const loading = $(el).attr('loading');
      const width = $(el).attr('width');
      const height = $(el).attr('height');
      const filename = src.split('/').pop().split('?')[0];
      const hasAlt = alt !== undefined;
      const altEmpty = hasAlt && alt.trim() === '';
      const genericFilename = /^(image|img|photo|pic|dsc|screenshot|untitled|download)[\d_-]*/i.test(filename);
      const hasKeyword = keyword && (alt || '').toLowerCase().includes(keyword.toLowerCase());
      images.push({ src: src.slice(0, 120), alt: alt || null, hasAlt, altEmpty, loading: loading || 'eager', width, height, filename, genericFilename, hasKeyword });
    });

    const missing = images.filter(i => !i.hasAlt);
    const empty = images.filter(i => i.altEmpty);
    const noLazy = images.filter(i => i.loading !== 'lazy');
    const generic = images.filter(i => i.genericFilename);
    const noSize = images.filter(i => !i.width || !i.height);

    const issues = [];
    if (missing.length > 0) issues.push({ sev: 'high', msg: `${missing.length} image(s) missing alt attribute — required for accessibility and image SEO` });
    if (empty.length > 0) issues.push({ sev: 'high', msg: `${empty.length} image(s) have empty alt text — add descriptive alt text (unless purely decorative)` });
    if (generic.length > 0) issues.push({ sev: 'medium', msg: `${generic.length} image(s) have generic filenames (img123.jpg) — use descriptive names like "keyword-related-topic.jpg"` });
    if (noLazy.length > 3) issues.push({ sev: 'medium', msg: `${noLazy.length} images don't have loading="lazy" — add lazy loading to improve page speed` });
    if (noSize.length > 0) issues.push({ sev: 'low', msg: `${noSize.length} image(s) missing width/height attributes — specify dimensions to prevent layout shifts (CLS)` });

    const altScore = images.length > 0 ? Math.round(((images.length - missing.length - empty.length) / images.length) * 100) : 100;
    const grade = altScore >= 90 ? 'Excellent' : altScore >= 70 ? 'Good' : altScore >= 50 ? 'Fair' : 'Poor';

    res.json({ ok: true, totalImages: images.length, missing: missing.length, emptyAlt: empty.length, noLazy: noLazy.length, genericFilenames: generic.length, noSize: noSize.length, altScore, grade, issues, images: images.slice(0, 30) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SEMANTIC HTML CHECKER — detect proper usage of semantic elements
   ========================================================================= */
router.post('/semantic-html', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const checks = [
      { tag: 'article', label: 'Article element', importance: 'high', desc: 'Wraps the main blog post content — helps crawlers identify primary content' },
      { tag: 'main', label: 'Main element', importance: 'high', desc: 'Identifies the main content area — improves crawler understanding' },
      { tag: 'header', label: 'Header element', importance: 'medium', desc: 'Site/page header landmark' },
      { tag: 'nav', label: 'Nav element', importance: 'medium', desc: 'Navigation links for internal link discovery' },
      { tag: 'footer', label: 'Footer element', importance: 'low', desc: 'Page footer with supplementary content' },
      { tag: 'aside', label: 'Aside element', importance: 'low', desc: 'Sidebar or callout content' },
      { tag: 'figure', label: 'Figure/figcaption', importance: 'low', desc: 'Semantic image with caption — helps image SEO' },
      { tag: 'time', label: 'Time element', importance: 'medium', desc: 'Machine-readable publish date — important for freshness signals' },
      { tag: 'address', label: 'Address/author', importance: 'low', desc: 'Author contact info — E-E-A-T signal' },
    ];

    const results = checks.map(c => ({
      ...c,
      found: $(c.tag).length > 0,
      count: $(c.tag).length,
    }));

    const passed = results.filter(r => r.found);
    const failed = results.filter(r => !r.found && r.importance !== 'low');
    const score = Math.round((passed.length / results.length) * 100);

    const issues = failed.map(f => ({ sev: f.importance === 'high' ? 'high' : 'medium', msg: `Missing <${f.tag}> element — ${f.desc}` }));

    res.json({ ok: true, results, passed: passed.length, total: results.length, score, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   META DESCRIPTION AUDIT — length, keyword, CTA, uniqueness signals
   ========================================================================= */
router.post('/meta-description-audit', async (req, res) => {
  try {
    const { url, keyword = '' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const title = $('title').first().text().trim();

    const len = metaDesc.length;
    const hasKeyword = keyword ? metaDesc.toLowerCase().includes(keyword.toLowerCase()) : null;
    const ctaWords = ['learn', 'discover', 'find out', 'get', 'read', 'see', 'explore', 'try', 'start'];
    const hasCTA = ctaWords.some(w => metaDesc.toLowerCase().includes(w));

    const issues = [];
    if (!metaDesc) issues.push({ sev: 'high', msg: 'No meta description found — write a compelling 140-160 char description to improve CTR' });
    else if (len < 70) issues.push({ sev: 'high', msg: `Meta description is very short (${len} chars) — aim for 140-160 chars` });
    else if (len > 160) issues.push({ sev: 'medium', msg: `Meta description is ${len} chars — Google truncates at ~160 chars` });
    if (metaDesc && !hasKeyword && keyword) issues.push({ sev: 'medium', msg: `Target keyword "${keyword}" not in meta description — include it as Google bolds keywords in snippets` });
    if (metaDesc && !hasCTA) issues.push({ sev: 'low', msg: 'No action word detected in meta description — add a CTA like "Learn", "Discover", or "Find out"' });
    if (!ogDesc) issues.push({ sev: 'low', msg: 'No og:description tag — add one for better social media sharing appearance' });

    const score = Math.max(0, 100 - issues.filter(i => i.sev === 'high').length * 35 - issues.filter(i => i.sev === 'medium').length * 15 - issues.filter(i => i.sev === 'low').length * 5);
    res.json({ ok: true, metaDesc, ogDesc, title, len, hasKeyword, hasCTA, issues, score });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   KEYWORD DENSITY MAP — distribution of keyword across page sections
   ========================================================================= */
router.post('/keyword-density', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    $('script,style,nav,footer,header').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const words = bodyText.split(/\s+/);
    const kLower = keyword.toLowerCase();
    const re = new RegExp(`\\b${kLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

    const allMatches = bodyText.match(re) || [];
    const density = words.length > 0 ? ((allMatches.length / words.length) * 100).toFixed(2) : '0.00';

    // Section-level analysis
    const sections = [];
    $('h1,h2,h3,h4').each((_, el) => {
      const headText = $(el).text().trim();
      const nextSibs = [];
      let sib = $(el).next()[0];
      while (sib && !/^h[1-4]$/i.test(sib.tagName)) {
        nextSibs.push($(sib).text());
        sib = $(sib).next()[0];
      }
      const sectionText = nextSibs.join(' ');
      const sectionWords = sectionText.split(/\s+/).filter(Boolean);
      const sectionMatches = (sectionText.match(re) || []).length;
      const sectionDensity = sectionWords.length > 0 ? ((sectionMatches / sectionWords.length) * 100).toFixed(2) : '0.00';
      sections.push({ heading: headText.slice(0, 80), wordCount: sectionWords.length, keyword: sectionMatches, density: parseFloat(sectionDensity), inHeading: headText.toLowerCase().includes(kLower) });
    });

    const issues = [];
    const d = parseFloat(density);
    if (d > 4) issues.push({ sev: 'high', msg: `Keyword density is ${density}% — over 4% looks like keyword stuffing to Google` });
    if (d < 0.5 && allMatches.length > 0) issues.push({ sev: 'medium', msg: `Keyword density is only ${density}% — try to include it more naturally throughout the content` });
    if (allMatches.length === 0) issues.push({ sev: 'high', msg: `Keyword "${keyword}" not found on the page at all` });

    res.json({ ok: true, keyword, totalWords: words.length, totalMatches: allMatches.length, density: parseFloat(density), sections, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   NOINDEX / NOFOLLOW AUDITOR — detect crawl/index directives
   ========================================================================= */
router.post('/index-directives', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const headers = Object.fromEntries(r.headers.entries());
    const $ = cheerio.load(html);

    // Meta robots tags
    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    const metaGooglebot = $('meta[name="googlebot"]').attr('content') || '';
    const xRobotsHeader = headers['x-robots-tag'] || '';
    const canonicalTag = $('link[rel="canonical"]').attr('href') || '';

    const allDirectives = [metaRobots, metaGooglebot, xRobotsHeader].join(',').toLowerCase();
    const hasNoindex = allDirectives.includes('noindex');
    const hasNofollow = allDirectives.includes('nofollow');
    const hasNocache = allDirectives.includes('noarchive') || allDirectives.includes('nocache');
    const hasNosnippet = allDirectives.includes('nosnippet');

    const issues = [];
    if (hasNoindex) issues.push({ sev: 'high', msg: 'Page has noindex directive — Google will NOT index this page. Remove if this is a live blog post' });
    if (hasNofollow) issues.push({ sev: 'medium', msg: 'Page has nofollow directive — links on this page will not pass PageRank' });
    if (hasNosnippet) issues.push({ sev: 'medium', msg: 'Page has nosnippet — Google cannot show a text snippet, reducing CTR' });
    if (!canonicalTag) issues.push({ sev: 'low', msg: 'No canonical tag found — add a self-referential canonical to prevent duplicate content issues' });
    if (canonicalTag && canonicalTag !== url && !url.endsWith('/') && canonicalTag !== url + '/') {
      issues.push({ sev: 'medium', msg: `Canonical points to different URL: ${canonicalTag} — verify this is intentional` });
    }

    res.json({ ok: true, metaRobots, metaGooglebot, xRobotsHeader, canonicalTag, hasNoindex, hasNofollow, hasNocache, hasNosnippet, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   CONTENT STRUCTURE SCORE — lists, tables, bullets, images vs prose ratio
   ========================================================================= */
router.post('/content-structure', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    $('script,style,nav,footer,header').remove();

    const ulCount = $('ul').length;
    const olCount = $('ol').length;
    const liCount = $('li').length;
    const tableCount = $('table').length;
    const imgCount = $('img').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const blockquoteCount = $('blockquote').length;
    const codeCount = $('pre,code').length;
    const boldCount = $('strong,b').length;
    const tocPresent = !!($('*').filter((_, el) => /table.of.contents|toc|jump.to/i.test($(el).text())).length > 0 && $('ul a[href^="#"]').length > 2);

    const allText = $('body').text().replace(/\s+/g, ' ');
    const wordCount = allText.split(/\s+/).filter(Boolean).length;

    const structuredElements = ulCount + olCount + tableCount;
    const structureRatio = wordCount > 0 ? ((structuredElements / (wordCount / 100)) * 10).toFixed(1) : '0';
    const score = Math.min(100,
      (ulCount > 0 ? 15 : 0) +
      (olCount > 0 ? 15 : 0) +
      (tableCount > 0 ? 10 : 0) +
      (imgCount >= 2 ? 10 : imgCount === 1 ? 5 : 0) +
      (h2Count >= 3 ? 15 : h2Count >= 1 ? 8 : 0) +
      (h3Count >= 2 ? 10 : 0) +
      (boldCount >= 3 ? 10 : 0) +
      (blockquoteCount > 0 ? 5 : 0) +
      (codeCount > 0 ? 5 : 0) +
      (tocPresent ? 5 : 0)
    );

    const issues = [];
    if (ulCount + olCount === 0) issues.push({ sev: 'medium', msg: 'No lists found — use bullet/numbered lists to break up content and improve readability' });
    if (h2Count < 2) issues.push({ sev: 'medium', msg: `Only ${h2Count} H2 tag(s) — add more section headers (H2s) for long-form content` });
    if (imgCount === 0) issues.push({ sev: 'medium', msg: 'No images found — add relevant images to improve engagement and image search visibility' });
    if (!tocPresent && wordCount > 1500) issues.push({ sev: 'low', msg: 'No table of contents detected for long article — add a ToC to improve navigation and sitelinks' });

    const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
    res.json({ ok: true, score, grade, wordCount, ulCount, olCount, liCount, tableCount, imgCount, h2Count, h3Count, blockquoteCount, codeCount, boldCount, tocPresent, structureRatio: parseFloat(structureRatio), issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AUTHOR AUTHORITY CHECKER — detect author signals for E-E-A-T
   ========================================================================= */
router.post('/author-authority', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    // Find author signals
    const authorMeta = $('meta[name="author"]').attr('content') || '';
    const authorSchemaEl = $('script[type="application/ld+json"]').map((_, el) => {
      try { return JSON.parse($(el).html()); } catch { return null; }
    }).get().find(s => s && (s['@type'] === 'Person' || s?.author));

    const authorFromSchema = authorSchemaEl?.author?.name || authorSchemaEl?.name || '';
    const authorByline = (() => {
      const sel = $('[class*="author"],[rel="author"],[itemprop="author"],#author,.byline');
      return sel.first().text().trim().slice(0, 100);
    })();

    const authorName = authorMeta || authorFromSchema || authorByline;
    const hasAuthorBio = $('[class*="author-bio"],[class*="author_bio"],[class*="author-description"]').length > 0;
    const hasAuthorLink = $('a[rel="author"],a[href*="/author/"]').length > 0;
    const hasDatePublished = !!($('time[datetime]').length > 0 || $('meta[property="article:published_time"]').attr('content'));
    const hasDateModified = !!$('meta[property="article:modified_time"]').attr('content');
    const publishedDate = $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').first().attr('datetime') || '';

    const issues = [];
    if (!authorName) issues.push({ sev: 'high', msg: 'No author name detected — add author attribution for E-E-A-T signals (YMYL content especially)' });
    if (!hasAuthorBio) issues.push({ sev: 'medium', msg: 'No author bio section detected — add a bio with credentials to improve E-E-A-T' });
    if (!hasAuthorLink) issues.push({ sev: 'low', msg: 'No author profile link found — link to author page with more posts and credentials' });
    if (!hasDatePublished) issues.push({ sev: 'medium', msg: 'No publish date detected — add article:published_time meta tag for freshness signals' });
    if (!hasDateModified) issues.push({ sev: 'low', msg: 'No modified date found — add article:modified_time when you update posts' });

    const score = Math.max(0, 100 - issues.filter(i => i.sev === 'high').length * 35 - issues.filter(i => i.sev === 'medium').length * 15 - issues.filter(i => i.sev === 'low').length * 5);
    res.json({ ok: true, authorName, authorMeta, authorFromSchema, authorByline, hasAuthorBio, hasAuthorLink, hasDatePublished, hasDateModified, publishedDate, issues, score });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   XML SITEMAP DETECTOR — find & validate sitemap, check if URL is included
   ========================================================================= */
router.post('/sitemap-check', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const origin = new URL(url).origin;
    const fetchMod = (await import('node-fetch')).default;
    const sitemapUrls = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/blog-sitemap.xml`];

    let sitemapFound = null;
    let sitemapContent = '';
    for (const su of sitemapUrls) {
      try {
        const sr = await fetchMod(su, { timeout: 8000 });
        if (sr.ok && sr.headers.get('content-type')?.includes('xml') || sr.ok) {
          const text = await sr.text();
          if (text.includes('<?xml') || text.includes('<urlset') || text.includes('<sitemapindex')) {
            sitemapFound = su;
            sitemapContent = text;
            break;
          }
        }
      } catch {}
    }

    // Check robots.txt for Sitemap: directive
    let sitemapFromRobots = '';
    try {
      const rr = await fetchMod(`${origin}/robots.txt`, { timeout: 8000 });
      if (rr.ok) {
        const rtxt = await rr.text();
        const match = rtxt.match(/^sitemap:\s*(.+)$/im);
        if (match) sitemapFromRobots = match[1].trim();
      }
    } catch {}

    const urlInSitemap = sitemapContent ? sitemapContent.includes(url) || sitemapContent.includes(url.replace(/\/$/, '')) : null;
    const urlCount = sitemapContent ? (sitemapContent.match(/<url>/g) || []).length : 0;

    const issues = [];
    if (!sitemapFound && !sitemapFromRobots) issues.push({ sev: 'high', msg: 'No XML sitemap found at /sitemap.xml — create and submit a sitemap to Google Search Console' });
    if (sitemapFound && urlInSitemap === false) issues.push({ sev: 'high', msg: 'This URL is NOT included in the sitemap — add it so Google can discover and index it' });
    if (!sitemapFromRobots) issues.push({ sev: 'low', msg: 'Sitemap URL not declared in robots.txt — add "Sitemap: <url>" to robots.txt' });

    res.json({ ok: true, sitemapFound: sitemapFound || sitemapFromRobots, sitemapFromRobots, urlInSitemap, urlCount, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   OPEN GRAPH VALIDATOR — check OG tags completeness & image validity
   ========================================================================= */
router.post('/og-validator', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const og = {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      imageWidth: $('meta[property="og:image:width"]').attr('content') || '',
      imageHeight: $('meta[property="og:image:height"]').attr('content') || '',
      type: $('meta[property="og:type"]').attr('content') || '',
      url: $('meta[property="og:url"]').attr('content') || '',
      siteName: $('meta[property="og:site_name"]').attr('content') || '',
    };
    const twitter = {
      card: $('meta[name="twitter:card"]').attr('content') || '',
      title: $('meta[name="twitter:title"]').attr('content') || '',
      description: $('meta[name="twitter:description"]').attr('content') || '',
      image: $('meta[name="twitter:image"]').attr('content') || '',
    };

    // Validate OG image
    let ogImageValid = null;
    if (og.image) {
      try {
        const imgR = await fetchMod(og.image, { method: 'HEAD', timeout: 8000 });
        ogImageValid = imgR.ok;
      } catch { ogImageValid = false; }
    }

    const issues = [];
    if (!og.title) issues.push({ sev: 'high', msg: 'Missing og:title — required for proper social sharing previews' });
    if (!og.description) issues.push({ sev: 'high', msg: 'Missing og:description — required for rich social previews' });
    if (!og.image) issues.push({ sev: 'high', msg: 'Missing og:image — pages without OG images get minimal social engagement' });
    if (og.image && ogImageValid === false) issues.push({ sev: 'high', msg: 'og:image URL returned an error — fix the image URL' });
    if (og.image && (!og.imageWidth || !og.imageHeight)) issues.push({ sev: 'medium', msg: 'Missing og:image:width/height — recommended 1200×630px for best display' });
    if (!og.type) issues.push({ sev: 'low', msg: 'Missing og:type — set to "article" for blog posts' });
    if (!twitter.card) issues.push({ sev: 'medium', msg: 'Missing twitter:card tag — set to "summary_large_image" for full-width previews' });

    const score = Math.max(0, 100 - issues.filter(i => i.sev === 'high').length * 25 - issues.filter(i => i.sev === 'medium').length * 10 - issues.filter(i => i.sev === 'low').length * 5);
    res.json({ ok: true, og, twitter, ogImageValid, issues, score });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   BREADCRUMB SCHEMA GENERATOR — generate BreadcrumbList JSON-LD from URL path
   ========================================================================= */
router.post('/schema/breadcrumb', async (req, res) => {
  try {
    const { url, siteUrl, labels } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const parsed = new URL(url);
    const origin = siteUrl || parsed.origin;
    const segments = parsed.pathname.split('/').filter(Boolean);

    // Build breadcrumb items
    const labelsArr = labels && Array.isArray(labels) ? labels : [];
    const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin }];
    let pathAccum = origin;
    segments.forEach((seg, i) => {
      pathAccum += '/' + seg;
      const name = labelsArr[i] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      items.push({ '@type': 'ListItem', position: i + 2, name, item: pathAccum });
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items,
    };

    res.json({ ok: true, schema, items, jsonLd: JSON.stringify(schema, null, 2) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   HOWTO SCHEMA GENERATOR — AI-powered HowTo JSON-LD
   ========================================================================= */
router.post('/schema/howto', async (req, res) => {
  try {
    const { title, description, steps, totalTime, model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });

    const openai = getOpenAI();
    const prompt = `Generate a HowTo schema.org JSON-LD for a blog post.

Title: "${title}"
${description ? `Description: "${description}"` : ''}
${steps ? `Steps provided: ${JSON.stringify(steps)}` : 'Generate 4-6 logical steps based on the title.'}
${totalTime ? `Total time: ${totalTime}` : ''}

Return ONLY valid JSON-LD (no markdown), using schema.org HowTo. Include:
- @context, @type: "HowTo"
- name, description
- totalTime in ISO 8601 duration format (e.g. PT30M)
- step array with @type: HowToStep, name, text for each step
- estimatedCost if applicable`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }] });
    let raw = resp.choices[0].message.content.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
    const parsed = JSON.parse(raw);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, schema: parsed, jsonLd: JSON.stringify(parsed, null, 2) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   VIDEO SCHEMA GENERATOR — detect video embeds and auto-generate VideoObject
   ========================================================================= */
router.post('/schema/video', async (req, res) => {
  try {
    const { url, name, description, uploadDate, thumbnailUrl, duration } = req.body || {};
    if (!url && !name) return res.status(400).json({ ok: false, error: 'url or name required' });

    let detectedVideos = [];
    if (url) {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const html = await r.text();
      const $ = cheerio.load(html);

      $('iframe[src*="youtube"],iframe[src*="vimeo"],video').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        const ytMatch = src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
        const vimeoMatch = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (ytMatch) detectedVideos.push({ platform: 'YouTube', id: ytMatch[1], embedUrl: src, contentUrl: `https://www.youtube.com/watch?v=${ytMatch[1]}`, thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg` });
        if (vimeoMatch) detectedVideos.push({ platform: 'Vimeo', id: vimeoMatch[1], embedUrl: src, contentUrl: `https://vimeo.com/${vimeoMatch[1]}` });
      });
    }

    const v = detectedVideos[0] || {};
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': name || 'Video',
      'description': description || 'Video description',
      'uploadDate': uploadDate || new Date().toISOString().split('T')[0],
      'thumbnailUrl': thumbnailUrl || v.thumbnailUrl || '',
      ...(duration && { 'duration': duration }),
      ...(v.embedUrl && { 'embedUrl': v.embedUrl }),
      ...(v.contentUrl && { 'contentUrl': v.contentUrl }),
    };

    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), detectedVideos });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   REVIEW SCHEMA GENERATOR — generate Review / AggregateRating JSON-LD
   ========================================================================= */
router.post('/schema/review', async (req, res) => {
  try {
    const { itemName, itemType = 'Product', reviewBody, ratingValue, bestRating = 5, worstRating = 1, authorName, reviewCount } = req.body || {};
    if (!itemName) return res.status(400).json({ ok: false, error: 'itemName required' });

    const schema = {
      '@context': 'https://schema.org',
      '@type': reviewCount ? 'AggregateRating' : 'Review',
      'itemReviewed': { '@type': itemType, 'name': itemName },
      ...(reviewCount ? {
        'ratingValue': ratingValue || 4.5,
        'bestRating': bestRating,
        'worstRating': worstRating,
        'reviewCount': reviewCount,
      } : {
        'reviewBody': reviewBody || '',
        'reviewRating': { '@type': 'Rating', 'ratingValue': ratingValue || 5, 'bestRating': bestRating, 'worstRating': worstRating },
        'author': { '@type': 'Person', 'name': authorName || 'Author' },
        'datePublished': new Date().toISOString().split('T')[0],
      }),
    };

    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   ORGANIZATION SCHEMA GENERATOR — Publisher / Organization JSON-LD
   ========================================================================= */
router.post('/schema/organization', async (req, res) => {
  try {
    const { name, url, logo, description, email, phone, sameAs } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': name,
      ...(url && { 'url': url }),
      ...(logo && { 'logo': { '@type': 'ImageObject', 'url': logo } }),
      ...(description && { 'description': description }),
      ...(email && { 'email': email }),
      ...(phone && { 'telephone': phone }),
      ...(sameAs && Array.isArray(sameAs) && { 'sameAs': sameAs }),
    };

    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SPEAKABLE SCHEMA GENERATOR — mark speakable content for voice search
   ========================================================================= */
router.post('/schema/speakable', async (req, res) => {
  try {
    const { url, cssSelectors } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    // Auto-detect speakable sections: first H1 + first H2 summary paragraphs
    const pageTitle = $('title').first().text().trim();
    const h1 = $('h1').first().text().trim();
    const firstPara = $('article p, .post-content p, main p').first().text().trim().slice(0, 300);

    const selectors = cssSelectors || ['h1', 'h2:first-of-type', 'article p:first-of-type'];
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': pageTitle || h1,
      'speakable': { '@type': 'SpeakableSpecification', 'cssSelector': selectors },
      'url': url,
    };

    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), detectedTitle: h1, firstParagraph: firstPara, cssSelectors: selectors });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SEARCH INTENT CLASSIFIER — AI determines intent type & content match
   ========================================================================= */
router.post('/intent-classifier', async (req, res) => {
  try {
    const { url, keyword, title, excerpt, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword && !url) return res.status(400).json({ ok: false, error: 'keyword or url required' });

    let pageTitle = title || '';
    let pageExcerpt = excerpt || '';
    if (url && !title) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const html = await r.text();
        const $ = cheerio.load(html);
        pageTitle = $('title').first().text().trim().slice(0, 120);
        pageExcerpt = $('meta[name="description"]').attr('content') || $('article p').first().text().trim().slice(0, 300);
      } catch {}
    }

    const openai = getOpenAI();
    const prompt = `Analyze the search intent for:
Keyword: "${keyword || ''}"
Page Title: "${pageTitle}"
Content excerpt: "${pageExcerpt.slice(0, 400)}"

Classify the intent as one or more of:
- Informational (user wants to learn)
- Navigational (user wants a specific site)
- Commercial (user is researching before buying)
- Transactional (user wants to buy/act now)

Also determine if the page MATCHES the likely intent for this keyword.

Respond as JSON ONLY:
{
  "primaryIntent": "informational|navigational|commercial|transactional",
  "intentBreakdown": { "informational": 0-100, "navigational": 0-100, "commercial": 0-100, "transactional": 0-100 },
  "pageMatchesIntent": true|false,
  "matchScore": 0-100,
  "explanation": "brief explanation",
  "recommendation": "what to change if mismatch, else what's working"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, pageTitle, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI OVERVIEW ELIGIBILITY — assess if content qualifies for AIO
   ========================================================================= */
router.post('/ai-overview-eligibility', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    $('script,style,nav,footer').remove();
    const title = $('title').first().text().trim();
    const h1 = $('h1').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const firstPara = $('article p, main p, .content p').first().text().trim();
    const allText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = allText.split(/\s+/).length;
    const hasList = $('ul,ol').length > 0;
    const hasTable = $('table').length > 0;
    const hasDefinition = /is a |is an |defined as |refers to |means that /i.test(firstPara);
    const hasSteps = $('ol').length > 0 || /step \d|^\d+\./im.test(allText.slice(0, 2000));

    const openai = getOpenAI();
    const prompt = `Assess whether this blog post is likely to appear in Google's AI Overviews (AIO) / AI search results.

Title: "${title}"
H1: "${h1}"
Meta description: "${metaDesc}"
First paragraph: "${firstPara.slice(0, 400)}"
Word count: ${wordCount}
Has lists: ${hasList}, Has tables: ${hasTable}, Has definition: ${hasDefinition}, Has steps: ${hasSteps}

AI Overviews favor:
- Content with clear, direct answers in first 100 words
- Declarative sentences like "X is Y because Z"
- Numbered steps for how-to queries
- Tables for comparisons
- Covering the exact match query comprehensively
- Authoritative factual content without fluff

Score the eligibility 0-100 and provide specific improvements.

Return JSON ONLY:
{
  "aioScore": 0-100,
  "eligibilityLevel": "High|Medium|Low",
  "strengths": ["..."],
  "improvements": ["specific sentence to add or change"],
  "optimalFormat": "what format type would maximize AIO chances",
  "directAnswerPresent": true|false
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, title, wordCount, hasList, hasTable, hasDefinition, hasSteps, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   TOPICAL AUTHORITY MAPPER — AI scores how deeply article covers subtopics
   ========================================================================= */
router.post('/topical-authority', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    $('script,style,nav,footer').remove();
    const title = $('title').first().text().trim();
    const headings = [];
    $('h1,h2,h3').each((_, el) => headings.push(`${el.tagName.toUpperCase()}: ${$(el).text().trim()}`));
    const allText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

    const openai = getOpenAI();
    const prompt = `Analyze topical authority for a blog post targeting keyword: "${keyword}"

Page title: "${title}"
Headings structure:
${headings.slice(0, 20).join('\n')}

Content excerpt: ${allText.slice(0, 2000)}

Identify:
1. The 8-10 most important subtopics/aspects that an authoritative article on "${keyword}" should cover
2. Which of those the article covers (fully, partially, or misses)
3. An overall topical authority score 0-100
4. The top 3 content gaps to fill

Respond as JSON ONLY:
{
  "topicalScore": 0-100,
  "grade": "A|B|C|D|F",
  "subtopics": [{ "topic": "string", "coverage": "full|partial|missing", "notes": "string" }],
  "gaps": ["specific subtopic to add"],
  "topicalDepth": "Comprehensive|Adequate|Shallow|Thin",
  "recommendation": "overall recommendation"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, title, headingCount: headings.length, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   META DESCRIPTION AI OPTIMIZER — AI rewrites meta description for CTR
   ========================================================================= */
router.post('/meta-description-optimizer', async (req, res) => {
  try {
    const { url, keyword, currentMeta, model = 'gpt-4o-mini' } = req.body || {};
    if (!url && !currentMeta) return res.status(400).json({ ok: false, error: 'url or currentMeta required' });

    let metaDesc = currentMeta || '';
    let pageTitle = '';
    if (url && !currentMeta) {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
      const html = await r.text();
      const $ = cheerio.load(html);
      metaDesc = $('meta[name="description"]').attr('content') || '';
      pageTitle = $('title').first().text().trim();
    }

    const openai = getOpenAI();
    const prompt = `You are a CTR optimization expert. Improve or write a meta description for a blog post.

Page title: "${pageTitle || 'Blog post'}"
Current meta description: "${metaDesc || 'None'}"
Target keyword: "${keyword || 'general'}"

Write 3 alternative meta descriptions that:
- Are 140-155 characters each (count carefully)
- Include the keyword naturally
- Have an active voice CTA (Learn, Discover, Find out, Get, See)
- Create curiosity or highlight unique value
- Match the searcher's intent
- Avoid clickbait

Return JSON ONLY:
{
  "original": "${metaDesc}",
  "variants": [
    { "text": "string", "length": number, "ctrFactors": ["keyword present", "has CTA", ...] }
  ],
  "bestVariant": 0,
  "tips": ["specific tip about what made these better"]
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, pageTitle, currentMeta: metaDesc, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   CONTENT DECAY PREDICTOR — AI estimates content freshness & update urgency
   ========================================================================= */
router.post('/content-decay', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const title = $('title').first().text().trim();
    const publishedDate = $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').first().attr('datetime') || '';
    const modifiedDate = $('meta[property="article:modified_time"]').attr('content') || '';
    const yearMentions = [];
    const bodyText = $('body').text();
    const yearRe = /\b(20[1-4]\d)\b/g;
    let m;
    while ((m = yearRe.exec(bodyText)) !== null) yearMentions.push(parseInt(m[1]));
    const oldestYear = yearMentions.length ? Math.min(...yearMentions) : null;
    const newestYear = yearMentions.length ? Math.max(...yearMentions) : null;

    const daysSincePublish = publishedDate ? Math.floor((Date.now() - new Date(publishedDate).getTime()) / 86400000) : null;
    const daysSinceUpdate = modifiedDate ? Math.floor((Date.now() - new Date(modifiedDate).getTime()) / 86400000) : null;

    const openai = getOpenAI();
    const prompt = `Analyze content decay for this blog post and estimate how urgently it needs updating.

Title: "${title}"
Target keyword: "${keyword || 'not specified'}"
Published: ${publishedDate || 'unknown'}
Last modified: ${modifiedDate || 'unknown'}
Days since publish: ${daysSincePublish || 'unknown'}
Oldest year mentioned in content: ${oldestYear || 'none'}
Newest year mentioned: ${newestYear || 'none'}

Consider:
- Is this topic time-sensitive or evergreen?
- How quickly does info in this niche become outdated?
- Year references that may now be stale
- Whether "2024/2025" style content needs annual refresh

Return JSON ONLY:
{
  "decayScore": 0-100,
  "urgency": "Immediate|Soon|Eventually|Evergreen",
  "contentType": "time-sensitive|news|evergreen|annual",
  "estimatedHalfLife": "string (e.g. '6 months', '3 years')",
  "staleElements": ["list of content likely to be outdated"],
  "updatePriority": "High|Medium|Low",
  "recommendation": "specific update recommendation"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, title, publishedDate, modifiedDate, daysSincePublish, daysSinceUpdate, oldestYear, newestYear, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   COMPETITOR GAP ANALYSIS — AI identifies topics competitors cover that you missed
   ========================================================================= */
router.post('/competitor-gap', async (req, res) => {
  try {
    const { url, keyword, competitorUrls, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });

    const fetchMod = (await import('node-fetch')).default;

    async function fetchHeadings(pageUrl) {
      try {
        const r = await fetchMod(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const html = await r.text();
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        const title = $('title').first().text().trim();
        const headings = [];
        $('h1,h2,h3').each((_, el) => headings.push($(el).text().trim()));
        return { url: pageUrl, title, headings: headings.slice(0, 15) };
      } catch { return { url: pageUrl, error: 'failed' }; }
    }

    const [myPage, ...competitorPages] = await Promise.all([
      url ? fetchHeadings(url) : Promise.resolve({ url, headings: [] }),
      ...(competitorUrls || []).slice(0, 3).map(u => fetchHeadings(u)),
    ]);

    const openai = getOpenAI();
    const prompt = `Perform a content gap analysis for the keyword: "${keyword}"

MY ARTICLE:
${myPage?.title || url}
Headings: ${(myPage?.headings || []).join(' | ')}

COMPETITORS:
${competitorPages.map((c, i) => `Competitor ${i + 1}: ${c.title || c.url}\nHeadings: ${(c.headings || []).join(' | ')}`).join('\n\n')}

Identify:
1. Topics that 2+ competitors cover but my article misses
2. Unique angles my article has that competitors lack
3. Quick wins (easy sections to add)

Return JSON ONLY:
{
  "gaps": [{ "topic": "string", "howManyCompetitorsCover": number, "addPriority": "High|Medium|Low", "suggestedHeading": "string" }],
  "myUniqueAngles": ["string"],
  "quickWins": ["specific H2/H3 to add"],
  "overallGapScore": 0-100,
  "summary": "1-2 sentence summary"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, myPage, competitorPages, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   KEYWORD CANNIBALIZATION DETECTOR — check if multiple URLs target same keyword
   ========================================================================= */
router.post('/cannibalization', async (req, res) => {
  try {
    const { keyword, urls } = req.body || {};
    if (!keyword || !urls || !Array.isArray(urls)) return res.status(400).json({ ok: false, error: 'keyword and urls array required' });

    const fetchMod = (await import('node-fetch')).default;
    const kLower = keyword.toLowerCase();

    const results = await Promise.all(urls.slice(0, 10).map(async (url) => {
      try {
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const html = await r.text();
        const $ = cheerio.load(html);
        const title = $('title').first().text().trim();
        const h1 = $('h1').first().text().trim();
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const allText = $('body').text().toLowerCase();
        const wordCount = allText.split(/\s+/).length;
        const keywordCount = (allText.match(new RegExp(`\\b${kLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) || []).length;
        const density = wordCount > 0 ? ((keywordCount / wordCount) * 100).toFixed(2) : '0';
        const inTitle = title.toLowerCase().includes(kLower);
        const inH1 = h1.toLowerCase().includes(kLower);
        const inMeta = metaDesc.toLowerCase().includes(kLower);
        const optimizationScore = (inTitle ? 40 : 0) + (inH1 ? 30 : 0) + (inMeta ? 15 : 0) + Math.min(15, keywordCount);
        return { url, title, h1, wordCount, keywordCount, density: parseFloat(density), inTitle, inH1, inMeta, optimizationScore, status: 'ok' };
      } catch { return { url, status: 'error' }; }
    }));

    const competing = results.filter(r => r.status === 'ok' && r.optimizationScore > 30);
    const hasCannibalization = competing.length > 1;
    const topCandidate = competing.sort((a, b) => b.optimizationScore - a.optimizationScore)[0];

    const issues = [];
    if (hasCannibalization) {
      issues.push({ sev: 'high', msg: `${competing.length} pages are competing for "${keyword}" — consolidate or differentiate them` });
      if (competing.length > 2) issues.push({ sev: 'high', msg: 'Severe cannibalization detected — consider merging weaker pages or adding canonical tags' });
    }

    res.json({ ok: true, keyword, hasCannibalization, competingPages: competing.length, topCandidate: topCandidate?.url, results, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   ANCHOR TEXT DIVERSITY CHECKER — analyze internal/external link anchor text
   ========================================================================= */
router.post('/anchor-text-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const origin = new URL(url).origin;
    const internalLinks = [];
    const externalLinks = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().slice(0, 100);
      const rel = $(el).attr('rel') || '';
      const isExternal = href.startsWith('http') && !href.startsWith(origin);
      const isInternal = href.startsWith('/') || href.startsWith(origin);
      if (isExternal) externalLinks.push({ href: href.slice(0, 120), text, rel, isNofollow: rel.includes('nofollow'), isSponsored: rel.includes('sponsored') });
      else if (isInternal && href !== '#') internalLinks.push({ href: href.slice(0, 120), text });
    });

    // Anchor text distribution
    const anchorMap = {};
    [...internalLinks, ...externalLinks].forEach(l => {
      const t = l.text.toLowerCase().trim() || '[image/empty]';
      anchorMap[t] = (anchorMap[t] || 0) + 1;
    });
    const genericAnchors = Object.entries(anchorMap).filter(([t]) => /^(click here|here|read more|learn more|this|link|more|see|view)$/i.test(t));
    const topAnchors = Object.entries(anchorMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([text, count]) => ({ text, count }));

    const issues = [];
    if (genericAnchors.length > 3) issues.push({ sev: 'medium', msg: `${genericAnchors.map(([t]) => t).join(', ')} used ${genericAnchors.reduce((s, [, c]) => s + c, 0)} times as anchor text — use descriptive, keyword-rich anchors instead` });
    if (internalLinks.length === 0) issues.push({ sev: 'medium', msg: 'No internal links found on this page — add internal links to improve navigation and PageRank distribution' });
    if (externalLinks.filter(l => !l.isNofollow && !l.isSponsored).length > 15) issues.push({ sev: 'low', msg: 'High number of followed external links — consider if all are necessary to avoid leaking PageRank' });

    res.json({ ok: true, internalLinks: internalLinks.length, externalLinks: externalLinks.length, genericAnchorCount: genericAnchors.reduce((s, [, c]) => s + c, 0), topAnchors, issues, internalSample: internalLinks.slice(0, 10), externalSample: externalLinks.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   TABLE OF CONTENTS GENERATOR — auto-generate ToC from page headings
   ========================================================================= */
router.post('/toc-generator', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    const headings = [];
    $('h2,h3,h4').each((_, el) => {
      const text = $(el).text().trim();
      const id = $(el).attr('id') || text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
      const level = parseInt(el.tagName[1]);
      headings.push({ level, text, id });
    });

    // Generate HTML ToC
    let tocHtml = '<nav class="table-of-contents">\n<ol>\n';
    let currentLevel = 2;
    for (const h of headings) {
      if (h.level > currentLevel) {
        tocHtml += '<ol>\n';
        currentLevel = h.level;
      } else if (h.level < currentLevel) {
        tocHtml += '</ol>\n';
        currentLevel = h.level;
      }
      tocHtml += `  <li><a href="#${h.id}">${h.text}</a></li>\n`;
    }
    tocHtml += '</ol>\n</nav>';

    // Generate schema.org breadcrumb markup for ToC
    const hasAnchors = headings.some(h => $(`#${h.id}`).length > 0 || $(`[id="${h.id}"]`).length > 0);

    res.json({ ok: true, headings, hasAnchors, tocHtml, headingCount: headings.length, missingIds: headings.filter(h => !$(`#${h.id}`).length).map(h => h.text) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   WORD COUNT BY SECTION — break down content depth per section
   ========================================================================= */
router.post('/section-word-count', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();

    const sections = [];
    let introText = '';

    // Collect intro (before first H2)
    const firstH2 = $('h2').first();
    if (firstH2.length) {
      const beforeH2 = [];
      firstH2.prevAll('p,ul,ol,blockquote').each((_, el) => beforeH2.push($(el).text()));
      introText = beforeH2.reverse().join(' ');
    }

    $('h2').each((_, el) => {
      const headText = $(el).text().trim();
      const words = [];
      let sib = $(el).next()[0];
      while (sib && sib.tagName !== 'h2') {
        words.push($(sib).text());
        sib = $(sib).next()[0];
      }
      const sectionText = words.join(' ');
      const wordCount = sectionText.split(/\s+/).filter(Boolean).length;
      const depth = wordCount >= 300 ? 'Deep' : wordCount >= 150 ? 'Adequate' : wordCount >= 50 ? 'Shallow' : 'Thin';
      sections.push({ heading: headText.slice(0, 80), wordCount, depth });
    });

    const total = sections.reduce((s, sec) => s + sec.wordCount, 0) + (introText.split(/\s+/).filter(Boolean).length);
    const avgPerSection = sections.length > 0 ? Math.round(total / sections.length) : 0;
    const thinSections = sections.filter(s => s.wordCount < 50 && s.depth === 'Thin');

    const issues = [];
    if (thinSections.length > 0) issues.push({ sev: 'medium', msg: `${thinSections.length} section(s) have very few words — expand thin sections for better topical depth` });
    if (avgPerSection < 100 && sections.length > 0) issues.push({ sev: 'medium', msg: `Average section depth is only ${avgPerSection} words — aim for 150-300 words per section` });

    res.json({ ok: true, sections, totalWords: total, avgPerSection, thinSections: thinSections.length, intro: { wordCount: introText.split(/\s+/).filter(Boolean).length }, issues });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   PEOPLE ALSO ASK HARVESTER — extract PAA questions from Google SERP
   ========================================================================= */
router.post('/people-also-ask', async (req, res) => {
  try {
    const { keyword, url, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });

    // AI-powered PAA generation (since we can't reliably scrape Google)
    const openai = getOpenAI();
    const prompt = `Generate "People Also Ask" (PAA) questions that Google currently shows for the keyword: "${keyword}"

These should be the actual types of questions users ask related to this topic.
Also provide for each: the ideal answer format (list, paragraph, table, step-by-step) for a Featured Snippet.

Return JSON ONLY:
{
  "keyword": "${keyword}",
  "paaQuestions": [
    {
      "question": "exact question Google would show",
      "answerFormat": "paragraph|list|table|steps",
      "snippetTip": "how to format your answer to win this PAA",
      "difficulty": "easy|medium|hard"
    }
  ],
  "faqSchemaRecommended": true|false,
  "serp_features": ["featured snippet", "image pack", "video carousel", "knowledge panel"]
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   NLP ENTITY DETECTOR — extract named entities & semantic richness from content
   ========================================================================= */
router.post('/entity-detection', async (req, res) => {
  try {
    const { url, text, model = 'gpt-4o-mini' } = req.body || {};
    if (!url && !text) return res.status(400).json({ ok: false, error: 'url or text required' });

    let content = text || '';
    if (url && !text) {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const html = await r.text();
      const $ = cheerio.load(html);
      $('script,style,nav,footer').remove();
      content = $('article, main, .post-content, body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
    }

    const openai = getOpenAI();
    const prompt = `Analyze this content for NLP entities and semantic richness. This helps with Google's Knowledge Graph understanding.

Content: "${content.slice(0, 2500)}"

Extract:
- People (experts, authors, celebrities mentioned)
- Organizations (companies, institutions)
- Locations (places, regions)
- Concepts (key topics, ideas)
- Products/Tools mentioned
- Statistics and data points cited

Also rate semantic richness: does the content use varied vocabulary and related concepts, or is it repetitive?

Return JSON ONLY:
{
  "entities": {
    "people": [{"name": "string", "context": "briefly how they're mentioned"}],
    "organizations": [{"name": "string", "type": "company|institution|brand"}],
    "locations": ["string"],
    "concepts": ["string"],
    "products": ["string"],
    "statistics": ["quoted stat"]
  },
  "semanticRichness": 0-100,
  "vocabularyDiversity": "Rich|Adequate|Repetitive",
  "entityCount": number,
  "recommendation": "how to improve entity coverage"
}`;

    const resp = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, contentLength: content.length, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SERP FEATURE ELIGIBILITY — assess candidacy for rich SERP features
   ========================================================================= */
router.post('/serp-features', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
    const html = await r.text();
    const $ = cheerio.load(html);

    $('script,style').remove();
    const allText = $('body').text().replace(/\s+/g, ' ');

    const schemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try { schemas.push(JSON.parse($(el).html())); } catch {}
    });

    const schemaTypes = schemas.map(s => s['@type']).filter(Boolean);
    const hasFAQSchema = schemaTypes.includes('FAQPage');
    const hasHowToSchema = schemaTypes.includes('HowTo');
    const hasArticleSchema = schemaTypes.some(t => ['Article', 'BlogPosting', 'NewsArticle'].includes(t));
    const hasReviewSchema = schemaTypes.some(t => ['Review', 'AggregateRating'].includes(t));
    const hasBreadcrumb = schemaTypes.includes('BreadcrumbList');
    const hasVideo = $('iframe[src*="youtube"],iframe[src*="vimeo"],video').length > 0 || schemaTypes.includes('VideoObject');
    const hasImages = $('img').length > 0;
    const hasTable = $('table').length > 0;
    const hasOL = $('ol').length > 0;
    const wordCount = allText.split(/\s+/).length;
    const hasDirectAnswer = /^[A-Z].*is (a |an |the )?[A-Za-z].*\./m.test(allText.slice(0, 500));

    const features = [
      { feature: 'Featured Snippet', eligible: hasFAQSchema || hasHowToSchema || hasOL || hasDirectAnswer, score: (hasFAQSchema ? 30 : 0) + (hasHowToSchema ? 25 : 0) + (hasOL ? 20 : 0) + (hasDirectAnswer ? 25 : 0), tip: 'Add a direct definition in first 100 words, use numbered lists for steps' },
      { feature: 'People Also Ask', eligible: hasFAQSchema, score: hasFAQSchema ? 90 : 20, tip: 'Add FAQPage schema with Q&A pairs matching common search questions' },
      { feature: 'Image Pack', eligible: hasImages, score: hasImages ? 60 : 0, tip: 'Use descriptive file names and keyword-rich alt text on images' },
      { feature: 'Video Carousel', eligible: hasVideo, score: hasVideo ? 80 : 0, tip: 'Embed a relevant YouTube/Vimeo video and add VideoObject schema' },
      { feature: 'HowTo Rich Result', eligible: hasHowToSchema, score: hasHowToSchema ? 95 : (hasOL ? 30 : 0), tip: 'Add HowTo schema markup for step-by-step content' },
      { feature: 'FAQ Rich Result', eligible: hasFAQSchema, score: hasFAQSchema ? 95 : 0, tip: 'Add FAQPage schema — each FAQ needs a question and acceptedAnswer' },
      { feature: 'Review Stars', eligible: hasReviewSchema, score: hasReviewSchema ? 90 : 0, tip: 'Add Review or AggregateRating schema for review content' },
      { feature: 'Breadcrumbs', eligible: hasBreadcrumb, score: hasBreadcrumb ? 90 : 10, tip: 'Add BreadcrumbList schema to show navigation path in SERPs' },
      { feature: 'Sitelinks', eligible: wordCount > 1000 && hasArticleSchema, score: (wordCount > 1000 ? 40 : 0) + (hasArticleSchema ? 30 : 0), tip: 'Add table of contents with anchor links to qualify for sitelinks' },
    ];

    const eligible = features.filter(f => f.eligible);
    res.json({ ok: true, keyword, totalFeatures: features.length, eligibleCount: eligible.length, features, schemaTypes, hasVideo, hasImages, wordCount });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   BATCH 3 — 51 NEW SEO FEATURES
   ========================================================================== */

/* 1. Sentence Variety */
router.post('/content/sentence-variety', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const resp = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await resp.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer,header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const counts = { short: 0, medium: 0, long: 0 };
    sentences.forEach(s => {
      const words = s.trim().split(/\s+/).length;
      if (words <= 10) counts.short++;
      else if (words <= 25) counts.medium++;
      else counts.long++;
    });
    const total = sentences.length || 1;
    const avgLen = sentences.reduce((a, s) => a + s.trim().split(/\s+/).length, 0) / total;
    const score = Math.min(100, Math.round(((counts.short / total) * 30 + (counts.medium / total) * 50 + Math.min(counts.long / total, 0.3) * 20) * (100 / 50) * 100));
    res.json({ ok: true, total, short: counts.short, medium: counts.medium, long: counts.long, avgWordsPerSentence: +avgLen.toFixed(1), varietyScore: score, tip: counts.long / total > 0.4 ? 'Too many long sentences — break them up for readability' : counts.short / total > 0.7 ? 'Very short sentences only — add more medium-length variety' : 'Good sentence variety' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 2. Emotional Tone (AI) */
router.post('/content/emotional-tone', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer,header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);
    const prompt = `Analyze the emotional tone of this blog content. Return JSON: {"primaryTone":"informative|persuasive|inspirational|urgent|neutral|conversational","toneScore":0-100,"positivity":0-100,"urgency":0-100,"trustworthiness":0-100,"emotions":["list of 3-5 detected emotions"],"recommendation":"one actionable improvement tip"}. Content: ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 3. Jargon & Complexity Detector */
router.post('/content/jargon-detector', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const longWords = words.filter(w => w.length > 12);
    const complexRatio = +(longWords.length / (words.length || 1) * 100).toFixed(1);
    const jargonPatterns = /\b(synergy|leverage|paradigm|bandwidth|holistic|scalable|actionable|utilize|facilitate|deliverable|monetize|granular|ecosystem|onboard|disrupt|evangelize|boilerplate|agile|KPI|ROI|B2B|B2C|SaaS|API|UX|CTA)\b/gi;
    const jargonMatches = text.match(jargonPatterns) || [];
    const uniqueJargon = [...new Set(jargonMatches.map(w => w.toLowerCase()))];
    const complexityScore = Math.max(0, 100 - complexRatio * 4 - uniqueJargon.length * 3);
    res.json({ ok: true, totalWords: words.length, longWordCount: longWords.length, complexWordRatio: complexRatio, jargonWords: uniqueJargon, jargonCount: uniqueJargon.length, readabilityRisk: complexRatio > 15 ? 'High' : complexRatio > 8 ? 'Medium' : 'Low', complexityScore: Math.round(complexityScore), tip: uniqueJargon.length > 5 ? `Replace jargon like: ${uniqueJargon.slice(0, 3).join(', ')}` : 'Good — jargon is minimal' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 4. Expertise Signals */
router.post('/content/expertise-signals', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const text = $('body').text();
    const signals = {
      statistics: (text.match(/\b\d+(\.\d+)?(%|percent|million|billion|thousand)\b/gi) || []).length,
      citations: $('cite,blockquote,[class*="cite"],[class*="source"]').length + ($('a[href*="doi.org"],a[href*="pubmed"],a[href*="ncbi"],a[href*=".edu"],a[href*=".gov"]').length),
      authorBio: $('[class*="author"],[itemprop="author"],.byline').length > 0,
      datePublished: $('[class*="date"],[itemprop="datePublished"],time').length > 0,
      externalLinks: $('a[href^="http"]').not('[href*="' + (url.match(/https?:\/\/([^/]+)/)||['',''])[1] + '"]').length,
      images: $('img').length,
      tables: $('table').length,
      lists: $('ul,ol').length,
      quotes: $('blockquote').length,
      researchTerms: (text.match(/\b(study|research|survey|analysis|report|data|according to|evidence|findings|peer-reviewed)\b/gi) || []).length,
    };
    const maxScore = 100;
    const score = Math.min(maxScore, (signals.statistics > 2 ? 15 : signals.statistics * 5) + (signals.citations > 0 ? 20 : 0) + (signals.authorBio ? 15 : 0) + (signals.externalLinks > 2 ? 15 : signals.externalLinks * 5) + (signals.researchTerms > 3 ? 20 : signals.researchTerms * 6) + (signals.quotes > 0 ? 10 : 0) + (signals.tables > 0 ? 5 : 0));
    res.json({ ok: true, signals, expertiseScore: score, grade: score >= 70 ? 'Strong' : score >= 40 ? 'Moderate' : 'Weak', tip: signals.statistics < 2 ? 'Add statistics and data points to boost E-E-A-T' : signals.citations < 1 ? 'Cite reputable sources (.edu, .gov, research papers)' : 'Good expertise signals detected' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 5. Multimedia Score */
router.post('/content/multimedia-score', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const images = $('img').length;
    const videos = $('video,iframe[src*="youtube"],iframe[src*="vimeo"]').length;
    const audios = $('audio').length;
    const infographics = $('img[src*="infographic"],img[alt*="infographic"]').length;
    const charts = $('canvas,[class*="chart"],[class*="graph"]').length;
    const tables = $('table').length;
    const codeBlocks = $('pre,code').length;
    const text = $('body').text();
    const wordCount = text.split(/\s+/).length;
    const mediaPerWords = +((images + videos * 2) / Math.max(wordCount / 300, 1)).toFixed(1);
    const score = Math.min(100, images * 10 + videos * 20 + charts * 10 + tables * 8 + audios * 15 + codeBlocks * 5);
    res.json({ ok: true, images, videos, audios, infographics, charts, tables, codeBlocks, wordCount, mediaPerWords, multimediaScore: Math.min(100, score), tip: images === 0 ? 'Add at least one image per 300 words' : videos === 0 ? 'Consider embedding a relevant video' : 'Good multimedia usage' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 6. Questions Count */
router.post('/content/questions-count', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style').remove();
    const text = $('body').text();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const questionSentences = sentences.filter(s => s.trim().endsWith('?'));
    const headingQuestions = [];
    $('h1,h2,h3,h4').each((_, el) => { const t = $(el).text().trim(); if (t.endsWith('?')) headingQuestions.push(t); });
    const whWords = (text.match(/\b(what|why|how|when|where|which|who|can|should|is|are|do|does)\b/gi) || []).length;
    const score = Math.min(100, questionSentences.length * 8 + headingQuestions.length * 15);
    res.json({ ok: true, totalQuestions: questionSentences.length, headingQuestions, questionHeadingCount: headingQuestions.length, questionKeywordCount: whWords, engagementScore: score, topQuestions: questionSentences.slice(0, 5).map(s => s.trim()), tip: headingQuestions.length === 0 ? 'Use question-based H2/H3 headings to target PAA results' : questionSentences.length < 3 ? 'Add more rhetorical questions to engage readers' : 'Good question density for engagement' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 7. Intro Quality */
router.post('/content/intro-quality', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,header,footer').remove();
    const paras = $('p');
    const firstPara = paras.first().text().trim();
    const first200 = $('body').text().trim().slice(0, 400);
    const wordCount = firstPara.split(/\s+/).length;
    const hasQuestion = /\?/.test(firstPara);
    const hasStat = /\b\d+(\.\d+)?(%|percent|million|billion)/.test(firstPara);
    const hasHook = /\b(imagine|discover|did you know|have you ever|what if|the secret|why most|the truth)\b/i.test(firstPara);
    const hasKeyword = req.body.keyword ? firstPara.toLowerCase().includes(req.body.keyword.toLowerCase()) : null;
    const score = (wordCount >= 40 && wordCount <= 150 ? 30 : 10) + (hasQuestion ? 20 : 0) + (hasStat ? 25 : 0) + (hasHook ? 25 : 0);
    const issues = [];
    if (wordCount < 40) issues.push('Intro too short (under 40 words)');
    if (!hasQuestion && !hasHook) issues.push('No hook detected — start with a stat, question, or bold statement');
    if (wordCount > 200) issues.push('Intro too long — keep it under 150 words');
    res.json({ ok: true, firstParagraph: firstPara.slice(0, 300), wordCount, hasQuestion, hasStat, hasHook, introScore: Math.min(100, score), issues, tip: issues[0] || 'Intro looks engaging' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 8. CTA Audit */
router.post('/content/cta-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const buttons = $('button,a.btn,a.button,[class*="cta"],[class*="call-to-action"]').length;
    const ctaText = [];
    $('button,a.btn,a.button,[class*="cta"]').each((_, el) => { const t = $(el).text().trim(); if (t.length > 2 && t.length < 60) ctaText.push(t); });
    const text = $('body').text();
    const ctaKeywords = (text.match(/\b(click here|get started|sign up|subscribe|buy now|download|learn more|try free|contact us|start today|get access|join now)\b/gi) || []);
    const wordCount = text.split(/\s+/).length;
    const ctaDensity = +(ctaKeywords.length / Math.max(wordCount / 100, 1)).toFixed(2);
    const hasFinalCTA = /\b(click here|get started|sign up|subscribe|learn more|try|contact|download)\b/i.test(text.slice(-500));
    res.json({ ok: true, buttonCount: buttons, ctaTextSamples: [...new Set(ctaText)].slice(0, 6), ctaKeywordCount: ctaKeywords.length, ctaDensity, hasFinalCTA, wordCount, ctaScore: Math.min(100, buttons * 15 + ctaKeywords.length * 10 + (hasFinalCTA ? 30 : 0)), tip: buttons === 0 ? 'Add at least one CTA button or link' : !hasFinalCTA ? 'Add a CTA in the final paragraph to drive conversions' : ctaDensity > 3 ? 'Too many CTAs — reduce for better user experience' : 'CTA usage looks good' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 9. Formatting Score */
router.post('/content/formatting-score', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style').remove();
    const bullets = $('ul li').length;
    const numbered = $('ol li').length;
    const tables = $('table').length;
    const bold = $('strong,b').length;
    const italic = $('em,i').length;
    const blockquotes = $('blockquote').length;
    const callouts = $('[class*="callout"],[class*="notice"],[class*="alert"],[class*="tip"],[class*="box"]').length;
    const code = $('pre code,code').length;
    const wordCount = $('body').text().split(/\s+/).length;
    const listPerWords = +(bullets + numbered) / Math.max(wordCount / 100, 1);
    const score = Math.min(100, (bullets > 0 ? 20 : 0) + (numbered > 0 ? 15 : 0) + (tables > 0 ? 15 : 0) + (bold > 2 ? 15 : bold * 5) + (blockquotes > 0 ? 10 : 0) + (callouts > 0 ? 15 : 0) + (code > 0 ? 10 : 0));
    res.json({ ok: true, bullets, numbered, tables, bold, italic, blockquotes, callouts, code, wordCount, listDensity: +listPerWords.toFixed(2), formattingScore: score, tip: bullets === 0 && numbered === 0 ? 'Add bullet/numbered lists to improve scannability' : bold < 3 ? 'Use bold text to highlight key points' : tables === 0 && wordCount > 800 ? 'A comparison table would improve engagement' : 'Good formatting' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 10. Thin Content Detector */
router.post('/content/thin-content', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer,header,aside').remove();
    const text = $('article,main,[class*="content"],[class*="post"]').text().trim() || $('body').text().trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
    const headings = $('h1,h2,h3,h4').length;
    const paragraphs = $('p').length;
    const uniqueWords = new Set(text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []).size;
    const repetitionRatio = wordCount > 0 ? +(uniqueWords / wordCount * 100).toFixed(1) : 0;
    const thinRisk = wordCount < 300 ? 'High' : wordCount < 600 ? 'Medium' : wordCount < 1000 ? 'Low' : 'None';
    const contentScore = Math.min(100, (wordCount > 1500 ? 40 : Math.round(wordCount / 1500 * 40)) + (headings > 3 ? 25 : headings * 8) + (paragraphs > 5 ? 20 : paragraphs * 4) + (repetitionRatio > 40 ? 15 : Math.round(repetitionRatio / 40 * 15)));
    res.json({ ok: true, wordCount, headings, paragraphs, uniqueWords, repetitionRatio, thinContentRisk: thinRisk, contentDepthScore: contentScore, recommendation: wordCount < 300 ? 'Critical: Content is very thin — target 1500+ words for competitive topics' : wordCount < 600 ? 'Add more depth — cover subtopics, FAQs, examples' : 'Content depth looks adequate' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 11. Keyword Prominence */
router.post('/keywords/prominence', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const kw = keyword.toLowerCase();
    const title = $('title').first().text().toLowerCase();
    const h1 = $('h1').first().text().toLowerCase();
    const firstPara = $('p').first().text().toLowerCase();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const url2 = url.toLowerCase();
    const allText = $('body').text().toLowerCase();
    const h2h3 = [];
    $('h2,h3').each((_, el) => h2h3.push($(el).text().toLowerCase()));
    const signals = {
      inTitle: title.includes(kw),
      inH1: h1.includes(kw),
      inFirstParagraph: firstPara.includes(kw),
      inMetaDescription: metaDesc.toLowerCase().includes(kw),
      inUrl: url2.includes(kw.replace(/\s+/g, '-').replace(/\s+/g, '')),
      inH2H3: h2h3.filter(h => h.includes(kw)).length,
      titlePosition: title.indexOf(kw),
    };
    const score = (signals.inTitle ? 25 : 0) + (signals.inH1 ? 20 : 0) + (signals.inFirstParagraph ? 20 : 0) + (signals.inMetaDescription ? 15 : 0) + (signals.inUrl ? 10 : 0) + Math.min(signals.inH2H3 * 5, 10);
    res.json({ ok: true, keyword, signals, prominenceScore: score, grade: score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Poor', tip: !signals.inTitle ? 'Add keyword to title tag' : !signals.inH1 ? 'Add keyword to H1 heading' : !signals.inFirstParagraph ? 'Mention keyword in first paragraph' : 'Keyword prominence is strong' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 12. TF-IDF Analysis */
router.post('/keywords/tfidf', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = new Set(['this','that','with','have','from','they','will','been','more','also','when','your','their','what','about','which','after','would','there','than','then','some','into','other','just','like','over','such','only','can','not','but','for','are','was','had','has','him','his','her','the','and','you']);
    const freq = {};
    words.forEach(w => { if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1; });
    const total = words.length || 1;
    const topTerms = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([term, count]) => ({ term, count, tf: +(count / total * 100).toFixed(3), relevance: keyword ? (term.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(term) ? 'Primary' : 'Supporting') : 'N/A' }));
    const kwDensity = keyword ? +((freq[keyword.toLowerCase()] || 0) / total * 100).toFixed(2) : null;
    res.json({ ok: true, totalWords: total, topTerms, keywordDensity: kwDensity, dominantTheme: topTerms[0]?.term || 'N/A', tip: kwDensity > 3 ? 'Keyword density too high — risk of over-optimisation' : kwDensity < 0.5 ? 'Keyword density low — use keyword more naturally' : 'Good TF-IDF distribution' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 13. Co-occurring Terms */
router.post('/keywords/co-occurrence', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().toLowerCase().replace(/\s+/g, ' ');
    const kw = keyword.toLowerCase();
    const sentences = text.split(/[.!?]+/);
    const coTerms = {};
    const stopWords = new Set(['this','that','with','have','from','they','will','been','more','also','when','your','their','what','about','which','after','would','there','than','such','into','other','just','like','over','only','can','not','but','for','are','was','had','has','him','his','her','the','and','you','its','our','their','was','were','been','being']);
    sentences.forEach(sent => {
      if (sent.includes(kw)) {
        const words = sent.match(/\b[a-z]{4,}\b/g) || [];
        words.forEach(w => { if (w !== kw && !stopWords.has(w)) coTerms[w] = (coTerms[w] || 0) + 1; });
      }
    });
    const top = Object.entries(coTerms).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([term, count]) => ({ term, count }));
    res.json({ ok: true, keyword, coOccurringTerms: top, sentencesWithKeyword: sentences.filter(s => s.includes(kw)).length, tip: top.length < 5 ? 'Keyword appears in isolation — surround with related terms for semantic richness' : 'Good semantic co-occurrence detected' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 14. Secondary Keyword Suggestions (AI) */
router.post('/keywords/secondary', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    let contentSnippet = '';
    if (url) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        const html = await r.text();
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        contentSnippet = $('body').text().slice(0, 1200);
      } catch (_) {}
    }
    const prompt = `For a blog post targeting the primary keyword "${keyword}"${contentSnippet ? `, here is a content snippet: ${contentSnippet}` : ''}, suggest 10 secondary/LSI keywords with search intent. Return JSON: {"secondary":[{"keyword":"...","intent":"informational|commercial|transactional","priority":"high|medium|low","tip":"where to use it"},...],"contentGaps":["2-3 subtopic gaps"],"relatedQuestions":["3 PAA-style questions"]}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, primaryKeyword: keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 15. Voice Search Optimizer (AI) */
router.post('/keywords/voice-search', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    let text = '';
    if (url) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        const html = await r.text();
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        text = $('body').text().slice(0, 800);
      } catch (_) {}
    }
    const prompt = `Optimize for voice search (Google Assistant, Siri, Alexa). Primary keyword: "${keyword}". ${text ? `Content snippet: ${text}` : ''} Return JSON: {"voiceKeywords":["5 conversational question-style queries"],"featuredSnippetTarget":"one ideal paragraph for a snippet (under 50 words)","conversationalAnswers":[{"question":"...","answer":"..."}],"optimizationTips":["3 voice SEO tips"],"score":0-100}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 16. Negative Keyword / Over-Optimisation Check */
router.post('/keywords/negative-check', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style').remove();
    const text = $('body').text().replace(/\s+/g, ' ');
    const wordCount = text.split(/\s+/).length;
    const spamPatterns = /\b(buy now|cheap|discount|free|guaranteed|best price|lowest price|no risk|act now|limited time|click here|order now|visit now|earn money|make money online)\b/gi;
    const spamMatches = text.match(spamPatterns) || [];
    const excessiveKeyword = keyword ? (text.toLowerCase().match(new RegExp(`\\b${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')) || []).length : 0;
    const kwDensity = keyword && wordCount ? +(excessiveKeyword / wordCount * 100).toFixed(2) : 0;
    const issues = [];
    if (spamMatches.length > 3) issues.push(`Spam phrases detected: ${[...new Set(spamMatches)].slice(0, 3).join(', ')}`);
    if (kwDensity > 3) issues.push(`Keyword "${keyword}" appears ${excessiveKeyword}x — density ${kwDensity}% exceeds recommended 2%`);
    if ($('[class*="keyword"]').length > 5) issues.push('Excessive keyword-targeting class names in HTML');
    res.json({ ok: true, wordCount, spamPhraseCount: spamMatches.length, spamPhrases: [...new Set(spamMatches)], keywordCount: excessiveKeyword, keywordDensity: kwDensity, overOptimisationRisk: issues.length > 0 ? 'High' : kwDensity > 2 ? 'Medium' : 'Low', issues, tip: issues[0] || 'No over-optimisation detected' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 17. Featured Snippet Optimizer */
router.post('/keywords/featured-snippet', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text();
    const kw = keyword.toLowerCase();
    const paragraphs = [];
    $('p').each((_, el) => { const t = $(el).text().trim(); if (t.length > 40 && t.length < 350) paragraphs.push(t); });
    const bestPara = paragraphs.find(p => p.toLowerCase().includes(kw)) || paragraphs[0] || '';
    const hasFAQSchema = html.includes('"FAQPage"');
    const hasHowTo = $('ol').length > 0;
    const hasTableData = $('table').length > 0;
    const wordCount = bestPara.split(/\s+/).length;
    const snippetReady = wordCount >= 40 && wordCount <= 60 && bestPara.toLowerCase().includes(kw);
    const score = (snippetReady ? 40 : 0) + (hasFAQSchema ? 25 : 0) + (hasHowTo ? 20 : 0) + (hasTableData ? 15 : 0);
    res.json({ ok: true, keyword, bestSnippetParagraph: bestPara.slice(0, 300), snippetWordCount: wordCount, snippetReady, hasFAQSchema, hasHowToList: hasHowTo, hasTable: hasTableData, featuredSnippetScore: score, snippetType: hasFAQSchema ? 'FAQ' : hasHowTo ? 'HowTo Steps' : hasTableData ? 'Table' : 'Definition Paragraph', tip: !snippetReady ? `Rewrite answer paragraph to 40-60 words including "${keyword}"` : score < 60 ? 'Add FAQ or How-To schema for better snippet eligibility' : 'Good featured snippet eligibility' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 18. URL Analysis */
router.post('/technical/url-analysis', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    let parsed;
    try { parsed = new URL(url); } catch (_) { return res.json({ ok: false, error: 'Invalid URL' }); }
    const slug = parsed.pathname.replace(/\/$/, '').split('/').pop() || '';
    const slugWords = slug.split(/[-_]/).filter(Boolean);
    const issues = [];
    if (slug.length > 75) issues.push(`Slug too long (${slug.length} chars) — keep under 75`);
    if (/_/.test(slug)) issues.push('Uses underscores — replace with hyphens');
    if (/[A-Z]/.test(slug)) issues.push('Contains uppercase letters — use lowercase slugs');
    if (/\d{4}/.test(slug)) issues.push('Contains year — may become outdated, consider removing');
    if (slugWords.length > 6) issues.push(`Too many words in slug (${slugWords.length}) — trim to 3-5 key words`);
    if (/[%?#&=+]/.test(slug)) issues.push('Special characters in slug — bad for SEO');
    const score = 100 - issues.length * 15;
    res.json({ ok: true, url, slug, slugWords, slugLength: slug.length, wordCount: slugWords.length, protocol: parsed.protocol, domain: parsed.hostname, path: parsed.pathname, hasQueryString: parsed.search.length > 0, issues, urlScore: Math.max(0, score), tip: issues[0] || 'URL structure is SEO-friendly' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 19. Mobile SEO */
router.post('/technical/mobile-seo', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const hasViewport = viewport.length > 0;
    const hasWidthDevice = viewport.includes('width=device-width');
    const hasInitialScale = viewport.includes('initial-scale=1');
    const tapTargets = $('a,button').length;
    const smallText = $('p,span,div').filter((_, el) => { const fs = $(el).css ? $(el).css('font-size') : ''; return fs && parseInt(fs) < 12; }).length;
    const hasResponsiveImages = $('img[srcset],picture source').length > 0;
    const issues = [];
    if (!hasViewport) issues.push('Missing viewport meta tag');
    if (hasViewport && !hasWidthDevice) issues.push('Viewport missing width=device-width');
    if (hasViewport && !hasInitialScale) issues.push('Viewport missing initial-scale=1');
    if (!hasResponsiveImages && $('img').length > 0) issues.push('No responsive images (srcset) detected');
    const mobileScore = (hasViewport ? 35 : 0) + (hasWidthDevice ? 25 : 0) + (hasInitialScale ? 20 : 0) + (hasResponsiveImages ? 20 : 0);
    res.json({ ok: true, viewport, hasViewport, hasWidthDevice, hasInitialScale, hasResponsiveImages, tapTargetCount: tapTargets, issues, mobileScore, tip: issues[0] || 'Mobile SEO fundamentals look good' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 20. Hreflang Checker */
router.post('/technical/hreflang', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const hreflangs = [];
    $('link[rel="alternate"][hreflang]').each((_, el) => { hreflangs.push({ lang: $(el).attr('hreflang'), href: $(el).attr('href') }); });
    const hasXDefault = hreflangs.some(h => h.lang === 'x-default');
    const hasConflicts = new Set(hreflangs.map(h => h.lang)).size < hreflangs.length;
    const issues = [];
    if (hreflangs.length === 0) issues.push('No hreflang tags found — needed for multilingual/international sites');
    if (hreflangs.length > 0 && !hasXDefault) issues.push('Missing x-default hreflang tag');
    if (hasConflicts) issues.push('Duplicate hreflang values detected');
    res.json({ ok: true, hreflangs, count: hreflangs.length, hasXDefault, hasConflicts, languages: [...new Set(hreflangs.map(h => h.lang))], issues, isInternational: hreflangs.length > 0, tip: hreflangs.length === 0 ? 'Consider adding hreflang if targeting multiple countries/languages' : issues[0] || 'Hreflang implementation looks correct' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 21. AMP Check */
router.post('/technical/amp-check', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const isAMPPage = html.includes('<html amp') || html.includes('<html ⚡') || $('html').attr('amp') !== undefined;
    const ampLink = $('link[rel="amphtml"]').attr('href') || null;
    const ampCanonical = $('link[rel="canonical"]').attr('href') || null;
    const ampComponents = html.match(/<script async(?:[^>]*)src="https:\/\/cdn\.ampproject\.org/g) || [];
    const issues = [];
    if (isAMPPage && !ampCanonical) issues.push('AMP page missing canonical link to non-AMP version');
    if (!isAMPPage && !ampLink) issues.push('No AMP version linked — consider adding for news/article pages');
    res.json({ ok: true, isAMPPage, ampLink, ampCanonical, ampComponentCount: ampComponents.length, issues, ampStatus: isAMPPage ? 'This is an AMP page' : ampLink ? 'AMP version available' : 'No AMP', tip: issues[0] || (ampLink ? 'AMP correctly linked' : 'AMP optional for non-news sites') });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 22. Resource Hints Audit */
router.post('/technical/resource-hints', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const preloads = [], prefetches = [], dnsPrefetches = [], preconnects = [];
    $('link[rel="preload"]').each((_, el) => preloads.push({ href: $(el).attr('href'), as: $(el).attr('as') }));
    $('link[rel="prefetch"]').each((_, el) => prefetches.push($(el).attr('href')));
    $('link[rel="dns-prefetch"]').each((_, el) => dnsPrefetches.push($(el).attr('href')));
    $('link[rel="preconnect"]').each((_, el) => preconnects.push($(el).attr('href')));
    const renderBlocking = $('link[rel="stylesheet"]:not([media])').length + $('script:not([defer]):not([async])').length;
    const score = (preloads.length > 0 ? 30 : 0) + (dnsPrefetches.length > 0 ? 25 : 0) + (preconnects.length > 0 ? 25 : 0) + (renderBlocking === 0 ? 20 : Math.max(0, 20 - renderBlocking * 4));
    res.json({ ok: true, preloads, prefetches, dnsPrefetches, preconnects, renderBlockingResources: renderBlocking, resourceHintsScore: score, tip: preloads.length === 0 ? 'Add <link rel="preload"> for critical CSS/fonts' : renderBlocking > 3 ? `${renderBlocking} render-blocking resources detected — add defer/async` : 'Resource hints look well-configured' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 23. JSON-LD Linter */
router.post('/technical/json-ld-lint', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const scripts = [];
    $('script[type="application/ld+json"]').each((_, el) => scripts.push($(el).html()));
    const results = scripts.map((s, i) => {
      try {
        const parsed = JSON.parse(s);
        const type = parsed['@type'] || parsed.type || 'Unknown';
        const hasContext = !!parsed['@context'];
        const issues = [];
        if (!hasContext) issues.push('Missing @context');
        if (!parsed['@type'] && !parsed.type) issues.push('Missing @type');
        return { index: i + 1, valid: true, type, hasContext, issues, charCount: s.length };
      } catch (err) {
        return { index: i + 1, valid: false, error: err.message, charCount: s ? s.length : 0 };
      }
    });
    const valid = results.filter(r => r.valid).length;
    const invalid = results.filter(r => !r.valid).length;
    res.json({ ok: true, totalScripts: scripts.length, valid, invalid, results, lintScore: scripts.length > 0 ? Math.round(valid / scripts.length * 100) : 0, tip: invalid > 0 ? `${invalid} JSON-LD block(s) have syntax errors — fix them` : scripts.length === 0 ? 'No JSON-LD schema found — add structured data' : 'All JSON-LD blocks are syntactically valid' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 24. OG Image Dimensions */
router.post('/technical/og-image-dims', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const ogWidth = $('meta[property="og:image:width"]').attr('content') || '';
    const ogHeight = $('meta[property="og:image:height"]').attr('content') || '';
    const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
    const issues = [];
    if (!ogImage) issues.push('No og:image found — required for social sharing');
    if (ogImage && !ogWidth) issues.push('og:image:width not specified');
    if (ogImage && !ogHeight) issues.push('og:image:height not specified');
    if (ogWidth && ogHeight) {
      const w = parseInt(ogWidth), h = parseInt(ogHeight);
      if (w < 1200) issues.push(`og:image width ${w}px is below recommended 1200px`);
      if (h < 630) issues.push(`og:image height ${h}px is below recommended 630px`);
    }
    const score = (!ogImage ? 0 : 40) + (ogWidth && ogHeight ? 30 : 0) + (parseInt(ogWidth) >= 1200 ? 30 : 0);
    res.json({ ok: true, ogImage, ogWidth, ogHeight, twitterImage, issues, ogImageScore: score, recommended: '1200x630px', tip: issues[0] || 'OG image is properly configured' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 25. HTTPS Status */
router.post('/technical/https-status', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    let parsed;
    try { parsed = new URL(url); } catch (_) { return res.json({ ok: false, error: 'Invalid URL' }); }
    const isHTTPS = parsed.protocol === 'https:';
    const fetchMod = (await import('node-fetch')).default;
    let redirectChain = [], finalUrl = url, statusCode = 0;
    try {
      const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
      statusCode = r.status;
      finalUrl = r.url;
      if (r.redirected) redirectChain.push({ from: url, to: finalUrl });
    } catch (_) {}
    const hasMixedContent = false;
    const issues = [];
    if (!isHTTPS) issues.push('Page uses HTTP — switch to HTTPS for ranking benefit and security');
    if (statusCode >= 400) issues.push(`Page returned HTTP ${statusCode}`);
    if (finalUrl !== url && !finalUrl.includes(parsed.hostname)) issues.push('Final URL redirects to a different domain');
    res.json({ ok: true, url, finalUrl, isHTTPS, statusCode, redirected: finalUrl !== url, redirectChain, issues, httpsScore: isHTTPS ? (issues.length === 0 ? 100 : 70) : 0, tip: issues[0] || 'HTTPS is properly configured' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 26. AI Blog Outline */
router.post('/ai/blog-outline', async (req, res) => {
  try {
    const { keyword, topic, audience = 'general', model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword && !topic) return res.status(400).json({ ok: false, error: 'keyword or topic required' });
    const prompt = `Create a comprehensive, SEO-optimised blog post outline for target keyword: "${keyword || topic}". Target audience: ${audience}. Return JSON: {"title":"SEO optimised title","metaDescription":"under 160 chars","sections":[{"heading":"H2 heading","type":"intro|body|faq|conclusion","suggestedWordCount":200,"keyPoints":["3 key points to cover"],"seoTip":"tip for this section"}],"totalWordCount":0,"estimatedReadTime":"X min read","contentAngle":"unique angle","primaryKeyword":"...","secondaryKeywords":["3-5 LSI keywords"]}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword: keyword || topic, audience, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 27. AI Intro Generator */
router.post('/ai/intro-generator', async (req, res) => {
  try {
    const { keyword, topic, style = 'PAS', audience = 'general', model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword && !topic) return res.status(400).json({ ok: false, error: 'keyword or topic required' });
    const prompt = `Write 3 compelling blog intro paragraphs (each 80-120 words) for a post about "${keyword || topic}". Use the ${style} formula (Problem-Agitate-Solve for PAS, AIDA for attention-interest-desire-action). Audience: ${audience}. Return JSON: {"intros":[{"style":"...","text":"...","hookType":"stat|question|story|bold claim","hookStrength":0-10}],"recommended":0}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword: keyword || topic, style, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 28. AI Title Ideas */
router.post('/ai/title-ideas', async (req, res) => {
  try {
    const { keyword, topic, count = 10, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword && !topic) return res.status(400).json({ ok: false, error: 'keyword or topic required' });
    const prompt = `Generate ${count} SEO-optimised, high-CTR blog post titles for keyword: "${keyword || topic}". Mix title formulas (how-to, listicle, question, power word, year-based, negative, etc). Return JSON: {"titles":[{"title":"...","formula":"how-to|listicle|question|power|negative|data","charCount":0,"ctrScore":0-10,"powerWords":["..."],"note":"why this works"}],"bestTitle":"...","tip":"..."}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword: keyword || topic, count, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 29. AI CTA Generator */
router.post('/ai/cta-generator', async (req, res) => {
  try {
    const { url, keyword, goal = 'signup', model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword && !url) return res.status(400).json({ ok: false, error: 'keyword or url required' });
    let contentSnippet = '';
    if (url) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        const html = await r.text();
        const $ = cheerio.load(html);
        contentSnippet = $('h1').first().text() + ' ' + $('p').first().text();
      } catch (_) {}
    }
    const prompt = `Write 3 high-converting CTA (call-to-action) paragraphs for a blog post about "${keyword || contentSnippet}". Goal: ${goal}. Each CTA should end blog content and drive user action. Return JSON: {"ctas":[{"variant":"A|B|C","text":"...","buttonText":"...","urgencyLevel":"low|medium|high","conversionPrinciple":"scarcity|authority|reciprocity|social-proof|FOMO","estimatedCTR":0-10}],"bestVariant":"A|B|C","tip":"..."}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, goal, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 30. AI Key Takeaways */
router.post('/ai/key-takeaways', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3000);
    const prompt = `Extract the 5-7 most important key takeaways from this blog post. Return JSON: {"takeaways":[{"point":"concise key insight (under 20 words)","importance":"critical|important|useful","detail":"1 sentence elaboration"}],"summary":"2-sentence article summary","mainThesis":"core argument in one sentence"}. Content: ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 31. AI Summary Generator */
router.post('/ai/summary-generator', async (req, res) => {
  try {
    const { url, length = 'short', model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3000);
    const wordTarget = length === 'short' ? '50-80' : length === 'medium' ? '100-150' : '200-250';
    const prompt = `Summarise this blog post in ${wordTarget} words. Return JSON: {"summaryShort":"1 sentence","summaryMedium":"2-3 sentences","summaryLong":"paragraph","tweetThread":["3 tweet-sized points under 280 chars each"],"tldr":"one line TL;DR"}. Content: ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, length, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 32. AI Tone Analyzer */
router.post('/ai/tone-analyzer', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 2500);
    const prompt = `Analyze the writing tone and style of this blog content. Return JSON: {"primaryTone":"formal|casual|authoritative|conversational|persuasive|educational|inspirational","toneScore":0-100,"brandVoice":"description","audienceFit":"who this tone best serves","sentenceStyle":"complex|simple|mixed","vocabulary":"technical|accessible|jargon-heavy","activeVoiceRatio":0-100,"toneConsistency":0-100,"improvements":["2-3 tone improvement suggestions"],"toneProfile":{"formal":0,"casual":0,"authoritative":0,"conversational":0,"persuasive":0}}. Content: ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 33. AI Content Grader */
router.post('/ai/content-grader', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3500);
    const title = $('title').first().text();
    const prompt = `Grade this blog content on SEO and quality. Title: "${title}"${keyword ? `. Target keyword: "${keyword}"` : ''}. Return JSON: {"overallGrade":"A|B|C|D|F","overallScore":0-100,"categories":{"contentQuality":{"score":0-100,"grade":"A-F","notes":"..."},"seoOptimisation":{"score":0-100,"grade":"A-F","notes":"..."},"userExperience":{"score":0-100,"grade":"A-F","notes":"..."},"eeat":{"score":0-100,"grade":"A-F","notes":"..."},"readability":{"score":0-100,"grade":"A-F","notes":"..."}},"strengths":["3 things done well"],"improvements":["3 priority improvements"],"rankingPotential":"high|medium|low","verdict":"2 sentence assessment"}. Content (first 2500 chars): ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, title, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 34. AI Pull Quotes */
router.post('/ai/pull-quotes', async (req, res) => {
  try {
    const { url, count = 5, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3000);
    const prompt = `Extract the ${count} best pull-quotes from this blog content for social sharing. Each quote should be compelling, standalone, and shareable. Return JSON: {"quotes":[{"quote":"...","platform":"twitter|linkedin|instagram","charCount":0,"shareability":0-10,"category":"stat|insight|tip|controversial|inspiring"}],"bestQuote":"...","hashtags":["5 relevant hashtags"]}. Content: ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, count, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 35. AI Headline Hook Optimizer */
router.post('/ai/headline-hook', async (req, res) => {
  try {
    const { url, keyword, currentTitle, model = 'gpt-4o-mini' } = req.body || {};
    const title = currentTitle || (url ? await (async () => {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        const html = await r.text();
        return cheerio.load(html)('title').first().text();
      } catch (_) { return ''; }
    })() : '');
    if (!title && !keyword) return res.status(400).json({ ok: false, error: 'currentTitle or keyword required' });
    const prompt = `Optimise this blog headline for CTR and SEO: "${title || keyword}". Return JSON: {"originalTitle":"...","analysis":{"powerWords":[],"numbers":false,"curiosityGap":false,"benefitClear":false,"keywordPresent":false},"optimisations":[{"title":"...","improvement":"what was changed","ctrLift":"estimated % CTR improvement","formula":"..."}],"bestVariant":"...","firstSentenceHook":"...","openingLine":"compelling 1-sentence opener that hooks instantly"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 36. AI Passage Optimizer */
router.post('/ai/passage-optimizer', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const paragraphs = [];
    $('p').each((_, el) => { const t = $(el).text().trim(); if (t.length > 50) paragraphs.push(t); });
    const topPara = paragraphs.slice(0, 8).join(' | ');
    const prompt = `Target keyword: "${keyword}". Optimise these paragraphs for passage indexing (Google shows individual passages in search). Return JSON: {"bestPassage":"the strongest existing passage","optimisedPassage":"rewritten version (40-60 words, direct answer format)","passageScore":0-100,"snippetType":"definition|steps|list|comparison","improvedParagraphs":[{"original":"...","optimised":"...","reason":"..."}]}. Paragraphs: ${topPara.slice(0, 2000)}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 37. AI Content Repurpose */
router.post('/ai/content-repurpose', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 2000);
    const title = $('title').first().text();
    const prompt = `Suggest content repurposing strategies for this blog post: "${title}". Return JSON: {"repurposes":[{"format":"YouTube Video|LinkedIn Post|Twitter Thread|Instagram Carousel|Podcast Episode|Email Newsletter|SlideShare|Infographic|TikTok|Pinterest","effort":"low|medium|high","estimatedReach":"low|medium|high","outline":["3 key points for this format"],"tip":"platform-specific advice"}],"quickWins":["2 easiest repurposing options"],"contentLifespan":"evergreen|timely|seasonal"}. Content: ${text}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, title, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 38–44. Schema Generators */
router.post('/schema/product', async (req, res) => {
  try {
    const { name, description, price, currency = 'USD', brand, sku, availability = 'InStock', rating, reviewCount, image, url } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const schema = { '@context': 'https://schema.org', '@type': 'Product', name, description: description || '', image: image ? [image] : undefined, sku, brand: brand ? { '@type': 'Brand', name: brand } : undefined, offers: { '@type': 'Offer', price: price || '0', priceCurrency: currency, availability: `https://schema.org/${availability}`, url }, aggregateRating: rating ? { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviewCount || 1 } : undefined };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    if (schema.offers) Object.keys(schema.offers).forEach(k => schema.offers[k] === undefined && delete schema.offers[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/schema/event', async (req, res) => {
  try {
    const { name, startDate, endDate, location, description, organizer, image, url, eventStatus = 'EventScheduled', eventAttendanceMode = 'OfflineEventAttendanceMode' } = req.body || {};
    if (!name || !startDate) return res.status(400).json({ ok: false, error: 'name and startDate required' });
    const schema = { '@context': 'https://schema.org', '@type': 'Event', name, startDate, endDate, description, image, url, eventStatus: `https://schema.org/${eventStatus}`, eventAttendanceMode: `https://schema.org/${eventAttendanceMode}`, location: location ? { '@type': 'Place', name: location } : undefined, organizer: organizer ? { '@type': 'Organization', name: organizer } : undefined };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/schema/person', async (req, res) => {
  try {
    const { name, jobTitle, description, url, image, sameAs, email, telephone, worksFor } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const schema = { '@context': 'https://schema.org', '@type': 'Person', name, jobTitle, description, url, image, email, telephone, sameAs: sameAs ? (Array.isArray(sameAs) ? sameAs : [sameAs]) : undefined, worksFor: worksFor ? { '@type': 'Organization', name: worksFor } : undefined };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/schema/course', async (req, res) => {
  try {
    const { name, description, provider, url, image, price, currency = 'USD', duration, level = 'Beginner' } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const schema = { '@context': 'https://schema.org', '@type': 'Course', name, description, url, image, courseMode: 'online', educationalLevel: level, timeRequired: duration, provider: provider ? { '@type': 'Organization', name: provider } : undefined, offers: price ? { '@type': 'Offer', price, priceCurrency: currency, category: 'Paid' } : undefined };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/schema/recipe', async (req, res) => {
  try {
    const { name, description, author, image, prepTime, cookTime, totalTime, recipeYield, recipeCategory, keywords, ingredients = [], instructions = [], rating, reviewCount } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const schema = { '@context': 'https://schema.org', '@type': 'Recipe', name, description, image, author: author ? { '@type': 'Person', name: author } : undefined, prepTime, cookTime, totalTime, recipeYield, recipeCategory, keywords, recipeIngredient: ingredients, recipeInstructions: instructions.map((step, i) => ({ '@type': 'HowToStep', position: i + 1, text: step })), aggregateRating: rating ? { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviewCount || 1 } : undefined };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/schema/software', async (req, res) => {
  try {
    const { name, description, url, image, applicationCategory = 'WebApplication', operatingSystem = 'Web', price = '0', currency = 'USD', rating, reviewCount, version } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const schema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name, description, url, image, applicationCategory, operatingSystem, softwareVersion: version, offers: { '@type': 'Offer', price, priceCurrency: currency }, aggregateRating: rating ? { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviewCount || 1 } : undefined };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

router.post('/schema/local-business', async (req, res) => {
  try {
    const { name, description, url, image, telephone, email, address, city, state, postalCode, country = 'US', latitude, longitude, openingHours, priceRange, businessType = 'LocalBusiness' } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const schema = { '@context': 'https://schema.org', '@type': businessType, name, description, url, image, telephone, email, address: address ? { '@type': 'PostalAddress', streetAddress: address, addressLocality: city, addressRegion: state, postalCode, addressCountry: country } : undefined, geo: (latitude && longitude) ? { '@type': 'GeoCoordinates', latitude, longitude } : undefined, openingHours, priceRange };
    Object.keys(schema).forEach(k => schema[k] === undefined && delete schema[k]);
    res.json({ ok: true, schema, jsonLd: JSON.stringify(schema, null, 2), scriptTag: `<script type="application/ld+json">${JSON.stringify(schema)}</script>` });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 45. External Link Authority */
router.post('/links/external-authority', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const domain = new URL(url).hostname;
    const links = [];
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.includes(domain)) {
        const rel = $(el).attr('rel') || '';
        const text = $(el).text().trim();
        links.push({ url: href.slice(0, 80), text: text.slice(0, 50), nofollow: rel.includes('nofollow'), sponsored: rel.includes('sponsored'), ugc: rel.includes('ugc'), isEdu: href.includes('.edu'), isGov: href.includes('.gov'), isOrg: href.includes('.org'), isNews: /bbc|nytimes|theguardian|reuters|techcrunch|wired/.test(href) });
      }
    });
    const dofollow = links.filter(l => !l.nofollow && !l.sponsored).length;
    const nofollow = links.filter(l => l.nofollow).length;
    const authoritative = links.filter(l => l.isEdu || l.isGov || l.isOrg || l.isNews).length;
    const score = Math.min(100, (dofollow > 2 ? 30 : dofollow * 10) + (authoritative > 1 ? 40 : authoritative * 20) + (links.length > 0 ? 30 : 0));
    res.json({ ok: true, externalLinks: links.slice(0, 10), totalExternal: links.length, dofollow, nofollow, sponsored: links.filter(l => l.sponsored).length, authoritative, eduLinks: links.filter(l => l.isEdu).length, govLinks: links.filter(l => l.isGov).length, newsLinks: links.filter(l => l.isNews).length, linkAuthorityScore: score, tip: links.length === 0 ? 'Add external links to authoritative sources' : authoritative < 1 ? 'Link to .edu/.gov/reputable news sources for E-E-A-T' : 'Good external link profile' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 46. Link Density */
router.post('/links/link-density', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const wordCount = $('body').text().split(/\s+/).length;
    const internalLinks = $('a[href^="/"],a[href*="' + new URL(url).hostname + '"]').length;
    const externalLinks = $('a[href^="http"]').not('a[href*="' + new URL(url).hostname + '"]').length;
    const totalLinks = $('a[href]').length;
    const linksPerHundredWords = +(totalLinks / Math.max(wordCount / 100, 1)).toFixed(2);
    const density = linksPerHundredWords;
    const risk = density > 8 ? 'High (over-linked)' : density < 0.5 ? 'Low (under-linked)' : 'Optimal';
    res.json({ ok: true, wordCount, totalLinks, internalLinks, externalLinks, linksPerHundredWords: density, linkDensityRisk: risk, internalRatio: totalLinks > 0 ? +(internalLinks / totalLinks * 100).toFixed(1) : 0, tip: density > 8 ? 'Too many links — reduce to avoid diluting link equity' : density < 0.5 ? 'Under-linked — add more contextual internal and external links' : 'Link density is optimal (2-5 links per 100 words recommended)' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 47. Outbound Link Quality */
router.post('/links/outbound-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const baseDomain = new URL(url).hostname;
    const outbound = [];
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      try {
        const linkDomain = new URL(href).hostname;
        if (linkDomain !== baseDomain) {
          outbound.push({ url: href.slice(0, 100), domain: linkDomain, anchor: $(el).text().trim().slice(0, 50), rel: $(el).attr('rel') || 'dofollow', opens: $(el).attr('target') === '_blank' ? 'new tab' : 'same tab' });
        }
      } catch (_) {}
    });
    const unique = [...new Map(outbound.map(l => [l.domain, l])).values()];
    const issues = outbound.filter(l => l.anchor.toLowerCase() === 'click here' || l.anchor.toLowerCase() === 'here' || l.anchor.length < 3);
    res.json({ ok: true, outboundLinks: outbound.slice(0, 15), totalOutbound: outbound.length, uniqueDomains: unique.length, genericAnchors: issues.length, linksOpeningNewTab: outbound.filter(l => l.opens === 'new tab').length, dofollow: outbound.filter(l => !l.rel.includes('nofollow')).length, nofollow: outbound.filter(l => l.rel.includes('nofollow')).length, tip: issues.length > 0 ? `${issues.length} links have generic anchor text ("click here") — use descriptive anchors` : outbound.length === 0 ? 'No outbound links found — add references to external sources' : 'Outbound link quality looks good' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 48. Trust / Social Proof Signals */
router.post('/trust/social-proof', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const shareButtons = $('[class*="share"],[class*="social"],[href*="twitter.com/intent"],[href*="facebook.com/share"],[href*="linkedin.com/share"]').length;
    const comments = $('[class*="comment"],[id*="comments"],#disqus_thread').length > 0;
    const testimonials = $('[class*="testimonial"],[class*="review"],[itemprop="review"]').length;
    const ratings = $('[class*="rating"],[class*="star"],[itemprop="ratingValue"]').length;
    const trustBadges = $('[class*="badge"],[class*="certified"],[class*="award"],[alt*="award"],[alt*="certified"]').length;
    const hasAuthor = $('[class*="author"],[itemprop="author"],.byline').length > 0;
    const hasUpdatedDate = $('time,[class*="updated"],[itemprop="dateModified"]').length > 0;
    const score = (shareButtons > 0 ? 20 : 0) + (comments ? 15 : 0) + (testimonials > 0 ? 20 : 0) + (ratings > 0 ? 20 : 0) + (hasAuthor ? 15 : 0) + (trustBadges > 0 ? 10 : 0);
    res.json({ ok: true, shareButtons, hasComments: comments, testimonials, ratings, trustBadges, hasAuthor, hasUpdatedDate, socialProofScore: score, tip: !hasAuthor ? 'Add visible author bio to improve trust and E-E-A-T' : shareButtons === 0 ? 'Add social share buttons to boost content visibility' : testimonials === 0 ? 'Consider adding testimonials or reviews' : 'Good social proof signals' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 49. Citation Quality Checker */
router.post('/trust/citation-check', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const baseDomain = new URL(url).hostname;
    const allLinks = [];
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      try { const d = new URL(href).hostname; if (d && d !== baseDomain) allLinks.push(href); } catch (_) {}
    });
    const edu = allLinks.filter(l => l.includes('.edu')).length;
    const gov = allLinks.filter(l => l.includes('.gov')).length;
    const org = allLinks.filter(l => l.includes('.org') && !/shop|store|ecommerce/.test(l)).length;
    const news = allLinks.filter(l => /bbc\.|nytimes\.|reuters\.|theguardian\.|forbes\.|wsj\.|techcrunch\.|wired\./.test(l)).length;
    const research = allLinks.filter(l => /doi\.org|pubmed\.|ncbi\.nlm|scholar\.google|academia\.edu|jstor\.org/.test(l)).length;
    const wiki = allLinks.filter(l => l.includes('wikipedia.org')).length;
    const total = allLinks.length;
    const authorityLinks = edu + gov + org + news + research;
    const citationScore = Math.min(100, (edu > 0 ? 25 : 0) + (gov > 0 ? 25 : 0) + (news > 1 ? 25 : news * 12) + (research > 0 ? 25 : 0));
    res.json({ ok: true, totalExternalLinks: total, eduLinks: edu, govLinks: gov, orgLinks: org, newsLinks: news, researchLinks: research, wikipediaLinks: wiki, authorityLinks, citationScore, citationGrade: citationScore >= 75 ? 'Excellent' : citationScore >= 40 ? 'Good' : citationScore >= 10 ? 'Fair' : 'Poor', tip: research === 0 && edu === 0 ? 'Cite academic research (.edu, doi.org) to boost E-E-A-T credibility' : gov === 0 ? 'Link to .gov sources where applicable for authority signals' : 'Good citation quality' });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 50. Passage Indexing Optimizer */
router.post('/passage-indexing', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const passages = [];
    $('p,li').each((_, el) => {
      const text = $(el).text().trim();
      const words = text.split(/\s+/).length;
      if (words >= 20 && words <= 100) {
        const isIndependentlyMeaningful = /[.!?]$/.test(text) && !text.startsWith('For') && !text.startsWith('Also');
        const hasKeyword = keyword ? text.toLowerCase().includes(keyword.toLowerCase()) : false;
        passages.push({ text: text.slice(0, 250), wordCount: words, isIndependentlyMeaningful, hasKeyword, passageScore: (isIndependentlyMeaningful ? 50 : 20) + (hasKeyword ? 30 : 0) + (words >= 40 && words <= 60 ? 20 : 10) });
      }
    });
    const topPassages = passages.sort((a, b) => b.passageScore - a.passageScore).slice(0, 5);
    const avgScore = topPassages.length > 0 ? Math.round(topPassages.reduce((a, p) => a + p.passageScore, 0) / topPassages.length) : 0;
    res.json({ ok: true, totalPassagesAnalysed: passages.length, topPassages, passageIndexingScore: avgScore, optimizationTips: ['Write self-contained paragraphs that answer one specific question', 'Aim for 40-60 word paragraphs for best snippet eligibility', 'Start each section with a direct answer, not a question'] });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 51. AI Content Visibility Score */
router.post('/ai/content-visibility', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const title = $('title').first().text();
    const h1 = $('h1').first().text();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const wordCount = text.split(/\s+/).length;
    const hasFAQ = html.includes('"FAQPage"');
    const hasArticle = html.includes('"Article"') || html.includes('"BlogPosting"');
    const prompt = `Assess the overall AI/LLM search visibility and Google SERP visibility for this content. Target keyword: "${keyword || 'general topic'}". Title: "${title}", H1: "${h1}", Word count: ${wordCount}, FAQ schema: ${hasFAQ}, Article schema: ${hasArticle}. Content snippet: ${text.slice(0, 1000)}. Return JSON: {"visibilityScore":0-100,"llmCitationLikelihood":"high|medium|low","googleAIOLikelihood":"high|medium|low","serpVisibility":{"featuredSnippet":0-100,"paa":0-100,"imageRank":0-100,"videoRank":0-100},"topStrengths":["3 things making this visible"],"topWeaknesses":["3 visibility blockers"],"actionPlan":["5 ranked actions to boost visibility"],"predictedRankingPosition":"1-3|4-10|11-20|20+"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, title, wordCount, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ══════════════════════════════════════════════════
   BATCH 4 — SERP & CTR + BACKLINKS + CONTENT EXTRAS
   Routes 52-72
   ══════════════════════════════════════════════════ */

/* 52. SERP CTR Optimizer */
router.post('/serp/ctr-optimizer', async (req, res) => {
  try {
    const { title, metaDescription, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });
    const prompt = `Analyze this page's click-through-rate potential in Google SERPs. Title: "${title}". Meta description: "${metaDescription || 'none'}". Target keyword: "${keyword || 'unspecified'}". Return JSON: {"ctrScore":0-100,"titleScore":0-100,"descScore":0-100,"titleIssues":["list of issues"],"descIssues":["list of issues"],"emotionalTriggers":["triggers present or missing"],"powerWords":["suggested power words to add"],"improvedTitle":"optimized title ≤60 chars","improvedDesc":"optimized meta ≤155 chars","estimatedCTRLift":"e.g. +15-25%"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 53. Search Intent Classifier */
router.post('/serp/intent-classifier', async (req, res) => {
  try {
    const { keyword, url, content, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword && !content) return res.status(400).json({ ok: false, error: 'keyword or content required' });
    const prompt = `Classify the search intent for: keyword="${keyword || ''}", content snippet="${(content || '').slice(0, 500)}". Return JSON: {"primaryIntent":"informational|navigational|transactional|commercial","confidence":0-100,"subIntent":"e.g. how-to|comparison|review|definition","contentMatch":0-100,"contentMatchExplanation":"why this score","recommendations":["3 ways to better match intent"],"targetAudience":"who is searching this","buyerStage":"awareness|consideration|decision|retention"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 54. SERP Feature Targets */
router.post('/serp/feature-targets', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1200);
    const hasFAQ = html.includes('"FAQPage"');
    const hasHowTo = html.includes('"HowTo"');
    const hasTable = $('table').length > 0;
    const hasVideo = $('iframe, video').length > 0;
    const hasNumberedList = $('ol').length > 0;
    const prompt = `Identify which Google SERP features this content is eligible for and how to win them. Content snippet: "${text}". Keyword: "${keyword || ''}". Has FAQ schema: ${hasFAQ}, HowTo schema: ${hasHowTo}, tables: ${hasTable}, video: ${hasVideo}, numbered lists: ${hasNumberedList}. Return JSON: {"eligibleFeatures":[{"feature":"featured snippet|PAA|image pack|video carousel|knowledge panel|sitelinks|HowTo|FAQ","eligibility":0-100,"currentlyWinning":true|false,"stepsToWin":["actions"]}],"topOpportunity":"best feature to target","priorityActions":["top 5 actions ranked by impact"]}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 55. People Also Ask Generator */
router.post('/serp/paa-generator', async (req, res) => {
  try {
    const { keyword, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    const prompt = `Generate realistic "People Also Ask" questions for the keyword "${keyword}" in the "${niche || 'general'}" niche. These should match real PAA box patterns on Google. Return JSON: {"questions":[{"question":"full question text","answerSnippet":"concise 40-60 word answer ideal for PAA","intent":"informational|definitional|how-to|comparison|why","difficulty":"easy|medium|hard","suggestedH2":true|false}],"totalQuestions":number,"topicClusters":["main topic areas covered"]}. Include 12-15 questions.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, niche, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 56. Rich Result Eligibility Check */
router.post('/serp/rich-result-check', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const schemaMatches = html.match(/"@type"\s*:\s*"([^"]+)"/g) || [];
    const schemaTypes = [...new Set(schemaMatches.map(m => m.match(/"([^"]+)"$/)?.[1]).filter(Boolean))];
    const hasBreadcrumb = schemaTypes.includes('BreadcrumbList');
    const hasFAQ = schemaTypes.includes('FAQPage');
    const hasArticle = schemaTypes.includes('Article') || schemaTypes.includes('BlogPosting');
    const hasProduct = schemaTypes.includes('Product');
    const hasReview = schemaTypes.includes('Review') || schemaTypes.includes('AggregateRating');
    const hasHowTo = schemaTypes.includes('HowTo');
    const hasOrg = schemaTypes.includes('Organization') || schemaTypes.includes('LocalBusiness');
    const eligible = [];
    if (hasFAQ) eligible.push({ type: 'FAQ Rich Result', status: 'eligible', schemaFound: true });
    else eligible.push({ type: 'FAQ Rich Result', status: 'not eligible', schemaFound: false, fix: 'Add FAQPage schema markup' });
    if (hasHowTo) eligible.push({ type: 'HowTo Rich Result', status: 'eligible', schemaFound: true });
    else eligible.push({ type: 'HowTo Rich Result', status: 'not eligible', schemaFound: false, fix: 'Add HowTo schema if content has steps' });
    if (hasArticle) eligible.push({ type: 'Article Rich Result', status: 'eligible', schemaFound: true });
    else eligible.push({ type: 'Article Rich Result', status: 'not eligible', schemaFound: false, fix: 'Add Article/BlogPosting schema' });
    if (hasProduct) eligible.push({ type: 'Product Rich Result', status: 'eligible', schemaFound: true });
    if (hasReview) eligible.push({ type: 'Review Snippets', status: 'eligible', schemaFound: true });
    if (hasBreadcrumb) eligible.push({ type: 'Breadcrumb', status: 'eligible', schemaFound: true });
    else eligible.push({ type: 'Breadcrumb', status: 'not eligible', schemaFound: false, fix: 'Add BreadcrumbList schema' });
    res.json({ ok: true, url, schemasDetected: schemaTypes, richResults: eligible, totalEligible: eligible.filter(e => e.status === 'eligible').length, totalMissing: eligible.filter(e => e.status === 'not eligible').length });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 57. RankBrain / UX Advisor */
router.post('/serp/rankbrain-advisor', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const intro = text.slice(0, 300);
    const wordCount = text.split(/\s+/).length;
    const paragraphs = text.split(/\n\n+/).length;
    const avgParaLen = Math.round(wordCount / Math.max(paragraphs, 1));
    const hasImages = $('img').length;
    const hasVideo = $('iframe, video').length;
    const prompt = `Audit this page for Google RankBrain UX signals (dwell time, bounce rate, CTR factors). Opening paragraph: "${intro}". Word count: ${wordCount}, Average paragraph length: ${avgParaLen} words, Images: ${hasImages}, Videos: ${hasVideo}. Return JSON: {"dwellTimeScore":0-100,"bounceRiskScore":0-100,"openingHookStrength":"strong|moderate|weak","openingHookFeedback":"brief analysis","paragraphLengthFeedback":"too long|good|inconsistent","multimediaScore":0-100,"readabilityFeedback":"brief assessment","topImprovements":[{"area":"string","issue":"string","fix":"string","expectedImpact":"high|medium|low"}],"predictedDwellTime":"<1 min|1-2 min|2-3 min|3+ min"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, wordCount, avgParaLen, hasImages, hasVideo, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 58. Long-tail Title Embedder */
router.post('/serp/longtail-embedder', async (req, res) => {
  try {
    const { title, primaryKeyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!title || !primaryKeyword) return res.status(400).json({ ok: false, error: 'title and primaryKeyword required' });
    const prompt = `Find long-tail keyword variations that can be naturally embedded in this title: "${title}". Primary keyword: "${primaryKeyword}". Return JSON: {"longTailVariants":[{"keyword":"long-tail term","searchVolume":"low|medium|high estimate","difficulty":"easy|medium|hard","revisedTitle":"natural title with this embedded ≤60 chars","explanation":"why this works"}],"bestVariant":"the best recommendation","titleLengthCurrent":${title.length},"strategy":"brief advice on multi-keyword title targeting"}. Include 5-7 variants.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, originalTitle: title, primaryKeyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 59. Meta Description A/B Variants */
router.post('/serp/meta-ab-variants', async (req, res) => {
  try {
    const { title, keyword, content, model = 'gpt-4o-mini' } = req.body || {};
    if (!title && !content) return res.status(400).json({ ok: false, error: 'title or content required' });
    const prompt = `Generate 5 distinct A/B meta description variants for a page. Title: "${title || ''}". Target keyword: "${keyword || ''}". Content summary: "${(content || '').slice(0, 400)}". Each variant should use a different psychological trigger. Return JSON: {"variants":[{"id":"A|B|C|D|E","description":"meta desc ≤155 chars","trigger":"curiosity|urgency|social proof|benefit|question","ctrEstimate":"high|medium","keywordPlacement":"start|middle|end","characterCount":number,"analysis":"why this works"}],"recommended":"A|B|C|D|E","testingAdvice":"brief A/B testing strategy"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, title, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 60. Keyword Difficulty Estimator */
router.post('/serp/difficulty-score', async (req, res) => {
  try {
    const { keyword, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    const prompt = `Estimate SEO keyword difficulty and potential for: "${keyword}" in the "${niche || 'general'}" niche. Return JSON: {"keyword":"${keyword}","estimatedDifficulty":0-100,"difficultyLabel":"very easy|easy|medium|hard|very hard","estimatedMonthlySearches":"<100|100-500|500-1k|1k-5k|5k-20k|20k+","commercialIntent":0-100,"cpcEstimate":"low <$1|medium $1-5|high $5-20|very high $20+","topCompetitors":["3 likely top-ranking site types"],"rankingTimeframe":"1-2 months|3-6 months|6-12 months|12+ months","contentStrategy":"best content type to target this","quickWinPotential":true|false,"quickWinExplanation":"why or why not"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 61. SERP Competitor Snapshot */
router.post('/serp/competitor-snapshot', async (req, res) => {
  try {
    const { keyword, url, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    const prompt = `Create a fictional but realistic SERP competitor analysis for the keyword "${keyword}". If a URL is provided (${url || 'none'}), compare against these typical competitors. Return JSON: {"keyword":"${keyword}","topCompetitors":[{"position":1-5,"contentType":"listicle|guide|review|tool|news","estimatedWordCount":number,"keyStrength":"what makes it rank","titlePattern":"example title format","schemaUsed":["types"],"estimatedDA":"low 20-40|medium 40-60|high 60-80|very high 80+"} x5],"contentGaps":["topics top pages cover that might be missing"],"contentOpportunities":["ways to differentiate and outrank"],"minimumWordCount":number,"recommendedContentType":"best format to compete","snippetOpportunity":true|false}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── BACKLINKS ─── */

/* 62. Backlink Opportunity Finder */
router.post('/backlinks/opportunity-finder', async (req, res) => {
  try {
    const { niche, url, model = 'gpt-4o-mini' } = req.body || {};
    if (!niche && !url) return res.status(400).json({ ok: false, error: 'niche or url required' });
    const prompt = `Generate a realistic list of backlink opportunities for a ${niche || 'general'} website${url ? ' at ' + url : ''}. Return JSON: {"opportunities":[{"type":"guest post|resource page|broken link|skyscraper|unlinked mention|directory|podcast|scholarship|roundup","sourceDomain":"example site type e.g. industry blog, university, news site","difficulty":"easy|medium|hard","estimatedDA":"low|medium|high|very high","linkType":"dofollow|nofollow|varies","tactic":"specific approach to get this link","emailTemplate":"2-sentence outreach opener","timeToAcquire":"days|weeks|months","linkValue":"low|medium|high|very high"}],"topQuickWin":"best fast opportunity","strategicPriority":"best long-term opportunity","monthlyLinkTarget":number}. Include 10 opportunities.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, niche, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 63. Competitor Link Gap Analyzer */
router.post('/backlinks/link-gap', async (req, res) => {
  try {
    const { yourDomain, competitor1, competitor2, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!yourDomain) return res.status(400).json({ ok: false, error: 'yourDomain required' });
    const prompt = `Analyze the backlink gap between ${yourDomain} and competitors: ${competitor1 || 'competitor-1.com'}, ${competitor2 || 'competitor-2.com'} in the ${niche || 'general'} niche. Return JSON: {"yourDomain":"${yourDomain}","gapAnalysis":{"estimatedYourLinks":"low <100|medium 100-1k|high 1k-10k|very high 10k+","estimatedCompetitorLinks":"same scale","gapScore":0-100,"gapSeverity":"minimal|moderate|significant|critical"},"topLinkSources":["10 specific site types that likely link to competitors but not you"],"linkCategories":[{"type":"category e.g. industry associations","competitorHas":true,"youHave":false,"howToGet":"brief tactic"}],"prioritizedActions":["5 ranked actions to close the gap"],"timeToCloseGap":"3-6 months|6-12 months|12-24 months"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 64. Outreach Email Generator */
router.post('/backlinks/outreach-generator', async (req, res) => {
  try {
    const { targetSite, yourSite, contentTitle, contentUrl, outreachType, model = 'gpt-4o-mini' } = req.body || {};
    if (!contentTitle) return res.status(400).json({ ok: false, error: 'contentTitle required' });
    const prompt = `Write a personalized, professional outreach email for link building. Type: "${outreachType || 'guest post'}". Your site: "${yourSite || 'my website'}". Target site: "${targetSite || 'their website'}". Content: "${contentTitle}"${contentUrl ? ' at ' + contentUrl : ''}. Return JSON: {"subject":"compelling email subject","emailBody":"full email 150-200 words, conversational, includes 'because' naturally, not spammy","followUpSubject":"follow-up subject 4 days later","followUpBody":"brief follow-up 50-80 words","tipsForPersonalization":["3 ways to customize this before sending"],"successProbability":"low 5-15%|medium 15-30%|high 30%+","keyPsychologyUsed":["persuasion principles used"]}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, contentTitle, outreachType, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 65. "Best Of" List Finder */
router.post('/backlinks/bestof-finder', async (req, res) => {
  try {
    const { niche, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!niche && !keyword) return res.status(400).json({ ok: false, error: 'niche or keyword required' });
    const prompt = `Generate realistic "best of" list and roundup post opportunities for link building in the "${niche || keyword}" space. Return JSON: {"searchStrings":["10 Google search strings to find these lists e.g. 'best [niche] blogs 2025'"],"listTypes":[{"type":"e.g. best blogs list|weekly roundup|expert tools list","example":"sample post title","frequency":"one-time|weekly|monthly|annual","linkType":"dofollow|usually dofollow|varies","outreachApproach":"how to get featured","difficulty":"easy|medium|hard"}],"topTargetTypes":["3 most valuable list types for your niche"],"pitchTemplate":"2-sentence pitch to get included in a list","seasonalOpportunities":["time-sensitive list opportunities e.g. annual awards"]}. Include 6 list types.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, niche, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 66. Anchor Text Optimizer */
router.post('/backlinks/anchor-optimizer', async (req, res) => {
  try {
    const { targetKeyword, url, currentAnchors, model = 'gpt-4o-mini' } = req.body || {};
    if (!targetKeyword) return res.status(400).json({ ok: false, error: 'targetKeyword required' });
    const prompt = `Optimize the anchor text profile for a page targeting "${targetKeyword}"${url ? ' at ' + url : ''}. Current anchors: ${JSON.stringify(currentAnchors || [])}. Return JSON: {"targetKeyword":"${targetKeyword}","idealDistribution":{"exactMatch":"5-10%","partialMatch":"25-35%","branded":"20-30%","generic":"20-30%","naked":"10-15%"},"currentDistributionAssessment":"${currentAnchors?.length ? 'based on provided anchors' : 'no data provided'}: over-optimized|natural|under-optimized","recommendedAnchors":[{"anchorText":"specific text","type":"exact|partial|branded|generic|naked","priority":"primary|secondary","usageRecommendation":"use for X% of links","naturalContext":"example sentence using this anchor"}],"warnings":["over-optimization risks"],"nextSteps":["3 actionable anchor text diversification steps"]}. Provide 8-10 recommended anchors.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, targetKeyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 67. Link Building Strategy Builder */
router.post('/backlinks/strategy-builder', async (req, res) => {
  try {
    const { domain, niche, monthlyBudget, timeframe, model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
    const prompt = `Build a comprehensive link building strategy for a ${niche} website${domain ? ' (' + domain + ')' : ''}. Budget: ${monthlyBudget || 'minimal/free tactics only'}. Timeframe: ${timeframe || '6 months'}. Return JSON: {"strategyName":"catchy name for this strategy","overview":"2-3 sentence summary","phases":[{"phase":1-3,"name":"phase name","duration":"weeks/months","primaryTactic":"main focus","targetLinks":number,"expectedDA":"domain authority range of links expected","actions":["4-5 specific actions"],"kpis":["success metrics"]}],"tackicsPrioritized":[{"tactic":"string","effort":"low|medium|high","impact":"low|medium|high","costEstimate":"free|$50-200/mo|$200-500/mo|$500+/mo","timeToResults":"weeks|months"}],"monthlyLinkTarget":number,"6MonthLinkProjection":number,"riskFactors":["potential penalties or issues to watch for"],"toolsRecommended":["free tools to use"]}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, niche, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 68. Internal Link Suggester */
router.post('/backlinks/internal-suggester', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const existingLinks = $('a[href]').map((_, el) => $(el).attr('href')).get().filter(h => h.startsWith('/') || h.includes(new URL(url).hostname)).slice(0, 20);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000);
    const h2s = $('h2').map((_, el) => $(el).text()).get().slice(0, 8);
    const prompt = `Analyze this page's content and suggest internal linking opportunities. Page URL: "${url}". H2 headings: ${JSON.stringify(h2s)}. Content snippet: "${text}". Existing internal links: ${existingLinks.length}. Return JSON: {"currentInternalLinkCount":${existingLinks.length},"internalLinkScore":0-100,"assessment":"too few|adequate|good|excellent","suggestedLinkOpportunities":[{"anchorTextSuggestion":"text from content","targetPageType":"e.g. related blog post|product page|resource","pageDescription":"what the target page should be about","importance":"high|medium|low","locationInContent":"intro|body|conclusion|callout"}],"orphanRisk":"high|medium|low","orphanRiskExplanation":"brief","recommendations":["4 internal linking improvement actions"]}. Include 6-8 opportunities.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, existingLinksDetected: existingLinks.length, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── CONTENT EXTRAS ─── */

/* 69. Content Freshness Score */
router.post('/content/freshness-score', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const publishDate = $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').first().attr('datetime') || '';
    const modDate = $('meta[property="article:modified_time"]').attr('content') || '';
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const yearMatches = text.match(/\b(20\d{2})\b/g) || [];
    const years = [...new Set(yearMatches)].sort();
    const prompt = `Assess the freshness of this content. URL: "${url}". Published: "${publishDate || 'unknown'}". Modified: "${modDate || 'unknown'}". Year references found in text: ${JSON.stringify(years)}. Content snippet: "${text}". Return JSON: {"freshnessScore":0-100,"freshnessLabel":"fresh|recent|aging|stale|outdated","publishDateDetected":"${publishDate || 'not found'}","lastModifiedDetected":"${modDate || 'not found'}","daysOldEstimate":"<30|30-90|90-180|180-365|365-730|730+","outdatedSignals":["specifics found that indicate aging content"],"freshnessSignals":["specifics indicating recent content"],"updatePriority":"immediate|within 3 months|within 6 months|low priority","updateRecommendations":["5 specific things to update"],"freshnessSEOImpact":"high|medium|low","freshnessSEOExplanation":"brief"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, publishDate, modDate, yearRefs: years, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 70. Skyscraper Gap Finder */
router.post('/content/skyscraper-gap', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const h2s = $('h2,h3').map((_, el) => $(el).text()).get().slice(0, 15);
    const wordCount = text.split(/\s+/).length;
    const prompt = `Apply the Skyscraper Technique to find content gaps for improving this page to outrank competitors. Keyword: "${keyword || 'inferred from content'}". Current word count: ${wordCount}. Headings: ${JSON.stringify(h2s)}. Content preview: "${text.slice(0, 800)}". Return JSON: {"currentQualityScore":0-100,"skyscraperPotential":"low|medium|high|very high","contentGaps":[{"gap":"missing topic/section","importance":"critical|high|medium|low","suggestedH2":"heading for this section","contentBrief":"what to cover in 2-3 sentences","estimatedWordAdd":number}],"recommendedNewWordCount":number,"currentWordCount":${wordCount},"wordCountGap":number,"uniqueAngles":["differentiation strategies vs competitors"],"linkBaitElements":["elements to add that attract backlinks"],"upgradeActions":["ranked action plan"]}. Include 8-10 gaps.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, currentWordCount: wordCount, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 71. Content Relaunch Advisor */
router.post('/content/relaunch-advisor', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const publishDate = $('meta[property="article:published_time"]').attr('content') || '';
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).length;
    const h2s = $('h2,h3').map((_, el) => $(el).text()).get().slice(0, 10);
    const prompt = `Create a content relaunch plan for this post to boost organic traffic. Published: "${publishDate || 'unknown'}". Keyword: "${keyword || 'inferred'}". Word count: ${wordCount}. Headings: ${JSON.stringify(h2s)}. Content preview: "${text.slice(0, 600)}". Return JSON: {"relunchScore":0-100,"relunchWorthiness":"not worth it|maybe|yes|definitely","reasoning":"2-3 sentences","relunchPlan":{"step1ContentAudit":"what to review and remove","step2UpdateData":"what data/stats to refresh","step3AddSections":["new sections to add"],"step4UpdateExamples":"how to modernize examples","step5SEOTUNEUP":"title/meta/schema updates","step6PromotionPlan":["how to re-promote: email list|social|outreach"]},"estimatedTrafficLift":"10-25%|25-50%|50-100%|100%+","timeToComplete":"hours|1-2 days|3-5 days|1-2 weeks","relunchTitle":"suggested updated title","relunchMeta":"suggested updated meta description"}`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, wordCount, publishDate, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 72. Semantic Enrichment Tool */
router.post('/content/semantic-enrichment', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url && !keyword) return res.status(400).json({ ok: false, error: 'url or keyword required' });
    let text = '';
    if (url) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
        const html = await r.text();
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000);
      } catch (_) {}
    }
    const prompt = `Identify semantic SEO enrichment opportunities for a page targeting "${keyword || 'the main topic'}". Content snippet: "${text || 'no content provided'}". Return JSON: {"semanticScore":0-100,"semanticLabel":"thin|basic|moderate|rich|comprehensive","lsiTermsMissing":["LSI keywords absent from content"],"relatedTopicsToAdd":["related subtopics that would help Google understand the topic"],"entityMentions":{"found":["entities already present"],"missing":["important entities to add e.g. brands, people, places"]},"semanticEnrichments":[{"term":"word or phrase","type":"LSI|entity|synonym|topic","importance":"critical|high|medium","suggestedUsage":"how and where to add it","exampleSentence":"natural example sentence"}],"topicCompleteness":0-100,"hummingbirdAlignmentScore":0-100,"topActions":["5 ranked semantic enrichment actions"]}. Include 12-15 enrichment suggestions.`;
    const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

module.exports = router;


