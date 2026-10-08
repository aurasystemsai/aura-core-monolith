const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
jest.mock('../core/shopifyApply', () => ({ applyProductFields: jest.fn(async () => ({})) }));
const { getOpenAIClient } = require('../core/openaiClient');
const { applyProductFields } = require('../core/shopifyApply');

const GOOD = '<p>' + 'Our handmade mug is made for daily use. It keeps drinks warm. The glaze is smooth. '.repeat(12) + '</p><ul><li>Dishwasher safe</li></ul>';
const NODES = [
  { id: 'gid://shopify/Product/1', handle: 'a', title: 'Empty', descriptionHtml: '', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
  { id: 'gid://shopify/Product/2', handle: 'b', title: 'Good', descriptionHtml: GOOD, status: 'ACTIVE', seo: {}, media: { nodes: [] } },
  { id: 'gid://shopify/Product/3', handle: 'c', title: 'Thin', descriptionHtml: '<p>Nice mug.</p>', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
];

function app(shop = 'a.myshopify.com') {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = jest.fn(); a.deduct = req.deductCredits; next(); });
  a.use('/api/cs', require('../tools/content-scoring-optimization/router'));
  return a;
}

beforeEach(() => {
  applyProductFields.mockClear();
  global.fetch = jest.fn(async (_u, opts) => {
    const { query } = JSON.parse(opts.body);
    const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
    const data = /products\(first/.test(query) ? { products: { ...empty, nodes: NODES } } : { pages: empty, collections: empty, articles: empty };
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
});

describe('content scoring', () => {
  test('ranks real store copy worst first with explained issues', async () => {
    const res = await request(app()).get('/api/cs/overview');
    expect(res.status).toBe(200);
    expect(res.body.items.map((i) => i.title)).toEqual(['Empty', 'Thin', 'Good']);
    expect(res.body.items[0].score).toBe(0);
    expect(res.body.items[2].score).toBeGreaterThanOrEqual(80);
    expect(res.body.bands).toEqual({ good: 1, ok: 1, poor: 1 });
  });

  test('score detail includes readable issues and 404s for unknown items', async () => {
    const a = app();
    const r = await request(a).post('/api/cs/score').send({ id: NODES[2].id });
    expect(r.body.result.issues.some((i) => /Only \d+ words/.test(i.text))).toBe(true);
    expect((await request(a).post('/api/cs/score').send({ id: 'nope' })).status).toBe(404);
  });

  test('AI rewrite re-scores the result, strips scripts and charges credits', async () => {
    getOpenAIClient.mockReturnValue({ chat: { completions: { create: jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ html: GOOD + '<script>x()</script>' }) } }] })) } } });
    const a = app();
    const r = await request(a).post('/api/cs/ai/rewrite').send({ id: NODES[2].id });
    expect(r.status).toBe(200);
    expect(r.body.html).not.toMatch(/script/);
    expect(r.body.after).toBeGreaterThan(r.body.before);
    expect(a.deduct).toHaveBeenCalledTimes(1);
  });

  test('503 without AI; apply only works for products and needs copy', async () => {
    getOpenAIClient.mockReturnValue(null);
    const a = app();
    expect((await request(a).post('/api/cs/ai/rewrite').send({ id: NODES[2].id })).status).toBe(503);
    expect((await request(a).post('/api/cs/apply').send({ id: NODES[2].id })).status).toBe(400);
    const ok = await request(a).post('/api/cs/apply').send({ id: NODES[2].id, html: '<p onclick="x()">New</p>' });
    expect(ok.status).toBe(200);
    expect(applyProductFields).toHaveBeenCalledWith('a.myshopify.com', '3', { body_html: '<p>New</p>' });
  });
});

