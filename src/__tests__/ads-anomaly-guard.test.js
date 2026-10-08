const express = require('express');
const request = require('supertest');

jest.mock('../core/googleAds', () => ({ getConnection: jest.fn(), accessToken: jest.fn(async () => 't'), campaignReport: jest.fn() }));
jest.mock('../core/metaAds', () => ({ getConnection: jest.fn(), accessToken: jest.fn(() => 't'), campaignReport: jest.fn() }));
jest.mock('../core/tiktokAds', () => ({ getConnection: jest.fn(), accessToken: jest.fn(() => 't'), campaignReport: jest.fn() }));
const google = require('../core/googleAds');
const meta = require('../core/metaAds');
const tiktok = require('../core/tiktokAds');
const router = require('../tools/ads-anomaly-guard/router');

const row = (id, o = {}) => ({ id, name: 'C' + id, status: 'ENABLED', spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionValue: 0, ...o });
function app() {
  const a = express();
  a.use((req, _res, next) => { req.session = { shop: 'ag-demo.myshopify.com', shopifyToken: 'tok' }; next(); });
  a.use('/api/ag', router);
  return a;
}
beforeEach(() => { [google, meta, tiktok].forEach((m) => { m.getConnection.mockReset(); m.campaignReport.mockReset(); }); });

describe('ads anomaly rules', () => {
  const { _analyse: analyse } = router;
  test('flags a spend spike and wasted spend with no conversions', () => {
    // month 230 spend: 100 recent + 130 earlier = 40/week baseline? (130 / 3.29)
    const month = [row(1, { spend: 230, conversions: 20, conversionValue: 800, clicks: 400 })];
    const recent = [row(1, { spend: 100, conversions: 0, conversionValue: 0, clicks: 150 })];
    const codes = analyse(recent, month)[0].issues.map((i) => i.code);
    expect(codes).toEqual(expect.arrayContaining(['spend_spike', 'no_conversions']));
  });

  test('flags a falling return and a traffic drop', () => {
    const month = [row(2, { spend: 330, conversions: 40, conversionValue: 1320, clicks: 600 }), row(3, { spend: 300, conversions: 30, conversionValue: 900, clicks: 500 })];
    const recent = [row(2, { spend: 50, conversions: 2, conversionValue: 50, clicks: 100 }), row(3, { spend: 70, conversions: 8, conversionValue: 220, clicks: 10 })];
    const out = analyse(recent, month);
    expect(out.find((a) => a.campaignId === 2).issues.map((i) => i.code)).toContain('roas_drop');
    expect(out.find((a) => a.campaignId === 3).issues.map((i) => i.code)).toContain('traffic_drop');
  });

  test('a steady campaign and a new or tiny one raise nothing', () => {
    const month = [row(4, { spend: 330, conversions: 33, conversionValue: 990, clicks: 330 }), row(5, { spend: 3, clicks: 5 })];
    const recent = [row(4, { spend: 70, conversions: 7, conversionValue: 210, clicks: 70 }), row(5, { spend: 3, clicks: 5 }), row(6, { spend: 500 })];
    expect(analyse(recent, month)).toEqual([]);
  });
});

describe('ads anomaly check route', () => {
  test('reports each platform state and survives one failing', async () => {
    google.getConnection.mockReturnValue({ customerId: '1' });
    google.campaignReport.mockImplementation(async (_t, _c, _l, days) => (days === 7 ? [row(1, { spend: 100 })] : [row(1, { spend: 130, conversions: 10, conversionValue: 400 })]));
    meta.getConnection.mockReturnValue({});
    tiktok.getConnection.mockReturnValue({ accountId: '9' });
    tiktok.campaignReport.mockRejectedValue(new Error('TikTok down'));
    const r = await request(app()).get('/api/ag/check');
    const by = Object.fromEntries(r.body.platforms.map((p) => [p.id, p]));
    expect(by.google.state).toBe('ok');
    expect(by.google.alerts[0].issues.length).toBeGreaterThan(0);
    expect(by.meta.state).toBe('no_account');
    expect(by.tiktok).toMatchObject({ state: 'error', error: 'TikTok down' });
  });

  test('nothing connected gives clear states and no alerts', async () => {
    const r = await request(app()).get('/api/ag/check');
    expect(r.body.platforms.every((p) => p.state === 'not_connected' && p.alerts.length === 0)).toBe(true);
  });
});