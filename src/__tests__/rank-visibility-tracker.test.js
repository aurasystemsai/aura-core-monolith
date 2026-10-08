const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rank-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const provider = require('../core/rankProvider');

describe('rankProvider', () => {
  afterEach(() => { delete process.env.SERPAPI_KEY; });
  test('hostMatches handles www and subdomains but not lookalikes', () => {
    expect(provider.hostMatches('https://www.shop.com/p', 'shop.com')).toBe(true);
    expect(provider.hostMatches('https://blog.shop.com/', 'shop.com')).toBe(true);
    expect(provider.hostMatches('https://notshop.com/', 'shop.com')).toBe(false);
    expect(provider.hostMatches('nonsense', 'shop.com')).toBe(false);
  });
  test('refuses without a provider key', async () => {
    await expect(provider.checkRank('x', 'shop.com')).rejects.toThrow(/No rank data provider/);
  });
  test('finds position and null when absent', async () => {
    process.env.SERPAPI_KEY = 'k';
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ organic_results: [
      { position: 1, link: 'https://a.com' }, { position: 2, link: 'https://www.shop.com/mug' }] }) }));
    expect(await provider.checkRank('mug', 'shop.com', 'gb')).toMatchObject({ position: 2, url: 'https://www.shop.com/mug' });
    expect(String(global.fetch.mock.calls[0][0])).toContain('gl=gb');
    expect((await provider.checkRank('mug', 'other.com')).position).toBeNull();
  });
});

function app(session) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = session; req.deductCredits = jest.fn(); next(); });
  a.use('/api/rank', require('../tools/rank-visibility-tracker/router'));
  return a;
}

describe('rank router', () => {
  const session = { shop: 'a.myshopify.com', shopifyToken: 'tok' };
  afterEach(() => { delete process.env.SERPAPI_KEY; });

  test('requires a shop', async () => {
    expect((await request(app(undefined)).get('/api/rank/keywords')).status).toBe(401);
  });
  test('reports an honest not-configured state and never fabricates ranks', async () => {
    const s = await request(app(session)).get('/api/rank/status');
    expect(s.body.configured).toBe(false);
    const t = await request(app(session)).post('/api/rank/track').send({ keyword: 'mug' });
    expect(t.status).toBe(503);
    expect((await request(app(session)).get('/api/rank/keywords')).body.keywords).toEqual([]);
  });
  test('tracks, rechecks, computes change and deletes', async () => {
    process.env.SERPAPI_KEY = 'k';
    let pos = 8;
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('serpapi')) return { ok: true, json: async () => ({ organic_results: [{ position: pos, link: 'https://shop.com/x' }] }) };
      return { ok: true, status: 200, json: async () => ({ data: { shop: { primaryDomain: { host: 'shop.com' } } } }) };
    });
    const a = app(session);
    expect((await request(a).post('/api/rank/track').send({ keyword: 'a' })).status).toBe(400);
    const t = await request(a).post('/api/rank/track').send({ keyword: 'blue mug' });
    expect(t.body.keyword.latest.position).toBe(8);
    pos = 5;
    const r = await request(a).post(`/api/rank/recheck/${t.body.keyword.id}`);
    expect(r.body.keyword.change).toBe(3);
    const dup = await request(a).post('/api/rank/track').send({ keyword: 'Blue Mug' });
    expect(dup.body.keyword.history).toHaveLength(3);
    expect((await request(a).get('/api/rank/keywords')).body.keywords).toHaveLength(1);
    expect((await request(a).delete(`/api/rank/keywords/${t.body.keyword.id}`)).body.ok).toBe(true);
    expect((await request(a).delete('/api/rank/keywords/nope')).status).toBe(404);
  });
  test('data is isolated per shop', async () => {
    const other = await request(app({ shop: 'b.myshopify.com', shopifyToken: 'tok' })).get('/api/rank/keywords');
    expect(other.body.keywords).toEqual([]);
  });
});
