const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const SHOP = 'ac-demo-' + Date.now() + '.myshopify.com';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/ac', require('../tools/ad-creative-optimizer/router'));
  return a;
}
const ai = (obj) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });
const ID = 'gid://shopify/Product/1';

beforeEach(() => {
  deduct.mockClear(); mockCreate.mockReset(); mockGql.mockReset();
  mockGql.mockResolvedValue({ product: { title: 'Mug', description: 'A mug', productType: 'Home', vendor: 'AURA', priceRangeV2: { minVariantPrice: { amount: '9.0', currencyCode: 'GBP' } } } });
});

describe('ad-creative-optimizer', () => {
  test('drops copy over the platform limit and charges once', async () => {
    mockCreate.mockResolvedValue(ai({ headlines: ['Short mug', 'x'.repeat(31), 'Short mug', 'Great gift'], descriptions: ['Nice mug', 'y'.repeat(91)] }));
    const r = await request(app()).post('/api/ac/generate').send({ productId: ID, platform: 'google' });
    expect(r.body.ok).toBe(true);
    expect(r.body.headlines.map((h) => h.text)).toEqual(['Short mug', 'Great gift']);
    expect(r.body.descriptions.map((h) => h.text)).toEqual(['Nice mug']);
    expect(deduct).toHaveBeenCalledTimes(1);
  });
  test('does not charge when nothing fits', async () => {
    mockCreate.mockResolvedValue(ai({ headlines: ['x'.repeat(50)], descriptions: ['ok'] }));
    const r = await request(app()).post('/api/ac/generate').send({ productId: ID, platform: 'google' });
    expect(r.status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
  });
  test('does not charge when AI fails', async () => {
    mockCreate.mockRejectedValue(new Error('boom'));
    const r = await request(app()).post('/api/ac/generate').send({ productId: ID });
    expect(r.status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
  });
  test('rejects a bad platform or product', async () => {
    expect((await request(app()).post('/api/ac/generate').send({ productId: ID, platform: 'x' })).status).toBe(400);
    expect((await request(app()).post('/api/ac/generate').send({ productId: 'nope' })).status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
  test('lists only active products', async () => {
    mockGql.mockResolvedValue({ products: { nodes: [{ id: ID, title: 'A', status: 'ACTIVE' }, { id: 'gid://shopify/Product/2', title: 'B', status: 'DRAFT' }] } });
    const r = await request(app()).get('/api/ac/products');
    expect(r.body.products).toEqual([{ id: ID, title: 'A' }]);
  });
});