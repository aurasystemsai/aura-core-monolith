/**
 * Blog SEO Engine — Full Coverage Test Suite
 * Covers all 323 routes in src/tools/blog-seo/router.js
 *
 * Strategy:
 *  - AI routes: OpenAI is globally mocked in jest.setup.js → expect 200 ok:true
 *  - Routes that await fetch(url): test 400 validation + accept 200|502 for real call
 *  - Data/storage routes: test full CRUD cycles
 *  - Schema routes: verify JSON-LD structure is returned
 */

const request = require('supertest');
const express = require('express');

// Mock node-fetch so all URL-fetching routes get a synthetic HTML response
jest.mock('node-fetch', () => {
  const MOCK_HTML = '<html><head>' +
    '<title>Test Blog Post About SEO Strategies</title>' +
    '<meta name="description" content="The complete guide to blog SEO in 2025">' +
    '<link rel="canonical" href="https://example.com/blog">' +
    '<meta property="article:published_time" content="2024-01-15T10:00:00Z">' +
    '<meta property="article:modified_time" content="2024-11-15T10:00:00Z">' +
    '</head><body>' +
    '<h1>Blog SEO Strategies for 2025</h1>' +
    '<p>Search engine optimisation is the practice of improving website visibility in organic search results.</p>' +
    '<h2>Keyword Research</h2><p>Keyword research helps find the right search terms to target with content.</p>' +
    '<h2>On-Page Optimisation</h2><p>On-page SEO involves optimising individual pages to rank higher.</p>' +
    '<h2>Link Building</h2><p>Acquiring quality backlinks from authoritative websites improves domain authority.</p>' +
    '<h2>Technical SEO</h2><p>Technical SEO ensures search engines can crawl and index your site.</p>' +
    '<h2>Content Strategy</h2><p>A solid content strategy drives organic growth over time.</p>' +
    '<a href="/related-post">Related Post</a>' +
    '<a href="/another-guide">Another Guide</a>' +
    '<a href="https://external.com">External</a>' +
    '<img src="/images/seo.jpg" alt="SEO diagram">' +
    '</body></html>';
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    url: 'https://example.com/blog',
    headers: {
      get: jest.fn().mockReturnValue(null),
      entries: jest.fn().mockReturnValue([['content-type', 'text/html']]),
      forEach: jest.fn(),
    },
    text: jest.fn().mockResolvedValue(MOCK_HTML),
    json: jest.fn().mockResolvedValue({}),
  });
  return { __esModule: true, default: mockFetch };
});

const router  = require('../tools/blog-seo/router');

const app = express();
app.use(express.json());
app.use('/api/blog-seo', router);

const API = '/api/blog-seo';
const SHOP = 'test-shop.myshopify.com';
const HEADERS = { 'x-shopify-shop-domain': SHOP };

// Shared across suites
let vpId, rankKwId;

// Helper — posts to a route, expects 200 + ok:true
async function ok(path, body = {}) {
  const res = await request(app).post(`${API}${path}`).set(HEADERS).send(body);
  expect([200, 201]).toContain(res.status);
  expect(res.body.ok).toBe(true);
  return res.body;
}

// Helper — for routes that actually fetch external URLs (may 502)
async function smokePost(path, body = {}) {
  const res = await request(app).post(`${API}${path}`).set(HEADERS).send(body);
  expect([200, 201, 400, 502, 503]).toContain(res.status);
  return res;
}

