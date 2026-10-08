const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
jest.mock('../core/searchConsole', () => ({ getConnection: () => null }));
jest.mock('../core/shopifyApply', () => ({ publishArticle: jest.fn(async () => ({ ok: true, articleId: 9, blogId: 3, handle: 'h' })) }));
jest.mock('../core/shopStore', () => {
  const m = new Map();
  return { read: (t, s, f) => (m.has(t + s) ? m.get(t + s) : f), write: (t, s, v) => m.set(t + s, v),
    pushCapped: (t, s, e, c = 50) => { const l = m.get(t + s) || []; l.unshift(e); m.set(t + s, l.slice(0, c)); return e; } };
});
const { getOpenAIClient } = require('../core/openaiClient');
const { publishArticle } = require('../core/shopifyApply');

function app(shop = 'a.myshopify.com') {
  const a = express();
  const deduct = jest.fn();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/bde', require('../tools/blog-draft-engine/router'));
  a.deduct = deduct;
  return a;
}

function mockShopify() {
  global.fetch = jest.fn(async (_u, opts) => {
    const { query } = JSON.parse(opts.body);
    const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
    const data = /shop \{ name/.test(query) ? { shop: { name: 'Clay Co' } }
      : /products\(first/.test(query)
        ? { products: { ...empty, nodes: [{ id: 'p1', handle: 'blue-mug', title: 'Blue Mug', descriptionHtml: '', status: 'ACTIVE', seo: {}, media: { nodes: [] } }] } }
        : { pages: empty, collections: empty, articles: empty };
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
}

const body = '<h2>One</h2><p>blue mug care</p><h2>Two</h2><p>x</p><h2>Three</h2><p>y</p><script>alert(1)</script><p onclick="x()">hi</p>';
const ai = (content) => ({ chat: { completions: { create: jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] })) } } });

describe('blog draft engine', () => {
  beforeEach(() => { mockShopify(); publishArticle.mockClear(); });

  test('503 without AI and 400 without a title', async () => {
    getOpenAIClient.mockReturnValue(null);
    expect((await request(app()).post('/api/bde/drafts/generate').send({ title: 'x' })).status).toBe(503);
    getOpenAIClient.mockReturnValue(ai({}));
    expect((await request(app()).post('/api/bde/drafts/generate').send({})).status).toBe(400);
  });

  test('generates, sanitises, stores, charges credits and reports real checks', async () => {
    getOpenAIClient.mockReturnValue(ai({ title: 'Blue mug care', metaDescription: 'How to look after a handmade blue mug so it lasts for years of daily coffee.', bodyHtml: body, tags: ['mugs'] }));
    const a = app();
    const res = await request(a).post('/api/bde/drafts/generate').send({ title: 'Blue mug care', keyword: 'blue mug' });
    expect(res.status).toBe(200);
    expect(res.body.draft.bodyHtml).not.toMatch(/script|onclick/i);
    expect(res.body.draft.quality.checks.find((c) => c.id === 'headings').ok).toBe(true);
    expect(res.body.draft.quality.checks.find((c) => c.id === 'length').ok).toBe(false);
    expect(a.deduct).toHaveBeenCalledTimes(1);
    const list = await request(a).get('/api/bde/drafts');
    expect(list.body.drafts).toHaveLength(1);
  });

  test('edit, improve and delete a draft', async () => {
    getOpenAIClient.mockReturnValue(ai({ title: 't', metaDescription: 'm'.repeat(100), bodyHtml: body, tags: [] }));
    const a = app('c.myshopify.com');
    const { body: { draft } } = await request(a).post('/api/bde/drafts/generate').send({ title: 't' });
    const put = await request(a).put(`/api/bde/drafts/${draft.id}`).send({ title: 'New title' });
    expect(put.body.draft.title).toBe('New title');
    getOpenAIClient.mockReturnValue(ai({ metaDescription: 'better '.repeat(15), bodyHtml: '<h2>Improved</h2><p>ok</p>' }));
    const imp = await request(a).post(`/api/bde/drafts/${draft.id}/improve`).send({ instruction: 'shorter' });
    expect(imp.body.draft.bodyHtml).toContain('Improved');
    expect((await request(a).delete(`/api/bde/drafts/${draft.id}`)).status).toBe(200);
    expect((await request(a).get(`/api/bde/drafts/${draft.id}`)).status).toBe(404);
  });

  test('publishes as a hidden Shopify draft unless live is requested', async () => {
    getOpenAIClient.mockReturnValue(ai({ title: 't', metaDescription: 'm'.repeat(100), bodyHtml: body, tags: ['a', 'b'] }));
    const a = app('d.myshopify.com');
    const { body: { draft } } = await request(a).post('/api/bde/drafts/generate').send({ title: 't' });
    const r1 = await request(a).post(`/api/bde/drafts/${draft.id}/publish`).send({});
    expect(publishArticle.mock.calls[0][1]).toMatchObject({ asDraft: true, tags: 'a, b' });
    expect(r1.body.published.live).toBe(false);
    await request(a).post(`/api/bde/drafts/${draft.id}/publish`).send({ live: true });
    expect(publishArticle.mock.calls[1][1].asDraft).toBe(false);
  });

  test("a shop cannot read another shop's drafts", async () => {
    getOpenAIClient.mockReturnValue(ai({ title: 't', metaDescription: 'm'.repeat(100), bodyHtml: body, tags: [] }));
    const { body: { draft } } = await request(app('e.myshopify.com')).post('/api/bde/drafts/generate').send({ title: 't' });
    expect((await request(app('f.myshopify.com')).get(`/api/bde/drafts/${draft.id}`)).status).toBe(404);
  });

  test('ideas come back structured and charge credits', async () => {
    getOpenAIClient.mockReturnValue(ai({ ideas: [{ title: 'Mug care', keyword: 'mug care', angle: 'how-to' }, { title: '' }] }));
    const a = app();
    const res = await request(a).post('/api/bde/ideas').send({ topic: 'mugs' });
    expect(res.body.ideas).toEqual([{ title: 'Mug care', keyword: 'mug care', angle: 'how-to' }]);
    expect(a.deduct).toHaveBeenCalled();
  });
});
