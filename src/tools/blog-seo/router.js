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

const { fetchForAnalysis } = require('../../core/shopifyContentFetcher');

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
    const { url, keywords, articleId, blogId } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url is required' });

    let html;

    // If articleId+blogId provided, fetch directly from Shopify Admin API
    // (bypasses storefront password on dev stores)
    if (articleId && blogId) {
      try {
        const shopTokens = require('../../core/shopTokens');
        const shop = req.session?.shop
          || req.headers['x-shopify-shop-domain']
          || (shopTokens.loadAll ? (() => { const all = shopTokens.loadAll(); const keys = Object.keys(all || {}); return keys.length === 1 ? keys[0] : null; })() : null)
          || process.env.SHOPIFY_STORE_URL || null;
        const token = shop && (shopTokens.getToken ? shopTokens.getToken(shop) : (process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN || null));
        if (shop && token) {
          const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
          const artRes = await fetch(
            `https://${shop}/admin/api/${ver}/blogs/${blogId}/articles/${articleId}.json?fields=id,title,body_html,summary_html,tags,author,published_at,handle,image`,
            { headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' } }
          );
          if (artRes.ok) {
            const artJson = await artRes.json();
            const a = artJson.article || {};
            const summary = (a.summary_html || '').replace(/<[^>]+>/g, '').trim();
            const blogHandle = url.match(/\/blogs\/([^/]+)\//)?.[1] || 'news';
            html = `<!DOCTYPE html><html lang="en"><head>`
              + `<title>${(a.title||'').replace(/</g,'&lt;')}</title>`
              + (summary ? `<meta name="description" content="${summary.replace(/"/g, '&quot;').slice(0,320)}">` : '')
              + (a.published_at ? `<meta property="article:published_time" content="${a.published_at}">` : '')
              + (a.author ? `<meta name="author" content="${a.author.replace(/"/g,'&quot;')}">` : '')
              + `<meta property="og:title" content="${(a.title||'').replace(/"/g,'&quot;')}">`
              + (summary ? `<meta property="og:description" content="${summary.replace(/"/g,'&quot;').slice(0,320)}">` : '')
              + (a.image?.src ? `<meta property="og:image" content="${a.image.src}">` : '')
              + `<meta name="viewport" content="width=device-width, initial-scale=1">`
              + `<link rel="canonical" href="${url}">`
              + `</head><body>`
              + `<article>`
              + `<h1>${(a.title||'').replace(/</g,'&lt;')}</h1>`
              + (a.tags ? `<div class="tags">${a.tags}</div>` : '')
              + (a.body_html || '')
              + `</article>`
              + `</body></html>`;
          }
        }
      } catch (_e) { /* fall through to URL fetch */ }
    }

    if (!html) {
      try {
        const fetched = await fetchForAnalysis(url, req);
        html = fetched.html;
        if (fetched.warning) console.warn('[blog-seo/analyze] warning:', fetched.warning);
      } catch (fetchErr) {
        return res.status(502).json({ ok: false, error: `Failed to fetch: ${fetchErr.message}` });
      }
    }
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

    /* ── AI CITATION READINESS / GEO (Feb 2026) ── */
    // Only 12% of Google AI Mode citations match organic SERP URLs (Moz, Feb 2026).
    // Score content on signals that improve eligibility for AI search citations.
    const authorityDomainRx = /\.(gov|edu)\b|wikipedia\.org|pubmed\.ncbi|ncbi\.nlm\.nih|reuters\.com|apnews\.com|bbc\.|nytimes\.com|forbes\.com|harvard\.|stanford\./i;
    const outboundAuthoritativeLinks = externalLinkDetails.filter(l => authorityDomainRx.test(l.href || ''));
    const outboundAuthoritativeCount = outboundAuthoritativeLinks.length;
    const firstPersonRx = /\b(I('ve| have| tested| found| tried| recommend|'m| am| was)\b| in my experience\b| based on my\b| we tested\b| we found\b| we recommend\b)/i;
    const hasFirstPersonExpertise = firstPersonRx.test(bodyText.slice(0, 30000));
    const definitionRx = /\b(is a |is an |refers to |is defined as |can be defined as )/gi;
    const definitionCount = (bodyText.match(definitionRx) || []).length;
    const directAnswerRx = /^(yes[,.] |no[,.] |the (best|answer|short answer|key|main)\b|here's (how|what)|in short[,:] |to summarize[,:] |the answer is\b)/i;
    const directAnswerParagraphs = paragraphs.filter(p => directAnswerRx.test(p.trim())).length;
    const aiCitationScore = Math.min(100, Math.round(
      Math.min(20, outboundAuthoritativeCount * 10) +
      (hasFirstPersonExpertise ? 20 : 0) +
      Math.round(Math.min(3, definitionCount) / 3 * 20) +
      Math.min(20, directAnswerParagraphs * 10) +
      ((hasFaqSection || questionHeadingCount >= 2) ? 20 : Math.min(20, questionHeadingCount * 10))
    ));
    const aiCitationReadiness = {
      score: aiCitationScore,
      grade: aiCitationScore >= 80 ? 'Strong' : aiCitationScore >= 50 ? 'Moderate' : 'Weak',
      outboundAuthoritativeCount,
      outboundAuthoritativeLinks: outboundAuthoritativeLinks.slice(0, 10),
      hasFirstPersonExpertise,
      definitionCount,
      directAnswerParagraphs,
      hasStructuredQA: hasFaqSection || questionHeadingCount >= 2,
      note: 'Only 12% of Google AI Mode citations match organic SERP URLs (Moz, Feb 2026). Authoritative citations, direct-answer formatting, and first-person expertise signals increase AI citation eligibility.',
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
      outboundAuthoritativeCount, hasFirstPersonExpertise,
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
      aiCitationReadiness,
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
  /* ── GEO / AI CITATION SIGNALS (2026) ── */
  if (d.outboundAuthoritativeCount != null && d.outboundAuthoritativeCount === 0) { content -= 5; addIssue('content', 'low', 5, 'No authoritative outbound citations (.gov, .edu, Wikipedia, Reuters) — citing credible sources improves GEO visibility in ChatGPT, Gemini, and Perplexity'); }
  if (d.hasFirstPersonExpertise === false && d.wordCount > 800) { content -= 4; addIssue('content', 'low', 4, 'No first-person expertise signals detected ("I tested", "in my experience") — demonstrable lived experience strengthens E-E-A-T and AI citation likelihood (Google AI Mode, Feb 2026)'); }

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
    const { url, title, metaDescription, h1, wordCount, headings, keywords, scored, aiCitationReadiness } = req.body || {};
    const systemPrompt = `You are an expert blog SEO consultant for Shopify e-commerce stores. Analyze the blog post data and return actionable recommendations including GEO (Generative Engine Optimisation) readiness — critical in 2026 as only 12% of Google AI Mode citations match organic SERP URLs. Return JSON with: { assessment: string, strengths: string[], weaknesses: string[], contentGaps: string[], recommendations: [{ priority: "critical"|"recommended"|"optional", title: string, description: string }], topicSuggestions: string[], estimatedTrafficPotential: string, geoReadiness: { score: "poor"|"fair"|"good", summary: string, signals: string[], recommendations: string[] } }`;
    const userPrompt = `Analyze this blog post:\nURL: ${url}\nTitle: ${title}\nH1: ${h1}\nMeta Description: ${metaDescription}\nWord Count: ${wordCount}\nHeadings: ${JSON.stringify((headings || []).slice(0, 20))}\nKeywords: ${keywords || 'none specified'}\nSEO Score: ${scored?.overall || 'N/A'}/100\nIssues: ${scored?.issueCount || 0} (${scored?.highIssues || 0} high)\nAI Citation Readiness: ${aiCitationReadiness ? `Score ${aiCitationReadiness.score}/100 (${aiCitationReadiness.grade}) — authoritative outbound links: ${aiCitationReadiness.outboundAuthoritativeCount}, first-person expertise: ${aiCitationReadiness.hasFirstPersonExpertise}, definitions: ${aiCitationReadiness.definitionCount}, direct-answer paragraphs: ${aiCitationReadiness.directAnswerParagraphs}, structured Q&A: ${aiCitationReadiness.hasStructuredQA}` : 'not provided'}\n\nProvide a thorough blog SEO analysis with actionable recommendations, including specific GEO improvements.`;

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

    const systemPrompt = `You are an expert content strategist for e-commerce blogs. Generate a comprehensive content brief optimised for both traditional SEO and GEO (Generative Engine Optimisation — visibility in ChatGPT, Gemini, Perplexity). As of Feb 2026, only 12% of Google AI Mode citations match organic search results, so briefs must address both signals. Return JSON with: { title: string, metaTitle: string, metaDescription: string, h1: string, targetWordCount: number, outline: [{ heading: string, subheadings: string[], wordCount: number, notes: string }], keywordStrategy: { primary: string, secondary: string[], lsi: string[] }, searchIntent: string, competitorGaps: string[], uniqueAngles: string[], cta: string, estimatedRank: string, geo: { entityTargets: string[], authoritySources: string[], firstPersonSignalIdeas: string[], directAnswerSections: string[], aiAnswerFormatTips: string[] } }`;
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

    const limits = { title: '50-60 characters', metaDescription: '150-160 characters', h1: '20-70 characters', handle: 'URL slug: all-lowercase with hyphens, max 60 chars, no stop words', headings: '5-8 words each, H2 heading format' };
    const isHandle = field === 'handle';
    const isHeadings = field === 'headings';
    const systemPrompt = isHandle
      ? `You are an SEO specialist. Generate 5 URL slug variants for a Shopify blog post. Each must be lowercase, hyphens only, 30-60 chars, contain the target keyword, no stop words. Return JSON: { field: "handle", variants: [{ text: string, charCount: number, keywordPresent: boolean, ctaStrength: string }] }`
      : isHeadings
      ? `You are an SEO content strategist. Generate 5 H2 subheading structures (4-6 H2s each) for a blog post. Each structure should cover different angles of the topic and include keyword variations. Return JSON: { field: "headings", variants: [{ text: string, charCount: number, keywordPresent: boolean, ctaStrength: string }] } where text is a comma-separated list of H2 headings.`
      : `You are an SEO copywriter for e-commerce blogs. Generate 5 optimized variants for the blog post's ${field}. Each variant should be ${limits[field] || 'concise'}, include the target keyword naturally, and be compelling for CTR. Return JSON with: { field: string, variants: [{ text: string, charCount: number, keywordPresent: boolean, ctaStrength: string }] }`;
    const userPrompt = isHeadings
      ? `Blog title: "${currentValue}"\nKeywords: ${keywords || 'none'}\n\nGenerate 5 sets of H2 subheadings (4-6 H2s per set) covering the full topic structure. Each set's "text" field should list the H2s separated by " | "."`
      : `Current ${field}: "${currentValue}"\nKeywords: ${keywords || 'none'}\nURL: ${url || 'N/A'}\n\nGenerate 5 SEO-optimized variants.`;

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

// NOTE: AI internal-link suggestions → use /api/internal-link-optimizer/ai/suggest

/* =========================================================================
   AI: EXPAND CONTENT — generate full HTML sections to pad out a thin post
   ========================================================================= */
router.post('/ai/expand-content', async (req, res) => {
  try {
    const { title, h1, keywords, url, currentWordCount, targetWords } = req.body || {};
    if (!title && !h1) return res.status(400).json({ ok: false, error: 'title or h1 required' });
    const target = targetWords || 350;
    const current = currentWordCount || 0;
    const needed = Math.max(target - current, 200);
    const systemPrompt = `You are an expert SEO content writer for Shopify e-commerce blogs. Write high-quality, unique blog content in clean HTML. Use only these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>. No <html>/<body>/<head> tags. No markdown. No code blocks. Write naturally, include the keyword multiple times, and make the content genuinely useful to readers.`;
    const userPrompt = `Post title: "${title || h1}"
Target keyword: ${keywords || title || h1}
URL: ${url || 'N/A'}
Current word count: ${current} words

Write approximately ${needed} more words of useful content to add to this post. Include 2-3 subheadings (h2), several paragraphs, and where relevant a list. Make it feel like a natural continuation of the article. Return only the HTML content, nothing else.`;
    const completion = await getOpenAI().chat.completions.create({
      model: req.body.model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.7,
    });
    const html = completion.choices[0]?.message?.content?.trim() || '';
    if (!html) return res.status(500).json({ ok: false, error: 'AI returned no content' });
    const wordCount = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    res.json({ ok: true, html, wordCount });
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
      messages: [{ role: 'system', content: 'You are an expert blog SEO assistant for Shopify e-commerce stores. Give specific, actionable advice about blog SEO strategy, content optimization, keyword targeting, and technical SEO. Be concise but thorough. Stay current with 2026 developments: (1) Google\'s AI Mode only cites 12% of organic-ranking URLs — recommend GEO strategies like entity-rich writing, authoritative outbound citations (.gov/.edu/Wikipedia), and direct-answer paragraph formatting; (2) Google\'s site reputation abuse policy (Nov 2024) targets AI-generated filler hosted on high-DA sites — always recommend adding named author attribution, first-hand experience signals, and genuine expertise; (3) FAQ rich results were deprecated for most sites in June 2025 — advise users not to rely on FAQ schema for SERP features; (4) Google\'s February 2026 Discover Core Update rewards genuinely useful, evergreen content with strong freshness signals.' }, ...messages.slice(-20)],
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
        const fetched = await fetchForAnalysis(blogUrl, req);
        const html = fetched.html;
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
      const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    res.json({
      ok: true, schema, jsonLd, scriptTag, faqs, aiGenerated: useAI,
      deprecationNotice: 'As of June 2025, Google no longer shows FAQ rich results for most websites (Google Search Central). This schema remains valid for assistive technology and semantic markup, but will not produce visual FAQ accordions in Google Search for the majority of sites. Consider using it primarily for screen-reader accessibility and AI crawler context.',
    });
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
      const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
      const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
      const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
      const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis } = require('../../core/shopifyContentFetcher');
    const fetched = await fetchForAnalysis(url, req);
    const html = fetched.html;
    const $ = cheerio.load(html);
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

    const { fetchForAnalysis } = require('../../core/shopifyContentFetcher');
    const artFetched = await fetchForAnalysis(url, req);
    const html = artFetched.html;
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
      const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
      const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }] });
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
      const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
      const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
      const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
      const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
      const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
      const { html } = await _fetchPageHtml(url, req);
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

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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

    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer,header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);
    const prompt = `Analyze the emotional tone of this blog content. Return JSON: {"primaryTone":"informative|persuasive|inspirational|urgent|neutral|conversational","toneScore":0-100,"positivity":0-100,"urgency":0-100,"trustworthiness":0-100,"emotions":["list of 3-5 detected emotions"],"recommendation":"one actionable improvement tip"}. Content: ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        contentSnippet = $('body').text().slice(0, 1200);
      } catch (_) {}
    }
    const prompt = `For a blog post targeting the primary keyword "${keyword}"${contentSnippet ? `, here is a content snippet: ${contentSnippet}` : ''}, suggest 10 secondary/LSI keywords with search intent. Return JSON: {"secondary":[{"keyword":"...","intent":"informational|commercial|transactional","priority":"high|medium|low","tip":"where to use it"},...],"contentGaps":["2-3 subtopic gaps"],"relatedQuestions":["3 PAA-style questions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        text = $('body').text().slice(0, 800);
      } catch (_) {}
    }
    const prompt = `Optimize for voice search (Google Assistant, Siri, Alexa). Primary keyword: "${keyword}". ${text ? `Content snippet: ${text}` : ''} Return JSON: {"voiceKeywords":["5 conversational question-style queries"],"featuredSnippetTarget":"one ideal paragraph for a snippet (under 50 words)","conversationalAnswers":[{"question":"...","answer":"..."}],"optimizationTips":["3 voice SEO tips"],"score":0-100}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        contentSnippet = $('h1').first().text() + ' ' + $('p').first().text();
      } catch (_) {}
    }
    const prompt = `Write 3 high-converting CTA (call-to-action) paragraphs for a blog post about "${keyword || contentSnippet}". Goal: ${goal}. Each CTA should end blog content and drive user action. Return JSON: {"ctas":[{"variant":"A|B|C","text":"...","buttonText":"...","urgencyLevel":"low|medium|high","conversionPrinciple":"scarcity|authority|reciprocity|social-proof|FOMO","estimatedCTR":0-10}],"bestVariant":"A|B|C","tip":"..."}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3000);
    const prompt = `Extract the 5-7 most important key takeaways from this blog post. Return JSON: {"takeaways":[{"point":"concise key insight (under 20 words)","importance":"critical|important|useful","detail":"1 sentence elaboration"}],"summary":"2-sentence article summary","mainThesis":"core argument in one sentence"}. Content: ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3000);
    const wordTarget = length === 'short' ? '50-80' : length === 'medium' ? '100-150' : '200-250';
    const prompt = `Summarise this blog post in ${wordTarget} words. Return JSON: {"summaryShort":"1 sentence","summaryMedium":"2-3 sentences","summaryLong":"paragraph","tweetThread":["3 tweet-sized points under 280 chars each"],"tldr":"one line TL;DR"}. Content: ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 2500);
    const prompt = `Analyze the writing tone and style of this blog content. Return JSON: {"primaryTone":"formal|casual|authoritative|conversational|persuasive|educational|inspirational","toneScore":0-100,"brandVoice":"description","audienceFit":"who this tone best serves","sentenceStyle":"complex|simple|mixed","vocabulary":"technical|accessible|jargon-heavy","activeVoiceRatio":0-100,"toneConsistency":0-100,"improvements":["2-3 tone improvement suggestions"],"toneProfile":{"formal":0,"casual":0,"authoritative":0,"conversational":0,"persuasive":0}}. Content: ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3500);
    const title = $('title').first().text();
    const prompt = `Grade this blog content on SEO and quality. Title: "${title}"${keyword ? `. Target keyword: "${keyword}"` : ''}. Return JSON: {"overallGrade":"A|B|C|D|F","overallScore":0-100,"categories":{"contentQuality":{"score":0-100,"grade":"A-F","notes":"..."},"seoOptimisation":{"score":0-100,"grade":"A-F","notes":"..."},"userExperience":{"score":0-100,"grade":"A-F","notes":"..."},"eeat":{"score":0-100,"grade":"A-F","notes":"..."},"readability":{"score":0-100,"grade":"A-F","notes":"..."}},"strengths":["3 things done well"],"improvements":["3 priority improvements"],"rankingPotential":"high|medium|low","verdict":"2 sentence assessment"}. Content (first 2500 chars): ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 3000);
    const prompt = `Extract the ${count} best pull-quotes from this blog content for social sharing. Each quote should be compelling, standalone, and shareable. Return JSON: {"quotes":[{"quote":"...","platform":"twitter|linkedin|instagram","charCount":0,"shareability":0-10,"category":"stat|insight|tip|controversial|inspiring"}],"bestQuote":"...","hashtags":["5 relevant hashtags"]}. Content: ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        return cheerio.load(html)('title').first().text();
      } catch (_) { return ''; }
    })() : '');
    if (!title && !keyword) return res.status(400).json({ ok: false, error: 'currentTitle or keyword required' });
    const prompt = `Optimise this blog headline for CTR and SEO: "${title || keyword}". Return JSON: {"originalTitle":"...","analysis":{"powerWords":[],"numbers":false,"curiosityGap":false,"benefitClear":false,"keywordPresent":false},"optimisations":[{"title":"...","improvement":"what was changed","ctrLift":"estimated % CTR improvement","formula":"..."}],"bestVariant":"...","firstSentenceHook":"...","openingLine":"compelling 1-sentence opener that hooks instantly"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const paragraphs = [];
    $('p').each((_, el) => { const t = $(el).text().trim(); if (t.length > 50) paragraphs.push(t); });
    const topPara = paragraphs.slice(0, 8).join(' | ');
    const prompt = `Target keyword: "${keyword}". Optimise these paragraphs for passage indexing (Google shows individual passages in search). Return JSON: {"bestPassage":"the strongest existing passage","optimisedPassage":"rewritten version (40-60 words, direct answer format)","passageScore":0-100,"snippetType":"definition|steps|list|comparison","improvedParagraphs":[{"original":"...","optimised":"...","reason":"..."}]}. Paragraphs: ${topPara.slice(0, 2000)}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().slice(0, 2000);
    const title = $('title').first().text();
    const prompt = `Suggest content repurposing strategies for this blog post: "${title}". Return JSON: {"repurposes":[{"format":"YouTube Video|LinkedIn Post|Twitter Thread|Instagram Carousel|Podcast Episode|Email Newsletter|SlideShare|Infographic|TikTok|Pinterest","effort":"low|medium|high","estimatedReach":"low|medium|high","outline":["3 key points for this format"],"tip":"platform-specific advice"}],"quickWins":["2 easiest repurposing options"],"contentLifespan":"evergreen|timely|seasonal"}. Content: ${text}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1200);
    const hasFAQ = html.includes('"FAQPage"');
    const hasHowTo = html.includes('"HowTo"');
    const hasTable = $('table').length > 0;
    const hasVideo = $('iframe, video').length > 0;
    const hasNumberedList = $('ol').length > 0;
    const prompt = `Identify which Google SERP features this content is eligible for and how to win them. Content snippet: "${text}". Keyword: "${keyword || ''}". Has FAQ schema: ${hasFAQ}, HowTo schema: ${hasHowTo}, tables: ${hasTable}, video: ${hasVideo}, numbered lists: ${hasNumberedList}. Return JSON: {"eligibleFeatures":[{"feature":"featured snippet|PAA|image pack|video carousel|knowledge panel|sitelinks|HowTo|FAQ","eligibility":0-100,"currentlyWinning":true|false,"stepsToWin":["actions"]}],"topOpportunity":"best feature to target","priorityActions":["top 5 actions ranked by impact"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const existingLinks = $('a[href]').map((_, el) => $(el).attr('href')).get().filter(h => h.startsWith('/') || h.includes(new URL(url).hostname)).slice(0, 20);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000);
    const h2s = $('h2').map((_, el) => $(el).text()).get().slice(0, 8);
    const prompt = `Analyze this page's content and suggest internal linking opportunities. Page URL: "${url}". H2 headings: ${JSON.stringify(h2s)}. Content snippet: "${text}". Existing internal links: ${existingLinks.length}. Return JSON: {"currentInternalLinkCount":${existingLinks.length},"internalLinkScore":0-100,"assessment":"too few|adequate|good|excellent","suggestedLinkOpportunities":[{"anchorTextSuggestion":"text from content","targetPageType":"e.g. related blog post|product page|resource","pageDescription":"what the target page should be about","importance":"high|medium|low","locationInContent":"intro|body|conclusion|callout"}],"orphanRisk":"high|medium|low","orphanRiskExplanation":"brief","recommendations":["4 internal linking improvement actions"]}. Include 6-8 opportunities.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const publishDate = $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').first().attr('datetime') || '';
    const modDate = $('meta[property="article:modified_time"]').attr('content') || '';
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const yearMatches = text.match(/\b(20\d{2})\b/g) || [];
    const years = [...new Set(yearMatches)].sort();
    const prompt = `Assess the freshness of this content. URL: "${url}". Published: "${publishDate || 'unknown'}". Modified: "${modDate || 'unknown'}". Year references found in text: ${JSON.stringify(years)}. Content snippet: "${text}". Return JSON: {"freshnessScore":0-100,"freshnessLabel":"fresh|recent|aging|stale|outdated","publishDateDetected":"${publishDate || 'not found'}","lastModifiedDetected":"${modDate || 'not found'}","daysOldEstimate":"<30|30-90|90-180|180-365|365-730|730+","outdatedSignals":["specifics found that indicate aging content"],"freshnessSignals":["specifics indicating recent content"],"updatePriority":"immediate|within 3 months|within 6 months|low priority","updateRecommendations":["5 specific things to update"],"freshnessSEOImpact":"high|medium|low","freshnessSEOExplanation":"brief"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const h2s = $('h2,h3').map((_, el) => $(el).text()).get().slice(0, 15);
    const wordCount = text.split(/\s+/).length;
    const prompt = `Apply the Skyscraper Technique to find content gaps for improving this page to outrank competitors. Keyword: "${keyword || 'inferred from content'}". Current word count: ${wordCount}. Headings: ${JSON.stringify(h2s)}. Content preview: "${text.slice(0, 800)}". Return JSON: {"currentQualityScore":0-100,"skyscraperPotential":"low|medium|high|very high","contentGaps":[{"gap":"missing topic/section","importance":"critical|high|medium|low","suggestedH2":"heading for this section","contentBrief":"what to cover in 2-3 sentences","estimatedWordAdd":number}],"recommendedNewWordCount":number,"currentWordCount":${wordCount},"wordCountGap":number,"uniqueAngles":["differentiation strategies vs competitors"],"linkBaitElements":["elements to add that attract backlinks"],"upgradeActions":["ranked action plan"]}. Include 8-10 gaps.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const publishDate = $('meta[property="article:published_time"]').attr('content') || '';
    $('script,style,nav,footer').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).length;
    const h2s = $('h2,h3').map((_, el) => $(el).text()).get().slice(0, 10);
    const prompt = `Create a content relaunch plan for this post to boost organic traffic. Published: "${publishDate || 'unknown'}". Keyword: "${keyword || 'inferred'}". Word count: ${wordCount}. Headings: ${JSON.stringify(h2s)}. Content preview: "${text.slice(0, 600)}". Return JSON: {"relunchScore":0-100,"relunchWorthiness":"not worth it|maybe|yes|definitely","reasoning":"2-3 sentences","relunchPlan":{"step1ContentAudit":"what to review and remove","step2UpdateData":"what data/stats to refresh","step3AddSections":["new sections to add"],"step4UpdateExamples":"how to modernize examples","step5SEOTUNEUP":"title/meta/schema updates","step6PromotionPlan":["how to re-promote: email list|social|outreach"]},"estimatedTrafficLift":"10-25%|25-50%|50-100%|100%+","timeToComplete":"hours|1-2 days|3-5 days|1-2 weeks","relunchTitle":"suggested updated title","relunchMeta":"suggested updated meta description"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
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
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000);
      } catch (_) {}
    }
    const prompt = `Identify semantic SEO enrichment opportunities for a page targeting "${keyword || 'the main topic'}". Content snippet: "${text || 'no content provided'}". Return JSON: {"semanticScore":0-100,"semanticLabel":"thin|basic|moderate|rich|comprehensive","lsiTermsMissing":["LSI keywords absent from content"],"relatedTopicsToAdd":["related subtopics that would help Google understand the topic"],"entityMentions":{"found":["entities already present"],"missing":["important entities to add e.g. brands, people, places"]},"semanticEnrichments":[{"term":"word or phrase","type":"LSI|entity|synonym|topic","importance":"critical|high|medium","suggestedUsage":"how and where to add it","exampleSentence":"natural example sentence"}],"topicCompleteness":0-100,"hummingbirdAlignmentScore":0-100,"topActions":["5 ranked semantic enrichment actions"]}. Include 12-15 enrichment suggestions.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─────────────────────────────────────────────────────────────────────────
   BATCH 5 — Local SEO, E-E-A-T & Brand, Voice & AI Search (routes 73-97)
   ───────────────────────────────────────────────────────────────────────── */

