const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockLedger = { allowed: true, balance: 100, cost: 5 };
jest.mock('../core/creditLedger', () => ({ ...jest.requireActual('../core/creditLedger'), checkCredits: jest.fn(async () => mockLedger), deductCredits: jest.fn(async () => ({ ok: true })) }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: jest.fn() }));
jest.mock('../core/mailer', () => ({ ...jest.requireActual('../core/mailer'), sendEmail: jest.fn(async ({ to }) => ({ sent: true, id: 'e1', to })), isConfigured: jest.fn(() => true) }));
jest.mock('../core/sms', () => ({ ...jest.requireActual('../core/sms'), sendSms: jest.fn(async ({ to }) => ({ sent: true, id: 's1', to })), isConfigured: jest.fn(() => true) }));
const { getOpenAIClient } = require('../core/openaiClient');
const mailer = require('../core/mailer');
const sms = require('../core/sms');

const CHECKOUTS = [
  { id: 'gid://shopify/AbandonedCheckout/1', createdAt: '2026-01-01T00:00:00Z', abandonedCheckoutUrl: 'https://a.myshopify.com/cart/c/1', totalPriceSet: { shopMoney: { amount: '20.0', currencyCode: 'GBP' } }, customer: { firstName: 'Sam', email: 'sam@x.com', defaultEmailAddress: { marketingState: 'SUBSCRIBED' } }, lineItems: { nodes: [{ title: 'Mug', quantity: 1 }] } },
  { id: 'gid://shopify/AbandonedCheckout/2', createdAt: '2026-01-01T00:00:00Z', abandonedCheckoutUrl: 'https://a.myshopify.com/cart/c/2', totalPriceSet: null, customer: { firstName: 'No', email: 'no@x.com', defaultEmailAddress: { marketingState: 'NOT_SUBSCRIBED' } }, lineItems: { nodes: [] } },
];
const PRODUCT = { id: 'gid://shopify/Product/1', handle: 'mug', title: 'Mug', descriptionHtml: '<p>x</p>', status: 'ACTIVE', seo: {}, media: { nodes: [] } };

let n = 0;
function app(shop = `shop${++n}-${Date.now()}.myshopify.com`) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = jest.fn(); a.deduct = req.deductCredits; next(); });
  a.use('/api/email', require('../tools/email-automation-builder/router'));
  a.use('/api/winback', require('../tools/abandoned-checkout-winback/router'));
  a.use('/api/sms', require('../tools/sms-whatsapp-marketing/router'));
  return a;
}
const ai = (obj) => ({ chat: { completions: { create: jest.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }] })) } } });

