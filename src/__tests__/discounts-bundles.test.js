const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const SHOP = 'dc-demo-' + Date.now() + '.myshopify.com';
const A = 'gid://shopify/Product/1';
const B = 'gid://shopify/Product/2';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/dc', require('../tools/discounts-bundles/router'));
  return a;
}
const order = (...ids) => ({ subtotalPriceSet: { shopMoney: { amount: '40.00', currencyCode: 'GBP' } }, lineItems: { nodes: ids.map((id) => ({ product: { id, title: 'P' + id.slice(-1) } })) } });
const ai = (obj) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });
let orders, created;

beforeEach(() => {
  deduct.mockClear(); mockCreate.mockReset(); mockGql.mockReset();
  orders = [order(A, B), order(A, B), order(A)]; created = null;
  mockGql.mockImplementation(async (_s, _t, q, v) => {
    if (q.includes('orders(')) return { orders: { nodes: orders } };
    if (q.includes('codeDiscountNodes')) return { codeDiscountNodes: { nodes: [
      { id: 'gid://shopify/DiscountCodeNode/1', codeDiscount: { __typename: 'DiscountCodeBasic', title: 'T', status: 'ACTIVE', summary: '10% off', asyncUsageCount: 2, codes: { nodes: [{ code: 'SAVE10' }] } } },
      { id: 'gid://shopify/DiscountCodeNode/2', codeDiscount: { __typename: 'DiscountCodeFreeShipping', title: 'x', codes: { nodes: [] } } },
    ] } };
    if (q.includes('discountCodeBasicCreate')) { created = { kind: 'basic', i: v.i }; return { discountCodeBasicCreate: { codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/9' }, userErrors: [] } }; }
    if (q.includes('discountCodeBxgyCreate')) { created = { kind: 'bundle', i: v.i }; return { discountCodeBxgyCreate: { codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/9' }, userErrors: [] } }; }
    if (q.includes('discountCodeDelete')) return { discountCodeDelete: { userErrors: [] } };
    throw new Error('unexpected ' + q);
  });
});

describe('discounts-bundles', () => {
  test('lists real codes and hides types it cannot manage', async () => {
    const r = await request(app()).get('/api/dc/list');
    expect(r.body.discounts).toHaveLength(1);
    expect(r.body.discounts[0]).toMatchObject({ code: 'SAVE10', type: 'basic', used: 2 });
  });

  test('insight counts pairs bought together and the average order', async () => {
    const r = await request(app()).get('/api/dc/insight');
    expect(r.body).toMatchObject({ orders: 3, averageOrder: 40, currency: 'GBP' });
    expect(r.body.pairs[0]).toMatchObject({ count: 2 });
  });

  test('suggest refuses with no orders and charges nothing', async () => {
    orders = [];
    const r = await request(app()).post('/api/dc/suggest').send({});
    expect(r.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(deduct).not.toHaveBeenCalled();
  });

  test('suggest charges only on success, clamps percent and drops invented products', async () => {
    mockCreate.mockRejectedValueOnce(new Error('down'));
    expect((await request(app()).post('/api/dc/suggest').send({})).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce(ai({ offers: [
      { kind: 'bundle', title: 'Pair', code: 'pair-10!', percent: 80, days: 999, buyProductId: A, getProductId: B, reason: 'r' },
      { kind: 'bundle', title: 'Fake', code: 'FAKE1', percent: 10, days: 7, buyProductId: A, getProductId: 'gid://shopify/Product/99', reason: 'r' },
    ] }));
    const r = await request(app()).post('/api/dc/suggest').send({ goal: 'x' });
    expect(deduct).toHaveBeenCalledTimes(1);
    expect(r.body.offers[0]).toMatchObject({ kind: 'bundle', code: 'PAIR10', percent: 30, days: 60 });
    expect(r.body.offers[1]).toMatchObject({ kind: 'basic', buyProductId: null });
  });

  test('create validates then builds a percentage code', async () => {
    expect((await request(app()).post('/api/dc/create').send({ code: 'a', percent: 10 })).status).toBe(400);
    expect((await request(app()).post('/api/dc/create').send({ code: 'SAVE', percent: 95 })).status).toBe(400);
    const r = await request(app()).post('/api/dc/create').send({ code: 'save15', percent: 15, days: 7, minSubtotal: 50 });
    expect(r.body).toMatchObject({ ok: true, code: 'SAVE15' });
    expect(created.i.customerGets.value.percentage).toBe(0.15);
    expect(created.i.minimumRequirement.subtotal.greaterThanOrEqualToSubtotal).toBe('50');
  });

  test('create bundle needs two different real product ids', async () => {
    expect((await request(app()).post('/api/dc/create').send({ kind: 'bundle', code: 'PAIR', percent: 10, buyProductId: A, getProductId: A })).status).toBe(400);
    expect((await request(app()).post('/api/dc/create').send({ kind: 'bundle', code: 'PAIR', percent: 10, buyProductId: 'x', getProductId: B })).status).toBe(400);
    const r = await request(app()).post('/api/dc/create').send({ kind: 'bundle', code: 'PAIR', percent: 20, buyProductId: A, getProductId: B });
    expect(r.body.ok).toBe(true);
    expect(created.i.customerGets.value.discountOnQuantity.effect.percentage).toBe(0.2);
    expect(created.i.usesPerOrderLimit).toBe(1);
  });

  test('delete only accepts a real discount id, and Shopify errors are shown', async () => {
    expect((await request(app()).post('/api/dc/delete').send({ id: 'nope' })).status).toBe(400);
    expect((await request(app()).post('/api/dc/delete').send({ id: 'gid://shopify/DiscountCodeNode/1' })).body.ok).toBe(true);
    mockGql.mockImplementationOnce(async () => ({ discountCodeBasicCreate: { codeDiscountNode: null, userErrors: [{ message: 'Code taken' }] } }));
    const r = await request(app()).post('/api/dc/create').send({ code: 'SAVE', percent: 10 });
    expect(r.status).toBe(422);
    expect(r.body.error).toBe('Code taken');
  });

  test('missing permissions give a clear 403', async () => {
    mockGql.mockRejectedValueOnce(new Error('Access denied for codeDiscountNodes field. Required access: `read_discounts`'));
    const r = await request(app()).get('/api/dc/list');
    expect(r.status).toBe(403);
    expect(r.body.needsScopes).toBe(true);
  });
});