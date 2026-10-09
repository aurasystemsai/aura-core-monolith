const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pa-'));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const router = require('../tools/profit-analytics/router');

let SHOP; let n = 0;
function app() {
  const a = express();
  a.use('/api/pa', (req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; next(); }, router);
  return a;
}
const m = (x) => ({ shopMoney: { amount: String(x) } });
const line = (qty, rev, cost, pid = 'p1') => ({ quantity: qty, name: 'Item', discountedTotalSet: m(rev), variant: { id: 'v' + pid, product: { id: pid, title: 'Prod ' + pid }, inventoryItem: { unitCost: cost == null ? null : { amount: String(cost) } } } });
const order = (total, tax, refund, lines) => ({ id: 'o', totalPriceSet: m(total), totalTaxSet: m(tax), totalRefundedSet: m(refund), lineItems: { nodes: lines } });
const settings = (over = {}) => ({ feePercent: 0, feeFixed: 0, shippingCostPerOrder: 0, adSpend: [], ...over });

beforeEach(() => { SHOP = 'pa-demo-' + Date.now() + '-' + (n++) + '.myshopify.com'; mockGql.mockReset(); });

describe('profit-analytics', () => {
  test('profit = sales minus tax, refunds, product cost, fees, shipping and ads', () => {
    const o = [order(120, 20, 10, [line(2, 100, 30)])];
    const from = Date.UTC(2026, 0, 1); const to = Date.UTC(2026, 1, 1);
    const r = router._compute(o, settings({ feePercent: 10, feeFixed: 1, shippingCostPerOrder: 5, adSpend: [{ month: '2026-01', amount: 20 }] }), from, to);
    // net 120-20-10=90; cost 60; fees 12+1=13; shipping 5; ads 20 => 90-60-13-5-20 = -8
    expect(r).toMatchObject({ netRevenue: 90, productCost: 60, fees: 13, shippingCost: 5, adSpend: 20, profit: -8, costCoverage: 100 });
  });
  test('items with no cost price are flagged, not treated as free', () => {
    const r = router._compute([order(100, 0, 0, [line(1, 60, 20, 'a'), line(1, 40, null, 'b')])], settings(), 0, 1);
    expect(r.costCoverage).toBe(60);
    expect(r.unitsWithoutCost).toBe(1);
    const b = r.products.find((p) => p.title === 'Prod b');
    expect(b).toMatchObject({ cost: null, profit: null, margin: null });
  });
  test('ad spend is shared by the days inside the window', () => {
    const jan = [{ month: '2026-01', amount: 310 }];
    expect(router._adSpendFor(jan, Date.UTC(2026, 0, 1), Date.UTC(2026, 0, 11))).toBeCloseTo(100);
    expect(router._adSpendFor(jan, Date.UTC(2026, 2, 1), Date.UTC(2026, 3, 1))).toBe(0);
  });
  test('no orders gives zero and a null margin', () => {
    const r = router._compute([], settings(), 0, 1);
    expect(r).toMatchObject({ orders: 0, profit: 0, margin: null, costCoverage: 0 });
  });
  test('settings are cleaned: bad months, duplicates, negatives and huge numbers', async () => {
    const r = await request(app()).post('/api/pa/settings').send({ feePercent: -5, feeFixed: 'x', shippingCostPerOrder: 5000000, adSpend: [{ month: '2026-13', amount: 5 }, { month: '2026-02', amount: 10 }, { month: '2026-02', amount: 99 }] });
    expect(r.body.settings).toEqual({ feePercent: 0, feeFixed: 0, shippingCostPerOrder: 1000, adSpend: [{ month: '2026-02', amount: 10 }] });
    const g = await request(app()).get('/api/pa/settings');
    expect(g.body.settings.adSpend).toHaveLength(1);
  });
  test('report reads orders from Shopify and applies saved settings', async () => {
    await request(app()).post('/api/pa/settings').send({ feePercent: 0, feeFixed: 0, shippingCostPerOrder: 2 });
    mockGql.mockResolvedValue({ shop: { currencyCode: 'GBP' }, orders: { pageInfo: { hasNextPage: false }, nodes: [order(50, 0, 0, [line(1, 50, 10)])] } });
    const r = await request(app()).get('/api/pa/report?days=30');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ currency: 'GBP', orders: 1, profit: 38, days: 30 });
  });
  test('missing Shopify permission is reported as needsScopes', async () => {
    mockGql.mockRejectedValue(new Error('Access denied for orders field. Required access: read_orders'));
    const r = await request(app()).get('/api/pa/report');
    expect(r.status).toBe(403);
    expect(r.body.needsScopes).toBe(true);
  });
});
