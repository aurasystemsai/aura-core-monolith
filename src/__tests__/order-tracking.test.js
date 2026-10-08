const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ot-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const SHOP = 'ot-demo-' + Date.now() + '.myshopify.com';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/ot', require('../tools/order-tracking/router'));
  return a;
}
const ago = (d) => new Date(Date.now() - d * 86400000).toISOString();
const order = (n, days, status, extra = {}) => ({ id: `gid://shopify/Order/${n}`, name: `#${n}`, processedAt: ago(days), cancelledAt: null, displayFulfillmentStatus: status, displayFinancialStatus: 'PAID', customer: { firstName: 'Sam' }, shippingAddress: { city: 'Leeds', country: 'UK' }, fulfillments: [], lineItems: { nodes: [{ title: 'Mug', quantity: 2 }] }, ...extra });
let orders;
beforeEach(() => {
  deduct.mockClear(); mockCreate.mockReset(); mockGql.mockReset();
  orders = [
    order(1, 10, 'UNFULFILLED'), order(2, 1, 'UNFULFILLED'), order(3, 5, 'FULFILLED', { fulfillments: [{ trackingInfo: [{ number: 'AB123', company: 'RM', url: 'https://t/AB123' }] }] }),
    order(4, 6, 'UNFULFILLED', { cancelledAt: ago(5) }), order(5, 4, 'PARTIALLY_FULFILLED'),
  ];
  mockGql.mockImplementation(async (_s, _t, q, v) => {
    if (q.includes('orders(')) return { orders: { nodes: orders } };
    if (q.includes('order(id')) return { order: orders.find((o) => o.id === v.id) || null };
    throw new Error('unexpected ' + q);
  });
});
const ai = (obj) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });

describe('order-tracking', () => {
  test('classifies late, waiting, shipped, partial and cancelled orders', async () => {
    const r = await request(app()).get('/api/ot/orders?lateDays=3');
    expect(r.body.counts).toEqual({ late: 1, waiting: 1, partial: 1, shipped: 1, cancelled: 1 });
    expect(r.body.orders.find((o) => o.name === '#3').tracking[0]).toMatchObject({ number: 'AB123' });
    const r2 = await request(app()).get('/api/ot/orders?lateDays=14');
    expect(r2.body.counts.late).toBe(0);
  });

  test('draft needs a real order id, refuses cancelled orders, and charges nothing then', async () => {
    expect((await request(app()).post('/api/ot/draft').send({ id: 'x' })).status).toBe(400);
    expect((await request(app()).post('/api/ot/draft').send({ id: 'gid://shopify/Order/99' })).status).toBe(404);
    expect((await request(app()).post('/api/ot/draft').send({ id: 'gid://shopify/Order/4' })).status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(deduct).not.toHaveBeenCalled();
  });

  test('draft charges only when the AI answers', async () => {
    mockCreate.mockRejectedValueOnce(new Error('down'));
    expect((await request(app()).post('/api/ot/draft').send({ id: 'gid://shopify/Order/1' })).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce(ai({ subject: 'About order #1', body: 'Sorry for the wait.' }));
    const r = await request(app()).post('/api/ot/draft').send({ id: 'gid://shopify/Order/1' });
    expect(r.body).toMatchObject({ ok: true, subject: 'About order #1' });
    expect(deduct).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockCreate.mock.calls[0][0].messages[1].content)).toMatchObject({ status: 'late', orderName: '#1' });
  });

  test('missing permissions give a clear 403', async () => {
    mockGql.mockRejectedValueOnce(new Error('Access denied for orders field.'));
    const r = await request(app()).get('/api/ot/orders');
    expect(r.status).toBe(403);
    expect(r.body.needsScopes).toBe(true);
  });
});