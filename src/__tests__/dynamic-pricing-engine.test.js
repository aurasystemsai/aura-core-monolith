const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockUpdates = [];
const mockVar = (n, qty) => ({ id: 'gid://shopify/ProductVariant/' + n, displayName: 'V' + n, price: '10.00', compareAtPrice: null, inventoryQuantity: qty, product: { id: 'gid://shopify/Product/' + n, title: 'P' + n, status: 'ACTIVE' }, inventoryItem: { unitCost: { amount: '4.00' } } });
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q, vars) => {
    if (q.includes('productVariantsBulkUpdate')) { mockUpdates.push(vars); return { productVariantsBulkUpdate: { userErrors: [] } }; }
    if (q.includes('productVariants')) return { productVariants: { nodes: [mockVar(1, 5), mockVar(3, 100), mockVar(4, 50)] } };
    const line = (n, q2) => ({ quantity: q2, variant: { id: 'gid://shopify/ProductVariant/' + n } });
    return { orders: { pageInfo: { hasNextPage: false }, nodes: [{ createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), totalPriceSet: { shopMoney: { amount: '100', currencyCode: 'GBP' } }, lineItems: { nodes: [line(1, 30), line(3, 1)] } }, { createdAt: new Date(Date.now() - 86400000 * 9).toISOString(), totalPriceSet: { shopMoney: { amount: '50', currencyCode: 'GBP' } }, lineItems: { nodes: [line(1, 30)] } }] } };
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: 'Start with V4.' } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop) {
  const router = require('../tools/dynamic-pricing-engine/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/dynamic-pricing-engine', router);
  return app;
}
const B = '/api/dynamic-pricing-engine';
const V4 = 'gid://shopify/ProductVariant/4';

describe('pricing advisor', () => {
  it('suggests a rise for fast sellers and cuts for slow stock', async () => {
    const r = (await request(makeApp('pr-a')).get(B + '/suggestions')).body;
    const by = Object.fromEntries(r.suggestions.map((s) => [s.variantId.split('/').pop(), s]));
    expect(by[1]).toMatchObject({ rule: 'hot', suggested: 10.5 });
    expect(by[3]).toMatchObject({ rule: 'slow', suggested: 9.5 });
    expect(by[4]).toMatchObject({ rule: 'slow', suggested: 9 });
  });

  it('applies a discount with a compare-at price, logs it and can undo it', async () => {
    const app = makeApp('pr-b');
    const a = (await request(app).post(B + '/apply').send({ variantId: V4, price: 9 })).body;
    expect(a.ok).toBe(true);
    expect(mockUpdates.pop().vs[0]).toMatchObject({ price: '9.00', compareAtPrice: '10.00' });
    const u = (await request(app).post(B + '/revert').send({ id: a.entry.id })).body;
    expect(u.ok).toBe(true);
    expect(mockUpdates.pop().vs[0]).toMatchObject({ price: '10.00', compareAtPrice: null });
    expect((await request(app).post(B + '/revert').send({ id: a.entry.id })).status).toBe(400);
  });

  it('refuses moves over 30% or below cost', async () => {
    const app = makeApp('pr-c');
    expect((await request(app).post(B + '/apply').send({ variantId: V4, price: 5 })).status).toBe(400);
    expect((await request(app).post(B + '/apply').send({ variantId: V4, price: 0 })).status).toBe(400);
    expect((await request(app).post(B + '/brief')).body.brief).toBe('Start with V4.');
  });
});