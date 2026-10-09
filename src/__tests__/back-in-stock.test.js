const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'bis-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const mockSend = jest.fn();
jest.mock('../core/mailer', () => ({ isConfigured: () => true, isEmail: (e) => /^\S+@\S+\.\S+$/.test(e), esc: (s) => String(s), sendEmail: (...a) => mockSend(...a) }));
jest.mock('../core/messaging', () => ({ reserve: () => true, remaining: () => 10, LIMITS: {} }));

let SHOP; let n = 0;
const A = 'gid://shopify/ProductVariant/1';
const B = 'gid://shopify/ProductVariant/2';
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; next(); });
  a.use('/api/bis', require('../tools/back-in-stock/router'));
  return a;
}
const variant = (id, qty, extra = {}) => ({ id, title: 'Default Title', inventoryQuantity: qty, availableForSale: qty > 0, product: { title: 'Mug ' + id.slice(-1), handle: 'mug', onlineStoreUrl: null, status: 'ACTIVE' }, ...extra });
let stock;
beforeEach(() => {
  SHOP = 'bis-demo-' + Date.now() + '-' + (n++) + '.myshopify.com';
  mockSend.mockReset(); mockGql.mockReset();
  mockSend.mockResolvedValue({ sent: true });
  stock = { [A]: variant(A, 0), [B]: variant(B, 0) };
  mockGql.mockImplementation(async (_s, _t, _q, v) => ({ nodes: (v.ids || []).map((i) => stock[i] || null) }));
});
const add = (email, variantId, consent = true) => request(app()).post('/api/bis/add').send({ email, variantId, consent });

describe('back-in-stock', () => {
  test('rejects bad email, missing consent, in-stock items and duplicates', async () => {
    expect((await add('nope', A)).status).toBe(400);
    expect((await add('a@b.co', A, false)).status).toBe(400);
    expect((await add('a@b.co', 'x')).status).toBe(400);
    stock[B] = variant(B, 5);
    expect((await add('a@b.co', B)).status).toBe(409);
    expect((await add('a@b.co', A)).body.ok).toBe(true);
    expect((await add('A@b.co', A)).status).toBe(409);
  });
  test('sends only to shoppers whose item is back, once', async () => {
    await add('c@d.co', A); await add('e@f.co', B);
    stock[A] = variant(A, 3);
    const list = (await request(app()).get('/api/bis/subscribers')).body;
    expect(list.readyToSend).toBe(1);
    expect((await request(app()).post('/api/bis/send').send({})).status).toBe(400);
    const r = await request(app()).post('/api/bis/send').send({ confirm: true });
    expect(r.body).toMatchObject({ sent: 1, failed: 0 });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].to).toBe('c@d.co');
    const again = await request(app()).post('/api/bis/send').send({ confirm: true });
    expect(again.body.sent).toBe(0);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
  test('a failed send stays waiting so it can be retried', async () => {
    await add('g@h.co', A);
    stock[A] = variant(A, 2);
    mockSend.mockRejectedValue(new Error('mail down'));
    expect((await request(app()).post('/api/bis/send').send({ confirm: true })).body).toMatchObject({ sent: 0, failed: 1 });
    mockSend.mockResolvedValue({ sent: true });
    expect((await request(app()).post('/api/bis/send').send({ confirm: true })).body.sent).toBe(1);
  });
  test('a draft product does not count as back in stock', async () => {
    await add('i@j.co', A);
    stock[A] = variant(A, 4, { product: { title: 'Mug', handle: 'm', onlineStoreUrl: null, status: 'DRAFT' } });
    expect((await request(app()).post('/api/bis/send').send({ confirm: true })).body.sent).toBe(0);
  });
  test('removes a subscriber', async () => {
    const id = (await add('k@l.co', A)).body.subscriber.id;
    expect((await request(app()).delete('/api/bis/subscribers/' + id)).body.ok).toBe(true);
    expect((await request(app()).delete('/api/bis/subscribers/' + id)).status).toBe(404);
  });
});