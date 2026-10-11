const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'soc-'));
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok' : null) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: (...a) => mockCreate(...a) } } }) }));

const PID = 'gid://shopify/Product/1';
const charge = jest.fn();
const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/s', (req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = charge; next(); }, require('../tools/social-scheduler-content-engine/router'));
  return a;
};
const prod = { id: PID, title: 'Blue Mug', onlineStoreUrl: 'https://x.example/products/mug', description: 'A mug', featuredImage: { url: 'https://img' }, priceRangeV2: { minVariantPrice: { amount: '12', currencyCode: 'GBP' } } };

beforeEach(() => {
  mockGql.mockReset(); mockCreate.mockReset(); charge.mockReset();
  for (const f of fs.readdirSync(process.env.AURA_DATA_DIR)) fs.unlinkSync(path.join(process.env.AURA_DATA_DIR, f));
  mockGql.mockImplementation(async (s, t, q) => (/product\(id/.test(q) ? { product: prod } : { products: { nodes: [prod] } }));
});

test('lists real products', async () => {
  const r = await request(app()).get('/api/s/products');
  expect(r.body.products[0]).toMatchObject({ title: 'Blue Mug', price: 'GBP 12.00' });
});

test('writes a post from the real product and charges only after a usable answer', async () => {
  mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'Meet the Blue Mug, perfect for mornings. #mug https://x.example/products/mug' } }] });
  const r = await request(app()).post('/api/s/write').send({ productId: PID, platform: 'instagram' });
  expect(r.status).toBe(200);
  expect(r.body.text).toMatch(/Blue Mug/);
  expect(charge).toHaveBeenCalledTimes(1);
  expect(mockCreate.mock.calls[0][0].messages[0].content).toMatch(/Blue Mug/);

  mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: 'ok' } }] });
  const r2 = await request(app()).post('/api/s/write').send({ productId: PID, platform: 'x' });
  expect(r2.status).toBe(502);
  expect(charge).toHaveBeenCalledTimes(1);
});

test('validates write input', async () => {
  expect((await request(app()).post('/api/s/write').send({ productId: 'nope', platform: 'x' })).status).toBe(400);
  expect((await request(app()).post('/api/s/write').send({ productId: PID, platform: 'myspace' })).status).toBe(400);
  mockGql.mockResolvedValueOnce({ product: null });
  expect((await request(app()).post('/api/s/write').send({ productId: PID, platform: 'x' })).status).toBe(404);
});

test('saves, reorders by date, ticks off, edits and deletes posts', async () => {
  const a = (await request(app()).post('/api/s/posts').send({ platform: 'x', text: 'Later post', date: '2026-12-01' })).body.post;
  await request(app()).post('/api/s/posts').send({ platform: 'facebook', text: 'Sooner post', date: '2026-11-01' });
  let list = (await request(app()).get('/api/s/posts')).body.posts;
  expect(list.map((p) => p.text)).toEqual(['Sooner post', 'Later post']);
  const t = await request(app()).patch('/api/s/posts/' + a.id).send({ done: true, text: 'Edited post' });
  expect(t.body.post).toMatchObject({ done: true, text: 'Edited post' });
  expect((await request(app()).patch('/api/s/posts/' + a.id).send({ date: '31/12/2026' })).status).toBe(400);
  expect((await request(app()).post('/api/s/posts').send({ platform: 'x', text: 'ab' })).status).toBe(400);
  expect((await request(app()).delete('/api/s/posts/' + a.id)).body.ok).toBe(true);
  expect((await request(app()).delete('/api/s/posts/' + a.id)).status).toBe(404);
  list = (await request(app()).get('/api/s/posts')).body.posts;
  expect(list).toHaveLength(1);
});
