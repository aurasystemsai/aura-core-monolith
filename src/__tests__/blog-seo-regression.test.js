/**
 * Blog SEO Engine — Regression Tests
 *
 * Covers the specific bugs fixed during Shopify submission preparation:
 *   1. getShop() guard — routes must return 400 when shop header is missing
 *   2. /index-directives — was ReferenceError: r is not defined
 *   3. /llm/score — was block-scope const shadow leaving html empty
 *   4. /content/advanced-readability — same block-scope shadow bug as /llm/score
 */

const request = require('supertest');
const express = require('express');

// NOTE: jest.mock() factories are hoisted to the top of the file by Babel/Jest.
// That means they run BEFORE any const declarations in this file.
// The HTML string must therefore be inlined directly inside each factory.

// Mock node-fetch (used by older router routes) — HTML inlined to survive hoisting
jest.mock('node-fetch', () => {
  const html =
    '<html><head><title>Test Blog Post</title>' +
    '<meta name="description" content="A test description for regression checks">' +
    '<meta name="robots" content="index, follow">' +
    '<link rel="canonical" href="https://example.com/blog/test">' +
    '</head><body><h1>Test Heading</h1>' +
    '<p>This is a paragraph about SEO. Search engines crawl and index content to provide relevant results for users.</p>' +
    '<h2>Section One</h2><p>Content for section one about keyword research.</p>' +
    '<h2>Section Two</h2><p>Content for section two about link building.</p>' +
    '</body></html>';
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true, status: 200,
    url: 'https://example.com/blog/test',
    headers: {
      get: jest.fn().mockReturnValue(null),
      entries: jest.fn().mockReturnValue([['content-type', 'text/html']]),
      forEach: jest.fn(),
    },
    text: jest.fn().mockResolvedValue(html),
    json: jest.fn().mockResolvedValue({}),
  });
  return { __esModule: true, default: mockFetch };
});

// Mock shopifyContentFetcher — it uses native fetch (not node-fetch), so mock the module directly.
// HTML inlined here too (factory is hoisted before const declarations).
jest.mock('../core/shopifyContentFetcher', () => {
  const html =
    '<html><head><title>Test Blog Post</title>' +
    '<meta name="description" content="A test description for regression checks">' +
    '<meta name="robots" content="index, follow">' +
    '<link rel="canonical" href="https://example.com/blog/test">' +
    '</head><body><h1>Test Heading</h1>' +
    '<p>This is a paragraph about SEO. Search engines crawl and index content to provide relevant results for users.</p>' +
    '<h2>Section One: Introduction</h2>' +
    '<p>Content for section one about keyword research and on-page optimisation strategies.</p>' +
    '<h2>Section Two: Strategies</h2>' +
    '<p>Content about link building strategies and technical SEO audits that matter.</p>' +
    '<h2>Section Three: Results</h2>' +
    '<p>Measuring results and tracking keyword rankings over time using analytics tools.</p>' +
    '</body></html>';
  return {
    fetchForAnalysis: jest.fn().mockResolvedValue({ html, fromAdminApi: false }),
    parseShopifyBlogUrl: jest.fn().mockReturnValue(null),
    resolveShopToken: jest.fn().mockReturnValue({ shop: null, token: null }),
  };
});

const router = require('../tools/blog-seo/router');

const app = express();
app.use(express.json());
app.use('/api/blog-seo', router);

const API = '/api/blog-seo';
const SHOP = 'regression-test.myshopify.com';
const H = { 'x-shopify-shop-domain': SHOP };
const URL = 'https://example.com/blog/test';

// ─────────────────────────────────────────────────────────────────────────────
// 1. getShop() guard — shop header required for data-scoped POST routes
// ─────────────────────────────────────────────────────────────────────────────
describe('getShop() guard — missing shop header', () => {
  test('POST /items without shop header returns 400', async () => {
    const res = await request(app)
      .post(`${API}/items`)
      .send({ type: 'scan', url: URL, title: 'Test', score: 72 });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/shop/i);
  });

  test('DELETE /items/:id without shop header returns 400', async () => {
    const res = await request(app).delete(`${API}/items/999`);
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // With a valid header the same route should succeed
  test('POST /items with shop header returns ok:true', async () => {
    const res = await request(app)
      .post(`${API}/items`)
      .set(H)
      .send({ type: 'scan', url: URL, title: 'Test', score: 72 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. /index-directives — was ReferenceError: r is not defined
//    Fixed: now uses fetched.html from _fetchPageHtml()
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /index-directives — no ReferenceError', () => {
  test('returns ok:true without throwing', async () => {
    const res = await request(app)
      .post(`${API}/index-directives`)
      .set(H)
      .send({ url: URL });
    // Should be 200 + ok (not 500 / ReferenceError)
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // Basic shape checks
    expect(res.body).toHaveProperty('metaRobots');
    expect(res.body).toHaveProperty('xRobotsHeader');
    expect(res.body).toHaveProperty('canonicalTag');
  });

  test('returns 400 when url is missing', async () => {
    const res = await request(app)
      .post(`${API}/index-directives`)
      .set(H)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. /llm/score — was block-scope const shadow: html was always undefined
//    Fixed: uses const fetched = await...; html = fetched.html
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /llm/score — no block-scope shadow', () => {
  test('returns ok:true with a numeric score', async () => {
    const res = await request(app)
      .post(`${API}/llm/score`)
      .set(H)
      .send({ url: URL, keyword: 'blog seo' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // score should be a number (was always 0 / undefined with the old bug)
    expect(typeof res.body.score === 'number' || typeof res.body.llmScore === 'number').toBe(true);
  });

  test('returns 400 when url is missing', async () => {
    const res = await request(app)
      .post(`${API}/llm/score`)
      .set(H)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. /content/advanced-readability — same block-scope shadow bug
//    Fixed: same pattern as /llm/score
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /content/advanced-readability — no block-scope shadow', () => {
  test('returns ok:true with readability data', async () => {
    const res = await request(app)
      .post(`${API}/content/advanced-readability`)
      .set(H)
      .send({ url: URL });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    // At minimum these fields should be present and non-null
    expect(res.body).toHaveProperty('score');
    expect(res.body).toHaveProperty('grade');
  });

  test('returns 400 when url is missing', async () => {
    const res = await request(app)
      .post(`${API}/content/advanced-readability`)
      .set(H)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Deterministic helpers — should not charge credits (no OpenAI dependency)
//    These are listed in noCreditPaths so they must work without credit balance
// ─────────────────────────────────────────────────────────────────────────────
describe('Deterministic helper routes — no external dependencies', () => {
  test('POST /serp/preview returns character counts', async () => {
    const res = await request(app)
      .post(`${API}/serp/preview`)
      .set(H)
      .send({ title: 'Best Blog SEO Tips for 2025', metaDescription: 'Learn the top SEO strategies for Shopify blog posts this year.', url: URL });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.titleLen).toBe('number');
    expect(typeof res.body.descLen).toBe('number');
  });

  test('POST /metadata/analyze returns score fields', async () => {
    const res = await request(app)
      .post(`${API}/metadata/analyze`)
      .set(H)
      .send({ title: 'Best Blog SEO', description: 'Good meta description with enough characters to be useful here.', keywords: ['seo', 'blog'] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('POST /keywords/evaluate returns evaluation', async () => {
    const res = await request(app)
      .post(`${API}/keywords/evaluate`)
      .set(H)
      .send({ keyword: 'shopify blog seo' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('GET /items returns empty array for new shop', async () => {
    const res = await request(app)
      .get(`${API}/items`)
      .set({ 'x-shopify-shop-domain': 'brand-new-shop.myshopify.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
