const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
const { getOpenAIClient } = require('../core/openaiClient');

const NODES = [
  { id: 'gid://shopify/Product/1', handle: 'mug', title: 'Ceramic mug', descriptionHtml: '<p>A mug.</p>', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
];
let gqlCalls;

function app(shop = 'a.myshopify.com', ai) {
  getOpenAIClient.mockReturnValue(ai);
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = jest.fn(); a.deduct = req.deductCredits; next(); });
  a.use('/api/weekly', require('../tools/weekly-blog-content-engine/router'));
  a.use('/api/img', require('../tools/ai-content-image-gen/router'));
  return a;
}

beforeEach(() => {
  process.env.AURA_DATA_DIR = require('os').tmpdir() + '/aura-weekly-test-' + Date.now() + Math.random();
  gqlCalls = [];
  global.fetch = jest.fn(async (_u, opts) => {
    if (!/graphql/.test(_u)) return { ok: true, status: 200 };
    const { query } = JSON.parse(opts.body);
    gqlCalls.push(query);
    const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
    const data = /stagedUploadsCreate/.test(query) ? { stagedUploadsCreate: { stagedTargets: [{ url: 'https://up.example/x', resourceUrl: 'https://cdn.example/x.png', parameters: [{ name: 'k', value: 'v' }] }], userErrors: [] } }
      : /productUpdate/.test(query) ? { productUpdate: { userErrors: [] } }
      : /products\(first/.test(query) ? { products: { ...empty, nodes: NODES } }
      : { pages: empty, collections: empty, articles: empty };
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
});

const chat = (obj) => ({ chat: { completions: { create: jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] })) } } });

describe('weekly blog content engine', () => {
  test('plans posts spread over the week, links only real products, per shop', async () => {
    const a = app('a.myshopify.com', chat({ items: [
      { title: 'Care for your mug', keyword: 'mug care', angle: 'x', linkedProduct: 'Ceramic mug' },
      { title: 'Gift ideas', keyword: 'gifts', angle: 'y', linkedProduct: 'Invented thing' },
    ] }));
    const r = await request(a).post('/api/weekly/plan').send({ postsPerWeek: 2, startDate: '2026-01-05' });
    expect(r.status).toBe(200);
    expect(r.body.items.map((i) => i.date)).toEqual(['2026-01-05', '2026-01-08']);
    expect(r.body.items[0].linkedProduct.url).toMatch(/products\/mug/);
    expect(r.body.items[1].linkedProduct).toBeNull();
    expect(a.deduct).toHaveBeenCalledTimes(1);
    expect((await request(a).get('/api/weekly/items')).body.items).toHaveLength(2);
    expect((await request(app('b.myshopify.com')).get('/api/weekly/items')).body.items).toHaveLength(0);
  });

  test('manual add, status update, validation and delete', async () => {
    const a = app();
    expect((await request(a).post('/api/weekly/items').send({})).status).toBe(400);
    const { item } = (await request(a).post('/api/weekly/items').send({ title: 'My post' })).body;
    expect((await request(a).patch('/api/weekly/items/' + item.id).send({ status: 'bogus' })).status).toBe(400);
    expect((await request(a).patch('/api/weekly/items/' + item.id).send({ status: 'written' })).body.item.status).toBe('written');
    expect((await request(a).delete('/api/weekly/items/' + item.id)).status).toBe(200);
    expect((await request(a).delete('/api/weekly/items/' + item.id)).status).toBe(404);
  });
});

describe('image gen', () => {
  test('generates from a real product, charges the image action, validates input', async () => {
    const gen = jest.fn(async () => ({ data: [{ b64_json: 'QUJD' }] }));
    const a = app('a.myshopify.com', { images: { generate: gen } });
    expect((await request(a).post('/api/img/generate').send({})).status).toBe(400);
    expect((await request(a).post('/api/img/generate').send({ productId: 'nope' })).status).toBe(404);
    const r = await request(a).post('/api/img/generate').send({ productId: NODES[0].id, style: 'lifestyle' });
    expect(r.body.preview).toBe('data:image/png;base64,QUJD');
    expect(gen.mock.calls[0][0].prompt).toMatch(/Ceramic mug/);
    expect(a.deduct).toHaveBeenCalledWith(expect.objectContaining({ action: 'image-gen' }));
  });

  test('apply uploads a pending image, is shop-bound and rejects bad ids', async () => {
    const a = app('a.myshopify.com', { images: { generate: async () => ({ data: [{ b64_json: 'QUJD' }] }) } });
    const g = await request(a).post('/api/img/generate').send({ productId: NODES[0].id });
    expect((await request(a).post('/api/img/apply').send({ imageId: 'gone', productId: NODES[0].id })).status).toBe(404);
    expect((await request(app('b.myshopify.com')).post('/api/img/apply').send({ imageId: g.body.imageId, productId: NODES[0].id })).status).toBe(404);
    expect((await request(a).post('/api/img/apply').send({ imageId: g.body.imageId, productId: '1; drop' })).status).toBe(400);
    const ok = await request(a).post('/api/img/apply').send({ imageId: g.body.imageId, productId: NODES[0].id });
    expect(ok.body).toEqual({ ok: true });
    expect(gqlCalls.some((q) => /productUpdate/.test(q))).toBe(true);
    expect(global.fetch.mock.calls.some((c) => c[0] === 'https://up.example/x')).toBe(true);
  });
});