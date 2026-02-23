const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcReadability(text) {
  if (!text || text.length < 50) return { score: 0, grade: 'N/A', avgSentenceLen: 0, avgWordLen: 0 };
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const words = text.split(/\s+/).filter(Boolean);
  const syllableCount = words.reduce((sum, w) => {
    const s = w.toLowerCase().replace(/[^a-z]/g, '');
    if (s.length <= 3) return sum + 1;
    let count = s.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
    return sum + (count ? Math.max(count.length, 1) : 1);
  }, 0);
  const sentCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const flesch = 206.835 - 1.015 * (wordCount / sentCount) - 84.6 * (syllableCount / wordCount);
  const clamped = Math.max(0, Math.min(100, Math.round(flesch)));
  let grade = 'Very Difficult';
  if (clamped >= 90) grade = 'Very Easy';
  else if (clamped >= 80) grade = 'Easy';
  else if (clamped >= 70) grade = 'Fairly Easy';
  else if (clamped >= 60) grade = 'Standard';
  else if (clamped >= 50) grade = 'Fairly Hard';
  else if (clamped >= 30) grade = 'Difficult';
  return { score: clamped, grade, avgSentenceLen: Math.round(wordCount / sentCount), avgWordLen: +(syllableCount / wordCount).toFixed(1) };
}

