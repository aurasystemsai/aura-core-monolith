const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockState = { orders: 'ok' };
const mockVar = (n, qty, pid) => ({ id: 'gid://shopify/ProductVariant/' + n, displayName: 'V' + n, sku: 'S' + n, price: '10.00', inventoryQuantity: qty, product: { id: 'gid://shopify/Product/' + pid, title: 'P' + pid, status: 'ACTIVE' }, inventoryItem: { unitCost: { amount: '4.00' } } });
const mockOrder = (days, items, amt) => ({ createdAt: new Date(Date.now() - days * 86400000).toISOString(), totalPriceSet: { shopMoney: { amount: amt, currencyCode: 'GBP' } }, lineItems: { nodes: items.map(([n, q]) => ({ quantity: q, variant: { id: 'gid://shopify/ProductVariant/' + n } })) } });
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q) => {
    if (q.includes('productVariants')) return { productVariants: { nodes: [mockVar(1, 5, 1), mockVar(2, 0, 2), mockVar(3, 100, 3), mockVar(4, 50, 4)] } };
    if (mockState.orders === 'denied') throw new Error('Access denied for orders field.');
    return { orders: { pageInfo: { hasNextPage: false }, nodes: [mockOrder(2, [[1, 30], [2, 6]], '100.00'), mockOrder(10, [[1, 30], [3, 1]], '50.00'), mockOrder(40, [[2, 1]], '40.00')] } };
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: 'Hello supplier' } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop) {
  const router = require('../tools/inventory-forecasting/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/inventory-forecasting', router);
  return app;
}
const B = '/api/inventory-forecasting';
const P1 = 'gid://shopify/Product/1';

describe('inventory-forecasting', () => {
  it('flags reorder, out-of-stock and no-sales from real order lines', async () => {
    mockState.orders = 'ok';
    const r = (await request(makeApp('inv-a')).get(B + '/overview')).body;
    const by = Object.fromEntries(r.items.map((i) => [i.id.split('/').pop(), i]));
    expect(by[1]).toMatchObject({ sold60: 60, status: 'reorder', daysCover: 5 });
    expect(by[1].suggestedQty).toBe(60 * (14 + 30) / 60 - 5);
    expect(by[2].status).toBe('out');
    expect(by[3].status).toBe('ok');
    expect(by[4].status).toBe('no-sales');
    expect(r.counts).toEqual({ out: 1, reorder: 1, 'no-sales': 1, ok: 1 });
  });

  it('computes finance and uses a supplier lead time', async () => {
    mockState.orders = 'ok';
    const app = makeApp('inv-b');
    const r0 = (await request(app).get(B + '/overview')).body;
    expect(r0.finance).toMatchObject({ currency: 'GBP', last30: { revenue: 150, orders: 2, aov: 75 }, previous30: { revenue: 40, orders: 1 }, revenueChangePct: 275, stockAtCost: 620 });
    const s = (await request(app).post(B + '/suppliers').send({ name: 'Acme', leadDays: 30 })).body.supplier;
    await request(app).put(B + '/assign').send({ productId: P1, supplierId: s.id });
    const item = (await request(app).get(B + '/overview')).body.items.find((i) => i.id.endsWith('/1'));
    expect(item).toMatchObject({ supplierName: 'Acme', leadDays: 30, suggestedQty: 55 });
    const po = await request(app).post(B + '/po-draft').send({ supplierId: s.id });
    expect(po.body.lines[0]).toMatchObject({ qty: 55 });
    expect(po.body.email).toBe('Hello supplier');
  });

  it('degrades honestly without order access and validates input', async () => {
    mockState.orders = 'denied';
    const app = makeApp('inv-c');
    const r = (await request(app).get(B + '/overview')).body;
    expect(r).toMatchObject({ ordersAvailable: false, finance: null, counts: null });
    expect(r.items).toHaveLength(4);
    expect((await request(app).post(B + '/brief')).status).toBe(409);
    expect((await request(app).post(B + '/suppliers').send({ name: 'x', leadDays: 0 })).status).toBe(400);
    expect((await request(app).post(B + '/suppliers').send({ name: 'x', leadDays: 5, email: 'bad' })).status).toBe(400);
    expect((await request(app).put(B + '/assign').send({ productId: 'nope' })).status).toBe(400);
  });
});

