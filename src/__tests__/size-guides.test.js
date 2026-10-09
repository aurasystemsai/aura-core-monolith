const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-'));
let mockInstalled;
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (mockInstalled.includes(s) ? 'tok' : null) }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

let SHOP; let n = 0;
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use('/storefront', require('../tools/popups/public'));
  a.use('/api/sg', (req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); }, require('../tools/size-guides/router'));
  return a;
}
const guide = (over = {}) => ({ name: 'Tees', match: 'T-Shirts', columns: ['Size', 'Chest'], rows: [['S', '86-91'], ['M', '96-101']], ...over });
const save = (over) => request(app()).post('/api/sg/save').send(guide(over));
beforeEach(() => {
  SHOP = 'sg-demo-' + Date.now() + '-' + (n++) + '.myshopify.com';
  mockInstalled = [SHOP];
  deduct.mockClear(); mockCreate.mockReset(); mockGql.mockReset();
});

describe('size-guides', () => {
  test('saves a guide, pads short rows and cuts long ones', async () => {
    const r = await save({ columns: ['Size', 'Chest', 'x'.repeat(40)], rows: [['S'], ['M', '1', '2', 'extra'], ['', '', '']] });
    expect(r.body.guide.columns[2]).toHaveLength(24);
    expect(r.body.guide.rows).toEqual([['S', '', ''], ['M', '1', '2']]);
  });
  test('rejects a guide with no name, one column or no rows', async () => {
    expect((await save({ name: '' })).status).toBe(400);
    expect((await save({ columns: ['Size'] })).status).toBe(400);
    expect((await save({ rows: [] })).status).toBe(400);
  });
  test('storefront returns the matching guide, falls back to "all", and ignores paused ones', async () => {
    await save({ match: 'all', title: 'General' });
    await save({ match: 'T-Shirts', title: 'Tees' });
    const get = (type, shop = SHOP) => request(app()).get('/storefront/size-guide').query({ shop, type });
    expect((await get('t-shirts')).body.guide.title).toBe('Tees');
    expect((await get('Mugs')).body.guide.title).toBe('General');
    const id = (await request(app()).get('/api/sg/guides')).body.guides.find((g) => g.match === 'all').id;
    await request(app()).post('/api/sg/toggle').send({ id });
    expect((await get('Mugs')).body.guide).toBeNull();
    expect((await get('Mugs', 'x.myshopify.com')).body.guide).toBeNull();
  });
  test('delete works once', async () => {
    const id = (await save()).body.guide.id;
    expect((await request(app()).delete('/api/sg/guides/' + id)).body.ok).toBe(true);
    expect((await request(app()).delete('/api/sg/guides/' + id)).status).toBe(404);
  });
  test('AI draft charges only for a usable table', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ columns: ['Size', 'Chest'], rows: [['S', '86-91']] }) } }] });
    expect((await request(app()).post('/api/sg/ai-draft').send({ item: 'tees' })).body.ok).toBe(true);
    expect(deduct).toHaveBeenCalledTimes(1);
    mockCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ columns: ['Size'], rows: [] }) } }] });
    expect((await request(app()).post('/api/sg/ai-draft').send({ item: 'tees' })).status).toBe(502);
    expect((await request(app()).post('/api/sg/ai-draft').send({})).status).toBe(400);
    expect(deduct).toHaveBeenCalledTimes(1);
  });
  test('stock check says sold out only for a sold-out live variant', async () => {
    const v = (qty) => ({ nodes: [{ id: 'gid://shopify/ProductVariant/9', title: 'x', inventoryQuantity: qty, availableForSale: qty > 0, product: { title: 'Mug', handle: 'm', onlineStoreUrl: null, status: 'ACTIVE' } }] });
    const q = (shop = SHOP) => request(app()).get('/storefront/stock').query({ shop, variantId: '9' });
    mockGql.mockResolvedValue(v(0));
    expect((await q()).body.soldOut).toBe(true);
    mockGql.mockResolvedValue(v(3));
    expect((await q()).body.soldOut).toBe(false);
    expect((await q('x.myshopify.com')).body.soldOut).toBe(false);
    mockGql.mockRejectedValue(new Error('down'));
    expect((await q()).body.soldOut).toBe(false);
  });
  test('serves the size guide and back-in-stock scripts', async () => {
    for (const f of ['size-guide.js', 'back-in-stock.js']) {
      const r = await request(app()).get('/storefront/' + f);
      expect(r.headers['content-type']).toMatch(/javascript/);
      expect(r.text).not.toMatch(/innerHTML/);
    }
  });
});