const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q, vars) => {
    if (q.includes('pages(')) return { pages: { nodes: [{ title: 'Returns policy', body: '<p>30 days to return.</p>' }] } };
    if (vars && vars.q === 'name:#1001') return { orders: { nodes: [{ id: 'gid://shopify/Order/1', name: '#1001', email: 'a@b.co', processedAt: '2025-01-01', totalPriceSet: { shopMoney: { amount: '25.00', currencyCode: 'GBP' } }, customer: { displayName: 'Ann' }, lineItems: { nodes: [{ title: 'Mug', quantity: 2 }] } }] } };
    return { orders: { nodes: [] } };
  },
}));
const mockCreate = jest.fn(async () => ({ choices: [{ message: { content: 'Hi Ann' } }] }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));

const RUN = Date.now();
function makeApp(shop) {
  const router = require('../tools/returns-rma-automation/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/returns-rma-automation', router);
  return app;
}
const B = '/api/returns-rma-automation';

describe('returns', () => {
  it('logs a return against a real order and rejects unknown orders and reasons', async () => {
    const app = makeApp('rma-a');
    const ok = (await request(app).post(B + '/returns').send({ order: '1001', reason: 'faulty' })).body;
    expect(ok.return).toMatchObject({ status: 'requested', items: '2 x Mug', order: { name: '#1001', customer: 'Ann' } });
    expect((await request(app).post(B + '/returns').send({ order: '9999', reason: 'faulty' })).status).toBe(404);
    expect((await request(app).post(B + '/returns').send({ order: '1001', reason: 'bored' })).status).toBe(400);
  });

  it('only allows valid status moves and counts stats', async () => {
    const app = makeApp('rma-b');
    const id = (await request(app).post(B + '/returns').send({ order: '1001', reason: 'faulty' })).body.return.id;
    expect((await request(app).put(`${B}/returns/${id}`).send({ status: 'refunded' })).status).toBe(400);
    expect((await request(app).put(`${B}/returns/${id}`).send({ status: 'approved' })).body.return.status).toBe('approved');
    const o = (await request(app).get(B + '/overview')).body;
    expect(o.stats).toMatchObject({ total: 1, open: 1, byStatus: { approved: 1 }, byReason: { faulty: 1 } });
  });

  it('drafts a reply using the policy page and deletes', async () => {
    const app = makeApp('rma-c');
    const id = (await request(app).post(B + '/returns').send({ order: '#1001', reason: 'changed mind' })).body.return.id;
    const r = (await request(app).post(`${B}/reply/${id}`)).body;
    expect(r).toMatchObject({ ok: true, reply: 'Hi Ann', usedPolicy: true });
    expect(mockCreate.mock.calls[0][0].messages[1].content).toContain('30 days');
    expect((await request(app).delete(`${B}/returns/${id}`)).body.ok).toBe(true);
    expect((await request(app).get(B + '/overview')).body.returns).toHaveLength(0);
  });
});