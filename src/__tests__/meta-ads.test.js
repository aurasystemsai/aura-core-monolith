const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'meta-'));
process.env.SESSION_SECRET = 'test-secret';
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const sc = require('../core/searchConsole');
const meta = require('../core/metaAds');

const SHOP = 'meta-demo.myshopify.com';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/meta', require('../tools/facebook-ads-integration/router'));
  a.use('/meta', require('../routes/meta-oauth'));
  return a;
}
const json = (body, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body });

beforeEach(() => {
  process.env.META_APP_ID = 'mid';
  process.env.META_APP_SECRET = 'msecret';
  process.env.HOST_URL = 'https://aura.example.com';
  deduct.mockClear(); mockCreate.mockReset();
});
afterEach(() => { meta.disconnect(SHOP); delete global.fetch; });

async function connect(expiresIn = 5000000) {
  global.fetch = jest.fn(async (url) => json(url.includes('fb_exchange_token') ? { access_token: 'long-token', expires_in: expiresIn } : { access_token: 'short' }));
  const res = await request(app()).get('/meta/callback').query({ code: 'c', state: sc.signState(SHOP, 'meta') });
  expect(res.status).toBe(200);
}

describe('meta ads connect', () => {
  test('connect url uses ads_read and the meta callback; unconfigured gives 503', async () => {
    const u = new URL((await request(app()).get('/api/meta/connect')).body.url);
    expect(u.searchParams.get('scope')).toBe('ads_read');
    expect(u.searchParams.get('redirect_uri')).toBe('https://aura.example.com/meta/callback');
    expect(sc.verifyStatePayload(u.searchParams.get('state'))).toEqual({ shop: SHOP, purpose: 'meta' });
    delete process.env.META_APP_ID;
    expect((await request(app()).get('/api/meta/connect')).status).toBe(503);
  });

  test('callback rejects a state made for another purpose', async () => {
    const res = await request(app()).get('/meta/callback').query({ code: 'c', state: sc.signState(SHOP, 'google-ads') });
    expect(res.status).toBe(400);
  });

  test('token is stored encrypted and an expired one is reported', async () => {
    await connect(-10);
    expect(meta.getConnection(SHOP).token).not.toContain('long-token');
    const st = (await request(app()).get('/api/meta/status')).body;
    expect(st).toMatchObject({ connected: true, expired: true });
    await request(app()).post('/api/meta/select').send({ accountId: '55' });
    expect((await request(app()).get('/api/meta/campaigns')).status).toBe(502);
  });

  test('campaign report reads purchases and computes roas', async () => {
    await connect();
    expect((await request(app()).get('/api/meta/campaigns')).status).toBe(400);
    await request(app()).post('/api/meta/select').send({ accountId: 'act_123' });
    global.fetch = jest.fn(async () => json({ data: [{ campaign_id: '9', campaign_name: 'Summer', spend: '40.00', clicks: '80', impressions: '2000', actions: [{ action_type: 'link_click', value: '80' }, { action_type: 'purchase', value: '4' }], action_values: [{ action_type: 'purchase', value: '160' }] }] }));
    const r = await request(app()).get('/api/meta/campaigns?days=7');
    expect(r.body.campaigns[0]).toMatchObject({ spend: 40, conversions: 4, cpc: 0.5, ctr: 4, roas: 4 });
    expect(global.fetch.mock.calls[0][0]).toContain('act_123/insights');
    expect(global.fetch.mock.calls[0][0]).toContain('date_preset=last_7d');
  });

  test('suggest charges only when the AI answers; disconnect clears', async () => {
    await connect();
    await request(app()).post('/api/meta/select').send({ accountId: '123' });
    global.fetch = jest.fn(async () => json({ data: [{ campaign_id: '9', campaign_name: 'Summer', spend: '4', clicks: '1', impressions: '10' }] }));
    mockCreate.mockRejectedValueOnce(new Error('down'));
    expect((await request(app()).post('/api/meta/suggest').send({})).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ summary: 's', actions: [{ campaign: 'Summer', action: 'Pause', reason: 'No sales' }] }) } }] });
    expect((await request(app()).post('/api/meta/suggest').send({})).body.actions).toHaveLength(1);
    expect(deduct).toHaveBeenCalledTimes(1);
    await request(app()).post('/api/meta/disconnect');
    expect(meta.getConnection(SHOP)).toBeNull();
  });
});