/* 73. Google Business Profile Optimizer */
router.post('/local/gbp-optimizer', async (req, res) => {
  try {
    const { businessName, location, category, currentDescription } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!businessName) return res.status(400).json({ ok: false, error: 'Business name required' });
    const prompt = `You are a local SEO specialist. Optimize a Google Business Profile for: Business: "${businessName}", Location: "${location || 'not specified'}", Category: "${category || 'general business'}", Current description: "${currentDescription || 'none provided'}". Return JSON: {"optimizedDescription":"150-word GBP description with local keywords","primaryCategory":"best GBP category","additionalCategories":["3-5 relevant categories"],"keywordsToTarget":["10 local keywords to use"],"photoRecommendations":["5 photo types to add"],"postIdeas":["5 GBP post ideas"],"qaPairs":[{"question":"likely customer question","answer":"short answer"}],"quickWins":["5 immediate improvements"],"completenessScore":0-100,"estimatedImpact":"low|medium|high"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, businessName, location, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 74. Local Citation Finder */
router.post('/local/citation-finder', async (req, res) => {
  try {
    const { businessName, location, category } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!businessName) return res.status(400).json({ ok: false, error: 'Business name required' });
    const prompt = `You are a local SEO citation specialist. Find citation opportunities for: Business: "${businessName}", Location: "${location || 'general'}", Category: "${category || 'general'}". Return JSON: {"napConsistencyTips":["3 tips for consistent Name/Address/Phone"],"topDirectories":[{"name":"directory name","url":"directory URL","priority":"high|medium|low","niche":"general|industry-specific","freeOrPaid":"free|paid|freemium"}],"industryDirectories":["5 niche-specific directories"],"localDirectories":["5 city/region-specific directories"],"citationAuditChecklist":["5 things to audit in existing citations"],"napTemplate":{"nameFormat":"how to format business name","addressFormat":"standardized address format","phoneFormat":"phone number format"},"estimatedCitations":{"current":0,"potential":50},"quickWins":["3 highest-priority citation opportunities"]}. Include 20 directory entries total.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, businessName, location, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 75. Local Keyword Generator */
router.post('/local/local-keyword-gen', async (req, res) => {
  try {
    const { service, city, state } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!service || !city) return res.status(400).json({ ok: false, error: 'Service and city required' });
    const prompt = `You are a local SEO keyword strategist. Generate local keywords for: Service: "${service}", City: "${city}", State/Region: "${state || ''}". Return JSON: {"primaryKeywords":["10 main local keywords with city"],"neighborhoodKeywords":["8 neighborhood/area-specific keywords"],"nearMeKeywords":["5 near me variants"],"longTailKeywords":["10 specific local long-tail keywords"],"voiceSearchQueries":["5 conversational local queries"],"serviceAreaKeywords":["5 keywords for service area pages"],"seasonalKeywords":["4 seasonal local keyword opportunities"],"competitorKeywords":["3 competitor-style keywords to target"],"keywordDensityTips":"","totalOpportunities":0}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, service, city, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 76. LocalBusiness Schema Builder */
router.post('/local/local-schema', async (req, res) => {
  try {
    const { businessName, address, city, phone, website, category, hours } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!businessName) return res.status(400).json({ ok: false, error: 'Business name required' });
    const prompt = `Generate comprehensive LocalBusiness schema markup for: Name: "${businessName}", Address: "${address || ''}", City: "${city || ''}", Phone: "${phone || ''}", Website: "${website || ''}", Category: "${category || 'LocalBusiness'}", Hours: "${hours || ''}". Return JSON: {"schemaMarkup":"full JSON-LD script tag as a string","schemaType":"most specific schema type (e.g. Restaurant, Dentist, etc.)","additionalProperties":["3 extra schema properties to consider"],"implementationTips":["3 tips for implementing the schema"],"validationUrl":"https://search.google.com/test/rich-results","richResultPotential":["potential rich results this could unlock"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, businessName, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 77. E-E-A-T Scorer */
router.post('/brand/eeat-scorer', async (req, res) => {
  try {
    const { url, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    let html = ''; try { const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); html = await r.text(); } catch (e2) { html = ''; }
    const $ = cheerio.load(html);
    const hasAuthorBio = $('[class*="author"],[rel="author"]').length > 0;
    const hasAboutPage = $('a[href*="about"]').length > 0;
    const hasContactPage = $('a[href*="contact"]').length > 0;
    const hasSources = $('a[href^="http"]').length;
    const prompt = `You are an E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) specialist. Audit this page for E-E-A-T signals: URL: "${url}", Niche: "${niche || 'general'}", Has author bio: ${hasAuthorBio}, Has about page link: ${hasAboutPage}, Has contact page: ${hasContactPage}, External links/sources: ${hasSources}. Return JSON: {"eeatScore":0-100,"breakdown":{"experience":{"score":0-100,"signals":["present signals"],"improvements":["2-3 improvements"]},"expertise":{"score":0-100,"signals":["present signals"],"improvements":["2-3 improvements"]},"authoritativeness":{"score":0-100,"signals":["present signals"],"improvements":["2-3 improvements"]},"trustworthiness":{"score":0-100,"signals":["present signals"],"improvements":["2-3 improvements"]}},"topPriorities":["5 ranked E-E-A-T improvements"],"ymylRisk":"low|medium|high","estimatedImpact":"how fixing E-E-A-T could impact rankings"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 78. Author Bio Optimizer */
router.post('/brand/author-bio', async (req, res) => {
  try {
    const { currentBio, authorName, niche, credentials } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!authorName) return res.status(400).json({ ok: false, error: 'Author name required' });
    const prompt = `You are an E-E-A-T content specialist. Optimize an author bio for SEO and trust signals: Author: "${authorName}", Niche: "${niche || 'general'}", Credentials: "${credentials || 'none provided'}", Current bio: "${currentBio || 'none provided'}". Return JSON: {"optimizedBio":{"short":"50-word bio with E-E-A-T signals","medium":"100-word bio","long":"200-word full bio"},"eeatSignals":["8 E-E-A-T signals to include in bio"],"credentialHighlights":["how to present credentials for maximum trust"],"keywordsToInclude":["5 niche keywords for bio"],"structuredDataTip":"how to mark up author with Person schema","socialProofElements":["4 types of social proof to add"],"bioImprovements":["5 specific improvements to current bio"],"qualityScore":0-100}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, authorName, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 79. Brand Signal Audit */
router.post('/brand/brand-signals', async (req, res) => {
  try {
    const { domain, brandName, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!domain) return res.status(400).json({ ok: false, error: 'Domain required' });
    const prompt = `You are a brand SEO specialist. Audit brand signals for: Domain: "${domain}", Brand: "${brandName || domain}", Niche: "${niche || 'general'}". Return JSON: {"brandSignalScore":0-100,"signalCategories":{"socialPresence":{"score":0-100,"platforms":["ideal social platforms for this niche"],"improvements":["3 improvements"]},"brandedSearch":{"score":0-100,"tips":["3 ways to increase branded search volumes"],"improvements":["3 improvements"]},"unlinkedMentions":{"score":0-100,"reclamationTips":["3 tips to find and convert unlinked mentions to links"]},"knowledgePanel":{"eligible":true,"requirements":["what's needed for a knowledge panel"],"tips":["3 tips to get a knowledge panel"]},"authoritySignals":{"score":0-100,"existing":["likely authority signals"],"toAcquire":["4 authority signals to target"]}},"topBrandActions":["7 ranked brand signal improvements"],"competitorBrandGap":"description of typical competitor brand advantage","quickWins":["3 fast brand signal improvements"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, brandName, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 80. Expert Quote Finder */
router.post('/brand/expert-quotes', async (req, res) => {
  try {
    const { topic, niche, contentType } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!topic) return res.status(400).json({ ok: false, error: 'Topic required' });
    const prompt = `You are an E-E-A-T content strategist. Generate expert quote suggestions and sourcing strategies for: Topic: "${topic}", Niche: "${niche || 'general'}", Content type: "${contentType || 'blog post'}". Return JSON: {"expertTypes":["5 types of experts to quote for this topic"],"quotePrompts":["8 specific questions to ask experts"],"outreachSources":["5 platforms/methods to find experts: HARO, Qwoted, LinkedIn, etc."],"sampleQuotes":["3 example expert quotes with attribution template"],"quoteIntegrationTips":["4 ways to naturally integrate expert quotes"],"schemaMarkup":"how to mark up quotes with schema","eeatBenefit":"how expert quotes boost E-E-A-T for this topic","topExperts":["5 types of credible experts or organizations in this niche"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, topic, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 81. Trust Builder */
router.post('/brand/trust-builder', async (req, res) => {
  try {
    const { url, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    let html = ''; try { const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); html = await r.text(); } catch (e2) { html = ''; }
    const $ = cheerio.load(html);
    const hasSSL = url.startsWith('https');
    const hasPrivacyPolicy = $('a[href*="privacy"]').length > 0;
    const hasTerms = $('a[href*="terms"]').length > 0;
    const hasCookieNotice = html.toLowerCase().includes('cookie') || html.toLowerCase().includes('gdpr');
    const prompt = `Audit trust and credibility signals for this page. URL: "${url}", Niche: "${niche || 'general'}", Has HTTPS: ${hasSSL}, Has privacy policy link: ${hasPrivacyPolicy}, Has terms link: ${hasTerms}, Has cookie notice: ${hasCookieNotice}. Return JSON: {"trustScore":0-100,"trustSignals":{"security":{"present":["detected security signals"],"missing":["missing security elements"],"priority":"high|medium|low"},"transparency":{"present":["detected transparency signals"],"missing":["missing elements like privacy policy, contact info"],"priority":"high|medium|low"},"socialProof":{"present":["detected social proof elements"],"missing":["missing social proof: reviews, testimonials, case studies"],"priority":"high|medium|low"},"contentQuality":{"rating":"low|medium|high","improvements":["3 content quality improvements for trust"]}},"topTrustActions":["7 ranked trust improvement actions"],"legalCompliance":["4 legal/compliance elements to check"],"conversionImpact":"how trust improvements could affect conversions"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 82. Voice Search Optimizer */
router.post('/voice/voice-optimizer', async (req, res) => {
  try {
    const { keyword, content, targetDevice } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!keyword) return res.status(400).json({ ok: false, error: 'Keyword required' });
    const prompt = `You are a voice search SEO specialist. Based on the Backlinko/Google voice search study (10,000 queries), optimize for voice search: Keyword: "${keyword}", Target device: "${targetDevice || 'Google Assistant / smart speaker'}", Content snippet: "${content ? content.substring(0, 500) : 'not provided'}". Return JSON: {"voiceSearchScore":0-100,"idealAnswer":{"text":"29-word optimal voice search answer for this keyword","wordCount":29,"readingLevel":"target 9th grade"},"longtailVariants":["8 conversational voice search queries for this keyword"],"questionFormats":["5 question-based formats (who/what/where/when/why/how)"],"featuredSnippetOpportunity":{"canWin":true,"snippetType":"paragraph|list|table","optimizationTips":["3 tips to win the snippet"]},"pageSpeedImpact":"how page speed affects voice search ranking","contentStructureTips":["4 structural changes for voice search"],"faqSection":{"recommended":true,"sampleQA":[{"q":"voice query","a":"29-word answer"}]},"topActions":["5 voice search optimization actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 83. FAQ Page Generator for Voice/AI Search */
router.post('/voice/faq-generator', async (req, res) => {
  try {
    const { topic, niche, audience } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!topic) return res.status(400).json({ ok: false, error: 'Topic required' });
    const prompt = `You are a voice search and AI overview content strategist. Generate a comprehensive FAQ page optimized for voice search and Google AI Overviews: Topic: "${topic}", Niche: "${niche || 'general'}", Audience: "${audience || 'general consumer'}". Return JSON: {"pageTitle":"SEO-optimized FAQ page title","metaDescription":"compelling 155-char meta description","faqs":[{"question":"natural language question","answer":"concise 1-3 sentence answer optimized for voice","voiceLength":true,"answerType":"definition|how-to|list|comparison","paaSource":"People Also Ask opportunity"}],"schemaMarkup":"FAQPage schema JSON-LD as string","contentStructureTip":"best page structure for voice + AI overview ranking","voiceSearchTips":["3 specific tips for this topic"],"aiOverviewTips":["3 tips to appear in Google AI Overviews"],"estimatedTrafficPotential":"low|medium|high"}. Include 15 FAQ pairs.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, topic, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 84. AI Overview Optimizer */
router.post('/voice/ai-overview-optimizer', async (req, res) => {
  try {
    const { keyword, currentContent, url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!keyword) return res.status(400).json({ ok: false, error: 'Keyword required' });
    const prompt = `You are an AI search optimization specialist focused on Google AI Overviews (formerly SGE) and LLM search engines. Optimize content to appear in AI search results for: Keyword: "${keyword}", URL: "${url || 'not provided'}", Content snippet: "${currentContent ? currentContent.substring(0, 600) : 'not provided'}". Return JSON: {"aiOverviewScore":0-100,"aiReadinessLabel":"not ready|developing|ready|optimized","optimizedAnswer":"clear, factual 150-200 word answer structured for AI extraction","contentStructureTips":["5 structural improvements for AI readability"],"factualDensityTips":["4 ways to increase factual density"],"entityOptimization":{"keyEntities":["important entities to mention clearly"],"contextualClues":["contextual signals that help AI understand your content"]},"citationWorthiness":{"score":0-100,"improvements":["3 ways to make content more citable by AI"]},"llmOptimizationTips":["3 tips for ChatGPT/Perplexity/Claude visibility"],"schemaRecommendations":["2 schema types that help AI understanding"],"topActions":["5 ranked AI overview optimization actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 85. Conversational Keyword Generator */
router.post('/voice/conversational-keywords', async (req, res) => {
  try {
    const { topic, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!topic) return res.status(400).json({ ok: false, error: 'Topic required' });
    const prompt = `You are a voice and conversational search keyword specialist. Generate conversational/natural language keywords for: Topic: "${topic}", Niche: "${niche || 'general'}". Return JSON: {"conversationalKeywords":["15 natural language, full-sentence voice queries"],"questionKeywords":{"who":["3 who-questions"],"what":["3 what-questions"],"where":["3 where-questions"],"when":["3 when-questions"],"why":["3 why-questions"],"how":["3 how-questions"]},"nearMeVariants":["5 near-me conversational queries"],"comparisonQueries":["4 vs/comparison voice queries"],"shoppingQueries":["4 purchase-intent voice queries"],"localQueries":["4 local voice queries"],"deviceTargets":{"smartSpeaker":"best format for smart speaker queries","mobileVoice":"best format for Siri/Google Assistant","smartDisplay":"best format for Echo Show/Nest Hub"},"contentFormatTips":["4 content formats that rank for these queries"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, topic, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 86. Reading Level Analyzer */
router.post('/technical/reading-level', async (req, res) => {
  try {
    const { url, text } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url && !text) return res.status(400).json({ ok: false, error: 'URL or text required' });
    let content = text || '';
    if (url && !content) {
      try { const fetchMod = (await import('node-fetch')).default; const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); const html = await r.text(); const $ = cheerio.load(html); content = $('p').text().substring(0, 2000); } catch (e2) { content = ''; }
    }
    const words = content.split(/\s+/).filter(Boolean);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const avgWordsPerSentence = sentences.length > 0 ? (words.length / sentences.length).toFixed(1) : 0;
    const longWords = words.filter(w => w.replace(/[^a-z]/gi, '').length > 6).length;
    const longWordRatio = words.length > 0 ? ((longWords / words.length) * 100).toFixed(1) : 0;
    const prompt = `Analyze reading level of this content for SEO: Word count: ${words.length}, Average words per sentence: ${avgWordsPerSentence}, Long words (>6 chars): ${longWordRatio}%, Sample text: "${content.substring(0, 500)}". Return JSON: {"fleschKincaidGrade":0-20,"readingLevel":"3rd grade|...|College","readingLevelLabel":"too easy|ideal|too complex","targetGrade":9,"sentenceAnalysis":{"avgWordsPerSentence":${avgWordsPerSentence},"recommendation":"ideal is 15-20 words per sentence","longSentences":["examples of overly long phrases"]},"vocabularyAnalysis":{"complexWordPercentage":${longWordRatio},"recommendation":"","hardPhrases":["complex phrases to simplify"]},"voiceSearchCompatibility":"low|medium|high","simplificationSuggestions":["5 specific rewrites or improvements"],"gradeImpact":"how reading level affects ranking for this content type"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, wordCount: words.length, avgWordsPerSentence, longWordRatio, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 87. TF-IDF Keyword Analyzer */
router.post('/technical/tfidf-analyzer', async (req, res) => {
  try {
    const { keyword, text, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!keyword) return res.status(400).json({ ok: false, error: 'Keyword required' });
    const content = text || '';
    const words = content.toLowerCase().split(/\s+/).filter(Boolean);
    const kwLower = keyword.toLowerCase();
    const kwCount = words.filter(w => w.includes(kwLower)).length;
    const density = words.length > 0 ? ((kwCount / words.length) * 100).toFixed(2) : 0;
    const prompt = `You are a TF-IDF SEO analyst. Analyze keyword density and TF-IDF signals: Keyword: "${keyword}", Niche: "${niche || 'general'}", Word count: ${words.length}, Keyword occurrences: ${kwCount}, Keyword density: ${density}%, Content sample: "${content.substring(0, 800)}". Return JSON: {"keywordDensity":${density},"densityLabel":"under-optimized|optimal|over-optimized","optimalRange":"0.5-2%","tfidfScore":0-100,"lsiKeywordsPresent":["LSI keywords found or likely in content"],"lsiKeywordsMissing":["10 important LSI keywords to add"],"keywordPlacementAnalysis":{"inTitle":true,"inH1":true,"inFirstParagraph":true,"inLastParagraph":false,"inSubheadings":true},"densityRecommendations":["4 specific density improvements"],"competitorBenchmark":"typical keyword density for top 10 results in this niche","overOptimizationRisk":"low|medium|high","topActions":["3 immediate TF-IDF improvements"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, wordCount: words.length, density, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 88. Content Length Advisor */
router.post('/technical/content-length-advisor', async (req, res) => {
  try {
    const { keyword, contentType, niche, currentWordCount } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!keyword) return res.status(400).json({ ok: false, error: 'Keyword required' });
    const prompt = `You are a content length optimization specialist. Advise on optimal content length for: Keyword: "${keyword}", Content type: "${contentType || 'blog post'}", Niche: "${niche || 'general'}", Current word count: ${currentWordCount || 'unknown'}. Return JSON: {"optimalWordCount":{"minimum":0,"recommended":0,"maximum":0},"competitorBenchmark":{"averageTopRanking":0,"range":"min-max words seen in top results"},"lengthJustification":"why this length works for this keyword","contentDepthScore":0-100,"topicsToInclude":["8 subtopics/sections needed to justify the word count"],"voiceSearchNote":"how length affects voice search (avg 2312 words for voice results)","lengthBySection":[{"section":"section name","recommendedWords":0}],"currentGap":{"wordsNeeded":0,"assessment":"too short|about right|too long"},"topActions":["3 concrete content length improvements"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 89. Core Web Vitals Advisor */
router.post('/technical/cwv-advisor', async (req, res) => {
  try {
    const { url, platformOrCMS } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    let resourceCount = 0; let imageCount = 0;
    try { const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); const html = await r.text(); const $ = cheerio.load(html); resourceCount = $('script,link[rel="stylesheet"]').length; imageCount = $('img').length; } catch (e2) { }
    const prompt = `You are a Core Web Vitals optimization specialist. Provide CWV recommendations for: URL: "${url}", Platform/CMS: "${platformOrCMS || 'unknown'}", Script/CSS resources: ${resourceCount}, Images: ${imageCount}. Return JSON: {"cwvTargets":{"lcp":{"target":"<2.5s","current":"unknown","fixes":["4 LCP improvement actions ranked by impact"]},"cls":{"target":"<0.1","current":"unknown","fixes":["3 CLS improvement actions"]},"inp":{"target":"<200ms","current":"unknown","fixes":["3 INP/FID improvement actions"]}},"overallCWVRisk":"low|medium|high","topPriorityFixes":["5 highest-impact CWV fixes for this URL"],"platformSpecificTips":["3 CMS-specific optimization tips"],"resourceOptimization":{"scripts":["2 script optimization tips","resourceCount":${resourceCount}],"images":["2 image optimization tips","imageCount":${imageCount}]},"voiceSearchBonus":"good CWV also improves voice search ranking (avg 4.6s load for voice results)","measurementTools":["Google PageSpeed Insights","Chrome UX Report","Search Console CWV report"],"estimatedRankingImpact":"low|medium|high"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, resourceCount, imageCount, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 90. Page Speed Advisor */
router.post('/technical/page-speed-advisor', async (req, res) => {
  try {
    const { url, platformOrCMS } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    let scriptCount = 0; let cssCount = 0; let imgCount = 0; let fontCount = 0; let hasLazyLoad = false;
    try { const startTime = Date.now(); const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); const html = await r.text(); const fetchTime = Date.now() - startTime; const $ = cheerio.load(html); scriptCount = $('script[src]').length; cssCount = $('link[rel="stylesheet"]').length; imgCount = $('img').length; fontCount = (html.match(/fonts\.google|typekit|font-face/gi) || []).length; hasLazyLoad = html.includes('loading="lazy"') || html.includes('data-src'); } catch (e2) { }
    const prompt = `You are a web performance specialist. Provide page speed optimization advice for: URL: "${url}", Platform: "${platformOrCMS || 'unknown'}", External scripts: ${scriptCount}, CSS files: ${cssCount}, Images: ${imgCount}, Font sources: ${fontCount}, Lazy loading: ${hasLazyLoad}. Voice search benchmark: pages should load in <4.6s; avg TTFB <0.54s. Return JSON: {"speedScore":0-100,"estimatedLoadTime":"X seconds","criticalIssues":["issues causing slowdown based on detected resources"],"imageOptimization":{"issues":["image issues"],"fixes":["3 image speed fixes"],"toolSuggestions":["WebP conversion, lazy loading, CDN"]},"scriptOptimization":{"issues":[],"fixes":["3 script load optimizations: defer, async, bundles"]},"cssOptimization":{"fixes":["2 CSS optimizations"]},"serverOptimization":{"fixes":["3 server-side improvements: caching, compression, CDN"]},"voiceSearchSpeed":"impact on voice search (faster = better chance of being voice result)","topSpeedActions":["7 ranked page speed improvements"],"measurementUrl":"https://pagespeed.web.dev/"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, scriptCount, cssCount, imgCount, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 91. Topic Cluster Builder */
router.post('/content/topic-cluster-builder', async (req, res) => {
  try {
    const { seed, niche, targetAudience } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!seed) return res.status(400).json({ ok: false, error: 'Seed topic required' });
    const prompt = `You are a topic cluster and content hub strategist (Semrush/HubSpot methodology). Build a comprehensive topic cluster for: Seed topic: "${seed}", Niche: "${niche || 'general'}", Audience: "${targetAudience || 'general consumer'}". Return JSON: {"pillarPage":{"title":"pillar page title","targetKeyword":"broad high-volume keyword","estimatedWordCount":3000,"sections":["8 main sections the pillar page should cover"]},"clusterPages":[{"title":"cluster page title","targetKeyword":"long-tail keyword","intent":"informational|commercial|transactional","wordCount":1500,"internalLinkAnchorText":"how to link from pillar to this page"}],"internalLinkingMap":["description of how all pages link to each other"],"topicalAuthorityScore":0-100,"contentCalendar":["suggested order to publish the cluster pages"],"missingTopics":["subtopics not covered that competitors might target"],"clusterMetrics":{"totalPages":0,"totalEstimatedWords":0,"timeToPublish":"X weeks"}}. Include 8-10 cluster pages.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, seed, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 92. Visual Diversity Advisor */
router.post('/content/visual-diversity', async (req, res) => {
  try {
    const { url, contentType, topic } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    let imgCount = 0; let hasVideo = false; let hasGif = false; let hasSVG = false; let hasTable = false; let hasInfographic = false;
    try { const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); const html = await r.text(); const $ = cheerio.load(html); imgCount = $('img').length; hasVideo = $('video,iframe[src*="youtube"],iframe[src*="vimeo"]').length > 0; hasGif = $('img[src*=".gif"]').length > 0; hasSVG = $('svg,img[src*=".svg"]').length > 0; hasTable = $('table').length > 0; hasInfographic = html.toLowerCase().includes('infographic'); } catch (e2) { }
    const prompt = `You are a visual content SEO strategist. Audit visual diversity for engagement and rankings: URL: "${url}", Topic: "${topic || 'general'}", Content type: "${contentType || 'blog post'}", Static images: ${imgCount}, Has video: ${hasVideo}, Has GIFs/animations: ${hasGif}, Has SVG/animated: ${hasSVG}, Has tables: ${hasTable}, Has infographics: ${hasInfographic}. Semrush research: diverse visuals reduce bounce rate and improve dwell time. Return JSON: {"visualDiversityScore":0-100,"currentVisuals":{"score":0-100,"what-is-good":"","what-is-missing":""},"recommendedVisuals":[{"type":"image|gif|video|infographic|table|chart|interactive","description":"specific visual to create","placement":"where in content","userEngagementBenefit":"","seoBonus":""}],"videoSEOTips":["3 tips to optimize embedded videos for search"],"imageOptimizationTips":["3 image SEO improvements"],"engagementImpact":{"estimatedBounceRateReduction":"X%","estimatedDwellTimeIncrease":"X seconds"},"topVisualActions":["5 visual diversity improvements to implement first"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, imgCount, hasVideo, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 93. Time-to-Value Optimizer */
router.post('/content/time-to-value', async (req, res) => {
  try {
    const { url, content } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url && !content) return res.status(400).json({ ok: false, error: 'URL or content required' });
    let fetchedContent = content || '';
    let introLength = 0;
    if (url && !fetchedContent) {
      try { const fetchMod = (await import('node-fetch')).default; const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }); const html = await r.text(); const $ = cheerio.load(html); fetchedContent = $('p').text().substring(0, 3000); } catch (e2) { fetchedContent = ''; }
    }
    const paragraphs = fetchedContent.split('\n\n').filter(p => p.trim().length > 50);
    introLength = paragraphs.length > 0 ? paragraphs[0].split(/\s+/).length : 0;
    const prompt = `You are a content UX and SEO specialist. Analyze time-to-value (BLUF/inverted pyramid structure): URL: "${url || 'not provided'}", Intro paragraph word count: ${introLength}, Content sample: "${fetchedContent.substring(0, 1000)}". Semrush research: short time-to-value improves bounce rate, dwell time, and rankings. Return JSON: {"timeToValueScore":0-100,"timeToValueLabel":"poor|needs work|good|excellent","introAnalysis":{"wordCount":${introLength},"issue":"","recommendation":"put key info in first 100 words"},"blufAnalysis":{"hasBLUF":false,"recommendation":"","exampleRewrite":"rewrite the intro to lead with the answer"},"scrollDepthRisk":"how many users might leave before reaching the value","aboveFoldContent":{"hasKeyTakeaway":false,"hasAnswerToQuery":false,"improvements":["3 above-fold improvements"]},"structureImprovements":["5 specific structural changes to improve time-to-value"],"seoImpact":"how time-to-value affects bounce rate, dwell time, and rankings","topActions":["3 highest-impact time-to-value changes"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, introLength, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 94. Content Pruning Advisor */
router.post('/content/content-pruning', async (req, res) => {
  try {
    const { siteUrl, contentList, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!siteUrl && !contentList) return res.status(400).json({ ok: false, error: 'Site URL or content list required' });
    const prompt = `You are a content audit and pruning strategist (Semrush methodology). Advise on content pruning strategy for: Site: "${siteUrl || 'not provided'}", Niche: "${niche || 'general'}", Content URLs provided: "${contentList ? contentList.substring(0, 500) : 'none — provide general strategy'}". Semrush research: removing/repurposing underperforming content can boost overall site authority. Return JSON: {"pruningStrategy":"overview","decisionFramework":{"keep":{"criteria":["4 criteria for keeping content"],"examples":["what good performing content looks like"]},"improve":{"criteria":["4 criteria for improving content"],"actions":["merge, update, expand, add examples"]},"repurpose":{"criteria":["3 criteria for repurposing content"],"actions":["combine thin pages, create pillar from cluster"]},"remove":{"criteria":["3 criteria for removing content"],"actions":["301 redirect strategy"]}},"auditChecklist":["8 metrics to check when auditing each URL"],"quickWins":["4 fast pruning actions that often immediately improve domain authority"],"toolsNeeded":["recommended tools for content audit"],"estimatedImpact":"how pruning typically affects organic traffic","frequencyRecommendation":"how often to run content audits","topActions":["5 immediate content pruning actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, siteUrl, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 95. Statistics Curator (linkbait) */
router.post('/content/statistics-curator', async (req, res) => {
  try {
    const { niche, topic } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!niche) return res.status(400).json({ ok: false, error: 'Niche required' });
    const prompt = `You are a linkbait content strategist. Curate SEO statistics and data points for creating link-worthy content: Niche: "${niche}", Topic: "${topic || niche}". Ahrefs technique: curating industry statistics is one of the easiest ways to earn backlinks. Return JSON: {"contentTitle":"\"X ${niche} Statistics [Current Year]\" (linkbait title)","metaDescription":"compelling 155-char meta for stats page","statCategories":[{"category":"stat category name","stats":[{"stat":"specific statistic with plausible number","source":"type of credible source to verify","yearRange":"2023-2024","linkability":"high|medium","verificationUrl":"type of URL to find this stat"}]}],"contentStructureTips":["4 tips for formatting stats pages for maximum backlinks"],"promotionStrategy":["4 outreach strategies for stats pages"],"updateSchedule":"how often to refresh statistics","estimatedBacklinkPotential":"low|medium|high","internalLinkingOpportunities":["3 ways to use stats page as hub for internal links"],"topActions":["3 immediate actions to create and promote this stats page"]}. Include 5-6 stat categories with 3-4 stats each.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, niche, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 96. Low-Difficulty Keyword Finder */
router.post('/keywords/low-difficulty-finder', async (req, res) => {
  try {
    const { seedKeyword, niche, siteDA } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!seedKeyword) return res.status(400).json({ ok: false, error: 'Seed keyword required' });
    const prompt = `You are a keyword opportunity specialist focused on low-competition wins. Find low-difficulty keyword opportunities for: Seed keyword: "${seedKeyword}", Niche: "${niche || 'general'}", Site DA/authority: "${siteDA || 'new/low'}". Ahrefs methodology: filter for KD <30 and SERPs with low-authority pages to find quick wins. Return JSON: {"lowDifficultyKeywords":[{"keyword":"keyword phrase","estimatedKD":0-30,"searchIntent":"informational|commercial|transactional","whyEasy":"reason this is achievable","estimatedMonthlySearches":"range","weeksSERP":1-12,"contentType":"blog post|product page|landing page|FAQ"}],"weakSERPIndicators":["signals that indicate a SERP is easy to crack into"],"contentPriorityList":["ranked order to target these keywords"],"clusterOpportunity":"whether these form a natural topic cluster","quickWinStrategy":"best approach for a new/low DA site to rank fast","estimatedTrafficPotential":"combined monthly traffic if all keywords rank","topActions":["5 immediate keyword targeting actions"]}. Provide 15 low-difficulty keyword opportunities.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, seedKeyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 97. Keyword Cannibalization Detector */
router.post('/keywords/cannibalization-detector', async (req, res) => {
  try {
    const { domain, urlList, targetKeyword } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!domain && !urlList) return res.status(400).json({ ok: false, error: 'Domain or URL list required' });
    const prompt = `You are a keyword cannibalization specialist (Semrush methodology). Analyze and fix keyword cannibalization for: Domain: "${domain || 'not provided'}", URLs to check: "${urlList ? urlList.substring(0, 600) : 'none — provide general strategy for the domain'}", Focus keyword: "${targetKeyword || 'general site-wide analysis'}". Semrush: cannibalization happens when 2+ pages target same search intent. Return JSON: {"cannibalizationRisk":"low|medium|high","detectedIssues":[{"pageGroup":"pages competing with each other","keyword":"the cannibalized keyword","intent":"the shared intent","primaryUrl":"which URL should rank","secondaryUrls":["URLs that are competing"],"symptoms":["signs of cannibalization: fluctuating ranks etc"]}],"detectionChecklist":["6 signs your site has keyword cannibalization"],"fixStrategies":{"consolidate":{"when":"when to merge pages","how":"merge + 301 redirect"},"canonicalize":{"when":"when to use canonical","how":"add canonical tag"},"reoptimize":{"when":"when to change page intent","how":"shift content focus"},"internalLinks":{"fix":"how to reconcile internal links"}},"preventionTips":["4 tips to prevent future cannibalization"],"toolsToUseForAudit":["Position Tracking, Search Console, Screaming Frog"],"topActions":["5 ranked actions to resolve cannibalization"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── BATCH 6: SERP & CTR EXTENSIONS ─── */

/* 98. Google News / Discover SEO Optimizer */
router.post('/serp/news-seo', async (req, res) => {
  try {
    const { url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const title = $('title').text().slice(0, 120);
    const publishDate = $('meta[property="article:published_time"]').attr('content') || $('time').first().attr('datetime') || 'not found';
    const hasAmpLink = $('link[rel="amphtml"]').length > 0;
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    const hasNewsSchema = html.includes('"NewsArticle"') || html.includes('"Article"');
    const prompt = `You are a Google News and Discover SEO expert. Audit this page for Google News and Discover eligibility. URL: "${url}", Title: "${title}", Published date meta: "${publishDate}", Has AMP: ${hasAmpLink}, OG type: "${ogType}", Has NewsArticle schema: ${hasNewsSchema}. Key Google News ranking factors: original reporting, timeliness, authority, schema, bylines, publication date. Return JSON: {"newsEligibilityScore":0-100,"discoverEligibilityScore":0-100,"newsIssues":[{"issue":"problem","fix":"solution","priority":"high|medium|low"}],"discoverIssues":[{"issue":"problem","fix":"fix","priority":"high|medium|low"}],"schemaRecommendation":{"type":"NewsArticle|Article","missingFields":["list of missing schema fields"]},"freshnessSignals":{"publishDateFound":${publishDate !== 'not found'},"publishDateValue":"${publishDate}","freshnessScore":0-100},"headlineOptimization":{"current":"${title.slice(0,80)}","issues":["issues with headline"],"improved":"improved version"},"ampRecommendation":"whether and how to implement AMP","topActions":["5 prioritized actions to get into Google News/Discover"],"estimatedImpact":"high|medium|low"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, hasAmpLink, hasNewsSchema, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 99. Video SEO Optimizer */
router.post('/serp/video-seo', async (req, res) => {
  try {
    const { url, videoKeyword } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url && !videoKeyword) return res.status(400).json({ ok: false, error: 'URL or video keyword required' });
    let videoContext = { hasVideoSchema: false, hasVideoEmbed: false, title: 'not scraped' };
    if (url) {
      try {
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        videoContext.title = $('title').text().slice(0, 100);
        videoContext.hasVideoSchema = html.includes('"VideoObject"');
        videoContext.hasVideoEmbed = $('iframe[src*="youtube"], iframe[src*="vimeo"], video').length > 0;
        videoContext.videoCount = $('iframe[src*="youtube"], iframe[src*="vimeo"], video').length;
      } catch {}
    }
    const prompt = `You are a video SEO expert specializing in video rich results and YouTube-to-web SEO. Optimize for video search: URL: "${url || 'N/A'}", Video keyword: "${videoKeyword || 'N/A'}", Has VideoObject schema: ${videoContext.hasVideoSchema}, Has video embed: ${videoContext.hasVideoEmbed}, Video count on page: ${videoContext.videoCount || 0}. Google shows video rich results for pages with VideoObject schema. Return JSON: {"videoRichResultScore":0-100,"richResultEligibility":"eligible|likely|unlikely","videoObjectSchema":{"missingFields":["list of required/recommended fields missing"],"exampleMarkup":"JSON-LD VideoObject example with the keyword"},"thumbnailStrategy":{"recommendation":"thumbnail best practices","dimensions":"1280x720 preferred"},"transcriptValue":"why and how to add transcript","chapterMarkers":"how to add timestamp chapters for richer snippets","youtubeOptimization":{"titleFormula":"formula for the video title","descriptionStructure":"how to structure description","tagsStrategy":"how to choose tags"},"pageOptimization":["5 on-page changes to support video SEO"],"topActions":["5 actions to get video rich results"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, videoKeyword, ...videoContext, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 100. Entity / Knowledge Graph Optimizer */
router.post('/serp/entity-optimizer', async (req, res) => {
  try {
    const { keyword, url, entityName } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!keyword && !entityName) return res.status(400).json({ ok: false, error: 'Keyword or entity name required' });
    const prompt = `You are a Knowledge Graph and entity SEO specialist. Optimize for entity search and Knowledge Graph inclusion: Keyword: "${keyword || 'N/A'}", Entity name: "${entityName || keyword}", URL context: "${url || 'N/A'}". Google's Knowledge Graph uses entity associations, structured data, Wikipedia/Wikidata, brand signals. Return JSON: {"entityScore":0-100,"entityType":"Person|Organization|Product|Place|Event|Concept","knowledgeGraphGap":{"currentCoverage":"assessment","missingSignals":["signals needed for KG inclusion"]},"entityDefinition":"clear 1-sentence entity definition for schema","samedAsOpportunities":["Wikipedia URL","Wikidata URL","LinkedIn","Crunchbase","official social profiles"],"schemaMarkup":{"type":"the schema type e.g. Organization","keyProperties":{"name":"value","url":"value","description":"value","sameAs":["placeholder URLs"]}},"entityMentionStrategy":["how to build entity prominence through content"],"ngramOptimization":{"entityNgrams":["key phrases Google associates with this entity"],"coOccurrenceTerms":["terms that should co-occur with this entity"]},"topActions":["5 entity SEO actions to strengthen Knowledge Graph presence"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, entityName, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 101. Product / Review Schema Optimizer */
router.post('/serp/review-schema', async (req, res) => {
  try {
    const { url, productName, category } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url && !productName) return res.status(400).json({ ok: false, error: 'URL or product name required' });
    let pageCtx = {};
    if (url) {
      try {
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        pageCtx.title = $('title').text().slice(0, 100);
        pageCtx.hasProduct = html.includes('"Product"');
        pageCtx.hasReview = html.includes('"Review"') || html.includes('"AggregateRating"');
        pageCtx.hasPrice = $('[itemprop="price"], [class*="price"]').length > 0;
      } catch {}
    }
    const prompt = `You are a Product and Review schema specialist focused on rich results. Optimize schema for: URL: "${url || 'N/A'}", Product: "${productName || pageCtx.title || 'N/A'}", Category: "${category || 'general'}", Has Product schema: ${pageCtx.hasProduct || false}, Has Review schema: ${pageCtx.hasReview || false}. Google shows star ratings, price, availability in SERPs when schema is correct. Return JSON: {"richResultScore":0-100,"richResultTypes":["star ratings","price","availability","review count"],"currentSchemaIssues":["list of detected issues"],"productSchemaExample":{"complete JSON-LD Product schema with example values"},"reviewSchemaExample":{"complete JSON-LD AggregateRating example"},"validationChecklist":["required fields checklist"],"starRatingEligibility":"eligible|needs review count|needs proper schema","affiliateConsiderations":["special notes for affiliate/review sites"],"topActions":["5 actions to get rich results showing in SERPs"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, productName, ...pageCtx, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 102. Event Schema Builder */
router.post('/serp/event-schema', async (req, res) => {
  try {
    const { eventName, eventDate, eventLocation, description, organizer, ticketUrl } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!eventName) return res.status(400).json({ ok: false, error: 'Event name required' });
    const prompt = `You are an Event schema specialist. Build optimized Event JSON-LD schema for Google rich results. Event name: "${eventName}", Date: "${eventDate || 'TBD'}", Location: "${eventLocation || 'TBD'}", Description: "${description || ''}", Organizer: "${organizer || ''}", Ticket URL: "${ticketUrl || ''}". Return JSON: {"schemaMarkup":"complete JSON-LD Event schema as a string","richResultPreview":{"eventTitle":"${eventName}","dateDisplay":"human-friendly date string","locationDisplay":"${eventLocation || 'TBD'}","ticketsAvailable":${!!ticketUrl}},"requiredFields":["list of required Event schema fields"],"recommendedFields":["additional recommended fields"],"virtualEventNotes":"if online event, how to mark up correctly","validationUrl":"https://search.google.com/test/rich-results","commonMistakes":["5 most common Event schema mistakes"],"topActions":["3 actions to maximize event visibility in Google"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, eventName, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── BATCH 6: SCHEMA & LINKS EXTENSIONS ─── */

/* 103. Redirect Chain Auditor */
router.post('/schema/redirect-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const chain = [];
    let current = url;
    let hops = 0;
    try {
      const fetchMod = (await import('node-fetch')).default;
      while (hops < 6) {
        const r = await fetchMod(current, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
        chain.push({ url: current, status: r.status, type: r.status >= 301 && r.status <= 308 ? `${r.status} redirect` : `${r.status} final` });
        if (r.status >= 300 && r.status < 400) { current = r.headers.get('location') || ''; hops++; } else break;
      }
    } catch (fetchErr) { chain.push({ url: current, error: fetchErr.message }); }
    const prompt = `You are a redirect and crawl efficiency specialist. Analyze this redirect chain: ${JSON.stringify(chain)}. Original URL: "${url}". Rules: 301 chains lose ~10-15% PageRank per hop, chains >2 hops are problematic, 302s pass no link equity by default, self-referential redirects waste crawl budget. Return JSON: {"chainLength":${chain.length},"chainHealthScore":0-100,"issues":[{"issue":"description","impact":"high|medium|low","fix":"specific fix"}],"linkEquityLoss":"estimated % PageRank loss","crawlBudgetImpact":"impact description","detectedChain":${JSON.stringify(chain)},"fixPriority":"immediate|soon|monitor","fixStrategy":"consolidation approach","topActions":["3 specific actions to fix this redirect situation"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, chain, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 104. Duplicate Content Detector */
router.post('/schema/duplicate-content', async (req, res) => {
  try {
    const { url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const canonical = $('link[rel="canonical"]').attr('href') || null;
    const noindex = $('meta[name="robots"]').attr('content')?.includes('noindex') || false;
    const hasCanonical = !!canonical;
    const canonicalMatchesSelf = canonical === url || canonical === url.replace(/\/$/, '');
    $('script,style,nav,footer,header').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 800);
    const title = $('title').text().slice(0, 100);
    const prompt = `You are a duplicate content and canonicalization specialist. Audit this page for duplicate content risks. URL: "${url}", Canonical tag: "${canonical || 'missing'}", Canonical matches self: ${canonicalMatchesSelf}, Is noindexed: ${noindex}, Title: "${title}", Content snippet: "${textContent}". Analyze for: near-duplicate pages, canonicalization issues, parameter URLs, session IDs, faceted navigation, pagination duplication. Return JSON: {"duplicateRisk":"low|medium|high","duplicateScore":0-100,"canonicalStatus":{"hasCanonical":${hasCanonical},"canonicalUrl":"${canonical || 'none'}","isSelfCanonical":${canonicalMatchesSelf},"recommendation":"fix action"},"parameterIssues":{"detected":true/false,"parameters":["any query params found in URL"],"fix":"how to handle"},"thinContentRisk":"none|low|medium|high","paginationIssues":["pagination duplication risks if any"],"nearDuplicateRisks":["content patterns that indicate near-duplicate pages"],"topActions":["5 actions to fix duplicate content risks"],"estimatedImpact":"how fixing this affects rankings"}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, canonical, hasCanonical, canonicalMatchesSelf, noindex, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 105. Hreflang International SEO Advisor */
router.post('/schema/hreflang', async (req, res) => {
  try {
    const { url, targetMarkets } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const hreflangTags = $('link[hreflang]').map((_, el) => ({ lang: $(el).attr('hreflang'), href: $(el).attr('href') })).get();
    const langAttribute = $('html').attr('lang') || 'not set';
    const prompt = `You are an international SEO and hreflang specialist. Audit hreflang implementation and international SEO for: URL: "${url}", Target markets: "${targetMarkets || 'not specified'}", HTML lang attribute: "${langAttribute}", Detected hreflang tags: ${JSON.stringify(hreflangTags)}. Return JSON: {"internationalSeoScore":0-100,"langAttribute":{"current":"${langAttribute}","correct":"correct format","issue":"any issue"},"hreflangAudit":{"tagCount":${hreflangTags.length},"hasXDefaultTag":${hreflangTags.some(t => t.lang === 'x-default')},"issues":["common hreflang mistakes found or general best practices"],"fixedExample":"corrected hreflang tags example"},"ccTLDvsSubdirectory":{"recommendation":"which URL structure for international","pros":["pros"],"cons":["cons"]},"targetMarketStrategy":${JSON.stringify(targetMarkets ? `{"markets":"${targetMarkets}","urlStrategy":"recommended structure","contentConsiderations":["localization tips"]}` : '"specify target markets for custom advice"')},"topActions":["5 international SEO actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, hreflangTags, langAttribute, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 106. Mobile SEO Checker */
router.post('/schema/mobile-seo', async (req, res) => {
  try {
    const { url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
    const r = await fetchMod(url, { headers: { 'User-Agent': mobileUA }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const viewport = $('meta[name="viewport"]').attr('content') || null;
    const hasViewport = !!viewport;
    const viewportCorrect = viewport?.includes('width=device-width') || false;
    const tapTargets = $('a, button').length;
    const smallFontCount = 0; // simplified - would need CSS parsing
    const interstitials = $('[class*="popup"], [class*="modal"], [class*="overlay"]').length;
    const imageCount = $('img').length;
    const lazyImages = $('img[loading="lazy"]').length;
    const prompt = `You are a mobile SEO and mobile-first indexing specialist. Google uses mobile-first indexing — mobile version is what gets indexed. Mobile audit for: URL: "${url}", Viewport meta: "${viewport || 'MISSING'}", Viewport correct: ${viewportCorrect}, Tap targets count: ${tapTargets}, Interstitial-like elements: ${interstitials}, Images: ${imageCount} (${lazyImages} lazy), Mobile UA used: yes. Return JSON: {"mobileScore":0-100,"mobileFriendlyLabel":"mobile-friendly|needs work|not mobile-friendly","viewportIssue":${!hasViewport},"criticalIssues":[{"issue":"problem","fix":"fix","priority":"high|medium|low"}],"mobileFirstIndexingChecklist":{"contentParity":"check content matches desktop","structuredData":"check schema is on mobile version","crawlability":"Googlebot-Mobile can access","interstitials":{"risk":${interstitials > 0},"googlePenaltyRisk":"low|medium|high"}},"coreWebVitalsMobile":{"LCP":"note about LCP on mobile","CLS":"CLS mobile specific issues","INP":"interaction delay issues"},"ampAlternative":"whether AMP could help this page type","topActions":["5 mobile SEO improvements ranked by impact"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, viewport, hasViewport, viewportCorrect, tapTargets, interstitials, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── BATCH 6: BACKLINKS EXTENSIONS ─── */

/* 107. Link Gap Analysis */
router.post('/backlinks/link-gap', async (req, res) => {
  try {
    const { domain, competitors, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!domain) return res.status(400).json({ ok: false, error: 'Domain required' });
    const prompt = `You are a link gap analysis specialist (Ahrefs/Semrush methodology). Identify link building gaps for: Domain: "${domain}", Competitors: "${competitors || 'not specified — generate typical competitors for this domain'}", Niche: "${niche || 'general'}". Link gap = sites linking to competitors but not to this domain. Return JSON: {"linkGapScore":0-100,"estimatedGapSize":"number of missed link opportunities","topLinkGapOpportunities":[{"sourceType":"e.g. industry blog, news site, directory","domainAuthority":"typical DA range","linkType":"editorial|directory|resource|guest post","outreachDifficulty":"easy|medium|hard","linkValue":"high|medium|low","howToEarn":"specific tactic to earn this type of link"}],"competitorBacklinkPatterns":["patterns in how competitors earn links"],"quickWinLinks":["5 highest-probability near-term link targets"],"contentTypesForLinks":["content formats that attract links in this niche"],"topActions":["5 ranked link gap closing actions"]}. Provide 10 link gap opportunities.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, competitors, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 108. Broken Backlink Reclamation */
router.post('/backlinks/broken-backlinks', async (req, res) => {
  try {
    const { domain, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!domain) return res.status(400).json({ ok: false, error: 'Domain required' });
    const prompt = `You are a broken backlink reclamation specialist. Create a broken link reclamation strategy for: Domain: "${domain}", Niche: "${niche || 'general'}". Broken links (404s with inbound links) are low-hanging fruit — pages that changed URL leave orphaned links pointing to 404s. Return JSON: {"reclamationStrategy":"overall approach","quickWinTypes":["types of broken links easiest to reclaim"],"outreachTemplate":{"subject":"email subject line","body":"3-sentence outreach email body asking to update the broken link"},"brokenLinkTypes":[{"type":"renamed page","likelihood":"high","fix":"301 redirect from old URL","outreach":false},{"type":"deleted content","likelihood":"medium","fix":"recreate content or redirect to best alternative","outreach":true},{"type":"moved resources","likelihood":"high","fix":"set up proper redirects","outreach":false}],"toolsNeeded":["Ahrefs Site Explorer, Screaming Frog, Google Search Console"],"auditProcess":["step 1","step 2","step 3"],"competitorBrokenLinks":"strategy to steal competitor broken backlinks","estimatedMonthly":"typical broken link recovery potential for a site this size","topActions":["5 broken link reclamation actions ranked by ROI"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 109. Anchor Text Profile Auditor */
router.post('/backlinks/anchor-text', async (req, res) => {
  try {
    const { domain, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!domain) return res.status(400).json({ ok: false, error: 'Domain required' });
    const prompt = `You are an anchor text profile analyst. Audit and optimize the anchor text backlink profile for: Domain: "${domain}", Niche: "${niche || 'general'}". Ideal anchor text distribution (Ahrefs data): branded ~40-70%, naked URL ~10-20%, exact match <5%, partial match ~10-20%, generic ~5-15%. Return JSON: {"anchorTextScore":0-100,"penaltyRisk":"low|medium|high","idealDistribution":{"branded":"40-70%","nakedUrl":"10-20%","exactMatch":"<5% target","partialMatch":"10-20%","generic":"5-15%","compound":"5-15%"},"currentIssues":["anchor text problems to fix"],"overOptimizationRisk":"none|low|medium|high","diversificationNeeded":["which anchor types to build more of"],"safetyMeasures":["how to diversify anchor profile safely"],"nextLinks":["recommended anchor texts for next 10 links to build with rationale"],"topActions":["5 anchor text optimization actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 110. Link Velocity Analyzer */
router.post('/backlinks/link-velocity', async (req, res) => {
  try {
    const { domain, currentLinksPerMonth, niche } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!domain) return res.status(400).json({ ok: false, error: 'Domain required' });
    const prompt = `You are a link velocity and link building momentum specialist. Analyze and optimize link building velocity for: Domain: "${domain}", Current links/month: "${currentLinksPerMonth || 'unknown'}", Niche: "${niche || 'general'}". Link velocity = rate at which new backlinks are acquired. Unnatural spikes can trigger Penguin. Ideal = consistent natural growth. Return JSON: {"velocityScore":0-100,"velocityStatus":"too slow|healthy|suspicious spike|unknown","naturalGrowthRange":{"minPerMonth":"number","maxPerMonth":"number","basis":"why this range is natural for this niche"},"velocityRisks":["risks of current pattern"],"buildingSchedule":{"week1":{"quantity":0,"types":["link types"]},"week2":{"quantity":0,"types":[]},"month2":{"quantity":0,"types":[]},"ongoing":{"quantity":0,"types":[]}},"diversificationCalendar":["month 1 focus","month 2 focus","month 3 focus"],"spikeMitigation":["what to do if you get a sudden spike"],"competitorVelocityTips":["how to research competitor link velocity"],"topActions":["5 link velocity optimizations"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, currentLinksPerMonth, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── BATCH 6: A/B & REFRESH TAB ─── */

/* 111. SEO A/B Test Advisor */
router.post('/ab/ab-test-advisor', async (req, res) => {
  try {
    const { url, pageType } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const title = $('title').text().slice(0, 120);
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().slice(0, 100);
    const prompt = `You are an SEO A/B testing specialist. Generate high-impact SEO A/B test ideas for: URL: "${url}", Page type: "${pageType || 'blog post'}", Title: "${title}", Meta: "${metaDesc.slice(0, 150)}", H1: "${h1}". A/B tests proven to move rankings: title tag changes, meta description CTR tests, H1 variations, content structure, internal linking, schema additions, CTA placement. Return JSON: {"highestImpactTests":[{"testName":"test name","element":"what to test","control":"current version","variant":"test version","hypothesis":"why this would improve CTR/rankings","difficulty":"easy|medium|hard","estimatedImpact":"% CTR or ranking improvement","timeToResults":"weeks"}],"statisticalRequirements":{"minimumTraffic":"visits/month needed","testDuration":"weeks","significanceLevel":"95%"},"seoSpecificCaveats":["SEO A/B testing pitfalls to avoid"],"toolsNeeded":["tools for SEO A/B testing"],"topTests":["5 must-do A/B tests for this page type"]}. Include 8 test ideas.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, title, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 112. Content Refresh Advisor */
router.post('/ab/content-refresh', async (req, res) => {
  try {
    const { url, publishDate } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
    const { html } = await _fetchPageHtml(url, req);
    const $ = cheerio.load(html);
    const pubDateMeta = $('meta[property="article:modified_time"], meta[property="article:published_time"]').first().attr('content') || publishDate || 'unknown';
    const title = $('title').text().slice(0, 120);
    $('script,style,nav,footer,header').remove();
    const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1500);
    const wordCount = content.split(' ').length;
    const prompt = `You are a content refresh and historical optimization specialist. Create a content refresh strategy for: URL: "${url}", Title: "${title}", Published/modified: "${pubDateMeta}", Word count approx: ${wordCount}. Content snippet: "${content.slice(0, 800)}". Semrush's content refresh methodology: update outdated stats, add new sections for new search intent, improve EEAT signals, fix broken links, re-optimize for new keywords, update publish date only if significant changes. Return JSON: {"refreshPriorityScore":0-100,"refreshUrgency":"immediate|within a month|quarterly|not needed","agingSignals":["signs the content is outdated"],"newSectionSuggestions":[{"section":"heading","why":"why to add this section","keywords":["target keywords"]}],"outdatedElements":["specific things likely to be outdated based on content"],"eeatRefreshActions":["how to improve EEAT during refresh"],"internalLinkUpdates":["how to update internal linking after refresh"],"keywordOpportunity":"new search intent opportunities to capture","publishDateStrategy":"when and how to update the date","estimatedRankingGain":"expected improvement after refresh","topActions":["5 refresh actions ranked by impact"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, title, pubDateMeta, wordCount, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 113. Title Tag A/B Variants */
router.post('/ab/title-variants', async (req, res) => {
  try {
    const { currentTitle, keyword, pageType } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!currentTitle && !keyword) return res.status(400).json({ ok: false, error: 'Current title or keyword required' });
    const prompt = `You are a title tag conversion rate optimizer for organic search. Generate high-CTR A/B title tag variants for: Current title: "${currentTitle || 'N/A'}", Target keyword: "${keyword || 'N/A'}", Page type: "${pageType || 'blog post'}". Psychological triggers proven to boost CTR: numbers, curiosity gaps, fear of missing out, specificity, power words, negative framing, benefit-led, question format. Google title tag rules: 50-60 chars ideally, keyword near the front, match search intent. Return JSON: {"currentTitleAnalysis":{"charCount":${(currentTitle || '').length},"keywordPosition":"start|middle|end","estimatedCTR":"low|medium|high","weaknesses":["issues with current title"]},"variants":[{"title":"variant text","chars":0,"psychologicalTrigger":"trigger used","ctrPrediction":"high|medium","bestForIntent":"informational|commercial|transactional","testHypothesis":"why this should outperform"}],"titleFormulas":["formula 1 — e.g. [Number] + [Adjective] + [Keyword] + [Benefit]"],"keywordPlacement":"where to put keyword for best CTR","charOptimum":"55-60 chars for most queries","topVariants":["top 3 recommended variants to test"]}. Generate 8 variants.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, currentTitle, keyword, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 114. Meta Description A/B Variants */
router.post('/ab/meta-variants', async (req, res) => {
  try {
    const { url, keyword } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url && !keyword) return res.status(400).json({ ok: false, error: 'URL or keyword required' });
    let currentMeta = '';
    let pageTitle = '';
    if (url) {
      try {
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        currentMeta = $('meta[name="description"]').attr('content') || '';
        pageTitle = $('title').text().slice(0, 100);
      } catch {}
    }
    const prompt = `You are a meta description CTR specialist. Create high-CTR meta description A/B variants for: URL: "${url || 'N/A'}", Keyword: "${keyword || 'N/A'}", Current meta: "${currentMeta || 'none set'}", Page title: "${pageTitle}". Meta rules: 150-160 chars, include keyword naturally (it bolds in SERP), end with CTA, emotional hook, specificity. Return JSON: {"currentMetaAnalysis":{"charCount":${currentMeta.length},"hasKeyword":${keyword ? currentMeta.toLowerCase().includes((keyword || '').toLowerCase()) : false},"hasCTA":true/false,"weaknesses":["issues"]},"variants":[{"meta":"variant text","chars":0,"formula":"formula used","emotionalTrigger":"urgency|curiosity|FOMO|trust|benefit","ctrBias":"high|medium","keywordNatural":true/false}],"ctrPrinciples":["5 meta description CTR principles from Google's own studies"],"characterOptimum":"155-160 chars for most queries","boldingStrategy":"how to naturally include the keyword for bolding effect","topVariants":["3 recommended variants"]}. Generate 6 variants.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, keyword, currentMeta, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 115. BERT / NLP Semantic Optimizer */
router.post('/ab/bert-optimizer', async (req, res) => {
  try {
    const { keyword, url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!keyword) return res.status(400).json({ ok: false, error: 'Keyword required' });
    let contentSnippet = '';
    if (url) {
      try {
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        $('script,style,nav,footer').remove();
        contentSnippet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1200);
      } catch {}
    }
    const prompt = `You are a BERT/NLP semantic optimization specialist. BERT (Google's transformer model) understands natural language context. Optimize content semantically for: Keyword: "${keyword}", Content snippet: "${contentSnippet.slice(0, 600) || 'no URL provided — give general advice'}". BERT processes bidirectional context, understands intent beyond keywords, rewards natural language over keyword stuffing. Return JSON: {"semanticScore":0-100,"bertReadiness":"optimized|needs work|poor","intentAnalysis":{"primaryIntent":"what user really wants","secondaryIntents":["other things users want"],"intentMismatch":"is there a mismatch with current content"},"semanticGaps":["concepts missing that BERT expects for this topic"],"coOccurrenceTerms":["terms that naturally occur with this keyword — BERT co-occurrence signals"],"naturalLanguageIssues":["places where keyword stuffing or unnatural phrasing detected"],"sentenceStructureAdvice":"how to write more naturally for BERT","questionAnswerOpportunities":["conversational Q&A pairs that address the full intent"],"topActions":["5 BERT/NLP semantic optimization actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 116. Secondary Keyword Optimizer */
router.post('/ab/secondary-keywords', async (req, res) => {
  try {
    const { primaryKeyword, url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!primaryKeyword) return res.status(400).json({ ok: false, error: 'Primary keyword required' });
    const prompt = `You are a secondary keyword and LSI optimization specialist. Find and optimize secondary keywords for: Primary keyword: "${primaryKeyword}", URL: "${url || 'N/A'}". Secondary keywords are variations, synonyms, and related terms that help Google understand topical coverage. Ahrefs: pages ranking for 1 keyword also rank for ~1000 related terms on average. Return JSON: {"primaryKeywordAnalysis":{"searchIntent":"informational|commercial|transactional|navigational","contentType":"what format ranks best"},"secondaryKeywords":[{"keyword":"secondary term","type":"synonym|variant|related|subtopic|long-tail","searchVolume":"estimated monthly volume","difficulty":"low|medium|high","placement":"title|intro|heading|body|conclusion|FAQ"}],"lsiKeywords":["10 LSI terms to naturally include"],"coOccurrenceTerms":["terms Google expects to see alongside primary keyword"],"headingOpportunities":["H2/H3 headings that would capture secondary keyword traffic"],"contentExtensions":["additional content sections to rank for secondary terms"],"topActions":["5 secondary keyword implementation actions"]}. Include 15 secondary keywords.`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, primaryKeyword, url, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 117. Knowledge Graph Coverage Checker */
router.post('/ab/knowledge-graph', async (req, res) => {
  try {
    const { entityName, domain, industry } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!entityName) return res.status(400).json({ ok: false, error: 'Entity name required' });
    const prompt = `You are a Knowledge Graph coverage and entity optimization specialist. Audit Knowledge Graph coverage for: Entity: "${entityName}", Domain: "${domain || 'N/A'}", Industry: "${industry || 'general'}". Google's Knowledge Graph uses: entity mentions, structured data, Wikipedia/Wikidata presence, consistent NAP signals, co-citation patterns, brand search volume. Return JSON: {"kgCoverageScore":0-100,"kgEligibility":"likely listed|partially listed|not listed|unknown","entityStrength":"strong|moderate|weak","coverageGaps":[{"signal":"coverage signal","currentStatus":"present|missing|weak","fix":"how to build this signal"}],"wikiStrategy":{"worthy":"yes|borderline|unlikely","criteria":["Wikipedia notability criteria to meet"],"alternativePages":["Wikidata","Google Business Profile","industry wikis"]},"knowledgePanelTriggers":["what causes a Knowledge Panel to appear"],"coOccurrenceBuilding":["content strategies to build entity co-occurrence"],"sameAsLocations":["authoritative third-party pages to create/claim"],"topActions":["5 Knowledge Graph coverage actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, entityName, domain, industry, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ─── BATCH 6: TECHNICAL+ FURTHER EXTENSIONS ─── */

/* 118. Crawl Budget Advisor */
router.post('/technical/crawl-budget', async (req, res) => {
  try {
    const { url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const fetchMod = (await import('node-fetch')).default;
    let domain = '';
    try { domain = new URL(url).hostname; } catch {}
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Googlebot' }, signal: AbortSignal.timeout(10000) });
    const html = await r.text();
    const $ = cheerio.load(html);
    const robotsTxtUrl = `${new URL(url).origin}/robots.txt`;
    let robotsTxt = '';
    try { const rr = await fetchMod(robotsTxtUrl, { signal: AbortSignal.timeout(5000) }); robotsTxt = (await rr.text()).slice(0, 600); } catch {}
    const linkCount = $('a[href]').length;
    const hasNoindex = $('meta[name="robots"]').attr('content')?.includes('noindex') || false;
    const hasNofollowLinks = $('a[rel*="nofollow"]').length;
    const queryParamLinks = $('a[href*="?"]').length;
    const prompt = `You are a crawl budget optimization expert. Analyze crawl budget for: URL: "${url}", Domain: "${domain}", Total links on page: ${linkCount}, Links with query params: ${queryParamLinks}, Nofollow links: ${hasNofollowLinks}, Page has noindex: ${hasNoindex}, Robots.txt snippet: "${robotsTxt.slice(0, 300)}". Crawl budget matters for large sites (1000+ pages), ecommerce, news sites. Google allocates limited crawl rate per domain. Return JSON: {"crawlBudgetScore":0-100,"crawlBudgetRisk":"low|medium|high","siteSize":"estimated site type for crawl budget relevance","crawlWasters":[{"issue":"what is wasting crawl budget","pages":"estimated % of crawl budget wasted","fix":"how to fix","priority":"high|medium|low"}],"robotsTxtOptimization":{"findings":"what the robots.txt tells us","improvements":["4 robots.txt improvements"]},"xmlSitemapTips":["how sitemap affects crawl efficiency"],"crawlRateSignals":["factors that affect how often Googlebot visits"],"logFileValue":"why log file analysis would help this site","topActions":["5 crawl budget optimizations"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, domain, linkCount, queryParamLinks, hasNofollowLinks, robotsTxt: robotsTxt.slice(0, 200), ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 119. Click Depth Analyzer */
router.post('/technical/click-depth', async (req, res) => {
  try {
    const { url } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url) return res.status(400).json({ ok: false, error: 'URL required' });
    const urlObj = new URL(url);
    const pathDepth = urlObj.pathname.split('/').filter(Boolean).length;
    const subdirs = urlObj.pathname.split('/').filter(Boolean);
    const prompt = `You are a site architecture and click depth specialist. Analyze click depth for: URL: "${url}", URL path depth: ${pathDepth} levels (${subdirs.join(' > ') || 'root'}). Google's John Mueller: pages more than 3-4 clicks from homepage may get less crawl budget. Optimal: important pages ≤3 clicks from homepage. Return JSON: {"clickDepthScore":0-100,"urlPathDepth":${pathDepth},"depthAssessment":"${pathDepth <= 2 ? 'ideal' : pathDepth === 3 ? 'acceptable' : 'deep'}","issues":["depth-related issues"],"architectureRecommendations":["flat vs deep architecture trade-offs"],"breadcrumbValue":"why breadcrumbs reduce effective click depth","internalLinkStrategy":"how internal links create shortcuts to deep pages","urlStructureRating":"${pathDepth <= 3 ? 'good' : 'too deep'}","improvementOptions":[{"option":"restructuring option","benefit":"seo benefit","effort":"low|medium|high"}],"sitemapMitigation":"how XML sitemaps help deep pages get crawled","topActions":["4 click depth optimization actions"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, urlPathDepth: pathDepth, pathSegments: subdirs, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 120. Log File Analysis Advisor */
router.post('/technical/log-file', async (req, res) => {
  try {
    const { logSnippet, domain } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!logSnippet && !domain) return res.status(400).json({ ok: false, error: 'Log snippet or domain required' });
    const prompt = `You are a server log file SEO analysis expert. Analyze server log data for SEO insights: Domain: "${domain || 'N/A'}", Log snippet (first 1000 chars): "${(logSnippet || '').substring(0, 1000)}". Log file analysis finds: which pages Googlebot actually crawls, crawl frequency patterns, pages never crawled, crawl errors, CSS/JS blocking, slow server responses. Key insight from Semrush research: log files reveal ground truth of how Google sees your site. Return JSON: {"logAnalysisValue":"high|medium|low","keyInsightsToLook":[{"insight":"what to look for","howToFind":"command or filter to apply","seoBenefit":"benefit of this insight"}],"crawlbotPatterns":["patterns in Googlebot behavior to watch for"],"setupGuide":{"nginxCommand":"grep 'Googlebot' access.log | awk '{print $7}' | sort | uniq -c | sort -rn","apacheCommand":"grep 'Googlebot' /var/log/apache2/access.log","cloudflare":"how to get logs from Cloudflare","sampleAnalysis":"${logSnippet ? 'based on provided log' : 'general sample interpretation'}"},"toolsForLogAnalysis":["Semrush Log File Analyzer","Screaming Frog Log Analyzer","JetOctopus","custom grep commands"],"quickWins":["5 quick wins commonly found in log analysis"],"topActions":["5 log file analysis workflow steps"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, domain, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* 121. International SEO Advisor */
router.post('/technical/international-seo', async (req, res) => {
  try {
    const { url, targetMarkets } = req.body || {};
    const model = req.body.model || 'gpt-4o-mini';
    if (!url && !targetMarkets) return res.status(400).json({ ok: false, error: 'URL or target markets required' });
    let siteCtx = {};
    if (url) {
      try {
        const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');
        const { html } = await _fetchPageHtml(url, req);
        const $ = cheerio.load(html);
        siteCtx.lang = $('html').attr('lang') || 'not set';
        siteCtx.hreflangCount = $('link[hreflang]').length;
        siteCtx.title = $('title').text().slice(0, 100);
        siteCtx.hasXDefault = html.includes('hreflang="x-default"');
      } catch {}
    }
    const prompt = `You are an international SEO strategy expert. Create an international SEO expansion strategy for: URL: "${url || 'N/A'}", Target markets: "${targetMarkets || 'specify target countries'}", Current HTML lang: "${siteCtx.lang || 'unknown'}", Hreflang count: ${siteCtx.hreflangCount || 0}, Has x-default: ${siteCtx.hasXDefault || false}. Return JSON: {"internationalSeoScore":0-100,"expansionReadiness":"ready|needs preparation|not ready","urlStructureComparison":{"ccTLD":{"example":"de.brand.com or brand.de","pros":["strong geo signal","local trust"],"cons":["separate authority","more expensive"],"bestFor":"large budgets, established brands"},"subdirectory":{"example":"brand.com/de/","pros":["shares domain authority","easier to manage"],"cons":["weaker geo signal"],"bestFor":"most sites — recommended default"},"subdomain":{"example":"de.brand.com","pros":["easy setup"],"cons":["treated as separate site by Google"],"bestFor":"rarely recommended"}},"marketStrategy":{"markets":"${targetMarkets || 'specify'}","priorityOrder":["most to least important markets"],"localDomainNeeds":["which markets benefit from ccTLD"]},"technicalChecklist":["hreflang implementation","x-default tag","geo-targeting in Search Console","local hosting or CDN"],"contentLocalizationVsTranslation":{"recommendation":"localize vs translate — what Google prefers","keyDifferences":["cultural adaptations needed"]},"topActions":["5 international SEO actions to start"]}`;
    const completion = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, targetMarkets, ...siteCtx, ...data });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

/* ── Shopify Data: pull blog articles + products for auto-fill ──────────── */
router.get('/shopify-data', async (req, res) => {
  try {
    const shopTokens = require('../../core/shopTokens');
    // Resolve shop from session > header > persisted tokens > env
    let shop = req.session?.shop
      || req.headers['x-shopify-shop-domain']
      || (shopTokens.loadAll ? (() => { const all = shopTokens.loadAll(); const keys = Object.keys(all || {}); return keys.length === 1 ? keys[0] : null; })() : null)
      || process.env.SHOPIFY_STORE_URL
      || null;

    if (!shop) return res.json({ ok: true, shop: null, articles: [], products: [], warning: 'No Shopify store connected' });

    const token = shopTokens.getToken
      ? shopTokens.getToken(shop)
      : (process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN || null);

    if (!token) return res.json({ ok: true, shop, articles: [], products: [], warning: 'No Shopify token — reconnect your store in Settings' });

    const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

    // Fetch blogs
    const blogsRes = await fetch(`https://${shop}/admin/api/${ver}/blogs.json?limit=10`, { headers });
    if (!blogsRes.ok) throw new Error(`Shopify blogs fetch failed: ${blogsRes.status}`);
    const blogsJson = await blogsRes.json();
    const blogs = blogsJson.blogs || [];

    // Fetch articles for each blog (up to 5 blogs, 100 articles each)
    let articles = [];
    for (const blog of blogs.slice(0, 5)) {
      const artRes = await fetch(
        `https://${shop}/admin/api/${ver}/blogs/${blog.id}/articles.json?limit=100&fields=id,title,handle,tags,summary_html,published_at,author`,
        { headers }
      );
      if (!artRes.ok) continue;
      const artJson = await artRes.json();
      for (const a of (artJson.articles || [])) {
        articles.push({
          id: a.id,
          title: a.title,
          handle: a.handle,
          tags: a.tags || '',
          excerpt: (a.summary_html || '').replace(/<[^>]+>/g, '').slice(0, 220),
          publishedAt: a.published_at,
          author: a.author || '',
          blogId: blog.id,
          blogHandle: blog.handle,
          blogTitle: blog.title,
          url: `https://${shop}/blogs/${blog.handle}/${a.handle}`,
        });
      }
    }

    // Sort by most recent first
    articles.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

    // Fetch products for keyword seeds (top 50)
    const prodRes = await fetch(
      `https://${shop}/admin/api/${ver}/products.json?limit=50&fields=id,title,handle,tags,product_type`,
      { headers }
    );
    let products = [];
    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      products = (prodJson.products || []).map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        tags: p.tags || '',
        type: p.product_type || '',
      }));
    }

    res.json({ ok: true, shop, articles, products });
  } catch (err) {
    console.error('[blog-seo] /shopify-data error:', err.message);
    res.json({ ok: true, shop: null, articles: [], products: [], warning: err.message });
  }
});

/* =========================================================================
   SHOPIFY BLOG TEMPLATE AUDIT — Shopify-specific SEO checks for blog posts
   ========================================================================= */
router.post('/shopify/blog-template-audit', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
    if (!r.ok) return res.status(502).json({ ok: false, error: `HTTP ${r.status} fetching URL` });
    const html = await r.text();
    const $ = cheerio.load(html);

    const finalUrl = r.url || url;
    const parsed = new URL(finalUrl);
    const pathname = parsed.pathname;

    // Check 1: Shopify blog URL structure (/blogs/[handle]/[post])
    const isShopifyBlogPath = /^\/blogs\/[^/]+\/[^/]+/.test(pathname);
    const slugParts = pathname.split('/').filter(Boolean);

    // Check 2: Canonical tag — ensure it's not pointing to .myshopify.com
    const canonicalHref = $('link[rel="canonical"]').attr('href') || '';
    let canonicalOk = false;
    let canonicalIssue = 'Missing canonical tag';
    if (canonicalHref) {
      try {
        const canonParsed = new URL(canonicalHref);
        if (canonParsed.hostname.includes('.myshopify.com') && !parsed.hostname.includes('.myshopify.com')) {
          canonicalIssue = `Canonical points to .myshopify.com domain (${canonParsed.hostname}) instead of your custom domain. This can suppress custom domain rankings.`;
        } else if (canonParsed.pathname.split('/').filter(Boolean)[0] !== 'blogs') {
          canonicalIssue = `Canonical does not point to /blogs/ URL pathway — may cause indexation issues`;
        } else {
          canonicalOk = true;
          canonicalIssue = '';
        }
      } catch { canonicalIssue = 'Invalid canonical URL'; }
    }

    // Check 3: Meta description
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const hasMetaDesc = metaDesc.length >= 50 && metaDesc.length <= 160;

    // Check 4: Title length
    const title = $('title').text().trim();
    const titleLengthOk = title.length >= 30 && title.length <= 70;

    // Check 5: H1 present
    const h1 = $('h1').first().text().trim();
    const hasH1 = h1.length > 0;

    // Check 6: Missing OG image
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const hasOgImage = ogImage.length > 0;

    // Check 7: noindex check
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robotsMeta);

    // Check 8: Article JSON-LD structured data
    let hasArticleSchema = false;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const d = JSON.parse($(el).html());
        const arr = Array.isArray(d['@graph']) ? d['@graph'] : [d];
        if (arr.some(n => ['Article','BlogPosting','NewsArticle'].includes(n['@type']))) hasArticleSchema = true;
      } catch {}
    });

    // Check 9: datePublished in schema or meta
    const datePublishedMeta = $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').attr('datetime') || '';
    const hasDatePublished = datePublishedMeta.length > 0 || hasArticleSchema;

    // Check 10: Shopify /blogs/ URL structure (no dates, no IDs, correct handle)
    const slugLastPart = slugParts[slugParts.length - 1] || '';
    const slugHasDate = /\d{4}-\d{2}-\d{2}/.test(slugLastPart);
    const slugHasNumbers = /^\d+$/.test(slugLastPart);
    const slugHasWords = slugLastPart.split('-').filter(w => isNaN(w) && w.length > 1).length >= 2;
    const slugOk = isShopifyBlogPath && !slugHasDate && !slugHasNumbers && slugHasWords;

    const checks = [
      { name: 'Shopify /blogs/[handle]/[slug] URL structure', pass: isShopifyBlogPath, value: pathname, tip: 'URL should follow /blogs/[blog-handle]/[post-slug] — avoid numeric IDs or date-based slugs.' },
      { name: 'SEO-friendly URL slug (descriptive, no dates)', pass: slugOk, value: slugLastPart, tip: 'Use keyword-rich hyphenated slugs. Avoid date stamps or numeric post IDs in the URL.' },
      { name: 'Canonical tag pointing to custom domain', pass: canonicalOk, value: canonicalHref || 'Missing', tip: canonicalIssue || 'Add <link rel="canonical"> to the page head.' },
      { name: 'Meta description (50-160 chars)', pass: hasMetaDesc, value: metaDesc ? `${metaDesc.length} chars` : 'Missing', tip: 'Set a unique meta description in Shopify Online Store → Blog Posts → SEO section.' },
      { name: 'Page title (30-70 chars)', pass: titleLengthOk, value: title ? `"${title.slice(0, 50)}…" (${title.length} chars)` : 'Missing', tip: 'Edit the post SEO title in Shopify — aim for 50-60 characters including primary keyword.' },
      { name: 'H1 heading present', pass: hasH1, value: h1 ? `"${h1.slice(0, 60)}"` : 'Missing', tip: 'Ensure your blog post title renders as an H1 in your Shopify theme.' },
      { name: 'OG image (social sharing image)', pass: hasOgImage, value: ogImage ? 'Present' : 'Missing', tip: 'Upload a featured image to your Shopify blog post — this becomes the og:image automatically.' },
      { name: 'Article or BlogPosting JSON-LD schema', pass: hasArticleSchema, value: hasArticleSchema ? 'Present' : 'Missing', tip: 'Add BlogPosting JSON-LD via a Shopify app or theme snippet. Many Shopify themes omit this by default.' },
      { name: 'Published date in meta or schema', pass: !!datePublishedMeta, value: datePublishedMeta || 'Not found', tip: 'Add article:published_time meta tag or a <time> element to help Google detect publication date.' },
      { name: 'Page not noindex', pass: !hasNoindex, value: hasNoindex ? 'noindex DETECTED' : 'Indexed', tip: 'Remove noindex from your Shopify blog post — this prevents Google from indexing it.' },
    ];

    const passedCount = checks.filter(c => c.pass).length;
    const score = Math.round((passedCount / checks.length) * 100);
    const issueCount = checks.filter(c => !c.pass).length;

    res.json({ ok: true, url, score, issueCount, passedCount, total: checks.length, checks, title, h1, metaDesc, isShopifyBlogPath });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SHOPIFY COLLECTION SEO — SEO audit specific to collection pages
   ========================================================================= */
router.post('/shopify/collection-seo', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    const fetchMod = (await import('node-fetch')).default;
    const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 12000 });
    if (!r.ok) return res.status(502).json({ ok: false, error: `HTTP ${r.status} fetching URL` });
    const html = await r.text();
    const $ = cheerio.load(html);
    const finalUrl = r.url || url;
    const parsed = new URL(finalUrl);

    // Check 1: /collections/ URL structure
    const isCollectionPath = parsed.pathname.startsWith('/collections/');
    const hasQueryParams = parsed.search.length > 0;
    const hasSortBy = /sort_by=/i.test(parsed.search);
    const hasFilterParam = /filter\./i.test(parsed.search);

    // Check 2: Canonical — collection pages with ?sort_by= should canonicalize to base URL
    const canonicalHref = $('link[rel="canonical"]').attr('href') || '';
    let canonicalOk = false;
    let canonicalIssue = 'Missing canonical tag';
    if (canonicalHref) {
      try {
        const canonParsed = new URL(canonicalHref, url);
        const baseUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
        if (canonParsed.href === baseUrl || canonParsed.pathname === parsed.pathname) {
          canonicalOk = true; canonicalIssue = '';
        } else {
          canonicalIssue = `Canonical (${canonicalHref}) doesn't match base collection URL — filter/sort variants may compete.`;
        }
      } catch { canonicalIssue = 'Invalid canonical URL'; }
    }

    // Check 3: Meta description
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const hasMetaDesc = metaDesc.length >= 50;

    // Check 4: H1 heading
    const h1 = $('h1').first().text().trim();
    const hasH1 = h1.length > 0;

    // Check 5: Count products on page (thin collection)
    const productCards = $('[class*="product"], [class*="grid-item"], [data-product-id]').length;
    const hasSufficientProducts = productCards >= 4;

    // Check 6: OG meta
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const hasOgTags = ogTitle.length > 0;

    // Check 7: Pagination — look for rel=next/prev or page-type links
    const hasPagination = $('link[rel="next"], link[rel="prev"]').length > 0 || $('a[href*="?page="]').length > 0;
    const paginationCanonicalOk = !hasPagination || canonicalOk;

    // Check 8: noindex
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robotsMeta);

    // Check 9: Collection description (thin content)
    const descriptionEl = $('[class*="collection-description"], [class*="collection__description"], .rte').first();
    const descText = descriptionEl.text().trim();
    const hasCollectionDescription = descText.split(/\s+/).length >= 30;

    // Check 10: ?sort_by redirect/canonical
    const sortByParamNeedsCanonical = hasSortBy && !canonicalOk;

    const checks = [
      { name: 'Shopify /collections/ URL path', pass: isCollectionPath, value: parsed.pathname, tip: 'Collection pages should live at /collections/[handle].' },
      { name: 'Canonical tag present and correct', pass: canonicalOk, value: canonicalHref || 'Missing', tip: canonicalIssue || 'Collections with sort/filter params need canonical to base URL to prevent duplicate content.' },
      { name: 'No ?sort_by= without canonical', pass: !sortByParamNeedsCanonical, value: hasSortBy ? '?sort_by param detected without canonical' : 'No sort_by issue', tip: 'Shopify add ?sort_by= to collection URLs — each variant needs a canonical pointing back to the main collection.' },
      { name: 'Meta description (≥50 chars)', pass: hasMetaDesc, value: metaDesc ? `${metaDesc.length} chars` : 'Missing', tip: 'Add a unique collection meta description in Shopify Admin → Collections → SEO section.' },
      { name: 'H1 heading (collection name)', pass: hasH1, value: h1 || 'Missing', tip: 'Your theme should render the collection title as an H1. Check your theme liquid files.' },
      { name: 'Collection description content (≥30 words)', pass: hasCollectionDescription, value: descText ? `${descText.split(/\s+/).length} words` : 'No description', tip: 'Add a rich collection description in Shopify Admin — this provides keyword context and avoids thin content penalties.' },
      { name: 'Sufficient products on page (≥4 products)', pass: hasSufficientProducts, value: `${productCards} product cards detected`, tip: 'Collections with fewer than 4 products may be flagged as thin. Consider consolidating or expanding the collection.' },
      { name: 'OG meta tags for social sharing', pass: hasOgTags, value: ogTitle ? 'Present' : 'Missing', tip: 'Add og:title and og:image via theme — ensures rich sharing cards on social media.' },
      { name: 'Page not noindex', pass: !hasNoindex, value: hasNoindex ? 'noindex DETECTED' : 'Indexed', tip: 'Remove noindex from this collection — some Shopify apps accidentally add noindex to collection pages.' },
    ];

    const passedCount = checks.filter(c => c.pass).length;
    const score = Math.round((passedCount / checks.length) * 100);
    const issueCount = checks.filter(c => !c.pass).length;

    res.json({ ok: true, url, score, issueCount, passedCount, total: checks.length, checks, productCount: productCards, h1, metaDesc, isCollectionPath });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SHOPIFY PRODUCT ↔ BLOG CROSS-LINK OPTIMIZER — AI suggests links (2 credits)
   ========================================================================= */
router.post('/shopify/product-blog-links', async (req, res) => {
  try {
    const { productUrl, blogUrl, model = 'gpt-4o-mini' } = req.body || {};
    if (!productUrl && !blogUrl) return res.status(400).json({ ok: false, error: 'productUrl or blogUrl required' });

    const fetchMod = (await import('node-fetch')).default;

    async function fetchPageContext(url) {
      if (!url) return null;
      try {
        const r = await fetchMod(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0)' }, timeout: 10000 });
        if (!r.ok) return null;
        const html = await r.text();
        const $ = cheerio.load(html);
        const title = $('title').text().trim() || $('h1').first().text().trim();
        const desc = $('meta[name="description"]').attr('content') || '';
        const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 1000);
        return { url, title, desc, bodyText };
      } catch { return null; }
    }

    const [productCtx, blogCtx] = await Promise.all([
      productUrl ? fetchPageContext(productUrl) : Promise.resolve(null),
      blogUrl ? fetchPageContext(blogUrl) : Promise.resolve(null),
    ]);

    const openai = getOpenAI();
    const prompt = `You are a Shopify SEO expert specialising in internal linking strategy between product pages and blog posts.

${productCtx ? `PRODUCT PAGE:\nURL: ${productCtx.url}\nTitle: ${productCtx.title}\nDescription: ${productCtx.desc}\nContent excerpt: ${productCtx.bodyText}` : ''}
${blogCtx ? `\nBLOG POST:\nURL: ${blogCtx.url}\nTitle: ${blogCtx.title}\nDescription: ${blogCtx.desc}\nContent excerpt: ${blogCtx.bodyText}` : ''}

Generate cross-linking suggestions to build topical authority and drive product discovery:
1. 3 suggestions for linking from the product page to the blog post (what anchor text to use in the product description to link naturally to the blog post)
2. 3 suggestions for linking from the blog post to the product page (what anchor text and context sentence to use in the blog body)

Respond ONLY as JSON:
{
  "productToBlog": [
    { "anchorText": "string (3-6 words)", "contextSentence": "sentence where this link fits naturally in product description", "rationale": "why this link adds value" }
  ],
  "blogToProduct": [
    { "anchorText": "string (3-6 words)", "contextSentence": "sentence where this link fits naturally in blog body", "rationale": "why this link drives conversions and builds topical authority" }
  ],
  "tip": "One strategic tip about product-blog interlinking for this Shopify store"
}`;

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, productUrl, blogUrl, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   SHOPIFY METAFIELD SEO GENERATOR — AI generates optimised metafield values (2 credits)
   ========================================================================= */
router.post('/shopify/metafield-seo', async (req, res) => {
  try {
    const { context, type = 'product', model = 'gpt-4o-mini' } = req.body || {};
    if (!context) return res.status(400).json({ ok: false, error: 'context required' });

    const openai = getOpenAI();

    const typeLabels = {
      product: 'Shopify product page',
      collection: 'Shopify collection page',
      blog_post: 'Shopify blog post',
      homepage: 'Shopify store homepage',
    };
    const label = typeLabels[type] || 'Shopify page';

    const prompt = `You are a Shopify SEO expert. Generate SEO-optimised metafield values for a ${label} based on this context:

${context}

Generate values for these Shopify metafields that are ready to paste directly into Shopify's theme editor or Admin:
1. seo.title — SEO meta title (50-60 chars, includes primary keyword near the front)
2. seo.description — SEO meta description (120-155 chars, includes CTA, keyword-rich)
3. custom.og_title — Open Graph title for social sharing (60-70 chars, engaging)
4. custom.og_description — OG description (160-180 chars, compelling social copy)
5. custom.seo_summary — Short SEO-optimised text snippet (100-150 words) for use in collection descriptions, product highlights, or page introductions

Respond ONLY as JSON:
{
  "fields": [
    {
      "namespace": "seo" or "custom",
      "key": "metafield key name",
      "value": "the optimised value",
      "tip": "brief note on where to add this in Shopify Admin"
    }
  ],
  "note": "One tip on using Shopify metafields for SEO"
}`;

    const resp = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, type, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =========================================================================
   AI GROWTH — 12 next-generation AI-powered SEO growth tools
   ========================================================================= */

/* 1. Content Calendar Generator — AI builds a 30/90-day editorial calendar (3 credits) */
router.post('/ai/content-calendar', async (req, res) => {
  try {
    const { niche, audience, goals = [], duration = 30, postsPerWeek = 3, existingTopics = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche is required' });
    const openai = getOpenAI();
    const prompt = `You are a content strategy expert. Build a ${duration}-day editorial calendar for a blog in the "${niche}" niche.
Target audience: ${audience || 'general audience'}
Publishing frequency: ${postsPerWeek} posts/week
Goals: ${goals.length ? goals.join(', ') : 'organic traffic, authority building'}
${existingTopics.length ? `Existing topics to avoid duplicating: ${existingTopics.join(', ')}` : ''}

Create a detailed editorial calendar. Respond ONLY as JSON:
{
  "summary": "brief strategy overview",
  "weeks": [
    {
      "week": 1,
      "theme": "weekly theme/focus",
      "posts": [
        {
          "day": "Monday",
          "title": "blog post title",
          "type": "pillar|cluster|list|how-to|roundup|news|comparison|case-study",
          "targetKeyword": "primary keyword",
          "searchIntent": "informational|commercial|navigational|transactional",
          "estimatedWordCount": 1500,
          "priority": "high|medium|low",
          "notes": "brief notes on angle or approach"
        }
      ]
    }
  ],
  "contentMix": { "pillar": 20, "cluster": 40, "list": 20, "howTo": 20 },
  "quickWins": ["3 easy first posts to publish for fast rankings"],
  "longTermBets": ["2 high-effort posts with high payoff potential"]
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, niche, duration, postsPerWeek, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 2. Pillar Page Builder — content hub + cluster topic map (3 credits) */
router.post('/ai/pillar-page', async (req, res) => {
  try {
    const { topic, audience, depth = 'comprehensive', model = 'gpt-4o-mini' } = req.body || {};
    if (!topic) return res.status(400).json({ ok: false, error: 'topic is required' });
    const openai = getOpenAI();
    const prompt = `You are a topical authority expert. Build a complete pillar page content hub for the topic: "${topic}"
Target audience: ${audience || 'general'}
Depth: ${depth}

Design the pillar page structure and all supporting cluster articles to build topical authority.
Respond ONLY as JSON:
{
  "pillarTitle": "exact title for the pillar page",
  "pillarSlug": "url-slug",
  "pillarWordCount": 4500,
  "pillarOutline": ["H2 sections array"],
  "targetKeywords": { "primary": "string", "secondary": ["array"] },
  "clusterTopics": [
    {
      "title": "cluster post title",
      "slug": "url-slug",
      "angle": "specific angle that differentiates from pillar",
      "targetKeyword": "primary keyword",
      "searchVolume": "high|medium|low",
      "difficulty": "easy|medium|hard",
      "linkAnchor": "anchor text to use when linking from pillar",
      "wordCount": 1200
    }
  ],
  "internalLinkingMap": [
    { "from": "pillar or cluster title", "to": "target title", "anchorText": "suggested anchor" }
  ],
  "topicalCoverageScore": 85,
  "gaps": ["topics still needed to complete topical authority"]
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, topic, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 3. Programmatic SEO Templates — scalable content templates for data-driven pages (3 credits) */
router.post('/ai/programmatic-seo', async (req, res) => {
  try {
    const { category, dataVariables = [], exampleRow = {}, targetPage = 'landing page', model = 'gpt-4o-mini' } = req.body || {};
    if (!category) return res.status(400).json({ ok: false, error: 'category is required' });
    const openai = getOpenAI();
    const prompt = `You are a programmatic SEO expert. Create scalable content templates for the category: "${category}"
Data variables available: ${dataVariables.join(', ') || 'city, product, category, year'}
Example row: ${JSON.stringify(exampleRow)}
Target page type: ${targetPage}

Generate a programmatic SEO template system. Respond ONLY as JSON:
{
  "templateTitle": "template name",
  "titleFormula": "Title template using {variables} e.g. 'Best {product} in {city} ({year})'",
  "metaDescFormula": "Meta description template with {variables}",
  "h1Formula": "H1 formula",
  "sections": [
    {
      "heading": "section heading formula",
      "contentTemplate": "content block template using {variables}",
      "wordCount": 120,
      "purpose": "why this section helps SEO"
    }
  ],
  "uniquenessStrategies": ["ways to ensure each page has unique value"],
  "internalLinkingFormula": "how to interlink programmatic pages",
  "schemaType": "most appropriate schema markup type",
  "estimatedPages": 500,
  "trafficPotential": "description of traffic potential",
  "warnings": ["risks or pitfalls to avoid"]
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, category, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 4. Content ROI Estimator — predict traffic & revenue value of planned content (2 credits) */
router.post('/ai/content-roi', async (req, res) => {
  try {
    const { keyword, monthlySearchVolume, currentPosition = 'not ranking', targetPosition = 3, conversionRate = 2, avgOrderValue = 50, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword is required' });
    const openai = getOpenAI();
    const ctrMap = { 1: 0.279, 2: 0.152, 3: 0.105, 4: 0.078, 5: 0.061, 6: 0.046, 7: 0.038, 8: 0.035, 9: 0.032, 10: 0.025 };
    const targetCtr = ctrMap[targetPosition] || 0.03;
    const estMonthlyClicks = Math.round((monthlySearchVolume || 1000) * targetCtr);
    const estLeads = Math.round(estMonthlyClicks * (conversionRate / 100));
    const estRevenue = estLeads * avgOrderValue;
    const prompt = `You are a content ROI analyst. Estimate the business value of creating content targeting: "${keyword}"
Monthly search volume: ${monthlySearchVolume || 'unknown'}
Current position: ${currentPosition}
Target position: ${targetPosition}
Estimated monthly clicks at target: ${estMonthlyClicks}
Conversion rate: ${conversionRate}%
AOV: $${avgOrderValue}

Provide an ROI analysis. Respond ONLY as JSON:
{
  "contentOpportunityScore": 78,
  "ttRank": "estimated months to reach target position",
  "competitionLevel": "low|medium|high",
  "effortEstimate": "estimated hours to create quality content",
  "contentType": "recommended content format (guide, listicle, comparison, etc.)",
  "wordCount": 2000,
  "risks": ["potential risks"],
  "boostStrategies": ["ways to accelerate ranking"],
  "similarKeywords": ["3-5 semantically related keywords to also target"],
  "verdict": "short recommendation paragraph"
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, keyword, monthlySearchVolume, targetPosition, estMonthlyClicks, estLeads, estMonthlyRevenue: estRevenue, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 5. SGE / AI Overview Optimizer — optimize content for Google AI Overviews & Perplexity (2 credits) */
router.post('/ai/sge-optimizer', async (req, res) => {
  try {
    const { content, url, keyword, aiEngine = 'google-aio', model = 'gpt-4o-mini' } = req.body || {};
    if (!content && !url) return res.status(400).json({ ok: false, error: 'content or url required' });
    const openai = getOpenAI();
    const engineNames = { 'google-aio': 'Google AI Overview', 'perplexity': 'Perplexity AI', 'chatgpt': 'ChatGPT Browse', 'bing-copilot': 'Bing Copilot' };
    const prompt = `You are an AI search optimization expert. Analyze and optimize this content for inclusion in ${engineNames[aiEngine] || 'AI search engines'}.
Target keyword: ${keyword || 'not specified'}
Content (first 3000 chars): ${(content || '').slice(0, 3000)}

Evaluate and provide optimization guidance. Respond ONLY as JSON:
{
  "aioScore": 72,
  "citationLikelihood": "high|medium|low",
  "currentStrengths": ["what the content does well for AI visibility"],
  "weaknesses": ["what's holding it back"],
  "optimizations": [
    {
      "type": "add-definition|improve-structure|add-faq|improve-entity-coverage|add-statistics|improve-first-paragraph",
      "description": "what to do",
      "example": "concrete example of the improvement",
      "impact": "high|medium|low"
    }
  ],
  "idealFirstParagraph": "rewritten first paragraph optimized for AI citation",
  "suggestedFAQs": [
    { "question": "string", "answer": "concise direct answer (40-60 words)" }
  ],
  "entityGaps": ["important entities/concepts missing from the content"],
  "structureRecommendations": ["structural changes to improve AI parsing"]
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, aiEngine, keyword, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 6. Forum / Reddit Topic Miner — discover real audience questions for blog ideas (2 credits) */
router.post('/ai/topic-miner', async (req, res) => {
  try {
    const { niche, targetAudience, painPoints = [], sources = ['reddit', 'quora', 'forums'], model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche is required' });
    const openai = getOpenAI();
    const prompt = `You are a content research expert who mines online communities for authentic blog topics. Research the "${niche}" niche for ${targetAudience || 'general audience'}.
Pain points: ${painPoints.join(', ') || 'Not specified'}
Sources to simulate: ${sources.join(', ')}

Simulate what real people in this niche discuss online and generate blog ideas from those discussions. Respond ONLY as JSON:
{
  "topDiscussions": [
    {
      "source": "reddit|quora|forum",
      "community": "subreddit or community name",
      "question": "the actual question/discussion topic",
      "upvotes": 847,
      "sentiment": "frustrated|curious|excited|confused",
      "insight": "what this reveals about audience needs"
    }
  ],
  "blogIdeas": [
    {
      "title": "blog post title",
      "angle": "unique angle derived from the community discussions",
      "targetKeyword": "primary keyword",
      "searchVolume": "high|medium|low",
      "opportunityScore": 82,
      "hook": "first sentence to grab the reader",
      "source": "which discussion inspired this"
    }
  ],
  "audienceInsights": ["key insights about what this audience truly cares about"],
  "contentGaps": ["topics the audience needs but can't find good answers to"],
  "toneRecommendations": "recommended tone and voice based on community style"
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 7. Social SEO Signal Scorer — score social sharing potential & SEO signal strength (1 credit) */
router.post('/social/seo-score', async (req, res) => {
  try {
    const { title, description, url, content, model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title is required' });
    const openai = getOpenAI();
    const prompt = `You are a social media SEO specialist. Score the social sharing potential and SEO signal strength of this content.
Title: ${title}
Description: ${description || ''}
URL: ${url || ''}
Content excerpt: ${(content || '').slice(0, 1500)}

Analyze social SEO signals. Respond ONLY as JSON:
{
  "overallScore": 74,
  "scores": {
    "shareability": 80,
    "clickability": 75,
    "emotionalResonance": 70,
    "ogOptimization": 65,
    "twitterCardScore": 72,
    "linkBaitPotential": 68
  },
  "platforms": [
    {
      "platform": "Twitter/X|LinkedIn|Facebook|Pinterest|Reddit",
      "score": 78,
      "strengths": ["what works"],
      "improvements": ["what to fix"],
      "idealPost": "ready-to-use social post copy for this platform"
    }
  ],
  "ogSuggestions": {
    "idealOgTitle": "optimized OG title",
    "idealOgDescription": "optimized OG description",
    "imageRecommendation": "image type that would maximize CTR"
  },
  "viralTriggers": ["emotional/psychological triggers present in content"],
  "missingTriggers": ["triggers that could be added to boost sharing"]
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, title, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 8. Competitor Blog Full Audit — deep AI analysis of competitor blog strategy (5 credits) */
router.post('/competitor/full-audit', async (req, res) => {
  try {
    const { competitorUrl, yourNiche, yourAudience, model = 'gpt-4o-mini' } = req.body || {};
    if (!competitorUrl) return res.status(400).json({ ok: false, error: 'competitorUrl is required' });
    const openai = getOpenAI();
    // Try to fetch competitor page
    let competitorData = {};
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10000);
      const resp = await fetch(competitorUrl, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEOBot/1.0)' } });
      clearTimeout(t);
      const html = await resp.text();
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      $('script,style,noscript').remove();
      competitorData = {
        title: $('title').text().trim(),
        h1: $('h1').first().text().trim(),
        metaDesc: $('meta[name="description"]').attr('content') || '',
        wordCount: $('body').text().split(/\s+/).length,
        h2s: $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10),
        links: $('a[href]').length,
        images: $('img').length,
      };
    } catch (_) { /* proceed without live data */ }

    const prompt = `You are a competitive intelligence expert for SEO. Audit this competitor's blog strategy.
URL: ${competitorUrl}
Niche: ${yourNiche || 'general'}
${Object.keys(competitorData).length ? `Live page data:\n${JSON.stringify(competitorData, null, 2)}` : ''}

Provide a comprehensive competitive audit. Respond ONLY as JSON:
{
  "overallStrength": "weak|moderate|strong|dominant",
  "domainAuthority": "estimated low|medium|high|very-high",
  "contentStrategy": {
    "primaryTopics": ["main topics they cover"],
    "contentTypes": ["blog types they use"],
    "publishingFrequency": "estimated posts/month",
    "avgWordCount": 1800,
    "contentQuality": "thin|standard|comprehensive|exceptional"
  },
  "seoStrengths": ["what they do well"],
  "seoWeaknesses": ["gaps and weaknesses to exploit"],
  "topicGaps": ["topics they don't cover well that you should own"],
  "keywordOpportunities": [
    { "keyword": "string", "difficulty": "easy|medium|hard", "rationale": "why it's an opportunity" }
  ],
  "contentAngleOpportunities": ["specific angles you could use to out-rank them"],
  "linkBuildingInsights": ["observations about their link profile"],
  "battlePlan": ["5 prioritized actions to outrank this competitor"]
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, competitorUrl, liveData: competitorData, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 9. Link Reclamation Finder — find unlinked brand/topic mentions to convert to links (2 credits) */
router.post('/backlinks/link-reclamation', async (req, res) => {
  try {
    const { brandName, siteUrl, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName is required' });
    const openai = getOpenAI();
    const prompt = `You are an expert in link reclamation and digital PR. Help find and reclaim unlinked mentions for: "${brandName}"
Website: ${siteUrl || 'not provided'}
Niche: ${niche || 'general'}

Generate a comprehensive link reclamation strategy. Respond ONLY as JSON:
{
  "searchStrings": [
    { "query": "exact Google search string to find unlinked mentions", "intent": "what this finds" }
  ],
  "likelyMentionSources": [
    {
      "sourceType": "news|blog|directory|forum|social|podcast",
      "description": "where mentions are likely to appear",
      "priority": "high|medium|low",
      "tipToFind": "how to discover these mentions"
    }
  ],
  "outreachTemplates": [
    {
      "scenario": "mention type (e.g. brand mention without link)",
      "subject": "email subject line",
      "body": "email template with [placeholders]"
    }
  ],
  "monitoringSetup": {
    "googleAlerts": ["recommended Google Alert queries"],
    "tools": ["recommended monitoring tools"],
    "frequency": "how often to check"
  },
  "reclamationPriority": "how to prioritize which mentions to pursue first",
  "estimatedLinks": "realistic estimate of links recovereable per month"
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, brandName, siteUrl, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 10. Google News SEO Checker — eligibility & optimisation for Google News (1 credit) */
router.post('/technical/google-news', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url is required' });
    const openai = getOpenAI();
    let pageData = {};
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const resp = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEOBot/1.0)' } });
      clearTimeout(t);
      const html = await resp.text();
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      pageData = {
        title: $('title').text().trim(),
        h1: $('h1').first().text().trim(),
        metaDesc: $('meta[name="description"]').attr('content') || '',
        author: $('meta[name="author"]').attr('content') || $('[rel="author"]').first().text().trim() || '',
        datePublished: $('meta[property="article:published_time"]').attr('content') || $('time').first().attr('datetime') || '',
        hasNewsKeywords: !!$('meta[name="news_keywords"]').attr('content'),
        newsKeywords: $('meta[name="news_keywords"]').attr('content') || '',
        hasArticleSchema: html.includes('"NewsArticle"') || html.includes('"Article"'),
        wordCount: $('article, main, [role="main"]').text().split(/\s+/).length || $('body').text().split(/\s+/).length,
        hasImages: $('article img, main img').length > 0,
        byline: $('[itemprop="author"], .author, .byline').first().text().trim(),
      };
    } catch (_) { /* proceed */ }

    const prompt = `You are a Google News SEO specialist. Evaluate this URL for Google News inclusion eligibility.
URL: ${url}
Page data: ${JSON.stringify(pageData)}

Evaluate all Google News Publisher criteria and technical requirements. Respond ONLY as JSON:
{
  "eligibilityScore": 72,
  "isEligible": true,
  "criteria": [
    {
      "name": "criterion name",
      "pass": true,
      "current": "current state",
      "required": "what Google News requires",
      "fix": "how to fix if failing"
    }
  ],
  "criticalIssues": ["blockers that prevent Google News inclusion"],
  "quickWins": ["easy fixes to improve eligibility"],
  "newsKeywordsOptimized": ["recommended news_keywords meta values"],
  "publisherRequirements": ["editorial standards and policies to ensure compliance"],
  "technicalChecklist": ["technical SEO items needed for News eligibility"],
  "estimatedTimeToApproval": "rough estimate once issues are fixed"
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, url, pageData, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 11. Content Performance Predictor — predict traffic potential before publishing (2 credits) */
router.post('/ai/performance-predictor', async (req, res) => {
  try {
    const { title, outline, targetKeyword, wordCount = 1500, contentType = 'guide', model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title is required' });
    const openai = getOpenAI();
    const prompt = `You are a data-driven content strategy expert. Predict the SEO performance of this planned content BEFORE it is published.
Title: ${title}
Target keyword: ${targetKeyword || 'not specified'}
Content type: ${contentType}
Planned word count: ${wordCount}
Outline: ${outline || 'not provided'}

Based on patterns from successful content in this space, predict performance outcomes. Respond ONLY as JSON:
{
  "overallScore": 78,
  "trafficPrediction": {
    "month3": { "visits": 120, "confidence": "low" },
    "month6": { "visits": 580, "confidence": "medium" },
    "month12": { "visits": 1200, "confidence": "medium" }
  },
  "rankingPrediction": {
    "targetPosition": 7,
    "timeToRank": "4-8 months",
    "featuredSnippetChance": 22
  },
  "strengthFactors": ["what makes this content likely to perform well"],
  "riskFactors": ["what might limit performance"],
  "prePublishOptimizations": [
    {
      "action": "specific improvement to make before publishing",
      "impact": "high|medium|low",
      "effort": "low|medium|high"
    }
  ],
  "titleAlternatives": ["2 alternative title variations that could rank better"],
  "competitionSnapshot": "brief overview of expected SERP competition",
  "verdict": "one sentence overall prediction verdict"
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, title, targetKeyword, wordCount, contentType, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* 12. Semantic Cluster Builder — build a semantic keyword/entity cluster map (2 credits) */
router.post('/ai/semantic-clusters', async (req, res) => {
  try {
    const { seedTopic, industry, depth = 2, model = 'gpt-4o-mini' } = req.body || {};
    if (!seedTopic) return res.status(400).json({ ok: false, error: 'seedTopic is required' });
    const openai = getOpenAI();
    const prompt = `You are a semantic SEO expert. Build a comprehensive semantic keyword and entity cluster map for: "${seedTopic}"
Industry: ${industry || 'general'}
Cluster depth: ${depth} levels

Map all semantically related topics, entities and keywords that Google associates with this topic.
Respond ONLY as JSON:
{
  "coreTopic": "${seedTopic}",
  "coreEntities": ["main named entities (people, places, organisations, concepts) Google associates with this topic"],
  "clusters": [
    {
      "clusterName": "sub-topic cluster name",
      "clusterKeyword": "primary keyword for this cluster",
      "semanticRelationship": "how it relates to core topic",
      "keywords": ["5-8 keywords in this cluster"],
      "entities": ["entities in this cluster"],
      "contentIdea": "blog post that covers this cluster well"
    }
  ],
  "topicalDepth": {
    "mustCover": ["topics essential for topical authority"],
    "shouldCover": ["topics that would improve coverage"],
    "couldCover": ["topics for maximum coverage"]
  },
  "entityRelationships": [
    { "entity1": "string", "entity2": "string", "relationship": "description of relationship" }
  ],
  "coOccurrenceTerms": ["words/phrases that should naturally appear in content on this topic"],
  "semanticScore": 0,
  "coverageGrade": "A|B|C|D"
}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, seedTopic, industry, ...parsed });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


/* =========================================================================
   BRAND VOICE LIBRARY
   ========================================================================= */
const fs = require('fs');
const path = require('path');

function getVoicePath(shop) {
  return path.join(__dirname, '../../../data', `voice-profiles-${shop}.json`);
}
function loadVoices(shop) {
  try { return JSON.parse(fs.readFileSync(getVoicePath(shop), 'utf8')); } catch { return []; }
}
function saveVoices(shop, data) {
  fs.writeFileSync(getVoicePath(shop), JSON.stringify(data, null, 2));
}

router.get('/voice-profile', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  res.json({ ok: true, profiles: loadVoices(shop) });
});

// POST version used by the dashboard card which sends shop in the request body
router.post('/voice-profile', (req, res) => {
  const shop = req.body?.shop || req.headers['x-shopify-shop-domain'] || 'default';
  res.json({ ok: true, profiles: loadVoices(shop) });
});

router.post('/voice-profile/save', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { id, name, tone, vocabulary, rules, sample, avoid } = req.body;
  if (!name) return res.status(400).json({ ok: false, error: 'name required' });
  const profiles = loadVoices(shop);
  const existing = id ? profiles.findIndex(p => p.id === id) : -1;
  const profile = { id: id || `vp_${Date.now()}`, name, tone: tone || '', vocabulary: vocabulary || '', rules: rules || '', sample: sample || '', avoid: avoid || '', updatedAt: new Date().toISOString() };
  if (existing >= 0) profiles[existing] = profile;
  else profiles.push(profile);
  saveVoices(shop, profiles);
  res.json({ ok: true, profile });
});

router.get('/voice-profile/:id', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const profile = loadVoices(shop).find(p => p.id === req.params.id);
  if (!profile) return res.status(404).json({ ok: false, error: 'Profile not found' });
  res.json({ ok: true, profile });
});

router.delete('/voice-profile/:id', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const profiles = loadVoices(shop).filter(p => p.id !== req.params.id);
  saveVoices(shop, profiles);
  res.json({ ok: true });
});


/* =========================================================================
   RANK TRACKER
   ========================================================================= */
function getRankPath(shop) { return path.join(__dirname, '../../../data', `rank-tracker-${shop}.json`); }
function loadRankData(shop) { try { return JSON.parse(fs.readFileSync(getRankPath(shop), 'utf8')); } catch { return { keywords: [], history: {} }; } }
function saveRankData(shop, data) { fs.writeFileSync(getRankPath(shop), JSON.stringify(data, null, 2)); }

router.post('/rank/add-keyword', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { keyword, targetUrl, tags } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  const data = loadRankData(shop);
  const entry = { id: `rk_${Date.now()}`, keyword, targetUrl: targetUrl || '', tags: tags || [], addedAt: new Date().toISOString(), currentPosition: null, previousPosition: null };
  data.keywords.push(entry);
  saveRankData(shop, data);
  res.json({ ok: true, entry });
});

router.get('/rank/list', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadRankData(shop);
  res.json({ ok: true, keywords: data.keywords, total: data.keywords.length });
});

router.delete('/rank/keyword/:id', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadRankData(shop);
  data.keywords = data.keywords.filter(k => k.id !== req.params.id);
  delete data.history[req.params.id];
  saveRankData(shop, data);
  res.json({ ok: true });
});

router.post('/rank/check-position', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { keyword, targetUrl, engine = 'google' } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `You are a SERP estimation tool. For the keyword "${keyword}", estimate the likely search engine ranking position (1-100) for the URL "${targetUrl || 'unknown'}". Consider typical competitive patterns. Return JSON: {"estimatedPosition": number, "positionRange": "e.g. 1-3", "confidence": "high|medium|low", "topCompetitors": ["domain1","domain2","domain3"], "pageOneLikelihood": "percentage string", "notes": "brief reasoning"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    const data = loadRankData(shop);
    const kw = data.keywords.find(k => k.keyword === keyword);
    if (kw) { kw.previousPosition = kw.currentPosition; kw.currentPosition = parsed.estimatedPosition; kw.lastChecked = new Date().toISOString(); if (!data.history[kw.id]) data.history[kw.id] = []; data.history[kw.id].push({ date: new Date().toISOString(), position: parsed.estimatedPosition }); saveRankData(shop, data); }
    res.json({ ok: true, keyword, ...parsed, source: 'ai-estimate', note: 'Import GSC CSV for verified data' });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/rank/history/:keywordId', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadRankData(shop);
  const history = data.history[req.params.keywordId] || [];
  res.json({ ok: true, history });
});

router.post('/rank/bulk-check', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { keywordIds } = req.body;
  const data = loadRankData(shop);
  const targets = keywordIds ? data.keywords.filter(k => keywordIds.includes(k.id)) : data.keywords.slice(0, 20);
  if (!targets.length) return res.json({ ok: true, results: [], message: 'No keywords to check' });
  try {
    const openai = getOpenAI();
    const kwList = targets.map(k => `${k.keyword} (URL: ${k.targetUrl || 'any'})`).join('\n');
    const prompt = `Estimate ranking positions for these keywords. Return JSON: {"results": [{"keyword": "string", "estimatedPosition": number, "trend": "rising|stable|falling", "notes": "brief"}]}. Keywords:\n${kwList}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    parsed.results.forEach(result => {
      const kw = data.keywords.find(k => k.keyword === result.keyword);
      if (kw) { kw.previousPosition = kw.currentPosition; kw.currentPosition = result.estimatedPosition; kw.lastChecked = new Date().toISOString(); if (!data.history[kw.id]) data.history[kw.id] = []; data.history[kw.id].push({ date: new Date().toISOString(), position: result.estimatedPosition }); }
    });
    saveRankData(shop, data);
    res.json({ ok: true, checked: parsed.results.length, results: parsed.results });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/rank/competitor-compare', async (req, res) => {
  const { keyword, yourUrl, competitors = [] } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Compare estimated SERP positions for keyword "${keyword}". Your URL: ${yourUrl || 'unknown'}. Competitors: ${competitors.join(', ') || 'top competitors'}. Return JSON: {"yourPosition": number, "competitorPositions": [{"domain": "string", "position": number, "strengths": ["string"]}], "gapAnalysis": "string", "recommendations": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/rank/position-alert', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { keywordId, threshold = 5, direction = 'down', notifyEmail } = req.body;
  const data = loadRankData(shop);
  const kw = data.keywords.find(k => k.id === keywordId);
  if (!kw) return res.status(404).json({ ok: false, error: 'keyword not found' });
  kw.alert = { threshold, direction, notifyEmail, enabled: true };
  saveRankData(shop, data);
  res.json({ ok: true, alert: kw.alert });
});

router.post('/rank/ai-forecast', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { keywordId } = req.body;
  const data = loadRankData(shop);
  const kw = data.keywords.find(k => k.id === keywordId);
  if (!kw) return res.status(404).json({ ok: false, error: 'keyword not found' });
  const history = (data.history[keywordId] || []).slice(-30);
  try {
    const openai = getOpenAI();
    const prompt = `Based on ranking history for keyword "${kw.keyword}": ${JSON.stringify(history)}. Forecast the likely position in 30, 60, and 90 days. Return JSON: {"forecast30": number, "forecast60": number, "forecast90": number, "trend": "improving|declining|stable", "confidence": "high|medium|low", "keyFactors": ["string"], "actionItems": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword: kw.keyword, currentPosition: kw.currentPosition, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/rank/yoy-comparison', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadRankData(shop);
  const now = new Date(); const lastYear = new Date(now); lastYear.setFullYear(lastYear.getFullYear() - 1);
  const results = data.keywords.map(kw => {
    const hist = data.history[kw.id] || [];
    const yearAgoEntry = hist.find(h => { const d = new Date(h.date); return Math.abs(d - lastYear) < 30 * 24 * 60 * 60 * 1000; });
    return { keyword: kw.keyword, currentPosition: kw.currentPosition, yearAgoPosition: yearAgoEntry ? yearAgoEntry.position : null, change: kw.currentPosition && yearAgoEntry ? yearAgoEntry.position - kw.currentPosition : null };
  });
  res.json({ ok: true, results, generatedAt: now.toISOString() });
});

router.post('/rank/keyword-velocity', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadRankData(shop);
  const results = data.keywords.map(kw => {
    const hist = (data.history[kw.id] || []).slice(-14);
    if (hist.length < 2) return { keyword: kw.keyword, velocity: 0, trend: 'insufficient data' };
    const first = hist[0].position; const last = hist[hist.length - 1].position;
    const velocity = (first - last) / hist.length;
    return { keyword: kw.keyword, velocity: Math.round(velocity * 10) / 10, trend: velocity > 0.5 ? 'rising fast' : velocity > 0 ? 'rising' : velocity < -0.5 ? 'falling fast' : velocity < 0 ? 'falling' : 'stable', currentPosition: kw.currentPosition };
  });
  results.sort((a, b) => b.velocity - a.velocity);
  res.json({ ok: true, results });
});

router.post('/rank/device-split', async (req, res) => {
  const { keyword, targetUrl } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Estimate mobile vs desktop SERP position differences for keyword "${keyword}", URL: ${targetUrl || 'unknown'}. Return JSON: {"desktopPosition": number, "mobilePosition": number, "divergence": number, "mobileIntent": "string", "mobileTips": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/rank/cannibalization-live', async (req, res) => {
  const { keyword, siteUrl } = req.body;
  if (!keyword || !siteUrl) return res.status(400).json({ ok: false, error: 'keyword and siteUrl required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse keyword cannibalization risk for "${keyword}" on site "${siteUrl}". Return JSON: {"cannibalizationRisk": "high|medium|low", "likelyUrls": ["url1","url2"], "primaryUrl": "string", "recommendation": "string", "consolidationStrategy": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, siteUrl, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/gsc/import-csv', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { csvData } = req.body;
  if (!csvData) return res.status(400).json({ ok: false, error: 'csvData required' });
  try {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const rows = lines.slice(1).map(line => { const vals = line.split(','); return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim().replace(/"/g, '')])); });
    const data = loadRankData(shop);
    let imported = 0;
    rows.forEach(row => {
      const query = row['top queries'] || row['query'] || row['keyword'];
      const position = parseFloat(row['position'] || row['avg. position'] || '0');
      if (!query || !position) return;
      const existing = data.keywords.find(k => k.keyword.toLowerCase() === query.toLowerCase());
      if (existing) { existing.currentPosition = Math.round(position); existing.gscVerified = true; existing.lastChecked = new Date().toISOString(); if (!data.history[existing.id]) data.history[existing.id] = []; data.history[existing.id].push({ date: new Date().toISOString(), position: Math.round(position), source: 'gsc' }); imported++; }
      else { const id = `rk_${Date.now()}_${imported}`; data.keywords.push({ id, keyword: query, targetUrl: row['landing page'] || '', currentPosition: Math.round(position), gscVerified: true, addedAt: new Date().toISOString(), lastChecked: new Date().toISOString() }); data.history[id] = [{ date: new Date().toISOString(), position: Math.round(position), source: 'gsc' }]; imported++; }
    });
    saveRankData(shop, data);
    res.json({ ok: true, imported, total: rows.length });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/gsc/summary', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadRankData(shop);
  const kws = data.keywords;
  const pos1_3 = kws.filter(k => k.currentPosition >= 1 && k.currentPosition <= 3).length;
  const pos4_10 = kws.filter(k => k.currentPosition >= 4 && k.currentPosition <= 10).length;
  const pos11_20 = kws.filter(k => k.currentPosition >= 11 && k.currentPosition <= 20).length;
  const pos21plus = kws.filter(k => k.currentPosition > 20).length;
  const avgPos = kws.filter(k => k.currentPosition).reduce((s, k) => s + k.currentPosition, 0) / (kws.filter(k => k.currentPosition).length || 1);
  res.json({ ok: true, total: kws.length, avgPosition: Math.round(avgPos * 10) / 10, breakdown: { pos1_3, pos4_10, pos11_20, pos21plus }, gscVerified: kws.filter(k => k.gscVerified).length });
});


/* =========================================================================
   SITE CRAWL
   ========================================================================= */
const http = require('http');
const https = require('https');
function getCrawlPath(shop) { return path.join(__dirname, '../../../data', `crawl-${shop}.json`); }
function loadCrawlData(shop) { try { return JSON.parse(fs.readFileSync(getCrawlPath(shop), 'utf8')); } catch { return { snapshots: [], active: null }; } }
function saveCrawlData(shop, data) { fs.writeFileSync(getCrawlPath(shop), JSON.stringify(data, null, 2)); }

const crawlStore = new Map();

router.post('/crawl/start', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { url, maxPages = 200, userAgent = 'AURABot/1.0' } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  const crawlId = `crawl_${Date.now()}`;
  const crawlState = { id: crawlId, startUrl: url, status: 'running', progress: 0, pagesFound: 0, issuesFound: 0, startedAt: new Date().toISOString(), pages: [], issues: [] };
  crawlStore.set(`${shop}_active`, crawlState);
  res.json({ ok: true, crawlId, message: 'Crawl started', status: 'running' });
  setImmediate(async () => {
    const visited = new Set(); const toVisit = [url]; const baseUrl = new URL(url).origin;
    while (toVisit.length && visited.size < maxPages) {
      const current = toVisit.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      try {
        const proto = current.startsWith('https') ? https : http;
        const pageData = await new Promise((resolve, reject) => {
          const reqObj = proto.get(current, { headers: { 'User-Agent': userAgent }, timeout: 8000 }, (resp) => {
            let body = '';
            resp.on('data', d => body += d);
            resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body, finalUrl: current }));
          });
          reqObj.on('error', reject); reqObj.on('timeout', () => { reqObj.destroy(); reject(new Error('timeout')); });
        });
        const $ = cheerio.load(pageData.body);
        const title = $('title').text().trim();
        const meta = $('meta[name="description"]').attr('content') || '';
        const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
        const canonical = $('link[rel="canonical"]').attr('href') || '';
        const robots = $('meta[name="robots"]').attr('content') || '';
        const noindex = robots.includes('noindex');
        const internalLinks = [];
        $('a[href]').each((_, el) => { const href = $(el).attr('href'); if (href && (href.startsWith('/') || href.startsWith(baseUrl))) { const full = href.startsWith('/') ? baseUrl + href : href; const clean = full.split('?')[0].split('#')[0]; if (!visited.has(clean)) { internalLinks.push(clean); if (!toVisit.includes(clean)) toVisit.push(clean); } } });
        const pageIssues = [];
        if (!title) pageIssues.push({ type: 'missing-title', severity: 'high', message: 'Page has no title tag' });
        if (title && title.length > 60) pageIssues.push({ type: 'title-too-long', severity: 'medium', message: `Title is ${title.length} chars (max 60)` });
        if (!meta) pageIssues.push({ type: 'missing-meta', severity: 'medium', message: 'No meta description' });
        if (h1s.length === 0) pageIssues.push({ type: 'missing-h1', severity: 'high', message: 'No H1 tag' });
        if (h1s.length > 1) pageIssues.push({ type: 'multiple-h1', severity: 'medium', message: `${h1s.length} H1 tags found` });
        if (noindex) pageIssues.push({ type: 'noindex', severity: 'low', message: 'Page is set to noindex' });
        if (pageData.status >= 400) pageIssues.push({ type: 'error-status', severity: 'high', message: `HTTP ${pageData.status}` });
        crawlState.pages.push({ url: current, status: pageData.status, title, meta, h1s, canonical, noindex, internalLinkCount: internalLinks.length, issues: pageIssues });
        crawlState.issues.push(...pageIssues.map(i => ({ ...i, url: current })));
        crawlState.pagesFound = visited.size;
        crawlState.issuesFound = crawlState.issues.length;
        crawlState.progress = Math.round((visited.size / maxPages) * 100);
      } catch {}
    }
    crawlState.status = 'complete';
    crawlState.completedAt = new Date().toISOString();
    crawlState.progress = 100;
    crawlStore.set(`${shop}_active`, crawlState);
    const data = loadCrawlData(shop);
    data.snapshots.push({ id: crawlId, date: new Date().toISOString(), pagesFound: crawlState.pagesFound, issuesFound: crawlState.issuesFound, pages: crawlState.pages, issues: crawlState.issues });
    if (data.snapshots.length > 10) data.snapshots = data.snapshots.slice(-10);
    saveCrawlData(shop, data);
  });
});

router.get('/crawl/status', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const state = crawlStore.get(`${shop}_active`);
  if (!state) return res.json({ ok: true, status: 'idle', message: 'No active crawl' });
  res.json({ ok: true, status: state.status, progress: state.progress, pagesFound: state.pagesFound, issuesFound: state.issuesFound, crawlId: state.id });
});

router.get('/crawl/results', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const state = crawlStore.get(`${shop}_active`);
  if (state && state.pages) return res.json({ ok: true, ...state });
  const data = loadCrawlData(shop);
  const latest = data.snapshots[data.snapshots.length - 1];
  if (!latest) return res.json({ ok: true, status: 'no data', pages: [], issues: [] });
  res.json({ ok: true, status: 'complete', ...latest });
});

router.post('/crawl/ai-summary', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const model = req.body.model || 'gpt-4o-mini';
  const state = crawlStore.get(`${shop}_active`);
  const data = loadCrawlData(shop);
  const latest = (state && state.pages && state.pages.length) ? state : (data.snapshots[data.snapshots.length - 1]);
  if (!latest) return res.status(400).json({ ok: false, error: 'No crawl data. Run a crawl first.' });
  try {
    const openai = getOpenAI();
    const issueBreakdown = {};
    (latest.issues || []).forEach(i => { issueBreakdown[i.type] = (issueBreakdown[i.type] || 0) + 1; });
    const prompt = `You are an SEO expert. Summarise these site crawl results and provide a prioritised action plan. Pages crawled: ${latest.pagesFound || latest.pages?.length}. Issues: ${JSON.stringify(issueBreakdown)}. Return JSON: {"executiveSummary": "string", "overallHealthScore": number, "criticalIssues": [{"issue": "string", "count": number, "impact": "string", "fix": "string"}], "quickWins": ["string"], "priorityOrder": ["string"], "estimatedFixTime": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/crawl/orphan-finder', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadCrawlData(shop); const latest = data.snapshots[data.snapshots.length - 1];
  if (!latest) return res.status(400).json({ ok: false, error: 'No crawl data' });
  const allUrls = new Set(latest.pages.map(p => p.url));
  const linked = new Set();
  latest.pages.forEach(p => { (p.internalLinks || []).forEach(l => linked.add(l)); });
  const orphans = [...allUrls].filter(u => !linked.has(u) && u !== latest.startUrl);
  res.json({ ok: true, orphanCount: orphans.length, orphans: orphans.slice(0, 100) });
});

router.get('/crawl/export-csv', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadCrawlData(shop); const latest = data.snapshots[data.snapshots.length - 1];
  if (!latest) return res.status(400).json({ ok: false, error: 'No crawl data' });
  const rows = [['URL','Status','Title','Meta','H1 Count','Noindex','Issue Count','Issues']];
  latest.pages.forEach(p => { rows.push([p.url, p.status, (p.title||'').replace(/,/g,''), (p.meta||'').replace(/,/g,'').substring(0,100), p.h1s?.length||0, p.noindex||false, p.issues?.length||0, (p.issues||[]).map(i=>i.type).join('|')]); });
  const csv = rows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="crawl-results.csv"');
  res.send(csv);
});

// POST version used by the dashboard which sends shop in the request body
router.post('/crawl/export-csv', (req, res) => {
  const shop = req.body?.shop || req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadCrawlData(shop); const latest = data.snapshots[data.snapshots.length - 1];
  if (!latest) return res.status(400).json({ ok: false, error: 'No crawl data' });
  const rows = [['URL','Status','Title','Meta','H1 Count','Noindex','Issue Count','Issues']];
  latest.pages.forEach(p => { rows.push([p.url, p.status, (p.title||'').replace(/,/g,''), (p.meta||'').replace(/,/g,'').substring(0,100), p.h1s?.length||0, p.noindex||false, p.issues?.length||0, (p.issues||[]).map(i=>i.type).join('|')]); });
  const csv = rows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="crawl-results.csv"');
  res.send(csv);
});

router.post('/crawl/compare', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { snapshotId1, snapshotId2 } = req.body;
  const data = loadCrawlData(shop);
  const s1 = snapshotId1 ? data.snapshots.find(s => s.id === snapshotId1) : data.snapshots[data.snapshots.length - 2];
  const s2 = snapshotId2 ? data.snapshots.find(s => s.id === snapshotId2) : data.snapshots[data.snapshots.length - 1];
  if (!s1 || !s2) return res.status(400).json({ ok: false, error: 'Need at least 2 snapshots to compare' });
  const urls1 = new Set((s1.pages||[]).map(p => p.url));
  const urls2 = new Set((s2.pages||[]).map(p => p.url));
  const newPages = [...urls2].filter(u => !urls1.has(u));
  const removedPages = [...urls1].filter(u => !urls2.has(u));
  const issues1 = {}; (s1.issues||[]).forEach(i => { issues1[i.type] = (issues1[i.type]||0) + 1; });
  const issues2 = {}; (s2.issues||[]).forEach(i => { issues2[i.type] = (issues2[i.type]||0) + 1; });
  const newIssueTypes = Object.keys(issues2).filter(t => !issues1[t]);
  const resolvedIssueTypes = Object.keys(issues1).filter(t => !issues2[t]);
  res.json({ ok: true, snapshot1: { id: s1.id, date: s1.date, pages: s1.pagesFound, issues: s1.issuesFound }, snapshot2: { id: s2.id, date: s2.date, pages: s2.pagesFound, issues: s2.issuesFound }, newPages: newPages.slice(0,50), removedPages: removedPages.slice(0,50), newIssueTypes, resolvedIssueTypes, issuesDelta: s2.issuesFound - s1.issuesFound });
});

router.get('/crawl/snapshots', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadCrawlData(shop);
  res.json({ ok: true, snapshots: data.snapshots.map(s => ({ id: s.id, date: s.date, pagesFound: s.pagesFound, issuesFound: s.issuesFound })) });
});

router.post('/crawl/duplicate-detector', (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const data = loadCrawlData(shop); const latest = data.snapshots[data.snapshots.length - 1];
  if (!latest) return res.status(400).json({ ok: false, error: 'No crawl data' });
  const titleMap = {}; const metaMap = {};
  (latest.pages||[]).forEach(p => {
    if (p.title) { if (!titleMap[p.title]) titleMap[p.title] = []; titleMap[p.title].push(p.url); }
    if (p.meta) { const key = p.meta.substring(0,80); if (!metaMap[key]) metaMap[key] = []; metaMap[key].push(p.url); }
  });
  const dupTitles = Object.entries(titleMap).filter(([,urls]) => urls.length > 1).map(([title,urls]) => ({ title, urls }));
  const dupMetas = Object.entries(metaMap).filter(([,urls]) => urls.length > 1).map(([meta,urls]) => ({ meta, urls }));
  res.json({ ok: true, duplicateTitles: dupTitles, duplicateMetas: dupMetas, totalDupTitles: dupTitles.length, totalDupMetas: dupMetas.length });
});


/* =========================================================================
   GEO & LLM � Generative Engine Optimisation
   ========================================================================= */
function getGeoPath(shop) { return path.join(__dirname, '../../../data', `geo-tracker-${shop}.json`); }
function loadGeoData(shop) { try { return JSON.parse(fs.readFileSync(getGeoPath(shop), 'utf8')); } catch { return { platformHistory: [], alerts: [] }; } }
function saveGeoData(shop, data) { fs.writeFileSync(getGeoPath(shop), JSON.stringify(data, null, 2)); }

router.post('/geo/geo-health-score', async (req, res) => {
  const { url, topic } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  try {
    let pageHtml = '';
    try { const proto = url.startsWith('https') ? https : http; pageHtml = await new Promise((resolve, reject) => { const r = proto.get(url, { timeout: 8000 }, resp => { let b = ''; resp.on('data', d => b += d); resp.on('end', () => resolve(b)); }); r.on('error', reject); r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); }); }); } catch {}
    const $ = cheerio.load(pageHtml);
    const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
    const hasFaq = pageHtml.toLowerCase().includes('"faqpage"') || pageHtml.toLowerCase().includes('"question"');
    const hasSpeakable = pageHtml.toLowerCase().includes('"speakable"');
    const hasLlmsTxt = false;
    const wordCount = $('body').text().trim().split(/\s+/).length;
    const hasAuthor = $('[rel="author"], .author, .byline').length > 0 || pageHtml.toLowerCase().includes('"author"');
    const hasDate = $('time, [itemprop="datePublished"]').length > 0;
    const hasCitations = $('a[href]').filter((_, el) => { const h = $(el).attr('href')||''; return h.startsWith('http') && !h.includes(new URL(url).hostname); }).length;
    const discovery = Math.min(100, (hasStructuredData?25:0) + (hasLlmsTxt?25:0) + (wordCount>500?25:0) + 25);
    const understanding = Math.min(100, (hasStructuredData?30:0) + (hasFaq?20:0) + (hasSpeakable?25:0) + (hasDate?15:0) + 10);
    const inclusion = Math.min(100, (hasAuthor?20:0) + (hasCitations>2?25:0) + (wordCount>1000?20:0) + (hasFaq?20:0) + 15);
    const overall = Math.round((discovery + understanding + inclusion) / 3);
    res.json({ ok: true, url, topic, overallScore: overall, pillars: { discovery: { score: discovery, label: 'Can AI find your content?' }, understanding: { score: understanding, label: 'Can AI parse your content?' }, inclusion: { score: inclusion, label: 'Will AI cite your content?' } }, signals: { hasStructuredData, hasFaq, hasSpeakable, hasLlmsTxt, hasAuthor, hasDate, citationLinks: hasCitations, wordCount }, recommendations: [...(!hasStructuredData?['Add JSON-LD structured data (Article, FAQ, Speakable)']:[]), ...(!hasFaq?['Add FAQ section with Question/Answer schema']:[]), ...(!hasSpeakable?['Add Speakable schema to mark key quotable paragraphs']:[]), ...(!hasAuthor?['Add visible author bio with credentials']:[]), ...(hasCitations<3?['Add citations to authoritative external sources']:[]), ...(wordCount<800?['Increase content length � AI prefers comprehensive, in-depth answers']:[])] });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/llm-visibility-audit', async (req, res) => {
  const { brandName, niche, competitors = [] } = req.body;
  if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
  try {
    const openai = getOpenAI();
    const prompt = `Perform a GEO (Generative Engine Optimisation) visibility audit for brand "${brandName}" in niche "${niche||'general'}". Competitors: ${competitors.join(', ')||'unknown'}. Return JSON: {"visibilityScore": number, "platformScores": {"chatgpt": number, "perplexity": number, "googleAiOverview": number, "gemini": number, "claude": number, "copilot": number, "grok": number, "deepseek": number}, "topCitedCompetitors": ["string"], "contentGaps": ["string"], "citations": ["string"], "recommendations": ["string"], "quickWins": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, brandName, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/prompt-simulation', async (req, res) => {
  const { query, siteUrl, platform = 'ChatGPT' } = req.body;
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  try {
    const openai = getOpenAI();
    const prompt = `Simulate how ${platform} would respond to the query: "${query}". Consider whether the site "${siteUrl||'unknown'}" would likely be cited. Return JSON: {"simulatedAnswer": "string", "citationLikelihood": "high|medium|low", "citationScore": number, "wouldCiteSite": boolean, "reasonsFor": ["string"], "reasonsAgainst": ["string"], "contentImprovements": ["string"], "competitorsMentioned": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, query, platform, siteUrl, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/citation-gap-analysis', async (req, res) => {
  const { brandName, niche, topics = [], competitors = [] } = req.body;
  if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse citation gaps for brand "${brandName}" vs competitors [${competitors.join(', ')}] in niche "${niche||'general'}". Topics: ${topics.join(', ')||'general topics'}. Return JSON: {"citationGaps": [{"topic": "string", "competitorsCited": ["string"], "yourBrandCited": boolean, "opportunity": "high|medium|low", "contentToCreate": "string"}], "overallGapScore": number, "priorityTopics": ["string"], "actionPlan": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, brandName, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/ai-platform-tracker', async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'] || 'default';
  const { brandName, queries = [], competitors = [] } = req.body;
  if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
  try {
    const openai = getOpenAI();
    const prompt = `Simulate tracking brand "${brandName}" visibility across 8 AI platforms for these queries: ${queries.slice(0,5).join('; ')||'general brand queries'}. Competitors: ${competitors.join(', ')||'none'}. Return JSON: {"platforms": {"chatgpt": {"mentioned": boolean, "sentiment": "positive|neutral|negative", "context": "string"}, "perplexity": {"mentioned": boolean, "sentiment": "string", "context": "string"}, "googleAiOverview": {"mentioned": boolean, "sentiment": "string", "context": "string"}, "gemini": {"mentioned": boolean, "sentiment": "string", "context": "string"}, "claude": {"mentioned": boolean, "sentiment": "string", "context": "string"}, "copilot": {"mentioned": boolean, "sentiment": "string", "context": "string"}, "grok": {"mentioned": boolean, "sentiment": "string", "context": "string"}, "deepseek": {"mentioned": boolean, "sentiment": "string", "context": "string"}}, "overallVisibilityScore": number, "competitorComparison": [{"competitor": "string", "visibilityScore": number}]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    const geoData = loadGeoData(shop);
    geoData.platformHistory.push({ date: new Date().toISOString(), brandName, ...parsed });
    if (geoData.platformHistory.length > 30) geoData.platformHistory = geoData.platformHistory.slice(-30);
    saveGeoData(shop, geoData);
    res.json({ ok: true, brandName, ...parsed, historySaved: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/mention-gap', async (req, res) => {
  const { brandName, competitors = [], topic } = req.body;
  if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
  try {
    const openai = getOpenAI();
    const prompt = `Find AI mention gaps for brand "${brandName}" vs competitors [${competitors.join(', ')}] on topic "${topic||'general'}". Return JSON: {"gaps": [{"query": "string", "competitorsMentioned": ["string"], "brandMentioned": false, "priority": "high|medium|low", "contentSuggestion": "string"}], "totalGaps": number, "quickestWins": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, brandName, topic, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/brand-sentiment-ai', async (req, res) => {
  const { brandName, niche } = req.body;
  if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse how AI models likely perceive and describe brand "${brandName}" in niche "${niche||'general'}". Return JSON: {"overallSentiment": "positive|neutral|negative|mixed", "sentimentScore": number, "platformSentiments": {"chatgpt": "string", "perplexity": "string", "gemini": "string"}, "positiveSignals": ["string"], "negativeSignals": ["string"], "reputationRisks": ["string"], "improvementActions": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, brandName, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/llms-txt/generate', async (req, res) => {
  const { domain, sitemapUrl } = req.query;
  if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });
  try {
    let pages = [];
    if (sitemapUrl) { try { const proto = sitemapUrl.startsWith('https') ? https : http; const xml = await new Promise((resolve, reject) => { const r = proto.get(sitemapUrl, { timeout: 8000 }, resp => { let b = ''; resp.on('data', d => b += d); resp.on('end', () => resolve(b)); }); r.on('error', reject); }); const $ = cheerio.load(xml, { xmlMode: true }); $('url loc').each((_, el) => { pages.push($(el).text().trim()); }); } catch {} }
    const llmsTxt = `# ${domain}\n\n> This file guides AI language models about the most important content on this site.\n\n## Important Pages\n\n${pages.slice(0,20).map(p => `- ${p}`).join('\n') || `- https://${domain}/\n- https://${domain}/blog/`}\n\n## About This Site\n\nThis site is hosted on ${domain}. It contains informational content, blog posts, and resources.\n\n## Content Permissions\n\nAI systems may use this content to answer user questions with proper attribution.\n\n## Contact\n\nFor questions about AI usage of this content, contact the site owner at ${domain}.`;
    const llmsFullTxt = `${llmsTxt}\n\n## Full Sitemap\n\n${pages.map(p => `- ${p}`).join('\n') || `(add your sitemap URL as ?sitemapUrl=https://${domain}/sitemap.xml for full list)`}`;
    res.json({ ok: true, domain, llmsTxt, llmsFullTxt, pageCount: pages.length, instruction: `Upload llmsTxt content as /llms.txt and llmsFullTxt as /llms-full.txt on your server` });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/faq-for-llm', async (req, res) => {
  const { topic, url, targetPlatform = 'ChatGPT' } = req.body;
  if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
  try {
    const openai = getOpenAI();
    const prompt = `Generate FAQ content optimised to be cited by ${targetPlatform} for topic: "${topic}". Return JSON: {"faqs": [{"question": "string", "answer": "string", "citationLikelihood": "high|medium|low", "answerType": "definition|howto|list|comparison"}], "schemaSuggestion": "paste-ready JSON-LD FAQ schema", "tips": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, topic, targetPlatform, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/content-for-citation', async (req, res) => {
  const { content, topic } = req.body;
  if (!content) return res.status(400).json({ ok: false, error: 'content required' });
  try {
    const openai = getOpenAI();
    const prompt = `Rewrite this content to maximise its likelihood of being cited by AI search engines (ChatGPT, Perplexity). Make it more direct, factual, citable, and structured. Topic: ${topic||'general'}. Original: ${content.substring(0,2000)}. Return JSON: {"rewrittenContent": "string", "changes": ["string"], "citationScore": number, "keyImprovements": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, topic, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/geo/nosnippet-audit', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  try {
    let html = '';
    try { const proto = url.startsWith('https') ? https : http; html = await new Promise((resolve, reject) => { const r = proto.get(url, { timeout: 8000 }, resp => { let b = ''; resp.on('data', d => b += d); resp.on('end', () => resolve(b)); }); r.on('error', reject); }); } catch {}
    const $ = cheerio.load(html);
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const xRobots = '';
    const hasNosnippet = robotsMeta.includes('nosnippet');
    const hasNoai = robotsMeta.includes('noai') || robotsMeta.includes('noimageai');
    const hasMaxSnippet = robotsMeta.match(/max-snippet:(-?\d+)/);
    const maxSnippetValue = hasMaxSnippet ? parseInt(hasMaxSnippet[1]) : null;
    res.json({ ok: true, url, robotsMeta, hasNosnippet, hasNoai, maxSnippetValue, aiOverviewEligible: !hasNosnippet && !hasNoai, recommendations: [...(hasNosnippet ? ['Remove nosnippet directive to allow AI Overview extraction'] : []), ...(hasNoai ? ['Remove noai directive � this blocks AI search engines from using your content'] : []), ...(maxSnippetValue !== null && maxSnippetValue < 150 ? ['Increase or remove max-snippet limit � low values prevent AI from showing enough context'] : [])] });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/mcp-schema-generator', async (req, res) => {
  const { siteName, siteUrl, description, tools = [] } = req.body;
  if (!siteName || !siteUrl) return res.status(400).json({ ok: false, error: 'siteName and siteUrl required' });
  const mcpConfig = { mcpServers: { [siteName.toLowerCase().replace(/\s+/g,'-')]: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'], env: { SITE_URL: siteUrl, SITE_NAME: siteName, SITE_DESCRIPTION: description || '' } } } };
  res.json({ ok: true, siteName, siteUrl, mcpConfig: JSON.stringify(mcpConfig, null, 2), instruction: 'Add this to your Claude Desktop claude_desktop_config.json or ChatGPT plugin manifest', pluginManifest: { schema_version: 'v1', name_for_human: siteName, name_for_model: siteName.toLowerCase().replace(/\s+/g,'_'), description_for_human: description || `Access ${siteName} content`, description_for_model: `Use this to retrieve content from ${siteUrl}`, api: { type: 'openapi', url: `${siteUrl}/openapi.json` }, auth: { type: 'none' } } });
});


/* =========================================================================
   TREND SCOUT
   ========================================================================= */
router.post('/trends/rising-topics', async (req, res) => {
  const { niche, industry, timeframe = '30 days' } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `You are a trend analysis expert. Identify rising topics and keywords in the "${niche}" niche for ${industry||'general'} industry over the last ${timeframe}. Return JSON: {"risingTopics": [{"topic": "string", "growthEstimate": "string", "searchVolumeRange": "string", "competition": "low|medium|high", "contentAngle": "string", "urgency": "act now|this month|this quarter", "why": "string"}], "emergingThemes": ["string"], "firstMoverOpportunities": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, industry, timeframe, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/seasonal-planner', async (req, res) => {
  const { niche, industry, seedTopics = [] } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Create a 12-month seasonal content calendar for "${niche}" niche. Topics: ${seedTopics.join(', ')||'all relevant topics'}. Return JSON: {"calendar": {"january": [{"topic": "string", "peakMonth": "string", "publishBy": "string", "contentType": "string"}], "february": [], "march": [], "april": [], "may": [], "june": [], "july": [], "august": [], "september": [], "october": [], "november": [], "december": []}, "topSeasonalOpportunities": ["string"], "evergreen": ["string"], "note": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/micro-niche-finder', async (req, res) => {
  const { broadNiche, industry } = req.body;
  if (!broadNiche) return res.status(400).json({ ok: false, error: 'broadNiche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Find underserved micro-niches within "${broadNiche}" for ${industry||'general'} businesses. Return JSON: {"microNiches": [{"niche": "string", "audienceSize": "small|medium|large", "competition": "very low|low|medium", "monetisationPotential": "high|medium|low", "contentGap": "string", "entryStrategy": "string"}], "topPick": "string", "avoidNiches": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, broadNiche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/newsjack-ideas', async (req, res) => {
  const { niche, currentEvents = [] } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Generate newsjacking content ideas for "${niche}" niche. Current events context: ${currentEvents.join(', ')||'current news cycle'}. Return JSON: {"opportunities": [{"headline": "string", "angle": "string", "urgency": "string", "contentFormat": "string", "targetKeyword": "string", "publishWindow": "string"}], "bestOpportunity": "string", "evergreens": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/keyword-surge-detector', async (req, res) => {
  const { niche, timeframe = '60 days' } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Identify keywords in "${niche}" niche with 50%+ search volume surge in the last ${timeframe}. Return JSON: {"surges": [{"keyword": "string", "estimatedGrowth": "string", "currentVolume": "string", "trigger": "string", "longevity": "trend|fad|seasonal|structural", "contentOpportunity": "string"}], "totalSurges": number, "actionableNow": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, timeframe, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/first-mover-brief', async (req, res) => {
  const { topic, niche } = req.body;
  if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
  try {
    const openai = getOpenAI();
    const prompt = `Create a first-mover content brief for trending topic "${topic}" in "${niche||'general'}" niche. This should capture early traffic before competition increases. Return JSON: {"title": "string", "targetKeyword": "string", "searchIntent": "string", "recommendedWordCount": number, "publishDeadline": "string", "outline": [{"heading": "string", "purpose": "string"}], "uniqueAngles": ["string"], "competitorsToWatch": ["string"], "estimatedTrafficPotential": "string", "monetisationHook": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, topic, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/competitor-velocity', async (req, res) => {
  const { yourDomain, competitors = [], niche } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse content publishing velocity for competitors in "${niche}" niche. Your domain: ${yourDomain||'unknown'}. Competitors: ${competitors.join(', ')||'major players'}. Return JSON: {"velocityComparison": [{"domain": "string", "estimatedPostsPerMonth": number, "topicFocus": ["string"], "recentWins": ["string"]}], "yourVelocityAdvice": "string", "topicsToSteal": ["string"], "gapOpportunities": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/trend-report', async (req, res) => {
  const { niche, period = 'Q1 2026' } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Write a comprehensive SEO trend report for "${niche}" for ${period}. Return JSON: {"reportTitle": "string", "executiveSummary": "string", "biggestTrends": [{"trend": "string", "impact": "high|medium|low", "opportunities": ["string"], "threats": ["string"]}], "keywordTrends": [{"keyword": "string", "direction": "rising|falling|stable", "notes": "string"}], "contentTypes": ["string"], "strategicRecommendations": ["string"], "outlook": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, period, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/trends/investment-signal-tracker', async (req, res) => {
  const { niche } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Identify topics in "${niche}" niche that show early investment/funding signals before mainstream search volume peaks. Return JSON: {"earlySignals": [{"topic": "string", "signalType": "vc-funding|acquisition|patent|regulatory|media", "estimatedPeakMonths": number, "confidence": "high|medium|low", "contentStrategy": "string", "keywords": ["string"]}], "hottest": "string", "avoid": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});


/* =========================================================================
   SERP / CONTENT VS TOP 10 / ZERO-CLICK
   ========================================================================= */
router.post('/serp/content-vs-top10', async (req, res) => {
  const { url, keyword, shop } = req.body;
  if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `You are an expert content gap analyst. Compare content at ${url} targeting keyword "${keyword}" against typical top-10 SERP results. Identify gaps, missing sections, thin content, and improvement opportunities. Return JSON: {"overallScore": number, "wordCountVsTop10": {"yours": number, "top10Avg": number, "verdict": "string"}, "missingTopics": ["string"], "weakeragainst":["string"], "strongerThan": ["string"], "featuredSnippetOpportunity": boolean, "paaQuestions": ["string"], "entitiesMissing": ["string"], "contentStructureGaps": ["string"], "quickWins": ["string"], "estimatedRankPotential": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, url, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/serp/top10-insights', async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse the full SERP landscape for keyword "${keyword}". Return JSON: {"dominantContentTypes": ["string"], "averageWordCount": number, "commonHeadings": ["string"], "sharedEntities": ["string"], "backingAuthors": ["expert|brand|user-generated"], "formatsRanking": ["string"], "intentSignals": "informational|transactional|navigational|commercial", "contentGaps": ["string"], "recommendations": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/serp/volatility-monitor', async (req, res) => {
  const { keywords = [], niche } = req.body;
  if (!niche && keywords.length === 0) return res.status(400).json({ ok: false, error: 'niche or keywords required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse SERP volatility for ${keywords.length > 0 ? 'keywords: ' + keywords.join(', ') : niche + ' niche'}. Return JSON: {"volatilityIndex": number, "highlyVolatile": ["string"], "stable": ["string"], "recentFlips": [{"keyword": "string", "change": "string", "likely Cause": "string"}], "algorithmActivity": "high|medium|low", "advice": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/serp/intent-evolution', async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Analyse how search intent has evolved for keyword "${keyword}" over the last 2 years. Return JSON: {"currentIntent": "string", "historicIntent": "string", "intentShift": "same|slight|major", "contentImplications": "string", "bestFormatNow": "string", "riskyApproaches": ["string"], "modernisationSteps": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/serp/splitsignal', async (req, res) => {
  const { keyword, variant1, variant2 } = req.body;
  if (!keyword || !variant1 || !variant2) return res.status(400).json({ ok: false, error: 'keyword, variant1, variant2 required' });
  try {
    const openai = getOpenAI();
    const prompt = `Compare two SEO title/meta variants for keyword "${keyword}": Variant A: "${variant1}" vs Variant B: "${variant2}". Predict which will get more clicks on SERPs. Return JSON: {"winner": "A|B", "winnerConfidence": "high|medium|low", "reasoning": "string", "ctrEstA": number, "ctrEstB": number, "improvementTips": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/zero-click/featured-snippet-optimizer', async (req, res) => {
  const { url, keyword, content } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Optimise for featured snippet (Position 0) for keyword "${keyword}". ${content ? 'Current content excerpt: ' + content.slice(0, 800) : 'URL: ' + (url||'unknown')}. Return JSON: {"snippetType": "paragraph|list|table|none", "snippetParagraph": "string", "snippetList": ["string"], "snippetHeadingToUse": "string", "wordCount": number, "changes": ["string"], "forbiddenPatterns": ["string"], "confidence": "high|medium|low"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/zero-click/paa-dominator', async (req, res) => {
  const { keyword, niche } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Generate all likely "People Also Ask" questions for keyword "${keyword}" in ${niche||'general'} niche. Return JSON: {"paaQuestions": [{"question": "string", "bestAnswer": "string", "wordCount": number, "answerFormat": "paragraph|list|table"}], "clusterThemes": ["string"], "implementationNote": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/zero-click/knowledge-panel-push', async (req, res) => {
  const { brandName, url } = req.body;
  if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
  try {
    const openai = getOpenAI();
    const prompt = `Create a strategy to earn a Google Knowledge Panel for brand "${brandName}". URL: ${url||'unknown'}. Return JSON: {"eligibilityScore": number, "requiredActions": [{"action": "string", "effort": "low|medium|high", "impact": "high|medium|low", "platform": "string"}], "entityDefinition": "string", "wikiDataReady": boolean, "schemaCTA": "string", "estimatedTimeline": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, brandName, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});


/* =========================================================================
   AI CREATE EXPANSIONS
   ========================================================================= */
router.post('/ai/full-blog-writer', async (req, res) => {
  const { title, keyword, outline = [], tone = 'professional', wordCount = 1800, niche } = req.body;
  if (!title || !keyword) return res.status(400).json({ ok: false, error: 'title and keyword required' });
  try {
    const openai = getOpenAI();
    const model = req.body.model || 'gpt-4o-mini';
    const prompt = `Write a complete, publish-ready blog post:\nTitle: "${title}"\nTarget keyword: "${keyword}"\nNiche: ${niche||'general'}\nTone: ${tone}\nWord count: ~${wordCount}\n${outline.length ? 'Follow this outline:\n' + outline.map((h,i) => `${i+1}. ${h}`).join('\n') : ''}\n\nInclude: engaging intro with keyword naturally placed, H2/H3 headings, body paragraphs, internal linking opportunities [marked as {{IL:keyword}}], a FAQ section, conclusion with CTA. Return JSON: {"title": "string", "metaDescription": "string", "slug": "string", "fullArticle": "string", "wordCount": number, "keywordDensity": number, "internalLinkSuggestions": ["string"], "faqQuestions": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/newsletter-digest', async (req, res) => {
  const { blogPosts = [], niche, format = 'html' } = req.body;
  if (blogPosts.length === 0 && !niche) return res.status(400).json({ ok: false, error: 'blogPosts or niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Transform these blog posts into a newsletter digest: ${blogPosts.map(p => p.title || p).join(', ')||niche+' weekly digest'}. Format: ${format}. Return JSON: {"subject": "string", "previewText": "string", "fullNewsletter": "string", "ctaText": "string", "estimatedReadTime": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/x-thread', async (req, res) => {
  const { blogUrl, blogTitle, blogContent, keyword } = req.body;
  if (!blogTitle && !blogContent) return res.status(400).json({ ok: false, error: 'blogTitle or blogContent required' });
  try {
    const openai = getOpenAI();
    const prompt = `Turn this blog post into a high-engagement X (Twitter) thread: Title: "${blogTitle||keyword}". ${blogContent ? 'Content excerpt: ' + blogContent.slice(0,1000) : ''}. Return JSON: {"threadTweets": [{"tweet": "string", "charCount": number}], "hookTweet": "string", "finalCTA": "string", "suggestedHashtags": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/linkedin-article', async (req, res) => {
  const { blogTitle, blogContent, keyword, tone = 'thought-leader' } = req.body;
  if (!blogTitle) return res.status(400).json({ ok: false, error: 'blogTitle required' });
  try {
    const openai = getOpenAI();
    const prompt = `Transform this blog into a LinkedIn article: "${blogTitle}". Keyword: ${keyword||''}. Tone: ${tone}. ${blogContent ? 'Based on: ' + blogContent.slice(0,800) : ''}. Return JSON: {"linkedinTitle": "string", "fullArticle": "string", "hook": "string", "ctaComment": "string", "emojis": "yes", "estimatedReach": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/atomize', async (req, res) => {
  const { blogTitle, blogContent, keyword } = req.body;
  if (!blogContent && !blogTitle) return res.status(400).json({ ok: false, error: 'blogContent or blogTitle required' });
  try {
    const openai = getOpenAI();
    const prompt = `"Atomise" this blog post into micro-content assets. Blog: "${blogTitle||keyword}". Content: ${blogContent ? blogContent.slice(0,1200) : 'generate from title'}. Return JSON: {"xThread": ["string"], "linkedinPost": "string", "instagramCaption": "string", "emailSubject": "string", "emailBody": "string", "quoteTiles": ["string"], "tiktokScript": "string", "pinterestDescription": "string", "faqPairs": [{"q":"string","a":"string"}]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/content-humanizer', async (req, res) => {
  const { content, targetReadingLevel = 'grade 8', tone = 'natural' } = req.body;
  if (!content) return res.status(400).json({ ok: false, error: 'content required' });
  try {
    const openai = getOpenAI();
    const prompt = `Humanise this AI-generated content to pass AI detectors and feel naturally written. Reading level: ${targetReadingLevel}. Tone: ${tone}. Content:\n\n${content.slice(0,3000)}\n\nReturn JSON: {"humanizedContent": "string", "readabilityScore": number, "fleschKincaid": number, "changesApplied": ["string"], "aiDetectionRisk": "low|medium|high", "tips": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/listicle-writer', async (req, res) => {
  const { topic, keyword, items = 10, niche } = req.body;
  if (!topic || !keyword) return res.status(400).json({ ok: false, error: 'topic and keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Write a complete, SEO-optimised listicle: "${topic}". Keyword: "${keyword}". Niche: ${niche||'general'}. Items: ${items}. Return JSON: {"title": "string", "metaDescription": "string", "intro": "string", "listItems": [{"number": number, "heading": "string", "description": "string", "proTip": "string"}], "conclusion": "string", "totalWordCount": number}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/ai/case-study-writer', async (req, res) => {
  const { clientName, problem, solution, results, keyword, niche } = req.body;
  if (!problem) return res.status(400).json({ ok: false, error: 'problem description required' });
  try {
    const openai = getOpenAI();
    const prompt = `Write an SEO-optimised case study. Client: ${clientName||'unnamed'}. Problem: ${problem}. Solution: ${solution||'our service'}. Results: ${results||'significant improvement'}. Keyword: ${keyword||''}. Return JSON: {"title": "string", "metaDescription": "string", "executiveSummary": "string", "challengeSection": "string", "solutionSection": "string", "resultsSection": "string", "testimonialsuggest": "string", "cta": "string", "totalWordCount": number}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/video/youtube-optimizer', async (req, res) => {
  const { videoTopic, targetKeyword, niche, duration = '10 minutes' } = req.body;
  if (!videoTopic || !targetKeyword) return res.status(400).json({ ok: false, error: 'videoTopic and targetKeyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Optimise a YouTube video for SEO. Topic: "${videoTopic}". Keyword: "${targetKeyword}". Niche: ${niche||'general'}. Duration: ${duration}. Return JSON: {"optimisedTitle": "string", "description": "string", "tags": ["string"], "chaptersTimestamps": [{"time": "string", "label": "string"}], "thumbnailTextIdeas": ["string"], "pinComment": "string", "cardText": "string", "endScreenCTA": "string", "expectedRankBoost": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, videoTopic, targetKeyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/video/video-schema-generator', async (req, res) => {
  const { videoTitle, videoUrl, description, uploadDate, duration, thumbnailUrl } = req.body;
  if (!videoTitle || !videoUrl) return res.status(400).json({ ok: false, error: 'videoTitle and videoUrl required' });
  const schema = { '@context': 'https://schema.org', '@type': 'VideoObject', name: videoTitle, description: description||videoTitle, contentUrl: videoUrl, embedUrl: videoUrl, uploadDate: uploadDate||new Date().toISOString().split('T')[0], duration: duration||'PT10M', thumbnailUrl: thumbnailUrl||'' };
  res.json({ ok: true, schema: JSON.stringify(schema, null, 2), instructions: 'Add inside a <script type="application/ld+json"> tag in the page <head>.' });
});


/* =========================================================================
   KEYWORDS EXPANSIONS
   ========================================================================= */
router.post('/keywords/alphabet-soup', async (req, res) => {
  const { seed } = req.body;
  if (!seed) return res.status(400).json({ ok: false, error: 'seed keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Generate alphabet soup keyword expansions for seed keyword "${seed}". For each letter A-Z generate 2-3 long-tail questions/phrases starting with that letter. Return JSON: {"alphabetSoup": {"a": ["string"], "b": ["string"], "c": ["string"], "d": ["string"], "e": ["string"], "f": ["string"], "g": ["string"], "h": ["string"], "i": ["string"], "j": ["string"], "k": ["string"], "l": ["string"], "m": ["string"], "n": ["string"], "o": ["string"], "p": ["string"], "q": ["string"], "r": ["string"], "s": ["string"], "t": ["string"], "u": ["string"], "v": ["string"], "w": ["string"], "x": ["string"], "y": ["string"], "z": ["string"]}, "topOpportunities": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, seed, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/keywords/question-explorer', async (req, res) => {
  const { seed, intent = 'all', count = 30 } = req.body;
  if (!seed) return res.status(400).json({ ok: false, error: 'seed keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Generate ${count} question-based keywords for "${seed}" ${intent !== 'all' ? 'with ' + intent + ' intent' : ''}. Include what/why/how/when/where/who/which/can/does/is questions. Return JSON: {"questions": [{"question": "string", "intent": "informational|transactional|commercial|navigational", "difficulty": "low|medium|high", "quickAnswer": "string", "paaLikely": boolean}], "topQuestions": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, seed, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/keywords/cluster-by-serp', async (req, res) => {
  const { keywords = [] } = req.body;
  if (keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords array required' });
  try {
    const openai = getOpenAI();
    const prompt = `Cluster these keywords by SERP similarity (keywords that rank on same URLs should be in the same cluster): ${keywords.join(', ')}. Return JSON: {"clusters": [{"clusterName": "string", "parentUrl": "string", "keywords": ["string"], "intent": "string", "priority": "high|medium|low"}], "unclustered": ["string"], "totalClusters": number}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// NOTE: keywords/cluster-by-intent → use /api/keyword-research-suite/cluster/intent

router.post('/keywords/kgr-calculator', async (req, res) => {
  const { keywords = [] } = req.body;
  if (keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords array required' });
  try {
    const openai = getOpenAI();
    const prompt = `Calculate estimated Keyword Golden Ratio (KGR = allintitle results / monthly searches) for these keywords: ${keywords.join(', ')}. KGR < 0.25 = golden. Return JSON: {"results": [{"keyword": "string", "estimatedSearchVolume": number, "estimatedAllintitle": number, "kgr": number, "verdict": "golden|good|competitive", "opportunity": "high|medium|low"}], "topGolden": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/keywords/keyword-mapping', async (req, res) => {
  const { keywords = [], existingPages = [] } = req.body;
  if (keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords array required' });
  try {
    const openai = getOpenAI();
    const prompt = `Map these keywords to appropriate pages. Keywords: ${keywords.join(', ')}. Existing pages: ${existingPages.join(', ')||'none provided, suggest new pages'}. Return JSON: {"mapping": [{"keyword": "string", "assignedPage": "string", "isNewPage": boolean, "pageType": "pillar|supporting|landing|blog", "reason": "string"}], "newPagesNeeded": ["string"], "cannibalizationRisks": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/keywords/share-of-voice', async (req, res) => {
  const { brand, competitors = [], keywords = [], niche } = req.body;
  if (!brand) return res.status(400).json({ ok: false, error: 'brand required' });
  try {
    const openai = getOpenAI();
    const prompt = `Estimate share of voice in SERPs for brand "${brand}" vs competitors: ${competitors.join(', ')||'top 4 competitors'}. Keywords: ${keywords.join(', ')||niche+' main keywords'}. Return JSON: {"shareOfVoice": {"${brand}": number, "competitors": [{"name": "string", "sharePercent": number}]}, "visibilityScore": number, "topKeywordsOwned": ["string"], "opportunities": ["string"], "trendDirection": "improving|declining|stable"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, brand, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/keywords/intent-matrix', async (req, res) => {
  const { keywords = [] } = req.body;
  if (keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords array required' });
  try {
    const openai = getOpenAI();
    const prompt = `Build a full intent matrix for these keywords: ${keywords.join(', ')}. Return JSON: {"matrix": [{"keyword": "string", "primaryIntent": "string", "microMoment": "know|go|do|buy", "buyerStage": "awareness|consideration|decision", "contentFormat": "string", "cta": "string", "conversionPotential": "high|medium|low"}], "summary": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});


/* =========================================================================
   BACKLINKS EXPANSIONS
   ========================================================================= */
router.post('/backlinks/digital-pr-pitch', async (req, res) => {
  const { topic, brandName, niche, angle } = req.body;
  if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
  try {
    const openai = getOpenAI();
    const prompt = `Create digital PR pitch emails to earn backlinks for brand "${brandName||'our brand'}" around topic "${topic}" in ${niche||'general'} niche. Angle: ${angle||'auto'}. Return JSON: {"pitchEmail": "string", "subject": "string", "targetPublications": ["string"], "whyTheyWouldLink": "string", "assetRequired": "string", "followUpEmail": "string", "successRate": "estimated string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, topic, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/backlinks/guest-post-finder', async (req, res) => {
  const { niche, domainAuthority = 20, topics = [] } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Find guest posting opportunities in "${niche}" niche for sites with DA ${domainAuthority}+. Topics: ${topics.join(', ')||'general'}. Return JSON: {"opportunities": [{"site": "string", "estimatedDA": number, "guestPostEmail": "string", "topicsTheyAccept": ["string"], "linkPolicy": "dofollow|mixed|nofollow", "prospectingTip": "string"}], "pitchTemplate": "string", "totalFound": number}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/backlinks/resource-page-builder', async (req, res) => {
  const { niche, url, contentTitle } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Identify resource pages in "${niche}" niche that would link to content at ${url||'our URL'} titled "${contentTitle||'our resource'}". Return JSON: {"resourcePages": [{"searchQuery": "string", "likelyURL": "string", "contactMethod": "string", "pitchAngle": "string"}], "outreachTemplate": "string", "contentRequirements": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/backlinks/skyscraper-prospector', async (req, res) => {
  const { competitorUrl, keyword, niche } = req.body;
  if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
  try {
    const openai = getOpenAI();
    const prompt = `Apply skyscraper technique for keyword "${keyword}" in ${niche||'general'} niche. Competitor URL: ${competitorUrl||'top ranking page'}. Return JSON: {"topCompetitorAssets": [{"url": "string", "whyItRanks": "string", "estimatedBacklinks": number}], "skyscraperAngles": ["string"], "contentImprovements": ["string"], "outreachTargets": ["string"], "expectedSuccess": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, keyword, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/backlinks/expert-qa-pipeline', async (req, res) => {
  const { brandName, expertName, niche, topics = [] } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Build an expert Q&A backlink pipeline. Brand: ${brandName||'our brand'}. Expert: ${expertName||'our expert'}. Niche: ${niche}. Topics: ${topics.join(', ')||'all relevant'}. Return JSON: {"qaOpportunities": [{"platform": "string", "questions": ["string"], "linkOpportunity": "string", "effortLevel": "low|medium|high"}], "haroAlternatives": ["string"], "responseTemplate": "string", "weeklyPlan": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});


/* =========================================================================
   TECHNICAL+ EXPANSIONS
   ========================================================================= */
router.post('/technical/inp-advisor', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  try {
    const openai = getOpenAI();
    const prompt = `Provide INP (Interaction to Next Paint) optimisation advice for ${url}. INP replaced FID in Core Web Vitals 2024. Return JSON: {"inpStatus": "good|needs improvement|poor", "estimatedINP": "string", "topCauses": ["string"], "fixes": [{"fix": "string", "effort": "low|medium|high", "impact": "high|medium|low", "codeExample": "string"}], "toolsToMeasure": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, url, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/redirect-chain-mapper', async (req, res) => {
  const { urls = [] } = req.body;
  if (urls.length === 0) return res.status(400).json({ ok: false, error: 'urls array required' });
  // Actually follow redirects for real
  const http = require('http');
  const https = require('https');
  const followRedirects = (url, depth = 0) => new Promise((resolve) => {
    if (depth > 10) return resolve([{ url, status: 'loop', depth }]);
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 5000 }, (res) => {
      const status = res.statusCode;
      const location = res.headers.location;
      if ([301,302,307,308].includes(status) && location) {
        const next = location.startsWith('http') ? location : new URL(location, url).href;
        followRedirects(next, depth+1).then(chain => resolve([{ url, status, depth }, ...chain]));
      } else { resolve([{ url, status, depth }]); }
    }).on('error', () => resolve([{ url, status: 'error', depth }]));
  });
  try {
    const results = await Promise.all(urls.map(u => followRedirects(u)));
    const chains = results.map((chain, i) => ({ originalUrl: urls[i], chain, hops: chain.length - 1, hasChain: chain.length > 2 }));
    res.json({ ok: true, chains, longChains: chains.filter(c => c.hops > 1).length });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/algo-impact-check', async (req, res) => {
  const { domain, niche, dateSuspected } = req.body;
  if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
  try {
    const openai = getOpenAI();
    const prompt = `Diagnose if ${domain||'this site'} in "${niche}" niche was hit by a Google algorithm update around ${dateSuspected||'recently'}. Return JSON: {"likelyUpdate": "string", "updateName": "string", "updateDate": "string", "matchesSite": "yes|maybe|no", "victimFactors": ["string"], "recoverySteps": [{"step": "string", "effort": "low|medium|high", "timeline": "string"}], "preventionForFuture": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, domain, niche, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/generate-robots-txt', async (req, res) => {
  const { siteType = 'ecommerce', crawlableDirectories = [], blockedDirectories = [], sitemapUrl } = req.body;
  try {
    const openai = getOpenAI();
    const prompt = `Generate an optimised robots.txt for a "${siteType}" site. Allowed: ${crawlableDirectories.join(', ')||'/'}. Blocked: ${blockedDirectories.join(', ')||'/admin, /cart, /account, /checkout'}. Sitemap: ${sitemapUrl||'https://example.com/sitemap.xml'}. Return JSON: {"robotsTxt": "string", "explanation": ["string"], "googleBotDirectives": ["string"], "warnings": ["string"]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    res.json({ ok: true, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/indexnow-submit', async (req, res) => {
  const { urls = [], apiKey, host } = req.body;
  if (urls.length === 0 || !apiKey || !host) return res.status(400).json({ ok: false, error: 'urls, apiKey, and host required' });
  try {
    const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args)).catch(() => null);
    const body = { host, key: apiKey, urlList: urls.slice(0, 10000), keyLocation: `https://${host}/${apiKey}.txt` };
    let submitted = false;
    try {
      const resp = await (await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
      submitted = resp && resp.ok;
    } catch(e) { submitted = false; }
    res.json({ ok: true, submitted, urlsQueued: urls.length, note: submitted ? 'URLs submitted to IndexNow' : 'IndexNow API unavailable; verify key and retry' });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/pagination-seo', async (req, res) => {
  const { url, paginationType = 'numbered' } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  try {
    const openai = getOpenAI();
    const prompt = `Audit pagination SEO for ${url} (type: ${paginationType}). Return JSON: {"currentIssues": ["string"], "relPrevNext": "present|missing|incorrect", "canonicalSetup": "correct|incorrect|missing", "recommendations": ["string"], "googleGuidance": "string", "infiniteScrollAdvice": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    res.json({ ok: true, url, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/technical/security-headers', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  try {
    const https2 = require('https');
    const http2 = require('http');
    const mod = url.startsWith('https') ? https2 : http2;
    let headers = {};
    await new Promise((resolve) => {
      mod.get(url, { timeout: 8000 }, (r) => { headers = r.headers; r.resume(); resolve(); }).on('error', resolve);
    });
    const secHeaders = ['strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'];
    const audit = secHeaders.map(h => ({ header: h, present: !!headers[h], value: headers[h]||null, seoImpact: h === 'strict-transport-security' ? 'high' : 'low' }));
    res.json({ ok: true, url, audit, score: audit.filter(a => a.present).length * 17, recommendations: audit.filter(a => !a.present).map(a => `Add ${a.header}`) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});


/* =========================================================================
   SCHEMA EXPANSIONS
   ========================================================================= */
router.post('/schema/carousel', async (req, res) => {
  const { items = [] } = req.body;
  if (items.length === 0) return res.status(400).json({ ok: false, error: 'items array required' });
  const schema = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name || item, url: item.url || '', image: item.image || '' })) };
  res.json({ ok: true, schema: JSON.stringify(schema, null, 2), instructions: 'Add inside <script type="application/ld+json"> in <head>.' });
});

router.post('/schema/fact-check', async (req, res) => {
  const { claimText, claimUrl, ratingValue, ratingExplanation, authorName, publishDate } = req.body;
  if (!claimText) return res.status(400).json({ ok: false, error: 'claimText required' });
  const schema = { '@context': 'https://schema.org', '@type': 'ClaimReview', url: claimUrl || '', claimReviewed: claimText, author: { '@type': 'Organization', name: authorName || 'Unknown' }, reviewRating: { '@type': 'Rating', ratingValue: ratingValue || 'False', bestRating: 'True', worstRating: 'False', alternateName: ratingExplanation || '' }, datePublished: publishDate || new Date().toISOString().split('T')[0] };
  res.json({ ok: true, schema: JSON.stringify(schema, null, 2) });
});

router.post('/schema/dataset', async (req, res) => {
  const { name, description, url, creator, keywords = [], license, datePublished } = req.body;
  if (!name) return res.status(400).json({ ok: false, error: 'name required' });
  const schema = { '@context': 'https://schema.org', '@type': 'Dataset', name, description: description || name, url: url || '', creator: { '@type': 'Person', name: creator || 'Unknown' }, keywords, license: license || '', datePublished: datePublished || new Date().toISOString().split('T')[0] };
  res.json({ ok: true, schema: JSON.stringify(schema, null, 2) });
});

router.post('/schema/podcast-episode', async (req, res) => {
  const { showName, episodeTitle, description, audioUrl, imageUrl, publishDate, duration, episodeNumber } = req.body;
  if (!episodeTitle) return res.status(400).json({ ok: false, error: 'episodeTitle required' });
  const schema = { '@context': 'https://schema.org', '@type': 'PodcastEpisode', partOfSeries: { '@type': 'PodcastSeries', name: showName || 'Podcast' }, name: episodeTitle, description: description || episodeTitle, audio: { '@type': 'AudioObject', contentUrl: audioUrl || '', duration: duration || 'PT30M' }, thumbnailUrl: imageUrl || '', datePublished: publishDate || new Date().toISOString().split('T')[0], episodeNumber: episodeNumber || 1 };
  res.json({ ok: true, schema: JSON.stringify(schema, null, 2) });
});

router.post('/schema/speakable', async (req, res) => {
  const { url, cssSelectors = [] } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: 'url required' });
  try {
    const openai = getOpenAI();
    const prompt = `Suggest speakable markup selectors for a page at ${url} with CSS selectors: ${cssSelectors.join(', ')||'auto-detect common patterns'}. Return JSON: {"speakableSchema": "string", "recommendedSelectors": ["string"], "reasoning": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    const schema = { '@context': 'https://schema.org', '@type': 'WebPage', speakable: { '@type': 'SpeakableSpecification', cssSelector: cssSelectors.length ? cssSelectors : ['h1', 'p:first-of-type'] }, url };
    res.json({ ok: true, url, schema: JSON.stringify(schema, null, 2), ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* =========================================================================
   SHOPIFY SEO EXPANSIONS
   ========================================================================= */
router.post('/shopify/collection-seo-audit', async (req, res) => {
  const { shopDomain, collectionHandle } = req.body;
  if (!shopDomain) return res.status(400).json({ ok: false, error: 'shopDomain required' });
  try {
    const openai = getOpenAI();
    const prompt = `Audit Shopify collection SEO for "${collectionHandle||'all collections'}" on ${shopDomain}. Return JSON: {"issues": [{"issue": "string", "impact": "high|medium|low", "fix": "string"}], "titleOptimisation": "string", "descriptionOptimisation": "string", "breadcrumbAdvice": "string", "facetedNavAdvice": "string", "score": number}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    res.json({ ok: true, shopDomain, collectionHandle, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/shopify/product-schema-bulk', async (req, res) => {
  const { products = [] } = req.body;
  if (products.length === 0) return res.status(400).json({ ok: false, error: 'products array required' });
  const schemas = products.map(p => JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.title || p.name, description: p.description || '', sku: p.sku || p.id || '', offers: { '@type': 'Offer', price: p.price || '0', priceCurrency: p.currency || 'USD', availability: 'https://schema.org/InStock', url: p.url || '' }, image: p.image || '' }, null, 2));
  res.json({ ok: true, count: schemas.length, schemas });
});

router.post('/shopify/hreflang-generator', async (req, res) => {
  const { pages = [], regions = ['en-US', 'en-GB', 'fr-FR'], baseUrl } = req.body;
  if (!baseUrl) return res.status(400).json({ ok: false, error: 'baseUrl required' });
  const hreflangTags = pages.map(page => {
    const tags = regions.map(r => `<link rel="alternate" hreflang="${r}" href="${baseUrl}/${r.toLowerCase().split('-')[0]}/${page}" />`);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${baseUrl}/${page}" />`);
    return { page, tags: tags.join('\n') };
  });
  res.json({ ok: true, hreflangTags, regions, note: 'Add inside <head> of each page variation.' });
});

router.post('/shopify/sitemap-enhancer', async (req, res) => {
  const { shopDomain, priorityMap = {} } = req.body;
  if (!shopDomain) return res.status(400).json({ ok: false, error: 'shopDomain required' });
  try {
    const openai = getOpenAI();
    const prompt = `Optimise XML sitemap strategy for Shopify store ${shopDomain}. Return JSON: {"sitemapStructure": ["string"], "priorityRecommendations": [{"urlPattern": "string", "priority": number, "changefreq": "string"}], "excludePatterns": ["string"], "imageSitemapAdvice": "string", "videoSitemapAdvice": "string", "maxUrls": number}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    res.json({ ok: true, shopDomain, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* =========================================================================
   CROSS-CUTTING INFRASTRUCTURE
   ========================================================================= */
router.post('/workflow/content-approval', async (req, res) => {
  const { shop, contentId, action, assignee, notes } = req.body;
  if (!shop || !contentId) return res.status(400).json({ ok: false, error: 'shop and contentId required' });
  const workflowPath = path.join(__dirname, '../../..', 'data', `approval-workflow-${shop.replace(/\./g,'_')}.json`);
  let data = [];
  try { data = JSON.parse(fs.readFileSync(workflowPath, 'utf8')); } catch(e) { data = []; }
  const existing = data.find(d => d.contentId === contentId);
  if (existing) { if (action) { existing.status = action; existing.history = existing.history||[]; existing.history.push({ action, assignee, notes, at: new Date().toISOString() }); } }
  else { data.push({ contentId, status: action||'draft', assignee, notes, createdAt: new Date().toISOString(), history: [] }); }
  fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
  res.json({ ok: true, contentId, status: (data.find(d => d.contentId === contentId)||{}).status });
});

router.get('/workflow/content-approval', async (req, res) => {
  const shop = req.query.shop || req.headers['x-shopify-shop-domain'];
  if (!shop) return res.status(400).json({ ok: false, error: 'shop required' });
  const workflowPath = path.join(__dirname, '../../..', 'data', `approval-workflow-${shop.replace(/\./g,'_')}.json`);
  let data = [];
  try { data = JSON.parse(fs.readFileSync(workflowPath, 'utf8')); } catch(e) { data = []; }
  res.json({ ok: true, items: data, total: data.length });
});

router.post('/reports/generate-pdf', async (req, res) => {
  const { shop, reportType = 'seo-overview', sections = [] } = req.body;
  if (!shop) return res.status(400).json({ ok: false, error: 'shop required' });
  try {
    const openai = getOpenAI();
    const prompt = `Generate a professional SEO report for shop "${shop}". Report type: "${reportType}". Sections: ${sections.join(', ')||'executive summary, keyword rankings, technical health, backlinks, recommendations'}. Return JSON: {"reportTitle": "string", "generatedAt": "string", "executiveSummary": "string", "sections": [{"sectionTitle": "string", "content": "string", "keyMetrics": [{"metric": "string", "value": "string", "trend": "up|down|stable"}]}], "recommendations": [{"priority": "high|medium|low", "action": "string", "estimatedImpact": "string"}], "nextReportDate": "string"}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, shop, ...parsed, note: 'Use a client-side PDF library (jsPDF/html2pdf) to render this as a downloadable PDF.' });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/monitoring/add-alert', async (req, res) => {
  const { shop, type = 'keyword-position', threshold, url, keyword, email } = req.body;
  if (!shop) return res.status(400).json({ ok: false, error: 'shop required' });
  const alertsPath = path.join(__dirname, '../../..', 'data', `monitoring-alerts-${shop.replace(/\./g,'_')}.json`);
  let alerts = [];
  try { alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8')); } catch(e) { alerts = []; }
  const alert = { id: Date.now().toString(), shop, type, threshold, url, keyword, email, createdAt: new Date().toISOString(), active: true };
  alerts.push(alert);
  fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));
  res.json({ ok: true, alert });
});

router.get('/monitoring/alerts', async (req, res) => {
  const shop = req.query.shop || req.headers['x-shopify-shop-domain'];
  if (!shop) return res.status(400).json({ ok: false, error: 'shop required' });
  const alertsPath = path.join(__dirname, '../../..', 'data', `monitoring-alerts-${shop.replace(/\./g,'_')}.json`);
  let alerts = [];
  try { alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8')); } catch(e) { alerts = []; }
  res.json({ ok: true, alerts, total: alerts.length });
});

router.post('/monitoring/alerts', async (req, res) => {
  const shop = req.body.shop || req.headers['x-shopify-shop-domain'];
  if (!shop) return res.status(400).json({ ok: false, error: 'shop required' });
  const alertsPath = path.join(__dirname, '../../..', 'data', `monitoring-alerts-${shop.replace(/\./g,'_')}.json`);
  let alerts = [];
  try { alerts = JSON.parse(fs.readFileSync(alertsPath, 'utf8')); } catch(e) { alerts = []; }
  res.json({ ok: true, alerts, total: alerts.length });
});

router.post('/analytics/ross', async (req, res) => {
  const { organicSessions, organicRevenue, seoSpend, keywords = [] } = req.body;
  if (!organicRevenue || !seoSpend) return res.status(400).json({ ok: false, error: 'organicRevenue and seoSpend required' });
  const ross = ((organicRevenue - seoSpend) / seoSpend * 100).toFixed(2);
  try {
    const openai = getOpenAI();
    const prompt = `Analyse Return on Organic Search Spend (ROSS): Revenue ${organicRevenue}, SEO Spend ${seoSpend}, ROSS: ${ross}%. Sessions: ${organicSessions||'unknown'}. Top keywords: ${keywords.join(', ')||'unknown'}. Return JSON: {"ross": ${ross}, "verdict": "string", "benchmark": "string", "improvements": ["string"], "roiProjections": [{"scenario": "string", "projectedROSS": number}]}`;
    const r = await getOpenAI().chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
    const parsed = JSON.parse(r.choices[0].message.content);
    res.json({ ok: true, organicRevenue, seoSpend, ...parsed });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});


/* ================================================================
   TECHNICAL+ BATCH 2 — JS Rendering, LCP, Font, AMP, PWA, Bots
   ================================================================ */

// JS Rendering Audit
router.post('/js-rendering-audit', async (req, res) => {
  try {
    const { url, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a technical SEO expert specialising in JavaScript rendering.' }, { role: 'user', content: `Analyse JS rendering SEO issues for: ${url}. Return JSON: { renderingType, googleBotCompatible, issuesSsr, clientSideProblems, recommendations, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Search Preview
router.post('/search-preview', async (req, res) => {
  try {
    const { url, title, metaDesc, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You generate accurate Google SERP preview data.' }, { role: 'user', content: `Generate SERP preview for: title="${title}", metaDesc="${metaDesc}", url="${url}". Return JSON: { desktopPreview: { displayUrl, title, snippet }, mobilePreview: { displayUrl, title, snippet }, titleLength, descLength, titleIssues, descIssues, ctrScore, improvements }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// LCP Deep Dive
router.post('/lcp-deep-dive', async (req, res) => {
  try {
    const { url, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Core Web Vitals expert.' }, { role: 'user', content: `Analyse Largest Contentful Paint for: ${url}. Return JSON: { lcpElement, estimatedMs, rating, causes, themeImpact, imageLazyLoad, criticalCss, fixes, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Negative SEO Detector
router.post('/negative-seo-detector', async (req, res) => {
  try {
    const { domain, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a negative SEO attack detection expert.' }, { role: 'user', content: `Assess negative SEO risk for domain: ${domain}. Return JSON: { riskLevel, spamyLinksRisk, contentScrapingRisk, cloakingRisk, reviewBombingRisk, recommendations, monitoringChecklist }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Font Performance Audit
router.post('/font-performance-audit', async (req, res) => {
  try {
    const { url, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a web performance expert focused on font loading.' }, { role: 'user', content: `Audit font performance for: ${url}. Return JSON: { fontsDetected, loadStrategy, foutRisk, clsRisk, recommendations, preloadCandidates, subsettingOpportunity, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// AMP Validator
router.post('/amp-validator', async (req, res) => {
  try {
    const { url, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an AMP and mobile SEO expert.' }, { role: 'user', content: `Assess AMP viability for Shopify blog post: ${url}. Return JSON: { ampViable, currentAmpStatus, issues, shopifyAmpSupport, alternatives, mobileScoreEstimate, recommendations }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// PWA Audit
router.post('/pwa-audit', async (req, res) => {
  try {
    const { domain, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Progressive Web App and SEO specialist.' }, { role: 'user', content: `Audit PWA readiness for Shopify store: ${domain}. Return JSON: { manifestStatus, serviceWorkerStatus, httpsStatus, installability, offlineCapability, seoImpact, shopifyLimitations, recommendations }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// AI Bot Blocker Config
router.post('/ai-bot-blocker-config', async (req, res) => {
  try {
    const { domain, allowBots, strategy, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an AI crawl management and GEO SEO expert.' }, { role: 'user', content: `Generate AI bot management config for: ${domain}. Strategy: ${strategy || 'balanced'}. AllowBots: ${allowBots || 'googlebot,bingbot'}. Return JSON: { robotsTxtRules, geoBotStrategy, llmCrawlerList, blockRecommendations, allowRecommendations, seoImpact, geoVisibilityImpact }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});


/* ================================================================
   SHOPIFY SEO BATCH 2 — Tags, Images, Duplicate, Breadcrumb, etc.
   ================================================================ */

// Tag Taxonomy Optimiser
router.post('/shopify/tag-taxonomy', async (req, res) => {
  try {
    const { tags, productType, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Shopify taxonomy and SEO expert.' }, { role: 'user', content: `Optimise tag taxonomy for Shopify store. Current tags: ${JSON.stringify(tags)}. Product type: ${productType}. Return JSON: { redundantTags, suggestedConsolidation, seoFriendlyTags, hierarchyStructure, facetedNavTips, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Blog Internal Links Audit
router.post('/shopify/blog-internal-links', async (req, res) => {
  try {
    const { blogHandle, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an internal linking SEO specialist for Shopify blogs.' }, { role: 'user', content: `Audit internal linking strategy for Shopify blog: ${blogHandle}. Return JSON: { orphanRisk, linkDensityScore, topicClusterGaps, pillarPageOpportunities, crossLinkSuggestions, anchorTextDiversity, recommendations }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Image Compression Advisor
router.post('/shopify/image-compression', async (req, res) => {
  try {
    const { productHandle, images, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an image optimisation and Core Web Vitals expert for Shopify.' }, { role: 'user', content: `Advise on image optimisation for Shopify product: ${productHandle}. Images: ${JSON.stringify(images || [])}. Return JSON: { estimatedSavings, formatRecommendations, lazyLoadStrategy, altTextScore, webpSupport, clisTips, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Duplicate Product Detector
router.post('/shopify/duplicate-products', async (req, res) => {
  try {
    const { products, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Shopify SEO expert specialising in duplicate content.' }, { role: 'user', content: `Detect duplicate content issues across products: ${JSON.stringify((products || []).slice(0, 20))}. Return JSON: { duplicatePairs, canonicalisationNeeded, variantIssues, handles, fixes, riskLevel }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Breadcrumb Schema Bulk
router.post('/shopify/breadcrumb-schema', async (req, res) => {
  try {
    const { pages, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a schema markup and structured data expert.' }, { role: 'user', content: `Generate BreadcrumbList schema for pages: ${JSON.stringify((pages || []).slice(0, 10))}. Return JSON: { schemas: [{ url, breadcrumbSchema }], coverageScore, missingPages, liquidSnippet }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Review Schema Bulk Generator
router.post('/shopify/review-schema-bulk', async (req, res) => {
  try {
    const { products, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a structured data expert for e-commerce.' }, { role: 'user', content: `Generate AggregateRating schema snippets for products: ${JSON.stringify((products || []).slice(0, 10))}. Return JSON: { schemas: [{ productTitle, handle, schema }], liquidTemplate, appIntegrations, ratingGapProducts }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// International SEO (hreflang)
router.post('/shopify/international-seo', async (req, res) => {
  try {
    const { domain, markets, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an international SEO expert for Shopify Markets.' }, { role: 'user', content: `Analyse international SEO for domain: ${domain}, markets: ${JSON.stringify(markets || [])}. Return JSON: { hreflangImplementation, marketSubfolders, canonicalIssues, currencyHreflang, shopifyMarketsSetup, recommendations, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Collection Keyword Gaps
router.post('/shopify/collection-keyword-gaps', async (req, res) => {
  try {
    const { collectionTitle, collectionDesc, targetKeywords, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Shopify collection SEO expert.' }, { role: 'user', content: `Find keyword gaps for collection: "${collectionTitle}". Description: "${collectionDesc}". Targets: ${JSON.stringify(targetKeywords || [])}. Return JSON: { missingKeywords, headingOpportunities, descriptionImprovements, internalLinkAnchors, competitorVsStore, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Theme SEO Audit
router.post('/shopify/theme-seo-audit', async (req, res) => {
  try {
    const { themeName, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Shopify theme SEO expert.' }, { role: 'user', content: `Audit Shopify theme for SEO: theme="${themeName}". Return JSON: { headingHierarchyScore, canonicalTagPresent, ogTagsPresent, jsonLdPresent, lazyLoadImages, mobileFriendly, pageSpeedImpact, liquidIssues, recommendations, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Shop Speed Audit
router.post('/shopify/speed-audit', async (req, res) => {
  try {
    const { domain, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Shopify performance and Core Web Vitals expert.' }, { role: 'user', content: `Audit speed and Core Web Vitals for Shopify store: ${domain}. Return JSON: { estimatedLcp, estimatedFid, estimatedCls, appImpact, thirdPartyScripts, fontOptimisation, imageOptimisation, quickWins, estimatedScoreGain }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});


/* ================================================================
   CONTENT+ — Helpful Content, Decay, Page Experience, E-E-A-T
   ================================================================ */

// Helpful Content Checklist
router.post('/helpful-content-check', async (req, res) => {
  try {
    const { url, content, keyword, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Google Helpful Content specialist.' }, { role: 'user', content: `Assess helpful content compliance for post "${keyword}" at ${url}. Content preview: "${(content || '').slice(0, 500)}". Return JSON: { peopleFirstScore, uniqueInsights, expertiseSignals, firsthandExperience, satisfiesIntent, notAiSpun, passesHelpfulContent, issues, recommendations, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Content Decay Finder
router.post('/content-decay-finder', async (req, res) => {
  try {
    const { posts, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a content decay and content refresh specialist.' }, { role: 'user', content: `Identify content decay risk for posts: ${JSON.stringify((posts || []).slice(0, 15))}. Return JSON: { highDecayRisk: [], mediumDecayRisk: [], refreshPriority: [], estimatedTrafficRecovery, quickWins, evergreen }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Page Experience Checker
router.post('/page-experience-check', async (req, res) => {
  try {
    const { url, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a Page Experience Signals expert.' }, { role: 'user', content: `Evaluate page experience signals for: ${url}. Return JSON: { cwvStatus, mobileUsability, httpsStatus, noIntrusiveInterstitials, safeBrowsing, overallScore, passed, failed, recommendations }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ================================================================
   LOG FILE ANALYSER — Parse & Analyse Server Log Data
   ================================================================ */
const logStore = new Map();

router.post('/log-analyser/upload', async (req, res) => {
  try {
    const { logSample, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a server log file SEO analyst.' }, { role: 'user', content: `Analyse this server log sample for SEO insights: "${(logSample || '').slice(0, 1000)}". Return JSON: { crawlBudgetWaste, botDistribution, errorUrls, topCrawledUrls, redirectChains, crawlFrequency, recommendations, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    const id = `log_${shop}_${Date.now()}`;
    logStore.set(id, { ...data, ts: Date.now(), shop });
    res.json({ ok: true, id, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.get('/log-analyser/history', async (req, res) => {
  try {
    const shop = req.query.shop || req.headers['x-shopify-shop-domain'] || '';
    const items = Array.from(logStore.values()).filter(i => i.shop === shop).slice(-10);
    res.json({ ok: true, items });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ================================================================
   INTERNAL LINKING INTELLIGENCE
   ================================================================ */

// Internal Link Opportunity Finder
router.post('/internal-link-opportunities', async (req, res) => {
  try {
    const { sourceUrl, targetPosts, keyword, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an internal linking SEO strategist.' }, { role: 'user', content: `Find internal linking opportunities. Source: ${sourceUrl}. Keyword: ${keyword}. Target posts: ${JSON.stringify((targetPosts || []).slice(0, 15))}. Return JSON: { topOpportunities: [{ targetUrl, anchorText, relevanceScore, context }], linkGap, anchorDiversity, pillarLinks, orphanFix, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Anchor Text Analyser
router.post('/anchor-text-analyser', async (req, res) => {
  try {
    const { url, anchors, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are an anchor text optimisation expert.' }, { role: 'user', content: `Analyse anchor text profile for: ${url}. Anchors: ${JSON.stringify(anchors || [])}. Return JSON: { diversityScore, exactMatchRatio, brandedRatio, genericRatio, recommendations, topAnchors, riskyAnchors, naturalAnchors }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ── Implement Schema: push JSON-LD script tag directly into a Shopify article ── */
router.post('/implement-schema', async (req, res) => {
  try {
    const { articleId, blogId, scriptTag, shop } = req.body;
    if (!articleId || !blogId || !scriptTag) return res.status(400).json({ ok: false, error: 'Missing articleId, blogId or scriptTag' });

    const shopTokens = require('../../core/shopTokens');
    const resolvedShop = shop
      || req.session?.shop
      || req.headers['x-shopify-shop-domain']
      || (shopTokens.loadAll ? (() => { const all = shopTokens.loadAll(); const keys = Object.keys(all || {}); return keys.length === 1 ? keys[0] : null; })() : null)
      || process.env.SHOPIFY_STORE_URL;

    if (!resolvedShop) return res.status(400).json({ ok: false, error: 'No Shopify store connected' });

    const token = shopTokens.getToken
      ? shopTokens.getToken(resolvedShop)
      : (process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN || null);

    if (!token) return res.status(400).json({ ok: false, error: 'No Shopify token — reconnect your store in Settings' });

    const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

    // Fetch current article
    const artRes = await fetch(`https://${resolvedShop}/admin/api/${ver}/blogs/${blogId}/articles/${articleId}.json`, { headers });
    if (!artRes.ok) throw new Error(`Failed to fetch article: ${artRes.status}`);
    const artJson = await artRes.json();
    const article = artJson.article;
    if (!article) throw new Error('Article not found');

    // Detect schema type from scriptTag to avoid duplicating same type
    const typeMatch = scriptTag.match(/"@type"\s*:\s*"([^"]+)"/);
    const schemaType = typeMatch ? typeMatch[1] : null;

    // Remove any existing script tag of the same @type from body_html
    let body = article.body_html || '';
    if (schemaType) {
      // Remove old script tags of the same @type
      body = body.replace(
        new RegExp(`<script[^>]*type=["']application/ld\\+json["'][^>]*>[\\s\\S]*?"@type"\\s*:\\s*"${schemaType}"[\\s\\S]*?<\\/script>`, 'gi'),
        ''
      );
    }

    // Append new schema at the end of body_html
    const updatedBody = body.trimEnd() + '\n' + scriptTag;

    // Update article via Shopify API
    const updateRes = await fetch(`https://${resolvedShop}/admin/api/${ver}/blogs/${blogId}/articles/${articleId}.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ article: { id: articleId, body_html: updatedBody } }),
    });
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Shopify update failed (${updateRes.status}): ${errText.slice(0, 200)}`);
    }

    res.json({ ok: true, message: `${schemaType || 'Schema'} added to post successfully` });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Apply a rewrite suggestion directly to a Shopify article field
router.post('/apply-field', async (req, res) => {
  try {
    const { articleId, blogId, field, value, shop } = req.body;
    if (!articleId || !blogId || !field || !value) return res.status(400).json({ ok: false, error: 'Missing required fields' });
    const shopTokens = require('../../core/shopTokens');
    const resolvedShop = shop || req.headers['x-shopify-shop-domain'];
    const token = await shopTokens.getToken(resolvedShop);
    if (!token) return res.status(403).json({ ok: false, error: 'No Shopify token for this shop' });
    const ver = '2023-10';
    const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token };
    const articleBase = `https://${resolvedShop}/admin/api/${ver}/blogs/${blogId}/articles/${articleId}`;
    if (field === 'title' || field === 'h1') {
      const r = await fetch(`${articleBase}.json`, {
        method: 'PUT', headers,
        body: JSON.stringify({ article: { id: articleId, title: value } }),
      });
      if (!r.ok) throw new Error(`Shopify update failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
      return res.json({ ok: true, message: 'Title updated on post' });
    }
    if (field === 'handle') {
      // Sanitise to valid Shopify handle: lowercase, hyphens, no special chars
      const sanitised = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const r = await fetch(`${articleBase}.json`, {
        method: 'PUT', headers,
        body: JSON.stringify({ article: { id: articleId, handle: sanitised } }),
      });
      if (!r.ok) throw new Error(`Shopify handle update failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
      return res.json({ ok: true, message: 'URL slug updated on post', handle: sanitised });
    }
    if (field === 'metaDescription') {
      // Update SEO meta description via metafields
      const r = await fetch(`${articleBase}/metafields.json`, {
        method: 'POST', headers,
        body: JSON.stringify({ metafield: { namespace: 'global', key: 'description_tag', value, type: 'single_line_text_field' } }),
      });
      if (!r.ok) throw new Error(`Shopify metafield update failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
      return res.json({ ok: true, message: 'Meta description updated on post' });
    }
    if (field === 'headings') {
      const newH2s = value.split(/\s*\|\s*/).map(h => h.trim()).filter(Boolean);
      if (!newH2s.length) return res.status(400).json({ ok: false, error: 'No headings provided' });
      const getRes = await fetch(`${articleBase}.json`, { headers: { 'X-Shopify-Access-Token': token } });
      if (!getRes.ok) throw new Error(`Could not fetch article (${getRes.status})`);
      const { article: existingArticle } = await getRes.json();
      let body = existingArticle.body_html || '';
      let idx = 0;
      body = body.replace(/<h2[^>]*>.*?<\/h2>/gis, () => {
        if (idx < newH2s.length) return `<h2>${newH2s[idx++]}</h2>`;
        return '';
      });
      if (idx < newH2s.length) {
        const extras = newH2s.slice(idx).map(h => `<h2>${h}</h2>`).join('\n');
        body = body + '\n' + extras;
      }
      body = body.replace(/\n{3,}/g, '\n\n').trim();
      const putRes = await fetch(`${articleBase}.json`, {
        method: 'PUT', headers,
        body: JSON.stringify({ article: { id: articleId, body_html: body } }),
      });
      if (!putRes.ok) throw new Error(`Shopify headings update failed (${putRes.status}): ${(await putRes.text()).slice(0, 200)}`);
      return res.json({ ok: true, message: `${newH2s.length} H2 headings applied to post` });
    }
    if (field === 'schema') {
      // Inject JSON-LD script tag into the article's body_html
      const getRes = await fetch(`${articleBase}.json`, { headers: { 'X-Shopify-Access-Token': token } });
      if (!getRes.ok) throw new Error(`Could not fetch article (${getRes.status})`);
      const { article: existingArticle } = await getRes.json();
      let body = existingArticle.body_html || '';
      // Remove any existing ld+json block first
      body = body.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '').trim();
      body = body + `\n<script type="application/ld+json">\n${value}\n</script>`;
      const putRes = await fetch(`${articleBase}.json`, {
        method: 'PUT', headers,
        body: JSON.stringify({ article: { id: articleId, body_html: body } }),
      });
      if (!putRes.ok) throw new Error(`Shopify schema inject failed (${putRes.status}): ${(await putRes.text()).slice(0, 200)}`);
      return res.json({ ok: true, message: 'Schema markup added to your post' });
    }
    if (field === 'body_append') {
      // Append HTML content to the end of the article body
      const getRes = await fetch(`${articleBase}.json`, { headers: { 'X-Shopify-Access-Token': token } });
      if (!getRes.ok) throw new Error(`Could not fetch article (${getRes.status})`);
      const { article: existingArticle } = await getRes.json();
      const body = (existingArticle.body_html || '').trim() + '\n\n' + value;
      const putRes = await fetch(`${articleBase}.json`, {
        method: 'PUT', headers,
        body: JSON.stringify({ article: { id: articleId, body_html: body } }),
      });
      if (!putRes.ok) throw new Error(`Shopify body append failed (${putRes.status}): ${(await putRes.text()).slice(0, 200)}`);
      return res.json({ ok: true, message: 'Content added to your post' });
    }
    return res.status(400).json({ ok: false, error: `Unsupported field: ${field}` });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* ── Publish article to Shopify as draft ───────────────────────────────── */
router.post('/shopify/publish-article', async (req, res) => {
  try {
    const shopTokens = require('../../core/shopTokens');
    const { title, bodyHtml, metaDescription, tags, asDraft = true } = req.body;
    if (!title || !bodyHtml) return res.status(400).json({ ok: false, error: 'title and bodyHtml required' });

    let shop = req.session?.shop
      || req.headers['x-shopify-shop-domain']
      || (shopTokens.loadAll ? (() => { const all = shopTokens.loadAll(); const keys = Object.keys(all || {}); return keys.length === 1 ? keys[0] : null; })() : null)
      || process.env.SHOPIFY_STORE_URL || null;
    if (!shop) return res.status(400).json({ ok: false, error: 'No Shopify store connected' });

    const token = shopTokens.getToken ? shopTokens.getToken(shop) : (process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN || null);
    if (!token) return res.status(400).json({ ok: false, error: 'No Shopify token — reconnect your store in Settings' });

    const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

    // Get first blog
    const blogsRes = await fetch(`https://${shop}/admin/api/${ver}/blogs.json?limit=1`, { headers });
    if (!blogsRes.ok) throw new Error(`Could not fetch Shopify blogs: ${blogsRes.status}`);
    const blogsJson = await blogsRes.json();
    const blog = (blogsJson.blogs || [])[0];
    if (!blog) return res.status(400).json({ ok: false, error: 'No blog found in your Shopify store. Create a blog first.' });

    const articleBody = {
      article: {
        title,
        body_html: bodyHtml,
        ...(metaDescription ? { summary_html: `<p>${metaDescription}</p>` } : {}),
        ...(tags ? { tags } : {}),
        published: !asDraft,
      }
    };

    const artRes = await fetch(`https://${shop}/admin/api/${ver}/blogs/${blog.id}/articles.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify(articleBody),
    });
    if (!artRes.ok) {
      const errBody = await artRes.text();
      throw new Error(`Shopify article create failed (${artRes.status}): ${errBody.slice(0, 200)}`);
    }
    const artJson = await artRes.json();
    const article = artJson.article;
    const articleUrl = `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/blogs/${blog.id}/articles/${article.id}`;
    res.json({ ok: true, articleId: article.id, articleUrl, blogId: blog.id, blogHandle: blog.handle, handle: article.handle });
  } catch (err) {
    console.error('[blog-seo] /shopify/publish-article error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Site Architecture Analyser
router.post('/site-architecture', async (req, res) => {
  try {
    const { domain, sampleUrls, shop } = req.body;
    const ai = getOpenAI();
    const resp = await ai.chat.completions.create({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a site architecture and information architecture SEO expert.' }, { role: 'user', content: `Analyse site architecture for: ${domain}. Sample URLs: ${JSON.stringify((sampleUrls || []).slice(0, 20))}. Return JSON: { depth, flatness, siteMapScore, urlStructure, categoryOrganisation, crawlability, pageRankFlow, recommendations, score }` }] });
    const data = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini' });
    res.json({ ok: true, ...data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;


