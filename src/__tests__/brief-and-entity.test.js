const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
jest.mock('../core/searchConsole', () => ({ getConnection: () => null, accessToken: jest.fn(), findSite: jest.fn(), queryPositions: jest.fn() }));
const { getOpenAIClient } = require('../core/openaiClient');

const POST_HTML = '<p>Ceramic mug care guide for daily use.</p>';
const NODES = [
  { id: 'gid://shopify/Product/1', handle: 'mug', title: 'Handmade ceramic mug', descriptionHtml: '<p>Handmade ceramic mug with glaze finish.</p>', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
  { id: 'gid://shopify/Product/2', handle: 'bowl', title: 'Ceramic bowl', descriptionHtml: '<p>Handmade ceramic bowl with glaze finish.</p>', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
  { id: 'gid://shopify/Product/3', handle: 'cup', title: 'Ceramic cup', descriptionHtml: '<p>Handmade ceramic cup with glaze finish.</p>', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
];

function app(shop = 'a.myshopify.com', ai) {
  getOpenAIClient.mockReturnValue(ai);
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = jest.fn(); a.deduct = req.deductCredits; next(); });
  a.use('/api/brief', require('../tools/ai-content-brief-generator/router'));
  a.use('/api/entity', require('../tools/entity-topic-explorer/router'));
  return a;
}
const ai = (obj) => ({ chat: { completions: { create: jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] })) } } });

beforeEach(() => {
  process.env.AURA_DATA_DIR = require('os').tmpdir() + '/aura-brief-test-' + Date.now();
  global.fetch = jest.fn(async (_u, opts) => {
    const { query } = JSON.parse(opts.body);
    const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
    const data = /products\(first/.test(query) ? { products: { ...empty, nodes: NODES } }
      : /articles\(first/.test(query) ? { articles: { ...empty, nodes: [{ id: 'gid://shopify/Article/1', handle: 'care', title: 'Mug care', body: POST_HTML, blog: { handle: 'news' } }] }, pages: empty, collections: empty }
      : { pages: empty, collections: empty, articles: empty };
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
});

describe('content brief generator', () => {
  test('requires a keyword and AI', async () => {
    expect((await request(app('a.myshopify.com', ai({}))).post('/api/brief/generate').send({})).status).toBe(400);
    expect((await request(app('a.myshopify.com', null)).post('/api/brief/generate').send({ keyword: 'x' })).status).toBe(503);
  });

  test('generates, drops invented links, stores per shop and charges credits', async () => {
    const out = ai({ title: 'T', outline: [{ heading: 'H', points: ['p'] }], internalLinks: [{ anchor: 'mug', url: 'https://a.myshopify.com/products/mug' }, { anchor: 'fake', url: 'https://evil.com' }] });
    const a = app('a.myshopify.com', out);
    const r = await request(a).post('/api/brief/generate').send({ keyword: 'ceramic mug' });
    expect(r.status).toBe(200);
    expect(r.body.brief.internalLinks).toHaveLength(1);
    expect(a.deduct).toHaveBeenCalledTimes(1);
    const list = await request(a).get('/api/brief/briefs');
    expect(list.body.briefs).toHaveLength(1);
    expect((await request(app('b.myshopify.com', out)).get('/api/brief/briefs')).body.briefs).toHaveLength(0);
    expect((await request(a).delete('/api/brief/briefs/' + r.body.brief.id)).status).toBe(200);
  });
});

describe('entity topic explorer', () => {
  test('finds shared topics from real content and content gaps', async () => {
    const r = await request(app()).get('/api/entity/topics');
    expect(r.status).toBe(200);
    expect(r.body.topics.some((t) => t.term === 'handmade ceramic')).toBe(true);
    expect(r.body.gaps.some((t) => t.term === 'glaze finish')).toBe(true);
  });

  test('topic detail lists pages and expand drops topics already covered', async () => {
    const a = app('a.myshopify.com', ai({ suggestions: [{ topic: 'glaze finish', type: 'topic' }, { topic: 'kiln firing', type: 'entity', why: 'w' }] }));
    const d = await request(a).get('/api/entity/topic?term=glaze');
    expect(d.body.total).toBe(3);
    const e = await request(a).post('/api/entity/ai/expand').send({});
    expect(e.body.suggestions.map((s) => s.topic)).toEqual(['kiln firing']);
    expect(a.deduct).toHaveBeenCalledTimes(1);
  });
});
