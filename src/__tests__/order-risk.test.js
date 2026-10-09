const express = require('express');
const request = require('supertest');

const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const router = require('../tools/order-risk/router');

function app() {
  const a = express();
  a.use('/api/or', (req, _res, next) => { req.session = { shop: 'or-demo.myshopify.com', shopifyToken: 'tok' }; next(); }, router);
  return a;
}
const m = (x) => ({ shopMoney: { amount: String(x) } });
const ord = (over = {}) => ({ id: 'o' + Math.random(), name: '#1', email: 'a@b.com', phone: null, processedAt: '2026-03-01T10:00:00Z', displayFinancialStatus: 'PAID', displayFulfillmentStatus: 'UNFULFILLED', totalPriceSet: m(50), totalDiscountsSet: m(0), subtotalPriceSet: m(50), billingAddress: null, shippingAddress: null, risk: { recommendation: 'NONE', assessments: [] }, customer: { numberOfOrders: '3' }, ...over });

beforeEach(() => mockGql.mockReset());

describe('order-risk', () => {
  test('an ordinary order is not flagged', () => {
    const [r] = router._analyse([ord()]);
    expect(r).toMatchObject({ score: 0, level: 'ok', reasons: [] });
  });
  test("Shopify's own high rating makes it high risk", () => {
    const [r] = router._analyse([ord({ risk: { recommendation: 'CANCEL', assessments: [{ riskLevel: 'HIGH', facts: [{ description: 'Card was declined before', sentiment: 'NEGATIVE' }] }] } })]);
    expect(r.level).toBe('high');
    expect(r.reasons).toEqual(expect.arrayContaining(['Shopify rates this order high risk.', 'Card was declined before']));
  });
  test('first order far above average, with a country mismatch, is flagged for review', () => {
    const rows = router._analyse([ord({ email: 'x@y.com' }), ord({ email: 'p@q.com' }), ord({ email: 'k@l.com' }), ord({ email: 'u@v.com' }), ord({ email: 'g@h.com' }), ord({ email: 'n@w.com', totalPriceSet: m(1000), subtotalPriceSet: m(1000), customer: { numberOfOrders: '1' }, billingAddress: { countryCodeV2: 'GB' }, shippingAddress: { countryCodeV2: 'NG' } })]);
    const big = rows[0];
    expect(big.level).toBe('review');
    expect(big.reasons.join(' ')).toMatch(/average order/);
    expect(big.reasons.join(' ')).toMatch(/GB.*NG/);
  });
  test('repeat orders from one email within a day are flagged', () => {
    const t = ['2026-03-01T10:00:00Z', '2026-03-01T11:00:00Z', '2026-03-01T12:00:00Z'];
    const rows = router._analyse(t.map((p) => ord({ email: 'r@r.com', processedAt: p })));
    expect(rows[0].reasons).toContain('Three or more orders from this email in 24 hours.');
  });
  test('route returns only flagged orders with counts', async () => {
    mockGql.mockResolvedValue({ shop: { currencyCode: 'GBP' }, orders: { pageInfo: { hasNextPage: false }, nodes: [ord(), ord({ risk: { recommendation: 'INVESTIGATE', assessments: [] } })] } });
    const r = await request(app()).get('/api/or/orders?days=7');
    expect(r.body).toMatchObject({ ok: true, total: 2, high: 0, review: 1, days: 7 });
    expect(r.body.orders).toHaveLength(1);
  });
  test('missing permission is reported as needsScopes', async () => {
    mockGql.mockRejectedValue(new Error('Access denied for risk field. Required access: read_orders'));
    const r = await request(app()).get('/api/or/orders');
    expect(r.status).toBe(403);
    expect(r.body.needsScopes).toBe(true);
  });
});
