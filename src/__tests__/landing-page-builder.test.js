const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockCreated = [];
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q, vars) => {
    if (q.includes('pageCreate')) { mockCreated.push(vars.p); return { pageCreate: { page: { id: 'gid://shopify/Page/77', handle: 'mug' }, userErrors: [] } }; }
    if (q.includes('product(id')) return { product: { title: 'Blue Mug', description: 'A hand made mug.', featuredImage: { url: 'https://cdn.shopify.com/mug.jpg' }, priceRangeV2: { minVariantPrice: { amount: '12', currencyCode: 'GBP' } } } };
    return { products: { nodes: [{ id: 'gid://shopify/Product/1', title: 'Blue Mug', description: 'Mug', featuredImage: null, priceRangeV2: { minVariantPrice: { amount: '12', currencyCode: 'GBP' } } }] } };
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ title: 'Meet the Blue Mug', html: '<h1 onclick="x()">Blue Mug</h1><script>alert(1)</script><p>Hand made. <a href="javascript:alert(1)">bad</a> <a href="https://shop.example/x" onclick="y()">ok</a></p><img src="https://evil.test/a.png">' }) } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop, charges) {
  const router = require('../tools/landing-page-builder/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async (m) => { if (charges) charges.push(m); }; next(); });
  app.use('/api/landing-page-builder', router);
  return app;
}
const B = '/api/landing-page-builder';

describe('landing page builder', () => {
  it('lists real products', async () => {
    expect((await request(makeApp('lp-a')).get(B + '/products')).body.products[0].title).toBe('Blue Mug');
  });

  it('drafts a page, strips unsafe html, adds the real image and price, and charges once', async () => {
    const charges = [];
    const r = (await request(makeApp('lp-b', charges)).post(B + '/generate').send({ productId: 'gid://shopify/Product/1', goal: 'launch' })).body;
    expect(r.html).not.toMatch(/script|onclick|javascript:|evil\.test/);
    expect(r.html).toContain('<a href="https://shop.example/x" rel="noopener">ok</a>');
    expect(r.html).toContain('https://cdn.shopify.com/mug.jpg');
    expect(r.html).toContain('From 12.00 GBP');
    expect(charges).toHaveLength(1);
    expect((await request(makeApp('lp-b')).post(B + '/generate').send({ productId: 'x' })).status).toBe(400);
  });

  it('saves the page to Shopify hidden and keeps a record', async () => {
    const app = makeApp('lp-c');
    expect((await request(app).post(B + '/publish').send({ title: '', html: '<p>x</p>' })).status).toBe(400);
    const r = (await request(app).post(B + '/publish').send({ title: 'Mug', html: '<p><img src="https://cdn.shopify.com/m.jpg" alt="Mug"></p><p onclick="z()">Hi</p><script>1</script>' })).body;
    expect(r.adminUrl).toMatch(/\/admin\/pages\/77$/);
    expect(mockCreated[0]).toMatchObject({ title: 'Mug', isPublished: false });
    expect(mockCreated[0].body).toContain('cdn.shopify.com/m.jpg');
    expect(mockCreated[0].body).not.toMatch(/script|onclick/);
    expect((await request(app).get(B + '/pages')).body.pages).toHaveLength(1);
  });
});