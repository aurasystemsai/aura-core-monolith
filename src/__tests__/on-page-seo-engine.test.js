const express = require('express');
const request = require('supertest');
const { analyzeOnPage } = require('../core/onPage');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/shopifyApply', () => ({ applyProductFields: jest.fn(async () => ({})) }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
const { applyProductFields } = require('../core/shopifyApply');
const { getOpenAIClient } = require('../core/openaiClient');

const long = 'Our handmade blue mug is glazed by hand. ' + 'It holds coffee and tea very well. '.repeat(60);
const ENTITY = { id: 'gid://shopify/Product/1', type: 'product', handle: 'blue-mug', url: 'u', title: 'Blue Mug',
  seoTitle: 'Handmade Blue Mug | Clay Co Ceramics', seoDescription: 'Shop our handmade blue mug, glazed by hand in small batches and built for everyday coffee, tea and more. Free UK delivery.',
  html: `<p>${long}</p><h2>Care</h2><img src="a" alt="mug"><img src="b">`, text: long, images: [] };

describe('analyzeOnPage', () => {
  test('scores keyword placement', () => {
    const r = analyzeOnPage(ENTITY, 'blue mug');
    const by = Object.fromEntries(r.checks.map(c => [c.id, c.status]));
    expect(by['kw-title']).toBe('pass');
    expect(by['kw-meta']).toBe('pass');
    expect(by['kw-intro']).toBe('pass');
    expect(by['alt']).toBe('fail');
    expect(r.score).toBeGreaterThan(60);
  });
  test('flags missing keyword and thin content', () => {
    const r = analyzeOnPage({ ...ENTITY, seoTitle: 'Mug', seoDescription: '', text: 'short', html: '<p>short</p>' }, 'teapot');
    const by = Object.fromEntries(r.checks.map(c => [c.id, c.status]));
    expect(by['kw-title']).toBe('fail');
    expect(by['meta-length']).toBe('fail');
    expect(by['word-count']).toBe('fail');
    expect(r.score).toBeLessThan(30);
  });
  test('detects stuffing', () => {
    const t = 'mug '.repeat(50);
    const r = analyzeOnPage({ ...ENTITY, text: t, html: t }, 'mug');
    expect(r.checks.find(c => c.id === 'kw-density').status).toBe('fail');
  });
});

function app(session) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = session; req.deductCredits = jest.fn(); next(); });
  a.use('/api/op', require('../tools/on-page-seo-engine/router'));
  return a;
}

describe('on-page router', () => {
  const session = { shop: 'a.myshopify.com', shopifyToken: 'tok' };
  beforeEach(() => {
    applyProductFields.mockClear();
    global.fetch = jest.fn(async (_u, opts) => {
      const { query } = JSON.parse(opts.body);
      const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
      const data = /products\(first/.test(query)
        ? { products: { ...empty, nodes: [{ id: ENTITY.id, handle: 'blue-mug', title: 'Blue Mug', descriptionHtml: ENTITY.html, status: 'ACTIVE', seo: { title: ENTITY.seoTitle, description: ENTITY.seoDescription }, images: { nodes: [] } }] } }
        : { pages: empty, collections: empty, articles: empty };
      return { ok: true, status: 200, json: async () => ({ data }) };
    });
  });

  test('requires a shop', async () => {
    expect((await request(app(undefined)).post('/api/op/analyze').send({})).status).toBe(401);
  });
  test('analyze validates and returns a result', async () => {
    expect((await request(app(session)).post('/api/op/analyze').send({ keyword: 'x' })).status).toBe(400);
    expect((await request(app(session)).post('/api/op/analyze').send({ id: 'gid://shopify/Product/9' })).status).toBe(404);
    const r = await request(app(session)).post('/api/op/analyze').send({ id: ENTITY.id, keyword: 'blue mug' });
    expect(r.body.result.checks.length).toBeGreaterThan(5);
  });
  test('ai optimize needs keyword and returns projected score', async () => {
    getOpenAIClient.mockReturnValue({ chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ seoTitle: 'Blue Mug - Handmade Ceramic Coffee Mug', metaDescription: 'Buy a blue mug handmade in small batches. Dishwasher safe, glazed by hand, ideal for coffee and tea, with free UK delivery on every order.' }) } }] }) } } });
    expect((await request(app(session)).post('/api/op/ai/optimize').send({ id: ENTITY.id })).status).toBe(400);
    const r = await request(app(session)).post('/api/op/ai/optimize').send({ id: ENTITY.id, keyword: 'blue mug' });
    expect(r.body.suggestion.seoTitle).toMatch(/Blue Mug/);
    expect(typeof r.body.projectedScore).toBe('number');
  });
  test('apply only accepts product gids', async () => {
    expect((await request(app(session)).post('/api/op/apply').send({ id: '1; x', seoTitle: 't' })).status).toBe(400);
    expect((await request(app(session)).post('/api/op/apply').send({ id: 'gid://shopify/Page/1', seoTitle: 't' })).status).toBe(400);
    const r = await request(app(session)).post('/api/op/apply').send({ id: ENTITY.id, seoTitle: 't', metaDescription: 'd' });
    expect(r.body.ok).toBe(true);
    expect(applyProductFields).toHaveBeenCalledWith('a.myshopify.com', ENTITY.id, { seoTitle: 't', metaDescription: 'd' });
  });
});
