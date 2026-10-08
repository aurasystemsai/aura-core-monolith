const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockMedia = { 'gid://shopify/MediaImage/1': '', 'gid://shopify/MediaImage/2': 'IMG_2231.jpg', 'gid://shopify/MediaImage/3': 'Red cotton tee, front view' };
const mockUpdates = [];
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q, vars) => {
    if (q.includes('productUpdateMedia')) { vars.m.forEach((f) => { mockMedia[f.id] = f.alt; }); mockUpdates.push(vars.m[0]); return { productUpdateMedia: { media: [], mediaUserErrors: [] } }; }
    const img = (id) => ({ id, alt: mockMedia[id], image: { url: 'https://cdn.shopify.com/' + id.split('/').pop() + '.jpg' } });
    if (q.includes('products(')) return { products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'gid://shopify/Product/9', title: 'Tee', media: { nodes: Object.keys(mockMedia).map(img) } }] } };
    if (q.includes('nodes(ids')) return { nodes: vars.ids.filter((i) => mockMedia[i] !== undefined).map(img) };
    if (q.includes('node(id')) return { node: mockMedia[vars.id] === undefined ? null : { id: vars.id, alt: mockMedia[vars.id] } };
    return {};
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: '"Image of a red cotton t-shirt laid flat on a white background"' } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop, charges) {
  const router = require('../tools/image-alt-media-seo/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async (m) => { if (charges) charges.push(m); }; next(); });
  app.use('/api/image-alt-media-seo', router);
  return app;
}
const B = '/api/image-alt-media-seo';
const M1 = 'gid://shopify/MediaImage/1';
const P9 = 'gid://shopify/Product/9';

describe('image alt text', () => {
  it('flags missing and filename-style alt text from real image data', async () => {
    const r = (await request(makeApp('al-a')).get(B + '/images')).body;
    expect(r.summary).toMatchObject({ total: 3, missing: 1, filename: 1, good: 1 });
    expect(r.images.find((i) => i.id === M1).problem).toBe('missing');
  });

  it('writes alt text with AI, cleans it, and charges per image described', async () => {
    const charges = [];
    const r = (await request(makeApp('al-b', charges)).post(B + '/generate').send({ ids: [M1, 'gid://shopify/MediaImage/404', 'bad'] })).body;
    expect(r.results.find((x) => x.id === M1).alt).toBe('A red cotton t-shirt laid flat on a white background');
    expect(r.results.find((x) => x.id.endsWith('/404')).error).toMatch(/not found/);
    expect(charges).toHaveLength(1);
    expect(mockCreate.mock.calls[0][0].messages[0].content[1].image_url.url).toContain('cdn.shopify.com');
    expect((await request(makeApp('al-b')).post(B + '/generate').send({ ids: [] })).status).toBe(400);
  });

  it('applies alt text, logs it and can undo it', async () => {
    const app = makeApp('al-c');
    expect((await request(app).post(B + '/apply').send({ id: M1, productId: P9, alt: '' })).status).toBe(400);
    expect((await request(app).post(B + '/apply').send({ id: 'nope', productId: P9, alt: 'x' })).status).toBe(400);
    const a = (await request(app).post(B + '/apply').send({ id: M1, productId: P9, alt: 'Red tee front' })).body;
    expect(a.entry).toMatchObject({ from: '', to: 'Red tee front' });
    expect(mockUpdates.pop()).toEqual({ id: M1, alt: 'Red tee front' });
    expect((await request(app).get(B + '/log')).body.log).toHaveLength(1);
    expect((await request(app).post(B + '/revert').send({ id: a.entry.id })).body.entry.reverted).toBe(true);
    expect(mockMedia[M1]).toBe('');
    expect((await request(app).post(B + '/revert').send({ id: a.entry.id })).status).toBe(400);
  });
});
