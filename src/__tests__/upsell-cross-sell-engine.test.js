const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockState = { orders: 'ok' };
const P = (n, type, tags) => ({ id: 'gid://p/' + n, title: n, handle: n.toLowerCase().replace(/ /g, '-'), productType: type, tags, onlineStoreUrl: null, priceRangeV2: { minVariantPrice: { amount: '10.0', currencyCode: 'GBP' } }, featuredImage: null });
const mockProducts = [P('Blue Mug', 'Mug', ['ceramic']), P('Red Mug', 'Mug', ['ceramic']), P('Tea Tin', 'Tin', []), P('Coaster Set', 'Coaster', [])];
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q) => {
    if (q.includes('products(')) return { products: { nodes: mockProducts } };
    if (mockState.orders === 'denied') throw new Error('Access denied for orders field.');
    const li = (...ids) => ({ lineItems: { nodes: ids.map((id) => ({ product: { id } })) } });
    return { orders: { nodes: [li('gid://p/Blue Mug', 'gid://p/Tea Tin'), li('gid://p/Blue Mug', 'gid://p/Tea Tin'), li('gid://p/Blue Mug', 'gid://p/Coaster Set'), li('gid://p/Red Mug')] } };
  },
}));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ cartLine: 'Add a tin?', emailLine: 'Pairs well', bundleName: 'Tea time' }) } }] }) } } }) }));

function makeApp() {
  const router = require('../tools/upsell-cross-sell-engine/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: 'ups-test.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/upsell-cross-sell-engine', router);
  return app;
}
const B = '/api/upsell-cross-sell-engine';

describe('upsell-cross-sell-engine', () => {
  it('ranks by real co-purchases when orders are readable', async () => {
    mockState.orders = 'ok';
    const r = await request(makeApp()).get(B + '/related?productId=' + encodeURIComponent('gid://p/Blue Mug'));
    expect(r.body.basis).toBe('orders');
    expect(r.body.items[0]).toMatchObject({ title: 'Tea Tin', score: 2 });
    expect(r.body.items[0].reason).toContain('2 of 3');
  });

  it('falls back to catalogue similarity and says so when orders are denied', async () => {
    mockState.orders = 'denied';
    const app = makeApp();
    const r = await request(app).get(B + '/related?productId=' + encodeURIComponent('gid://p/Blue Mug'));
    expect(r.body).toMatchObject({ basis: 'catalogue', ordersAvailable: false });
    expect(r.body.items[0].title).toBe('Red Mug');
    const b = await request(app).get(B + '/bundles');
    expect(b.body).toMatchObject({ ordersAvailable: false, bundles: [] });
  });

  it('lists top bundles, writes a pitch and 404s unknown products', async () => {
    mockState.orders = 'ok';
    const app = makeApp();
    const b = await request(app).get(B + '/bundles');
    expect(b.body.bundles[0]).toMatchObject({ orders: 2 });
    const p = await request(app).post(B + '/pitch').send({ productId: 'gid://p/Blue Mug', relatedId: 'gid://p/Tea Tin' });
    expect(p.body.pitch.bundleName).toBe('Tea time');
    expect((await request(app).get(B + '/related?productId=nope')).status).toBe(404);
  });
});
