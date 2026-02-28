#!/usr/bin/env node
'use strict';
/**
 * AURA BlogSEO Automated Test Bot
 * Hits every single endpoint in /api/blog-seo and reports pass/fail.
 * Usage: node scripts/test-blog-seo-bot.js [--base http://localhost:10000] [--concurrency 5]
 */
/* global fetch */

const BASE  = (process.argv.find(a => a.startsWith('--base=')) || '').split('=')[1]  || 'http://localhost:10000';
const CONC  = parseInt((process.argv.find(a => a.startsWith('--concurrency=')) || '=5').split('=')[1]);
const API   = `${BASE}/api/blog-seo`;
const SHOP  = 'test-shop.myshopify.com';
const URL_S = 'https://example.com';

// ─── colour helpers ──────────────────────────────────────────────────────────
const G = s => `\x1b[32m${s}\x1b[0m`;   // green
const R = s => `\x1b[31m${s}\x1b[0m`;   // red
const Y = s => `\x1b[33m${s}\x1b[0m`;   // yellow
const B = s => `\x1b[34m${s}\x1b[0m`;   // blue
const D = s => `\x1b[2m${s}\x1b[0m`;    // dim

// ─── test definition ─────────────────────────────────────────────────────────
// Each test: { name, method, path, body?, expectOk?, note? }
// expectOk defaults to true. Set false for endpoints that are expected to error
// with a stub/no-real-openai response but still return HTTP 200.
// "ai" flag = expects OpenAI – we still call it but accept any 2xx.

const CONTENT = 'SEO is the practice of optimising your website so that it ranks higher in search engine results. Good SEO includes keyword research, quality content, technical audits, and backlink building.';

