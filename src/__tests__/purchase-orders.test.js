const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'po-'));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const mockSend = jest.fn();
let mockMailer = true;
jest.mock('../core/mailer', () => ({ sendEmail: (...a) => mockSend(...a), isConfigured: () => mockMailer, esc: (s) => String(s).replace(/</g, '&lt;'), isEmail: () => true }));
const store = require('../core/shopStore');
const router = require('../tools/inventory-forecasting/router');

let SHOP; let n = 0;
function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/inv', (req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; next(); }, router);
  return a;
}
const V1 = 'gid://shopify/ProductVariant/1'; const V2 = 'gid://shopify/ProductVariant/2';
const line = (id, qty, unitCost = 5) => ({ variantId: id, title: 'Item ' + id.slice(-1), sku: 'S' + id.slice(-1), qty, unitCost });
async function make(lines = [line(V1, 10), line(V2, 4)]) {
  const r = await request(app()).post('/api/inv/pos').send({ supplierId: 'sup1', lines });
  return r;
}
const stockOk = () => mockGql.mockImplementation(async (s, t, q) => {
  if (q.includes('inventoryLevels')) return { productVariant: { inventoryItem: { id: 'gid://shopify/InventoryItem/9', inventoryLevels: { nodes: [{ location: { id: 'gid://shopify/Location/1' } }] } } } };
  if (q.includes('inventoryAdjustQuantities')) return { inventoryAdjustQuantities: { userErrors: [] } };
  if (q.includes('inventoryItemUpdate')) return { inventoryItemUpdate: { userErrors: [] } };
  throw new Error('unexpected ' + q);
});

beforeEach(() => {
  SHOP = 'po-demo-' + Date.now() + '-' + (n++) + '.myshopify.com';
  mockGql.mockReset(); mockSend.mockReset(); mockMailer = true;
  store.write('inventory-suppliers', SHOP, [{ id: 'sup1', name: 'Acme Supply', email: 'orders@acme.test', leadDays: 7 }, { id: 'sup2', name: 'No Email', email: '', leadDays: 7 }]);
});