function analyzeUrlStructure(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const slug = path.split('/').filter(Boolean).pop() || '';
    const hasNumbers = /\d{4,}/.test(slug);
    const hasHyphens = slug.includes('-');
    const hasUnderscores = slug.includes('_');
    const tooLong = slug.length > 75;
    const issues = [];
    const hasUppercase = /[A-Z]/.test(slug);
    const hasParameters = parsed.search.length > 1;
    const hasSpaces = /%20|\s/.test(parsed.pathname);
    const hasMultipleSlashes = /\/{2,}/.test(path.replace(/^\//, ''));  // ignore leading slash
    const segments = path.split('/').filter(Boolean);
    const hasRepetitivePath = segments.length > 1 && new Set(segments).size < segments.length;
    if (hasUnderscores) issues.push('URL uses underscores instead of hyphens');
    if (hasNumbers) issues.push('URL contains long numeric strings');
    if (tooLong) issues.push('URL slug too long (>75 chars)');
    if (!hasHyphens && slug.length > 15) issues.push('URL slug lacks word separators');
    if (parsed.protocol !== 'https:') issues.push('Page not served over HTTPS');
    if (hasUppercase) issues.push('URL contains uppercase characters — use lowercase');
    if (hasParameters) issues.push('URL contains query string parameters — prefer clean URLs');
    if (hasSpaces) issues.push('URL contains spaces — use hyphens as word separators (Screaming Frog)');
    if (hasMultipleSlashes) issues.push('URL contains multiple consecutive slashes (e.g. /seo//tools/) — may cause duplicate content (Screaming Frog)');
    if (hasRepetitivePath) issues.push('URL has a repetitive path segment (e.g. /seo/technical/seo/) — may indicate poor URL structure (Screaming Frog)');
    // Round 9: Non-ASCII characters in URL (Screaming Frog: URL > Non ASCII Characters)
    const hasNonAscii = (() => { try { return /[^\x20-\x7E]/.test(decodeURIComponent(path)); } catch { return false; } })();
    if (hasNonAscii) issues.push('URL contains non-ASCII characters — use ASCII-only URLs for maximum compatibility (Screaming Frog)');
    // Round 9: Full URL over 115 characters (Screaming Frog: URL > Over 115 Characters)
    if (url.length > 115) issues.push(`Full URL is ${url.length} characters — keep under 115 for better usability and sharing (Screaming Frog)`);
    return {
      slug, length: slug.length, isHttps: parsed.protocol === 'https:',
      hasHyphens, hasUnderscores, hasUppercase, hasParameters, hasSpaces, hasMultipleSlashes, hasRepetitivePath, hasNonAscii, tooLong, issues,
      score: Math.max(0, 100 - issues.length * 20),
    };
  } catch { return { slug: '', length: 0, isHttps: false, issues: ['Invalid URL'], score: 0 }; }
}

function checkKeywordPlacement(keyword, data) {
  if (!keyword) return [];
  const kw = keyword.toLowerCase().trim();
  const placements = [];
  if (data.title && data.title.toLowerCase().includes(kw)) placements.push('title');
  if (data.metaDescription && data.metaDescription.toLowerCase().includes(kw)) placements.push('metaDescription');
  if (data.h1 && data.h1.toLowerCase().includes(kw)) placements.push('h1');
  if (data.url && data.url.toLowerCase().includes(kw)) placements.push('url');
  if (data.firstWords && data.firstWords.toLowerCase().includes(kw)) placements.push('first100words');
  // Yoast: keyphrase in subheadings (H2/H3)
  if (data.headingHierarchy && data.headingHierarchy.some(h => h.level >= 2 && h.level <= 3 && h.text.toLowerCase().includes(kw))) placements.push('subheadings');
  return placements;
}

function computeKeywordDensity(textContent, keywords) {
  if (!textContent || !keywords) return [];
  const words = textContent.toLowerCase().split(/\s+/).filter(Boolean);
  const total = words.length;
  if (total === 0) return [];
  const kwList = (typeof keywords === 'string' ? keywords.split(',') : keywords).map(k => k.trim().toLowerCase()).filter(Boolean);
  return kwList.map(kw => {
    const kwWords = kw.split(/\s+/);
    let count = 0;
    if (kwWords.length === 1) {
      count = words.filter(w => w === kw || w === kw + 's' || w === kw + 'es').length;
    } else {
      const joined = words.join(' ');
      const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      count = (joined.match(re) || []).length;
    }
    const density = +((count / total) * 100).toFixed(2);
    const status = density === 0 ? 'missing' : density > 3 ? 'stuffing' : density >= 0.5 ? 'optimal' : 'low';
    return { keyword: kw, count, density, status };
  });
}

// Analyze image filenames for SEO quality (Ahrefs, Backlinko, Semrush)
function analyzeImageFilenames(imgTags) {
  if (!imgTags || imgTags.length === 0) return { total: 0, descriptive: 0, generic: 0, details: [] };
  const genericPatterns = /^(img|image|photo|pic|screenshot|screen|dsc|dcim|wp-image|untitled|unnamed)[-_]?\d*\.(jpe?g|png|gif|webp|svg|avif)$/i;
  const randomPatterns = /^[a-f0-9]{8,}\.(jpe?g|png|gif|webp|svg|avif)$/i;
  const numberedPatterns = /^(IMG|DSC|DCIM|P|PIC|PHOTO|DJI|GOPR|MVIMG)[-_]?\d{3,}\.(jpe?g|png|gif|webp|svg|avif)$/i;
  const details = imgTags.map(attrs => {
    const srcMatch = /src=["']([^"']+)["']/i.exec(attrs);
    if (!srcMatch) return null;
    const src = srcMatch[1];
    const filename = src.split('/').pop().split('?')[0] || '';
    const isGeneric = genericPatterns.test(filename) || randomPatterns.test(filename) || numberedPatterns.test(filename);
    const hasKeywords = filename.replace(/[-_]/g, ' ').replace(/\.\w+$/, '').trim().split(/\s+/).length >= 2;
    return { src: src.length > 80 ? '...' + src.slice(-60) : src, filename, descriptive: !isGeneric && hasKeywords };
  }).filter(Boolean).slice(0, 30);
  const descriptive = details.filter(d => d.descriptive).length;
  return { total: details.length, descriptive, generic: details.length - descriptive, details };
}

// Detect featured-snippet readiness signals (Ahrefs, Backlinko, Semrush)
function detectSnippetReadiness(html, headingHierarchy) {
  const signals = [];
  // FAQ section / FAQ schema
  const hasFaqSchema = /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"FAQPage"[\s\S]*?<\/script>/i.test(html);
  if (hasFaqSchema) signals.push({ signal: 'FAQ schema markup', present: true, tip: 'FAQPage schema detected — eligible for FAQ rich results.' });
  else signals.push({ signal: 'FAQ schema markup', present: false, tip: 'Add FAQPage JSON-LD schema to qualify for FAQ rich results in SERPs.' });

  // Check for question-style headings (signals FAQ/answer content)
  const questionHeadings = (headingHierarchy || []).filter(h => /^(what|why|how|when|where|who|which|can|do|does|is|are|should|will)\b/i.test(h.text));
  signals.push({ signal: 'Question-style headings', present: questionHeadings.length >= 2, tip: questionHeadings.length >= 2 ? `${questionHeadings.length} question headings found — good for People Also Ask.` : 'Add headings phrased as questions to target "People Also Ask" boxes.' });

  // Ordered/unordered lists (good for list snippets)
  const olCount = (html.match(/<ol[\s>]/gi) || []).length;
  const ulCount = (html.match(/<ul[\s>]/gi) || []).length;
  signals.push({ signal: 'Lists (ol/ul)', present: (olCount + ulCount) >= 2, tip: (olCount + ulCount) >= 2 ? `${olCount} ordered + ${ulCount} unordered lists — good for list snippet format.` : 'Add numbered or bulleted lists to qualify for list-style featured snippets.' });

  // Tables (table snippets)
  const tableCount = (html.match(/<table[\s>]/gi) || []).length;
  signals.push({ signal: 'Data tables', present: tableCount > 0, tip: tableCount > 0 ? `${tableCount} table(s) found — eligible for table snippets.` : 'Add comparison or data tables to target table-style featured snippets.' });

  // Definition-style opening (answer-first paragraph — Backlinko)
  const firstP = (/<p[^>]*>([\s\S]*?)<\/p>/i.exec(html) || [])[1] || '';
  const firstPText = firstP.replace(/<[^>]*>/g, '').trim();
  const isDefinition = /^(a |an |the |it is |it\'s |refers to |means |this is )/i.test(firstPText) || firstPText.length <= 150;
  signals.push({ signal: 'Concise opening paragraph', present: isDefinition && firstPText.length > 20, tip: isDefinition ? 'Opening paragraph is concise — good for paragraph featured snippets.' : 'Start with a direct, concise answer (40-60 words) to target paragraph snippets.' });

  const score = Math.round((signals.filter(s => s.present).length / signals.length) * 100);
  return { score, signals };
}

function computeWeightedScore(data) {
  const categories = {
    metaTags: { weight: 30, checks: [], score: 100 },
    content: { weight: 25, checks: [], score: 100 },
    technical: { weight: 20, checks: [], score: 100 },
    linksImages: { weight: 15, checks: [], score: 100 },
    keywords: { weight: 10, checks: [], score: 100 },
  };
  const issues = [];
  function addIssue(cat, sev, msg, impact) { issues.push({ cat, sev, msg, impact: Math.round(impact * (categories[cat].weight / 100)) }); categories[cat].score -= impact; }

  // META TAGS (30%)
  if (!data.title) { addIssue('metaTags', 'high', 'Missing page title', 30); }
  else {
    if (data.title.length < 30) { addIssue('metaTags', 'high', `Title critically short (${data.title.length} chars, need 30-60)`, 20); }
    else if (data.title.length < 45) { addIssue('metaTags', 'medium', `Title slightly short (${data.title.length} chars, aim 45-65)`, 10); }
    else if (data.title.length > 70) { addIssue('metaTags', 'medium', `Title too long (${data.title.length} chars), will be truncated in SERPs`, 10); }
  }
  if (!data.metaDescription) { addIssue('metaTags', 'high', 'Missing meta description', 25); }
  else {
    if (data.metaDescription.length < 70) { addIssue('metaTags', 'high', `Meta description critically short (${data.metaDescription.length} chars)`, 15); }
    else if (data.metaDescription.length < 120) { addIssue('metaTags', 'medium', `Meta description short (${data.metaDescription.length} chars, aim 130-160)`, 8); }
    else if (data.metaDescription.length > 170) { addIssue('metaTags', 'low', `Meta description slightly long (${data.metaDescription.length} chars), may truncate`, 5); }
  }
  if (!data.ogTitle) { addIssue('metaTags', 'low', 'Missing Open Graph title (og:title)', 8); }
  if (!data.ogDescription) { addIssue('metaTags', 'low', 'Missing Open Graph description (og:description)', 7); }
  if (data.robotsMeta && /noindex/i.test(data.robotsMeta)) { addIssue('metaTags', 'high', 'Page has noindex directive — will NOT appear in search results', 30); }
  // Round 9: Meta robots nofollow directive (Screaming Frog: Directives > Nofollow)
  if (data.robotsMeta && /nofollow/i.test(data.robotsMeta)) { addIssue('metaTags', 'medium', 'Page has meta robots nofollow directive — links on this page will not pass equity (Screaming Frog)', 10); }
  if (data.titleCount > 1) { addIssue('metaTags', 'medium', `Multiple <title> tags found (${data.titleCount}) — only one allowed per page`, 10); }
  if (data.metaDescriptionCount > 1) { addIssue('metaTags', 'medium', `Multiple meta description tags found (${data.metaDescriptionCount}) — only one allowed per page`, 10); }
  if (data.titleEqualsDescription) { addIssue('metaTags', 'medium', 'Title tag and meta description are identical — they should be different', 10); }
  if (data.titleEqualsH1) { addIssue('metaTags', 'low', 'Title tag is the same as H1 — differentiate for better SERP presentation (Screaming Frog)', 5); }
  if (data.titleOutsideHead) { addIssue('metaTags', 'high', '<title> tag found outside <head> — must be inside <head> for search engines to recognize it (Sitebulb)', 20); }
  if (data.metaDescOutsideHead) { addIssue('metaTags', 'high', 'Meta description found outside <head> — must be inside <head> to be recognized by search engines (Sitebulb)', 15); }
  if (!data.ogImage) { addIssue('metaTags', 'low', 'Missing Open Graph image (og:image) — social shares will lack a preview image', 6); }

  // CONTENT (25%)
  if (!data.h1) { addIssue('content', 'high', 'Missing H1 heading', 25); }
  else {
    if (data.h1Count > 1) { addIssue('content', 'medium', `Multiple H1 tags found (${data.h1Count}) — use only one H1 per page`, 10); }
    if (data.h1.length < 10) { addIssue('content', 'low', `H1 too short (${data.h1.length} chars) — make it descriptive (min 10 chars)`, 5); }
    else if (data.h1.length > 70) { addIssue('content', 'low', `H1 too long (${data.h1.length} chars) — keep under 70 chars for readability`, 5); }
  }
  if (data.hasLoremIpsum) { addIssue('content', 'high', 'Page contains Lorem Ipsum placeholder text — replace with real content', 20); }
  const wc = Number(data.wordCount) || 0;
  if (wc < 100) { addIssue('content', 'high', `Very thin content (${wc} words) — aim for 300+ minimum`, 25); }
  else if (wc < 300) { addIssue('content', 'medium', `Low word count (${wc}) — most ranking pages have 500+ words`, 12); }
  if (Number(data.h2Count) === 0) { addIssue('content', 'medium', 'No H2 subheadings — add structure for readability and SEO', 10); }
  if (Number(data.h3Count) > 0 && Number(data.h2Count) === 0) { addIssue('content', 'low', 'H3 tags used without H2 — broken heading hierarchy', 5); }
  if (data.headingSkips && data.headingSkips.length > 0) { addIssue('content', 'low', `Non-sequential heading levels: ${data.headingSkips.join('; ')} — don't skip heading levels (e.g. H1→H3)`, 5); }
  if (data.readability && data.readability.score > 0) {
    if (data.readability.score < 30) { addIssue('content', 'medium', `Content readability is ${data.readability.grade} (score ${data.readability.score}/100) — simplify language`, 10); }
    if (data.readability.avgSentenceLen > 25) { addIssue('content', 'low', `Average sentence length ${data.readability.avgSentenceLen} words — keep under 20 for readability`, 5); }
  }
  if (data.paragraphCount != null && data.paragraphCount < 3 && wc > 100) {
    addIssue('content', 'low', `Only ${data.paragraphCount} paragraphs — break content into shorter paragraphs`, 5);
  }
  if (data.longParagraphs && data.longParagraphs.overLength > 0) {
    addIssue('content', 'low', `${data.longParagraphs.overLength} paragraph(s) exceed 120 words (longest: ${data.longParagraphs.longestWords}) — break into shorter paragraphs`, 5);
  }
  if (data.subheadingDistribution && data.subheadingDistribution.longBlocksWithoutHeadings > 0) {
    addIssue('content', 'medium', `${data.subheadingDistribution.longBlocksWithoutHeadings} text block(s) over 300 words without subheadings — add H2/H3 to break up content`, 8);
  }
  if (data.codeToTextRatio != null && data.codeToTextRatio < 10) {
    addIssue('content', 'medium', `Low code-to-text ratio (${data.codeToTextRatio}%) — page is mostly code/markup with little visible content`, 8);
  } else if (data.codeToTextRatio != null && data.codeToTextRatio < 20) {
    addIssue('content', 'low', `Code-to-text ratio is ${data.codeToTextRatio}% — aim for 25-70% text content`, 4);
  }
  // Round 7: sentence length (Yoast readability)
  if (data.sentenceLengthStats && data.sentenceLengthStats.longPercent > 30) {
    addIssue('content', 'medium', `${data.sentenceLengthStats.longPercent}% of sentences are over 20 words (${data.sentenceLengthStats.longCount} of ${data.sentenceLengthStats.total}) — shorten for readability`, 8);
  } else if (data.sentenceLengthStats && data.sentenceLengthStats.longPercent > 20) {
    addIssue('content', 'low', `${data.sentenceLengthStats.longPercent}% of sentences exceed 20 words — aim for under 20%`, 4);
  }
  // Round 7: plaintext emails (SEO Site Checkup — UX/spam risk)
  if (data.plaintextEmails && data.plaintextEmails.length > 0) {
    addIssue('content', 'low', `${data.plaintextEmails.length} plaintext email(s) exposed in page content — use contact forms or obfuscation to prevent spam`, 3);
  }
  // Yoast readability: consecutive sentences starting with same word
  if (data.consecutiveSentences && data.consecutiveSentences.count >= 3) {
    addIssue('content', 'low', `${data.consecutiveSentences.count} consecutive sentences start with "${data.consecutiveSentences.word}" — vary sentence openings for better readability`, 5);
  }
  // Round 8: Empty heading tags (Screaming Frog: content issues)
  if (data.emptyHeadings > 0) { addIssue('content', 'low', `${data.emptyHeadings} empty heading tag(s) — headings should contain descriptive text`, Math.min(data.emptyHeadings * 2, 8)); }
  // Round 9: H1 contains only image alt text (Screaming Frog: H1 > Alt Text in H1)
  if (data.h1OnlyImageAlt) { addIssue('content', 'low', 'H1 heading contains only an image — H1 text comes from alt attribute, not visible text (Screaming Frog)', 5); }
  // Round 9: H2 headings over 70 characters (Screaming Frog: H2 > Over 70 Characters)
  if (data.longH2Count > 0) { addIssue('content', 'low', `${data.longH2Count} H2 heading(s) exceed 70 characters — keep subheadings concise for readability (Screaming Frog)`, Math.min(data.longH2Count * 2, 6)); }
  // Round 10: ALL CAPS headings (readability / Yoast)
  if (data.allCapsHeadings > 0) { addIssue('content', 'low', `${data.allCapsHeadings} heading(s) in ALL CAPS — use sentence case for better readability`, Math.min(data.allCapsHeadings * 2, 6)); }
  // Round 10: Content freshness — stale content (Yoast Premium)
  if (data.contentFreshnessYears != null && data.contentFreshnessYears > 2) { addIssue('content', 'low', `Content appears ${data.contentFreshnessYears} years old — consider updating for freshness signals (Yoast)`, 4); }
  if (!data.schemaMarkup) { addIssue('technical', 'medium', 'No JSON-LD schema markup detected', 15); }
  if (data.urlAnalysis && data.urlAnalysis.issues.length > 0) {
    data.urlAnalysis.issues.forEach(iss => { addIssue('technical', 'low', iss, 5); });
  }
  if (data.pageSizeKB > 500) { addIssue('technical', 'medium', `Page HTML is ${data.pageSizeKB}KB — large pages load slowly`, 10); }
  else if (data.pageSizeKB > 200) { addIssue('technical', 'low', `Page HTML is ${data.pageSizeKB}KB — consider optimizing`, 5); }
  if (!data.viewportMeta) { addIssue('technical', 'medium', 'No viewport meta tag — page may not be mobile-friendly', 12); }
  if (data.viewportZoomDisabled) { addIssue('technical', 'medium', 'Viewport disables zoom (user-scalable=no or max-scale<5) — harms accessibility and mobile SEO', 10); }
  if (!data.langTag) { addIssue('technical', 'low', 'No lang attribute on <html> tag — helps search engines and screen readers', 5); }
  if (data.selfLinks > 0) { addIssue('technical', 'low', `Page has ${data.selfLinks} self-referencing link${data.selfLinks > 1 ? 's' : ''} — links pointing to this same page`, 3); }
  // Round 7: new technical checks
  if (data.hasFavicon === false) { addIssue('technical', 'low', 'No favicon detected — favicons improve brand recognition and UX in browser tabs', 4); }
  if (data.hasCharset === false) { addIssue('technical', 'medium', 'No charset declaration — browsers may display characters incorrectly. Add <meta charset="utf-8">', 8); }
  if (data.hasDoctype === false) { addIssue('technical', 'medium', 'Missing <!DOCTYPE html> declaration — may trigger browser quirks mode', 8); }
  if (data.deprecatedTagsFound && data.deprecatedTagsFound.length > 0) { addIssue('technical', 'low', `Deprecated HTML tags found: <${data.deprecatedTagsFound.join('>, <')}> — use modern CSS/HTML5 instead`, Math.min(data.deprecatedTagsFound.length * 3, 10)); }
  if (data.hasMetaRefresh) { addIssue('technical', 'medium', 'Page uses <meta http-equiv="refresh"> — bad for UX and SEO, use server-side redirects instead', 10); }
  if (data.unsafeCrossOriginLinks > 0) { addIssue('technical', 'low', `${data.unsafeCrossOriginLinks} link(s) with target="_blank" missing rel="noopener" — security and performance risk`, Math.min(data.unsafeCrossOriginLinks * 2, 8)); }
  if (data.hasMixedContent) { addIssue('technical', 'high', `Mixed content: ${(data.mixedContentItems || []).length} HTTP resource(s) loaded on HTTPS page — browsers may block these`, 15); }
  if (data.pluginElements > 0) { addIssue('technical', 'medium', `Page uses ${data.pluginElements} plugin element(s) (<embed>/<object>/<applet>) — not supported on mobile, bad for SEO`, 10); }
  if (data.localhostLinks > 0) { addIssue('technical', 'high', `${data.localhostLinks} link(s) pointing to localhost/127.0.0.1 — development links left in production (Screaming Frog)`, 20); }
  // Round 8: Canonical URL validation (Lighthouse, Sitebulb)
  if (!data.canonicalUrl) { addIssue('technical', 'medium', 'Missing canonical URL — may cause duplicate content issues (Lighthouse)', 10); }
  else {
    if (data.canonicalOutsideHead) { addIssue('technical', 'high', 'Canonical tag found outside <head> — must be inside <head> for search engines (Sitebulb)', 15); }
    if (data.canonicalCount > 1) { addIssue('technical', 'medium', `Multiple canonical tags found (${data.canonicalCount}) — only one allowed per page (Lighthouse)`, 10); }
    if (data.canonicalIsRelative) { addIssue('technical', 'medium', 'Canonical URL is relative — use an absolute URL for reliable indexing (Sitebulb)', 8); }
    if (data.canonicalPointsToHttp) { addIssue('technical', 'medium', 'Canonical URL uses HTTP but page is HTTPS — canonical should match page protocol (Sitebulb)', 8); }
  }
  // Round 8: HTTP status code (Lighthouse: "Page has unsuccessful HTTP status code")
  if (data.httpStatusCode && data.httpStatusCode >= 400) { addIssue('technical', 'high', `Page returned HTTP ${data.httpStatusCode} — search engines may not index this page (Lighthouse)`, 20); }
  // Round 8: Slow TTFB / server response (SEO Site Checkup)
  if (data.responseTimeMs > 3000) { addIssue('technical', 'medium', `Slow server response (${(data.responseTimeMs / 1000).toFixed(1)}s TTFB) — aim for under 1s for best SEO`, 8); }
  else if (data.responseTimeMs > 1500) { addIssue('technical', 'low', `Server response time ${(data.responseTimeMs / 1000).toFixed(1)}s — aim for under 1s`, 4); }
  // Round 8: Soft 404 detection (Sitebulb: "Contains possible soft 404 phrases")
  if (data.isSoft404) { addIssue('technical', 'high', 'Page content suggests a soft 404 (error page returning HTTP 200) — return proper 404 or fix content (Sitebulb)', 20); }
  // Round 8: HTTPS forms posting to HTTP (Sitebulb: security)
  if (data.insecureFormActions > 0) { addIssue('technical', 'medium', `${data.insecureFormActions} form(s) on HTTPS page post to HTTP — security and trust risk (Sitebulb)`, 10); }
  // Round 8: Hreflang language code validation (Lighthouse)
  if (data.invalidHreflangCodes && data.invalidHreflangCodes.length > 0) { addIssue('technical', 'medium', `Invalid hreflang language code(s): ${data.invalidHreflangCodes.join(', ')} — use valid ISO 639-1 codes (Lighthouse)`, 8); }
  // Round 9: Canonical contains fragment URL (Screaming Frog: Canonicals > Contains Fragment URL)
  if (data.canonicalHasFragment) { addIssue('technical', 'medium', 'Canonical URL contains a fragment (#) — canonical URLs should not include URL fragments (Screaming Frog)', 10); }
  // Round 9: Robots meta outside <head> (Screaming Frog: Directives > Outside <head>)
  if (data.robotsMetaOutsideHead) { addIssue('technical', 'high', 'Meta robots tag found outside <head> — must be inside <head> for search engines to recognize it (Screaming Frog)', 15); }
  // Round 9: Protocol-relative resource links (Screaming Frog: Security > Protocol-Relative Resource Links)
  if (data.protocolRelativeLinks > 0) { addIssue('technical', 'low', `${data.protocolRelativeLinks} resource(s) use protocol-relative URLs (//example.com) — use explicit https:// instead (Screaming Frog)`, Math.min(data.protocolRelativeLinks * 2, 8)); }
  // Round 9: Hreflang missing self-reference (Screaming Frog: Hreflang > Missing Self Reference)
  if (data.hreflangMissingSelf) { addIssue('technical', 'medium', 'Hreflang annotations missing self-referencing entry — every page should include itself in its hreflang set (Screaming Frog)', 8); }
  // Round 9: Hreflang missing x-default (Screaming Frog: Hreflang > Missing X-Default)
  if (data.hreflangMissingXDefault) { addIssue('technical', 'low', 'Hreflang annotations missing x-default — add x-default for users whose language does not match any hreflang entry (Screaming Frog)', 5); }
  // Round 10: X-Robots-Tag HTTP header (Google Search Central, Bing Webmaster)
  if (data.xRobotsTag && /noindex/i.test(data.xRobotsTag)) { addIssue('technical', 'high', 'X-Robots-Tag HTTP header contains noindex — page will NOT appear in search results (Google Search Central)', 25); }
  if (data.xRobotsTag && /nofollow/i.test(data.xRobotsTag)) { addIssue('technical', 'medium', 'X-Robots-Tag HTTP header contains nofollow — links on this page won\u0027t pass equity (Google Search Central)', 10); }
  // Round 10: Invalid elements in <head> (Google Search Central — Google stops parsing <head> after these)
  if (data.invalidHeadElements && data.invalidHeadElements.length > 0) { addIssue('technical', 'high', `Invalid element(s) in <head>: <${data.invalidHeadElements.join('>, <')}> — Google stops parsing <head> after encountering these (Google Search Central)`, 15); }
  // Round 10: Googlebot-specific directives (Google Special Tags)
  if (data.googlebotMeta && /noindex/i.test(data.googlebotMeta)) { addIssue('technical', 'high', 'Googlebot-specific meta tag contains noindex — page hidden from Google specifically', 20); }
  // Round 10: Missing response compression (performance)
  if (data.hasCompression === false) { addIssue('technical', 'low', 'Response not compressed (no gzip/br/deflate) — enable compression for faster page delivery', 3); }
  // Round 10: Security headers (Screaming Frog Security category)
  if (data.hasHSTS === false && data.urlAnalysis && data.urlAnalysis.isHttps) { addIssue('technical', 'low', 'Missing Strict-Transport-Security (HSTS) header — tells browsers to always use HTTPS (Screaming Frog)', 3); }
  if (data.hasXContentTypeOptions === false) { addIssue('technical', 'low', 'Missing X-Content-Type-Options header — add "nosniff" to prevent MIME-type sniffing (Screaming Frog)', 3); }
  if (data.hasCSP === false) { addIssue('technical', 'low', 'Missing Content-Security-Policy header — helps prevent XSS and data injection attacks (Screaming Frog)', 2); }
  if (data.hasReferrerPolicy === false) { addIssue('technical', 'low', 'Missing Referrer-Policy header — controls referrer information sent with requests (Screaming Frog)', 2); }
  // Round 10: Performance bloat checks (Lighthouse, web.dev)
  if (data.inlineCSSBytes > 10000) { addIssue('technical', 'low', `${Math.round(data.inlineCSSBytes / 1024)}KB of inline CSS — externalize stylesheets for browser caching`, 4); }
  if (data.inlineJSBytes > 50000) { addIssue('technical', 'low', `${Math.round(data.inlineJSBytes / 1024)}KB of inline JavaScript — externalize scripts for caching and performance`, 4); }
  if (data.iframeCount > 3) { addIssue('technical', 'low', `${data.iframeCount} <iframe> elements — excessive iframes impact page performance and crawlability`, 4); }
  if (data.renderBlockingScripts > 0) { addIssue('technical', 'low', `${data.renderBlockingScripts} render-blocking script(s) in <head> without async/defer — delays page rendering (Lighthouse)`, Math.min(data.renderBlockingScripts * 2, 6)); }
  if (data.dataURIImages > 0) { addIssue('technical', 'low', `${data.dataURIImages} image(s) use data: URIs (base64) — bloats HTML, use external image files`, Math.min(data.dataURIImages * 2, 6)); }

  // LINKS & IMAGES (15%)
  const il = Number(data.internalLinks) || 0;
  const el = Number(data.externalLinks) || 0;
  const tl = Number(data.totalLinks) || (il + el);
  if (il === 0) { addIssue('linksImages', 'medium', 'No internal links — connect this page to your site', 20); }
  else if (il < 3) { addIssue('linksImages', 'low', `Only ${il} internal link${il > 1 ? 's' : ''} — add more for better site structure`, 8); }
  if (el === 0 && wc > 300) { addIssue('linksImages', 'low', 'No external links — linking to authoritative sources adds credibility', 8); }
  else if (el > 0 && data.followedExternalCount === 0 && data.nofollowExternalCount > 0) {
    addIssue('linksImages', 'low', `All ${data.nofollowExternalCount} external link(s) are nofollow — have at least one followed link to a trusted source`, 5);
  }
  if (data.genericLinkCount > 0) { addIssue('linksImages', 'low', `${data.genericLinkCount} link(s) use generic anchor text ("click here", "learn more", etc.) — use descriptive text`, Math.min(data.genericLinkCount * 2, 8)); }
  if (tl > 200) { addIssue('linksImages', 'medium', `Page has ${tl} total links — excessive links dilute link value (keep under 200)`, 10); }
  else if (tl > 100) { addIssue('linksImages', 'low', `Page has ${tl} total links — consider reducing for better crawl efficiency`, 4); }
  const imgC = Number(data.imageCount) || 0;
  const imgA = Number(data.imagesWithAlt) || 0;
  if (imgC > 0 && imgA < imgC) {
    const missing = imgC - imgA;
    const rate = Math.round((missing / imgC) * 100);
    const sev = rate > 50 ? 'high' : rate > 25 ? 'medium' : 'low';
    const penalty = Math.min(rate / 2, 30);
    addIssue('linksImages', sev, `${missing} of ${imgC} images missing alt text (${rate}%)`, penalty);
  }
  if (imgC === 0 && wc > 500) { addIssue('linksImages', 'low', 'No images — visual content improves engagement and dwell time', 8); }
  // Image dimension attributes (Screaming Frog: CLS prevention)
  if (data.imagesMissingDimensions > 0 && imgC > 0) {
    const dimRate = Math.round((data.imagesMissingDimensions / imgC) * 100);
    const sev = dimRate > 50 ? 'medium' : 'low';
    addIssue('linksImages', sev, `${data.imagesMissingDimensions} of ${imgC} images missing width/height attributes — causes Cumulative Layout Shift (CLS)`, Math.min(dimRate / 5, 8));
  }
  // Image filename quality check (Ahrefs/Backlinko)
  if (data.imageFilenames && data.imageFilenames.generic > 0) {
    const genRate = Math.round((data.imageFilenames.generic / data.imageFilenames.total) * 100);
    const sev = genRate > 50 ? 'medium' : 'low';
    addIssue('linksImages', sev, `${data.imageFilenames.generic} of ${data.imageFilenames.total} image filenames are generic (e.g. IMG_xxx.jpg) — use descriptive names`, Math.min(genRate / 5, 10));
  }
  // Round 7: modern image formats (SEO Site Checkup)
  if (data.legacyFormats > 0 && data.modernFormats === 0 && data.imageCount > 0) {
    addIssue('linksImages', 'low', `All ${data.legacyFormats} images use legacy formats (JPEG/PNG/GIF) — serve WebP or AVIF for faster loading`, 5);
  }
  // Round 8: Empty anchor text links (Sitebulb: "Has an internal link with no anchor text")
  if (data.emptyAnchorLinks > 0) { addIssue('linksImages', 'medium', `${data.emptyAnchorLinks} link(s) have no anchor text — add descriptive text for SEO and accessibility (Sitebulb)`, Math.min(data.emptyAnchorLinks * 3, 10)); }
  // Round 8: Image-links missing alt text (Sitebulb: "Has an anchored image with no alt text")
  if (data.imageLinksWithoutAlt > 0) { addIssue('linksImages', 'medium', `${data.imageLinksWithoutAlt} linked image(s) missing alt text — images used as links need alt text for accessibility and SEO (Sitebulb)`, Math.min(data.imageLinksWithoutAlt * 3, 10)); }
  // Round 8: Alt text too long (Moz: keep alt under 125 chars)
  if (data.longAltTextCount > 0) { addIssue('linksImages', 'low', `${data.longAltTextCount} image(s) have alt text over 125 characters — keep alt text concise and descriptive (Moz)`, Math.min(data.longAltTextCount * 2, 6)); }
  // Round 9: Images missing alt attribute entirely — distinct from empty alt="" (Screaming Frog: Images > Missing Alt Attribute)
  if (data.imagesMissingAltAttribute > 0) { addIssue('linksImages', 'high', `${data.imagesMissingAltAttribute} image(s) have no alt attribute at all — every <img> must have an alt attribute (Screaming Frog)`, Math.min(data.imagesMissingAltAttribute * 3, 15)); }
  // Round 9: Internal links with rel="nofollow" (Screaming Frog: Links > Internal Nofollow Outlinks)
  if (data.internalNofollowLinks > 0) { addIssue('linksImages', 'medium', `${data.internalNofollowLinks} internal link(s) use rel="nofollow" — this wastes internal link equity (Screaming Frog)`, Math.min(data.internalNofollowLinks * 3, 10)); }
  // Round 10: Duplicate internal links (Screaming Frog / Sitebulb)
  if (data.duplicateInternalLinks > 5) { addIssue('linksImages', 'low', `${data.duplicateInternalLinks} duplicate internal links (same URL linked multiple times) — consolidate for cleaner link structure`, Math.min(data.duplicateInternalLinks, 6)); }
  // Round 10: Lazy-loading on first/LCP image (Lighthouse)
  if (data.firstImgLazyLoaded) { addIssue('linksImages', 'medium', 'First image has loading="lazy" — this delays LCP; remove lazy-loading from above-the-fold images (Lighthouse)', 8); }
  // Round 7: OG completeness
  if (!data.ogType) { addIssue('metaTags', 'low', 'Missing og:type tag — specify content type (website, article, product)', 4); }
  if (!data.ogUrl) { addIssue('metaTags', 'low', 'Missing og:url tag — specify the canonical URL for social sharing', 3); }
  if (!data.ogSiteName) { addIssue('metaTags', 'low', 'Missing og:site_name tag — brand your social share cards', 2); }
  // Round 8: Missing Twitter card (social sharing)
  if (!data.twitterCard) { addIssue('metaTags', 'low', 'Missing Twitter card meta tags — tweets linking to this page will show a plain URL', 3); }

  // KEYWORDS (10%)
  if (data.keywords) {
    const kwList = (typeof data.keywords === 'string' ? data.keywords.split(',') : data.keywords).map(k => k.trim().toLowerCase()).filter(Boolean);
    kwList.forEach(kw => {
      const placements = checkKeywordPlacement(kw, data);
      if (placements.length === 0) {
        addIssue('keywords', 'high', `"${kw}" not found in title, meta, H1, URL, subheadings, or first 100 words`, 25);
      } else if (placements.length < 3) {
        const missing = ['title', 'h1', 'metaDescription', 'url', 'subheadings'].filter(p => !placements.includes(p));
        if (missing.length > 0) {
          addIssue('keywords', 'low', `"${kw}" missing from: ${missing.join(', ')}`, 5 * missing.length);
        }
      }
    });
    // Keyword stuffing detection
    if (data.keywordDensity && Array.isArray(data.keywordDensity)) {
      data.keywordDensity.forEach(kd => {
        if (kd.status === 'stuffing') {
          addIssue('keywords', 'high', `Keyword "${kd.keyword}" density is ${kd.density}% (${kd.count} times) — over-optimized, risk of penalty`, 20);
        }
      });
    }
    // Round 7: keyword in image alt text (Yoast)
    if (data.keywordInAltText && Array.isArray(data.keywordInAltText)) {
      data.keywordInAltText.forEach(ki => {
        if (!ki.found && data.imageCount > 0) {
          addIssue('keywords', 'low', `Keyword "${ki.keyword}" not found in any image alt text — add it to at least one relevant image`, 5);
        }
      });
    }
  }

  // ── ROUND 11: MEGA AUDIT — 50 new checks (Google Search Central, Lighthouse, Bing, W3C, Backlinko, Moz, Ahrefs, SE Ranking) ──
  // --- Technical: HTTP headers & security ---
  if (data.hasXFrameOptions === false) { addIssue('technical', 'low', 'Missing X-Frame-Options header — prevents clickjacking attacks (Screaming Frog Security)', 2); }
  if (data.xPoweredBy) { addIssue('technical', 'low', `X-Powered-By header exposes server technology ("${data.xPoweredBy}") — remove to reduce attack surface (SE Ranking)`, 3); }
  if (data.hasPermissionsPolicy === false) { addIssue('technical', 'low', 'Missing Permissions-Policy header — controls browser features access (SE Ranking Security)', 2); }
  if (data.canonicalViaHttpHeader && data.canonicalUrl && data.canonicalViaHttpHeader !== data.canonicalUrl) {
    addIssue('technical', 'medium', 'Canonical URL in HTTP Link header conflicts with HTML <link rel="canonical"> — use one method only (Google Search Central)', 8);
  }
  if (data.serverHeaderLeak) { addIssue('technical', 'low', `Server header exposes version info ("${data.serverHeaderLeak}") — hide version to reduce attack surface`, 2); }
  // --- Technical: HTML structure ---
  if (data.hasMultipleMain) { addIssue('technical', 'medium', `Multiple <main> elements found (${data.semanticElements?.main}) — only one <main> allowed per page (W3C HTML spec)`, 5); }
  if (data.nestedAnchorTags > 0) { addIssue('technical', 'medium', `${data.nestedAnchorTags} nested <a> tag(s) found — invalid HTML, confuses crawlers and screen readers (W3C)`, Math.min(data.nestedAnchorTags * 3, 8)); }
  if (data.sensitiveComments > 0) { addIssue('technical', 'medium', `${data.sensitiveComments} HTML comment(s) contain sensitive keywords (TODO/FIXME/password/api_key) — remove before production (SE Ranking)`, Math.min(data.sensitiveComments * 2, 8)); }
  if (data.langMismatch) { addIssue('technical', 'medium', 'Content-Language HTTP header conflicts with HTML lang attribute — these should match (W3C i18n)', 5); }
  if (data.metaGenerator) { addIssue('technical', 'low', `Meta generator tag exposes CMS/framework ("${data.metaGenerator.substring(0, 40)}") — remove to reduce fingerprinting (Bing Webmaster)`, 2); }
  if (data.canonicalHasQueryString) { addIssue('technical', 'medium', 'Canonical URL contains a query string — prefer clean canonical URLs without parameters (Google Search Central)', 5); }
  if (data.hasBaseTag) { addIssue('technical', 'low', '<base> tag found — affects all relative URLs; ensure this is intentional (Moz)', 3); }
  if (data.canonicalOgUrlMismatch) { addIssue('technical', 'low', 'Canonical URL and og:url point to different URLs — these should match for consistency (Moz)', 4); }
  if (data.sourceMapExposure > 0) { addIssue('technical', 'low', `${data.sourceMapExposure} inline script(s) expose source maps (sourceMappingURL) — remove in production`, 3); }
  if (data.debugStatements > 0) { addIssue('technical', 'low', `${data.debugStatements} console.log/debug statement(s) in inline scripts — remove for production (SE Ranking)`, Math.min(data.debugStatements, 4)); }
  if (data.httpInternalLinks > 0) { addIssue('technical', 'medium', `${data.httpInternalLinks} internal link(s) use HTTP while page is HTTPS — update to HTTPS for consistency (Screaming Frog)`, Math.min(data.httpInternalLinks * 2, 10)); }
  if (data.jsonLdValidity && data.jsonLdValidity.invalid > 0) { addIssue('technical', 'high', `${data.jsonLdValidity.invalid} JSON-LD block(s) contain invalid JSON — structured data will be ignored (Google Search Central)`, 12); }
  // --- Meta Tags: snippets & social ---
  if (data.hasNosnippet) { addIssue('metaTags', 'medium', 'Page has nosnippet directive — Google will NOT show a snippet for this page in search results (Google Search Central)', 8); }
  if (!data.themeColor) { addIssue('metaTags', 'low', 'Missing theme-color meta tag — improves mobile browser chrome appearance (Lighthouse)', 2); }
  // --- Content: quality signals ---
  if (data.semanticElementCount === 0 && wc > 200) { addIssue('content', 'low', 'No HTML5 semantic elements (main, article, section, nav, aside) — use semantic HTML for better crawlability (Backlinko)', 5); }
  if (data.emptyParagraphs > 3) { addIssue('content', 'low', `${data.emptyParagraphs} empty <p> tag(s) — remove empty paragraphs to clean up DOM (Moz)`, Math.min(data.emptyParagraphs, 4)); }
  if (data.hiddenTextElements > 0) { addIssue('content', 'high', `${data.hiddenTextElements} element(s) with display:none/visibility:hidden contain substantial text — potential cloaking or hidden content (Google Spam Policies)`, Math.min(data.hiddenTextElements * 5, 15)); }
  if (data.tablesWithoutHeaders > 0) { addIssue('content', 'low', `${data.tablesWithoutHeaders} table(s) lack <th> header elements — affects accessibility and content structure (W3C WCAG)`, Math.min(data.tablesWithoutHeaders * 2, 6)); }
  if (data.strongTagCount > 15) { addIssue('content', 'low', `${data.strongTagCount} <strong>/<b> tags on page — excessive bold text may appear as keyword emphasis spam (Moz)`, Math.min(Math.floor((data.strongTagCount - 15) / 3), 5)); }
  if (data.linkToContentRatio > 60) { addIssue('content', 'medium', `Link text makes up ${data.linkToContentRatio}% of visible content — page may be perceived as a link farm / doorway page (Google Spam Policies)`, 8); }
  if (data.wordRepetition && data.wordRepetition.length > 0) {
    const top = data.wordRepetition[0];
    addIssue('content', 'low', `Word "${top.word}" repeated ${top.count} times (${top.percent}% of content) — diversify vocabulary (Yoast)`, Math.min(data.wordRepetition.length * 2, 6));
  }
  // --- Links & Images: advanced quality ---
  if (data.shortAnchorLinks > 0) { addIssue('linksImages', 'low', `${data.shortAnchorLinks} link(s) have very short anchor text (1-2 chars) — use descriptive anchor text (Google Search Central)`, Math.min(data.shortAnchorLinks * 2, 6)); }
  if (data.longAnchorLinks > 0) { addIssue('linksImages', 'low', `${data.longAnchorLinks} link(s) have excessively long anchor text (>100 chars) — keep anchor text concise (Google Search Central)`, Math.min(data.longAnchorLinks * 2, 6)); }
  if (data.jsVoidLinks > 0) { addIssue('linksImages', 'medium', `${data.jsVoidLinks} link(s) use javascript: void — not crawlable by search engines (Google Search Central)`, Math.min(data.jsVoidLinks * 3, 10)); }
  if (data.urlAsAnchorText > 0) { addIssue('linksImages', 'low', `${data.urlAsAnchorText} link(s) use raw URLs as anchor text — use descriptive text instead (Lighthouse, Backlinko)`, Math.min(data.urlAsAnchorText * 2, 6)); }
  if (data.malformedTelLinks > 0) { addIssue('linksImages', 'low', `${data.malformedTelLinks} tel: link(s) may have invalid format — use E.164 format (+CountryCode…) (W3C)`, Math.min(data.malformedTelLinks * 2, 4)); }
  if (data.svgWithoutTitle > 0) { addIssue('linksImages', 'low', `${data.svgWithoutTitle} inline SVG(s) missing <title> or aria-label — add for accessibility (Google Images, W3C WCAG)`, Math.min(data.svgWithoutTitle * 2, 6)); }
  if (data.pictureElements === 0 && data.srcsetImages === 0 && imgC > 5) { addIssue('linksImages', 'low', `No responsive images (<picture>/srcset) among ${imgC} images — serve different sizes for different devices (Google Images)`, 3); }
  if (data.oversizedImages > 0) { addIssue('linksImages', 'low', `${data.oversizedImages} image(s) have dimension attributes >2000px — serve appropriately sized images (Lighthouse)`, Math.min(data.oversizedImages * 2, 6)); }
  if (data.longImageFilenames > 0) { addIssue('linksImages', 'low', `${data.longImageFilenames} image filename(s) exceed 100 characters — use shorter, descriptive filenames (Moz)`, Math.min(data.longImageFilenames * 2, 4)); }
  // --- Schema completeness ---
  if (data.articleSchemaComplete) {
    const a = data.articleSchemaComplete;
    const missing = [];
    if (!a.hasHeadline) missing.push('headline');
    if (!a.hasAuthor) missing.push('author');
    if (!a.hasDatePublished) missing.push('datePublished');
    if (!a.hasImage) missing.push('image');
    if (!a.hasPublisher) missing.push('publisher');
    if (missing.length > 0) { addIssue('technical', 'medium', `Article schema missing fields: ${missing.join(', ')} — complete for rich result eligibility (Google Search Central)`, Math.min(missing.length * 3, 10)); }
  }
  // --- Content: trust & structure ---
  if (data.hasBreadcrumbNav === false && wc > 300) { addIssue('content', 'low', 'No breadcrumb navigation detected — add breadcrumbs for better UX and SERP presentation (Google, Ahrefs)', 3); }
  if (data.hasContactInfo && data.hasContactInfo.score === 0 && wc > 500) { addIssue('content', 'low', 'No contact/trust signals found (phone, address, privacy link) — affects E-E-A-T trust signals (Google)', 3); }
  if (!data.authorMeta && !data.datePublished && wc > 500) { addIssue('content', 'low', 'No author or publication date detected — affects E-E-A-T expertise signals (Google)', 3); }

  // ── ROUND 12: MEGA AUDIT II — 50 new checks (Lighthouse, web.dev, WCAG, Ahrefs, Google Product Schema, CLS) ──
  // --- Performance & CLS Prevention ---
  if (data.documentWriteUsage > 0) { addIssue('technical', 'high', `${data.documentWriteUsage} document.write() call(s) in inline scripts — extremely slow, blocks rendering (Lighthouse)`, Math.min(data.documentWriteUsage * 4, 12)); }
  if (data.cssImportStatements > 0) { addIssue('technical', 'medium', `${data.cssImportStatements} CSS @import statement(s) — serializes CSS downloads, blocks rendering (Lighthouse)`, Math.min(data.cssImportStatements * 3, 8)); }
  if (data.fontDisplayMissing > 0) { addIssue('technical', 'low', `${data.fontDisplayMissing} @font-face rule(s) without font-display — causes flash of invisible/unstyled text (web.dev, Lighthouse)`, Math.min(data.fontDisplayMissing * 2, 6)); }
  if (data.fontPreloadWithoutCrossorigin > 0) { addIssue('technical', 'low', `${data.fontPreloadWithoutCrossorigin} font preload(s) missing crossorigin attribute — font will fail to load (web.dev)`, Math.min(data.fontPreloadWithoutCrossorigin * 2, 6)); }
  if (data.thirdPartyScriptCount > 10) { addIssue('technical', 'medium', `${data.thirdPartyScriptCount} third-party scripts loaded — excessive third-party code slows page load`, Math.min(Math.floor((data.thirdPartyScriptCount - 10) / 3), 6)); }
  if (data.externalCSSCount > 8) { addIssue('technical', 'low', `${data.externalCSSCount} external CSS files — consolidate to reduce HTTP requests (Lighthouse)`, Math.min(data.externalCSSCount - 8, 4)); }
  if (data.externalJSCount > 10) { addIssue('technical', 'low', `${data.externalJSCount} external JS files — consolidate to reduce HTTP requests (Lighthouse)`, Math.min(data.externalJSCount - 10, 4)); }
  if (data.bodyInlineStyles > 0) { addIssue('technical', 'low', `${data.bodyInlineStyles} <style> block(s) in <body> — move styles to <head> to prevent reflow (Lighthouse)`, Math.min(data.bodyInlineStyles * 2, 6)); }
  if (data.videoWithoutPoster > 0) { addIssue('linksImages', 'low', `${data.videoWithoutPoster} <video> element(s) without poster attribute — no preview image, causes CLS (web.dev)`, Math.min(data.videoWithoutPoster * 2, 6)); }
  // --- Accessibility-SEO Overlap (WCAG, Lighthouse) ---
  if (data.hasSkipLink === false && wc > 300) { addIssue('technical', 'low', 'No skip-to-content / skip navigation link — improves keyboard accessibility (WCAG 2.4.1, Lighthouse)', 3); }
  if (data.ariaLandmarks && data.ariaLandmarks.missing.length > 0 && wc > 200) { addIssue('technical', 'low', `Missing ARIA landmarks: ${data.ariaLandmarks.missing.join(', ')} — add for accessibility and screen reader navigation (WCAG, Lighthouse)`, Math.min(data.ariaLandmarks.missing.length * 2, 6)); }
  if (data.formWithoutLabels > 0) { addIssue('technical', 'low', `${data.formWithoutLabels} form input(s) without associated <label> — affects accessibility and SEO (Lighthouse)`, Math.min(data.formWithoutLabels * 2, 6)); }
  if (data.tabindexPositive > 0) { addIssue('technical', 'low', `${data.tabindexPositive} element(s) with tabindex > 0 — disrupts natural tab order, bad practice (Lighthouse)`, Math.min(data.tabindexPositive * 2, 4)); }
  if (data.emptyButtons > 0) { addIssue('technical', 'low', `${data.emptyButtons} <button> element(s) without accessible text — add text or aria-label (Lighthouse)`, Math.min(data.emptyButtons * 2, 6)); }
  if (data.duplicateIds > 0) { addIssue('technical', 'medium', `${data.duplicateIds} duplicate id attribute(s) — invalid HTML, breaks accessibility and JS targeting (W3C, Lighthouse)`, Math.min(data.duplicateIds * 2, 8)); }
  if (data.autofocusElements > 0) { addIssue('technical', 'low', `${data.autofocusElements} element(s) use autofocus — can disorient screen reader users (Lighthouse)`, Math.min(data.autofocusElements * 2, 4)); }
  if (data.videoWithoutCaptions > 0) { addIssue('linksImages', 'low', `${data.videoWithoutCaptions} <video> element(s) without <track> captions — hurts accessibility (WCAG 1.2.2)`, Math.min(data.videoWithoutCaptions * 2, 6)); }
  // --- E-Commerce & Product Schema (Google Product Structured Data) ---
  if (data.productSchemaComplete) {
    const p = data.productSchemaComplete;
    const pmissing = [];
    if (!p.hasName) pmissing.push('name');
    if (!p.hasOffers) pmissing.push('offers/price');
    if (!p.hasImage) pmissing.push('image');
    if (!p.hasBrand) pmissing.push('brand');
    if (!p.hasDescription) pmissing.push('description');
    if (!p.hasSku && !p.hasGtin) pmissing.push('sku/gtin');
    if (pmissing.length > 0) { addIssue('technical', 'medium', `Product schema missing: ${pmissing.join(', ')} — add for rich result eligibility (Google Product Snippet)`, Math.min(pmissing.length * 2, 10)); }
  }
  if (data.hasFAQSchema) { /* positive signal — no penalty */ }
  if (data.breadcrumbSchemaComplete) {
    const bc = data.breadcrumbSchemaComplete;
    if (bc.hasSchema && bc.missingFields.length > 0) { addIssue('technical', 'low', `Breadcrumb schema missing: ${bc.missingFields.join(', ')} — complete for rich breadcrumbs (Google)`, Math.min(bc.missingFields.length * 2, 6)); }
  }
  if (data.hasOrganizationSchema === false && data.schemaMarkup === 'yes') { addIssue('technical', 'low', 'No Organization schema found — add for brand knowledge panel eligibility (Google)', 2); }
  // --- Content Patterns ---
  if (data.outdatedCopyright && data.outdatedCopyright.yearsOld > 1) { addIssue('content', 'low', `Copyright year is ${data.outdatedCopyright.year} (${data.outdatedCopyright.yearsOld} years old) — update to current year for freshness signals`, 3); }
  if (data.stockPhotoFilenames > 0) { addIssue('linksImages', 'low', `${data.stockPhotoFilenames} image(s) appear to be unmodified stock photos (shutterstock/istock/pexels/pixabay filename) — use custom images for originality (Ahrefs)`, Math.min(data.stockPhotoFilenames * 2, 6)); }
  if (data.hasListElements === false && wc > 500) { addIssue('content', 'low', 'No list elements (<ul>/<ol>) in long content — add lists for readability and featured snippet eligibility (Yoast)', 3); }
  if (data.excessiveExclamations > 3) { addIssue('content', 'low', `${data.excessiveExclamations} exclamation marks in content — tone down for professional credibility`, Math.min(data.excessiveExclamations - 3, 4)); }
  if (data.fragmentOnlyLinks > 5) { addIssue('linksImages', 'low', `${data.fragmentOnlyLinks} fragment-only links (#anchor) — ensure target IDs exist on page`, Math.min(data.fragmentOnlyLinks, 4)); }
  // --- URL & Crawlability ---
  if (data.urlDepth > 4) { addIssue('technical', 'low', `URL depth is ${data.urlDepth} levels — keep URL structure flat (3-4 levels max) for better crawlability (Ahrefs)`, Math.min(data.urlDepth - 4, 4)); }
  if (data.hashBangUrl) { addIssue('technical', 'medium', 'URL uses deprecated #! (hash-bang) AJAX crawling scheme — migrate to History API pushState (Google deprecated)', 8); }
  if (data.trailingSlashInconsistency > 3) { addIssue('technical', 'low', `${data.trailingSlashInconsistency} internal links have inconsistent trailing slashes — normalize for canonical consistency`, Math.min(data.trailingSlashInconsistency, 4)); }
  // --- Advanced Meta Robots Directives ---
  if (data.hasMaxImagePreview) { /* informational — no penalty */ }
  if (data.hasMaxSnippet) { /* informational — no penalty */ }
  if (data.hasNotranslate) { addIssue('metaTags', 'low', 'Page has notranslate directive — Google will not offer translation for this page', 2); }
  if (data.hasNoimageindex) { addIssue('metaTags', 'low', 'Page has noimageindex directive — images on this page will not be indexed by Google', 3); }
  if (data.hasUnavailableAfter) {
    const uaDate = new Date(data.unavailableAfterDate);
    if (!isNaN(uaDate.getTime()) && uaDate < new Date()) { addIssue('metaTags', 'high', `unavailable_after date (${data.unavailableAfterDate}) has passed — page will be removed from index (Google)`, 20); }
  }
  // --- Social & Trust ---
  if (data.hasAboutLink === false && wc > 300) { addIssue('content', 'low', 'No "About" page link detected — add for E-E-A-T trust signals (Google Quality Rater Guidelines)', 2); }
  if (data.socialProfileLinks === 0 && wc > 300) { addIssue('content', 'low', 'No social media profile links — add for E-E-A-T authority signals (Ahrefs)', 2); }
  if (data.hasReturnPolicyLink === false && data.productSchemaComplete) { addIssue('content', 'low', 'No return/refund policy link detected — essential for e-commerce trust (Google Shopping)', 3); }
  if (data.hasTermsLink === false && wc > 300) { addIssue('content', 'low', 'No Terms of Service link detected — add for trust and compliance', 2); }
  if (data.hasCookieConsent === false && wc > 200) { addIssue('technical', 'low', 'No cookie consent / privacy banner detected — may be required by GDPR/CCPA regulations', 2); }
  // --- Performance resource hints ---
  if (data.dnsPrefetchWithoutPreconnect > 0) { addIssue('technical', 'low', `${data.dnsPrefetchWithoutPreconnect} dns-prefetch hint(s) without matching preconnect — preconnect is more effective (web.dev)`, Math.min(data.dnsPrefetchWithoutPreconnect, 3)); }
  if (data.prefetchHints > 0 && data.prerenderHints > 0) { /* positive signal — no penalty */ }
  // --- Misc technical ---
  if (data.hasNoscriptContent === false && data.externalJSCount > 3) { addIssue('technical', 'low', 'No <noscript> content — provide fallback for JavaScript-disabled users (Lighthouse)', 2); }
  if (data.externalCSSCount > 0 && data.inlineCriticalCSS === false && data.renderBlockingScripts > 0) { addIssue('technical', 'low', 'No critical CSS inlined — inline above-the-fold CSS for faster first paint (web.dev)', 3); }

  // ── ROUND 13: MEGA AUDIT III — 50 new scoring penalties (axe-core 4.10, Screaming Frog Accessibility/Validation, web.dev LCP/CLS, WCAG 2.2) ──
  // --- Accessibility-SEO (axe-core 4.10, Screaming Frog Accessibility) ---
  if (data.iframesWithoutTitle > 0) { addIssue('technical', 'medium', `${data.iframesWithoutTitle} <iframe>(s) missing title attribute — iframes need accessible names for screen readers (axe: frame-title, WCAG 4.1.2)`, Math.min(data.iframesWithoutTitle * 3, 8)); }
  if (data.audioAutoplay > 0) { addIssue('technical', 'medium', `${data.audioAutoplay} <audio> element(s) autoplay without controls — users must be able to stop audio (axe: no-autoplay-audio, WCAG 1.4.2)`, Math.min(data.audioAutoplay * 3, 8)); }
  if (data.inputImageWithoutAlt > 0) { addIssue('linksImages', 'medium', `${data.inputImageWithoutAlt} <input type="image"> element(s) missing alt text — image buttons need alt (axe: input-image-alt, WCAG 1.1.1)`, Math.min(data.inputImageWithoutAlt * 3, 8)); }
  if (data.selectWithoutLabel > 0) { addIssue('technical', 'low', `${data.selectWithoutLabel} <select>/<textarea> element(s) without associated label — add <label> for accessibility (axe: select-name)`, Math.min(data.selectWithoutLabel * 2, 6)); }
  if (data.duplicateAccesskeys > 0) { addIssue('technical', 'low', `${data.duplicateAccesskeys} duplicate accesskey value(s) — each accesskey must be unique (axe: accesskeys)`, Math.min(data.duplicateAccesskeys * 2, 4)); }
  if (data.roleImgWithoutAlt > 0) { addIssue('linksImages', 'medium', `${data.roleImgWithoutAlt} element(s) with role="img" missing accessible name — add alt or aria-label (axe: role-img-alt, WCAG 1.1.1)`, Math.min(data.roleImgWithoutAlt * 3, 8)); }
  if (data.nestedInteractive > 0) { addIssue('technical', 'medium', `${data.nestedInteractive} nested interactive element(s) (button in link or vice-versa) — confuses screen readers and causes focus issues (axe: nested-interactive)`, Math.min(data.nestedInteractive * 3, 8)); }
  if (data.areaWithoutAlt > 0) { addIssue('linksImages', 'medium', `${data.areaWithoutAlt} <area> element(s) in image map missing alt text — area elements need descriptive alt (axe: area-alt, WCAG 2.4.4)`, Math.min(data.areaWithoutAlt * 3, 8)); }
  if (data.invalidListStructure > 0) { addIssue('technical', 'low', `${data.invalidListStructure} list(s) with invalid structure — <ul>/<ol> must only directly contain <li> elements (axe: list)`, Math.min(data.invalidListStructure * 2, 6)); }
  if (data.focusableAriaHidden > 0) { addIssue('technical', 'medium', `${data.focusableAriaHidden} focusable element(s) inside aria-hidden container — hidden content must not be focusable (axe: aria-hidden-focus)`, Math.min(data.focusableAriaHidden * 3, 8)); }
  if (data.dlStructureViolations > 0) { addIssue('technical', 'low', `${data.dlStructureViolations} <dl> element(s) with invalid structure — <dl> must only contain <dt>, <dd>, and <div> (axe: definition-list)`, Math.min(data.dlStructureViolations * 2, 4)); }
  if (data.multipleNavWithoutLabel > 0) { addIssue('technical', 'low', `${data.multipleNavWithoutLabel} <nav> element(s) without aria-label — multiple nav landmarks need unique names (Screaming Frog Accessibility)`, Math.min(data.multipleNavWithoutLabel * 2, 4)); }
  if (data.objectWithoutFallback > 0) { addIssue('linksImages', 'low', `${data.objectWithoutFallback} <object> element(s) without fallback text — provide text alternative for embedded objects (axe: object-alt, WCAG 1.1.1)`, Math.min(data.objectWithoutFallback * 2, 6)); }
  // --- Performance & CLS (web.dev LCP/CLS, Lighthouse) ---
  if (data.allImagesLazy) { addIssue('linksImages', 'medium', 'All images have loading="lazy" — at least the first/hero image should be eager for faster LCP (web.dev LCP optimization)', 8); }
  if (data.preloadWithoutAs > 0) { addIssue('technical', 'medium', `${data.preloadWithoutAs} <link rel="preload"> tag(s) missing "as" attribute — browser cannot prioritize without knowing resource type (Lighthouse)`, Math.min(data.preloadWithoutAs * 3, 8)); }
  if (data.preconnectSameOrigin > 0) { addIssue('technical', 'low', `${data.preconnectSameOrigin} preconnect/dns-prefetch hint(s) to same origin — unnecessary, already connected (Lighthouse)`, Math.min(data.preconnectSameOrigin * 2, 4)); }
  if (data.inlineEventHandlers > 10) { addIssue('technical', 'low', `${data.inlineEventHandlers} inline event handler(s) (onclick, onmouseover, etc.) — use addEventListener for better CSP compatibility`, Math.min(Math.floor((data.inlineEventHandlers - 10) / 5), 4)); }
  if (data.htmlCommentCount > 20) { addIssue('technical', 'low', `${data.htmlCommentCount} HTML comments — excessive comments waste bandwidth and may leak info`, Math.min(Math.floor((data.htmlCommentCount - 20) / 5), 4)); }
  if (data.sriMissingOnCDN > 0 && data.sriMissingOnCDN <= 20) { addIssue('technical', 'low', `${data.sriMissingOnCDN} CDN script(s) without Subresource Integrity (SRI) — add integrity attribute for security (MDN, Lighthouse)`, Math.min(data.sriMissingOnCDN, 4)); }
  if (data.cacheControlNoStore) { addIssue('technical', 'low', 'Cache-Control: no-store — prevents browser/CDN caching entirely, impacts repeat visit performance (Lighthouse)', 3); }
  // --- Technical SEO (Screaming Frog, Google, Lighthouse) ---
  if (data.xUaCompatibleMeta) { addIssue('technical', 'low', 'X-UA-Compatible meta tag found — this IE-era tag is no longer needed, remove to clean up <head> (Microsoft)', 2); }
  if (data.metaKeywordsPresent) { addIssue('metaTags', 'low', 'Meta keywords tag present — deprecated by Google since 2009 and ignored by Bing; remove to reduce clutter (Google, Moz)', 2); }
  if (data.internalTargetBlank > 2) { addIssue('linksImages', 'low', `${data.internalTargetBlank} internal link(s) use target="_blank" — opening your own site in new tabs is a poor UX pattern`, Math.min(data.internalTargetBlank, 4)); }
  if (data.formWithoutAction > 0) { addIssue('technical', 'low', `${data.formWithoutAction} <form>(s) without action attribute — form submission target may be ambiguous`, Math.min(data.formWithoutAction * 2, 4)); }
  if (data.dirMissingForRTL) { addIssue('technical', 'medium', 'Page lang is RTL but missing dir="rtl" on <html> — text direction will display incorrectly (W3C i18n)', 8); }
  if (data.brokenBookmarks > 0) { addIssue('linksImages', 'low', `${data.brokenBookmarks} anchor link(s) (#id) target non-existent IDs on page — broken bookmark links (Screaming Frog: Broken Bookmark)`, Math.min(data.brokenBookmarks * 2, 6)); }
  if (data.imgAltMatchesFilename > 2) { addIssue('linksImages', 'low', `${data.imgAltMatchesFilename} image(s) have alt text matching their filename — write descriptive alt text instead (Moz, Semrush)`, Math.min(data.imgAltMatchesFilename * 2, 6)); }
  if (data.htmlLangInvalid) { addIssue('technical', 'medium', `HTML lang attribute "${data.langTag}" is not a valid ISO 639-1 language code — fix for search engines and screen readers (axe: html-lang-valid)`, 8); }
  // --- Content & Structure (Screaming Frog Validation, Lighthouse) ---
  if (data.blockquoteWithoutCite > 0) { addIssue('content', 'low', `${data.blockquoteWithoutCite} <blockquote>(s) without cite attribute — add source URL for semantic completeness (HTML5 spec)`, Math.min(data.blockquoteWithoutCite, 3)); }
  if (data.mainLandmarkEmpty) { addIssue('content', 'medium', '<main> element is empty or has minimal content — main landmark should contain the primary page content (W3C)', 8); }
  if (data.emptyListItems > 3) { addIssue('content', 'low', `${data.emptyListItems} empty <li> element(s) — remove empty list items to clean up DOM`, Math.min(data.emptyListItems, 4)); }
  if (data.excessiveDomDepth > 15) { addIssue('technical', 'low', `DOM nesting depth is ${data.excessiveDomDepth} levels — keep under 15 for rendering performance (Lighthouse: Avoid excessive DOM depth)`, Math.min(data.excessiveDomDepth - 15, 5)); }
  if (data.totalDomElements > 1500) { addIssue('technical', 'medium', `Page has ${data.totalDomElements} DOM elements — large DOM slows rendering and increases memory; aim for under 1500 (Lighthouse: DOM size)`, Math.min(Math.floor((data.totalDomElements - 1500) / 500), 6)); }
  if (data.figureWithoutFigcaption > 2) { addIssue('content', 'low', `${data.figureWithoutFigcaption} <figure> element(s) without <figcaption> — add captions for semantic completeness and accessibility`, Math.min(data.figureWithoutFigcaption, 3)); }
  if (data.multipleHeadTags) { addIssue('technical', 'medium', 'Multiple <head> tags found — only one <head> allowed per document; metadata in subsequent heads may be ignored (Screaming Frog Validation)', 8); }
  if (data.multipleBodyTags) { addIssue('technical', 'medium', 'Multiple <body> tags found — only one <body> allowed per document (Screaming Frog Validation)', 8); }
  if (data.bodyBeforeHtml) { addIssue('technical', 'high', 'Content appears before <html> tag — browsers generate an empty <head>, causing metadata to be ignored (Screaming Frog Validation)', 15); }
  if (data.linksToDocuments > 0) { addIssue('linksImages', 'low', `${data.linksToDocuments} link(s) to documents (PDF/DOC/XLS) without file type in link text — users should know what they are downloading (Screaming Frog)`, Math.min(data.linksToDocuments * 2, 6)); }
  // --- Schema & Rich Results ---
  if (data.localBusinessSchemaComplete) {
    const lb = data.localBusinessSchemaComplete;
    const lbMissing = [];
    if (!lb.hasName) lbMissing.push('name');
    if (!lb.hasAddress) lbMissing.push('address');
    if (!lb.hasTelephone) lbMissing.push('telephone');
    if (!lb.hasOpeningHours) lbMissing.push('openingHours');
    if (!lb.hasGeo) lbMissing.push('geo');
    if (lbMissing.length > 0) { addIssue('technical', 'medium', `LocalBusiness schema missing: ${lbMissing.join(', ')} — complete for Google local rich results (Google Local Business)`, Math.min(lbMissing.length * 2, 10)); }
  }
  if (data.aggregateRatingIncomplete && data.aggregateRatingIncomplete.length > 0) {
    addIssue('technical', 'medium', `AggregateRating schema missing: ${data.aggregateRatingIncomplete.join(', ')} — required for review rich snippets (Google)`, Math.min(data.aggregateRatingIncomplete.length * 2, 6));
  }
  if (data.videoSchemaIncomplete && data.videoSchemaIncomplete.length > 0) {
    addIssue('technical', 'medium', `VideoObject schema missing: ${data.videoSchemaIncomplete.join(', ')} — required for video rich results (Google)`, Math.min(data.videoSchemaIncomplete.length * 2, 8));
  }
  // --- Links & Navigation ---
  if (data.mailtoWithoutSubject > 2) { addIssue('linksImages', 'low', `${data.mailtoWithoutSubject} mailto: link(s) without subject parameter — adding ?subject= helps users (UX)`, Math.min(data.mailtoWithoutSubject, 3)); }
  if (data.downloadExternalLinks > 0) { addIssue('linksImages', 'low', `${data.downloadExternalLinks} link(s) with download attribute pointing to external domain — cross-origin download may fail silently`, Math.min(data.downloadExternalLinks * 2, 4)); }
  if (data.tablesWithEmptyCells > 0) { addIssue('content', 'low', `${data.tablesWithEmptyCells} table(s) have >50% empty cells — consider if a table is the right format (accessibility)`, Math.min(data.tablesWithEmptyCells * 2, 4)); }
  if (data.duplicateAltTexts > 3) { addIssue('linksImages', 'low', `${data.duplicateAltTexts} image(s) share duplicate alt text — each image should have unique, descriptive alt (Moz, Semrush)`, Math.min(data.duplicateAltTexts, 4)); }
  if (data.formWithoutMethod > 0) { addIssue('technical', 'low', `${data.formWithoutMethod} <form>(s) without explicit method attribute — defaults to GET which may expose data in URL`, Math.min(data.formWithoutMethod * 2, 4)); }

  // ── ROUND 14: MEGA AUDIT IV — 50 new scoring penalties (axe-core 4.10 remaining, Lighthouse Best Practices, WCAG 2.2, HTML validation, Schema.org, security headers) ──

  // --- Accessibility-SEO (axe-core 4.10 remaining rules) ---
  if (data.ariaHiddenOnBody) { addIssue('technical', 'high', 'aria-hidden="true" on <body> — hides entire page from assistive technologies (axe: aria-hidden-body, Critical)', 20); }
  if (data.invalidAriaRoles > 0) { addIssue('technical', 'medium', `${data.invalidAriaRoles} element(s) with invalid ARIA role values — screen readers will ignore the role (axe: aria-roles, Critical)`, Math.min(data.invalidAriaRoles * 4, 12)); }
  if (data.ariaProhibitedAttrs > 0) { addIssue('technical', 'low', `${data.ariaProhibitedAttrs} element(s) with ARIA attributes prohibited for their role (axe: aria-prohibited-attr, Serious)`, Math.min(data.ariaProhibitedAttrs * 2, 6)); }
  if (data.formFieldMultipleLabels > 0) { addIssue('technical', 'low', `${data.formFieldMultipleLabels} form field(s) with multiple associated labels — may confuse screen readers (axe: form-field-multiple-labels)`, Math.min(data.formFieldMultipleLabels * 2, 6)); }
  if (data.frameTitleDuplicate > 0) { addIssue('technical', 'low', `${data.frameTitleDuplicate} iframe(s) with duplicate title attributes — each iframe should have a unique title (axe: frame-title-unique)`, Math.min(data.frameTitleDuplicate * 2, 6)); }
  if (data.metaViewportLargeScale === false) { addIssue('technical', 'low', 'Meta viewport maximum-scale prevents significant zoom — users should be able to zoom to ≥5x (axe: meta-viewport-large)', 4); }
  if (data.autocompleteInvalid > 0) { addIssue('technical', 'low', `${data.autocompleteInvalid} input(s) with invalid autocomplete attribute values (WCAG 2.1 SC 1.3.5, axe: autocomplete-valid)`, Math.min(data.autocompleteInvalid * 2, 6)); }
  if (data.serverSideImageMap > 0) { addIssue('linksImages', 'medium', `${data.serverSideImageMap} image(s) using server-side image maps (ismap) — inaccessible to keyboard users (axe: server-side-image-map)`, Math.min(data.serverSideImageMap * 4, 8)); }
  if (data.summaryWithoutName > 0) { addIssue('technical', 'low', `${data.summaryWithoutName} <summary> element(s) without discernible text — disclosure widgets need accessible names (axe: summary-name)`, Math.min(data.summaryWithoutName * 2, 4)); }
  if (data.scopeAttrInvalid > 0) { addIssue('content', 'low', `${data.scopeAttrInvalid} table cell(s) with invalid scope attribute — use "row", "col", "rowgroup", or "colgroup" only (axe: scope-attr-valid)`, Math.min(data.scopeAttrInvalid * 2, 4)); }
  if (data.presentationRoleConflict > 0) { addIssue('technical', 'low', `${data.presentationRoleConflict} element(s) with role="presentation"/"none" but also have global ARIA or tabindex — conflicting semantics (axe: presentation-role-conflict)`, Math.min(data.presentationRoleConflict * 2, 6)); }
  if (data.pAsHeading > 0) { addIssue('content', 'medium', `${data.pAsHeading} <p> element(s) styled to look like headings (bold + large font-size) — use proper heading tags for SEO and accessibility (axe: p-as-heading)`, Math.min(data.pAsHeading * 3, 9)); }
  if (data.imageRedundantAlt > 0) { addIssue('linksImages', 'low', `${data.imageRedundantAlt} image(s) with alt text repeated as adjacent text — redundant for screen readers (axe: image-redundant-alt)`, Math.min(data.imageRedundantAlt * 2, 6)); }

  // --- Lighthouse Best Practices ---
  if (data.charsetTooLate) { addIssue('technical', 'medium', 'Charset declaration occurs >1024 bytes into document or is missing — must appear within first 1024 bytes (Lighthouse)', 8); }
  if (data.htmlManifestAttr) { addIssue('technical', 'medium', '<html manifest=...> Application Cache is deprecated — use Service Workers instead (Lighthouse: uses-appcache)', 6); }
  if (data.pastePrevented > 0) { addIssue('technical', 'low', `${data.pastePrevented} input(s) prevent pasting via onpaste="return false" — harms UX and password managers (Lighthouse)`, Math.min(data.pastePrevented * 3, 6)); }
  if (data.deprecatedApis > 0) { addIssue('technical', 'low', `${data.deprecatedApis} usage(s) of deprecated JavaScript APIs detected (document.all, etc.) (Lighthouse)`, Math.min(data.deprecatedApis * 2, 4)); }

  // --- Content quality & semantic HTML ---
  if (data.metaDescMatchesTitle) { addIssue('metaTags', 'medium', 'Meta description is identical to title — each should provide unique value for search results (Moz, Semrush)', 8); }
  if (data.consecutiveHeadingsNoContent > 2) { addIssue('content', 'low', `${data.consecutiveHeadingsNoContent} instance(s) of consecutive headings with no content between them — headings should introduce content`, Math.min(data.consecutiveHeadingsNoContent * 2, 6)); }
  if (data.headingsInsideAnchors > 0) { addIssue('content', 'low', `${data.headingsInsideAnchors} heading(s) wrapped inside anchor tags — may dilute heading SEO value (Moz)`, Math.min(data.headingsInsideAnchors * 2, 6)); }
  if (data.phoneNumbersNotLinked > 0) { addIssue('content', 'low', `${data.phoneNumbersNotLinked} phone number(s) not wrapped in tel: links — improves mobile UX (Lighthouse)`, Math.min(data.phoneNumbersNotLinked * 2, 4)); }
  if (data.hasAddressElement) { addIssue('content', 'info', 'Uses <address> element for contact info — good HTML5 semantic practice', -1); }
  if (data.timeElementCount > 0) { addIssue('content', 'info', `Uses ${data.timeElementCount} <time> element(s) with datetime attribute — excellent for structured data and SEO`, -1); }
  if (data.detailsWithoutSummary > 0) { addIssue('content', 'low', `${data.detailsWithoutSummary} <details> element(s) without <summary> child — disclosure widgets need a visible label`, Math.min(data.detailsWithoutSummary * 2, 4)); }
  if (data.nestedForms > 0) { addIssue('technical', 'medium', `${data.nestedForms} nested <form> element(s) — invalid HTML, inner forms are ignored by browsers`, Math.min(data.nestedForms * 4, 8)); }
  if (data.inputWithoutType > 0) { addIssue('technical', 'low', `${data.inputWithoutType} <input> element(s) without explicit type attribute — defaults to text, be explicit`, Math.min(data.inputWithoutType, 3)); }

  // --- Security headers (new checks) ---
  if (!data.hasCOOP && data.httpStatusCode >= 200 && data.httpStatusCode < 400) { addIssue('technical', 'low', 'Missing Cross-Origin-Opener-Policy (COOP) header — protects against cross-origin attacks (web.dev)', 2); }
  if (!data.hasCOEP && data.httpStatusCode >= 200 && data.httpStatusCode < 400) { addIssue('technical', 'low', 'Missing Cross-Origin-Embedder-Policy (COEP) header — required for SharedArrayBuffer and performance APIs', 2); }

  // --- Link quality & navigation ---
  if (data.hashOnlyAnchors > 0) { addIssue('linksImages', 'low', `${data.hashOnlyAnchors} <a href="#"> used as buttons — use <button> or add role="button" for accessibility (WCAG 4.1.2)`, Math.min(data.hashOnlyAnchors * 2, 6)); }
  if (data.adjacentDuplicateLinks > 0) { addIssue('linksImages', 'low', `${data.adjacentDuplicateLinks} pair(s) of adjacent links pointing to the same URL — combine into a single link (Lighthouse)`, Math.min(data.adjacentDuplicateLinks * 2, 6)); }
  if (data.linksMissingHref > 0) { addIssue('linksImages', 'low', `${data.linksMissingHref} <a> tag(s) without href attribute — not keyboard navigable (axe: link-name)`, Math.min(data.linksMissingHref * 2, 6)); }
  if (data.linksToSamePage > 5) { addIssue('linksImages', 'low', `${data.linksToSamePage} self-referencing link(s) — excessive links to the current URL waste crawl budget`, Math.min(Math.floor(data.linksToSamePage / 3), 4)); }

  // --- Schema & Rich Results ---
  if (data.hasSitelinksSearchBox) { addIssue('keywords', 'info', 'WebSite schema with SearchAction (Sitelinks Search Box) detected — eligible for Google search box enrichment', -1); }
  if (data.hasSpeakableSchema) { addIssue('content', 'info', 'Speakable schema detected — enables TTS-optimized content for Google Assistant', -1); }
  if (data.recipeSchemaIncomplete) { addIssue('content', 'medium', `Recipe schema missing required fields: ${data.recipeSchemaIncomplete.join(', ')} — Google requires name, image, author, datePublished, description (Google)`, Math.min(data.recipeSchemaIncomplete.length * 3, 12)); }
  if (data.hasSoftwareAppSchema) { addIssue('content', 'info', 'SoftwareApplication schema detected — eligible for app rich results', -1); }
  if (data.hasCourseSchema) { addIssue('content', 'info', 'Course schema detected — eligible for course rich results in Google', -1); }
  if (data.hasJobPostingSchema) { addIssue('content', 'info', 'JobPosting schema detected — eligible for Google Jobs enrichment', -1); }

  // --- HTML structure & validation ---
  if (data.missingTableCaption > 0) { addIssue('content', 'low', `${data.missingTableCaption} data table(s) without <caption> or aria-label — tables need accessible names (WCAG 1.3.1)`, Math.min(data.missingTableCaption * 2, 6)); }
  if (data.tableFakeCaption > 0) { addIssue('content', 'low', `${data.tableFakeCaption} table(s) using bold/th first row as fake caption — use the <caption> element instead (axe: table-fake-caption)`, Math.min(data.tableFakeCaption * 2, 4)); }
  if (data.missingTableStructure > 0) { addIssue('content', 'low', `${data.missingTableStructure} table(s) without <thead>/<tbody> — structured tables improve accessibility and semantics`, Math.min(data.missingTableStructure * 2, 4)); }
  if (data.landmarkBannerNotTopLevel > 0) { addIssue('technical', 'low', `${data.landmarkBannerNotTopLevel} <header>/<[role=banner]> not at top level — banner landmarks must be top-level (axe: landmark-banner-is-top-level)`, Math.min(data.landmarkBannerNotTopLevel * 2, 4)); }
  if (data.landmarkContentinfoNotTopLevel > 0) { addIssue('technical', 'low', `${data.landmarkContentinfoNotTopLevel} <footer>/<[role=contentinfo]> not at top level — contentinfo landmarks must be top-level (axe: landmark-contentinfo-is-top-level)`, Math.min(data.landmarkContentinfoNotTopLevel * 2, 4)); }
  if (data.duplicateBannerLandmark) { addIssue('technical', 'low', 'Multiple banner landmarks (<header> at top level) — document should have at most one (axe: landmark-no-duplicate-banner)', 3); }
  if (data.duplicateContentinfoLandmark) { addIssue('technical', 'low', 'Multiple contentinfo landmarks (<footer> at top level) — document should have at most one (axe: landmark-no-duplicate-contentinfo)', 3); }
  if (data.noMainLandmark) { addIssue('technical', 'medium', 'No <main> landmark found — document should have exactly one main landmark for navigation (axe: landmark-one-main)', 6); }

  // ── ROUND 15: MEGA AUDIT V — 50 new scoring penalties (Screaming Frog 300+ Issues, Sitebulb 15 categories, Ahrefs, Semrush, Google Search Essentials) ──

  // --- URL Hygiene (Sitebulb Internal hints, Screaming Frog URL Issues) ---
  if (data.urlHasUppercase) { addIssue('technical', 'medium', 'URL path contains uppercase characters — may cause duplicate content if server treats case differently (Screaming Frog URL, Sitebulb Internal)', 5); }
  if (data.urlTooLong) { addIssue('technical', 'medium', `URL is ${data.fullUrl?.length || 0} characters (>200) — excessively long URLs are harder to share and may be truncated (Screaming Frog URL, Sitebulb Internal)`, 4); }
  if (data.urlHasNonAscii) { addIssue('technical', 'low', 'URL path contains non-ASCII characters — may cause encoding issues in some browsers and crawlers (Sitebulb Internal)', 3); }
  if (data.urlHasDoubleSlashes) { addIssue('technical', 'medium', 'URL path has double slashes — frequently causes duplicate content and canonicalization issues (Screaming Frog URL)', 5); }
  if (data.urlHasUnderscores) { addIssue('technical', 'low', 'URL uses underscores instead of hyphens — Google recommends hyphens as word separators (Google SEO Starter Guide)', 2); }
  if (data.urlHasSessionId) { addIssue('technical', 'high', 'URL contains session ID parameter — causes massive duplicate content and wastes crawl budget (Screaming Frog URL, Sitebulb Internal)', 12); }
  if (data.urlHasEncodedSpaces) { addIssue('technical', 'low', 'URL contains encoded spaces (%20) — use hyphens instead for cleaner, more shareable URLs (Sitebulb Links)', 2); }
  if (data.urlHasRepetitiveSegments) { addIssue('technical', 'medium', 'URL has repetitive path segments — may indicate URL generation issues or infinite crawl traps (Sitebulb Internal)', 6); }

  // --- Viewport / Mobile Friendly (Sitebulb Mobile Friendly hints) ---
  if (data.viewportCount > 1) { addIssue('technical', 'high', `${data.viewportCount} viewport meta tags found — only one should exist; multiple cause unpredictable mobile rendering (Sitebulb Mobile Friendly: High)`, 10); }
  if (data.viewportMissingWidth) { addIssue('technical', 'medium', 'Viewport meta tag missing width directive — add width=device-width for proper mobile scaling (Sitebulb Mobile Friendly: High)', 6); }
  if (data.viewportFixedWidth) { addIssue('technical', 'high', 'Viewport uses fixed pixel width instead of device-width — page will not adapt to mobile screens (Sitebulb Mobile Friendly: Medium)', 10); }
  if (data.viewportInitialScaleWrong) { addIssue('technical', 'low', 'Viewport initial-scale is not 1.0 — non-standard initial zoom may confuse users (Sitebulb Mobile Friendly: Medium)', 3); }
  if (data.viewportHasMinScale) { addIssue('technical', 'low', 'Viewport has min-scale set — may prevent users from zooming out (Sitebulb Mobile Friendly)', 2); }
  if (data.smallFontInStyles > 3) { addIssue('technical', 'medium', `${data.smallFontInStyles} instance(s) of inline font-size <12px — text may be unreadable on mobile (Sitebulb Mobile Friendly: High)`, Math.min(data.smallFontInStyles * 2, 8)); }

  // --- Performance (Sitebulb Performance hints, Lighthouse, web.dev) ---
  if (data.renderBlockingCSS > 3) { addIssue('technical', 'medium', `${data.renderBlockingCSS} render-blocking CSS file(s) in <head> without media attribute — delays First Contentful Paint (Lighthouse, Sitebulb Performance)`, Math.min(data.renderBlockingCSS * 2, 10)); }
  if (data.unminifiedInlineCSS > 0) { addIssue('technical', 'low', `${data.unminifiedInlineCSS} unminified inline <style> block(s) detected — minify to reduce page weight (Lighthouse: unminified-css)`, Math.min(data.unminifiedInlineCSS * 2, 4)); }
  if (data.unminifiedInlineJS > 0) { addIssue('technical', 'low', `${data.unminifiedInlineJS} unminified inline <script> block(s) detected — minify to reduce page weight (Lighthouse: unminified-javascript)`, Math.min(data.unminifiedInlineJS * 2, 4)); }
  if (data.estimatedTotalWeight > 5000) { addIssue('technical', 'high', `Estimated page weight ~${data.estimatedTotalWeight} KB — pages over 5 MB significantly impact load time and mobile users (Sitebulb Performance, web.dev)`, Math.min(Math.floor(data.estimatedTotalWeight / 1000), 15)); }
  if (!data.webManifestLink) { addIssue('technical', 'low', 'No web app manifest (<link rel="manifest">) — required for PWA installability and Lighthouse PWA audit', 1); }
  if (!data.cssPrintStylesheet) { addIssue('technical', 'info', 'No print stylesheet detected — consider adding @media print CSS for better print experience', 0); }

  // --- Content Quality (Screaming Frog Content, Ahrefs, Semrush) ---
  if (data.consecutiveBrTags > 3) { addIssue('content', 'low', `${data.consecutiveBrTags} instance(s) of consecutive <br> tags — use CSS margins/padding for spacing instead (HTML best practice)`, Math.min(data.consecutiveBrTags, 4)); }
  if (data.noTableOfContents) { addIssue('content', 'medium', 'Long article (1500+ words) without table of contents — add one for UX, accessibility, and potential Google jump-to links (Ahrefs, Semrush)', 4); }
  if (data.excessiveDivSoup > 0) { addIssue('content', 'medium', `${data.excessiveDivSoup} <div> elements with very few semantic elements — use semantic HTML5 tags for better SEO and accessibility (Semrush, web.dev)`, Math.min(Math.floor(data.excessiveDivSoup / 10), 6)); }
  if (data.contentHasFAQSection && !data.hasFAQSchema) { addIssue('keywords', 'medium', 'Page has FAQ/Q&A content but no FAQPage schema — add structured data for rich result eligibility (Google Rich Results)', 5); }
  if (data.abbrWithoutTitle > 0) { addIssue('content', 'low', `${data.abbrWithoutTitle} <abbr> element(s) without title attribute — add title to define abbreviations for accessibility (WCAG 3.1.4)`, Math.min(data.abbrWithoutTitle * 2, 4)); }
  if (data.hasQAPattern && !data.hasQAPageSchema) { addIssue('keywords', 'low', 'Page has Q&A-style content patterns but no QAPage schema — consider adding structured data for Q&A rich results', 2); }

  // --- Links & Navigation (Sitebulb Links hints, Screaming Frog Links) ---
  if (data.fileProtocolLinks > 0) { addIssue('linksImages', 'high', `${data.fileProtocolLinks} file:// protocol link(s) — inaccessible to users and indicate development artifacts left in production (Sitebulb Links: Critical)`, Math.min(data.fileProtocolLinks * 5, 15)); }
  if (data.ftpLinks > 0) { addIssue('linksImages', 'medium', `${data.ftpLinks} ftp:// link(s) — FTP is insecure and deprecated; use HTTPS instead (Sitebulb Links)`, Math.min(data.ftpLinks * 3, 6)); }
  if (data.onclickNavigation > 0) { addIssue('linksImages', 'medium', `${data.onclickNavigation} onclick-based navigation pattern(s) — use proper <a href> links for crawlability and accessibility (Screaming Frog JavaScript, Google)`, Math.min(data.onclickNavigation * 3, 9)); }
  if (data.whitespaceInHref > 0) { addIssue('linksImages', 'low', `${data.whitespaceInHref} link(s) with whitespace in href attribute — may cause 404s or encoding issues (Sitebulb Links)`, Math.min(data.whitespaceInHref * 2, 6)); }
  if (data.emptyHrefLinks > 0) { addIssue('linksImages', 'medium', `${data.emptyHrefLinks} <a> tag(s) with empty href="" — reloads the current page and wastes resources (Screaming Frog Links)`, Math.min(data.emptyHrefLinks * 3, 9)); }
  if (data.linksWithHashFragment > 50) { addIssue('linksImages', 'low', `${data.linksWithHashFragment} internal link(s) with hash fragments — excessive in-page anchors may indicate over-fragmented content`, Math.min(Math.floor(data.linksWithHashFragment / 10), 4)); }

  // --- Security (Sitebulb Security hints) ---
  if (data.passwordFieldOnHttp > 0) { addIssue('technical', 'high', `${data.passwordFieldOnHttp} password field(s) on non-HTTPS page — browsers will mark as "Not Secure" (Sitebulb Security: Critical, Lighthouse)`, 15); }
  if (data.exposedApiKeys > 0) { addIssue('technical', 'high', `${data.exposedApiKeys} potential API key(s)/secret(s) found in HTML source — remove immediately and rotate credentials (Security)`, Math.min(data.exposedApiKeys * 5, 15)); }
  if (data.formPostToExternalDomain > 0) { addIssue('technical', 'medium', `${data.formPostToExternalDomain} form(s) posting data to external domain(s) — verify these are intentional and use HTTPS (Sitebulb Security)`, Math.min(data.formPostToExternalDomain * 3, 9)); }

  // --- Technical SEO (Screaming Frog, Sitebulb, Google Search Essentials) ---
  if (!data.sitemapLinkInHtml) { addIssue('technical', 'info', 'No link to XML sitemap found in HTML — consider adding sitemap link in footer (Google Search Essentials)', 0); }
  if (!data.appleTouchIcon) { addIssue('technical', 'low', 'Missing apple-touch-icon — required for iOS home screen and improves mobile UX (Lighthouse)', 1); }
  if (data.multipleGTMCodes) { addIssue('technical', 'medium', 'Multiple Google Tag Manager containers detected — may cause tag conflicts and performance issues (Sitebulb Internal)', 4); }
  if (data.multipleGACodes) { addIssue('technical', 'low', 'Multiple Google Analytics tracking IDs detected — may cause inflated pageview counts (Screaming Frog Analytics)', 3); }
  if (data.canonicalIsSelfReferencing) { addIssue('metaTags', 'info', 'Canonical tag is self-referencing — this is correct and best practice (Google, Yoast)', -1); }
  if (data.missingSchemaContext > 0) { addIssue('technical', 'medium', `${data.missingSchemaContext} JSON-LD block(s) missing @context property — required for valid structured data (Google Rich Results)`, Math.min(data.missingSchemaContext * 4, 8)); }

  // --- Schema Extended (Google Rich Results, Schema.org) ---
  if (data.hasQAPageSchema) { addIssue('keywords', 'info', 'QAPage schema detected — eligible for Google Q&A rich results', -1); }
  if (data.hasItemListSchema) { addIssue('keywords', 'info', 'ItemList schema detected — eligible for carousel rich results in Google', -1); }
  if (data.hasCreativeWorkSchema) { addIssue('content', 'info', 'CreativeWork schema (or subtype) detected — excellent for content attribution', -1); }
  if (data.hasWebPageSchema) { addIssue('content', 'info', 'WebPage schema detected — helps search engines understand page type and purpose', -1); }

  // --- Resource Hints (Sitebulb Performance, web.dev) ---
  if (data.resourceHintsSummary?.total === 0) { addIssue('technical', 'low', 'No resource hints (preconnect, preload, prefetch, dns-prefetch) — add hints for critical third-party origins to speed up loading (web.dev)', 2); }
  if (data.resourceHintsSummary?.preconnect > 6) { addIssue('technical', 'low', `${data.resourceHintsSummary.preconnect} preconnect hints — too many (>6) can be counterproductive, prioritize critical origins only (web.dev)`, 2); }

  // Clamp category scores
  Object.values(categories).forEach(c => { c.score = Math.max(0, Math.min(100, Math.round(c.score))); });

  // Weighted overall
  const overall = Math.round(
    Object.values(categories).reduce((sum, c) => sum + (c.score * c.weight / 100), 0)
  );

  return { overall: Math.max(0, Math.min(100, overall)), categories, issues };
}

// ── Page Fetch & Auto-Analyse ─────────────────────────────────────────────────
// POST /api/on-page-seo-engine/fetch-page
// Crawls a URL and returns all SEO fields pre-extracted
router.post('/fetch-page', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'url is required' });

  try {
    const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
    const fetchStart = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    });

    if (!response.ok) return res.status(400).json({ ok: false, error: `Page returned HTTP ${response.status}` });

    const html = await response.text();
    const finalUrl = response.url || url;

    // ── ROUND 10: HTTP Response Header Analysis (Google Search Central, Bing, Screaming Frog) ──
    const xRobotsTag = response.headers.get('x-robots-tag') || null;
    const contentEncoding = response.headers.get('content-encoding') || null;
    const hasCompression = !!(contentEncoding && /gzip|br|deflate/i.test(contentEncoding));
    const hasHSTS = !!response.headers.get('strict-transport-security');
    const hasXContentTypeOptions = !!response.headers.get('x-content-type-options');
    const hasCSP = !!response.headers.get('content-security-policy');
    const hasReferrerPolicy = !!response.headers.get('referrer-policy');

    // ── ROUND 11: Additional HTTP Response Headers (Google, Bing, SE Ranking, W3C) ──
    const hasXFrameOptions = !!response.headers.get('x-frame-options');
    const xPoweredBy = response.headers.get('x-powered-by') || null;
    const hasPermissionsPolicy = !!response.headers.get('permissions-policy');
    const httpLinkHeader = response.headers.get('link') || null;
    const canonicalViaHttpHeader = (() => {
      if (!httpLinkHeader) return null;
      const m = /<([^>]+)>;\s*rel=["']?canonical["']?/i.exec(httpLinkHeader);
      return m ? m[1] : null;
    })();
    const cacheControl = response.headers.get('cache-control') || null;
    const serverHeader = response.headers.get('server') || null;
    const serverHeaderLeak = serverHeader && /\d/.test(serverHeader) ? serverHeader : null;
    const contentLanguageHeader = response.headers.get('content-language') || null;

    function matchOne(re) { const m = re.exec(html); return m && m[1] ? m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null; }
    function countMatches(re) { return (html.match(re) || []).length; }
    function decode(s) { return s ? s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim() : null; }

    const title = decode(matchOne(/<title[^>]*>([\s\S]*?)<\/title>/i));
    const titleCount = countMatches(/<title[\s>]/gi);  // Sitebulb: multiple title tags check
    const metaDescription = decode(
      matchOne(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
      matchOne(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i)
    );
    const metaDescriptionCount = countMatches(/<meta[^>]+name=["']description["']/gi);  // Screaming Frog / Sitebulb: multiple meta descriptions
    const h1 = decode(matchOne(/<h1[^>]*>([\s\S]*?)<\/h1>/i));
    const h1Count = countMatches(/<h1[\s>]/gi);  // Yoast: single H1 check
    const h2Count = countMatches(/<h2[\s>]/gi);
    const h3Count = countMatches(/<h3[\s>]/gi);
    const h4Count = countMatches(/<h4[\s>]/gi);

    const canonicalMatch = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html) ||
                           /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i.exec(html);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

    const hasSchema = /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html);

    // Viewport meta (mobile-friendliness indicator)
    const viewportMeta = !!matchOne(/<meta[^>]+name=["']viewport["'][^>]+content=["']([\s\S]*?)["']/i);

    // Language tag
    const langMatch = /<html[^>]+lang=["']([^"']+)["']/i.exec(html);
    const langTag = langMatch ? langMatch[1] : null;

    // Viewport zoom check (Lighthouse: user-scalable=no or maximum-scale<5)
    const viewportContent = matchOne(/<meta[^>]+name=["']viewport["'][^>]+content=["']([\s\S]*?)["']/i) || '';
    const viewportZoomDisabled = /user-scalable\s*=\s*no/i.test(viewportContent) || (() => {
      const msMatch = /maximum-scale\s*=\s*([\d.]+)/i.exec(viewportContent);
      return msMatch && parseFloat(msMatch[1]) < 5;
    })();

    // Title vs meta description duplicate check (Sitebulb)
    const titleEqualsDescription = !!(title && metaDescription && title.trim().toLowerCase() === metaDescription.trim().toLowerCase());

    // Title same as H1 check (Screaming Frog: Page Titles > Same as H1)
    const titleEqualsH1 = !!(title && h1 && title.trim().toLowerCase() === h1.replace(/<[^>]*>/g, '').trim().toLowerCase());

    // Title / meta description outside <head> check (Sitebulb: Critical / High)
    const headSection = (html.match(/<head[^>]*>[\s\S]*?<\/head>/i) || [''])[0];
    const titleOutsideHead = !!(title && titleCount > 0 && !/<title[\s>]/i.test(headSection));
    const metaDescOutsideHead = !!(metaDescription && metaDescriptionCount > 0 && !/<meta[^>]+name=["']description["']/i.test(headSection));

    // Word count from visible text
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const words = textContent ? textContent.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;

    // Lorem Ipsum / placeholder text detection (Sitebulb) — must be AFTER textContent
    const hasLoremIpsum = /lorem\s+ipsum/i.test(textContent || html);

    // First 200 words (for keyword placement analysis)
    const firstWords = words.slice(0, 200).join(' ');

    // Paragraph count
    const paragraphCount = countMatches(/<p[\s>]/gi);

    // Readability
    const readability = calcReadability(textContent);

    // URL structure analysis
    const urlAnalysis = analyzeUrlStructure(finalUrl);

    // Links
    const parsed = new URL(finalUrl);
    const host = parsed.hostname;
    const allLinks = [...html.matchAll(/<a[^>]+href=["']([^"'#?][^"']*)["']/gi)].map(m => m[1]);
    const internalLinks = allLinks.filter(l => {
      try { return new URL(l, finalUrl).hostname === host; } catch { return l.startsWith('/'); }
    }).length;
    const externalLinks = allLinks.filter(l => {
      try { const u = new URL(l, finalUrl); return u.hostname !== host && u.protocol.startsWith('http'); } catch { return false; }
    }).length;

    // External link follow/nofollow analysis (Rank Math, Yoast, WooRank)
    const totalLinks = internalLinks + externalLinks;
    const externalLinkDetails = [...html.matchAll(/<a([^>]*)href=["']([^"'#?][^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi)]
      .map(m => {
        const href = m[2];
        const attrs = m[1] + ' ' + m[3];
        const anchor = m[4].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        try {
          const resolved = new URL(href, finalUrl);
          if (resolved.hostname === host) return null;
          if (!resolved.protocol.startsWith('http')) return null;
          const isNofollow = /rel=["'][^"']*nofollow[^"']*["']/i.test(attrs);
          return { href: resolved.href.length > 80 ? resolved.hostname + '...' : resolved.href, anchor: anchor || '(empty)', nofollow: isNofollow };
        } catch { return null; }
      }).filter(Boolean).slice(0, 30);
    const followedExternalCount = externalLinkDetails.filter(l => !l.nofollow).length;
    const nofollowExternalCount = externalLinkDetails.filter(l => l.nofollow).length;
    // Full external link URLs for broken link checker
    const allExternalUrls = [...html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["']/gi)]
      .map(m => { try { const u = new URL(m[1]); return u.hostname === host ? null : u.href; } catch { return null; } })
      .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 50);

    // Images
    const imgTags = [...html.matchAll(/<img([^>]*)>/gi)].map(m => m[1]);
    const imageCount = imgTags.length;
    const imagesWithAlt = imgTags.filter(attrs => /alt=["'][^"']+["']/i.test(attrs)).length;

    // Image filename SEO analysis (Ahrefs/Backlinko/Semrush)
    const imageFilenames = analyzeImageFilenames(imgTags);

    // Image dimension attributes (Screaming Frog: CLS prevention)
    const imagesWithDimensions = imgTags.filter(attrs => /width=/i.test(attrs) && /height=/i.test(attrs)).length;
    const imagesMissingDimensions = imageCount - imagesWithDimensions;

    // Code-to-text ratio (Sitechecker & SE Ranking metric)
    const htmlLen = html.length;
    const textLen = textContent.length;
    const codeToTextRatio = htmlLen > 0 ? +((textLen / htmlLen) * 100).toFixed(1) : 0;

    // Internal link anchor texts + self-link detection  (Sitechecker feature)
    const internalLinkDetails = [...html.matchAll(/<a[^>]+href=["']([^"'#?][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => {
        const href = m[1];
        const anchorText = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        try {
          const resolved = new URL(href, finalUrl);
          if (resolved.hostname !== host) return null;
          return { href: resolved.pathname, anchor: anchorText || '(empty)' };
        } catch {
          if (href.startsWith('/')) return { href, anchor: anchorText || '(empty)' };
          return null;
        }
      }).filter(Boolean).slice(0, 50);

    // Self-linking detection
    const normalizedPath = parsed.pathname.replace(/\/$/, '') || '/';
    const selfLinks = internalLinkDetails.filter(l => l.href.replace(/\/$/, '') === normalizedPath).length;

    // Localhost link detection (Screaming Frog: Links > Outlinks To Localhost)
    const localhostLinks = allLinks.filter(l => {
      try {
        const u = new URL(l, finalUrl);
        return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(u.hostname);
      } catch { return /localhost|127\.0\.0\.1/i.test(l); }
    }).length;

    // Generic / non-descriptive link text detection (Lighthouse)
    const genericLinkPatterns = /^(click here|click this|here|this|go|start|right here|more|learn more|read more|continue|link|page)$/i;
    const genericLinkAnchors = [...internalLinkDetails, ...externalLinkDetails]
      .filter(l => genericLinkPatterns.test(l.anchor.trim()))
      .map(l => l.anchor.trim())
      .slice(0, 20);
    const genericLinkCount = genericLinkAnchors.length;

    // OG tags
    const ogTitle = matchOne(/<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["']/i);
    const ogDescription = matchOne(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i);
    const ogImage = matchOne(/<meta[^>]+property=["']og:image["'][^>]+content=["']([\s\S]*?)["']/i) ||
                    matchOne(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:image["']/i);

    // Twitter card (full details)
    const twitterCard = matchOne(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([\s\S]*?)["']/i);
    const twitterTitle = matchOne(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([\s\S]*?)["']/i);
    const twitterDescription = matchOne(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([\s\S]*?)["']/i);
    const twitterImage = matchOne(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([\s\S]*?)["']/i);

    // Robots meta
    const robotsMeta = matchOne(/<meta[^>]+name=["']robots["'][^>]+content=["']([\s\S]*?)["']/i);

    // Heading hierarchy (all H1-H6 in order of appearance)
    const headingHierarchy = [...html.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => ({
      level: parseInt(m[1].charAt(1)),
      text: m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
    })).filter(h => h.text.length > 0).slice(0, 50);

    // Schema types (extract JSON-LD @type values)
    const schemaTypes = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => { try { const j = JSON.parse(m[1]); return j['@type'] || (Array.isArray(j['@graph']) ? j['@graph'].map(g => g['@type']).filter(Boolean) : null); } catch { return null; } })
      .flat().filter(Boolean);

    // Schema raw data (for Schema Visualizer)
    const schemaRawData = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => { try { const j = JSON.parse(m[1]); if (Array.isArray(j['@graph'])) return j['@graph']; return j; } catch { return null; } })
      .flat().filter(Boolean).slice(0, 10);

    // Non-sequential heading level detection (Screaming Frog / Sitebulb)
    const headingSkips = (() => {
      const skips = [];
      for (let i = 1; i < headingHierarchy.length; i++) {
        const prev = headingHierarchy[i - 1].level;
        const curr = headingHierarchy[i].level;
        if (curr > prev + 1) {
          skips.push(`H${prev}→H${curr}`);
        }
      }
      return [...new Set(skips)];
    })();

    // Featured snippet readiness (Ahrefs/Backlinko/Semrush 2026)
    const snippetReadiness = detectSnippetReadiness(html, headingHierarchy);

    // Subheading distribution check (Yoast) — detect long text blocks between headings
    const subheadingDistribution = (() => {
      const bodyHtml = html.replace(/<head[\s\S]*?<\/head>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<nav[\s\S]*?<\/nav>/gi, '').replace(/<footer[\s\S]*?<\/footer>/gi, '');
      const sections = bodyHtml.split(/<h[1-6][^>]*>/gi);
      const longSections = sections.map(s => {
        const text = s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.split(/\s+/).filter(Boolean).length;
      }).filter(wc => wc > 300);
      return { longBlocksWithoutHeadings: longSections.length, longestBlockWords: longSections.length > 0 ? Math.max(...longSections) : 0 };
    })();

    // Long paragraph detection (Rank Math: >120 words per paragraph, Yoast: paragraph length)
    const longParagraphs = (() => {
      const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
      let count = 0;
      let longest = 0;
      pMatches.forEach(m => {
        const text = m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const wc = text.split(/\s+/).filter(Boolean).length;
        if (wc > 120) count++;
        if (wc > longest) longest = wc;
      });
      return { total: pMatches.length, overLength: count, longestWords: longest };
    })();

    // Hreflang tags
    const hreflangTags = [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi)]
      .map(m => ({ lang: m[1], href: m[2] })).slice(0, 30);

    // Freshness signals
    const datePublished = matchOne(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([\s\S]*?)["']/i) ||
                          matchOne(/<meta[^>]+name=["']date["'][^>]+content=["']([\s\S]*?)["']/i) ||
                          matchOne(/<time[^>]+datetime=["']([\s\S]*?)["']/i);
    const dateModified = matchOne(/<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([\s\S]*?)["']/i);

    // Author detection (E-E-A-T signal)
    const authorMeta = matchOne(/<meta[^>]+name=["']author["'][^>]+content=["']([\s\S]*?)["']/i);

    // Page load size (approx)
    const pageSizeKB = Math.round(Buffer.byteLength(html, 'utf8') / 1024);

    // Compute keyword density (if keywords provided in request)
    const reqKeywords = (req.body && req.body.keywords) || '';
    const keywordDensity = computeKeywordDensity(textContent, reqKeywords);

    // ── NEW ROUND 7 CHECKS (Yoast, Lighthouse, SEO Site Checkup, SEOptimer) ──

    // HTTP status code (Lighthouse SEO audit)
    const httpStatusCode = response.status;

    // Response time / TTFB (SEO Site Checkup)
    const responseTimeMs = Date.now() - fetchStart;

    // Favicon detection (SEO Site Checkup)
    const hasFavicon = /<link[^>]+rel=["'](icon|shortcut icon|apple-touch-icon)["']/i.test(html);

    // Charset declaration (SEO Site Checkup / Google recommendation)
    const hasCharset = /<meta[^>]+charset=/i.test(html) || /<meta[^>]+http-equiv=["']Content-Type["']/i.test(html);

    // Doctype declaration (HTML best practice)
    const hasDoctype = /^\s*<!DOCTYPE\s/i.test(html);

    // Deprecated HTML tags (SEO Site Checkup)
    const deprecatedTagsList = ['font', 'center', 'marquee', 'blink', 'strike', 'big', 'tt', 'frameset', 'frame', 'applet', 'acronym', 'dir', 'isindex', 'listing', 'plaintext', 'xmp'];
    const deprecatedTagsFound = deprecatedTagsList.filter(tag => new RegExp(`<${tag}[\\s>]`, 'i').test(html));

    // Meta refresh detection (SEO Site Checkup)
    const hasMetaRefresh = /<meta[^>]+http-equiv=["']refresh["']/i.test(html);

    // Plaintext email exposure (SEO Site Checkup)
    const plaintextEmails = (textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
      .filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);

    // Unsafe cross-origin links — target="_blank" without rel="noopener" (Lighthouse + SEO Site Checkup)
    const unsafeCrossOriginLinks = [...html.matchAll(/<a([^>]*)target=["']_blank["']([^>]*)>/gi)]
      .filter(m => {
        const attrs = m[1] + ' ' + m[2];
        return !/rel=["'][^"']*(noopener|noreferrer)[^"']*["']/i.test(attrs);
      }).length;

    // Mixed content detection — HTTP resources on HTTPS page (SEO Site Checkup)
    const isPageHttps = finalUrl.startsWith('https://');
    const mixedContentItems = isPageHttps
      ? [...html.matchAll(/(?:src|href|action)=["'](http:\/\/[^"']+)["']/gi)]
          .map(m => m[1]).filter(u => !u.startsWith('http://schema.org'))
          .filter((v, i, a) => a.indexOf(v) === i).slice(0, 15)
      : [];
    const hasMixedContent = mixedContentItems.length > 0;

    // Modern image format check (SEO Site Checkup)
    const imgSrcs = imgTags.map(attrs => {
      const srcMatch = /src=["']([^"']+)["']/i.exec(attrs);
      return srcMatch ? srcMatch[1].split('?')[0].toLowerCase() : '';
    }).filter(Boolean);
    const modernFormats = imgSrcs.filter(s => /\.(webp|avif)$/i.test(s)).length;
    const legacyFormats = imgSrcs.filter(s => /\.(jpe?g|png|gif|bmp|tiff?)$/i.test(s)).length;
    const modernImageRatio = imgSrcs.length > 0 ? Math.round((modernFormats / imgSrcs.length) * 100) : null;

    // Sentence length distribution (Yoast readability)
    const sentences = textContent.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20);
    const sentenceLengthStats = {
      total: sentences.length,
      longCount: longSentences.length,
      longPercent: sentences.length > 0 ? Math.round((longSentences.length / sentences.length) * 100) : 0,
      avgLength: sentences.length > 0 ? Math.round(sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length) : 0,
    };

    // Consecutive sentences starting with same word (Yoast readability)
    const consecutiveSentences = (() => {
      if (sentences.length < 3) return { maxRun: 0, word: '', count: 0 };
      let maxRun = 1, maxWord = '', curRun = 1;
      for (let i = 1; i < sentences.length; i++) {
        const prevFirst = (sentences[i - 1].split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
        const curFirst = (sentences[i].split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');
        if (prevFirst && curFirst && prevFirst === curFirst) { curRun++; } else { curRun = 1; }
        if (curRun > maxRun) { maxRun = curRun; maxWord = curFirst; }
      }
      return { maxRun, word: maxWord, count: maxRun >= 3 ? maxRun : 0 };
    })();

    // Keyword in image alt text (Yoast)
    const keywordInAltText = (() => {
      if (!reqKeywords) return null;
      const kwList = (typeof reqKeywords === 'string' ? reqKeywords.split(',') : reqKeywords).map(k => k.trim().toLowerCase()).filter(Boolean);
      if (kwList.length === 0) return null;
      const altTexts = imgTags.map(attrs => {
        const altMatch = /alt=["']([^"']+)["']/i.exec(attrs);
        return altMatch ? altMatch[1].toLowerCase() : '';
      }).filter(Boolean);
      return kwList.map(kw => ({
        keyword: kw,
        found: altTexts.some(alt => alt.includes(kw)),
        imagesWithKeyword: altTexts.filter(alt => alt.includes(kw)).length,
      }));
    })();

    // OG completeness — og:type, og:url, og:site_name (social audit best practice)
    const ogType = matchOne(/<meta[^>]+property=["']og:type["'][^>]+content=["']([\s\S]*?)["']/i);
    const ogUrl = matchOne(/<meta[^>]+property=["']og:url["'][^>]+content=["']([\s\S]*?)["']/i);
    const ogSiteName = matchOne(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([\s\S]*?)["']/i);

    // Plugins / embeds detection (Lighthouse: "Document uses plugins")
    const pluginElements = countMatches(/<(embed|object|applet)[\s>]/gi);

    // Reading time estimate (Yoast feature — avg 238 words/min)
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 238));

    // ── ROUND 8: COMPREHENSIVE CHECKS (Lighthouse, Sitebulb, Moz) ──────────

    // Canonical tag analysis (Lighthouse: canonical validation, Sitebulb: canonical outside head)
    const canonicalCount = countMatches(/<link[^>]+rel=["']canonical["']/gi);
    const canonicalOutsideHead = !!(canonicalUrl && canonicalCount > 0 && !/<link[^>]+rel=["']canonical["']/i.test(headSection));
    const canonicalIsRelative = !!(canonicalUrl && !/^https?:\/\//i.test(canonicalUrl));
    const canonicalPointsToHttp = !!(canonicalUrl && isPageHttps && /^http:\/\//i.test(canonicalUrl));

    // Soft 404 detection (Sitebulb: "Contains possible soft 404 phrases")
    const soft404Phrases = /\b(page\s+not\s+found|this\s+page\s+(doesn't|does\s+not|can't|cannot)\s+exist|no\s+longer\s+available|we\s+couldn'?t\s+find|the\s+page\s+you\s+(were|are|'re)\s+looking\s+for|404\s+error|error\s+404|oops!?\s+.*?(not\s+found|doesn't\s+exist)|the\s+requested\s+URL\s+was\s+not\s+found|404\s+-\s+not\s+found)\b/i;
    const isSoft404 = httpStatusCode === 200 && soft404Phrases.test(textContent);

    // Empty anchor text links (Sitebulb: "Has an internal link with no anchor text")
    const emptyAnchorLinks = [...html.matchAll(/<a\s[^>]*href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .filter(m => {
        const innerText = m[1].replace(/<[^>]*>/g, '').trim();
        if (innerText.length > 0) return false;
        return !/<img[^>]+alt=["'][^"']+["']/i.test(m[1]);
      }).length;

    // Image-links missing alt text (Sitebulb: "Has an anchored image with no alt text")
    const imageLinksWithoutAlt = [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)]
      .filter(m => {
        if (!/<img/i.test(m[1])) return false;
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        if (text.length > 0) return false;
        return !/<img[^>]+alt=["'][^"']+["']/i.test(m[1]);
      }).length;

    // HTTPS forms posting to HTTP (Sitebulb: "HTTPS URL contains a form posting to HTTP")
    const insecureFormActions = isPageHttps
      ? [...html.matchAll(/<form[^>]+action=["'](http:\/\/[^"']+)["']/gi)].length
      : 0;

    // Empty heading tags (Screaming Frog: content issues)
    const emptyHeadings = [...html.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)]
      .filter(m => m[2].replace(/<[^>]*>/g, '').trim().length === 0).length;

    // Alt text too long — over 125 chars (Moz: keep alt concise)
    const longAltTextCount = imgTags.filter(attrs => {
      const m = /alt=["']([^"']+)["']/i.exec(attrs);
      return m && m[1].length > 125;
    }).length;

    // Hreflang language code validation (Lighthouse: valid ISO 639-1 codes)
    const validLangCodes = new Set(['aa','ab','af','ak','am','an','ar','as','av','ay','az','ba','be','bg','bh','bi','bm','bn','bo','br','bs','ca','ce','ch','co','cr','cs','cu','cv','cy','da','de','dv','dz','ee','el','en','eo','es','et','eu','fa','ff','fi','fj','fo','fr','fy','ga','gd','gl','gn','gu','gv','ha','he','hi','ho','hr','ht','hu','hy','hz','ia','id','ie','ig','ii','ik','in','io','is','it','iu','ja','jv','ka','kg','ki','kj','kk','kl','km','kn','ko','kr','ks','ku','kv','kw','ky','la','lb','lg','li','ln','lo','lt','lu','lv','mg','mh','mi','mk','ml','mn','mo','mr','ms','mt','my','na','nb','nd','ne','ng','nl','nn','no','nr','nv','ny','oc','oj','om','or','os','pa','pi','pl','ps','pt','qu','rm','rn','ro','ru','rw','sa','sc','sd','se','sg','si','sk','sl','sm','sn','so','sq','sr','ss','st','su','sv','sw','ta','te','tg','th','ti','tk','tl','tn','to','tr','ts','tt','tw','ty','ug','uk','ur','uz','ve','vi','vo','wa','wo','xh','yi','yo','za','zh','zu','x-default']);
    const invalidHreflangCodes = hreflangTags
      .map(t => t.lang.toLowerCase().split('-')[0])
      .filter(code => !validLangCodes.has(code))
      .filter((v, i, a) => a.indexOf(v) === i);

    // ── ROUND 9: COMPREHENSIVE CHECKS (Screaming Frog Issues Library) ──────

    // H1 contains only image alt text (Screaming Frog: H1 > Alt Text in H1)
    const h1OnlyImageAlt = (() => {
      const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
      if (!h1Match) return false;
      const h1Content = h1Match[1];
      const textOnly = h1Content.replace(/<[^>]*>/g, '').trim();
      return textOnly.length === 0 && /<img/i.test(h1Content);
    })();

    // Images missing alt attribute entirely — distinct from empty alt="" (Screaming Frog: Images > Missing Alt Attribute)
    const imagesMissingAltAttribute = imgTags.filter(attrs => !/alt\s*=/i.test(attrs)).length;

    // Canonical contains fragment URL (Screaming Frog: Canonicals > Contains Fragment URL)
    const canonicalHasFragment = !!(canonicalUrl && canonicalUrl.includes('#'));

    // Robots meta outside <head> (Screaming Frog: Directives > Outside <head>)
    const robotsMetaOutsideHead = (() => {
      if (!robotsMeta) return false;
      const headHasRobots = /<meta[^>]+name=["']robots["'][^>]*>/i.test(headSection);
      return !headHasRobots;
    })();

    // Protocol-relative resource links (Screaming Frog: Security > Protocol-Relative Resource Links)
    const protocolRelativeLinks = countMatches(/(?:src|href)=["']\/\/[^"']+["']/gi);

    // Hreflang missing self-reference (Screaming Frog: Hreflang > Missing Self Reference)
    const hreflangMissingSelf = hreflangTags.length > 0 && !hreflangTags.some(t => {
      try {
        const hrefNorm = new URL(t.href, finalUrl).href.replace(/\/$/, '');
        const pageNorm = finalUrl.replace(/\/$/, '');
        return hrefNorm === pageNorm;
      } catch { return t.href === finalUrl; }
    });

    // Hreflang missing x-default (Screaming Frog: Hreflang > Missing X-Default)
    const hreflangMissingXDefault = hreflangTags.length > 0 && !hreflangTags.some(t => t.lang.toLowerCase() === 'x-default');

    // Internal links with nofollow (Screaming Frog: Links > Internal Nofollow Outlinks)
    const internalNofollowLinks = (() => {
      let count = 0;
      const linkMatches = [...html.matchAll(/<a\s([^>]*href=["'][^"']+["'][^>]*)>/gi)];
      for (const m of linkMatches) {
        const tag = m[1];
        const hrefMatch = /href=["']([^"']+)["']/i.exec(tag);
        if (!hrefMatch) continue;
        const href = hrefMatch[1];
        if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;
        try {
          const resolved = new URL(href, finalUrl);
          if (resolved.hostname !== host) continue;
          if (/rel=["'][^"']*nofollow[^"']*["']/i.test(tag)) count++;
        } catch { /* skip invalid URLs */ }
      }
      return count;
    })();

    // H2 headings over 70 characters (Screaming Frog: H2 > Over 70 Characters)
    const longH2Count = headingHierarchy.filter(h => h.level === 2 && h.text.length > 70).length;

    // ── ROUND 10: MASSIVE AUDIT (Google Search Central, Bing, Screaming Frog, Lighthouse, Yoast) ──

    // Invalid elements in <head> — Google stops parsing <head> after encountering these (Google Search Central)
    const invalidHeadElements = (() => {
      if (!headSection) return [];
      const found = [];
      if (/<iframe[\s>]/i.test(headSection)) found.push('iframe');
      if (/<img[\s>]/i.test(headSection)) found.push('img');
      if (/<div[\s>]/i.test(headSection)) found.push('div');
      if (/<video[\s>]/i.test(headSection)) found.push('video');
      if (/<audio[\s>]/i.test(headSection)) found.push('audio');
      return found;
    })();

    // Googlebot-specific meta directives (Google Special Tags)
    const googlebotMeta = matchOne(/<meta[^>]+name=["']googlebot["'][^>]+content=["']([\s\S]*?)["']/i);

    // ALL CAPS headings detection (readability / Yoast)
    const allCapsHeadings = headingHierarchy.filter(h => h.text.length > 3 && h.text === h.text.toUpperCase() && /[A-Z]/.test(h.text)).length;

    // Content freshness — detect stale content (Yoast Premium: stale cornerstone)
    const contentFreshnessYears = (() => {
      const rawDate = datePublished || dateModified;
      if (!rawDate) return null;
      try {
        const pubDate = new Date(rawDate);
        if (isNaN(pubDate.getTime())) return null;
        const diffMs = Date.now() - pubDate.getTime();
        return +(diffMs / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
      } catch { return null; }
    })();

    // Inline CSS size — total bytes in <style> tags (performance bloat)
    const inlineCSSBytes = (() => {
      const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      return styles.reduce((sum, m) => sum + Buffer.byteLength(m[1], 'utf8'), 0);
    })();

    // Inline JS size — <script> tags WITHOUT src attribute (inline code bloat)
    const inlineJSBytes = (() => {
      const scripts = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)];
      return scripts.reduce((sum, m) => sum + Buffer.byteLength(m[1], 'utf8'), 0);
    })();

    // Iframe count (crawlability / performance concern)
    const iframeCount = countMatches(/<iframe[\s>]/gi);

    // Render-blocking scripts in <head> — <script> without async or defer (Lighthouse)
    const renderBlockingScripts = (() => {
      if (!headSection) return 0;
      const scriptTags = [...headSection.matchAll(/<script([^>]*)>/gi)];
      return scriptTags.filter(m => {
        const attrs = m[1];
        if (/\bsrc\b/i.test(attrs) && !/\basync\b/i.test(attrs) && !/\bdefer\b/i.test(attrs) && !/type=["']application\/ld\+json["']/i.test(attrs)) return true;
        return false;
      }).length;
    })();

    // Duplicate internal links — same href appearing multiple times (Screaming Frog / Sitebulb)
    const duplicateInternalLinks = (() => {
      const seen = {};
      let dupes = 0;
      for (const link of internalLinkDetails) {
        const norm = link.href.replace(/\/$/, '').toLowerCase();
        if (seen[norm]) dupes++;
        else seen[norm] = true;
      }
      return dupes;
    })();

    // Lazy-loading on first image — loading="lazy" on LCP candidate image (Lighthouse)
    const firstImgLazyLoaded = (() => {
      if (imgTags.length === 0) return false;
      return /loading=["']lazy["']/i.test(imgTags[0]);
    })();

    // Data URI images — base64 inline images that bloat HTML (performance)
    const dataURIImages = imgTags.filter(attrs => /src=["']data:/i.test(attrs)).length;

    // ── ROUND 11: MEGA AUDIT — 50 new extraction checks ──────────────────────

    // --- HTML5 Semantic Structure ---
    const semanticElements = {
      main: countMatches(/<main[\s>]/gi),
      article: countMatches(/<article[\s>]/gi),
      section: countMatches(/<section[\s>]/gi),
      nav: countMatches(/<nav[\s>]/gi),
      aside: countMatches(/<aside[\s>]/gi),
      header: countMatches(/<header[\s>]/gi),
      footer: countMatches(/<footer[\s>]/gi),
    };
    const semanticElementCount = Object.values(semanticElements).reduce((a, b) => a + b, 0);
    const hasMultipleMain = semanticElements.main > 1;

    // Nested <a> tags — invalid HTML (W3C spec violation, confuses crawlers)
    const nestedAnchorTags = (() => {
      let count = 0;
      const aMatches = [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)];
      for (const m of aMatches) {
        if (/<a\s/i.test(m[1])) count++;
      }
      return count;
    })();

    // Empty <p> tags — DOM clutter
    const emptyParagraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .filter(m => m[1].replace(/<br\s*\/?>/gi, '').replace(/<[^>]*>/g, '').trim().length === 0).length;

    // HTML comments containing sensitive info (TODO, FIXME, password, api_key, secret)
    const sensitiveComments = (() => {
      const comments = [...html.matchAll(/<!--([\s\S]*?)-->/g)].map(m => m[1]);
      const patterns = /\b(TODO|FIXME|HACK|BUG|XXX|password|passwd|api[_-]?key|secret|token|credentials|private[_-]?key)\b/i;
      return comments.filter(c => patterns.test(c)).length;
    })();

    // --- Meta & Head Enhancements ---
    const metaKeywords = matchOne(/<meta[^>]+name=["']keywords["'][^>]+content=["']([\s\S]*?)["']/i);
    const themeColor = matchOne(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([\s\S]*?)["']/i);
    const langMismatch = !!(contentLanguageHeader && langTag &&
      contentLanguageHeader.toLowerCase().split('-')[0] !== langTag.toLowerCase().split('-')[0]);
    const preconnectCount = countMatches(/<link[^>]+rel=["']preconnect["']/gi);
    const dnsPrefetchCount = countMatches(/<link[^>]+rel=["']dns-prefetch["']/gi);
    const preloadCount = countMatches(/<link[^>]+rel=["']preload["']/gi);
    const hasNosnippet = !!(robotsMeta && /nosnippet/i.test(robotsMeta));
    const metaGenerator = matchOne(/<meta[^>]+name=["']generator["'][^>]+content=["']([\s\S]*?)["']/i);

    // --- Link Quality Deep Checks ---
    const shortAnchorLinks = (() => {
      const allAnchors = [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)];
      return allAnchors.filter(m => {
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        return text.length >= 1 && text.length <= 2;
      }).length;
    })();
    const longAnchorLinks = (() => {
      const allAnchors = [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)];
      return allAnchors.filter(m => {
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        return text.length > 100;
      }).length;
    })();
    const jsVoidLinks = countMatches(/<a[^>]+href=["']javascript:\s*(void\s*\(|;|$)/gi);
    const telLinks = [...html.matchAll(/<a[^>]+href=["'](tel:[^"']+)["']/gi)].map(m => m[1]);
    const malformedTelLinks = telLinks.filter(t => !/^tel:\+?\d[\d\s\-().]{4,}$/.test(t)).length;
    const urlAsAnchorText = (() => {
      const allAnchors = [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)];
      return allAnchors.filter(m => {
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        return /^https?:\/\//i.test(text) && text.length > 10;
      }).length;
    })();
    const sponsoredLinks = countMatches(/rel=["'][^"']*sponsored[^"']*["']/gi);
    const ugcLinks = countMatches(/rel=["'][^"']*ugc[^"']*["']/gi);
    const httpInternalLinks = (() => {
      if (!isPageHttps) return 0;
      return allLinks.filter(l => {
        try {
          const u = new URL(l, finalUrl);
          return u.hostname === host && u.protocol === 'http:';
        } catch { return false; }
      }).length;
    })();

    // --- Image Advanced Checks ---
    const svgWithoutTitle = (() => {
      const svgs = [...html.matchAll(/<svg[^>]*>([\s\S]*?)<\/svg>/gi)];
      return svgs.filter(m => !/<title/i.test(m[1]) && !/aria-label/i.test(m[0])).length;
    })();
    const pictureElements = countMatches(/<picture[\s>]/gi);
    const srcsetImages = countMatches(/srcset=/gi);
    const fetchpriorityImages = imgTags.filter(attrs => /fetchpriority=/i.test(attrs)).length;
    const oversizedImages = imgTags.filter(attrs => {
      const w = /width=["']?(\d+)/i.exec(attrs);
      const h = /height=["']?(\d+)/i.exec(attrs);
      return (w && parseInt(w[1]) > 2000) || (h && parseInt(h[1]) > 2000);
    }).length;
    const longImageFilenames = imgTags.filter(attrs => {
      const src = /src=["']([^"']+)["']/i.exec(attrs);
      if (!src) return false;
      const fn = src[1].split('/').pop().split('?')[0];
      return fn.length > 100;
    }).length;

    // --- Content Quality Signals ---
    const hiddenTextElements = (() => {
      const hidden = [...html.matchAll(/style=["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["'][^>]*>([\s\S]*?)<\//gi)];
      return hidden.filter(m => {
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        return text.length > 50;
      }).length;
    })();
    const tablesWithoutHeaders = (() => {
      const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
      return tables.filter(m => !/<th[\s>]/i.test(m[1])).length;
    })();
    const hasBreadcrumbNav = /<nav[^>]*aria-label=["'][^"']*breadcrumb[^"']*["']/i.test(html) ||
                              /"BreadcrumbList"/i.test(html) ||
                              /class=["'][^"']*breadcrumb[^"']*["']/i.test(html);
    const hasContactInfo = (() => {
      const hasPhone = /\b(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/.test(textContent);
      const hasAddress = /\b\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court)\b/i.test(textContent);
      const hasPrivacy = /<a[^>]+href=["'][^"']*(privacy|terms|legal)[^"']*["']/i.test(html);
      return { phone: hasPhone, address: hasAddress, privacyLink: hasPrivacy, score: (hasPhone ? 1 : 0) + (hasAddress ? 1 : 0) + (hasPrivacy ? 1 : 0) };
    })();
    const strongTagCount = countMatches(/<(strong|b)[\s>]/gi);
    const linkTextLength = [...html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)]
      .reduce((sum, m) => sum + m[1].replace(/<[^>]*>/g, '').trim().length, 0);
    const linkToContentRatio = textLen > 0 ? Math.round((linkTextLength / textLen) * 100) : 0;
    const wordRepetition = (() => {
      if (words.length < 50) return null;
      const freq = {};
      const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','during','before','after','above','below','between','is','are','was','were','be','been','being','have','has','had','having','do','does','did','will','would','shall','should','may','might','can','could','that','this','these','those','it','its','not','no','nor','so','if','then','than','too','very']);
      for (const w of words) {
        const lower = w.toLowerCase().replace(/[^a-z']/g, '');
        if (lower.length < 3 || stopWords.has(lower)) continue;
        freq[lower] = (freq[lower] || 0) + 1;
      }
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      const overused = sorted.filter(([, count]) => (count / words.length) * 100 > 3).map(([word, count]) => ({ word, count, percent: +((count / words.length) * 100).toFixed(1) }));
      return overused.length > 0 ? overused.slice(0, 5) : null;
    })();

    // --- Schema Enhanced ---
    const jsonLdValidity = (() => {
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      if (scripts.length === 0) return { count: 0, valid: 0, invalid: 0, errors: [] };
      let valid = 0, invalid = 0;
      const errors = [];
      for (const m of scripts) {
        try { JSON.parse(m[1]); valid++; } catch (e) { invalid++; errors.push(e.message.substring(0, 80)); }
      }
      return { count: scripts.length, valid, invalid, errors };
    })();
    const articleSchemaComplete = (() => {
      if (!schemaTypes.includes('Article') && !schemaTypes.includes('NewsArticle') && !schemaTypes.includes('BlogPosting')) return null;
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of scripts) {
        try {
          const j = JSON.parse(m[1]);
          const items = j['@graph'] ? j['@graph'] : [j];
          for (const item of items) {
            if (['Article', 'NewsArticle', 'BlogPosting'].includes(item['@type'])) {
              return {
                hasHeadline: !!item.headline,
                hasAuthor: !!item.author,
                hasDatePublished: !!item.datePublished,
                hasImage: !!item.image,
                hasPublisher: !!item.publisher,
              };
            }
          }
        } catch { /* skip invalid JSON */ }
      }
      return null;
    })();
    const hasReviewSchema = schemaTypes.includes('Review') || schemaTypes.includes('AggregateRating');

    // --- Technical Advanced ---
    const canonicalHasQueryString = !!(canonicalUrl && /\?/.test(canonicalUrl));
    const ampLink = matchOne(/<link[^>]+rel=["']amphtml["'][^>]+href=["']([\s\S]*?)["']/i);
    const pwaManifest = !!matchOne(/<link[^>]+rel=["']manifest["'][^>]+href=["']([\s\S]*?)["']/i);
    const sourceMapExposure = (() => {
      const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)];
      return inlineScripts.filter(m => /sourceMappingURL/i.test(m[1])).length;
    })();
    const debugStatements = (() => {
      const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)];
      let count = 0;
      for (const m of inlineScripts) {
        if (/type=["']application\/ld\+json["']/i.test(m[0])) continue;
        count += (m[1].match(/console\.(log|debug|warn|info|trace)\s*\(/g) || []).length;
      }
      return count;
    })();
    const hasBaseTag = /<base\s/i.test(headSection || '');
    const canonicalOgUrlMismatch = (() => {
      if (!canonicalUrl || !ogUrl) return false;
      try {
        const c = new URL(canonicalUrl, finalUrl).href.replace(/\/$/, '');
        const o = new URL(ogUrl, finalUrl).href.replace(/\/$/, '');
        return c !== o;
      } catch { return false; }
    })();
    const hasPaginationRel = {
      next: /<link[^>]+rel=["']next["']/i.test(html),
      prev: /<link[^>]+rel=["']prev["']/i.test(html),
    };

    // ── ROUND 12: MEGA AUDIT II — 50 new extraction checks ──────────────────────

    // --- Performance & CLS Prevention ---
    const documentWriteUsage = (() => {
      const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)];
      let count = 0;
      for (const m of inlineScripts) {
        if (/type=["']application\/ld\+json["']/i.test(m[0])) continue;
        count += (m[1].match(/document\.write\s*\(/g) || []).length;
      }
      return count;
    })();
    const cssImportStatements = (() => {
      const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      let count = 0;
      for (const m of styles) count += (m[1].match(/@import\s/g) || []).length;
      return count;
    })();
    const fontDisplayMissing = (() => {
      const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join(' ');
      const fontFaces = styles.match(/@font-face\s*\{[^}]*\}/gi) || [];
      return fontFaces.filter(ff => !/font-display\s*:/i.test(ff)).length;
    })();
    const fontPreloadWithoutCrossorigin = (() => {
      const preloads = [...html.matchAll(/<link[^>]+rel=["']preload["'][^>]*>/gi)];
      return preloads.filter(m => {
        const tag = m[0];
        return /as=["']font["']/i.test(tag) && !/crossorigin/i.test(tag);
      }).length;
    })();
    const thirdPartyScriptCount = (() => {
      const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
      return scripts.filter(m => {
        try {
          const u = new URL(m[1], finalUrl);
          return u.hostname !== host;
        } catch { return false; }
      }).length;
    })();
    const externalCSSCount = countMatches(/<link[^>]+rel=["']stylesheet["']/gi);
    const externalJSCount = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].length;
    const bodySection = html.replace(/<head[\s\S]*?<\/head>/gi, '');
    const bodyInlineStyles = (bodySection.match(/<style[\s>]/gi) || []).length;
    const videoTags = [...html.matchAll(/<video([^>]*)>/gi)].map(m => m[1]);
    const videoWithoutPoster = videoTags.filter(attrs => !/poster=/i.test(attrs)).length;

    // --- Accessibility-SEO Overlap (WCAG, Lighthouse) ---
    const hasSkipLink = /<a[^>]+href=["']#(main|content|skip|maincontent)[^"']*["']/i.test(html) ||
                        /class=["'][^"']*skip[^"']*["']/i.test(html);
    const ariaLandmarks = (() => {
      const hasMain = semanticElements.main > 0 || /role=["']main["']/i.test(html);
      const hasNav = semanticElements.nav > 0 || /role=["']navigation["']/i.test(html);
      const hasBanner = semanticElements.header > 0 || /role=["']banner["']/i.test(html);
      const hasContentinfo = semanticElements.footer > 0 || /role=["']contentinfo["']/i.test(html);
      const missing = [];
      if (!hasMain) missing.push('main');
      if (!hasNav) missing.push('navigation');
      if (!hasBanner) missing.push('banner/header');
      if (!hasContentinfo) missing.push('contentinfo/footer');
      return { main: hasMain, nav: hasNav, banner: hasBanner, contentinfo: hasContentinfo, missing };
    })();
    const formWithoutLabels = (() => {
      const inputs = [...html.matchAll(/<input([^>]*)>/gi)];
      return inputs.filter(m => {
        const attrs = m[1];
        if (/type=["'](hidden|submit|button|reset|image)["']/i.test(attrs)) return false;
        const id = /id=["']([^"']+)["']/i.exec(attrs);
        if (id && new RegExp(`<label[^>]+for=["']${id[1]}["']`, 'i').test(html)) return false;
        if (/aria-label(ledby)?=/i.test(attrs)) return false;
        if (/placeholder=/i.test(attrs)) return false;
        return true;
      }).length;
    })();
    const tabindexPositive = (html.match(/tabindex=["']\d+["']/gi) || [])
      .filter(m => parseInt(m.match(/\d+/)[0]) > 0).length;
    const emptyButtons = [...html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/gi)]
      .filter(m => {
        const text = m[2].replace(/<[^>]*>/g, '').trim();
        if (text.length > 0) return false;
        return !/aria-label/i.test(m[1]) && !/title=/i.test(m[1]);
      }).length;
    const duplicateIds = (() => {
      const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
      const seen = {};
      let dupes = 0;
      for (const id of ids) {
        if (seen[id]) dupes++;
        else seen[id] = true;
      }
      return dupes;
    })();
    const autofocusElements = countMatches(/\bautofocus\b/gi);
    const videoWithoutCaptions = videoTags.length - [...html.matchAll(/<video[^>]*>([\s\S]*?)<\/video>/gi)]
      .filter(m => /<track/i.test(m[1])).length;

    // --- E-Commerce & Product Schema (Google Product Structured Data) ---
    const productSchemaComplete = (() => {
      if (!schemaTypes.includes('Product')) return null;
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of scripts) {
        try {
          const j = JSON.parse(m[1]);
          const items = j['@graph'] ? j['@graph'] : [j];
          for (const item of items) {
            if (item['@type'] === 'Product') {
              return {
                hasName: !!item.name,
                hasOffers: !!(item.offers || item.offer),
                hasImage: !!item.image,
                hasBrand: !!item.brand,
                hasDescription: !!item.description,
                hasSku: !!item.sku,
                hasGtin: !!(item.gtin || item.gtin13 || item.gtin12 || item.gtin14 || item.gtin8),
                hasAggregateRating: !!item.aggregateRating,
                hasReview: !!item.review,
                hasAvailability: !!(item.offers && (item.offers.availability || (Array.isArray(item.offers) && item.offers[0] && item.offers[0].availability))),
                hasPriceCurrency: !!(item.offers && (item.offers.priceCurrency || (Array.isArray(item.offers) && item.offers[0] && item.offers[0].priceCurrency))),
              };
            }
          }
        } catch { /* skip */ }
      }
      return null;
    })();
    const hasFAQSchema = schemaTypes.includes('FAQPage');
    const breadcrumbSchemaComplete = (() => {
      if (!schemaTypes.includes('BreadcrumbList')) return { hasSchema: false, missingFields: [] };
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of scripts) {
        try {
          const j = JSON.parse(m[1]);
          const items = j['@graph'] ? j['@graph'] : [j];
          for (const item of items) {
            if (item['@type'] === 'BreadcrumbList') {
              const missing = [];
              if (!item.itemListElement || !Array.isArray(item.itemListElement) || item.itemListElement.length === 0) missing.push('itemListElement');
              else {
                const first = item.itemListElement[0];
                if (!first.name && !(first.item && first.item.name)) missing.push('name');
                if (!first.item && !first['@id']) missing.push('item/URL');
              }
              return { hasSchema: true, missingFields: missing };
            }
          }
        } catch { /* skip */ }
      }
      return { hasSchema: false, missingFields: [] };
    })();
    const hasOrganizationSchema = schemaTypes.includes('Organization') || schemaTypes.includes('LocalBusiness');
    const hasVideoSchema = schemaTypes.includes('VideoObject');

    // --- Content Patterns ---
    const outdatedCopyright = (() => {
      const cpMatch = /(?:©|&copy;|copyright)\s*(\d{4})/i.exec(textContent);
      if (!cpMatch) return null;
      const year = parseInt(cpMatch[1]);
      const currentYear = new Date().getFullYear();
      const yearsOld = currentYear - year;
      return yearsOld > 0 ? { year, yearsOld } : null;
    })();
    const stockPhotoFilenames = imgTags.filter(attrs => {
      const src = /src=["']([^"']+)["']/i.exec(attrs);
      if (!src) return false;
      return /shutterstock|istockphoto|istock|depositphotos|pexels|pixabay|unsplash|dreamstime|123rf|adobe[_-]?stock|gettyimages/i.test(src[1]);
    }).length;
    const hasListElements = countMatches(/<(ul|ol)[\s>]/gi) > 0;
    const excessiveExclamations = (textContent.match(/!/g) || []).length;
    const fragmentOnlyLinks = allLinks.filter(l => /^#/.test(l)).length;

    // --- URL & Crawlability ---
    const urlDepth = (() => {
      try {
        const segments = new URL(finalUrl).pathname.split('/').filter(Boolean);
        return segments.length;
      } catch { return 0; }
    })();
    const hashBangUrl = /\/#!/.test(finalUrl);
    const trailingSlashInconsistency = (() => {
      const internalPaths = internalLinkDetails.map(l => l.href).filter(h => h !== '/');
      if (internalPaths.length < 4) return 0;
      const withSlash = internalPaths.filter(p => p.endsWith('/')).length;
      const withoutSlash = internalPaths.filter(p => !p.endsWith('/') && !p.includes('.')).length;
      return Math.min(withSlash, withoutSlash);
    })();

    // --- Advanced Meta Robots Directives ---
    const robotsDirectives = (robotsMeta || '').toLowerCase();
    const hasMaxImagePreview = /max-image-preview/i.test(robotsDirectives);
    const hasMaxSnippet = /max-snippet/i.test(robotsDirectives);
    const hasNotranslate = /notranslate/i.test(robotsDirectives);
    const hasNoimageindex = /noimageindex/i.test(robotsDirectives);
    const hasUnavailableAfter = /unavailable_after/i.test(robotsDirectives);
    const unavailableAfterDate = (() => {
      const m = /unavailable_after\s*:\s*([^,;]+)/i.exec(robotsMeta || '');
      return m ? m[1].trim() : null;
    })();

    // --- Social & Trust ---
    const hasAboutLink = /<a[^>]+href=["'][^"']*(\/about|about-us|about\.html|who-we-are)[^"']*["']/i.test(html);
    const socialProfileLinks = (() => {
      const socialDomains = /facebook\.com|twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com|tiktok\.com|pinterest\.com|threads\.net/i;
      return allLinks.filter(l => socialDomains.test(l)).length;
    })();
    const hasReturnPolicyLink = /<a[^>]+href=["'][^"']*(return|refund|exchange)[^"']*["']/i.test(html);
    const hasTermsLink = /<a[^>]+href=["'][^"']*(terms|tos|terms-of-service|terms-and-conditions|conditions)[^"']*["']/i.test(html);
    const hasCookieConsent = /cookie[_-]?(consent|banner|notice|policy|popup|bar)|gdpr|ccpa|privacy[_-]?banner/i.test(html);

    // --- Performance resource hints ---
    const dnsPrefetchWithoutPreconnect = (() => {
      const prefetches = [...html.matchAll(/<link[^>]+rel=["']dns-prefetch["'][^>]+href=["']([^"']+)["']/gi)].map(m => {
        try { return new URL(m[1]).hostname; } catch { return m[1].replace(/^\/\//, ''); }
      });
      const preconnects = [...html.matchAll(/<link[^>]+rel=["']preconnect["'][^>]+href=["']([^"']+)["']/gi)].map(m => {
        try { return new URL(m[1]).hostname; } catch { return m[1].replace(/^\/\//, ''); }
      });
      const preconnectSet = new Set(preconnects);
      return prefetches.filter(h => !preconnectSet.has(h)).length;
    })();
    const prefetchHints = countMatches(/<link[^>]+rel=["']prefetch["']/gi);
    const prerenderHints = countMatches(/<link[^>]+rel=["']prerender["']/gi);

    // --- Misc technical ---
    const hasNoscriptContent = /<noscript[^>]*>[\s\S]*?\S[\s\S]*?<\/noscript>/i.test(html);
    const inlineCriticalCSS = /<style[^>]*>[\s\S]{50,}<\/style>/i.test(headSection || '');

    // ── ROUND 13: MEGA AUDIT III — 50 new extraction checks (axe-core 4.10, Screaming Frog Accessibility/Validation, web.dev LCP/CLS, WCAG 2.2) ──

    // --- Accessibility-SEO (axe-core 4.10 / Screaming Frog Accessibility tab) ---

    // 1. Iframes without title attribute (axe: frame-title, WCAG 4.1.2 — Serious)
    const iframesWithoutTitle = [...html.matchAll(/<iframe([^>]*)>/gi)]
      .filter(m => !/title=["'][^"']+["']/i.test(m[1]) && !/aria-label/i.test(m[1])).length;

    // 2. Audio autoplay without controls (axe: no-autoplay-audio, WCAG 1.4.2)
    const audioAutoplay = [...html.matchAll(/<audio([^>]*)>/gi)]
      .filter(m => /autoplay/i.test(m[1]) && !/controls/i.test(m[1])).length;

    // 3. Input type=image without alt (axe: input-image-alt, WCAG 1.1.1)
    const inputImageWithoutAlt = [...html.matchAll(/<input([^>]*)>/gi)]
      .filter(m => /type=["']image["']/i.test(m[1]) && !/alt=["'][^"']+["']/i.test(m[1])).length;

    // 4. Select/textarea without label (axe: select-name, WCAG 4.1.2)
    const selectWithoutLabel = (() => {
      const selects = [...html.matchAll(/<(select|textarea)([^>]*)>/gi)];
      return selects.filter(m => {
        const attrs = m[2];
        const id = /id=["']([^"']+)["']/i.exec(attrs);
        if (id && new RegExp(`<label[^>]+for=["']${id[1]}["']`, 'i').test(html)) return false;
        if (/aria-label(ledby)?=/i.test(attrs)) return false;
        return true;
      }).length;
    })();

    // 5. Duplicate accesskey values (axe: accesskeys — Serious)
    const duplicateAccesskeys = (() => {
      const keys = [...html.matchAll(/accesskey=["']([^"']+)["']/gi)].map(m => m[1].toLowerCase());
      const seen = {};
      let dupes = 0;
      for (const k of keys) { if (seen[k]) dupes++; else seen[k] = true; }
      return dupes;
    })();

    // 6. Elements with role="img" without accessible name (axe: role-img-alt, WCAG 1.1.1)
    const roleImgWithoutAlt = [...html.matchAll(/role=["']img["']([^>]*)/gi)]
      .filter(m => !/alt=["'][^"']+["']/i.test(m[0]) && !/aria-label(ledby)?=["'][^"']+["']/i.test(m[0])).length;

    // 7. Nested interactive elements — button in link or link in button (axe: nested-interactive)
    const nestedInteractive = (() => {
      let count = 0;
      const links = [...html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/gi)];
      for (const m of links) { if (/<button[\s>]/i.test(m[1])) count++; }
      const btns = [...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)];
      for (const m of btns) { if (/<a\s/i.test(m[1])) count++; }
      return count;
    })();

    // 8. <area> elements without alt text (axe: area-alt, WCAG 2.4.4)
    const areaWithoutAlt = [...html.matchAll(/<area([^>]*)>/gi)]
      .filter(m => !/alt=["'][^"']+["']/i.test(m[1])).length;

    // 9. Invalid list structure — ul/ol with non-li direct children (axe: list)
    const invalidListStructure = (() => {
      const lists = [...html.matchAll(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi)];
      let violations = 0;
      for (const m of lists) {
        const content = m[2].replace(/<(ul|ol)[^>]*>[\s\S]*?<\/\1>/gi, '');
        const directTags = content.match(/<(?!\/?li[\s>]|!--)([a-z][a-z0-9]*)/gi) || [];
        if (directTags.length > 0) violations++;
      }
      return violations;
    })();

    // 10. Focusable elements inside aria-hidden (axe: aria-hidden-focus — Serious)
    const focusableAriaHidden = (() => {
      const hidden = [...html.matchAll(/aria-hidden=["']true["'][^>]*>([\s\S]*?)<\//gi)];
      let count = 0;
      for (const m of hidden) {
        if (/<(a\s[^>]*href|button|input|select|textarea|iframe)[\s>]/i.test(m[1])) count++;
      }
      return count;
    })();

    // 11. <dl> structure violations (axe: definition-list)
    const dlStructureViolations = (() => {
      const dls = [...html.matchAll(/<dl[^>]*>([\s\S]*?)<\/dl>/gi)];
      let violations = 0;
      for (const m of dls) {
        const content = m[1].replace(/<dl[^>]*>[\s\S]*?<\/dl>/gi, '');
        const directTags = [...content.matchAll(/<([a-z][a-z0-9]*)/gi)].map(t => t[1].toLowerCase());
        const invalid = directTags.filter(t => !['dt', 'dd', 'div', 'script', 'template'].includes(t));
        if (invalid.length > 0) violations++;
      }
      return violations;
    })();

    // 12. Multiple <nav> without distinct aria-label (Screaming Frog: Landmarks Require Unique Name)
    const multipleNavWithoutLabel = (() => {
      if (semanticElements.nav <= 1) return 0;
      const navs = [...html.matchAll(/<nav([^>]*)>/gi)];
      const unlabeled = navs.filter(m => !/aria-label(ledby)?=/i.test(m[1])).length;
      return unlabeled > 1 ? unlabeled : 0;
    })();

    // 13. <object> without fallback text (axe: object-alt, WCAG 1.1.1)
    const objectWithoutFallback = [...html.matchAll(/<object([^>]*)>([\s\S]*?)<\/object>/gi)]
      .filter(m => {
        const inner = m[2].replace(/<[^>]*>/g, '').trim();
        return inner.length === 0 && !/aria-label/i.test(m[1]) && !/title=/i.test(m[1]);
      }).length;

    // --- Performance & CLS (web.dev LCP/CLS, Lighthouse) ---

    // 14. All images have loading="lazy" — no eager image for LCP (web.dev LCP optimization)
    const allImagesLazy = (() => {
      if (imgTags.length < 2) return false;
      const lazyCount = imgTags.filter(a => /loading=["']lazy["']/i.test(a)).length;
      return lazyCount === imgTags.length;
    })();

    // 15. <link rel=preload> without "as" attribute (Lighthouse: uses-rel-preload)
    const preloadWithoutAs = (() => {
      const preloads = [...html.matchAll(/<link[^>]+rel=["']preload["'][^>]*>/gi)];
      return preloads.filter(m => !/\bas=/i.test(m[0])).length;
    })();

    // 16. Preconnect/dns-prefetch to same origin (unnecessary, wastes connection setup)
    const preconnectSameOrigin = (() => {
      const hints = [...html.matchAll(/<link[^>]+rel=["'](preconnect|dns-prefetch)["'][^>]+href=["']([^"']+)["']/gi)];
      return hints.filter(m => {
        try { return new URL(m[2]).hostname === host; } catch { return false; }
      }).length;
    })();

    // 17. Inline event handlers (onclick, onmouseover, etc. — CSP/accessibility)
    const inlineEventHandlers = (() => {
      const handlerPattern = /\b(onclick|onmouseover|onmouseout|onmousedown|onmouseup|onkeydown|onkeyup|onkeypress|onload|onerror|onfocus|onblur|onchange|onsubmit|onreset|onscroll|onresize|ondblclick|oncontextmenu|ontouchstart|ontouchend)\s*=/gi;
      return (html.match(handlerPattern) || []).length;
    })();

    // 18. Excessive HTML comments (bandwidth waste, potential info leakage)
    const htmlCommentCount = (html.match(/<!--[\s\S]*?-->/g) || []).length;

    // 19. CDN scripts without subresource integrity (SRI — security)
    const sriMissingOnCDN = (() => {
      const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']([^>]*)>/gi)];
      return scripts.filter(m => {
        try {
          const u = new URL(m[1], finalUrl);
          if (u.hostname === host) return false;
          return !/integrity=/i.test(m[2] + m[0]);
        } catch { return false; }
      }).length;
    })();

    // 20. Cache-Control: no-store prevents all caching (Lighthouse)
    const cacheControlNoStore = !!(cacheControl && /no-store/i.test(cacheControl));

    // --- Technical SEO (Screaming Frog, Google, Lighthouse) ---

    // 21. X-UA-Compatible meta tag present (outdated IE meta)
    const xUaCompatibleMeta = /<meta[^>]+http-equiv=["']X-UA-Compatible["']/i.test(html);

    // 22. Meta keywords tag present (deprecated by Google since 2009)
    const metaKeywordsPresent = !!(metaKeywords && metaKeywords.trim().length > 0);

    // 23. RSS/Atom feed link detected (positive SEO signal)
    const rssFeedLink = /<link[^>]+type=["'](application\/rss\+xml|application\/atom\+xml)["']/i.test(html);

    // 24. Internal links with target="_blank" (UX anti-pattern)
    const internalTargetBlank = (() => {
      const anchors = [...html.matchAll(/<a([^>]*)href=["']([^"']+)["']([^>]*)>/gi)];
      return anchors.filter(m => {
        const href = m[2];
        const attrs = m[1] + ' ' + m[3];
        if (!/target=["']_blank["']/i.test(attrs)) return false;
        try { return new URL(href, finalUrl).hostname === host; } catch { return href.startsWith('/'); }
      }).length;
    })();

    // 25. <form> without action attribute
    const formWithoutAction = [...html.matchAll(/<form([^>]*)>/gi)]
      .filter(m => !/action=/i.test(m[1])).length;

    // 26. Form inputs outside <form> tag (orphaned inputs)
    const orphanedFormInputs = (() => {
      const allInputs = countMatches(/<input[\s>]/gi) + countMatches(/<select[\s>]/gi) + countMatches(/<textarea[\s>]/gi);
      const formContent = [...html.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/gi)].map(m => m[1]).join(' ');
      const inputsInForms = (formContent.match(/<(input|select|textarea)[\s>]/gi) || []).length;
      return Math.max(0, allInputs - inputsInForms);
    })();

    // 27. Missing dir attribute for RTL language codes
    const dirMissingForRTL = (() => {
      if (!langTag) return false;
      const rtlLangs = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'ku', 'ckb', 'syr', 'dv'];
      const baseLang = langTag.toLowerCase().split('-')[0];
      if (!rtlLangs.includes(baseLang)) return false;
      return !/<html[^>]+dir=/i.test(html);
    })();

    // 28. Broken bookmarks — #id links targeting non-existent IDs (Screaming Frog: URL > Broken Bookmark)
    const brokenBookmarks = (() => {
      const idLinks = [...html.matchAll(/<a[^>]+href=["']#([^"']+)["']/gi)].map(m => m[1]);
      if (idLinks.length === 0) return 0;
      const pageIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]));
      return idLinks.filter(id => !pageIds.has(id)).length;
    })();

    // 29. Image alt text matches filename — lazy/auto-generated alt (Moz, Semrush)
    const imgAltMatchesFilename = imgTags.filter(attrs => {
      const altM = /alt=["']([^"']+)["']/i.exec(attrs);
      const srcM = /src=["']([^"']+)["']/i.exec(attrs);
      if (!altM || !srcM) return false;
      const alt = altM[1].toLowerCase().trim();
      const fn = srcM[1].split('/').pop().split('?')[0].replace(/\.\w+$/, '').replace(/[-_]/g, ' ').toLowerCase().trim();
      return alt === fn && fn.length > 2;
    }).length;

    // 30. HTML lang attribute is not a valid ISO 639-1 code (axe: html-lang-valid)
    const htmlLangInvalid = (() => {
      if (!langTag) return false;
      const baseLang = langTag.toLowerCase().split('-')[0];
      return !validLangCodes.has(baseLang);
    })();

    // --- Content & Structure (Screaming Frog Validation, Lighthouse) ---

    // 31. <blockquote> without cite attribute (semantic completeness)
    const blockquoteWithoutCite = [...html.matchAll(/<blockquote([^>]*)>/gi)]
      .filter(m => !/cite=/i.test(m[1])).length;

    // 32. <main> landmark empty or minimal content
    const mainLandmarkEmpty = (() => {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (!mainMatch) return false;
      const text = mainMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return text.length < 20;
    })();

    // 33. Empty <li> elements
    const emptyListItems = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .filter(m => m[1].replace(/<[^>]*>/g, '').trim().length === 0 && !/<(ul|ol|img)/i.test(m[1])).length;

    // 34. Excessive DOM nesting depth (Lighthouse: DOM size)
    const excessiveDomDepth = (() => {
      let maxDepth = 0, depth = 0;
      const tagPattern = /<\/?([a-z][a-z0-9]*)/gi;
      const voidEls = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
      let match;
      while ((match = tagPattern.exec(html)) !== null) {
        const tag = match[1].toLowerCase();
        if (voidEls.has(tag)) continue;
        if (match[0].startsWith('</')) { depth = Math.max(0, depth - 1); }
        else { depth++; if (depth > maxDepth) maxDepth = depth; }
      }
      return maxDepth;
    })();

    // 35. Total DOM element count (Lighthouse: Avoid excessive DOM size — >1500)
    const totalDomElements = (html.match(/<[a-z][a-z0-9]*/gi) || []).length;

    // 36. <figure> without <figcaption> (HTML5 semantic best practice)
    const figureWithoutFigcaption = [...html.matchAll(/<figure[^>]*>([\s\S]*?)<\/figure>/gi)]
      .filter(m => !/<figcaption/i.test(m[1])).length;

    // 37. Multiple <head> tags (Screaming Frog Validation)
    const multipleHeadTags = countMatches(/<head[\s>]/gi) > 1;

    // 38. Multiple <body> tags (Screaming Frog Validation)
    const multipleBodyTags = countMatches(/<body[\s>]/gi) > 1;

    // 39. Body element content before <html> tag (Screaming Frog Validation)
    const bodyBeforeHtml = (() => {
      const htmlTagPos = html.search(/<html[\s>]/i);
      if (htmlTagPos <= 0) return false;
      const before = html.substring(0, htmlTagPos).replace(/<!DOCTYPE[^>]*>/i, '').replace(/<!--[\s\S]*?-->/g, '').trim();
      return before.length > 0;
    })();

    // 40. Links to documents (PDF/DOC/XLS) without indicating file type (Screaming Frog)
    const linksToDocuments = (() => {
      const docExts = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|csv)(\?|$)/i;
      const docLinks = allLinks.filter(l => docExts.test(l));
      let unlabeled = 0;
      for (const link of docLinks) {
        const extM = link.match(/\.(\w+)(\?|$)/i);
        if (!extM) continue;
        const ext = extM[1].toUpperCase();
        const escaped = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const linkTag = html.match(new RegExp(`<a[^>]*href=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i'));
        if (linkTag) {
          const text = linkTag[1].replace(/<[^>]*>/g, '').trim();
          if (!new RegExp(`\\b(${ext}|download|file)\\b`, 'i').test(text)) unlabeled++;
        }
      }
      return unlabeled;
    })();

    // --- Schema & Rich Results ---

    // 41. LocalBusiness schema completeness (Google Local Business structured data)
    const localBusinessSchemaComplete = (() => {
      const lbTypes = ['LocalBusiness','Restaurant','Store','MedicalBusiness','LodgingBusiness','FoodEstablishment','FinancialService','HealthAndBeautyBusiness','LegalService','AutoRepair','Dentist'];
      if (!schemaTypes.some(t => lbTypes.some(lb => t.includes(lb)))) return null;
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of scripts) {
        try {
          const j = JSON.parse(m[1]);
          const items = j['@graph'] ? j['@graph'] : [j];
          for (const item of items) {
            if (lbTypes.some(lb => (item['@type'] || '').includes(lb))) {
              return {
                hasName: !!item.name, hasAddress: !!(item.address),
                hasTelephone: !!(item.telephone), hasOpeningHours: !!(item.openingHours || item.openingHoursSpecification),
                hasGeo: !!(item.geo), hasUrl: !!(item.url), hasImage: !!(item.image), hasPriceRange: !!(item.priceRange),
              };
            }
          }
        } catch { /* skip */ }
      }
      return null;
    })();

    // 42. HowTo schema detected (positive signal for Google rich results)
    const hasHowToSchema = schemaTypes.includes('HowTo');

    // 43. Event schema detected (positive signal)
    const hasEventSchema = schemaTypes.includes('Event');

    // 44. AggregateRating without required fields (Google: ratingValue and ratingCount required)
    const aggregateRatingIncomplete = (() => {
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of scripts) {
        try {
          const j = JSON.parse(m[1]);
          const items = j['@graph'] ? j['@graph'] : [j];
          for (const item of items) {
            const rating = item.aggregateRating || (item['@type'] === 'AggregateRating' ? item : null);
            if (rating) {
              const missing = [];
              if (!rating.ratingValue) missing.push('ratingValue');
              if (!rating.ratingCount && !rating.reviewCount) missing.push('ratingCount/reviewCount');
              if (!rating.bestRating) missing.push('bestRating');
              return missing.length > 0 ? missing : null;
            }
          }
        } catch { /* skip */ }
      }
      return null;
    })();

    // 45. VideoObject schema missing required fields
    const videoSchemaIncomplete = (() => {
      if (!hasVideoSchema) return null;
      const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of scripts) {
        try {
          const j = JSON.parse(m[1]);
          const items = j['@graph'] ? j['@graph'] : [j];
          for (const item of items) {
            if (item['@type'] === 'VideoObject') {
              const missing = [];
              if (!item.name) missing.push('name');
              if (!item.description) missing.push('description');
              if (!item.thumbnailUrl) missing.push('thumbnailUrl');
              if (!item.uploadDate) missing.push('uploadDate');
              return missing.length > 0 ? missing : null;
            }
          }
        } catch { /* skip */ }
      }
      return null;
    })();

    // --- Links & Navigation ---

    // 46. Mailto links without subject (UX improvement)
    const mailtoWithoutSubject = [...html.matchAll(/<a[^>]+href=["'](mailto:[^"']+)["']/gi)]
      .filter(m => !/subject=/i.test(m[1])).length;

    // 47. Download attribute on external links (cross-origin download may fail)
    const downloadExternalLinks = [...html.matchAll(/<a([^>]*)href=["']([^"']+)["']([^>]*)>/gi)]
      .filter(m => {
        const attrs = m[1] + ' ' + m[3];
        if (!/\bdownload\b/i.test(attrs)) return false;
        try { return new URL(m[2], finalUrl).hostname !== host; } catch { return false; }
      }).length;

    // 48. Tables with many empty cells (accessibility / poor data tables)
    const tablesWithEmptyCells = (() => {
      const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
      let count = 0;
      for (const m of tables) {
        const cells = [...m[1].matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi)];
        if (cells.length < 4) continue;
        const empty = cells.filter(c => c[2].replace(/<[^>]*>/g, '').trim().length === 0).length;
        if (empty / cells.length > 0.5) count++;
      }
      return count;
    })();

    // 49. Duplicate alt text across images (redundant lazy alt — Moz, Semrush)
    const duplicateAltTexts = (() => {
      const alts = imgTags.map(a => {
        const m = /alt=["']([^"']+)["']/i.exec(a);
        return m ? m[1].toLowerCase().trim() : null;
      }).filter(a => a && a.length > 3);
      const freq = {};
      for (const a of alts) freq[a] = (freq[a] || 0) + 1;
      return Object.values(freq).filter(c => c > 1).reduce((sum, c) => sum + c - 1, 0);
    })();

    // 50. Forms without explicit method attribute (defaults to GET)
    const formWithoutMethod = [...html.matchAll(/<form([^>]*)>/gi)]
      .filter(m => !/method=/i.test(m[1])).length;

    // ── ROUND 14: MEGA AUDIT IV — 50 new extraction variables (axe-core 4.10, Lighthouse Best Practices, WCAG 2.2, Schema.org, security) ──

    // --- Accessibility-SEO (axe-core 4.10 remaining) ---
    // 1. aria-hidden="true" on <body>
    const ariaHiddenOnBody = /<body[^>]*aria-hidden\s*=\s*["']true["'][^>]*>/i.test(html);

    // 2. Elements with invalid ARIA roles
    const invalidAriaRoles = (() => {
      const validRoles = new Set(['alert','alertdialog','application','article','banner','button','cell','checkbox','columnheader','combobox','command','comment','complementary','composite','contentinfo','definition','dialog','directory','document','feed','figure','form','generic','grid','gridcell','group','heading','img','input','landmark','link','list','listbox','listitem','log','main','marquee','math','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','meter','navigation','none','note','option','presentation','progressbar','radio','radiogroup','range','region','roletype','row','rowgroup','rowheader','scrollbar','search','searchbox','section','sectionhead','select','separator','slider','spinbutton','status','structure','switch','tab','table','tablist','tabpanel','term','textbox','timer','toolbar','tooltip','tree','treegrid','treeitem','widget','window']);
      return [...html.matchAll(/\brole\s*=\s*["']([^"']+)["']/gi)]
        .filter(m => !m[1].split(/\s+/).every(r => validRoles.has(r.toLowerCase()))).length;
    })();

    // 3. ARIA attributes prohibited for the element's role
    const ariaProhibitedAttrs = (() => {
      // Simplified: role="presentation"/"none" should NOT have aria-label, aria-labelledby, etc.
      return [...html.matchAll(/<[^>]+role\s*=\s*["'](presentation|none)["'][^>]*(aria-(?:label|labelledby|describedby))\s*=/gi)].length;
    })();

    // 4. Form fields with multiple labels
    const formFieldMultipleLabels = (() => {
      const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
      let count = 0;
      for (const id of ids) {
        const labelCount = [...html.matchAll(new RegExp(`<label[^>]*for=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi'))].length;
        if (labelCount > 1) count++;
      }
      return count;
    })();

    // 5. Duplicate iframe titles
    const frameTitleDuplicate = (() => {
      const titles = [...html.matchAll(/<iframe[^>]*title\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(m => m[1].toLowerCase().trim());
      const freq = {};
      for (const t of titles) freq[t] = (freq[t] || 0) + 1;
      return Object.values(freq).filter(c => c > 1).reduce((sum, c) => sum + c - 1, 0);
    })();

    // 6. Meta viewport maximum-scale <5 (axe: meta-viewport-large)
    const metaViewportLargeScale = (() => {
      const vpMatch = (viewportMeta || '').match(/maximum-scale\s*=\s*([\d.]+)/i);
      if (!vpMatch) return true; // no restriction = fine
      return parseFloat(vpMatch[1]) >= 5;
    })();

    // 7. Invalid autocomplete values (WCAG 2.1, axe: autocomplete-valid)
    const autocompleteInvalid = (() => {
      const validTokens = new Set(['on','off','name','honorific-prefix','given-name','additional-name','family-name','honorific-suffix','nickname','email','username','new-password','current-password','one-time-code','organization-title','organization','street-address','address-line1','address-line2','address-line3','address-level4','address-level3','address-level2','address-level1','country','country-name','postal-code','cc-name','cc-given-name','cc-additional-name','cc-family-name','cc-number','cc-exp','cc-exp-month','cc-exp-year','cc-csc','cc-type','transaction-currency','transaction-amount','language','bday','bday-day','bday-month','bday-year','sex','tel','tel-country-code','tel-national','tel-area-code','tel-local','tel-extension','impp','url','photo','section-','shipping','billing']);
      return [...html.matchAll(/<input[^>]*autocomplete\s*=\s*["']([^"']+)["'][^>]*>/gi)]
        .filter(m => {
          const tokens = m[1].toLowerCase().trim().split(/\s+/);
          return !tokens.every(t => validTokens.has(t) || t.startsWith('section-'));
        }).length;
    })();

    // 8. Server-side image maps (ismap on img)
    const serverSideImageMap = [...html.matchAll(/<img[^>]*\bismap\b[^>]*>/gi)].length;

    // 9. <summary> elements without discernible text
    const summaryWithoutName = [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi)]
      .filter(m => m[1].replace(/<[^>]*>/g, '').trim().length === 0).length;

    // 10. Scope attribute invalid (used on non-th or with invalid value)
    const scopeAttrInvalid = [...html.matchAll(/<(?!th\b)(\w+)[^>]*\bscope\s*=\s*["'][^"']*["'][^>]*>/gi)].length
      + [...html.matchAll(/<th[^>]*\bscope\s*=\s*["'](?!row|col|rowgroup|colgroup)([^"']*)["'][^>]*>/gi)].length;

    // 11. Presentation role conflict
    const presentationRoleConflict = [...html.matchAll(/<[^>]+role\s*=\s*["'](presentation|none)["'][^>]*>/gi)]
      .filter(m => /(?:tabindex|aria-(?!hidden))\s*=/i.test(m[0])).length;

    // 12. <p> elements styled as headings (bold+large, axe: p-as-heading)
    const pAsHeading = (() => {
      // Check for <p><strong>text</strong></p> or <p><b>text</b></p> patterns where the entire p content is bold
      return [...html.matchAll(/<p[^>]*>\s*<(?:strong|b)>([^<]+)<\/(?:strong|b)>\s*<\/p>/gi)]
        .filter(m => m[1].trim().length > 2 && m[1].trim().length < 120).length;
    })();

    // 13. Image redundant alt (alt text matches adjacent visible text)
    const imageRedundantAlt = (() => {
      let count = 0;
      const matches = [...html.matchAll(/<img[^>]*alt\s*=\s*["']([^"']+)["'][^>]*>/gi)];
      for (const m of matches) {
        const alt = m[1].toLowerCase().trim();
        if (alt.length < 4) continue;
        const pos = m.index + m[0].length;
        const after = html.substring(pos, pos + 200).replace(/<[^>]*>/g, ' ').toLowerCase().trim();
        if (after.startsWith(alt) || after.includes(alt)) count++;
      }
      return count;
    })();

    // --- Lighthouse Best Practices ---
    // 14. Charset too late (>1024 bytes into document)
    const charsetTooLate = (() => {
      const charsetMatch = html.match(/<meta[^>]*charset/i);
      if (!charsetMatch) return true; // missing entirely
      return charsetMatch.index > 1024;
    })();

    // 15. <html manifest=...> Application Cache (deprecated)
    const htmlManifestAttr = /<html[^>]*\bmanifest\s*=/i.test(html);

    // 16. Inputs that prevent pasting
    const pastePrevented = [...html.matchAll(/<input[^>]*onpaste\s*=\s*["'][^"']*return\s*false[^"']*["'][^>]*>/gi)].length;

    // 17. Deprecated API usage (document.all, document.write already covered, but check for other deprecated patterns)
    const deprecatedApis = (() => {
      const patterns = [/document\.all\b/g, /window\.showModalDialog/g, /window\.captureEvents/g, /document\.createAttribute/g];
      let count = 0;
      for (const p of patterns) count += [...html.matchAll(p)].length;
      return count;
    })();

    // --- Content quality & semantic HTML ---
    // 18. Meta description identical to title
    const metaDescMatchesTitle = !!(title && metaDescription && title.trim().toLowerCase() === metaDescription.trim().toLowerCase());

    // 19. Consecutive headings with no content between them
    const consecutiveHeadingsNoContent = (() => {
      let count = 0;
      const headingPairs = [...html.matchAll(/<\/h[1-6]>\s*<h[1-6][^>]*>/gi)];
      count = headingPairs.length;
      return count;
    })();

    // 20. Headings inside anchor tags
    const headingsInsideAnchors = [...html.matchAll(/<a[^>]*>[\s\S]*?<h[1-6][^>]*>/gi)].length;

    // 21. Phone numbers not wrapped in tel: links
    const phoneNumbersNotLinked = (() => {
      const phoneRegex = /(?<![href=["']tel:])(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
      const textOnly = html.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, '').replace(/<[^>]*>/g, ' ');
      const phones = textOnly.match(phoneRegex) || [];
      // Filter out things that look like dates, zip codes, or IDs
      return phones.filter(p => p.replace(/\D/g, '').length >= 7 && p.replace(/\D/g, '').length <= 15).length;
    })();

    // 22. Uses <address> element
    const hasAddressElement = /<address[^>]*>/i.test(html);

    // 23. <time> elements with datetime
    const timeElementCount = [...html.matchAll(/<time[^>]*datetime\s*=/gi)].length;

    // 24. <details> without <summary>
    const detailsWithoutSummary = (() => {
      const details = [...html.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/gi)];
      return details.filter(d => !/<summary/i.test(d[1])).length;
    })();

    // 25. Nested forms (invalid HTML)
    const nestedForms = (() => {
      let depth = 0, nested = 0;
      const tags = [...html.matchAll(/<(\/?)form[\s>]/gi)];
      for (const t of tags) {
        if (t[1] === '') { if (depth > 0) nested++; depth++; }
        else { depth = Math.max(0, depth - 1); }
      }
      return nested;
    })();

    // 26. Input without explicit type attribute
    const inputWithoutType = [...html.matchAll(/<input(?=[^>]*>)([^>]*)>/gi)]
      .filter(m => !/\btype\s*=/i.test(m[1])).length;

    // --- Security headers ---
    // 27-28. Cross-Origin policies
    const hasCOOP = !!response.headers.get('cross-origin-opener-policy');
    const hasCOEP = !!response.headers.get('cross-origin-embedder-policy');

    // --- Link quality & navigation ---
    // 29. <a href="#"> used as buttons
    const hashOnlyAnchors = [...html.matchAll(/<a[^>]*href\s*=\s*["']#["'][^>]*>/gi)]
      .filter(m => !/role\s*=\s*["']button["']/i.test(m[0])).length;

    // 30. Adjacent duplicate links (consecutive links to same URL)
    const adjacentDuplicateLinks = (() => {
      const links = [...html.matchAll(/<a[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi)].map(m => m[1].toLowerCase().trim());
      let count = 0;
      for (let i = 1; i < links.length; i++) {
        if (links[i] === links[i - 1]) count++;
      }
      return count;
    })();

    // 31. Anchor tags without href
    const linksMissingHref = [...html.matchAll(/<a(?=[^>]*>)([^>]*)>/gi)]
      .filter(m => !/\bhref\s*=/i.test(m[1]) && !/\bname\s*=/i.test(m[1]) && !/\bid\s*=/i.test(m[1])).length;

    // 32. Links to same page (self-referencing)
    const linksToSamePage = (() => {
      try {
        const norm = new URL(finalUrl).pathname.toLowerCase();
        return [...html.matchAll(/<a[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi)]
          .filter(m => { try { return new URL(m[1], finalUrl).pathname.toLowerCase() === norm; } catch { return false; } }).length;
      } catch { return 0; }
    })();

    // --- Schema & Rich Results ---
    // 33. Sitelinks Search Box (WebSite schema with SearchAction)
    const hasSitelinksSearchBox = /SearchAction/i.test(html) && /WebSite/i.test(html);

    // 34. Speakable schema
    const hasSpeakableSchema = /speakable/i.test(html) && /application\/ld\+json/i.test(html);

    // 35. Recipe schema completeness
    const recipeSchemaIncomplete = (() => {
      if (!/Recipe/i.test(html) || !/application\/ld\+json/i.test(html)) return null;
      const required = ['name', 'image', 'author', 'datePublished', 'description', 'recipeIngredient', 'recipeInstructions'];
      const jsonBlocks = [...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const block of jsonBlocks) {
        try {
          const parsed = JSON.parse(block[1]);
          const obj = parsed['@type'] === 'Recipe' ? parsed : (Array.isArray(parsed['@graph']) ? parsed['@graph'].find(i => i['@type'] === 'Recipe') : null);
          if (obj) { const missing = required.filter(f => !obj[f]); return missing.length > 0 ? missing : null; }
        } catch {}
      }
      return null;
    })();

    // 36. SoftwareApplication schema
    const hasSoftwareAppSchema = /SoftwareApplication/i.test(html) && /application\/ld\+json/i.test(html);

    // 37. Course schema
    const hasCourseSchema = /Course/i.test(html) && /application\/ld\+json/i.test(html) && !/OfCourse/i.test(html);

    // 38. JobPosting schema
    const hasJobPostingSchema = /JobPosting/i.test(html) && /application\/ld\+json/i.test(html);

    // --- HTML structure & validation ---
    // 39. Data tables without <caption> or aria-label
    const missingTableCaption = (() => {
      const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
      return tables.filter(t => {
        const inner = t[1];
        if (/<caption/i.test(inner)) return false;
        if (/aria-label/i.test(t[0].split('>')[0])) return false;
        // Only count data tables (must have th or thead)
        return /<th[\s>]/i.test(inner) || /<thead/i.test(inner);
      }).length;
    })();

    // 40. Tables using fake captions (bold first row as caption)
    const tableFakeCaption = (() => {
      const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
      return tables.filter(t => {
        if (/<caption/i.test(t[1])) return false;
        // Check if first row has single cell spanning all columns with bold text
        const firstRow = t[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
        if (!firstRow) return false;
        const cells = [...firstRow[1].matchAll(/<t[dh][^>]*>/gi)];
        return cells.length === 1 && /<(?:strong|b)>/i.test(firstRow[1]) && /colspan/i.test(firstRow[1]);
      }).length;
    })();

    // 41. Tables without thead/tbody structure
    const missingTableStructure = (() => {
      const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
      return tables.filter(t => {
        if (/<th[\s>]/i.test(t[1]) || t[1].match(/<tr/gi)?.length > 2) {
          return !/<thead/i.test(t[1]) && !/<tbody/i.test(t[1]);
        }
        return false;
      }).length;
    })();

    // 42. Banner landmark not at top level (nested in article, section, etc.)
    const landmarkBannerNotTopLevel = (() => {
      // Check for <header> elements nested inside <article>, <section>, <aside>, <nav>
      return [...html.matchAll(/<(?:article|section|aside|nav)[^>]*>[\s\S]*?<header[^>]*>/gi)].length;
    })();

    // 43. Contentinfo landmark not at top level
    const landmarkContentinfoNotTopLevel = (() => {
      return [...html.matchAll(/<(?:article|section|aside|nav)[^>]*>[\s\S]*?<footer[^>]*>/gi)].length;
    })();

    // 44. Multiple banner landmarks (multiple top-level <header>)
    const duplicateBannerLandmark = (() => {
      // Count top-level headers (directly under body)
      const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (!bodyContent) return false;
      // Simple approach: count <header> outside of <article>/<section>/<aside>/<nav>
      const stripped = bodyContent[1].replace(/<(?:article|section|aside|nav)[^>]*>[\s\S]*?<\/(?:article|section|aside|nav)>/gi, '');
      return ([...stripped.matchAll(/<header[\s>]/gi)].length) > 1;
    })();

    // 45. Multiple contentinfo landmarks
    const duplicateContentinfoLandmark = (() => {
      const bodyContent = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (!bodyContent) return false;
      const stripped = bodyContent[1].replace(/<(?:article|section|aside|nav)[^>]*>[\s\S]*?<\/(?:article|section|aside|nav)>/gi, '');
      return ([...stripped.matchAll(/<footer[\s>]/gi)].length) > 1;
    })();

    // 46. No <main> landmark (differs from "multiple main" — checks for zero main)
    const noMainLandmark = !/<main[\s>]/i.test(html) && !/role\s*=\s*["']main["']/i.test(html);

    // ── ROUND 15: MEGA AUDIT V — 50 new extraction checks (Screaming Frog 300+ Issues, Sitebulb 15 categories, Ahrefs, Semrush, Google) ──

    // --- URL Hygiene (Sitebulb Internal hints, Screaming Frog URL Issues) ---
    const urlHasUppercase = (() => {
      try { return /[A-Z]/.test(new URL(finalUrl).pathname); } catch { return false; }
    })();
    const urlTooLong = finalUrl.length > 200;
    const urlHasNonAscii = (() => {
      try { return /[^\x00-\x7F]/.test(decodeURIComponent(new URL(finalUrl).pathname)); } catch { return false; }
    })();
    const urlHasDoubleSlashes = (() => {
      try { return /\/\//.test(new URL(finalUrl).pathname.substring(1)); } catch { return false; }
    })();
    const urlHasUnderscores = (() => {
      try { return /_/.test(new URL(finalUrl).pathname); } catch { return false; }
    })();
    const urlHasSessionId = /[?&;](jsessionid|phpsessid|sid|session_id|sessionid|cfid|cftoken|aspsessionid)=/i.test(finalUrl);
    const urlHasEncodedSpaces = /%20/.test(finalUrl);
    const urlHasRepetitiveSegments = (() => {
      try {
        const segs = new URL(finalUrl).pathname.split('/').filter(Boolean);
        const seen = {};
        for (const s of segs) { if (seen[s.toLowerCase()]) return true; seen[s.toLowerCase()] = true; }
        return false;
      } catch { return false; }
    })();

    // --- Viewport / Mobile Friendly (Sitebulb Mobile Friendly hints) ---
    const viewportCount = countMatches(/<meta[^>]+name=["']viewport["']/gi);
    const viewportMissingWidth = !!(viewportMeta && !(/width\s*=/i.test(viewportContent)));
    const viewportFixedWidth = (() => {
      const wm = /width\s*=\s*(\S+)/i.exec(viewportContent);
      return !!(wm && wm[1] !== 'device-width' && /^\d+$/.test(wm[1]));
    })();
    const viewportInitialScaleWrong = (() => {
      const ism = /initial-scale\s*=\s*([\d.]+)/i.exec(viewportContent);
      return !!(ism && parseFloat(ism[1]) !== 1.0);
    })();
    const viewportHasMinScale = /min-scale\s*=/i.test(viewportContent);
    const smallFontInStyles = (() => {
      const matches = [...html.matchAll(/font-size\s*:\s*(\d+)(px|pt)/gi)];
      return matches.filter(m => {
        const size = parseInt(m[1]);
        const unit = m[2].toLowerCase();
        return (unit === 'px' && size < 12) || (unit === 'pt' && size < 9);
      }).length;
    })();

    // --- Performance (Sitebulb Performance hints, Lighthouse, web.dev) ---
    const renderBlockingCSS = (() => {
      if (!headSection) return 0;
      const cssLinks = [...headSection.matchAll(/<link[^>]+rel=["']stylesheet["']([^>]*)>/gi)];
      return cssLinks.filter(m => !/media=["'](print|none|not all)["']/i.test(m[1]) && !/disabled/i.test(m[1])).length;
    })();
    const unminifiedInlineCSS = (() => {
      const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      let count = 0;
      for (const m of styles) {
        const css = m[1].trim();
        if (css.length < 100) continue;
        const lineCount = css.split('\n').length;
        if (lineCount > 5 && lineCount / (css.length / 100) > 0.8) count++;
      }
      return count;
    })();
    const unminifiedInlineJS = (() => {
      const scripts = [...html.matchAll(/<script(?![^>]*\bsrc\b)(?![^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
      let count = 0;
      for (const m of scripts) {
        const js = m[1].trim();
        if (js.length < 200) continue;
        const lineCount = js.split('\n').length;
        if (lineCount > 10 && lineCount / (js.length / 100) > 0.5) count++;
      }
      return count;
    })();
    const estimatedTotalWeight = (() => {
      const htmlWeight = Buffer.byteLength(html, 'utf8');
      const extScripts = externalJSCount * 50000;
      const extCSS = externalCSSCount * 20000;
      const imgWeight = imageCount * 80000;
      return Math.round((htmlWeight + extScripts + extCSS + imgWeight) / 1024);
    })();
    const webManifestLink = /<link[^>]+rel=["']manifest["']/i.test(html);
    const cssPrintStylesheet = /<link[^>]+media=["']print["']/i.test(html) || /@media\s+print/i.test(html);

    // --- Content Quality (Screaming Frog Content, Ahrefs, Semrush) ---
    const consecutiveBrTags = (() => {
      const matches = html.match(/<br\s*\/?>\s*<br\s*\/?>/gi) || [];
      return matches.length;
    })();
    const noTableOfContents = (() => {
      if (wordCount < 1500) return false;
      const hasToc = /id=["'][^"']*(toc|table-of-contents|tableofcontents|contents)[^"']*["']/i.test(html)
        || /class=["'][^"']*(toc|table-of-contents|tableofcontents)[^"']*["']/i.test(html)
        || /<nav[^>]*aria-label=["'][^"']*(?:table of contents|toc|contents)[^"']*["']/i.test(html);
      return !hasToc;
    })();
    const excessiveDivSoup = (() => {
      const divCount = countMatches(/<div[\s>]/gi);
      if (divCount < 20) return 0;
      const ratio = semanticElementCount > 0 ? divCount / semanticElementCount : divCount;
      return ratio > 20 ? divCount : 0;
    })();
    const contentHasFAQSection = (() => {
      const faqPatterns = /\b(frequently asked questions|faq|common questions|q\s*&\s*a)\b/i;
      return faqPatterns.test(textContent);
    })();
    const abbrWithoutTitle = [...html.matchAll(/<abbr([^>]*)>/gi)]
      .filter(m => !/title=/i.test(m[1])).length;
    const hasQAPattern = /\?<\/(h[2-6]|p|strong|b|dt)>/i.test(html);

    // --- Links & Navigation (Sitebulb Links hints, Screaming Frog Links) ---
    const fileProtocolLinks = allLinks.filter(l => /^file:\/\//i.test(l)).length;
    const ftpLinks = allLinks.filter(l => /^ftp:\/\//i.test(l)).length;
    const onclickNavigation = (html.match(/onclick\s*=\s*["'][^"']*(window\.location|location\.href|location\.assign|location\.replace|navigate)/gi) || []).length;
    const whitespaceInHref = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)]
      .filter(m => /\s/.test(m[1]) && !m[1].startsWith('mailto:') && !m[1].startsWith('tel:')).length;
    const linksWithHashFragment = [...html.matchAll(/<a[^>]+href=["']([^"']+#[^"']+)["']/gi)]
      .filter(m => { try { return new URL(m[1], finalUrl).hostname === host; } catch { return false; } }).length;
    const emptyHrefLinks = countMatches(/<a[^>]+href=["']\s*["']/gi);

    // --- Security (Sitebulb Security hints) ---
    const passwordFieldOnHttp = (() => {
      if (isPageHttps) return 0;
      return [...html.matchAll(/<input[^>]*type=["']password["']/gi)].length;
    })();
    const exposedApiKeys = (() => {
      const patterns = /(?:api[_-]?key|apikey|auth[_-]?token|access[_-]?token|secret[_-]?key|private[_-]?key)\s*[:=]\s*["']([a-zA-Z0-9_\-]{20,})["']/gi;
      const matches = [...html.matchAll(patterns)];
      return matches.length;
    })();
    const formPostToExternalDomain = (() => {
      const forms = [...html.matchAll(/<form[^>]+action=["']([^"']+)["']/gi)];
      return forms.filter(m => {
        try { return new URL(m[1], finalUrl).hostname !== host; } catch { return false; }
      }).length;
    })();

    // --- Technical SEO (Screaming Frog, Sitebulb, Google) ---
    const sitemapLinkInHtml = /<a[^>]+href=["'][^"']*sitemap[^"']*\.xml/i.test(html) || /<link[^>]+href=["'][^"']*sitemap[^"']*\.xml/i.test(html);
    const appleTouchIcon = /<link[^>]+rel=["']apple-touch-icon/i.test(html);
    const multipleGTMCodes = (() => {
      const gtmIds = [...html.matchAll(/GTM-[A-Z0-9]{4,}/gi)].map(m => m[0].toUpperCase());
      return new Set(gtmIds).size > 1;
    })();
    const multipleGACodes = (() => {
      const gaIds = [...new Set([...html.matchAll(/(UA-\d+-\d+|G-[A-Z0-9]+)/gi)].map(m => m[0].toUpperCase()))];
      return gaIds.length > 1;
    })();
    const canonicalIsSelfReferencing = (() => {
      if (!canonicalUrl) return false;
      try { return new URL(canonicalUrl, finalUrl).href.replace(/\/$/, '') === finalUrl.replace(/\/$/, ''); } catch { return false; }
    })();
    const hasRobotsTxtLink = /<a[^>]+href=["'][^"']*\/robots\.txt["']/i.test(html);

    // --- Schema Extended (Google Rich Results, Schema.org) ---
    const hasQAPageSchema = schemaTypes.includes('QAPage');
    const hasItemListSchema = schemaTypes.includes('ItemList');
    const missingSchemaContext = (() => {
      const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      let missing = 0;
      for (const m of blocks) {
        try {
          const j = JSON.parse(m[1]);
          if (!j['@context'] && !j['@graph']) missing++;
        } catch { /* invalid JSON already counted */ }
      }
      return missing;
    })();
    const hasCreativeWorkSchema = schemaTypes.some(t => ['CreativeWork', 'Book', 'Movie', 'MusicRecording', 'Painting', 'Photograph', 'Sculpture'].includes(t));
    const hasWebPageSchema = schemaTypes.includes('WebPage') || schemaTypes.includes('CollectionPage') || schemaTypes.includes('AboutPage') || schemaTypes.includes('ContactPage');

    // --- Resource Hints Summary ---
    const resourceHintsSummary = {
      preconnect: preconnectCount,
      dnsPrefetch: dnsPrefetchCount,
      preload: preloadCount,
      prefetch: prefetchHints,
      prerender: prerenderHints,
      total: preconnectCount + dnsPrefetchCount + preloadCount + prefetchHints + prerenderHints,
    };

    const pageData = {
      url: finalUrl, title, metaDescription, h1,
      h1Count, h2Count, h3Count, wordCount, canonicalUrl,
      schemaMarkup: hasSchema ? 'yes' : '',
      internalLinks, externalLinks, totalLinks,
      imageCount, imagesWithAlt, imagesMissingDimensions,
      ogTitle: decode(ogTitle), ogDescription: decode(ogDescription),
      robotsMeta, pageSizeKB, viewportMeta, langTag,
      readability, urlAnalysis, firstWords, paragraphCount,
      codeToTextRatio, selfLinks, keywordDensity,
      imageFilenames, keywords: reqKeywords,
      followedExternalCount, nofollowExternalCount,
      subheadingDistribution, longParagraphs,
      titleCount, metaDescriptionCount, viewportZoomDisabled, hasLoremIpsum,
      titleEqualsDescription, genericLinkCount, headingSkips,
      headingHierarchy,
      ogImage: ogImage || null,
      // Round 7 fields
      hasFavicon, hasCharset, hasDoctype,
      deprecatedTagsFound, hasMetaRefresh,
      plaintextEmails, unsafeCrossOriginLinks,
      hasMixedContent, mixedContentItems,
      modernImageRatio, legacyFormats, modernFormats,
      sentenceLengthStats, keywordInAltText,
      ogType, ogUrl, ogSiteName, pluginElements,
      httpStatusCode, responseTimeMs, readingTimeMinutes,
      consecutiveSentences,
      titleEqualsH1, localhostLinks,
      titleOutsideHead, metaDescOutsideHead,
      // Round 8 fields
      canonicalCount, canonicalOutsideHead, canonicalIsRelative, canonicalPointsToHttp,
      isSoft404, emptyAnchorLinks, imageLinksWithoutAlt,
      insecureFormActions, emptyHeadings, longAltTextCount, invalidHreflangCodes,
      twitterCard: twitterCard || null,
      // Round 9 fields (Screaming Frog Issues Library)
      h1OnlyImageAlt, imagesMissingAltAttribute,
      canonicalHasFragment, robotsMetaOutsideHead,
      protocolRelativeLinks, hreflangMissingSelf, hreflangMissingXDefault,
      internalNofollowLinks, longH2Count,
      // Round 10 fields (Google Search Central, Bing, Screaming Frog Security, Lighthouse, Yoast)
      xRobotsTag, hasCompression, hasHSTS, hasXContentTypeOptions, hasCSP, hasReferrerPolicy,
      invalidHeadElements, googlebotMeta, allCapsHeadings, contentFreshnessYears,
      inlineCSSBytes, inlineJSBytes, iframeCount, renderBlockingScripts,
      duplicateInternalLinks, firstImgLazyLoaded, dataURIImages,
      // Round 11 fields (50 new checks — Google, Lighthouse, W3C, Backlinko, SE Ranking, Moz, Ahrefs)
      hasXFrameOptions, xPoweredBy, hasPermissionsPolicy, canonicalViaHttpHeader,
      cacheControl, serverHeaderLeak, contentLanguageHeader,
      semanticElements, semanticElementCount, hasMultipleMain,
      nestedAnchorTags, emptyParagraphs, sensitiveComments,
      metaKeywords, themeColor, langMismatch,
      preconnectCount, dnsPrefetchCount, preloadCount,
      hasNosnippet, metaGenerator,
      shortAnchorLinks, longAnchorLinks, jsVoidLinks, malformedTelLinks,
      urlAsAnchorText, sponsoredLinks, ugcLinks, httpInternalLinks,
      svgWithoutTitle, pictureElements, srcsetImages, fetchpriorityImages,
      oversizedImages, longImageFilenames,
      hiddenTextElements, tablesWithoutHeaders, hasBreadcrumbNav, hasContactInfo,
      strongTagCount, linkToContentRatio, wordRepetition,
      jsonLdValidity, articleSchemaComplete, hasReviewSchema,
      canonicalHasQueryString, ampLink, pwaManifest,
      sourceMapExposure, debugStatements, hasBaseTag,
      canonicalOgUrlMismatch, hasPaginationRel,
      authorMeta, datePublished,
      // Round 12 fields (50 new checks — Lighthouse, web.dev, WCAG, Ahrefs, Google Product Schema, CLS)
      documentWriteUsage, cssImportStatements, fontDisplayMissing, fontPreloadWithoutCrossorigin,
      thirdPartyScriptCount, externalCSSCount, externalJSCount, bodyInlineStyles, videoWithoutPoster,
      hasSkipLink, ariaLandmarks, formWithoutLabels, tabindexPositive, emptyButtons, duplicateIds, autofocusElements, videoWithoutCaptions,
      productSchemaComplete, hasFAQSchema, breadcrumbSchemaComplete, hasOrganizationSchema, hasVideoSchema,
      outdatedCopyright, stockPhotoFilenames, hasListElements, excessiveExclamations, fragmentOnlyLinks,
      urlDepth, hashBangUrl, trailingSlashInconsistency,
      hasMaxImagePreview, hasMaxSnippet, hasNotranslate, hasNoimageindex, hasUnavailableAfter, unavailableAfterDate,
      hasAboutLink, socialProfileLinks, hasReturnPolicyLink, hasTermsLink, hasCookieConsent,
      dnsPrefetchWithoutPreconnect, prefetchHints, prerenderHints,
      hasNoscriptContent, inlineCriticalCSS,
      // Round 13 — Accessibility-SEO (axe-core 4.10)
      iframesWithoutTitle, audioAutoplay, inputImageWithoutAlt, selectWithoutLabel,
      duplicateAccesskeys, roleImgWithoutAlt, nestedInteractive, areaWithoutAlt,
      invalidListStructure, focusableAriaHidden, dlStructureViolations, multipleNavWithoutLabel, objectWithoutFallback,
      // Round 13 — Performance & CLS
      allImagesLazy, preloadWithoutAs, preconnectSameOrigin, inlineEventHandlers,
      htmlCommentCount, sriMissingOnCDN, cacheControlNoStore,
      // Round 13 — Technical SEO
      xUaCompatibleMeta, metaKeywordsPresent, rssFeedLink, internalTargetBlank,
      formWithoutAction, orphanedFormInputs, dirMissingForRTL, brokenBookmarks,
      imgAltMatchesFilename, htmlLangInvalid,
      // Round 13 — Content & Structure
      blockquoteWithoutCite, mainLandmarkEmpty, emptyListItems, excessiveDomDepth,
      totalDomElements, figureWithoutFigcaption, multipleHeadTags, multipleBodyTags,
      bodyBeforeHtml, linksToDocuments,
      // Round 13 — Schema & Rich Results
      localBusinessSchemaComplete, hasHowToSchema, hasEventSchema,
      aggregateRatingIncomplete, videoSchemaIncomplete,
      // Round 13 — Links & Navigation
      mailtoWithoutSubject, downloadExternalLinks, tablesWithEmptyCells,
      duplicateAltTexts, formWithoutMethod,
      // Round 14 — Accessibility-SEO (axe-core 4.10 remaining)
      ariaHiddenOnBody, invalidAriaRoles, ariaProhibitedAttrs,
      formFieldMultipleLabels, frameTitleDuplicate, metaViewportLargeScale,
      autocompleteInvalid, serverSideImageMap, summaryWithoutName,
      scopeAttrInvalid, presentationRoleConflict, pAsHeading, imageRedundantAlt,
      // Round 14 — Lighthouse Best Practices
      charsetTooLate, htmlManifestAttr, pastePrevented, deprecatedApis,
      // Round 14 — Content quality & semantic HTML
      metaDescMatchesTitle, consecutiveHeadingsNoContent, headingsInsideAnchors,
      phoneNumbersNotLinked, hasAddressElement, timeElementCount,
      detailsWithoutSummary, nestedForms, inputWithoutType,
      // Round 14 — Security headers
      hasCOOP, hasCOEP,
      // Round 14 — Link quality & navigation
      hashOnlyAnchors, adjacentDuplicateLinks, linksMissingHref, linksToSamePage,
      // Round 14 — Schema & Rich Results
      hasSitelinksSearchBox, hasSpeakableSchema, recipeSchemaIncomplete,
      hasSoftwareAppSchema, hasCourseSchema, hasJobPostingSchema,
      // Round 14 — HTML structure & validation
      missingTableCaption, tableFakeCaption, missingTableStructure,
      landmarkBannerNotTopLevel, landmarkContentinfoNotTopLevel,
      duplicateBannerLandmark, duplicateContentinfoLandmark, noMainLandmark,
      // Round 15 — URL Hygiene (Screaming Frog URL, Sitebulb Internal)
      urlHasUppercase, urlTooLong, urlHasNonAscii, urlHasDoubleSlashes,
      urlHasUnderscores, urlHasSessionId, urlHasEncodedSpaces, urlHasRepetitiveSegments,
      // Round 15 — Viewport / Mobile Friendly (Sitebulb Mobile Friendly)
      viewportCount, viewportMissingWidth, viewportFixedWidth,
      viewportInitialScaleWrong, viewportHasMinScale, smallFontInStyles,
      // Round 15 — Performance (Sitebulb Performance, Lighthouse)
      renderBlockingCSS, unminifiedInlineCSS, unminifiedInlineJS,
      estimatedTotalWeight, webManifestLink, cssPrintStylesheet,
      // Round 15 — Content Quality (Screaming Frog Content, Ahrefs, Semrush)
      consecutiveBrTags, noTableOfContents, excessiveDivSoup,
      contentHasFAQSection, abbrWithoutTitle, hasQAPattern,
      // Round 15 — Links & Navigation (Sitebulb Links, Screaming Frog Links)
      fileProtocolLinks, ftpLinks, onclickNavigation,
      whitespaceInHref, linksWithHashFragment, emptyHrefLinks,
      // Round 15 — Security (Sitebulb Security)
      passwordFieldOnHttp, exposedApiKeys, formPostToExternalDomain,
      // Round 15 — Technical SEO (Screaming Frog, Sitebulb, Google)
      sitemapLinkInHtml, appleTouchIcon, multipleGTMCodes, multipleGACodes,
      canonicalIsSelfReferencing, hasRobotsTxtLink,
      // Round 15 — Schema Extended (Google Rich Results)
      hasQAPageSchema, hasItemListSchema, missingSchemaContext,
      hasCreativeWorkSchema, hasWebPageSchema,
      // Round 15 — Resource Hints summary
      resourceHintsSummary,
      fullUrl: finalUrl,
    };
    const scored = computeWeightedScore(pageData);

    res.json({
      ok: true,
      url: finalUrl,
      title, metaDescription, h1,
      h1Count, h2Count, h3Count, h4Count,
      wordCount, canonicalUrl,
      schemaMarkup: hasSchema ? 'yes' : '',
      schemaTypes,
      schemaRawData,
      internalLinks, externalLinks, totalLinks,
      imageCount, imagesWithAlt, imagesMissingDimensions,
      ogTitle: decode(ogTitle), ogDescription: decode(ogDescription),
      ogImage: ogImage || null,
      twitterCard: twitterCard || null,
      twitterTitle: twitterTitle || null,
      twitterDescription: twitterDescription || null,
      twitterImage: twitterImage || null,
      robotsMeta: robotsMeta || null,
      pageSizeKB,
      viewportMeta,
      langTag,
      readability,
      urlAnalysis,
      firstWords,
      paragraphCount,
      headingHierarchy,
      hreflangTags,
      datePublished: datePublished || null,
      dateModified: dateModified || null,
      authorMeta: authorMeta || null,
      codeToTextRatio,
      internalLinkDetails,
      externalLinkDetails,
      allExternalUrls,
      selfLinks,
      keywordDensity,
      imageFilenames,
      snippetReadiness,
      subheadingDistribution,
      longParagraphs,
      followedExternalCount,
      nofollowExternalCount,
      titleCount,
      metaDescriptionCount,
      viewportZoomDisabled,
      hasLoremIpsum,
      titleEqualsDescription,
      titleEqualsH1,
      localhostLinks,
      genericLinkCount,
      genericLinkAnchors,
      headingSkips,
      metaDescriptionCount,
      scored,
      // Round 7: 16 new signals (Yoast, Lighthouse, SEO Site Checkup, SEOptimer)
      httpStatusCode,
      responseTimeMs,
      hasFavicon,
      hasCharset,
      hasDoctype,
      deprecatedTagsFound,
      hasMetaRefresh,
      plaintextEmails,
      unsafeCrossOriginLinks,
      hasMixedContent,
      mixedContentItems,
      modernImageRatio,
      modernFormats,
      legacyFormats,
      sentenceLengthStats,
      keywordInAltText,
      ogType: ogType || null,
      ogUrl: ogUrl || null,
      ogSiteName: ogSiteName || null,
      pluginElements,
      readingTimeMinutes,
      consecutiveSentences,
      // Round 8: 15 comprehensive checks (Lighthouse, Sitebulb, Moz)
      canonicalCount,
      canonicalOutsideHead,
      canonicalIsRelative,
      canonicalPointsToHttp,
      isSoft404,
      emptyAnchorLinks,
      imageLinksWithoutAlt,
      insecureFormActions,
      emptyHeadings,
      longAltTextCount,
      invalidHreflangCodes,
      // Round 9: 12 comprehensive checks (Screaming Frog Issues Library)
      h1OnlyImageAlt,
      imagesMissingAltAttribute,
      canonicalHasFragment,
      robotsMetaOutsideHead,
      protocolRelativeLinks,
      hreflangMissingSelf,
      hreflangMissingXDefault,
      internalNofollowLinks,
      longH2Count,
      // Round 10: 17 comprehensive checks (Google Search Central, Bing, Screaming Frog Security, Lighthouse, Yoast)
      xRobotsTag,
      hasCompression,
      hasHSTS,
      hasXContentTypeOptions,
      hasCSP,
      hasReferrerPolicy,
      invalidHeadElements,
      googlebotMeta,
      allCapsHeadings,
      contentFreshnessYears,
      inlineCSSBytes,
      inlineJSBytes,
      iframeCount,
      renderBlockingScripts,
      duplicateInternalLinks,
      firstImgLazyLoaded,
      dataURIImages,
      // Round 11: 50 new comprehensive checks
      hasXFrameOptions,
      xPoweredBy,
      hasPermissionsPolicy,
      canonicalViaHttpHeader,
      cacheControl,
      serverHeaderLeak,
      contentLanguageHeader,
      semanticElements,
      semanticElementCount,
      hasMultipleMain,
      nestedAnchorTags,
      emptyParagraphs,
      sensitiveComments,
      metaKeywords: metaKeywords || null,
      themeColor: themeColor || null,
      langMismatch,
      preconnectCount,
      dnsPrefetchCount,
      preloadCount,
      hasNosnippet,
      metaGenerator: metaGenerator || null,
      shortAnchorLinks,
      longAnchorLinks,
      jsVoidLinks,
      telLinks: telLinks.length,
      malformedTelLinks,
      urlAsAnchorText,
      sponsoredLinks,
      ugcLinks,
      httpInternalLinks,
      svgWithoutTitle,
      pictureElements,
      srcsetImages,
      fetchpriorityImages,
      oversizedImages,
      longImageFilenames,
      hiddenTextElements,
      tablesWithoutHeaders,
      hasBreadcrumbNav,
      hasContactInfo,
      strongTagCount,
      linkToContentRatio,
      wordRepetition,
      jsonLdValidity,
      articleSchemaComplete,
      hasReviewSchema,
      canonicalHasQueryString,
      ampLink: ampLink || null,
      pwaManifest,
      sourceMapExposure,
      debugStatements,
      hasBaseTag,
      canonicalOgUrlMismatch,
      hasPaginationRel,
      // Round 12: 50 new comprehensive checks (Lighthouse, web.dev, WCAG, Ahrefs, Google Product Schema, CLS)
      documentWriteUsage,
      cssImportStatements,
      fontDisplayMissing,
      fontPreloadWithoutCrossorigin,
      thirdPartyScriptCount,
      externalCSSCount,
      externalJSCount,
      bodyInlineStyles,
      videoWithoutPoster,
      hasSkipLink,
      ariaLandmarks,
      formWithoutLabels,
      tabindexPositive,
      emptyButtons,
      duplicateIds,
      autofocusElements,
      videoWithoutCaptions,
      productSchemaComplete,
      hasFAQSchema,
      breadcrumbSchemaComplete,
      hasOrganizationSchema,
      hasVideoSchema,
      outdatedCopyright,
      stockPhotoFilenames,
      hasListElements,
      excessiveExclamations,
      fragmentOnlyLinks,
      urlDepth,
      hashBangUrl,
      trailingSlashInconsistency,
      hasMaxImagePreview,
      hasMaxSnippet,
      hasNotranslate,
      hasNoimageindex,
      hasUnavailableAfter,
      unavailableAfterDate,
      hasAboutLink,
      socialProfileLinks,
      hasReturnPolicyLink,
      hasTermsLink,
      hasCookieConsent,
      dnsPrefetchWithoutPreconnect,
      prefetchHints,
      prerenderHints,
      hasNoscriptContent,
      inlineCriticalCSS,
      // Round 13 — Accessibility-SEO (axe-core 4.10)
      iframesWithoutTitle, audioAutoplay, inputImageWithoutAlt, selectWithoutLabel,
      duplicateAccesskeys, roleImgWithoutAlt, nestedInteractive, areaWithoutAlt,
      invalidListStructure, focusableAriaHidden, dlStructureViolations, multipleNavWithoutLabel, objectWithoutFallback,
      // Round 13 — Performance & CLS
      allImagesLazy, preloadWithoutAs, preconnectSameOrigin, inlineEventHandlers,
      htmlCommentCount, sriMissingOnCDN, cacheControlNoStore,
      // Round 13 — Technical SEO
      xUaCompatibleMeta, metaKeywordsPresent, rssFeedLink, internalTargetBlank,
      formWithoutAction, orphanedFormInputs, dirMissingForRTL, brokenBookmarks,
      imgAltMatchesFilename, htmlLangInvalid,
      // Round 13 — Content & Structure
      blockquoteWithoutCite, mainLandmarkEmpty, emptyListItems, excessiveDomDepth,
      totalDomElements, figureWithoutFigcaption, multipleHeadTags, multipleBodyTags,
      bodyBeforeHtml, linksToDocuments,
      // Round 13 — Schema & Rich Results
      localBusinessSchemaComplete, hasHowToSchema, hasEventSchema,
      aggregateRatingIncomplete, videoSchemaIncomplete,
      // Round 13 — Links & Navigation
      mailtoWithoutSubject, downloadExternalLinks, tablesWithEmptyCells,
      duplicateAltTexts, formWithoutMethod,
      // Round 14 — Accessibility-SEO (axe-core 4.10 remaining)
      ariaHiddenOnBody, invalidAriaRoles, ariaProhibitedAttrs,
      formFieldMultipleLabels, frameTitleDuplicate, metaViewportLargeScale,
      autocompleteInvalid, serverSideImageMap, summaryWithoutName,
      scopeAttrInvalid, presentationRoleConflict, pAsHeading, imageRedundantAlt,
      // Round 14 — Lighthouse Best Practices
      charsetTooLate, htmlManifestAttr, pastePrevented, deprecatedApis,
      // Round 14 — Content quality & semantic HTML
      metaDescMatchesTitle, consecutiveHeadingsNoContent, headingsInsideAnchors,
      phoneNumbersNotLinked, hasAddressElement, timeElementCount,
      detailsWithoutSummary, nestedForms, inputWithoutType,
      // Round 14 — Security headers
      hasCOOP, hasCOEP,
      // Round 14 — Link quality & navigation
      hashOnlyAnchors, adjacentDuplicateLinks, linksMissingHref, linksToSamePage,
      // Round 14 — Schema & Rich Results
      hasSitelinksSearchBox, hasSpeakableSchema, recipeSchemaIncomplete,
      hasSoftwareAppSchema, hasCourseSchema, hasJobPostingSchema,
      // Round 14 — HTML structure & validation
      missingTableCaption, tableFakeCaption, missingTableStructure,
      landmarkBannerNotTopLevel, landmarkContentinfoNotTopLevel,
      duplicateBannerLandmark, duplicateContentinfoLandmark, noMainLandmark,
      // Round 15 — URL Hygiene (Screaming Frog URL, Sitebulb Internal)
      urlHasUppercase, urlTooLong, urlHasNonAscii, urlHasDoubleSlashes,
      urlHasUnderscores, urlHasSessionId, urlHasEncodedSpaces, urlHasRepetitiveSegments,
      // Round 15 — Viewport / Mobile Friendly (Sitebulb Mobile Friendly)
      viewportCount, viewportMissingWidth, viewportFixedWidth,
      viewportInitialScaleWrong, viewportHasMinScale, smallFontInStyles,
      // Round 15 — Performance (Sitebulb Performance, Lighthouse)
      renderBlockingCSS, unminifiedInlineCSS, unminifiedInlineJS,
      estimatedTotalWeight, webManifestLink, cssPrintStylesheet,
      // Round 15 — Content Quality (Screaming Frog Content, Ahrefs, Semrush)
      consecutiveBrTags, noTableOfContents, excessiveDivSoup,
      contentHasFAQSection, abbrWithoutTitle, hasQAPattern,
      // Round 15 — Links & Navigation (Sitebulb Links, Screaming Frog Links)
      fileProtocolLinks, ftpLinks, onclickNavigation,
      whitespaceInHref, linksWithHashFragment, emptyHrefLinks,
      // Round 15 — Security (Sitebulb Security)
      passwordFieldOnHttp, exposedApiKeys, formPostToExternalDomain,
      // Round 15 — Technical SEO (Screaming Frog, Sitebulb, Google)
      sitemapLinkInHtml, appleTouchIcon, multipleGTMCodes, multipleGACodes,
      canonicalIsSelfReferencing, hasRobotsTxtLink,
      // Round 15 — Schema Extended (Google Rich Results)
      hasQAPageSchema, hasItemListSchema, missingSchemaContext,
      hasCreativeWorkSchema, hasWebPageSchema,
      // Round 15 — Resource Hints summary
      resourceHintsSummary,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Server-side scoring (for manual form data) ──────────────────────────────
router.post('/score', (req, res) => {
  try {
    const data = req.body || {};
    if (data.url) data.urlAnalysis = analyzeUrlStructure(data.url);
    const scored = computeWeightedScore(data);
    res.json({ ok: true, ...scored });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── CRUD endpoints (persistent) ──────────────────────────────────────────────
router.get('/items', async (req, res) => {
  try {
    const items = await db.list();
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/items/:id', async (req, res) => {
  try {
    const item = await db.get(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const item = await db.create(req.body || {});
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const item = await db.update(req.params.id, req.body || {});
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const ok = await db.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI: General generate (used by AI Assistant tab) ──────────────────────────
router.post('/ai/generate', async (req, res) => {
  try {
    const { messages, prompt } = req.body || {};
    if (!messages && !prompt) return res.status(400).json({ ok: false, error: 'Missing messages or prompt' });

    const model = req.body.model || 'gpt-4o-mini';
    const chatMessages = messages || [
      { role: 'system', content: 'You are an expert on-page SEO consultant for Shopify stores. Give specific, actionable advice with examples. Format responses clearly with numbered lists where appropriate.' },
      { role: 'user', content: prompt }
    ];

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: 1024,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';

    // Deduct credits if middleware is wired
    if (req.deductCredits) req.deductCredits({ model });

    res.json({ ok: true, reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI: Deep page analysis ───────────────────────────────────────────────────
// Takes crawled page data and returns AI-powered SEO recommendations
router.post('/ai/analyze', async (req, res) => {
  try {
    const d = req.body || {};
    if (!d.title && !d.url) return res.status(400).json({ ok: false, error: 'Provide at least a URL or title' });

    const model = d.model || 'gpt-4o-mini';
    const pageContext = [
      `URL: ${d.url || 'Unknown'}`,
      `Title (${(d.title || '').length} chars): ${d.title || 'MISSING'}`,
      `Meta Description (${(d.metaDescription || '').length} chars): ${d.metaDescription || 'MISSING'}`,
      `H1: ${d.h1 || 'MISSING'}`,
      `Word Count: ${d.wordCount || 0}`,
      `H2 Tags: ${d.h2Count || 0}, H3 Tags: ${d.h3Count || 0}, H4 Tags: ${d.h4Count || 0}`,
      `Internal Links: ${d.internalLinks || 0}, External Links: ${d.externalLinks || 0}`,
      `Images: ${d.imageCount || 0} (${d.imagesWithAlt || 0} with alt text)`,
      `Canonical URL: ${d.canonicalUrl || 'MISSING'}`,
      `Schema Markup: ${d.schemaMarkup ? 'Present' : 'Missing'}`,
      `Page Size: ${d.pageSizeKB || '?'}KB`,
      `Viewport Meta: ${d.viewportMeta ? 'Present' : 'Missing'}`,
      `Language Tag: ${d.langTag || 'Missing'}`,
      `Readability: ${d.readability ? `${d.readability.grade} (${d.readability.score}/100, avg sentence ${d.readability.avgSentenceLen} words)` : 'Not calculated'}`,
      `URL Structure: ${d.urlAnalysis ? `Slug "${d.urlAnalysis.slug}" (${d.urlAnalysis.length} chars), HTTPS: ${d.urlAnalysis.isHttps}` : 'Not analyzed'}`,
      `OG Title: ${d.ogTitle || 'Missing'} | OG Description: ${d.ogDescription || 'Missing'}`,
      `Paragraphs: ${d.paragraphCount || '?'}`,
      d.keywords ? `Target Keywords: ${d.keywords}` : null,
      d.firstWords ? `First 100 words: "${d.firstWords.substring(0, 500)}"` : null,
    ].filter(Boolean).join('\n');

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a senior SEO analyst specialising in Shopify e-commerce stores. Analyze the page data and return a JSON object (no markdown fences) with this exact structure:
{
  "assessment": "2-3 sentence overall assessment",
  "criticalIssues": [{ "issue": "...", "fix": "..." }],
  "quickWins": [{ "action": "...", "impact": "high|medium|low" }],
  "contentRecs": [{ "rec": "...", "detail": "..." }],
  "technicalRecs": [{ "rec": "...", "detail": "..." }],
  "keywordSuggestions": ["keyword1", "keyword2", "..."],
  "competitorTips": "1-2 sentences on what top-ranking competitors likely do better"
}

Be specific and actionable. Reference actual values from the data. Prioritize by impact.`
        },
        { role: 'user', content: `Analyze this page for SEO:\n\n${pageContext}` }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    let raw = completion.choices[0]?.message?.content?.trim() || '';
    // Strip markdown fences if present
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    if (req.deductCredits) req.deductCredits({ model });

    let structured;
    try { structured = JSON.parse(raw); } catch { structured = null; }

    res.json({ ok: true, analysis: raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI: Content score & NLP analysis ─────────────────────────────────────────
router.post('/ai/content-score', async (req, res) => {
  try {
    const { title, h1, url, keywords, firstWords, wordCount } = req.body || {};
    if (!firstWords && !title) return res.status(400).json({ ok: false, error: 'Need page content (firstWords) or title' });

    const model = req.body.model || 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an NLP-powered content SEO analyst. Analyze the content and return a JSON object (no markdown fences):
{
  "topicCoverage": 75,
  "contentScore": 68,
  "missingTopics": ["topic1", "topic2"],
  "nlpKeywords": [{ "term": "...", "relevance": "high|medium", "found": true }],
  "contentGaps": [{ "gap": "...", "suggestion": "..." }],
  "searchIntentMatch": "informational|commercial|transactional|navigational",
  "toneAnalysis": "professional|casual|technical|...",
  "improvementPlan": ["step1", "step2", "step3"]
}

Base scores 0-100. Be specific about missing subtopics and NLP terms that competitors likely include.`
        },
        {
          role: 'user',
          content: [
            `URL: ${url || 'unknown'}`,
            `Title: ${title || 'none'}`,
            `H1: ${h1 || 'none'}`,
            `Target Keywords: ${keywords || 'none specified'}`,
            `Word Count: ${wordCount || '?'}`,
            `Content sample (first 200 words): "${(firstWords || '').substring(0, 1000)}"`,
          ].join('\n')
        }
      ],
      max_tokens: 1200,
      temperature: 0.3
    });

    let raw = completion.choices[0]?.message?.content?.trim() || '';
    raw = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    if (req.deductCredits) req.deductCredits({ model });

    let structured;
    try { structured = JSON.parse(raw); } catch { structured = null; }

    res.json({ ok: true, raw, structured });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI: Rewrite title / meta description ─────────────────────────────────────
router.post('/ai/rewrite', async (req, res) => {
  try {
    const { field, current, url, h1, keywords } = req.body || {};
    if (!field || !['title', 'metaDescription', 'h1'].includes(field)) {
      return res.status(400).json({ ok: false, error: 'field must be title, metaDescription, or h1' });
    }

    const model = req.body.model || 'gpt-4o-mini';
    const specs = {
      title: { name: 'SEO title', min: 45, max: 65, count: 5 },
      metaDescription: { name: 'meta description', min: 130, max: 165, count: 3 },
      h1: { name: 'H1 heading', min: 20, max: 70, count: 5 },
    };
    const spec = specs[field];

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an SEO copywriting expert for Shopify stores. Generate exactly ${spec.count} ${spec.name} variants.

Rules:
- Each must be ${spec.min}-${spec.max} characters
- Include target keywords naturally
- Be compelling and click-worthy
- Write for e-commerce buyers
- Return ONLY the numbered list, no explanations`
        },
        {
          role: 'user',
          content: [
            current ? `Current ${spec.name}: "${current}"` : null,
            url ? `Page URL: ${url}` : null,
            h1 ? `Page H1: ${h1}` : null,
            keywords ? `Target keywords: ${keywords}` : null,
            `\nGenerate ${spec.count} improved ${spec.name} variants:`,
          ].filter(Boolean).join('\n')
        }
      ],
      max_tokens: 512,
      temperature: 0.8
    });

    const suggestions = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });

    res.json({ ok: true, field, suggestions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Competitor Comparison ─────────────────────────────────────────────────────
router.post('/compare', async (req, res) => {
  try {
    const { urls, keywords } = req.body || {};
    if (!Array.isArray(urls) || urls.length < 2 || urls.length > 5) {
      return res.status(400).json({ ok: false, error: 'Provide 2-5 URLs to compare' });
    }
    const results = [];
    for (const u of urls) {
      try {
        // Re-use fetch-page logic inline — make internal request
        const axios = require('axios');
        const startTime = Date.now();
        const response = await axios.get(u.trim(), {
          timeout: 15000,
          maxRedirects: 5,
          headers: { 'User-Agent': 'AuraSEOBot/1.0 (+https://aura.com/bot)', 'Accept': 'text/html,application/xhtml+xml' },
          validateStatus: () => true,
        });
        const responseTimeMs = Date.now() - startTime;
        const html = typeof response.data === 'string' ? response.data : '';
        const finalUrl = response.request?.res?.responseUrl || u.trim();
        const host = (() => { try { return new URL(finalUrl).hostname; } catch { return ''; } })();
        const headers = {};
        if (response.headers) Object.entries(response.headers).forEach(([k, v]) => { headers[k.toLowerCase()] = v; });

        // Extract key signals
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        const wordCount = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;
        const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
        const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
        const imgTags = [...html.matchAll(/<img[^>]*>/gi)];
        const imageCount = imgTags.length;
        const imagesWithAlt = imgTags.filter(m => /alt=["'][^"']+["']/i.test(m[0])).length;
        const internalLinks = [...html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi)].filter(m => { try { return new URL(m[1], finalUrl).hostname === host; } catch { return false; } }).length;
        const externalLinks = [...html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi)].filter(m => { try { return new URL(m[1], finalUrl).hostname !== host; } catch { return false; } }).length;
        const hasSchema = /application\/ld\+json/i.test(html);
        const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
        const pageSizeKB = Math.round(Buffer.byteLength(html) / 1024);
        const hasViewport = /<meta[^>]*viewport/i.test(html);
        const langTag = (html.match(/<html[^>]*lang=["']([^"']+)["']/i) || [])[1] || '';
        const hasHSTS = !!headers['strict-transport-security'];
        const hasCSP = !!headers['content-security-policy'];

        // Compute score using the same scoring function
        const pageData = {
          url: finalUrl, title, metaDescription, h1,
          h1Count: (html.match(/<h1[\s>]/gi) || []).length,
          h2Count, h3Count, wordCount,
          canonicalUrl: hasCanonical ? 'set' : '',
          schemaMarkup: hasSchema ? 'yes' : '',
          internalLinks, externalLinks, totalLinks: internalLinks + externalLinks,
          imageCount, imagesWithAlt,
          viewportMeta: hasViewport, langTag,
          readability: calcReadability(html.replace(/<[^>]*>/g, ' ')),
          urlAnalysis: analyzeUrlStructure(finalUrl),
          paragraphCount: (html.match(/<p[\s>]/gi) || []).length,
          codeToTextRatio: pageSizeKB > 0 ? Math.round((wordCount * 5) / (pageSizeKB * 1024) * 100) : 0,
        };
        const scored = computeWeightedScore(pageData);

        results.push({
          url: finalUrl, title, metaDescription, h1,
          wordCount, h2Count, h3Count, imageCount, imagesWithAlt,
          internalLinks, externalLinks, pageSizeKB, responseTimeMs,
          hasSchema, hasCanonical, hasViewport, langTag, hasHSTS, hasCSP,
          score: scored.overall,
          categories: scored.categories,
          issueCount: (scored.issues || []).length,
          highIssues: (scored.issues || []).filter(i => i.sev === 'high').length,
          mediumIssues: (scored.issues || []).filter(i => i.sev === 'medium').length,
          lowIssues: (scored.issues || []).filter(i => i.sev === 'low').length,
        });
      } catch (urlErr) {
        results.push({ url: u.trim(), error: urlErr.message, score: 0, categories: {} });
      }
    }
    res.json({ ok: true, results, keywords: keywords || '' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI Fix Code Generator ────────────────────────────────────────────────────
router.post('/ai/fix-code', async (req, res) => {
  try {
    const { issue, url, pageContext } = req.body || {};
    if (!issue) return res.status(400).json({ ok: false, error: 'issue text required' });

    const model = req.body.model || 'gpt-4o-mini';

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO developer for Shopify stores. Given an SEO issue found by an audit tool, generate the exact code fix.

Rules:
- Return a JSON object with these fields:
  - "fixType": one of "html", "meta", "schema", "htaccess", "shopify-liquid", "css", "javascript", "config"
  - "code": the exact code snippet to add or replace
  - "location": where in the page/theme to add it (e.g. "Inside <head>", "theme.liquid before </head>", "product.liquid")
  - "explanation": 1-2 sentence explanation of what the fix does
  - "priority": "critical", "recommended", or "nice-to-have"
- For Shopify stores, prefer Liquid template fixes when applicable
- Always return valid JSON only, no markdown`
        },
        {
          role: 'user',
          content: [
            `SEO Issue: "${issue}"`,
            url ? `Page URL: ${url}` : null,
            pageContext ? `Page context: title="${pageContext.title}", h1="${pageContext.h1}"` : null,
            '\nGenerate the code fix:',
          ].filter(Boolean).join('\n')
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });

    // Try to parse as JSON
    let fix;
    try {
      fix = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch {
      fix = { fixType: 'unknown', code: raw, location: 'See code', explanation: 'AI-generated fix', priority: 'recommended' };
    }

    res.json({ ok: true, fix });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Bulk URL Scanner ─────────────────────────────────────────────────────────
router.post('/bulk-scan', async (req, res) => {
  try {
    const { urls, keywords } = req.body || {};
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 20) {
      return res.status(400).json({ ok: false, error: 'Provide 1-20 URLs to scan' });
    }
    const results = [];
    for (const u of urls) {
      try {
        const axios = require('axios');
        const startTime = Date.now();
        const response = await axios.get(u.trim(), {
          timeout: 15000, maxRedirects: 5,
          headers: { 'User-Agent': 'AuraSEOBot/1.0 (+https://aura.com/bot)', 'Accept': 'text/html,application/xhtml+xml' },
          validateStatus: () => true,
        });
        const responseTimeMs = Date.now() - startTime;
        const html = typeof response.data === 'string' ? response.data : '';
        const finalUrl = response.request?.res?.responseUrl || u.trim();
        const host = (() => { try { return new URL(finalUrl).hostname; } catch { return ''; } })();
        const headers = {};
        if (response.headers) Object.entries(response.headers).forEach(([k, v]) => { headers[k.toLowerCase()] = v; });

        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
        const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
        const wordCount = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length;
        const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
        const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
        const imgTags = [...html.matchAll(/<img[^>]*>/gi)];
        const imageCount = imgTags.length;
        const imagesWithAlt = imgTags.filter(m => /alt=["'][^"']+["']/i.test(m[0])).length;
        const internalLinks = [...html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi)].filter(m => { try { return new URL(m[1], finalUrl).hostname === host; } catch { return false; } }).length;
        const externalLinks = [...html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi)].filter(m => { try { return new URL(m[1], finalUrl).hostname !== host; } catch { return false; } }).length;
        const hasSchema = /application\/ld\+json/i.test(html);
        const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
        const pageSizeKB = Math.round(Buffer.byteLength(html) / 1024);
        const hasViewport = /<meta[^>]*viewport/i.test(html);

        const pageData = {
          url: finalUrl, title, metaDescription, h1,
          h1Count: (html.match(/<h1[\s>]/gi) || []).length,
          h2Count, h3Count, wordCount,
          canonicalUrl: hasCanonical ? 'set' : '',
          schemaMarkup: hasSchema ? 'yes' : '',
          internalLinks, externalLinks, totalLinks: internalLinks + externalLinks,
          imageCount, imagesWithAlt,
          viewportMeta: hasViewport,
          readability: calcReadability(html.replace(/<[^>]*>/g, ' ')),
          urlAnalysis: analyzeUrlStructure(finalUrl),
          paragraphCount: (html.match(/<p[\s>]/gi) || []).length,
          codeToTextRatio: pageSizeKB > 0 ? Math.round((wordCount * 5) / (pageSizeKB * 1024) * 100) : 0,
        };
        const scored = computeWeightedScore(pageData);

        results.push({
          url: finalUrl, title, metaDescription, h1,
          wordCount, h2Count, h3Count, imageCount, imagesWithAlt,
          internalLinks, externalLinks, pageSizeKB, responseTimeMs,
          score: scored.overall,
          categories: scored.categories,
          issueCount: (scored.issues || []).length,
          highIssues: (scored.issues || []).filter(i => i.sev === 'high').length,
          mediumIssues: (scored.issues || []).filter(i => i.sev === 'medium').length,
          lowIssues: (scored.issues || []).filter(i => i.sev === 'low').length,
          hasSchema, hasCanonical, hasViewport,
          status: 'ok',
        });
      } catch (urlErr) {
        results.push({ url: u.trim(), error: urlErr.message, score: 0, status: 'error' });
      }
    }
    const avgScore = Math.round(results.filter(r => r.status === 'ok').reduce((s, r) => s + (r.score || 0), 0) / Math.max(1, results.filter(r => r.status === 'ok').length));
    const totalIssues = results.filter(r => r.status === 'ok').reduce((s, r) => s + (r.issueCount || 0), 0);
    const totalHighIssues = results.filter(r => r.status === 'ok').reduce((s, r) => s + (r.highIssues || 0), 0);
    res.json({ ok: true, results, summary: { avgScore, totalIssues, totalHighIssues, scanned: results.filter(r => r.status === 'ok').length, failed: results.filter(r => r.status === 'error').length } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Sitemap Discovery ────────────────────────────────────────────────────────
router.post('/sitemap', async (req, res) => {
  try {
    const { domain } = req.body || {};
    if (!domain) return res.status(400).json({ ok: false, error: 'domain is required' });

    const axios = require('axios');
    let sitemapUrl = domain.startsWith('http') ? domain : `https://${domain}`;
    if (!sitemapUrl.includes('sitemap')) sitemapUrl = sitemapUrl.replace(/\/$/, '') + '/sitemap.xml';

    const response = await axios.get(sitemapUrl, {
      timeout: 10000, headers: { 'User-Agent': 'AuraSEOBot/1.0' },
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      // Try robots.txt fallback
      const baseUrl = sitemapUrl.replace(/\/sitemap\.xml$/, '');
      const robotsRes = await axios.get(baseUrl + '/robots.txt', { timeout: 5000, validateStatus: () => true });
      const robotsSitemaps = (robotsRes.data || '').match(/Sitemap:\s*(\S+)/gi) || [];
      if (robotsSitemaps.length > 0) {
        const firstSitemap = robotsSitemaps[0].replace(/^Sitemap:\s*/i, '').trim();
        const retryRes = await axios.get(firstSitemap, { timeout: 10000, validateStatus: () => true });
        if (retryRes.status === 200) {
          const urls = [...(retryRes.data || '').matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m => m[1].trim()).filter(Boolean);
          return res.json({ ok: true, sitemapUrl: firstSitemap, urls: urls.slice(0, 100), total: urls.length });
        }
      }
      return res.status(404).json({ ok: false, error: 'Sitemap not found. Tried ' + sitemapUrl + ' and robots.txt' });
    }

    const xml = typeof response.data === 'string' ? response.data : '';
    // Check if it's a sitemap index
    const isSitemapIndex = /<sitemapindex/i.test(xml);
    if (isSitemapIndex) {
      const childSitemaps = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m => m[1].trim());
      // Fetch first child sitemap for URLs
      let allUrls = [];
      for (const childUrl of childSitemaps.slice(0, 3)) {
        try {
          const childRes = await axios.get(childUrl, { timeout: 10000, validateStatus: () => true });
          const childUrls = [...(childRes.data || '').matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m => m[1].trim());
          allUrls.push(...childUrls);
        } catch {}
      }
      return res.json({ ok: true, sitemapUrl, urls: allUrls.slice(0, 100), total: allUrls.length, type: 'index', childSitemaps: childSitemaps.length });
    }

    const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(m => m[1].trim()).filter(Boolean);
    res.json({ ok: true, sitemapUrl, urls: urls.slice(0, 100), total: urls.length, type: 'urlset' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Analytics endpoints ──────────────────────────────────────────────────────
router.post('/analytics', async (req, res) => {
  try {
    const event = await db.recordEvent(req.body || {});
    res.json({ ok: true, event });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const events = await db.listEvents();
    res.json({ ok: true, events });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Import/export ────────────────────────────────────────────────────────────
router.post('/import', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
    const result = await db.import(items);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const items = await db.list();
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Redirect Chain Analyzer ──────────────────────────────────────────────────
router.post('/redirect-chain', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, error: 'url is required' });
  try {
    const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
    const chain = [];
    let current = url;
    const maxHops = 10;
    for (let i = 0; i < maxHops; i++) {
      const r = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        headers: { 'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)' },
        signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
      });
      chain.push({ url: current, status: r.status, statusText: r.statusText || '' });
      if (r.status >= 300 && r.status < 400) {
        const location = r.headers.get('location');
        if (!location) break;
        current = new URL(location, current).href;
      } else {
        break;
      }
    }
    const hasLoop = chain.length > 1 && chain[chain.length - 1].url === chain[0].url;
    const isChain = chain.length > 2;
    res.json({ ok: true, chain, hasLoop, isChain, hops: chain.length - 1 });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Broken Link Checker ──────────────────────────────────────────────────────
router.post('/check-links', async (req, res) => {
  const { links } = req.body || {};
  if (!Array.isArray(links) || links.length === 0) return res.status(400).json({ ok: false, error: 'links[] required' });
  const toCheck = links.slice(0, 30);
  try {
    const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
    const results = await Promise.allSettled(toCheck.map(async (link) => {
      try {
        const r = await fetch(link, {
          method: 'HEAD',
          redirect: 'follow',
          headers: { 'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)' },
          signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
        });
        return { url: link, status: r.status, ok: r.status >= 200 && r.status < 400 };
      } catch (e) {
        return { url: link, status: 0, ok: false, error: e.message };
      }
    }));
    const checked = results.map(r => r.status === 'fulfilled' ? r.value : { url: '', status: 0, ok: false, error: 'timeout' });
    const broken = checked.filter(c => !c.ok);
    const healthy = checked.filter(c => c.ok);
    res.json({ ok: true, total: checked.length, broken: broken.length, healthy: healthy.length, results: checked });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Robots.txt Analyzer ──────────────────────────────────────────────────────
router.post('/robots-txt', async (req, res) => {
  const { domain } = req.body || {};
  if (!domain) return res.status(400).json({ ok: false, error: 'domain is required' });
  try {
    const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
    const robotsUrl = `https://${domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/robots.txt`;
    const r = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
    });
    if (!r.ok) return res.json({ ok: true, found: false, status: r.status, raw: '', rules: [], sitemaps: [] });
    const raw = await r.text();
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    const rules = [];
    let currentAgent = '*';
    const sitemaps = [];
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('user-agent:')) {
        currentAgent = line.split(':').slice(1).join(':').trim();
      } else if (lowerLine.startsWith('disallow:')) {
        rules.push({ agent: currentAgent, type: 'Disallow', path: line.split(':').slice(1).join(':').trim() });
      } else if (lowerLine.startsWith('allow:')) {
        rules.push({ agent: currentAgent, type: 'Allow', path: line.split(':').slice(1).join(':').trim() });
      } else if (lowerLine.startsWith('sitemap:')) {
        sitemaps.push(line.split(':').slice(1).join(':').trim());
      } else if (lowerLine.startsWith('crawl-delay:')) {
        rules.push({ agent: currentAgent, type: 'Crawl-delay', path: line.split(':').slice(1).join(':').trim() });
      }
    }
    const issues = [];
    if (rules.filter(r => r.type === 'Disallow' && r.path === '/').length > 0) {
      issues.push({ severity: 'high', message: 'Disallow: / found — entire site may be blocked from crawling' });
    }
    const disallowedPaths = rules.filter(r => r.type === 'Disallow').map(r => r.path);
    if (disallowedPaths.some(p => /\.(css|js)$/i.test(p))) {
      issues.push({ severity: 'medium', message: 'CSS or JS files are disallowed — Google needs these for rendering' });
    }
    if (sitemaps.length === 0) {
      issues.push({ severity: 'low', message: 'No sitemap URL declared in robots.txt' });
    }
    if (rules.some(r => r.type === 'Crawl-delay')) {
      issues.push({ severity: 'low', message: 'Crawl-delay directive found — Google ignores this but Bing respects it' });
    }
    const agents = [...new Set(rules.map(r => r.agent))];
    res.json({ ok: true, found: true, status: r.status, raw, rules, sitemaps, issues, agents, totalRules: rules.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Page Resources Analyzer ──────────────────────────────────────────────────
router.post('/page-resources', async (req, res) => {
  let { html, url } = req.body || {};
  if (!html && !url) return res.status(400).json({ ok: false, error: 'html or url is required' });
  try {
    if (!html && url) {
      const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
      const r = await fetch(url, { headers: { 'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)' }, signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined });
      if (!r.ok) return res.status(400).json({ ok: false, error: `Page returned HTTP ${r.status}` });
      html = await r.text();
    }
    const baseUrl = url || '';
    // Extract CSS
    const cssLinks = [...(html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi) || [])].filter(m => /rel=["']stylesheet["']/i.test(m[0]) || /\.css/i.test(m[1])).map(m => {
      try { return new URL(m[1], baseUrl).href; } catch { return m[1]; }
    });
    const inlineStyleBlocks = (html.match(/<style[\s\S]*?<\/style>/gi) || []).length;
    const inlineStyleSize = (html.match(/<style[\s\S]*?<\/style>/gi) || []).reduce((sum, s) => sum + s.length, 0);
    // Extract JS
    const jsScripts = [...(html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi) || [])].map(m => {
      try { return new URL(m[1], baseUrl).href; } catch { return m[1]; }
    });
    const inlineScriptBlocks = (html.match(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi) || []).length;
    const inlineScriptSize = (html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi) || []).reduce((sum, s) => sum + s.length, 0);
    // Extract images
    const images = [...(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [])].map(m => {
      const src = (() => { try { return new URL(m[1], baseUrl).href; } catch { return m[1]; } })();
      const alt = (m[0].match(/alt=["']([^"']*)["']/i) || [])[1] || null;
      const width = (m[0].match(/width=["']?(\d+)/i) || [])[1] || null;
      const height = (m[0].match(/height=["']?(\d+)/i) || [])[1] || null;
      const loading = (m[0].match(/loading=["'](\w+)["']/i) || [])[1] || null;
      return { src, alt, width, height, loading };
    });
    // Extract fonts
    const fonts = [...(html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi) || [])].filter(m => /font/i.test(m[1]) || /preload/i.test(m[0]) && /font/i.test(m[0])).map(m => {
      try { return new URL(m[1], baseUrl).href; } catch { return m[1]; }
    });
    // Preload/preconnect/dns-prefetch hints
    const preloads = [...(html.matchAll(/<link[^>]+rel=["']preload["'][^>]+href=["']([^"']+)["']/gi) || [])].map(m => m[1]);
    const preconnects = [...(html.matchAll(/<link[^>]+rel=["']preconnect["'][^>]+href=["']([^"']+)["']/gi) || [])].map(m => m[1]);
    const dnsPrefetch = [...(html.matchAll(/<link[^>]+rel=["']dns-prefetch["'][^>]+href=["']([^"']+)["']/gi) || [])].map(m => m[1]);
    // Categorize third-party vs first-party
    let domain = '';
    try { domain = new URL(baseUrl).hostname; } catch {}
    const isThirdParty = (u) => { try { return !new URL(u, baseUrl).hostname.includes(domain); } catch { return true; } };
    const thirdPartyCSS = cssLinks.filter(isThirdParty);
    const thirdPartyJS = jsScripts.filter(isThirdParty);
    const thirdPartyImages = images.filter(img => isThirdParty(img.src));
    res.json({
      ok: true,
      css: { external: cssLinks.length, thirdParty: thirdPartyCSS.length, inlineBlocks: inlineStyleBlocks, inlineSize: Math.round(inlineStyleSize / 1024) + 'KB', urls: cssLinks.slice(0, 20) },
      js: { external: jsScripts.length, thirdParty: thirdPartyJS.length, inlineBlocks: inlineScriptBlocks, inlineSize: Math.round(inlineScriptSize / 1024) + 'KB', urls: jsScripts.slice(0, 20) },
      images: { total: images.length, thirdParty: thirdPartyImages.length, withAlt: images.filter(i => i.alt !== null).length, withDimensions: images.filter(i => i.width && i.height).length, withLazy: images.filter(i => i.loading === 'lazy').length, list: images.slice(0, 50) },
      fonts: { total: fonts.length, urls: fonts.slice(0, 10) },
      hints: { preloads: preloads.length, preconnects: preconnects.length, dnsPrefetch: dnsPrefetch.length },
      summary: { totalResources: cssLinks.length + jsScripts.length + images.length + fonts.length, totalThirdParty: thirdPartyCSS.length + thirdPartyJS.length + thirdPartyImages.length },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'On-Page SEO Engine operational' });
});

module.exports = router;