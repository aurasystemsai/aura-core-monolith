const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok' : null) }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const deduct = jest.fn();
const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/dam', (req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = deduct; next(); }, require('../tools/digital-asset-management/router'));
  return a;
};
const ID = 'gid://shopify/MediaImage/1';
const node = (o = {}) => ({ id: ID, alt: '', createdAt: '2026-01-01', mimeType: 'image/jpeg', image: { url: 'https://cdn.shopify.com/s/files/x/IMG_1234.jpg?v=1', width: 4000, height: 3000 }, originalSource: { fileSize: 900000 }, ...o });

beforeEach(() => { mockGql.mockReset(); mockCreate.mockReset(); deduct.mockReset(); });

test('lists images and flags the real problems', async () => {
  mockGql.mockResolvedValue({ files: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [node(), node({ id: 'gid://shopify/MediaImage/2', alt: 'A red cotton t-shirt on a hanger', image: { url: 'https://cdn.shopify.com/a/shirt.jpg', width: 800, height: 800 }, originalSource: { fileSize: 40000 } })] } });
  const r = await request(app()).get('/api/dam/files');
  expect(r.body.files[0].issues).toEqual(['alt', 'heavy', 'wide', 'name']);
  expect(r.body.files[1].issues).toEqual([]);
  expect(r.body.summary.alt).toBe(1);
});

test('rejects a bad id and missing alt text', async () => {
  expect((await request(app()).post('/api/dam/draft').send({ id: 'x' })).status).toBe(400);
  expect((await request(app()).post('/api/dam/apply').send({ id: ID })).status).toBe(400);
  expect(mockGql).not.toHaveBeenCalled();
});

test('draft charges only after a usable answer', async () => {
  mockGql.mockResolvedValue({ node: { id: ID, image: { url: 'https://cdn.shopify.com/a.jpg' } } });
  mockCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });
  const bad = await request(app()).post('/api/dam/draft').send({ id: ID });
  expect(bad.status).toBe(502);
  expect(deduct).not.toHaveBeenCalled();
  mockCreate.mockResolvedValue({ choices: [{ message: { content: 'a blue ceramic mug on a wooden table' } }] });
  const ok = await request(app()).post('/api/dam/draft').send({ id: ID });
  expect(ok.body.alt).toBe('A blue ceramic mug on a wooden table');
  expect(deduct).toHaveBeenCalledTimes(1);
});

test('apply returns the previous text so it can be undone', async () => {
  mockGql.mockResolvedValueOnce({ node: { id: ID, alt: 'old text here' } }).mockResolvedValueOnce({ fileUpdate: { files: [{ id: ID }], userErrors: [] } });
  const r = await request(app()).post('/api/dam/apply').send({ id: ID, alt: '  new text for this image  ' });
  expect(r.body).toMatchObject({ ok: true, alt: 'new text for this image', previous: 'old text here' });
});

test('shows Shopify validation errors', async () => {
  mockGql.mockResolvedValueOnce({ node: { id: ID, alt: '' } }).mockResolvedValueOnce({ fileUpdate: { files: [], userErrors: [{ message: 'Nope' }] } });
  const r = await request(app()).post('/api/dam/apply').send({ id: ID, alt: 'valid alt text' });
  expect(r.status).toBe(422);
});
