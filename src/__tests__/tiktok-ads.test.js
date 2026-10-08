const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-'));
process.env.SESSION_SECRET = 'test-secret';
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const sc = require('../core/searchConsole');
const tt = require('../core/tiktokAds');

const SHOP = 'tt-demo.myshopify.com';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/tt', require('../tools/tiktok-ads-integration/router'));
  a.use('/tiktok', require('../routes/tiktok-oauth'));
  return a;
}
const json = (data, ok = true, code = 0) => ({ ok, status: ok ? 200 : 400, json: async () => ({ code, message: code ? 'bad' : 'OK', data }) });

beforeEach(() => {
  process.env.TIKTOK_APP_ID = 'tid';
  process.env.TIKTOK_APP_SECRET = 'tsecret';
  process.env.HOST_URL = 'https://aura.example.com';
  deduct.mockClear(); mockCreate.mockReset();
});
afterEach(() => { tt.disconnect(SHOP); delete global.fetch; });

async function connect() {
  global.fetch = jest.fn(async () => json({ access_token: 'secret-token', advertiser_ids: ['111', '222'] }));
  const res = await request(app()).get('/tiktok/callback').query({ auth_code: 'c', state: sc.signState(SHOP, 'tiktok') });
  expect(res.status).toBe(200);
}

describe('tiktok ads connect', () => {
  test('connect url, unconfigured 503, wrong-purpose state rejected', async () => {
    const u = new URL((await request(app()).get('/api/tt/connect')).body.url);
    expect(u.pathname).toBe('/portal/auth');
    expect(u.searchParams.get('redirect_uri')).toBe('https://aura.example.com/tiktok/callback');
    expect(sc.verifyStatePayload(u.searchParams.get('state'))).toEqual({ shop: SHOP, purpose: 'tiktok' });
    expect((await request(app()).get('/tiktok/callback').query({ auth_code: 'c', state: sc.signState(SHOP, 'meta') })).status).toBe(400);
    delete process.env.TIKTOK_APP_ID;
    expect((await request(app()).get('/api/tt/connect')).status).toBe(503);
  });

  test('token stored encrypted; only shared advertisers can be selected', async () => {
    await connect();
    expect(tt.getConnection(SHOP).token).not.toContain('secret-token');
    expect((await request(app()).post('/api/tt/select').send({ accountId: '999' })).status).toBe(400);
    expect((await request(app()).post('/api/tt/select').send({ accountId: '111' })).status).toBe(200);
  });

  test('a TikTok error code is surfaced and not treated as data', async () => {
    await connect();
    await request(app()).post('/api/tt/select').send({ accountId: '111' });
    global.fetch = jest.fn(async () => json({}, true, 40105));
    const r = await request(app()).get('/api/tt/campaigns');
    expect(r.status).toBe(502);
    expect(r.body.error).toContain('TikTok error');
  });

  test('campaign report and credit-on-answer advice', async () => {
    await connect();
    await request(app()).post('/api/tt/select').send({ accountId: '111' });
    global.fetch = jest.fn(async () => json({ list: [{ dimensions: { campaign_id: '7' }, metrics: { campaign_name: 'Reels', spend: '30.00', clicks: '60', impressions: '1500', conversion: '3' } }] }));
    const r = await request(app()).get('/api/tt/campaigns?days=7');
    expect(r.body.campaigns[0]).toMatchObject({ id: '7', name: 'Reels', spend: 30, cpc: 0.5, ctr: 4, conversions: 3 });
    mockCreate.mockRejectedValueOnce(new Error('down'));
    expect((await request(app()).post('/api/tt/suggest').send({})).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ summary: 's', actions: [{ campaign: 'Reels', action: 'Test new creative', reason: 'Low CTR' }] }) } }] });
    expect((await request(app()).post('/api/tt/suggest').send({})).body.actions).toHaveLength(1);
    expect(deduct).toHaveBeenCalledTimes(1);
  });
});