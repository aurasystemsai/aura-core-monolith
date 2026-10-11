const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aff-'));
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok' : null) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/aff', (req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; next(); }, require('../tools/affiliate-partner-management/router'));
  return a;
};
const orders = (...amounts) => ({ orders: { pageInfo: { hasNextPage: false }, nodes: amounts.map((a) => ({ cancelledAt: a < 0 ? '2026-01-01' : null, currentSubtotalPriceSet: { shopMoney: { amount: String(Math.abs(a)), currencyCode: 'GBP' } } })) } });
const good = { name: 'Jo Blogs', email: 'jo@example.com', code: 'jo10', discount: 10, commission: 15 };

beforeEach(() => {
  mockGql.mockReset();
  for (const f of fs.readdirSync(process.env.AURA_DATA_DIR)) fs.unlinkSync(path.join(process.env.AURA_DATA_DIR, f));
  mockGql.mockImplementation(async (s, t, q) => {
    if (/discountCodeBasicCreate/.test(q)) return { discountCodeBasicCreate: { codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/1' }, userErrors: [] } };
    if (/discountCodeDeactivate/.test(q)) return { discountCodeDeactivate: { userErrors: [] } };
    return orders(100, 50, -999);
  });
});

test('creates a real discount code and works out sales and commission from orders, ignoring cancelled ones', async () => {
  const r = await request(app()).post('/api/aff/partners').send(good);
  expect(r.status).toBe(200);
  expect(r.body.partner.code).toBe('JO10');
  expect(r.body.partner.orders).toBe(2);
  expect(r.body.partner.sales).toBe(150);
  expect(r.body.partner.earned).toBe(22.5);
  const create = mockGql.mock.calls.find((c) => /discountCodeBasicCreate/.test(c[2]));
  expect(create[3].i.customerGets.value.percentage).toBe(0.1);
  const list = await request(app()).get('/api/aff/partners');
  expect(list.body.totals).toMatchObject({ orders: 2, sales: 150, earned: 22.5, owed: 22.5 });
});

test('validates input and refuses duplicate codes', async () => {
  for (const o of [{ name: '' }, { code: 'a' }, { discount: 0 }, { commission: 95 }, { email: 'nope' }]) {
    expect((await request(app()).post('/api/aff/partners').send({ ...good, ...o })).status).toBe(400);
  }
  expect(mockGql).not.toHaveBeenCalled();
  await request(app()).post('/api/aff/partners').send(good);
  expect((await request(app()).post('/api/aff/partners').send({ ...good, name: 'Other' })).status).toBe(400);
});

test('shows Shopify errors, and does not save the partner', async () => {
  mockGql.mockResolvedValueOnce({ discountCodeBasicCreate: { codeDiscountNode: null, userErrors: [{ message: 'Code must be unique' }] } });
  const r = await request(app()).post('/api/aff/partners').send(good);
  expect(r.status).toBe(422);
  expect((await request(app()).get('/api/aff/partners')).body.partners).toHaveLength(0);
});

test('payouts cannot exceed what is owed, and reduce it', async () => {
  const id = (await request(app()).post('/api/aff/partners').send(good)).body.partner.id;
  expect((await request(app()).post(`/api/aff/partners/${id}/payout`).send({ amount: 30 })).status).toBe(400);
  const ok = await request(app()).post(`/api/aff/partners/${id}/payout`).send({ amount: 10 });
  expect(ok.body.partner.owed).toBe(12.5);
  expect(ok.body.partner.paid).toBe(10);
});

test('stop switches the code off, remove deletes the partner', async () => {
  const id = (await request(app()).post('/api/aff/partners').send(good)).body.partner.id;
  const s = await request(app()).post(`/api/aff/partners/${id}/stop`);
  expect(s.body.partner.active).toBe(false);
  expect(mockGql.mock.calls.some((c) => /discountCodeDeactivate/.test(c[2]))).toBe(true);
  expect((await request(app()).delete(`/api/aff/partners/${id}`)).body.ok).toBe(true);
  expect((await request(app()).delete(`/api/aff/partners/${id}`)).status).toBe(404);
});
