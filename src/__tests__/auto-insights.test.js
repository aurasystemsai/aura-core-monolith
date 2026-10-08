const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockState = { denied: false };
const mockOrder = (days, name, amt, items) => ({ name, createdAt: new Date(Date.now() - days * 86400000).toISOString(), totalPriceSet: { shopMoney: { amount: amt, currencyCode: 'GBP' } }, lineItems: { nodes: items.map(([title, q, a]) => ({ title, quantity: q, originalTotalSet: { shopMoney: { amount: a } } })) } });
jest.mock('../core/seoStoreData', () => ({
  gql: async () => {
    if (mockState.denied) throw new Error('Access denied for orders field.');
    return { orders: { pageInfo: { hasNextPage: false }, nodes: [
      mockOrder(1, '#1', '100.00', [['Mug', 2, '40.00'], ['=HYPERLINK("x")', 1, '60.00']]),
      mockOrder(5, '#2', '50.00', [['Mug', 1, '20.00']]),
      mockOrder(40, '#3', '75.00', [['Mug', 3, '75.00']]),
    ] } };
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: 'Sales are up.' } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
jest.mock('../core/mailer', () => ({ isEmail: (e) => /@/.test(e), esc: (s) => s, sendEmail: async () => ({ sent: false, dryRun: true }) }));

const RUN = Date.now();
function makeApp() {
  const router = require('../tools/auto-insights/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `rep-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/auto-insights', router);
  return app;
}
const B = '/api/auto-insights';

describe('auto-insights (Reports & Insights)', () => {
  it('summarises this period against the previous one from real orders', async () => {
    mockState.denied = false;
    const r = (await request(makeApp()).get(B + '/summary?days=30')).body;
    expect(r).toMatchObject({ orders: 2, revenue: 150, aov: 75, units: 4, previous: { orders: 1, revenue: 75 }, change: { revenue: 100, orders: 100 } });
    expect(r.topProducts.map((p) => [p.title, p.units, p.revenue])).toEqual([['Mug', 3, 60], ['=HYPERLINK("x")', 1, 60]]);
    expect(r.daily).toHaveLength(30);
  });

  it('exports CSV with formula-looking cells neutralised', async () => {
    const res = await request(makeApp()).get(B + '/export?type=products&days=30');
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain("\"'=HYPERLINK(\"\"x\"\")\"".replace(/^"|"$/g, '"'));
    expect(res.text).not.toMatch(/^=/m);
  });

  it('says so when order access is denied, and validates email and AI', async () => {
    const app = makeApp();
    expect((await request(app).post(B + '/email').send({ to: 'bad' })).status).toBe(400);
    const ok = (await request(app).post(B + '/email').send({ to: 'a@b.com' })).body;
    expect(ok).toMatchObject({ ok: true, sent: false, dryRun: true });
    expect((await request(app).post(B + '/insights').send({})).body.insight).toBe('Sales are up.');
    mockState.denied = true;
    expect((await request(app).get(B + '/summary')).body.unavailable).toBe(true);
    expect((await request(app).post(B + '/insights').send({})).status).toBe(403);
  });
});
describe('forecast', () => {
  const mk = (daysAgo, amt) => ({ name: '#', createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(), totalPriceSet: { shopMoney: { amount: String(amt), currencyCode: 'GBP' } }, lineItems: { nodes: [] } });
  const { _forecast } = require('../tools/auto-insights/router');

  it('refuses to forecast with too few order days', () => {
    expect(_forecast([mk(1, 10), mk(2, 10)])).toMatchObject({ enough: false, daysWithOrders: 2 });
  });

  it('projects a rising trend upward with a range around it', () => {
    const orders = []; for (let d = 89; d >= 1; d--) orders.push(mk(d, 100 + (90 - d) * 2));
    const f = _forecast(orders);
    expect(f.enough).toBe(true);
    expect(f.trend).toBe('up');
    expect(f.next30).toBeGreaterThan(f.last30);
    expect(f.low).toBeLessThanOrEqual(f.next30);
    expect(f.high).toBeGreaterThanOrEqual(f.next30);
  });

  it('calls a steady shop flat', () => {
    const orders = []; for (let d = 89; d >= 1; d--) orders.push(mk(d, 100));
    expect(_forecast(orders).trend).toBe('flat');
  });
});