describe('purchase orders', () => {
  test('creates numbered draft orders with totals', async () => {
    const a = await make(); const b = await make([line(V1, 1, '')]);
    expect(a.body.order).toMatchObject({ number: 'PO-0001', status: 'draft', total: 70, costMissing: false });
    expect(b.body.order).toMatchObject({ number: 'PO-0002', costMissing: true });
  });
  test('rejects unknown supplier, empty, duplicate and bad lines', async () => {
    expect((await request(app()).post('/api/inv/pos').send({ supplierId: 'nope', lines: [line(V1, 1)] })).status).toBe(404);
    expect((await make([])).status).toBe(400);
    expect((await make([line(V1, 1), line(V1, 2)])).status).toBe(400);
    expect((await make([line(V1, 0)])).status).toBe(400);
    expect((await make([line('bad', 1)])).status).toBe(400);
    expect((await make([line(V1, 1, -3)])).status).toBe(400);
  });
  test('emails the supplier and marks the order sent; escapes item names', async () => {
    const o = (await make([{ ...line(V1, 2), title: '<b>Bad</b>' }])).body.order;
    const r = await request(app()).post(`/api/inv/pos/${o.id}/send`);
    expect(r.body.order.status).toBe('sent');
    expect(mockSend.mock.calls[0][0]).toMatchObject({ to: 'orders@acme.test', subject: 'Purchase order PO-0001' });
    expect(mockSend.mock.calls[0][0].html).toContain('&lt;b>Bad');
  });
  test('does not pretend to send when email is off or the supplier has no email', async () => {
    const o = (await make()).body.order;
    mockMailer = false;
    expect((await request(app()).post(`/api/inv/pos/${o.id}/send`)).status).toBe(503);
    mockMailer = true;
    store.write('inventory-suppliers', SHOP, [{ id: 'sup1', name: 'Acme', email: '', leadDays: 7 }]);
    expect((await request(app()).post(`/api/inv/pos/${o.id}/send`)).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
    expect((await request(app()).get('/api/inv/pos')).body.orders[0].status).toBe('draft');
  });
  test('receiving adds stock in Shopify, writes cost, and tracks partial then full', async () => {
    stockOk();
    const o = (await make()).body.order;
    const p = await request(app()).post(`/api/inv/pos/${o.id}/receive`).send({ receipts: [{ variantId: V1, qty: 6 }], updateCost: true });
    expect(p.body.order.status).toBe('partial');
    const adj = mockGql.mock.calls.find((c) => c[2].includes('inventoryAdjustQuantities'));
    expect(adj[3].input).toMatchObject({ reason: 'received', changes: [{ delta: 6, locationId: 'gid://shopify/Location/1' }] });
    expect(mockGql.mock.calls.some((c) => c[2].includes('inventoryItemUpdate') && c[3].input.cost === '5')).toBe(true);
    const f = await request(app()).post(`/api/inv/pos/${o.id}/receive`).send({ receipts: [{ variantId: V1, qty: 4 }, { variantId: V2, qty: 4 }] });
    expect(f.body.order.status).toBe('received');
  });
  test('cannot receive more than ordered', async () => {
    stockOk();
    const o = (await make()).body.order;
    const r = await request(app()).post(`/api/inv/pos/${o.id}/receive`).send({ receipts: [{ variantId: V1, qty: 11 }] });
    expect(r.status).toBe(400);
    expect(mockGql).not.toHaveBeenCalled();
  });
  test('a Shopify failure records nothing for that line and asks for permission when denied', async () => {
    mockGql.mockRejectedValue(new Error('Access denied for inventoryAdjustQuantities. Required access: write_inventory'));
    const o = (await make()).body.order;
    const r = await request(app()).post(`/api/inv/pos/${o.id}/receive`).send({ receipts: [{ variantId: V1, qty: 3 }] });
    expect(r.status).toBe(403);
    expect(r.body.needsScopes).toBe(true);
    expect((await request(app()).get('/api/inv/pos')).body.orders[0].lines[0].received).toBe(0);
  });
  test('a rejected adjustment is not recorded', async () => {
    mockGql.mockImplementation(async (s, t, q) => (q.includes('inventoryLevels')
      ? { productVariant: { inventoryItem: { id: 'i', inventoryLevels: { nodes: [{ location: { id: 'l' } }] } } } }
      : { inventoryAdjustQuantities: { userErrors: [{ message: 'Nope' }] } }));
    const o = (await make()).body.order;
    const r = await request(app()).post(`/api/inv/pos/${o.id}/receive`).send({ receipts: [{ variantId: V1, qty: 3 }] });
    expect(r.status).toBe(422);
    expect((await request(app()).get('/api/inv/pos')).body.orders[0].lines[0].received).toBe(0);
  });
  test('cancel and delete rules', async () => {
    stockOk();
    const a = (await make()).body.order;
    expect((await request(app()).post(`/api/inv/pos/${a.id}/cancel`)).body.order.status).toBe('cancelled');
    expect((await request(app()).post(`/api/inv/pos/${a.id}/receive`).send({ receipts: [{ variantId: V1, qty: 1 }] })).status).toBe(409);
    expect((await request(app()).delete(`/api/inv/pos/${a.id}`)).body.ok).toBe(true);
    const b = (await make()).body.order;
    await request(app()).post(`/api/inv/pos/${b.id}/receive`).send({ receipts: [{ variantId: V1, qty: 1 }] });
    expect((await request(app()).post(`/api/inv/pos/${b.id}/cancel`)).status).toBe(409);
    expect((await request(app()).delete(`/api/inv/pos/${b.id}`)).status).toBe(409);
  });
  test('only drafts can be edited', async () => {
    const o = (await make()).body.order;
    expect((await request(app()).put(`/api/inv/pos/${o.id}`).send({ lines: [line(V1, 99)] })).body.order.lines[0].qty).toBe(99);
    await request(app()).post(`/api/inv/pos/${o.id}/send`);
    expect((await request(app()).put(`/api/inv/pos/${o.id}`).send({ lines: [line(V1, 1)] })).status).toBe(409);
  });
});
