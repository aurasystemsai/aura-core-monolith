const express = require('express');
const request = require('supertest');

const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const router = require('../tools/ai-shopping-readiness/router');

function app() {
  const a = express();
  a.use('/api/asr', (req, _res, next) => { req.session = { shop: 'asr-demo.myshopify.com', shopifyToken: 'tok' }; next(); }, router);
  return a;
}
const good = {
  id: 'gid://shopify/Product/1', title: 'Blue Cotton T-Shirt', handle: 'blue', vendor: 'Acme', productType: 'Tees',
  descriptionHtml: `<p>${'Soft cotton. '.repeat(20)}</p>`, onlineStoreUrl: 'https://x.com/products/blue',
  media: { nodes: [{ image: { url: 'https://img/1.jpg' } }] }, variants: { nodes: [{ id: 'v1', price: '20.00', barcode: '123' }] },
};
const bad = { id: 'gid://shopify/Product/2', title: 'Hat', vendor: '', descriptionHtml: '', onlineStoreUrl: null, media: { nodes: [] }, variants: { nodes: [{ id: 'v2', price: '0.00', barcode: '' }] } };
const shopInfo = { name: 'Demo', primaryDomain: { url: 'https://x.com/' }, shopPolicies: [{ type: 'REFUND_POLICY', url: 'https://x.com/r', body: 'text' }, { type: 'PRIVACY_POLICY', url: 'https://x.com/p', body: '' }] };

beforeEach(() => mockGql.mockReset());

describe('ai-shopping-readiness', () => {
  test('scores a complete product 100 and an incomplete one low', () => {
    expect(router._inspect(good)).toMatchObject({ score: 100, ready: true });
    const r = router._inspect(bad);
    expect(r.ready).toBe(false);
    expect(r.missingRequired).toEqual(expect.arrayContaining(['Description', 'Product page link', 'Brand', 'Image', 'Price']));
  });
  test('scan reports coverage, policies and worst products first', async () => {
    mockGql.mockResolvedValue({ shop: shopInfo, products: { pageInfo: { hasNextPage: false }, nodes: [good, bad] } });
    const r = await request(app()).get('/api/asr/scan');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ total: 2, ready: 1 });
    expect(r.body.products[0].title).toBe('Hat');
    expect(r.body.coverage.gtin.count).toBe(1);
    expect(r.body.policies).toEqual({ refund: true, shipping: false, privacy: false, terms: false });
  });
  test('scan with no products returns zero without dividing by zero', async () => {
    mockGql.mockResolvedValue({ shop: shopInfo, products: { pageInfo: { hasNextPage: false }, nodes: [] } });
    const r = await request(app()).get('/api/asr/scan');
    expect(r.body).toMatchObject({ total: 0, average: 0 });
  });
  test('llms.txt lists only products with a page and policies with text', async () => {
    mockGql.mockResolvedValue({ shop: shopInfo, products: { pageInfo: { hasNextPage: false }, nodes: [good, bad] } });
    const r = await request(app()).get('/api/asr/llms-txt').query({ summary: 'We sell tees.' });
    expect(r.body.text).toContain('# Demo');
    expect(r.body.text).toContain('> We sell tees.');
    expect(r.body.text).toContain('[Blue Cotton T-Shirt](https://x.com/products/blue)');
    expect(r.body.text).toContain('Refund policy');
    expect(r.body.text).not.toContain('Privacy policy');
    expect(r.body.text).not.toContain('Hat');
    expect(r.body.productCount).toBe(1);
  });
  test('a store without the policies permission still scans, with policies unknown', async () => {
    mockGql.mockImplementation(async (s, t, q) => {
      if (q.includes('shopPolicies')) throw new Error('Access denied for shopPolicies field');
      return { shop: shopInfo, products: { pageInfo: { hasNextPage: false }, nodes: [good] } };
    });
    const r = await request(app()).get('/api/asr/scan');
    expect(r.status).toBe(200);
    expect(r.body.policies).toBeNull();
  });
  test('a Shopify error comes back as an error, not a crash', async () => {
    mockGql.mockRejectedValue(Object.assign(new Error('boom'), { status: 502 }));
    const r = await request(app()).get('/api/asr/scan');
    expect(r.status).toBe(502);
    expect(r.body.ok).toBe(false);
  });
});
