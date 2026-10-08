const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gads-'));
process.env.SESSION_SECRET = 'test-secret';
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const sc = require('../core/searchConsole');
const ads = require('../core/googleAds');

const SHOP = 'gads-demo.myshopify.com';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/gads', require('../tools/google-ads-integration/router'));
  a.use('/google', require('../routes/google-oauth'));
  return a;
}
const json = (body, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body });

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_CLIENT_SECRET = 'csecret';
  process.env.HOST_URL = 'https://aura.example.com';
  deduct.mockClear(); mockCreate.mockReset();
});
afterEach(() => { ads.disconnect(SHOP); delete global.fetch; });

async function connect() {
  global.fetch = jest.fn(async () => json({ refresh_token: 'rt', access_token: 'at' }));
  const state = sc.signState(SHOP, 'google-ads');
  const res = await request(app()).get('/google/callback').query({ code: 'c', state });
  expect(res.status).toBe(200);
}

describe('google ads connect', () => {
  test('connect url asks for the adwords scope and a google-ads state', async () => {
    const r = await request(app()).get('/api/gads/connect');
    const u = new URL(r.body.url);
    expect(u.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/adwords');
    expect(sc.verifyStatePayload(u.searchParams.get('state'))).toEqual({ shop: SHOP, purpose: 'google-ads' });
  });

  test('not configured gives 503 and the callback stores the token encrypted', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    expect((await request(app()).get('/api/gads/connect')).status).toBe(503);
    process.env.GOOGLE_CLIENT_ID = 'cid';
    await connect();
    const saved = ads.getConnection(SHOP);
    expect(saved.refreshToken).not.toContain('rt');
    expect(sc.getConnection(SHOP)).toBeNull();
    const st = await request(app()).get('/api/gads/status');
    expect(st.body).toMatchObject({ connected: true, customerId: null });
  });

  test('campaigns need an account, then convert micros and compute roas', async () => {
    await connect();
    expect((await request(app()).get('/api/gads/campaigns')).status).toBe(400);
    expect((await request(app()).post('/api/gads/select').send({ customerId: '12' })).status).toBe(400);
    await request(app()).post('/api/gads/select').send({ customerId: '123-456-7890' });
    global.fetch = jest.fn(async (url) => url.includes('oauth2') ? json({ access_token: 'at' }) : json({ results: [{ campaign: { id: '1', name: 'Shoes', status: 'ENABLED' }, metrics: { costMicros: '50000000', clicks: '100', impressions: '2000', conversions: 5, conversionsValue: 200 } }] }));
    const r = await request(app()).get('/api/gads/campaigns?days=7');
    expect(r.body.campaigns[0]).toMatchObject({ spend: 50, cpc: 0.5, ctr: 5, roas: 4 });
    expect(r.body.totals).toMatchObject({ spend: 50, roas: 4 });
    expect(global.fetch.mock.calls.some(([u]) => u.includes('customers/1234567890/googleAds:search'))).toBe(true);
  });

  test('suggest charges only when the AI answers', async () => {
    await connect();
    await request(app()).post('/api/gads/select').send({ customerId: '1234567890' });
    global.fetch = jest.fn(async (url) => url.includes('oauth2') ? json({ access_token: 'at' }) : json({ results: [{ campaign: { id: '1', name: 'Shoes', status: 'ENABLED' }, metrics: { costMicros: '1000000', clicks: '1' } }] }));
    mockCreate.mockRejectedValueOnce(new Error('down'));
    expect((await request(app()).post('/api/gads/suggest').send({})).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ summary: 'ok', actions: [{ campaign: 'Shoes', action: 'Pause it', reason: 'No sales' }] }) } }] });
    const r = await request(app()).post('/api/gads/suggest').send({});
    expect(r.body.actions).toHaveLength(1);
    expect(deduct).toHaveBeenCalledTimes(1);
  });

  test('disconnect removes the connection', async () => {
    await connect();
    await request(app()).post('/api/gads/disconnect');
    expect(ads.getConnection(SHOP)).toBeNull();
  });
});