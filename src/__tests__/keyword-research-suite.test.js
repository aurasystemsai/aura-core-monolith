const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
jest.mock('../core/searchConsole', () => ({
  isConfigured: () => true,
  getConnection: jest.fn(),
  accessToken: jest.fn(async () => 'g-token'),
  findSite: jest.fn(async () => 'sc-domain:a.com'),
  queryPositions: jest.fn(),
}));
const { getOpenAIClient } = require('../core/openaiClient');
const sc = require('../core/searchConsole');

const keywords = [
  'organic cotton shirt', 'buy organic cotton shirt', 'best organic cotton shirts',
  'wool sweater', 'merino wool sweater', 'buy wool sweater', 'how to wash cotton shirt',
];

function app(shop = 'a.myshopify.com') {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = jest.fn(); next(); });
  a.use('/api/krs', require('../tools/keyword-research-suite/router'));
  return a;
}

function mockShopify() {
  global.fetch = jest.fn(async (_u, opts) => {
    const { query } = JSON.parse(opts.body);
    const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
    let data;
    if (/primaryDomain/.test(query)) data = { shop: { primaryDomain: { host: 'a.com' } } };
    else if (/products\(first/.test(query)) {
      data = { products: { ...empty, nodes: [
        { id: 'p1', handle: 'blue-mug', title: 'Handmade Blue Mug', descriptionHtml: '', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
        { id: 'p2', handle: 'red-mug', title: 'Handmade Red Mug', descriptionHtml: '', status: 'ACTIVE', seo: {}, media: { nodes: [] } },
      ] } };
    } else data = { pages: empty, collections: empty, articles: empty };
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
}

describe('keyword clustering', () => {
  test('rejects missing keywords and unknown methods', async () => {
    const a = app();
    expect((await request(a).post('/api/krs/cluster/create').send({})).status).toBe(400);
    expect((await request(a).post('/api/krs/cluster/create').send({ keywords, method: 'magic' })).status).toBe(400);
  });

  test('clusters without inventing volume, then silo and calendar', async () => {
    const a = app();
    const created = await request(a).post('/api/krs/cluster/create').send({ keywords, minClusterSize: 2 });
    expect(created.status).toBe(200);
    created.body.data.clusters.forEach((c) => expect(c.volume).toBeNull());
    const silo = await request(a).post('/api/krs/cluster/build-silo').send({ clusterIds: [created.body.data.id] });
    expect(silo.status).toBe(200);
    const cal = await request(a).post('/api/krs/cluster/silo-calendar')
      .send({ siloId: silo.body.data.id, startDate: '2026-01-01', publishingFrequency: 'weekly' });
    expect(cal.status).toBe(200);
    expect((await request(a).post('/api/krs/cluster/silo-calendar').send({ siloId: 'nope' })).status).toBe(404);
  });

  test("another shop cannot use or list a shop's clusters", async () => {
    const created = await request(app('a.myshopify.com')).post('/api/krs/cluster/create').send({ keywords, minClusterSize: 2 });
    const b = app('b.myshopify.com');
    expect((await request(b).post('/api/krs/cluster/build-silo').send({ clusterIds: [created.body.data.id] })).status).toBe(404);
    const list = await request(b).get('/api/krs/cluster/list');
    expect(list.body.data.some((c) => c.id === created.body.data.id)).toBe(false);
  });
});

describe('store keywords and opportunities', () => {
  beforeEach(() => { mockShopify(); sc.getConnection.mockReset(); sc.queryPositions.mockReset(); });

  test('derives keywords from the real catalogue', async () => {
    const res = await request(app()).get('/api/krs/store-keywords');
    expect(res.status).toBe(200);
    const k = res.body.keywords.map((x) => x.keyword);
    expect(k).toContain('handmade blue mug');
    expect(k).toContain('handmade blue');
    res.body.keywords.forEach((x) => expect(x).not.toHaveProperty('volume'));
  });

  test('opportunities require a Search Console connection', async () => {
    sc.getConnection.mockReturnValue(null);
    expect((await request(app()).get('/api/krs/opportunities')).status).toBe(400);
  });

  test('returns only striking-distance queries from real rows', async () => {
    sc.getConnection.mockReturnValue({ site: 'x' });
    sc.queryPositions.mockResolvedValue([
      { query: 'blue mug', clicks: 1, impressions: 200, ctr: 0.5, position: 8.2 },
      { query: 'top query', clicks: 90, impressions: 900, ctr: 10, position: 1.4 },
      { query: 'far query', clicks: 0, impressions: 400, ctr: 0, position: 48 },
      { query: 'tiny', clicks: 0, impressions: 1, ctr: 0, position: 9 },
    ]);
    const res = await request(app()).get('/api/krs/opportunities');
    expect(res.status).toBe(200);
    expect(res.body.opportunities.map((o) => o.query)).toEqual(['blue mug']);
  });
});

describe('AI ideas', () => {
  beforeEach(() => { mockShopify(); sc.getConnection.mockReset(); sc.queryPositions.mockReset(); });

  test('503 when AI is not configured', async () => {
    getOpenAIClient.mockReturnValue(null);
    expect((await request(app()).post('/api/krs/ideas').send({})).status).toBe(503);
  });

  test('returns labelled AI ideas, de-duplicated, with no volume, and charges credits', async () => {
    sc.getConnection.mockReturnValue({ site: 'x' });
    sc.queryPositions.mockResolvedValue([{ query: 'handmade blue mug', clicks: 2, impressions: 50, ctr: 4, position: 11 }]);
    getOpenAIClient.mockReturnValue({ chat: { completions: { create: jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ ideas: [
      { keyword: 'Handmade Blue Mug', intent: 'transactional', why: 'x' },
      { keyword: 'handmade blue mug', intent: 'transactional', why: 'dupe' },
      { keyword: 'how to glaze a mug', intent: 'weird', why: 'y' },
    ] }) } }] })) } } });
    const a = express();
    const deduct = jest.fn();
    a.use(express.json());
    a.use((req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
    a.use('/api/krs', require('../tools/keyword-research-suite/router'));
    const res = await request(a).post('/api/krs/ideas').send({ seed: 'mugs' });
    expect(res.status).toBe(200);
    expect(res.body.ideas).toHaveLength(2);
    expect(res.body.ideas[0].searchConsole.impressions).toBe(50);
    expect(res.body.ideas[1].intent).toBe('informational');
    res.body.ideas.forEach((i) => { expect(i.source).toBe('ai'); expect(i).not.toHaveProperty('volume'); });
    expect(deduct).toHaveBeenCalledTimes(1);
  });
});
