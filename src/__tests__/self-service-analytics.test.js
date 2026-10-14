const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: (shop) => (shop === 'a.myshopify.com' ? 'tok' : null) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...args) => mockGql(...args) }));

const app = () => {
  const server = express();
  server.use(express.json());
  server.use('/api/reports', (req, _res, next) => {
    req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' };
    next();
  }, require('../tools/self-service-analytics/router'));
  return server;
};

const ordersPage = (nodes, hasNextPage = false, endCursor = null) => ({
  orders: { nodes, pageInfo: { hasNextPage, endCursor } },
});
const order = (id, date, amount, opts = {}) => ({
  id,
  name: `#${id}`,
  createdAt: `${date}T12:00:00Z`,
  cancelledAt: opts.cancelled ? `${date}T13:00:00Z` : null,
  displayFinancialStatus: opts.status || 'PAID',
  customer: opts.customer === false ? null : { id: `customer-${opts.customer || id}` },
  currentSubtotalPriceSet: { shopMoney: { amount: String(amount), currencyCode: 'GBP' } },
});

beforeEach(() => {
  mockGql.mockReset();
  mockGql.mockResolvedValue(ordersPage([
    order('1', '2026-10-01', 20),
    order('2', '2026-10-01', 30, { status: 'PENDING', customer: '2' }),
    order('3', '2026-10-02', 99, { cancelled: true }),
  ]));
});

test('reports real order sales, excludes cancelled orders and aggregates daily, status and product data', async () => {
  const r = await request(app()).get('/api/reports/report?start=2026-10-01&end=2026-10-03');
  expect(r.status).toBe(200);
  expect(r.body.report.summary).toEqual({
    orders: 2,
    cancelledOrders: 1,
    netSubtotal: 50,
    averageOrderValue: 25,
    purchasingCustomers: 2,
    currency: 'GBP',
  });
  expect(r.body.report.daily).toEqual([
    { date: '2026-10-01', orders: 2, sales: 50 },
    { date: '2026-10-02', orders: 0, sales: 0 },
    { date: '2026-10-03', orders: 0, sales: 0 },
  ]);
  expect(r.body.report.financialStatuses).toEqual([{ status: 'PAID', orders: 1 }, { status: 'PENDING', orders: 1 }]);
  expect(mockGql.mock.calls[0][3].query).toBe('created_at:>=2026-10-01 created_at:<2026-10-04');
});

test('paginates through Shopify orders and flags reports that exceed the page cap', async () => {
  mockGql
    .mockResolvedValueOnce(ordersPage([order('1', '2026-10-01', 10)], true, 'cursor-1'))
    .mockResolvedValueOnce(ordersPage([order('2', '2026-10-02', 15)], false, 'cursor-2'));
  const r = await request(app()).get('/api/reports/report?start=2026-10-01&end=2026-10-02');
  expect(r.body.report.summary.netSubtotal).toBe(25);
  expect(r.body.report.dataQuality).toEqual({ returnedOrders: 2, truncated: false });
  expect(mockGql.mock.calls[1][3].after).toBe('cursor-1');

  mockGql.mockReset();
  mockGql.mockResolvedValue(ordersPage([], true, 'still-more'));
  const capped = await request(app()).get('/api/reports/report?start=2026-10-01&end=2026-10-02');
  expect(capped.body.report.dataQuality.truncated).toBe(true);
});

test('validates date bounds and exports the report as CSV', async () => {
  expect((await request(app()).get('/api/reports/report?start=2026-02-30&end=2026-03-01')).status).toBe(400);
  expect((await request(app()).get('/api/reports/report?start=2026-10-02&end=2026-10-01')).status).toBe(400);
  expect((await request(app()).get('/api/reports/report?start=2026-07-01&end=2026-10-01')).status).toBe(400);

  mockGql.mockResolvedValue(ordersPage([order('1', '2026-10-01', 20)]));
  const csv = await request(app()).get('/api/reports/export.csv?start=2026-10-01&end=2026-10-01');
  expect(csv.status).toBe(200);
  expect(csv.headers['content-type']).toContain('text/csv');
  expect(csv.text).toContain('"daily","2026-10-01","1","20","GBP"');
  expect(csv.text).toContain('"financial_status","","1","","GBP","PAID"');
});

test('returns a clear error if order data access is denied', async () => {
  mockGql.mockRejectedValue(new Error('Access denied for orders field'));
  const r = await request(app()).get('/api/reports/report?start=2026-10-01&end=2026-10-01');
  expect(r.status).toBe(403);
  expect(r.body).toMatchObject({ ok: false, needsScopes: true });
});
