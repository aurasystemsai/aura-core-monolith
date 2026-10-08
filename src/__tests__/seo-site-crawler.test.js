const os = require('os');
const path = require('path');
const fs = require('fs');
process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-crawl-'));

const express = require('express');
const request = require('supertest');
const { auditEntity, auditStore } = require('../core/seoAnalyzers');

jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok-a' : null) }));
jest.mock('../core/shopifyApply', () => ({ applyProductFields: jest.fn().mockResolvedValue({ ok: true }) }));

const { applyProductFields } = require('../core/shopifyApply');

function app(session) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = session; next(); });
  a.use('/api/seo-site-crawler', require('../tools/seo-site-crawler/router'));
  return a;
}

const product = (over = {}) => ({
  type: 'product', id: 'gid://shopify/Product/1', handle: 'p', url: 'https://a.myshopify.com/products/p',
  title: 'Blue Mug', seoTitle: 'Blue ceramic mug | Handmade', seoDescription: 'x'.repeat(130),
  html: '', text: 'word '.repeat(60), images: [{ id: 'i1', alt: 'mug' }], ...over,
});

describe('seoAnalyzers', () => {
  test('clean product has no issues', () => {
    expect(auditEntity(product())).toEqual([]);
  });
  test('flags missing description, thin content and missing alt', () => {
    const types = auditEntity(product({ seoDescription: '', text: 'short', images: [{ id: 'i', alt: '' }] })).map(i => i.type);
    expect(types).toEqual(expect.arrayContaining(['Missing meta description', 'Thin content', 'Images missing alt text']));
  });
  test('detects duplicate titles and scores the store', () => {
    const r = auditStore([product(), product({ id: 'gid://shopify/Product/2', url: 'https://a.myshopify.com/products/q', seoDescription: 'y'.repeat(130) })]);
    expect(r.issues.some(i => i.type === 'Duplicate title')).toBe(true);
    expect(r.score).toBeLessThan(100);
    expect(r.pagesScanned).toBe(2);
  });
  test('empty store scores 0 without crashing', () => {
    expect(auditStore([]).score).toBe(0);
  });
});

describe('seo-site-crawler router', () => {
  const session = { shop: 'a.myshopify.com', shopifyToken: 'tok-a' };
  beforeEach(() => {
    global.fetch = jest.fn(async (url, opts) => {
      const q = JSON.parse(opts.body).query;
      const empty = { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] };
      if (q.includes('products(')) {
        return { ok: true, json: async () => ({ data: { products: { pageInfo: empty.pageInfo, nodes: [
          { id: 'gid://shopify/Product/1', handle: 'p', title: 'Blue Mug', descriptionHtml: '<p>short</p>', status: 'ACTIVE', seo: { title: '', description: '' }, media: { nodes: [{ id: 'm1', alt: '' }] } },
          { id: 'gid://shopify/Product/2', handle: 'draft', title: 'Draft', descriptionHtml: '', status: 'DRAFT', seo: {}, media: { nodes: [] } },
        ] } } }) };
      }
      const key = /(\w+)\(first/.exec(q)[1];
      return { ok: true, json: async () => ({ data: { [key]: empty } }) };
    });
  });

  test('requires a connected shop', async () => {
    const r = await request(app(undefined)).post('/api/seo-site-crawler/crawl').send({});
    expect(r.status).toBe(401);
  });

  test('rejects a mismatched shop header', async () => {
    const r = await request(app(session)).post('/api/seo-site-crawler/crawl').set('x-shopify-shop-domain', 'b.myshopify.com').send({});
    expect(r.status).toBe(403);
  });

  test('does not use another shop token', async () => {
    const r = await request(app(undefined)).post('/api/seo-site-crawler/crawl').set('x-shopify-shop-domain', 'b.myshopify.com').send({});
    expect(r.status).toBe(401);
  });

  test('crawls, skips draft products, stores history scoped to the shop', async () => {
    const r = await request(app(session)).post('/api/seo-site-crawler/crawl').send({});
    expect(r.status).toBe(200);
    expect(r.body.result.pagesScanned).toBe(1);
    expect(r.body.result.issues.map(i => i.type)).toContain('Missing meta description');
    const h = await request(app(session)).get('/api/seo-site-crawler/history');
    expect(h.body.history).toHaveLength(1);
    const other = await request(app({ shop: 'a.myshopify.com', shopifyToken: 't' })).get('/api/seo-site-crawler/history');
    expect(other.body.history).toHaveLength(1);
    const detail = await request(app(session)).get(`/api/seo-site-crawler/history/${r.body.id}`);
    expect(detail.body.entry.result.pagesScanned).toBe(1);
    expect((await request(app(session)).get('/api/seo-site-crawler/history/nope')).status).toBe(404);
  });

  test('compare reports resolved and introduced issues', async () => {
    const a = await request(app(session)).post('/api/seo-site-crawler/crawl').send({});
    const b = await request(app(session)).post('/api/seo-site-crawler/crawl').send({});
    const c = await request(app(session)).get('/api/seo-site-crawler/compare').query({ a: a.body.id, b: b.body.id });
    expect(c.status).toBe(200);
    expect(c.body.scoreChange).toBe(0);
    expect((await request(app(session)).get('/api/seo-site-crawler/compare').query({ a: 'x', b: 'y' })).status).toBe(404);
  });

  test('apply-fixes validates ids and applies valid ones', async () => {
    const bad = await request(app(session)).post('/api/seo-site-crawler/apply-fixes').send({ fixes: [] });
    expect(bad.status).toBe(400);
    const r = await request(app(session)).post('/api/seo-site-crawler/apply-fixes').send({ fixes: [
      { productId: 'gid://shopify/Product/1', seoTitle: 'T', metaDescription: 'D' },
      { productId: '../../evil', seoTitle: 'T' },
    ] });
    expect(r.body.success).toBe(1);
    expect(r.body.failed).toBe(1);
    expect(applyProductFields).toHaveBeenCalledTimes(1);
  });
});