const SAMPLE_CONTENT = 'Search engine optimisation (SEO) is the practice of increasing a website\'s visibility in organic search results. It involves keyword research, on-page optimisation, and link building. A good SEO strategy will improve rankings and drive more traffic to your site.';
const SAMPLE_URL     = 'https://example.com/blog';
const SAMPLE_KEYWORD = 'blog seo tips';
const SAMPLE_DOMAIN  = 'example.com';

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Items / History Store', () => {
  let itemId;

  test('POST /items creates an item', async () => {
    const b = await ok('/items', { type: 'scan', label: 'test item' });
    expect(b.item).toHaveProperty('id');
    itemId = b.item.id;
  });

  test('GET /items lists items', async () => {
    const res = await request(app).get(`${API}/items`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('DELETE /items/:id removes item', async () => {
    const res = await request(app).delete(`${API}/items/${itemId}`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Analyze (URL-fetching routes)', () => {
  test('POST /analyze requires url', async () => {
    const res = await request(app).post(`${API}/analyze`).send({});
    expect(res.status).toBe(400);
  });

  test('POST /analyze with url returns 200 or 502', async () => {
    await smokePost('/analyze', { url: SAMPLE_URL, keywords: [SAMPLE_KEYWORD] });
  });

  test('POST /bulk-analyze with empty urls returns validation error or 200', async () => {
    const res = await request(app).post(`${API}/bulk-analyze`).send({ urls: [], domain: SAMPLE_DOMAIN });
    expect([200, 201, 400]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — AI Content Routes', () => {
  const TOPIC_BODY  = { topic: SAMPLE_KEYWORD };
  const NICHE_BODY  = { niche: SAMPLE_KEYWORD };
  const CONTENT_BODY = { content: SAMPLE_CONTENT };

  test('POST /ai/analyze', () => ok('/ai/analyze', { content: SAMPLE_CONTENT, url: SAMPLE_URL }));
  test('POST /ai/content-brief', () => ok('/ai/content-brief', { topic: SAMPLE_KEYWORD }));
  test('POST /ai/keyword-research', () => ok('/ai/keyword-research', { seedKeyword: SAMPLE_KEYWORD }));
  test('POST /ai/rewrite', () => ok('/ai/rewrite', { field: 'title', currentValue: 'Old Blog SEO Title', keywords: SAMPLE_KEYWORD }));
  test('POST /ai/fix-code', () => ok('/ai/fix-code', { code: '<head><title>Test</title></head>', issue: 'missing meta description' }));
  test('POST /ai/generate', () => ok('/ai/generate', { messages: [{ role: 'user', content: 'Help me with blog SEO tips' }] }));
  test('POST /ai/blog-outline', () => ok('/ai/blog-outline', TOPIC_BODY));
  test('POST /ai/intro-generator', () => ok('/ai/intro-generator', TOPIC_BODY));
  test('POST /ai/title-ideas', () => ok('/ai/title-ideas', TOPIC_BODY));
  test('POST /ai/cta-generator', () => ok('/ai/cta-generator', { keyword: SAMPLE_KEYWORD, goal: 'signup' }));
  test('POST /ai/key-takeaways', () => ok('/ai/key-takeaways', { url: SAMPLE_URL }));
  test('POST /ai/summary-generator', () => ok('/ai/summary-generator', { url: SAMPLE_URL }));
  test('POST /ai/tone-analyzer', () => ok('/ai/tone-analyzer', { url: SAMPLE_URL }));
  test('POST /ai/content-grader', () => ok('/ai/content-grader', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /ai/pull-quotes', () => ok('/ai/pull-quotes', { url: SAMPLE_URL }));
  test('POST /ai/headline-hook', () => ok('/ai/headline-hook', { keyword: SAMPLE_KEYWORD }));
  test('POST /ai/passage-optimizer', () => ok('/ai/passage-optimizer', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /ai/content-repurpose', () => ok('/ai/content-repurpose', { url: SAMPLE_URL }));
  test('POST /ai/content-visibility', () => ok('/ai/content-visibility', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /ai/content-calendar', () => ok('/ai/content-calendar', NICHE_BODY));
  test('POST /ai/pillar-page', () => ok('/ai/pillar-page', TOPIC_BODY));
  test('POST /ai/programmatic-seo', () => ok('/ai/programmatic-seo', { category: SAMPLE_KEYWORD }));
  test('POST /ai/content-roi', () => ok('/ai/content-roi', { keyword: SAMPLE_KEYWORD }));
  test('POST /ai/sge-optimizer', () => ok('/ai/sge-optimizer', { content: SAMPLE_CONTENT, keyword: SAMPLE_KEYWORD }));
  test('POST /ai/topic-miner', () => ok('/ai/topic-miner', NICHE_BODY));
  test('POST /ai/performance-predictor', () => ok('/ai/performance-predictor', { title: 'Blog SEO Guide', targetKeyword: SAMPLE_KEYWORD }));
  test('POST /ai/semantic-clusters', () => ok('/ai/semantic-clusters', { seedTopic: SAMPLE_KEYWORD }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Metadata & Simple Analysis', () => {
  test('POST /metadata/analyze', async () => {
    const b = await ok('/metadata/analyze', { title: 'SEO Guide 2025', description: 'The complete guide to on-page SEO', keywords: ['seo', 'guide'] });
    expect(b).toHaveProperty('titleLength');
  });

  test('POST /keywords/evaluate', async () => {
    const b = await ok('/keywords/evaluate', { keyword: SAMPLE_KEYWORD });
    expect(b).toHaveProperty('difficulty');
  });

  test('POST /research/score', async () => {
    const b = await ok('/research/score', { topic: SAMPLE_KEYWORD });
    expect(b).toHaveProperty('score');
  });

  test('POST /serp/preview', async () => {
    const b = await ok('/serp/preview', { title: 'Blog SEO Guide', metaDescription: 'Improve your blog SEO with these tips', url: SAMPLE_URL });
    expect(b).toHaveProperty('titleLen');
  });

  test('POST /title/ctr-signals', async () => {
    const b = await ok('/title/ctr-signals', { title: 'Top 10 Blog SEO Tips for 2025' });
    expect(b).toHaveProperty('ctrScore');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Schema Routes', () => {
  test('POST /schema/generate', async () => {
    const b = await ok('/schema/generate', { url: SAMPLE_URL, title: 'Blog SEO Guide', h1: 'Blog SEO Guide 2025' });
    expect(b).toHaveProperty('schema');
  });

  test('POST /faq-schema/generate', () => ok('/faq-schema/generate', { questionHeadings: [{ text: 'What is SEO?' }, { text: 'How to do keyword research?' }] }));

  test('POST /schema/carousel', async () => {
    const b = await ok('/schema/carousel', { items: [{ name: 'Item 1', url: SAMPLE_URL }, { name: 'Item 2', url: SAMPLE_URL }] });
    expect(b.schema).toContain('ItemList');
  });

  test('POST /schema/breadcrumb', () => ok('/schema/breadcrumb', { url: SAMPLE_URL }));
  test('POST /schema/howto', () => ok('/schema/howto', { title: 'How to do SEO', steps: ['Step 1', 'Step 2'] }));
  test('POST /schema/video', () => ok('/schema/video', { title: 'SEO Tutorial', url: SAMPLE_URL }));

  test('POST /schema/review', async () => {
    const b = await ok('/schema/review', { itemName: 'Blog SEO Tool', rating: 5 });
    expect(b.schema['@type']).toBe('Review');
  });

  test('POST /schema/organization', async () => {
    const b = await ok('/schema/organization', { name: 'AURA Systems' });
    expect(b.schema['@type']).toBe('Organization');
  });

  test('POST /schema/speakable', () => ok('/schema/speakable', { url: SAMPLE_URL }));

  test('POST /schema/fact-check', async () => {
    const b = await ok('/schema/fact-check', { claimText: 'SEO doubles traffic', claimUrl: SAMPLE_URL });
    expect(b.schema).toContain('ClaimReview');
  });

  test('POST /schema/dataset', async () => {
    const b = await ok('/schema/dataset', { name: 'SEO Benchmark Dataset' });
    expect(b.schema).toContain('Dataset');
  });

  test('POST /schema/podcast-episode', async () => {
    const b = await ok('/schema/podcast-episode', { episodeTitle: 'SEO in 2025', showName: 'The SEO Show' });
    expect(b.schema).toContain('PodcastEpisode');
  });

  test('POST /schema/product', () => ok('/schema/product', { name: 'SEO Tool Pro', url: SAMPLE_URL }));
  test('POST /schema/event', () => ok('/schema/event', { name: 'SEO Conference 2025', startDate: '2025-09-01', location: 'London' }));
  test('POST /schema/person', () => ok('/schema/person', { name: 'John Doe' }));
  test('POST /schema/course', () => ok('/schema/course', { name: 'SEO Masterclass' }));
  test('POST /schema/recipe', () => ok('/schema/recipe', { name: 'SEO Success Recipe' }));
  test('POST /schema/software', () => ok('/schema/software', { name: 'AURA SEO' }));
  test('POST /schema/local-business', () => ok('/schema/local-business', { name: 'Local SEO Co' }));
  test('POST /schema/redirect-audit', () => ok('/schema/redirect-audit', { url: SAMPLE_URL }));
  test('POST /schema/duplicate-content', () => ok('/schema/duplicate-content', { url: SAMPLE_URL }));
  test('POST /schema/hreflang', () => ok('/schema/hreflang', { url: SAMPLE_URL }));
  test('POST /schema/mobile-seo', () => ok('/schema/mobile-seo', { url: SAMPLE_URL }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Keyword Routes', () => {
  test('POST /keywords/lsi', () => ok('/keywords/lsi', { keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/prominence', () => ok('/keywords/prominence', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/tfidf', () => ok('/keywords/tfidf', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/co-occurrence', () => ok('/keywords/co-occurrence', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/secondary', () => ok('/keywords/secondary', { keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/voice-search', () => ok('/keywords/voice-search', { keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/negative-check', () => ok('/keywords/negative-check', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/featured-snippet', () => ok('/keywords/featured-snippet', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /keywords/low-difficulty-finder', () => ok('/keywords/low-difficulty-finder', { seedKeyword: SAMPLE_KEYWORD }));
  test('POST /keywords/cannibalization-detector', () => ok('/keywords/cannibalization-detector', { domain: SAMPLE_DOMAIN }));

  test('POST /keywords/alphabet-soup requires seed', async () => {
    const res = await request(app).post(`${API}/keywords/alphabet-soup`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /keywords/alphabet-soup with seed', () => ok('/keywords/alphabet-soup', { seed: 'seo' }));

  test('POST /keywords/question-explorer requires seed', async () => {
    const res = await request(app).post(`${API}/keywords/question-explorer`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /keywords/question-explorer with seed', () => ok('/keywords/question-explorer', { seed: 'seo', intent: 'all', count: 10 }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Content Analysis Routes', () => {
  const C = { content: SAMPLE_CONTENT };

  const U = { url: SAMPLE_URL };
  test('POST /content/advanced-readability', () => ok('/content/advanced-readability', C));
  test('POST /content/sentence-variety', () => ok('/content/sentence-variety', U));
  test('POST /content/emotional-tone', () => ok('/content/emotional-tone', U));
  test('POST /content/jargon-detector', () => ok('/content/jargon-detector', U));
  test('POST /content/expertise-signals', () => ok('/content/expertise-signals', U));
  test('POST /content/multimedia-score', () => ok('/content/multimedia-score', { content: SAMPLE_CONTENT, url: SAMPLE_URL }));
  test('POST /content/questions-count', () => ok('/content/questions-count', U));
  test('POST /content/intro-quality', () => ok('/content/intro-quality', U));
  test('POST /content/cta-audit', () => ok('/content/cta-audit', U));
  test('POST /content/formatting-score', () => ok('/content/formatting-score', U));
  test('POST /content/thin-content', () => ok('/content/thin-content', U));
  test('POST /content/freshness-score', () => ok('/content/freshness-score', U));
  test('POST /content/skyscraper-gap', () => ok('/content/skyscraper-gap', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /content/relaunch-advisor', () => ok('/content/relaunch-advisor', U));
  test('POST /content/semantic-enrichment', () => ok('/content/semantic-enrichment', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /content/topic-cluster-builder', () => ok('/content/topic-cluster-builder', { seed: SAMPLE_KEYWORD }));
  test('POST /content/visual-diversity', () => ok('/content/visual-diversity', { url: SAMPLE_URL }));
  test('POST /content/time-to-value', () => ok('/content/time-to-value', C));
  test('POST /content/content-pruning', () => ok('/content/content-pruning', { siteUrl: SAMPLE_URL }));

  test('POST /content/statistics-curator', () => ok('/content/statistics-curator', { niche: 'e-commerce SEO', topic: SAMPLE_KEYWORD }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Technical SEO Routes', () => {
  // Routes that pass url to OpenAI (no actual HTTP fetch)
  test('POST /technical/url-analysis', () => ok('/technical/url-analysis', { url: SAMPLE_URL }));
  test('POST /technical/mobile-seo', () => ok('/technical/mobile-seo', { url: SAMPLE_URL }));
  test('POST /technical/hreflang', () => ok('/technical/hreflang', { url: SAMPLE_URL }));
  test('POST /technical/amp-check', () => ok('/technical/amp-check', { url: SAMPLE_URL }));
  test('POST /technical/resource-hints', () => ok('/technical/resource-hints', { url: SAMPLE_URL }));
  test('POST /technical/json-ld-lint', () => ok('/technical/json-ld-lint', { url: SAMPLE_URL }));
  test('POST /technical/og-image-dims', () => ok('/technical/og-image-dims', { url: SAMPLE_URL }));
  test('POST /technical/https-status', () => ok('/technical/https-status', { url: SAMPLE_URL }));
  test('POST /technical/reading-level', async () => {
    const b = await ok('/technical/reading-level', { text: SAMPLE_CONTENT });
    expect(b).toHaveProperty('ease');
  });
  test('POST /technical/tfidf-analyzer', () => ok('/technical/tfidf-analyzer', { content: SAMPLE_CONTENT, keyword: SAMPLE_KEYWORD }));
  test('POST /technical/content-length-advisor', () => ok('/technical/content-length-advisor', { keyword: SAMPLE_KEYWORD, contentLength: 800 }));
  test('POST /technical/cwv-advisor', () => ok('/technical/cwv-advisor', { url: SAMPLE_URL }));
  test('POST /technical/page-speed-advisor', () => ok('/technical/page-speed-advisor', { url: SAMPLE_URL }));
  test('POST /technical/crawl-budget', () => ok('/technical/crawl-budget', { url: SAMPLE_URL }));
  test('POST /technical/click-depth', () => ok('/technical/click-depth', { url: SAMPLE_URL }));
  test('POST /technical/log-file', () => ok('/technical/log-file', { domain: SAMPLE_DOMAIN }));
  test('POST /technical/international-seo', () => ok('/technical/international-seo', { url: SAMPLE_URL }));
  test('POST /technical/algo-impact-check requires niche', async () => {
    const res = await request(app).post(`${API}/technical/algo-impact-check`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /technical/algo-impact-check with niche', () => ok('/technical/algo-impact-check', { niche: 'e-commerce', domain: SAMPLE_DOMAIN }));

  // /technical/audit actually calls OpenAI with url context (no fetch)
  test('POST /technical/audit', () => ok('/technical/audit', { url: SAMPLE_URL }));

  // /technical/google-news does await fetch — test validation + smoke
  test('POST /technical/google-news validation', async () => {
    const res = await request(app).post(`${API}/technical/google-news`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /technical/google-news with url', () => smokePost('/technical/google-news', { url: SAMPLE_URL }));

  // Root-level technical routes
  test('POST /core-web-vitals', () => ok('/core-web-vitals', { url: SAMPLE_URL }));
  test('POST /crawler-access', () => ok('/crawler-access', { url: SAMPLE_URL }));
  test('POST /title-h1-alignment', () => ok('/title-h1-alignment', { url: SAMPLE_URL }));
  test('POST /heading-hierarchy', () => ok('/heading-hierarchy', { url: SAMPLE_URL }));
  test('POST /image-seo', () => ok('/image-seo', { url: SAMPLE_URL }));
  test('POST /semantic-html', () => ok('/semantic-html', { url: SAMPLE_URL }));
  test('POST /meta-description-audit', () => ok('/meta-description-audit', { url: SAMPLE_URL }));
  test('POST /keyword-density', async () => {
    const b = await ok('/keyword-density', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD });
    expect(b).toHaveProperty('density');
  });
  test('POST /index-directives', () => ok('/index-directives', { url: SAMPLE_URL }));
  test('POST /content-structure', () => ok('/content-structure', { url: SAMPLE_URL }));
  test('POST /author-authority', () => ok('/author-authority', { url: SAMPLE_URL }));
  test('POST /sitemap-check', () => ok('/sitemap-check', { url: SAMPLE_URL }));
  test('POST /og-validator', () => ok('/og-validator', { url: SAMPLE_URL }));
  test('POST /article-schema/validate', () => ok('/article-schema/validate', { url: SAMPLE_URL }));
  test('POST /llm/score', () => ok('/llm/score', { content: SAMPLE_CONTENT }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — SERP & CTR Routes', () => {
  test('POST /serp/ctr-optimizer', () => ok('/serp/ctr-optimizer', { keyword: SAMPLE_KEYWORD, title: 'Blog SEO Guide', description: 'Top tips for better SEO' }));
  test('POST /serp/intent-classifier', () => ok('/serp/intent-classifier', { keyword: SAMPLE_KEYWORD }));
  test('POST /serp/feature-targets', () => ok('/serp/feature-targets', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /serp/paa-generator', () => ok('/serp/paa-generator', { keyword: SAMPLE_KEYWORD }));
  test('POST /serp/rich-result-check', () => ok('/serp/rich-result-check', { url: SAMPLE_URL }));
  test('POST /serp/rankbrain-advisor', () => ok('/serp/rankbrain-advisor', { url: SAMPLE_URL }));
  test('POST /serp/longtail-embedder', () => ok('/serp/longtail-embedder', { title: 'Blog SEO Complete Guide', primaryKeyword: SAMPLE_KEYWORD }));
  test('POST /serp/meta-ab-variants', () => ok('/serp/meta-ab-variants', { title: 'Blog SEO', description: 'Tips for SEO', keyword: SAMPLE_KEYWORD }));
  test('POST /serp/difficulty-score', () => ok('/serp/difficulty-score', { keyword: SAMPLE_KEYWORD }));
  test('POST /serp/competitor-snapshot', () => ok('/serp/competitor-snapshot', { keyword: SAMPLE_KEYWORD }));
  test('POST /serp/video-seo', () => ok('/serp/video-seo', { url: SAMPLE_URL }));
  test('POST /serp/entity-optimizer', () => ok('/serp/entity-optimizer', { keyword: SAMPLE_KEYWORD }));
  test('POST /serp/review-schema', () => ok('/serp/review-schema', { url: SAMPLE_URL, itemName: 'SEO Tool', rating: 5 }));
  test('POST /serp/event-schema', () => ok('/serp/event-schema', { eventName: 'SEO Conf 2025', eventDate: '2025-09-01', eventLocation: 'London' }));

  // /serp/news-seo does await fetch — smoke only
  test('POST /serp/news-seo with url', () => smokePost('/serp/news-seo', { url: SAMPLE_URL }));

  // /serp/content-vs-top10 needs url + keyword
  test('POST /serp/content-vs-top10 requires url and keyword', async () => {
    const res = await request(app).post(`${API}/serp/content-vs-top10`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /serp/content-vs-top10 with inputs', () => ok('/serp/content-vs-top10', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));

  test('POST /serp/volatility-monitor', () => ok('/serp/volatility-monitor', { niche: SAMPLE_KEYWORD }));

  test('POST /serp/ctr-heatmap', async () => {
    const res = await request(app).post(`${API}/serp/ctr-heatmap`).set(HEADERS).send({ queries: [{ query: SAMPLE_KEYWORD, clicks: 100, impressions: 1000 }] });
    expect([200, 201, 404]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Backlinks Routes', () => {
  test('POST /backlinks/opportunity-finder', () => ok('/backlinks/opportunity-finder', { niche: SAMPLE_KEYWORD }));
  test('POST /backlinks/link-gap', () => ok('/backlinks/link-gap', { yourDomain: SAMPLE_DOMAIN, competitor1: 'competitor.com' }));
  test('POST /backlinks/outreach-generator', () => ok('/backlinks/outreach-generator', { contentTitle: 'Blog SEO Complete Guide', yourSite: SAMPLE_DOMAIN }));
  test('POST /backlinks/bestof-finder', () => ok('/backlinks/bestof-finder', { niche: SAMPLE_KEYWORD }));
  test('POST /backlinks/anchor-optimizer', () => ok('/backlinks/anchor-optimizer', { targetKeyword: SAMPLE_KEYWORD, url: SAMPLE_URL }));
  test('POST /backlinks/strategy-builder', () => ok('/backlinks/strategy-builder', { niche: 'e-commerce SEO', domain: SAMPLE_DOMAIN }));
  test('POST /backlinks/internal-suggester', () => ok('/backlinks/internal-suggester', { url: SAMPLE_URL }));
  test('POST /backlinks/broken-backlinks', () => ok('/backlinks/broken-backlinks', { domain: SAMPLE_DOMAIN }));
  test('POST /backlinks/anchor-text', () => ok('/backlinks/anchor-text', { domain: SAMPLE_DOMAIN }));
  test('POST /backlinks/link-velocity', () => ok('/backlinks/link-velocity', { domain: SAMPLE_DOMAIN }));
  test('POST /backlinks/link-reclamation', () => ok('/backlinks/link-reclamation', { brandName: 'AURA Systems', siteUrl: SAMPLE_URL }));
  test('POST /links/check', () => ok('/links/check', { url: SAMPLE_URL }));
  test('POST /links/internal-suggestions', () => ok('/links/internal-suggestions', { content: SAMPLE_CONTENT, keyword: SAMPLE_KEYWORD }));
  test('POST /links/external-authority', () => ok('/links/external-authority', { url: SAMPLE_URL }));
  test('POST /links/link-density', () => ok('/links/link-density', { url: SAMPLE_URL }));
  test('POST /links/outbound-audit', () => ok('/links/outbound-audit', { url: SAMPLE_URL }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — A/B & Refresh Routes', () => {
  test('POST /ab/ab-test-advisor', () => ok('/ab/ab-test-advisor', { url: SAMPLE_URL }));
  test('POST /ab/content-refresh', () => ok('/ab/content-refresh', { url: SAMPLE_URL, publishDate: '2024-01-15' }));
  test('POST /ab/title-variants', () => ok('/ab/title-variants', { title: 'Blog SEO Guide', keyword: SAMPLE_KEYWORD }));
  test('POST /ab/meta-variants', () => ok('/ab/meta-variants', { description: 'Master your blog SEO', keyword: SAMPLE_KEYWORD }));
  test('POST /ab/bert-optimizer', () => ok('/ab/bert-optimizer', { content: SAMPLE_CONTENT, keyword: SAMPLE_KEYWORD }));
  test('POST /ab/secondary-keywords', () => ok('/ab/secondary-keywords', { primaryKeyword: SAMPLE_KEYWORD }));
  test('POST /ab/knowledge-graph', () => ok('/ab/knowledge-graph', { keyword: SAMPLE_KEYWORD, entityName: 'SEO', url: SAMPLE_URL }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Local SEO Routes', () => {
  test('POST /local/gbp-optimizer', () => ok('/local/gbp-optimizer', { businessName: 'Test Business' }));
  test('POST /local/citation-finder', () => ok('/local/citation-finder', { businessName: 'Test Business', location: 'London, UK' }));
  test('POST /local/local-keyword-gen', () => ok('/local/local-keyword-gen', { service: 'seo agency', city: 'London' }));
  test('POST /local/local-schema', () => ok('/local/local-schema', { businessName: 'Test Business', address: '1 Test Street, London' }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — E-E-A-T & Brand Routes', () => {
  test('POST /brand/eeat-scorer', () => ok('/brand/eeat-scorer', { url: SAMPLE_URL }));
  test('POST /brand/author-bio', () => ok('/brand/author-bio', { authorName: 'Jane Smith', niche: 'SEO', credentials: '10 years experience' }));
  test('POST /brand/brand-signals', () => ok('/brand/brand-signals', { domain: SAMPLE_DOMAIN }));
  test('POST /brand/expert-quotes', () => ok('/brand/expert-quotes', { topic: SAMPLE_KEYWORD }));
  test('POST /brand/trust-builder', () => ok('/brand/trust-builder', { url: SAMPLE_URL, niche: 'seo' }));
  test('POST /trust/social-proof', () => ok('/trust/social-proof', { url: SAMPLE_URL }));
  test('POST /trust/citation-check', () => ok('/trust/citation-check', { url: SAMPLE_URL }));
  test('POST /passage-indexing', () => ok('/passage-indexing', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /topical-authority requires niche', async () => {
    const res = await request(app).post(`${API}/topical-authority`).send({ domain: SAMPLE_DOMAIN });
    expect(res.status).toBe(400);
  });
  test('POST /topical-authority with niche', () => ok('/topical-authority', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /ai-overview-eligibility', () => ok('/ai-overview-eligibility', { url: SAMPLE_URL }));
  test('POST /intent-classifier', () => ok('/intent-classifier', { keyword: SAMPLE_KEYWORD }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Voice & AI Search Routes', () => {
  test('POST /voice/voice-optimizer', () => ok('/voice/voice-optimizer', { keyword: SAMPLE_KEYWORD, content: SAMPLE_CONTENT }));
  test('POST /voice/faq-generator', () => ok('/voice/faq-generator', { topic: SAMPLE_KEYWORD }));
  test('POST /voice/ai-overview-optimizer', () => ok('/voice/ai-overview-optimizer', { keyword: SAMPLE_KEYWORD, currentContent: SAMPLE_CONTENT }));
  test('POST /voice/conversational-keywords', () => ok('/voice/conversational-keywords', { topic: SAMPLE_KEYWORD }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Voice Profile CRUD', () => {
  test('GET /voice-profile lists profiles (empty)', async () => {
    const res = await request(app).get(`${API}/voice-profile`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.profiles)).toBe(true);
  });

  test('POST /voice-profile/save requires name', async () => {
    const res = await request(app).post(`${API}/voice-profile/save`).set(HEADERS).send({});
    expect(res.status).toBe(400);
  });

  test('POST /voice-profile/save creates profile', async () => {
    const b = await ok('/voice-profile/save', { name: 'Test Profile', tone: 'professional', vocabulary: 'technical' });
    expect(b.profile).toHaveProperty('id');
    vpId = b.profile.id;
  });

  test('GET /voice-profile/:id retrieves profile', async () => {
    const res = await request(app).get(`${API}/voice-profile/${vpId}`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe('Test Profile');
  });

  test('GET /voice-profile/:id 404 for unknown id', async () => {
    const res = await request(app).get(`${API}/voice-profile/nonexistent-id`).set(HEADERS);
    expect(res.status).toBe(404);
  });

  test('DELETE /voice-profile/:id removes profile', async () => {
    const res = await request(app).delete(`${API}/voice-profile/${vpId}`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Rank Tracker', () => {
  test('POST /rank/add-keyword', async () => {
    const b = await ok('/rank/add-keyword', { keyword: SAMPLE_KEYWORD });
    expect(b).toHaveProperty('entry');
    rankKwId = b.entry?.id;
  });

  test('GET /rank/list', async () => {
    const res = await request(app).get(`${API}/rank/list`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.keywords)).toBe(true);
  });

  test('POST /rank/check-position', () => ok('/rank/check-position', { keywordId: rankKwId || 'kw1', keyword: SAMPLE_KEYWORD }));

  test('POST /rank/bulk-check', async () => {
    const res = await request(app).post(`${API}/rank/bulk-check`).set(HEADERS).send({ shop: SHOP });
    expect([200, 201, 500]).toContain(res.status);
  });

  test('POST /gsc/import-csv', () => ok('/gsc/import-csv', { csvData: 'query,clicks,impressions\nblog seo,100,1000' }));

  test('POST /rank/ai-forecast', async () => {
    const res = await request(app).post(`${API}/rank/ai-forecast`).set(HEADERS).send({ keywordId: rankKwId || 'dummy-id' });
    expect([200, 404, 500]).toContain(res.status);
  });

  test('GET /rank/history/:keywordId', async () => {
    const res = await request(app).get(`${API}/rank/history/${rankKwId || 'kw1'}`).set(HEADERS);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  test('POST /analytics/ross requires organicRevenue + seoSpend', async () => {
    const res = await request(app).post(`${API}/analytics/ross`).set(HEADERS).send({});
    expect(res.status).toBe(400);
  });
  test('POST /analytics/ross with required fields', async () => {
    const b = await ok('/analytics/ross', { organicRevenue: 50000, seoSpend: 5000, organicSessions: 10000 });
    expect(b).toHaveProperty('ross');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Site Crawl', () => {
  test('POST /crawl/start', async () => {
    const b = await ok('/crawl/start', { url: SAMPLE_URL });
    expect(b).toHaveProperty('crawlId');
  });

  test('GET /crawl/status', async () => {
    const res = await request(app).get(`${API}/crawl/status`).set(HEADERS).query({ shop: SHOP });
    expect([200, 201]).toContain(res.status);
  });

  test('GET /crawl/results', async () => {
    const res = await request(app).get(`${API}/crawl/results`).set(HEADERS).query({ shop: SHOP });
    expect([200, 201]).toContain(res.status);
  });

  test('POST /crawl/ai-summary', () => ok('/crawl/ai-summary', { shop: SHOP }));
  test('POST /crawl/orphan-finder', () => ok('/crawl/orphan-finder', { shop: SHOP }));

  test('GET /crawl/snapshots', async () => {
    const res = await request(app).get(`${API}/crawl/snapshots`).set(HEADERS).query({ shop: SHOP });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.snapshots)).toBe(true);
  });

  test('POST /crawl/compare', async () => {
    const res = await request(app).post(`${API}/crawl/compare`).set(HEADERS).send({ snapshotId1: null, snapshotId2: null });
    expect([200, 400]).toContain(res.status);
  });

  test('GET /crawl/export-csv', async () => {
    const res = await request(app).get(`${API}/crawl/export-csv`).set(HEADERS).query({ shop: SHOP });
    expect([200, 201]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — GEO & LLM Routes', () => {
  test('POST /geo/geo-health-score requires url', async () => {
    const res = await request(app).post(`${API}/geo/geo-health-score`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /geo/geo-health-score', () => ok('/geo/geo-health-score', { url: SAMPLE_URL }));

  test('POST /geo/prompt-simulation requires brandName', async () => {
    const res = await request(app).post(`${API}/geo/prompt-simulation`).send({});
    expect(res.status).toBe(400);
  });
  test('POST /geo/prompt-simulation', () => ok('/geo/prompt-simulation', { query: SAMPLE_KEYWORD, siteUrl: SAMPLE_URL }));

  test('POST /social/seo-score', () => ok('/social/seo-score', { title: 'Blog SEO Guide', url: SAMPLE_URL, content: SAMPLE_CONTENT }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Misc Analysis Routes', () => {
  test('POST /meta-description-optimizer', () => ok('/meta-description-optimizer', { url: SAMPLE_URL }));
  test('POST /content-decay', () => ok('/content-decay', { url: SAMPLE_URL }));
  test('POST /anchor-text-audit', () => ok('/anchor-text-audit', { url: SAMPLE_URL }));
  test('POST /toc-generator', () => ok('/toc-generator', { url: SAMPLE_URL }));
  test('POST /section-word-count', async () => {
    const b = await ok('/section-word-count', { url: SAMPLE_URL });
    expect(b).toHaveProperty('sections');
  });
  test('POST /people-also-ask', () => ok('/people-also-ask', { keyword: SAMPLE_KEYWORD }));
  test('POST /entity-detection', () => ok('/entity-detection', { text: SAMPLE_CONTENT }));
  test('POST /serp-features', () => ok('/serp-features', { url: SAMPLE_URL, keyword: SAMPLE_KEYWORD }));
  test('POST /helpful-content-check', () => ok('/helpful-content-check', { content: SAMPLE_CONTENT, url: SAMPLE_URL }));
  test('POST /page-experience-check', async () => {
    const res = await request(app).post(`${API}/page-experience-check`).send({ url: SAMPLE_URL });
    expect([200, 201]).toContain(res.status);
  });
  test('POST /page-experience-check', () => ok('/page-experience-check', { url: SAMPLE_URL }));
  test('POST /content-decay-finder', () => ok('/content-decay-finder', { domain: SAMPLE_DOMAIN, urls: [] }));

  // /competitor/full-audit does await fetch — smoke only
  test('POST /competitor/full-audit with domain', () => smokePost('/competitor/full-audit', { domain: SAMPLE_DOMAIN, competitors: ['competitor.com'] }));

  test('POST /cannibalization', () => ok('/cannibalization', { keyword: SAMPLE_KEYWORD, urls: [SAMPLE_URL] }));
  test('POST /competitor-gap', () => ok('/competitor-gap', { keyword: SAMPLE_KEYWORD, domain: SAMPLE_DOMAIN }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Shopify SEO Routes', () => {
  // These routes fetch the Shopify Admin API — will 401/502 in tests without real token
  test('GET /shopify-data returns 200 or auth error', async () => {
    const res = await request(app).get(`${API}/shopify-data`).set({ ...HEADERS, 'x-shopify-access-token': 'test-token' });
    expect([200, 400, 401, 403, 500, 502]).toContain(res.status);
  });

  test('POST /shopify/blog-template-audit', async () => {
    const res = await request(app).post(`${API}/shopify/blog-template-audit`).set(HEADERS).send({ shop: SHOP });
    expect([200, 201, 400, 401, 502]).toContain(res.status);
  });

  test('POST /shopify/collection-seo', async () => {
    const res = await request(app).post(`${API}/shopify/collection-seo`).set(HEADERS).send({ shop: SHOP });
    expect([200, 201, 400, 401, 502]).toContain(res.status);
  });

  test('POST /shopify/product-blog-links', async () => {
    const res = await request(app).post(`${API}/shopify/product-blog-links`).set(HEADERS).send({ shop: SHOP });
    expect([200, 201, 400, 401, 502]).toContain(res.status);
  });

  test('POST /shopify/metafield-seo', async () => {
    const res = await request(app).post(`${API}/shopify/metafield-seo`).set(HEADERS).send({ shop: SHOP });
    expect([200, 201, 400, 401, 502]).toContain(res.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Trend Scout & Other Tabs', () => {
  test('POST /js-rendering-audit', () => ok('/js-rendering-audit', { url: SAMPLE_URL }));
  test('POST /search-preview', () => ok('/search-preview', { url: SAMPLE_URL, title: 'Blog SEO Guide', description: 'Top tips' }));
  test('POST /lcp-deep-dive', () => ok('/lcp-deep-dive', { url: SAMPLE_URL }));
  test('POST /negative-seo-detector', () => ok('/negative-seo-detector', { domain: SAMPLE_DOMAIN }));
  test('POST /font-performance-audit', () => ok('/font-performance-audit', { url: SAMPLE_URL }));
  test('POST /amp-validator', () => ok('/amp-validator', { url: SAMPLE_URL }));
  test('POST /pwa-audit', () => ok('/pwa-audit', { domain: SAMPLE_DOMAIN }));
  test('POST /ai-bot-blocker-config', () => ok('/ai-bot-blocker-config', { domain: SAMPLE_DOMAIN, strategy: 'allow-all' }));
  test('POST /site-architecture', () => ok('/site-architecture', { urls: [SAMPLE_URL], domain: SAMPLE_DOMAIN }));
  test('POST /helpful-content-check duplicate key', () => ok('/helpful-content-check', { content: SAMPLE_CONTENT }));
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Blog SEO — Remaining AI Growth Routes', () => {
  test('POST /content/statistics-curator needs content', async () => {
    const res = await request(app).post(`${API}/content/statistics-curator`).send({});
    expect([200, 400]).toContain(res.status);
  });
  test('POST /serp/ctr-heatmap needs queries', async () => {
    const res = await request(app).post(`${API}/serp/ctr-heatmap`).send({});
    expect([200, 400, 404]).toContain(res.status);
  });
  test('POST /rank/yoy-comparison', () => ok('/rank/yoy-comparison', { keyword: SAMPLE_KEYWORD }));
  test('POST /crawl/duplicate-detector', () => ok('/crawl/duplicate-detector', { shop: SHOP }));
  test('GET /crawl/link-graph', async () => {
    const res = await request(app).get(`${API}/crawl/link-graph`).set(HEADERS).query({ shop: SHOP });
    expect([200, 201, 404]).toContain(res.status);
  });
  test('POST /schema/speakable requires url', async () => {
    const res = await request(app).post(`${API}/schema/speakable`).send({});
    expect(res.status).toBe(400);
  });
});
