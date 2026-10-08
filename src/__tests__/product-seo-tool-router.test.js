jest.mock('../tools/product-seo/model', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('../core/openaiClient', () => ({
  getOpenAIClient: jest.fn(() => null),
}));

jest.mock('../core/shopifyApply', () => ({
  applyProductFields: jest.fn(async (_shop, productId, fields) => ({ ok: true, productId, fields })),
}));

const express = require('express');
const request = require('supertest');
const model = require('../tools/product-seo/model');
const router = require('../tools/product-seo/router');
const { applyProductFields } = require('../core/shopifyApply');

const app = express();
app.use(express.json());
app.use('/api/product-seo', router);

describe('Product SEO tool API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists stored SEO records', async () => {
    model.getAll.mockResolvedValue([{ id: 1, title: 'SEO record' }]);

    const response = await request(app).get('/api/product-seo/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, data: [{ id: 1, title: 'SEO record' }] });
  });

  test('reports unavailable AI configuration instead of returning generated-looking content', async () => {
    const response = await request(app)
      .post('/api/product-seo/generate')
      .send({ productName: 'Shop product', productDescription: 'Product details' });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ ok: false, error: 'OpenAI not configured' });
  });

  test('validates required generation input', async () => {
    const response = await request(app)
      .post('/api/product-seo/generate')
      .send({ productName: 'Shop product' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
  });

  test('sends approved fields to the Shopify update helper', async () => {
    const response = await request(app)
      .post('/api/product-seo/shopify/apply')
      .set('x-shopify-shop-domain', 'demo.myshopify.com')
      .send({ productId: '123', seoTitle: 'Search title', metaDescription: 'Search description' });

    expect(response.status).toBe(200);
    expect(applyProductFields).toHaveBeenCalledWith('demo.myshopify.com', '123', {
      title: undefined,
      body_html: undefined,
      handle: undefined,
      tags: undefined,
      metaDescription: 'Search description',
      seoTitle: 'Search title',
    });
  });
});