beforeEach(() => {
  process.env.AURA_DATA_DIR = require('os').tmpdir() + '/aura-msg-test-' + Date.now() + Math.random();
  mailer.sendEmail.mockClear(); sms.sendSms.mockClear();
  global.fetch = jest.fn(async (_u, opts) => {
    const { query } = JSON.parse(opts.body);
    const empty = { pageInfo: { hasNextPage: false }, nodes: [] };
    const data = /abandonedCheckouts/.test(query) ? { abandonedCheckouts: { nodes: CHECKOUTS } }
      : /email_marketing_state/.test(query) ? { customers: { nodes: [{ email: 'A@x.com' }, { email: 'a@x.com' }, { email: 'b@x.com' }, { email: 'bad' }] } }
      : /sms_marketing_state/.test(query) ? { customers: { nodes: [{ defaultPhoneNumber: { phoneNumber: '+447960000001' } }, { defaultPhoneNumber: { phoneNumber: '07960' } }, { defaultPhoneNumber: null }] } }
      : /products\(first/.test(query) ? { products: { ...empty, nodes: [PRODUCT] } }
      : /shop \{ name/.test(query) ? { shop: { name: 'Test Shop' } }
      : { pages: empty, collections: empty, articles: empty };
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
});

describe('email campaigns', () => {
  test('generate unwraps invented links and keeps real ones', async () => {
    getOpenAIClient.mockReturnValue(ai({ subject: 'Hi', bodyHtml: '<p><a href="https://a.myshopify.com/products/mug">Mug</a> <a href="https://evil.com">x</a><script>1</script></p>' }));
    const a = app('a.myshopify.com');
    const r = await request(a).post('/api/email/generate').send({ goal: 'launch' });
    expect(r.body.email.bodyHtml).toContain('products/mug');
    expect(r.body.email.bodyHtml).not.toMatch(/evil|script/);
    expect(a.deduct).toHaveBeenCalledTimes(1);
  });

  test('test send validates, tags the subject and is limited per day', async () => {
    const a = app();
    expect((await request(a).post('/api/email/send-test').send({ to: 'nope', subject: 's', bodyHtml: 'b' })).status).toBe(400);
    const r = await request(a).post('/api/email/send-test').send({ to: 'me@x.com', subject: 'Hello', bodyHtml: '<p>b</p>' });
    expect(r.body.sent).toBe(true);
    expect(mailer.sendEmail.mock.calls[0][0].subject).toBe('[TEST] Hello');
    for (let i = 0; i < 19; i++) await request(a).post('/api/email/send-test').send({ to: 'me@x.com', subject: 's', bodyHtml: 'b' });
    expect((await request(a).post('/api/email/send-test').send({ to: 'me@x.com', subject: 's', bodyHtml: 'b' })).status).toBe(429);
  });

  test('campaign needs confirmation and only emails de-duplicated valid subscribers', async () => {
    const a = app();
    expect((await request(a).post('/api/email/send').send({ subject: 's', bodyHtml: 'b' })).status).toBe(400);
    const r = await request(a).post('/api/email/send').send({ subject: 's', bodyHtml: '<p>b</p>', confirm: true });
    expect(r.body.sent).toBe(2);
    expect(mailer.sendEmail.mock.calls.map((c) => c[0].to).sort()).toEqual(['a@x.com', 'b@x.com']);
    expect(mailer.sendEmail.mock.calls[0][0].html).toMatch(/unsubscribe/i);
  });
});

describe('abandoned checkout winback', () => {
  test('lists real checkouts and flags who can be emailed', async () => {
    const r = await request(app()).get('/api/winback/checkouts');
    expect(r.body.checkouts).toHaveLength(2);
    expect(r.body.reachable).toBe(1);
  });

  test('preview strips AI links; send adds the real recovery link', async () => {
    getOpenAIClient.mockReturnValue(ai({ subject: 'Forgot something?', bodyHtml: '<p>Your <a href="https://evil.com">Mug</a></p>' }));
    const a = app();
    const p = await request(a).post('/api/winback/preview').send({ checkoutId: CHECKOUTS[0].id });
    expect(p.body.email.bodyHtml).not.toMatch(/evil|<a/);
    const s = await request(a).post('/api/winback/send').send({ checkoutId: CHECKOUTS[0].id, subject: 's', bodyHtml: p.body.email.bodyHtml, testTo: 'me@x.com' });
    expect(s.body.error).toBeUndefined();
    expect(mailer.sendEmail.mock.calls[0][0].html).toContain('https://a.myshopify.com/cart/c/1');
    expect(mailer.sendEmail.mock.calls[0][0].subject).toMatch(/^\[TEST\]/);
  });

  test('never emails a shopper without consent, confirmation, or twice in 24h', async () => {
    const a = app();
    const send = (id, extra = {}) => request(a).post('/api/winback/send').send({ checkoutId: id, subject: 's', bodyHtml: '<p>b</p>', ...extra });
    expect((await send(CHECKOUTS[0].id)).status).toBe(400);
    expect((await send(CHECKOUTS[1].id, { confirm: true })).status).toBe(422);
    expect((await send(CHECKOUTS[0].id, { confirm: true })).body.mode).toBe('customer');
    expect((await send(CHECKOUTS[0].id, { confirm: true })).status).toBe(429);
    expect(mailer.sendEmail).toHaveBeenCalledTimes(1);
  });
});

describe('sms marketing', () => {
  test('generates options, rejects bad numbers, sends tests with opt-out text', async () => {
    getOpenAIClient.mockReturnValue(ai({ messages: ['A', 'B', 'C', 'D'] }));
    const a = app();
    expect((await request(a).post('/api/sms/generate').send({ goal: 'sale' })).body.messages).toHaveLength(3);
    expect((await request(a).post('/api/sms/send-test').send({ to: '07960', body: 'hi' })).status).toBe(400);
    await request(a).post('/api/sms/send-test').send({ to: '+447960691710', body: 'hi' });
    expect(sms.sendSms.mock.calls[0][0].body).toMatch(/^\[TEST\] hi.*STOP/);
  });

  test('campaign needs confirmation and only texts valid subscribers', async () => {
    const a = app();
    expect((await request(a).post('/api/sms/send').send({ body: 'hi' })).status).toBe(400);
    const r = await request(a).post('/api/sms/send').send({ body: 'hi', confirm: true });
    expect(r.body.sent).toBe(1);
    expect(sms.sendSms.mock.calls[0][0].to).toBe('+447960000001');
  });
  test('charges credits per text sent and refuses when the shop cannot afford it', async () => {
    const ledger = require('../core/creditLedger');
    ledger.deductCredits.mockClear();
    const a = app();
    await request(a).post('/api/sms/send').send({ body: 'hi', confirm: true });
    expect(ledger.deductCredits).toHaveBeenCalledWith(expect.any(String), 'sms-send', expect.objectContaining({ quantity: 1 }));
    mockLedger.allowed = false; ledger.deductCredits.mockClear(); sms.sendSms.mockClear();
    const r = await request(a).post('/api/sms/send').send({ body: 'hi', confirm: true });
    expect(r.status).toBe(402);
    expect(sms.sendSms).not.toHaveBeenCalled();
    mockLedger.allowed = true;
  });
});
