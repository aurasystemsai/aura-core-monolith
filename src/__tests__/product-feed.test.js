const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockProduct = {
  p1: { id: 'gid://shopify/Product/1', title: 'Organic Cotton T-Shirt - White', handle: 'tee', vendor: 'Acme', productType: 'Shirts', onlineStoreUrl: 'https://s.example/products/tee',
    descriptionHtml: '<p>' + 'Soft organic cotton tee, made to last. '.repeat(6) + '</p>', media: { nodes: [{ image: { url: 'https://cdn.shopify.com/a.jpg' } }] },
    variants: { nodes: [{ id: 'gid://shopify/ProductVariant/11', title: 'M', sku: 'T-M', barcode: '5012345678900', price: '19.00', inventoryQuantity: 4, inventoryPolicy: 'DENY' }, { id: 'gid://shopify/ProductVariant/12', title: 'L', sku: 'T-L', barcode: '', price: '19.00', inventoryQuantity: 0, inventoryPolicy: 'DENY' }] } },
  p2: { id: 'gid://shopify/Product/2', title: 'CERAMIC COFFEE MUG', handle: 'mug', vendor: '', productType: '', onlineStoreUrl: null, descriptionHtml: '', media: { nodes: [] },
    variants: { nodes: [{ id: 'gid://shopify/ProductVariant/21', title: 'Default Title', sku: '', barcode: '', price: '0.00', inventoryQuantity: 1, inventoryPolicy: 'DENY' }] } },
};
const mockUpdates = [];
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q, vars) => {
    if (q.includes('productUpdate')) { mockUpdates.push(vars.input); return { productUpdate: { product: { id: vars.input.id }, userErrors: [] } }; }
    if (q.includes('products(')) return { shop: { currencyCode: 'GBP' }, products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [mockProduct.p1, mockProduct.p2] } };
    if (q.includes('tags')) return { product: { id: vars.id, title: 'Tee', descriptionHtml: '<p>old</p>', vendor: 'Acme', productType: 'Shirts', tags: ['cotton'] } };
    if (q.includes('product(id')) return { product: { id: vars.id, title: 'Tee', descriptionHtml: '<p>old</p>' } };
    return {};
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ title: 'Organic Cotton T-Shirt, White', description: 'A soft organic cotton t-shirt in white.' }) } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop, charges) {
  const router = require('../tools/product-feed/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async (m) => { if (charges) charges.push(m); }; next(); });
  app.use('/api/product-feed', router);
  return app;
}
const B = '/api/product-feed';

describe('product feed', () => {
  it('audits real product data and ranks the worst first', async () => {
    const r = (await request(makeApp('pf-a')).get(B + '/audit')).body;
    expect(r.summary).toMatchObject({ total: 2, ready: 1, withErrors: 1 });
    expect(r.products[0].title).toBe('CERAMIC COFFEE MUG');
    const codes = r.products[0].issues.map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(['no-image', 'no-link', 'no-description', 'bad-price', 'caps-title']));
    expect(r.products[1].issues).toEqual([]);
    expect(r.products[1].score).toBe(100);
  });

  it('exports one row per variant, leaves out products that would be rejected, and says so', async () => {
    const res = await request(makeApp('pf-b')).get(B + '/export');
    expect(res.headers['x-feed-rows']).toBe('2');
    expect(res.headers['x-feed-skipped']).toBe('1');
    const lines = res.text.trim().split('\n');
    expect(lines[0].split('\t')).toContain('image_link');
    expect(lines[1]).toContain('in_stock');
    expect(lines[1]).toContain('19.00 GBP');
    expect(lines[1]).toContain('?variant=11');
    expect(lines[2]).toContain('out_of_stock');
    expect(res.text).not.toContain('CERAMIC');
  });

  it('suggests with AI, charges once, then applies and undoes with a log', async () => {
    const charges = []; const app = makeApp('pf-c', charges);
    const id = 'gid://shopify/Product/1';
    const s = (await request(app).post(B + '/suggest').send({ id })).body;
    expect(s.suggestion.title).toBe('Organic Cotton T-Shirt, White');
    expect(charges).toHaveLength(1);
    const a = await request(app).post(B + '/apply').send({ id, title: s.suggestion.title, description: s.suggestion.description });
    expect(a.body.ok).toBe(true);
    expect(mockUpdates[0].descriptionHtml).toBe('<p>A soft organic cotton t-shirt in white.</p>');
    const log = (await request(app).get(B + '/log')).body.log;
    expect(log).toHaveLength(1);
    const u = await request(app).post(B + '/revert').send({ id: log[0].id });
    expect(u.body.ok).toBe(true);
    expect(mockUpdates[1]).toMatchObject({ title: 'Tee', descriptionHtml: '<p>old</p>' });
    expect((await request(app).post(B + '/revert').send({ id: log[0].id })).status).toBe(400);
  });

  it('rejects bad input', async () => {
    const app = makeApp('pf-d');
    expect((await request(app).post(B + '/suggest').send({ id: 'nope' })).status).toBe(400);
    expect((await request(app).post(B + '/apply').send({ id: 'gid://shopify/Product/1', title: '', description: 'x' })).status).toBe(400);
  });
});