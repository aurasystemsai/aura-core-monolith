const express = require('express');
const request = require('supertest');
const il = require('../core/internalLinks');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));

describe('internalLinks core', () => {
  test('insertLink links first safe whole-word occurrence only', () => {
    const html = '<h2>Blue Mug</h2><p>Our blue mug is great. Another blue mug.</p>';
    const out = il.insertLink(html, 'blue mug', '/products/blue-mug');
    expect(out).toContain('<h2>Blue Mug</h2>');
    expect(out).toContain('<a href="/products/blue-mug">blue mug</a> is great');
    expect(out.match(/<a /g)).toHaveLength(1);
  });
  test('does not link inside existing anchors or partial words', () => {
    expect(il.insertLink('<p><a href="/x">blue mug</a></p>', 'blue mug', '/p')).toBeNull();
    expect(il.insertLink('<p>blue mugs</p>', 'blue mug', '/p')).toBeNull();
  });
  test('analyze finds orphans and suggestions', () => {
    const e = [
      { id: 'gid://shopify/Product/1', type: 'product', url: '/products/blue-mug', title: 'Blue Mug', html: '<p>Nice.</p>' },
      { id: 'gid://shopify/Article/2', type: 'article', url: '/blogs/n/care', title: 'Care', html: '<p>Care for your blue mug daily with warm water and soap, and keep it away from heat.</p>' },
      { id: 'gid://shopify/Page/3', type: 'page', url: '/pages/about', title: 'About', html: '<p><a href="https://s.myshopify.com/blogs/n/care">care</a></p>' },
    ];
    const r = il.analyzeLinks(e, ['s.myshopify.com']);
    expect(r.nodes.find(n => n.url === '/blogs/n/care').inbound).toBe(1);
    expect(r.stats.withoutInbound).toBe(2);
    const s = r.suggestions.find(x => x.targetUrl === '/products/blue-mug');
    expect(s.sourceId).toBe('gid://shopify/Article/2');
    expect(s.anchor).toBe('Blue Mug');
  });
});

function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = jest.fn(); next(); });
  a.use('/api/ilo', require('../tools/internal-link-optimizer/router'));
  return a;
}

const PRODUCTS = [{ id: 'gid://shopify/Product/1', handle: 'blue-mug', title: 'Blue Mug', status: 'ACTIVE', descriptionHtml: '<p>Mug.</p>', seo: {}, images: { nodes: [] } }];
const ARTICLES = [{ id: 'gid://shopify/Article/2', handle: 'care', title: 'Care', body: '<p>Care for your blue mug daily.</p>', blog: { handle: 'n' }, images: [] }];

describe('internal link router', () => {
  let mutations;
  beforeEach(() => {
    mutations = [];
    global.fetch = jest.fn(async (_u, opts) => {
      const { query, variables } = JSON.parse(opts.body);
      let data = {};
      if (/articleUpdate/.test(query)) { mutations.push(variables); data = { articleUpdate: { userErrors: [] } }; }
      else if (/products\(first/.test(query)) data = { products: { pageInfo: { hasNextPage: false }, nodes: PRODUCTS } };
      else if (/articles\(first/.test(query)) data = { articles: { pageInfo: { hasNextPage: false }, nodes: ARTICLES } };
      else if (/(pages|collections)\(first/.test(query)) data = { pages: { pageInfo: { hasNextPage: false }, nodes: [] }, collections: { pageInfo: { hasNextPage: false }, nodes: [] } };
      else if (/node\(id/.test(query)) data = { node: { body: ARTICLES[0].body } };
      else if (/primaryDomain/.test(query)) data = { shop: { primaryDomain: { host: 'a.com' } } };
      return { ok: true, status: 200, json: async () => ({ data }) };
    });
  });

  test('apply rejects bad payload', async () => {
    const r = await request(app()).post('/api/ilo/apply').send({ suggestions: [] });
    expect(r.status).toBe(400);
  });

  test('apply rejects unknown source', async () => {
    const r = await request(app()).post('/api/ilo/apply').send({ suggestions: [{ sourceId: 'gid://shopify/Article/999', targetUrl: '/products/blue-mug', anchor: 'blue mug' }] });
    expect(r.body.failed).toBe(1);
    expect(mutations).toHaveLength(0);
  });

  test('apply inserts the link and updates the article', async () => {
    const r = await request(app()).post('/api/ilo/apply').send({ suggestions: [{ sourceId: 'gid://shopify/Article/2', targetUrl: 'https://a.myshopify.com/products/blue-mug', anchor: 'blue mug' }] });
    expect(r.body.success).toBe(1);
    expect(mutations[0].v).toContain('<a href="/products/blue-mug">blue mug</a>');
  });

  test('latest is empty before analysis', async () => {
    const r = await request(app()).get('/api/ilo/latest');
    expect(r.body.ok).toBe(true);
  });
});