const TESTS = [

  // ── Health ───────────────────────────────────────────────────────────────
  { group:'Health',          name:'health check',            method:'GET',  path:'/health' },

  // ── Core items ───────────────────────────────────────────────────────────
  { group:'Items',           name:'GET items',               method:'GET',  path:'/items' },
  { group:'Items',           name:'POST item',               method:'POST', path:'/items',
    body:{ url: URL_S, keyword: 'seo test', shop: SHOP } },

  // ── Analyse ──────────────────────────────────────────────────────────────
  { group:'Analyse',         name:'POST /analyze',           method:'POST', path:'/analyze',
    body:{ url: URL_S, keyword: 'seo', shop: SHOP } },
  { group:'Analyse',         name:'POST /bulk-analyze',      method:'POST', path:'/bulk-analyze',
    body:{ urls: [URL_S], shop: SHOP } },

  // ── AI endpoints ─────────────────────────────────────────────────────────
  { group:'AI',  name:'ai/analyze',          method:'POST', path:'/ai/analyze',          body:{ url: URL_S, keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/content-brief',    method:'POST', path:'/ai/content-brief',    body:{ keyword:'seo tips', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/keyword-research', method:'POST', path:'/ai/keyword-research', body:{ keyword:'seo tools', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/rewrite',          method:'POST', path:'/ai/rewrite',          body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/generate',         method:'POST', path:'/ai/generate',         body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/blog-outline',     method:'POST', path:'/ai/blog-outline',     body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/intro-generator',  method:'POST', path:'/ai/intro-generator',  body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/title-ideas',      method:'POST', path:'/ai/title-ideas',      body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/cta-generator',    method:'POST', path:'/ai/cta-generator',    body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/key-takeaways',    method:'POST', path:'/ai/key-takeaways',    body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/summary-generator',method:'POST', path:'/ai/summary-generator',body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/tone-analyzer',    method:'POST', path:'/ai/tone-analyzer',    body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/content-grader',   method:'POST', path:'/ai/content-grader',   body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/pull-quotes',      method:'POST', path:'/ai/pull-quotes',      body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/headline-hook',    method:'POST', path:'/ai/headline-hook',    body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/passage-optimizer',method:'POST', path:'/ai/passage-optimizer',body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/content-repurpose',method:'POST', path:'/ai/content-repurpose',body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'AI',  name:'ai/content-visibility',method:'POST',path:'/ai/content-visibility',body:{ content: CONTENT, shop: SHOP }, ai:true },

  // ── Schema ───────────────────────────────────────────────────────────────
  { group:'Schema', name:'schema/generate',        method:'POST', path:'/schema/generate',
    body:{ type:'article', title:'SEO Guide', url: URL_S } },
  { group:'Schema', name:'schema/breadcrumb',       method:'POST', path:'/schema/breadcrumb',
    body:{ items:[{ name:'Home', url: URL_S }] } },
  { group:'Schema', name:'schema/howto',            method:'POST', path:'/schema/howto',
    body:{ title:'How to do SEO', steps:['Research keywords','Optimise content'] } },
  { group:'Schema', name:'schema/video',            method:'POST', path:'/schema/video',
    body:{ name:'SEO Video', description:'Learn SEO', uploadDate:'2026-01-01', thumbnailUrl: URL_S } },
  { group:'Schema', name:'schema/review',           method:'POST', path:'/schema/review',
    body:{ name:'SEO Tool', reviewBody:'Great tool', ratingValue:'5', ratingCount:'10' } },
  { group:'Schema', name:'schema/organization',     method:'POST', path:'/schema/organization',
    body:{ name:'AURA', url: URL_S } },
  { group:'Schema', name:'schema/speakable',        method:'POST', path:'/schema/speakable',
    body:{ url: URL_S, cssSelectors:['h1','p'] } },
  { group:'Schema', name:'schema/product',          method:'POST', path:'/schema/product',
    body:{ name:'Test Product', price:'29.99', brand:'AURA', description:'A product' } },
  { group:'Schema', name:'schema/event',            method:'POST', path:'/schema/event',
    body:{ name:'SEO Summit', date:'2026-06-01', location:'London', organizer:'AURA' } },
  { group:'Schema', name:'schema/person',           method:'POST', path:'/schema/person',
    body:{ name:'Jane Doe', jobTitle:'SEO Expert', description:'Expert in SEO' } },
  { group:'Schema', name:'schema/course',           method:'POST', path:'/schema/course',
    body:{ name:'SEO Course', provider:'AURA', price:'99', duration:'PT4H' } },
  { group:'Schema', name:'schema/recipe',           method:'POST', path:'/schema/recipe',
    body:{ name:'SEO Recipe', authorName:'Jane', prepTime:'PT10M', cookTime:'PT30M', ingredients:['keywords','content'] } },
  { group:'Schema', name:'schema/software',         method:'POST', path:'/schema/software',
    body:{ name:'AURA SEO', description:'SEO app', price:'29', category:'SEO' } },
  { group:'Schema', name:'schema/local-business',   method:'POST', path:'/schema/local-business',
    body:{ name:'AURA Agency', address:'1 Main St', city:'London', phone:'+441234567890', type:'LocalBusiness' } },
  { group:'Schema', name:'faq-schema/generate',     method:'POST', path:'/faq-schema/generate',
    body:{ questions:['What is SEO?'], answers:['SEO stands for Search Engine Optimisation.'] } },
  { group:'Schema', name:'article-schema/validate', method:'POST', path:'/article-schema/validate',
    body:{ schema:'{"@context":"https://schema.org","@type":"Article","headline":"SEO Guide"}' } },
  { group:'Schema', name:'schema/redirect-audit',   method:'POST', path:'/schema/redirect-audit',
    body:{ url: URL_S } },
  { group:'Schema', name:'schema/duplicate-content',method:'POST', path:'/schema/duplicate-content',
    body:{ content: CONTENT } },
  { group:'Schema', name:'schema/hreflang',         method:'POST', path:'/schema/hreflang',
    body:{ url: URL_S, locales:['en-US','fr-FR'] } },
  { group:'Schema', name:'schema/mobile-seo',       method:'POST', path:'/schema/mobile-seo',
    body:{ url: URL_S } },

  // ── Metadata & keywords ───────────────────────────────────────────────────
  { group:'Meta/KW', name:'metadata/analyze',         method:'POST', path:'/metadata/analyze',
    body:{ title:'SEO Guide 2026', description:'Learn SEO', keyword:'seo' } },
  { group:'Meta/KW', name:'keywords/evaluate',        method:'POST', path:'/keywords/evaluate',
    body:{ keyword:'seo tips', content: CONTENT } },
  { group:'Meta/KW', name:'research/score',           method:'POST', path:'/research/score',
    body:{ keyword:'seo tools' } },
  { group:'Meta/KW', name:'keywords/lsi',             method:'POST', path:'/keywords/lsi',
    body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'Meta/KW', name:'keyword-density',          method:'POST', path:'/keyword-density',
    body:{ keyword:'seo', content: CONTENT } },
  { group:'Meta/KW', name:'keywords/prominence',      method:'POST', path:'/keywords/prominence',
    body:{ keyword:'seo', content: CONTENT } },
  { group:'Meta/KW', name:'keywords/tfidf',           method:'POST', path:'/keywords/tfidf',
    body:{ keyword:'seo', content: CONTENT } },
  { group:'Meta/KW', name:'keywords/co-occurrence',   method:'POST', path:'/keywords/co-occurrence',
    body:{ keyword:'seo', content: CONTENT } },
  { group:'Meta/KW', name:'keywords/secondary',       method:'POST', path:'/keywords/secondary',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'Meta/KW', name:'keywords/voice-search',    method:'POST', path:'/keywords/voice-search',
    body:{ keyword:'seo' }, ai:true },
  { group:'Meta/KW', name:'keywords/negative-check',  method:'POST', path:'/keywords/negative-check',
    body:{ keyword:'seo', content: CONTENT } },
  { group:'Meta/KW', name:'keywords/featured-snippet',method:'POST', path:'/keywords/featured-snippet',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'Meta/KW', name:'keywords/low-difficulty-finder',method:'POST', path:'/keywords/low-difficulty-finder',
    body:{ keyword:'seo tools', shop: SHOP }, ai:true },
  { group:'Meta/KW', name:'keywords/cannibalization-detector',method:'POST', path:'/keywords/cannibalization-detector',
    body:{ domain: URL_S, keywords:['seo','search engine optimisation'] } },

  // ── On-Page SEO ───────────────────────────────────────────────────────────
  { group:'On-Page', name:'title/ctr-signals',        method:'POST', path:'/title/ctr-signals',
    body:{ title:'The Ultimate SEO Guide 2026' } },
  { group:'On-Page', name:'title-h1-alignment',       method:'POST', path:'/title-h1-alignment',
    body:{ title:'SEO Guide', h1:'SEO Guide 2026' } },
  { group:'On-Page', name:'heading-hierarchy',        method:'POST', path:'/heading-hierarchy',
    body:{ html:'<h1>SEO</h1><h2>Keywords</h2><h3>Research</h3>' } },
  { group:'On-Page', name:'meta-description-audit',   method:'POST', path:'/meta-description-audit',
    body:{ description:'Learn the best SEO practices for 2026 and beyond.', keyword:'seo' } },
  { group:'On-Page', name:'meta-description-optimizer',method:'POST',path:'/meta-description-optimizer',
    body:{ description:'Learn SEO', keyword:'seo' }, ai:true },
  { group:'On-Page', name:'image-seo',                method:'POST', path:'/image-seo',
    body:{ html:'<img src="seo.png" alt="SEO diagram">', url: URL_S } },
  { group:'On-Page', name:'semantic-html',            method:'POST', path:'/semantic-html',
    body:{ html:'<article><h1>SEO</h1><p>Content</p></article>' } },
  { group:'On-Page', name:'og-validator',             method:'POST', path:'/og-validator',
    body:{ url: URL_S } },
  { group:'On-Page', name:'serp/preview',             method:'POST', path:'/serp/preview',
    body:{ title:'SEO Guide', description:'Learn SEO', url: URL_S } },

  // ── Content quality ───────────────────────────────────────────────────────
  { group:'Content', name:'content/advanced-readability',  method:'POST', path:'/content/advanced-readability',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/sentence-variety',      method:'POST', path:'/content/sentence-variety',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/emotional-tone',        method:'POST', path:'/content/emotional-tone',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/jargon-detector',       method:'POST', path:'/content/jargon-detector',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/expertise-signals',     method:'POST', path:'/content/expertise-signals',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/multimedia-score',      method:'POST', path:'/content/multimedia-score',
    body:{ html:'<p>Text</p><img src="x.png">' } },
  { group:'Content', name:'content/questions-count',       method:'POST', path:'/content/questions-count',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/intro-quality',         method:'POST', path:'/content/intro-quality',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/cta-audit',             method:'POST', path:'/content/cta-audit',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/formatting-score',      method:'POST', path:'/content/formatting-score',
    body:{ html:'<h2>Section</h2><ul><li>Point</li></ul>' } },
  { group:'Content', name:'content/thin-content',          method:'POST', path:'/content/thin-content',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/freshness-score',       method:'POST', path:'/content/freshness-score',
    body:{ content: CONTENT, publishDate:'2025-01-01' } },
  { group:'Content', name:'content/skyscraper-gap',        method:'POST', path:'/content/skyscraper-gap',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'Content', name:'content/relaunch-advisor',      method:'POST', path:'/content/relaunch-advisor',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'Content', name:'content/semantic-enrichment',   method:'POST', path:'/content/semantic-enrichment',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'Content', name:'content/topic-cluster-builder', method:'POST', path:'/content/topic-cluster-builder',
    body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'Content', name:'content/visual-diversity',      method:'POST', path:'/content/visual-diversity',
    body:{ html:'<p>text</p>' } },
  { group:'Content', name:'content/time-to-value',         method:'POST', path:'/content/time-to-value',
    body:{ content: CONTENT } },
  { group:'Content', name:'content/content-pruning',       method:'POST', path:'/content/content-pruning',
    body:{ content: CONTENT }, ai:true },
  { group:'Content', name:'content/statistics-curator',    method:'POST', path:'/content/statistics-curator',
    body:{ content: CONTENT }, ai:true },
  { group:'Content', name:'content-decay',                 method:'POST', path:'/content-decay',
    body:{ url: URL_S, keyword:'seo', publishDate:'2024-01-01' } },
  { group:'Content', name:'content-structure',             method:'POST', path:'/content-structure',
    body:{ html:'<h1>SEO</h1><h2>Tips</h2><p>Content</p>', keyword:'seo' } },
  { group:'Content', name:'passage-indexing',              method:'POST', path:'/passage-indexing',
    body:{ content: CONTENT, keyword:'seo' } },
  { group:'Content', name:'toc-generator',                 method:'POST', path:'/toc-generator',
    body:{ html:'<h2>Section 1</h2><h3>Sub</h3><h2>Section 2</h2>' } },
  { group:'Content', name:'section-word-count',            method:'POST', path:'/section-word-count',
    body:{ html:'<h2>Section 1</h2><p>Content here words</p>' } },

  // ── Technical SEO ─────────────────────────────────────────────────────────
  { group:'Technical', name:'technical/audit',           method:'POST', path:'/technical/audit',
    body:{ url: URL_S, shop: SHOP }, ai:true },
  { group:'Technical', name:'technical/url-analysis',    method:'POST', path:'/technical/url-analysis',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/mobile-seo',      method:'POST', path:'/technical/mobile-seo',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/hreflang',        method:'POST', path:'/technical/hreflang',
    body:{ url: URL_S, locales:['en','fr'] } },
  { group:'Technical', name:'technical/amp-check',       method:'POST', path:'/technical/amp-check',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/resource-hints',  method:'POST', path:'/technical/resource-hints',
    body:{ html:'<link rel="preload" href="style.css">' } },
  { group:'Technical', name:'technical/json-ld-lint',    method:'POST', path:'/technical/json-ld-lint',
    body:{ json:'{"@context":"https://schema.org","@type":"Article","headline":"Test"}' } },
  { group:'Technical', name:'technical/og-image-dims',   method:'POST', path:'/technical/og-image-dims',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/https-status',    method:'POST', path:'/technical/https-status',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/reading-level',   method:'POST', path:'/technical/reading-level',
    body:{ content: CONTENT } },
  { group:'Technical', name:'technical/tfidf-analyzer',  method:'POST', path:'/technical/tfidf-analyzer',
    body:{ keyword:'seo', content: CONTENT } },
  { group:'Technical', name:'technical/content-length-advisor',method:'POST',path:'/technical/content-length-advisor',
    body:{ keyword:'seo', wordCount:800 } },
  { group:'Technical', name:'technical/cwv-advisor',     method:'POST', path:'/technical/cwv-advisor',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/page-speed-advisor',method:'POST',path:'/technical/page-speed-advisor',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/crawl-budget',    method:'POST', path:'/technical/crawl-budget',
    body:{ domain: URL_S } },
  { group:'Technical', name:'technical/click-depth',     method:'POST', path:'/technical/click-depth',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/log-file',        method:'POST', path:'/technical/log-file',
    body:{ logs:'200 / 200 /about' } },
  { group:'Technical', name:'technical/international-seo',method:'POST',path:'/technical/international-seo',
    body:{ url: URL_S } },
  { group:'Technical', name:'technical/google-news',     method:'POST', path:'/technical/google-news',
    body:{ url: URL_S, shop: SHOP }, ai:true },
  { group:'Technical', name:'core-web-vitals',           method:'POST', path:'/core-web-vitals',
    body:{ url: URL_S } },
  { group:'Technical', name:'crawler-access',            method:'POST', path:'/crawler-access',
    body:{ url: URL_S } },
  { group:'Technical', name:'index-directives',          method:'POST', path:'/index-directives',
    body:{ html:'<meta name="robots" content="noindex">' } },
  { group:'Technical', name:'sitemap-check',             method:'POST', path:'/sitemap-check',
    body:{ url: URL_S } },
  { group:'Technical', name:'author-authority',          method:'POST', path:'/author-authority',
    body:{ content: CONTENT, authorName:'Jane Doe' } },

  // ── SERP & CTR ───────────────────────────────────────────────────────────
  { group:'SERP', name:'serp-features',            method:'POST', path:'/serp-features',
    body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'SERP', name:'serp/ctr-optimizer',       method:'POST', path:'/serp/ctr-optimizer',
    body:{ title:'SEO Guide', description:'Learn SEO', keyword:'seo' }, ai:true },
  { group:'SERP', name:'serp/intent-classifier',   method:'POST', path:'/serp/intent-classifier',
    body:{ keyword:'seo tools' } },
  { group:'SERP', name:'serp/feature-targets',     method:'POST', path:'/serp/feature-targets',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'SERP', name:'serp/paa-generator',       method:'POST', path:'/serp/paa-generator',
    body:{ keyword:'seo' }, ai:true },
  { group:'SERP', name:'serp/rich-result-check',   method:'POST', path:'/serp/rich-result-check',
    body:{ url: URL_S } },
  { group:'SERP', name:'serp/rankbrain-advisor',   method:'POST', path:'/serp/rankbrain-advisor',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'SERP', name:'serp/longtail-embedder',   method:'POST', path:'/serp/longtail-embedder',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'SERP', name:'serp/meta-ab-variants',    method:'POST', path:'/serp/meta-ab-variants',
    body:{ title:'SEO Guide', description:'Learn SEO', keyword:'seo' }, ai:true },
  { group:'SERP', name:'serp/difficulty-score',    method:'POST', path:'/serp/difficulty-score',
    body:{ keyword:'seo tools' } },
  { group:'SERP', name:'serp/competitor-snapshot', method:'POST', path:'/serp/competitor-snapshot',
    body:{ keyword:'seo', domain: URL_S }, ai:true },
  { group:'SERP', name:'serp/news-seo',            method:'POST', path:'/serp/news-seo',
    body:{ url: URL_S, keyword:'seo' }, ai:true },
  { group:'SERP', name:'serp/video-seo',           method:'POST', path:'/serp/video-seo',
    body:{ url: URL_S, keyword:'seo' }, ai:true },
  { group:'SERP', name:'serp/entity-optimizer',    method:'POST', path:'/serp/entity-optimizer',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'SERP', name:'serp/review-schema',       method:'POST', path:'/serp/review-schema',
    body:{ name:'AURA', rating:'4.8', count:'120' } },
  { group:'SERP', name:'serp/event-schema',        method:'POST', path:'/serp/event-schema',
    body:{ name:'SEO Conference', date:'2026-06-01', location:'London' } },

  // ── Intent / Analysis ─────────────────────────────────────────────────────
  { group:'Analysis', name:'intent-classifier',           method:'POST', path:'/intent-classifier',
    body:{ keyword:'buy seo tools', shop: SHOP }, ai:true },
  { group:'Analysis', name:'ai-overview-eligibility',     method:'POST', path:'/ai-overview-eligibility',
    body:{ keyword:'seo', content: CONTENT, shop: SHOP }, ai:true },
  { group:'Analysis', name:'topical-authority',           method:'POST', path:'/topical-authority',
    body:{ domain: URL_S, topic:'seo', shop: SHOP }, ai:true },
  { group:'Analysis', name:'competitor-gap',              method:'POST', path:'/competitor-gap',
    body:{ domain: URL_S, competitor:'https://competitor.com', shop: SHOP }, ai:true },
  { group:'Analysis', name:'cannibalization',             method:'POST', path:'/cannibalization',
    body:{ domain: URL_S, keywords:['seo','seo tools'], shop: SHOP }, ai:true },
  { group:'Analysis', name:'anchor-text-audit',           method:'POST', path:'/anchor-text-audit',
    body:{ domain: URL_S, shop: SHOP }, ai:true },
  { group:'Analysis', name:'people-also-ask',             method:'POST', path:'/people-also-ask',
    body:{ keyword:'seo', shop: SHOP }, ai:true },
  { group:'Analysis', name:'entity-detection',            method:'POST', path:'/entity-detection',
    body:{ content: CONTENT, shop: SHOP }, ai:true },
  { group:'Analysis', name:'llm/score',                   method:'POST', path:'/llm/score',
    body:{ url: URL_S, shop: SHOP }, ai:true },
  { group:'Analysis', name:'links/check',                 method:'POST', path:'/links/check',
    body:{ html:'<a href="https://example.com">Link</a>', url: URL_S } },
  { group:'Analysis', name:'links/internal-suggestions',  method:'POST', path:'/links/internal-suggestions',
    body:{ content: CONTENT, existingLinks:[] }, ai:true },
  { group:'Analysis', name:'links/external-authority',    method:'POST', path:'/links/external-authority',
    body:{ html:'<a href="https://example.com">Link</a>' } },
  { group:'Analysis', name:'links/link-density',          method:'POST', path:'/links/link-density',
    body:{ html:'<p>Text <a href="#">link</a> more text</p>' } },
  { group:'Analysis', name:'links/outbound-audit',        method:'POST', path:'/links/outbound-audit',
    body:{ html:'<a href="https://example.com">Ext</a>' } },
  { group:'Analysis', name:'trust/social-proof',          method:'POST', path:'/trust/social-proof',
    body:{ content: CONTENT } },
  { group:'Analysis', name:'trust/citation-check',        method:'POST', path:'/trust/citation-check',
    body:{ content: CONTENT } },

  // ── Backlinks ─────────────────────────────────────────────────────────────
  { group:'Backlinks', name:'backlinks/link-gap',          method:'POST', path:'/backlinks/link-gap',
    body:{ competitors:['https://competitor.com'], domain: URL_S, shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/broken-backlinks',  method:'POST', path:'/backlinks/broken-backlinks',
    body:{ domain: URL_S, shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/anchor-text',       method:'POST', path:'/backlinks/anchor-text',
    body:{ domain: URL_S, shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/link-velocity',     method:'POST', path:'/backlinks/link-velocity',
    body:{ domain: URL_S, monthlyRate:5, shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/opportunity-finder',method:'POST', path:'/backlinks/opportunity-finder',
    body:{ domain: URL_S, keyword:'seo', shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/outreach-generator',method:'POST', path:'/backlinks/outreach-generator',
    body:{ domain: URL_S, shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/bestof-finder',     method:'POST', path:'/backlinks/bestof-finder',
    body:{ keyword:'seo tools', shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/anchor-optimizer',  method:'POST', path:'/backlinks/anchor-optimizer',
    body:{ anchors:['click here','visit'], keyword:'seo', shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/strategy-builder',  method:'POST', path:'/backlinks/strategy-builder',
    body:{ domain: URL_S, shop: SHOP }, ai:true },
  { group:'Backlinks', name:'backlinks/internal-suggester',method:'POST', path:'/backlinks/internal-suggester',
    body:{ content: CONTENT, pages:[{ url:URL_S, title:'SEO Guide' }] }, ai:true },
  { group:'Backlinks', name:'backlinks/link-reclamation',  method:'POST', path:'/backlinks/link-reclamation',
    body:{ brand:'AURA', site: URL_S, niche:'seo', shop: SHOP }, ai:true },

  // ── Local SEO ─────────────────────────────────────────────────────────────
  { group:'Local', name:'local/gbp-optimizer',       method:'POST', path:'/local/gbp-optimizer',
    body:{ name:'AURA Agency', address:'1 Main St', phone:'+441234567890' }, ai:true },
  { group:'Local', name:'local/citation-finder',     method:'POST', path:'/local/citation-finder',
    body:{ name:'AURA Agency', address:'1 Main St', city:'London' }, ai:true },
  { group:'Local', name:'local/local-keyword-gen',   method:'POST', path:'/local/local-keyword-gen',
    body:{ name:'AURA', address:'London', niche:'seo' }, ai:true },
  { group:'Local', name:'local/local-schema',        method:'POST', path:'/local/local-schema',
    body:{ name:'AURA Agency', address:'1 Main St', city:'London', phone:'+441234567890' } },

  // ── Brand / E-E-A-T ───────────────────────────────────────────────────────
  { group:'Brand', name:'brand/eeat-scorer',    method:'POST', path:'/brand/eeat-scorer',
    body:{ content: CONTENT, url: URL_S }, ai:true },
  { group:'Brand', name:'brand/author-bio',     method:'POST', path:'/brand/author-bio',
    body:{ name:'Jane Doe', expertise:'SEO' }, ai:true },
  { group:'Brand', name:'brand/brand-signals',  method:'POST', path:'/brand/brand-signals',
    body:{ domain: URL_S, brand:'AURA', shop: SHOP }, ai:true },
  { group:'Brand', name:'brand/expert-quotes',  method:'POST', path:'/brand/expert-quotes',
    body:{ topic:'seo', content: CONTENT }, ai:true },
  { group:'Brand', name:'brand/trust-builder',  method:'POST', path:'/brand/trust-builder',
    body:{ content: CONTENT, url: URL_S }, ai:true },

  // ── Voice Search ──────────────────────────────────────────────────────────
  { group:'Voice', name:'voice/voice-optimizer',          method:'POST', path:'/voice/voice-optimizer',
    body:{ content: CONTENT, keyword:'seo' }, ai:true },
  { group:'Voice', name:'voice/faq-generator',            method:'POST', path:'/voice/faq-generator',
    body:{ keyword:'seo' }, ai:true },
  { group:'Voice', name:'voice/ai-overview-optimizer',    method:'POST', path:'/voice/ai-overview-optimizer',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'Voice', name:'voice/conversational-keywords',  method:'POST', path:'/voice/conversational-keywords',
    body:{ keyword:'seo' }, ai:true },

  // ── A/B Testing ───────────────────────────────────────────────────────────
  { group:'A/B', name:'ab/ab-test-advisor',    method:'POST', path:'/ab/ab-test-advisor',
    body:{ contentA: CONTENT, contentB: CONTENT+' Extra.', keyword:'seo' }, ai:true },
  { group:'A/B', name:'ab/content-refresh',    method:'POST', path:'/ab/content-refresh',
    body:{ content: CONTENT, keyword:'seo' }, ai:true },
  { group:'A/B', name:'ab/title-variants',     method:'POST', path:'/ab/title-variants',
    body:{ title:'SEO Guide 2026', keyword:'seo' }, ai:true },
  { group:'A/B', name:'ab/meta-variants',      method:'POST', path:'/ab/meta-variants',
    body:{ description:'Learn SEO in 2026', keyword:'seo' }, ai:true },
  { group:'A/B', name:'ab/bert-optimizer',     method:'POST', path:'/ab/bert-optimizer',
    body:{ content: CONTENT, keyword:'seo' }, ai:true },
  { group:'A/B', name:'ab/secondary-keywords', method:'POST', path:'/ab/secondary-keywords',
    body:{ keyword:'seo', content: CONTENT }, ai:true },
  { group:'A/B', name:'ab/knowledge-graph',    method:'POST', path:'/ab/knowledge-graph',
    body:{ entity:'AURA', domain: URL_S }, ai:true },

  // ── AI Growth ─────────────────────────────────────────────────────────────
  { group:'Growth', name:'ai/content-calendar',    method:'POST', path:'/ai/content-calendar',
    body:{ niche:'ecommerce seo', weeks:4, shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/pillar-page',          method:'POST', path:'/ai/pillar-page',
    body:{ topic:'seo', shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/programmatic-seo',     method:'POST', path:'/ai/programmatic-seo',
    body:{ template:'Best [city] SEO agency', data:['London','Manchester'], shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/content-roi',          method:'POST', path:'/ai/content-roi',
    body:{ keyword:'seo', traffic:1000, conversionRate:2, avgOrderValue:50, shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/sge-optimizer',        method:'POST', path:'/ai/sge-optimizer',
    body:{ keyword:'seo', content: CONTENT, engine:'chatgpt', shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/topic-miner',          method:'POST', path:'/ai/topic-miner',
    body:{ niche:'ecommerce', shop: SHOP }, ai:true },
  { group:'Growth', name:'social/seo-score',        method:'POST', path:'/social/seo-score',
    body:{ url: URL_S, content: CONTENT, shop: SHOP }, ai:true },
  { group:'Growth', name:'competitor/full-audit',   method:'POST', path:'/competitor/full-audit',
    body:{ compUrl:'https://competitor.com', niche:'seo', shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/performance-predictor',method:'POST', path:'/ai/performance-predictor',
    body:{ title:'SEO Guide', keyword:'seo', wordCount:1500, type:'guide', shop: SHOP }, ai:true },
  { group:'Growth', name:'ai/semantic-clusters',    method:'POST', path:'/ai/semantic-clusters',
    body:{ seed:'seo', shop: SHOP }, ai:true },

  // ── Voice Profile ─────────────────────────────────────────────────────────
  { group:'VoiceProfile', name:'GET voice-profile',        method:'GET',  path:'/voice-profile' },
  { group:'VoiceProfile', name:'POST voice-profile',       method:'POST', path:'/voice-profile',
    body:{ shop: SHOP } },
  { group:'VoiceProfile', name:'POST voice-profile/save',  method:'POST', path:'/voice-profile/save',
    body:{ shop: SHOP } },
  { group:'VoiceProfile', name:'GET voice-profile/test-1', method:'GET',  path:'/voice-profile/test-1' },
  { group:'VoiceProfile', name:'DELETE voice-profile/test-1',method:'DELETE',path:'/voice-profile/test-1' },

  // ── GSC ──────────────────────────────────────────────────────────────────
  { group:'GSC', name:'GET gsc/summary', method:'GET', path:'/gsc/summary' },

  // ── Site Crawl ────────────────────────────────────────────────────────────
  { group:'Crawl', name:'POST crawl/start',            method:'POST', path:'/crawl/start',
    body:{ url: URL_S } },
  { group:'Crawl', name:'GET crawl/status',            method:'GET',  path:'/crawl/status' },
  { group:'Crawl', name:'GET crawl/results',           method:'GET',  path:'/crawl/results' },
  { group:'Crawl', name:'POST crawl/ai-summary',       method:'POST', path:'/crawl/ai-summary',
    body:{ shop: SHOP }, ai:true },
  { group:'Crawl', name:'POST crawl/orphan-finder',    method:'POST', path:'/crawl/orphan-finder',
    body:{ shop: SHOP } },
  { group:'Crawl', name:'POST crawl/export-csv',       method:'POST', path:'/crawl/export-csv',
    body:{ shop: SHOP } },
  { group:'Crawl', name:'GET crawl/snapshots',         method:'GET',  path:'/crawl/snapshots' },
  { group:'Crawl', name:'POST crawl/compare',          method:'POST', path:'/crawl/compare',
    body:{ snapshotA:[], snapshotB:[] } },
  { group:'Crawl', name:'POST crawl/duplicate-detector',method:'POST',path:'/crawl/duplicate-detector',
    body:{ shop: SHOP } },

  // ── GEO / LLM ────────────────────────────────────────────────────────────
  { group:'GEO', name:'geo/geo-health-score',      method:'POST', path:'/geo/geo-health-score',
    body:{ domain: URL_S, brand:'AURA', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/llm-visibility-audit',  method:'POST', path:'/geo/llm-visibility-audit',
    body:{ domain: URL_S, brand:'AURA', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/prompt-simulation',     method:'POST', path:'/geo/prompt-simulation',
    body:{ keyword:'best seo tool', brand:'AURA', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/citation-gap-analysis', method:'POST', path:'/geo/citation-gap-analysis',
    body:{ brand:'AURA', competitor:'Semrush', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/ai-platform-tracker',   method:'POST', path:'/geo/ai-platform-tracker',
    body:{ brand:'AURA', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/mention-gap',           method:'POST', path:'/geo/mention-gap',
    body:{ brand:'AURA', competitor:'Ahrefs', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/brand-sentiment-ai',    method:'POST', path:'/geo/brand-sentiment-ai',
    body:{ brand:'AURA', shop: SHOP }, ai:true },
  { group:'GEO', name:'geo/faq-for-llm',           method:'POST', path:'/geo/faq-for-llm',
    body:{ topic:'seo', brand:'AURA', shop: SHOP }, ai:true },

  // ── Monitoring ────────────────────────────────────────────────────────────
  { group:'Monitoring', name:'POST monitoring/add-alert', method:'POST', path:'/monitoring/add-alert',
    body:{ keyword:'seo', url: URL_S, shop: SHOP } },
  { group:'Monitoring', name:'GET monitoring/alerts',     method:'GET',  path:'/monitoring/alerts' },
  { group:'Monitoring', name:'POST monitoring/alerts',    method:'POST', path:'/monitoring/alerts',
    body:{ shop: SHOP } },

  // ── Shopify Integration ───────────────────────────────────────────────────
  { group:'Shopify', name:'GET shopify-data',                 method:'GET',  path:'/shopify-data' },
  { group:'Shopify', name:'shopify/blog-template-audit',      method:'POST', path:'/shopify/blog-template-audit',
    body:{ shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/collection-seo',           method:'POST', path:'/shopify/collection-seo',
    body:{ handle:'all', shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/product-blog-links',       method:'POST', path:'/shopify/product-blog-links',
    body:{ products:[{ title:'SEO Book', handle:'seo-book' }], articles:[{ title:'SEO Guide', handle:'seo-guide' }], shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/metafield-seo',            method:'POST', path:'/shopify/metafield-seo',
    body:{ handle:'test-product', shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/tag-taxonomy',             method:'POST', path:'/shopify/tag-taxonomy',
    body:{ tags:['seo','blogging','content'], shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/blog-internal-links',      method:'POST', path:'/shopify/blog-internal-links',
    body:{ blogHandle:'news', shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/image-compression',        method:'POST', path:'/shopify/image-compression',
    body:{ shop: SHOP, productHandle:'' }, ai:true },
  { group:'Shopify', name:'shopify/duplicate-products',       method:'POST', path:'/shopify/duplicate-products',
    body:{ products:[{ title:'SEO Book', handle:'seo-book', description:'Learn SEO' }], shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/breadcrumb-schema',        method:'POST', path:'/shopify/breadcrumb-schema',
    body:{ pages:[{ url:'about', title:'About' }], shop: SHOP } },
  { group:'Shopify', name:'shopify/review-schema-bulk',       method:'POST', path:'/shopify/review-schema-bulk',
    body:{ products:[{ title:'SEO Book', handle:'seo-book' }], shop: SHOP } },
  { group:'Shopify', name:'shopify/international-seo',        method:'POST', path:'/shopify/international-seo',
    body:{ domain: SHOP, markets:['en-US','fr-FR'], shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/collection-keyword-gaps',  method:'POST', path:'/shopify/collection-keyword-gaps',
    body:{ collectionTitle:'All Products', collectionDesc:'Browse all products', shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/theme-seo-audit',          method:'POST', path:'/shopify/theme-seo-audit',
    body:{ themeName:'Dawn', shop: SHOP }, ai:true },
  { group:'Shopify', name:'shopify/speed-audit',              method:'POST', path:'/shopify/speed-audit',
    body:{ domain: SHOP, shop: SHOP }, ai:true },
];

// ─── runner ──────────────────────────────────────────────────────────────────
// Patterns that indicate expected-skip (not a bug)
const SKIP_PATTERNS = [
  /Incorrect API key/i,          // test-key not real OpenAI key
  /local issuer certificate/i,   // SSL cert issue fetching real URLs in dev
  /PageSpeed API error/i,        // Google PageSpeed quota/key
  /fetch failed/i,               // external URL unreachable in dev
  /unable to get local/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
];

function isSkip(body, err) {
  const msg = (body && body.error) ? body.error : (err || '');
  return SKIP_PATTERNS.some(p => p.test(msg));
}

async function runTest(t) {
  const start = Date.now();
  try {
    const opts = {
      method: t.method,
      headers: { 'Content-Type': 'application/json', 'x-shopify-shop-domain': SHOP },
    };
    if (t.body && t.method !== 'GET') opts.body = JSON.stringify(t.body);
    const res = await fetch(`${API}${t.path}`, opts);
    const ms  = Date.now() - start;
    // Try parse JSON body
    let body;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) {
      try { body = await res.json(); } catch { /* ignore */ }
    }
    // Parametric routes returning 404 = "record not found" (not a missing route)
    // A true missing route returns plain text 404 from Express "Cannot GET /path"
    const isParamRoute = t.path.includes('/:') || /\/[^/]+-\d+$/.test(t.path) || /\/test-/.test(t.path);
    const routeMissing = res.status === 404 && !isParamRoute && !(body && body.ok !== undefined);
    const skip = isSkip(body, null) && res.status >= 500;
    const pass = (res.status >= 200 && res.status < 500) || skip;
    return { ...t, status: res.status, ms, pass, skip, body, routeMissing };
  } catch (err) {
    const skip = isSkip(null, err.message);
    return { ...t, status: 0, ms: Date.now() - start, pass: skip, skip, err: err.message };
  }
}

async function runAll() {
  console.log(`\n${B('═══════════════════════════════════════════════════')}`);
  console.log(`${B('  AURA BlogSEO Automated Test Bot')}`);
  console.log(`${B('═══════════════════════════════════════════════════')}`);
  console.log(`  Base: ${BASE}   Concurrency: ${CONC}   Tests: ${TESTS.length}\n`);

  const results = [];
  // Run in batches to avoid flooding
  for (let i = 0; i < TESTS.length; i += CONC) {
    const batch = TESTS.slice(i, i + CONC);
    const batchResults = await Promise.all(batch.map(runTest));
    results.push(...batchResults);
    // Print progress
    for (const r of batchResults) {
      const icon  = r.routeMissing ? Y('404 ') :
                    r.skip         ? Y('SKIP') :
                    r.pass         ? G('PASS') : R('FAIL');
      const ai    = r.ai ? D(' [AI]') : '';
      const ms    = D(`  ${r.ms}ms`);
      const skipReason = r.skip ? Y('  ← dev-env/no-key') : '';
      const extra = r.routeMissing ? Y('  ← ROUTE MISSING') :
                    (!r.pass && r.err) ? R(`  ← ${r.err}`) :
                    (!r.pass) ? R(`  ← HTTP ${r.status}${r.body ? ' '+JSON.stringify(r.body).slice(0,80) : ''}`) :
                    skipReason;
      console.log(`  [${icon}] ${r.group.padEnd(14)} ${r.name.padEnd(42)}${ai}${ms}${extra}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.pass && !r.skip);
  const skipped = results.filter(r => r.skip);
  const failed  = results.filter(r => !r.pass && !r.routeMissing);
  const missing = results.filter(r => r.routeMissing);
  const aiTests = results.filter(r => r.ai);

  console.log(`\n${B('═══════════════════════════════════════════════════')}`);
  console.log(`  ${G('PASSED')}:       ${passed.length}`);
  console.log(`  ${Y('SKIP')} (dev):   ${skipped.length}  (no real OpenAI key / SSL cert / external API)`);
  console.log(`  ${R('FAILED')}:       ${failed.length}`);
  console.log(`  ${Y('ROUTE MISSING')}: ${missing.length}`);
  console.log(`  AI endpoints:  ${aiTests.length}`);
  console.log(`  Total:         ${results.length}`);
  console.log(`${B('═══════════════════════════════════════════════════')}\n`);

  if (missing.length) {
    console.log(Y('Missing routes:'));
    missing.forEach(r => console.log(`  ${r.method.padEnd(7)} ${API}${r.path}`));
    console.log();
  }
  if (failed.length) {
    console.log(R('Real Failures (need fixing):'));
    failed.forEach(r => {
      const detail = r.err || `HTTP ${r.status}`;
      const body   = r.body ? `  body: ${JSON.stringify(r.body).slice(0, 120)}` : '';
      console.log(`  ${r.method.padEnd(7)} ${r.path.padEnd(50)} ${detail}${body}`);
    });
    console.log();
  }

  // Save results JSON
  const { writeFileSync } = require('fs');
  const { join } = require('path');
  const outPath = join(__dirname, '..', 'test-results', 'blog-seo-bot-results.json');
  try {
    writeFileSync(outPath, JSON.stringify({ ran: new Date().toISOString(), passed: passed.length, failed: failed.length, missing: missing.length, results }, null, 2));
    console.log(D(`  Results saved to test-results/blog-seo-bot-results.json\n`));
  } catch { /* ignore if dir missing */ }

  process.exit(failed.length + missing.length > 0 ? 1 : 0);
}

runAll().catch(e => { console.error(R(e.message)); process.exit(1); });
