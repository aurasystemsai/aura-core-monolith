const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gsc-'));
process.env.SESSION_SECRET = 'test-secret';
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/seoStoreData', () => ({ gql: jest.fn(async () => ({ shop: { primaryDomain: { host: 'shop.example.com' } } })) }));
const sc = require('../core/searchConsole');

const SHOP = 'demo.myshopify.com';

function app(session) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = session; req.deductCredits = jest.fn(); next(); });
  a.use('/api/rank', require('../tools/rank-visibility-tracker/router'));
  a.use('/google', require('../routes/google-oauth'));
  return a;
}
const session = { shop: SHOP, shopifyToken: 'tok' };

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_CLIENT_SECRET = 'csecret';
  process.env.HOST_URL = 'https://aura.example.com';
});
afterEach(() => { sc.disconnect(SHOP); delete global.fetch; });

describe('searchConsole core', () => {
  test('state round-trips, rejects tampering and expiry', () => {
    const s = sc.signState(SHOP);
    expect(sc.verifyState(s)).toBe(SHOP);
    expect(sc.verifyState(s.slice(0, -2) + 'xx')).toBeNull();
    expect(sc.verifyState('garbage')).toBeNull();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60 * 1000);
    expect(sc.verifyState(s)).toBeNull();
    spy.mockRestore();
  });
  test('refresh token is encrypted at rest', () => {
    const blob = sc.encrypt('refresh-123');
    expect(blob).not.toContain('refresh-123');
    expect(sc.decrypt(blob)).toBe('refresh-123');
  });
});

describe('search console routes', () => {
  test('status reports availability and connection', async () => {
    const r = await request(app(session)).get('/api/rank/status');
    expect(r.body.gsc).toEqual({ available: true, connected: false });
  });

  test('connect returns a Google URL scoped read-only with our redirect', async () => {
    const r = await request(app(session)).get('/api/rank/gsc/connect');
    const u = new URL(r.body.url);
    expect(u.host).toBe('accounts.google.com');
    expect(u.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/webmasters.readonly');
    expect(u.searchParams.get('redirect_uri')).toBe('https://aura.example.com/google/callback');
    expect(sc.verifyState(u.searchParams.get('state'))).toBe(SHOP);
  });

  test('connect is refused when Google is not configured', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const r = await request(app(session)).get('/api/rank/gsc/connect');
    expect(r.status).toBe(503);
  });

  test('callback with bad state is rejected and stores nothing', async () => {
    const r = await request(app(session)).get('/google/callback?code=abc&state=forged');
    expect(r.status).toBe(400);
    expect(sc.getConnection(SHOP)).toBeNull();
  });

  test('callback stores an encrypted refresh token for the signed shop', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ refresh_token: 'rt-secret', access_token: 'at' }) }));
    const r = await request(app(session)).get(`/google/callback?code=abc&state=${encodeURIComponent(sc.signState(SHOP))}`);
    expect(r.status).toBe(200);
    const saved = sc.getConnection(SHOP);
    expect(JSON.stringify(saved)).not.toContain('rt-secret');
    expect(sc.decrypt(saved.refreshToken)).toBe('rt-secret');
  });

  test('queries need a connection', async () => {
    const r = await request(app(session)).get('/api/rank/gsc/queries');
    expect(r.status).toBe(400);
  });

  test('queries return real positions from the matching property only', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ refresh_token: 'rt', access_token: 'at' }) }));
    await request(app(session)).get(`/google/callback?code=abc&state=${encodeURIComponent(sc.signState(SHOP))}`);
    global.fetch = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes('oauth2.googleapis.com')) return { ok: true, json: async () => ({ access_token: 'at' }) };
      if (u.endsWith('/sites')) return { ok: true, json: async () => ({ siteEntry: [
        { siteUrl: 'sc-domain:other.com', permissionLevel: 'siteOwner' },
        { siteUrl: 'sc-domain:shop.example.com', permissionLevel: 'siteOwner' }] }) };
      return { ok: true, json: async () => ({ rows: [{ keys: ['ceramic mug'], clicks: 12, impressions: 300, ctr: 0.04, position: 7.234 }] }) };
    });
    const r = await request(app(session)).get('/api/rank/gsc/queries');
    expect(r.body).toMatchObject({ ok: true, site: 'sc-domain:shop.example.com', queries: [{ query: 'ceramic mug', position: 7.2, ctr: 4 }] });
    const analytics = global.fetch.mock.calls.find(c => String(c[0]).includes('searchAnalytics'));
    expect(String(analytics[0])).toContain(encodeURIComponent('sc-domain:shop.example.com'));
  });

  test('clear message when the store is not a verified property', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ refresh_token: 'rt', access_token: 'at' }) }));
    await request(app(session)).get(`/google/callback?code=abc&state=${encodeURIComponent(sc.signState(SHOP))}`);
    global.fetch = jest.fn(async (url) => String(url).endsWith('/sites')
      ? { ok: true, json: async () => ({ siteEntry: [{ siteUrl: 'sc-domain:other.com', permissionLevel: 'siteOwner' }] }) }
      : { ok: true, json: async () => ({ access_token: 'at' }) });
    const r = await request(app(session)).get('/api/rank/gsc/queries');
    expect(r.status).toBe(404);
    expect(r.body.error).toMatch(/verified Search Console property/);
  });

  test('disconnect removes the connection', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ refresh_token: 'rt', access_token: 'at' }) }));
    await request(app(session)).get(`/google/callback?code=abc&state=${encodeURIComponent(sc.signState(SHOP))}`);
    await request(app(session)).post('/api/rank/gsc/disconnect');
    expect(sc.getConnection(SHOP)).toBeNull();
  });
});
