const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pop-'));
let mockInstalled;
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (mockInstalled.includes(s) ? 'tok' : null) }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

let SHOP; let n = 0;
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use('/storefront', require('../tools/popups/public'));
  a.use('/api/pop', (req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); }, require('../tools/popups/router'));
  return a;
}
const mk = (over = {}) => request(app()).post('/api/pop/save').send({ name: 'Welcome', type: 'email', headline: 'Join us', body: 'Get news', active: true, ...over });
beforeEach(() => {
  SHOP = 'pop-demo-' + Date.now() + '-' + (n++) + '.myshopify.com';
  mockInstalled = [SHOP];
  deduct.mockClear(); mockCreate.mockReset(); mockGql.mockReset();
});

describe('popups', () => {
  test('saves a popup, cleans fields and drops an unsafe discount code', async () => {
    const r = await mk({ headline: 'Hi\u0000there', discountCode: 'bad code!', delaySeconds: 999, trigger: 'nope' });
    expect(r.body.popup).toMatchObject({ headline: 'Hi there', discountCode: '', delaySeconds: 120, trigger: 'delay' });
    expect((await mk({ name: '' })).status).toBe(400);
  });
  test('storefront only gets active popups and no private fields', async () => {
    await mk({ discountCode: 'WELCOME10' });
    await mk({ name: 'Off', active: false });
    const r = await request(app()).get('/storefront/popups').query({ shop: SHOP });
    expect(r.body.popups).toHaveLength(1);
    expect(r.body.popups[0]).toMatchObject({ discountCode: 'WELCOME10' });
    expect(r.body.popups[0]).not.toHaveProperty('signups');
    expect((await request(app()).get('/storefront/popups').query({ shop: 'evil.myshopify.com' })).body.popups).toEqual([]);
    expect((await request(app()).get('/storefront/popups').query({ shop: 'a.example.com' })).body.popups).toEqual([]);
  });
  test('signup stores a lead once, counts it and returns the code', async () => {
    const id = (await mk({ discountCode: 'WELCOME10' })).body.popup.id;
    const send = (email, extra = {}) => request(app()).post('/storefront/subscribe').send({ shop: SHOP, popupId: id, email, ...extra });
    expect((await send('bad')).status).toBe(400);
    expect((await send('A@b.co')).body).toMatchObject({ ok: true, discountCode: 'WELCOME10' });
    await send('a@b.co');
    await send('bot@b.co', { website: 'x' });
    const leads = (await request(app()).get('/api/pop/leads')).body.leads;
    expect(leads.map((l) => l.email)).toEqual(['a@b.co']);
    expect((await request(app()).get('/api/pop/popups')).body.popups[0].signups).toBe(1);
  });
  test('signup is refused for an unknown shop, a paused popup or an announcement', async () => {
    const id = (await mk({ active: false })).body.popup.id;
    const post = (b) => request(app()).post('/storefront/subscribe').send({ popupId: id, email: 'a@b.co', ...b });
    expect((await post({ shop: SHOP })).status).toBe(404);
    expect((await post({ shop: 'nobody.myshopify.com' })).status).toBe(400);
    const ann = (await mk({ type: 'announcement' })).body.popup.id;
    expect((await request(app()).post('/storefront/subscribe').send({ shop: SHOP, popupId: ann, email: 'a@b.co' })).status).toBe(404);
  });
  test('toggle, delete popup and delete lead', async () => {
    const id = (await mk()).body.popup.id;
    expect((await request(app()).post('/api/pop/toggle').send({ id })).body.popup.active).toBe(false);
    await request(app()).post('/storefront/subscribe').send({ shop: SHOP, popupId: id, email: 'a@b.co' });
    await request(app()).post('/api/pop/toggle').send({ id });
    await request(app()).post('/storefront/subscribe').send({ shop: SHOP, popupId: id, email: 'a@b.co' });
    const lead = (await request(app()).get('/api/pop/leads')).body.leads[0];
    expect((await request(app()).delete('/api/pop/leads/' + lead.id)).body.ok).toBe(true);
    expect((await request(app()).delete('/api/pop/popups/' + id)).body.ok).toBe(true);
    expect((await request(app()).delete('/api/pop/popups/' + id)).status).toBe(404);
  });
  test('AI copy charges only when AI answers', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ headline: 'Join', body: 'News', button: 'Go' }) } }] });
    expect((await request(app()).post('/api/pop/ai-write').send({})).body).toMatchObject({ ok: true, headline: 'Join' });
    expect(deduct).toHaveBeenCalledTimes(1);
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });
    expect((await request(app()).post('/api/pop/ai-write').send({})).status).toBe(502);
    mockCreate.mockRejectedValue(new Error('x'));
    expect((await request(app()).post('/api/pop/ai-write').send({})).status).toBe(502);
    expect(deduct).toHaveBeenCalledTimes(1);
  });
  test('AI copy that promises an offer nobody gave is retried, then refused without charge', async () => {
    const ans = (headline) => ({ choices: [{ message: { content: JSON.stringify({ headline, body: 'Join our list', button: 'Join' }) } }] });
    mockCreate.mockResolvedValueOnce(ans('Get exclusive deals')).mockResolvedValueOnce(ans('Join our list'));
    expect((await request(app()).post('/api/pop/ai-write').send({})).body.headline).toBe('Join our list');
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(deduct).toHaveBeenCalledTimes(1);
    mockCreate.mockReset(); deduct.mockClear();
    mockCreate.mockResolvedValue(ans('Save 20% today'));
    expect((await request(app()).post('/api/pop/ai-write').send({})).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockReset(); mockCreate.mockResolvedValue(ans('Save 20% today'));
    expect((await request(app()).post('/api/pop/ai-write').send({ offer: 'Save 20% today' })).body.ok).toBe(true);
  });  test('serves the storefront script and back-in-stock signup', async () => {
    const js = await request(app()).get('/storefront/popup.js');
    expect(js.headers['content-type']).toMatch(/javascript/);
    expect(js.text).not.toMatch(/innerHTML/);
    expect(js.headers['access-control-allow-origin']).toBe('*');
    mockGql.mockResolvedValue({ nodes: [{ id: 'gid://shopify/ProductVariant/5', title: 'Default Title', inventoryQuantity: 0, availableForSale: false, product: { title: 'Mug', handle: 'm', onlineStoreUrl: null, status: 'ACTIVE' } }] });
    const r = await request(app()).post('/storefront/back-in-stock').send({ shop: SHOP, variantId: '5', email: 'q@w.co', consent: true });
    expect(r.body.ok).toBe(true);
    expect((await request(app()).post('/storefront/back-in-stock').send({ shop: SHOP, variantId: '5', email: 'q@w.co' })).status).toBe(400);
  });
});