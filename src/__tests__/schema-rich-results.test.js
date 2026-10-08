const express = require('express');
const request = require('supertest');
const sb = require('../core/schemaBuilder');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
const { getOpenAIClient } = require('../core/openaiClient');

const PRODUCT = {
  title: 'Blue Mug', handle: 'blue-mug', description: 'A handmade ceramic mug that holds 350ml and is dishwasher safe, glazed in deep blue.',
  vendor: 'Clay Co', featuredImage: { url: 'https://cdn/x.jpg' }, images: { nodes: [{ url: 'https://cdn/x.jpg' }, { url: 'https://cdn/y.jpg' }] },
  variants: { nodes: [{ sku: 'MUG-1', barcode: '', price: '12.50', availableForSale: true }] },
};

describe('schemaBuilder', () => {
  test('product schema is valid and complete', () => {
    const s = sb.buildProductSchema(PRODUCT, { currency: 'GBP', url: 'https://shop.com/products/blue-mug' });
    expect(s.offers.priceCurrency).toBe('GBP');
    expect(s.offers.availability).toMatch(/InStock/);
    expect(s.image).toHaveLength(2);
    expect(s.gtin).toBeUndefined();
    const v = sb.validateSchema(s);
    expect(v.valid).toBe(true);
    expect(v.issues).toEqual([]);
  });
  test('out of stock is reflected', () => {
    const p = { ...PRODUCT, variants: { nodes: [{ sku: 'a', price: '1', availableForSale: false }] } };
    expect(sb.buildProductSchema(p, { currency: 'USD', url: 'u' }).offers.availability).toMatch(/OutOfStock/);
  });
  test('article, organization, breadcrumb and faq build and validate', () => {
    const a = sb.buildArticleSchema({ title: 'T', body: '<p>b</p>', publishedAt: '2024-01-01', author: { name: 'Sam' }, image: { url: 'https://i' } }, { url: 'https://s/a', publisherName: 'Shop' });
    expect(sb.validateSchema(a).valid).toBe(true);
    expect(sb.validateSchema(sb.buildOrganizationSchema({ name: 'Shop', url: 'https://s', logo: 'https://l' })).issues).toEqual([]);
    expect(sb.buildBreadcrumbSchema([{ name: 'Home', url: 'u' }, { name: 'Mugs' }]).itemListElement[1].position).toBe(2);
    expect(sb.validateSchema(sb.buildFaqSchema([{ question: 'Q?', answer: 'A' }])).valid).toBe(true);
  });
  test('validator catches problems and parses script tags', () => {
    expect(sb.validateSchema('{nope').valid).toBe(false);
    const r = sb.validateSchema({ '@context': 'https://schema.org', '@type': 'Product', name: 'x' });
    expect(r.valid).toBe(false);
    expect(r.issues.map(i => i.message).join()).toMatch(/offers, review or aggregateRating/);
    const tag = sb.toScriptTag({ '@type': 'Product', name: '</script><b>' });
    expect(tag).not.toMatch(/<\/script><b>/);
    expect(sb.validateSchema(tag).types).toEqual(['Product']);
    expect(sb.validateSchema({ '@type': 'FAQPage', mainEntity: [{ name: 'q' }] }).valid).toBe(false);
  });
});

function app(session) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = session; next(); });
  a.use('/api/schema', require('../tools/schema-rich-results-engine/router'));
  return a;
}

describe('schema router', () => {
  const session = { shop: 'a.myshopify.com', shopifyToken: 'tok' };
  beforeEach(() => {
    global.fetch = jest.fn(async (_u, opts) => {
      const q = JSON.parse(opts.body).query;
      const shop = { name: 'Shop', currencyCode: 'GBP', primaryDomain: { url: 'https://shop.com/' } };
      if (q.includes('product(id')) return { ok: true, json: async () => ({ data: { shop, product: PRODUCT } }) };
      if (q.includes('article(id')) return { ok: true, json: async () => ({ data: { shop, article: null } }) };
      return { ok: true, json: async () => ({ data: { shop } }) };
    });
  });

  test('requires a connected shop', async () => {
    expect((await request(app(undefined)).post('/api/schema/generate').send({})).status).toBe(401);
  });
  test('generates product schema from Shopify data', async () => {
    const r = await request(app(session)).post('/api/schema/generate').send({ type: 'Product', id: 'gid://shopify/Product/1' });
    expect(r.status).toBe(200);
    expect(r.body.schema.url).toBe('https://shop.com/products/blue-mug');
    expect(r.body.validation.valid).toBe(true);
    expect(r.body.snippet).toMatch(/application\/ld\+json/);
  });
  test('rejects malformed ids, unknown types, and missing entities', async () => {
    const send = (b) => request(app(session)).post('/api/schema/generate').send(b);
    expect((await send({ type: 'Product', id: '1; drop' })).status).toBe(400);
    expect((await send({ type: 'Nope' })).status).toBe(400);
    expect((await send({ type: 'Article', id: 'gid://shopify/Article/9' })).status).toBe(404);
    expect((await send({ type: 'FAQPage', questions: [{ question: 'q', answer: '' }] })).status).toBe(400);
  });
  test('builds organization, breadcrumb and faq without ids', async () => {
    const send = (b) => request(app(session)).post('/api/schema/generate').send(b);
    expect((await send({ type: 'Organization', sameAs: ['https://x.com/a', 'javascript:1'] })).body.schema.sameAs).toEqual(['https://x.com/a']);
    expect((await send({ type: 'BreadcrumbList', items: [{ name: 'Home', url: 'https://shop.com' }] })).status).toBe(200);
    expect((await send({ type: 'FAQPage', questions: [{ question: 'Q?', answer: 'A.' }] })).status).toBe(200);
  });
  test('validate endpoint', async () => {
    const r = await request(app(session)).post('/api/schema/validate').send({ schema: '{"@type":"Product"}' });
    expect(r.body.validation.valid).toBe(false);
    expect((await request(app(session)).post('/api/schema/validate').send({})).status).toBe(400);
  });
  test('ai/faq uses the real description and handles AI failure', async () => {
    getOpenAIClient.mockReturnValue(null);
    expect((await request(app(session)).post('/api/schema/ai/faq').send({ id: 'gid://shopify/Product/1' })).status).toBe(503);
    const create = jest.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ questions: [{ question: 'Dishwasher safe?', answer: 'Yes.' }, { question: '', answer: 'x' }] }) } }] });
    getOpenAIClient.mockReturnValue({ chat: { completions: { create } } });
    const r = await request(app(session)).post('/api/schema/ai/faq').send({ id: 'gid://shopify/Product/1' });
    expect(r.body.questions).toHaveLength(1);
    expect(create.mock.calls[0][0].messages[0].content).toMatch(/dishwasher safe/);
  });
});
