const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const DAY = 86400000;
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();
const mockCustomers = [
  { id: 'c1', displayName: 'Ann', defaultEmailAddress: { emailAddress: 'ann@x.com' }, numberOfOrders: '8', amountSpent: { amount: '900.00', currencyCode: 'GBP' }, createdAt: ago(400), lastOrder: { createdAt: ago(5) } },
  { id: 'c2', displayName: '=Bob', defaultEmailAddress: { emailAddress: 'bob@x.com' }, numberOfOrders: '3', amountSpent: { amount: '150.00', currencyCode: 'GBP' }, createdAt: ago(500), lastOrder: { createdAt: ago(300) } },
  { id: 'c3', displayName: 'Cat', defaultEmailAddress: null, numberOfOrders: '1', amountSpent: { amount: '30.00', currencyCode: 'GBP' }, createdAt: ago(200), lastOrder: { createdAt: ago(200) } },
  { id: 'c4', displayName: 'Dan', defaultEmailAddress: { emailAddress: 'dan@x.com' }, numberOfOrders: '0', amountSpent: { amount: '0.0', currencyCode: 'GBP' }, createdAt: ago(10), lastOrder: null },
  { id: 'c5', displayName: 'Eve', defaultEmailAddress: { emailAddress: 'eve@x.com' }, numberOfOrders: '2', amountSpent: { amount: '120.00', currencyCode: 'GBP' }, createdAt: ago(100), lastOrder: { createdAt: ago(8) } },
];
jest.mock('../core/seoStoreData', () => ({ gql: async () => ({ customers: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: mockCustomers } }) }));
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ message: { content: JSON.stringify({ goal: 'Win them back', steps: [{ when: 'Day 0', channel: 'email', message: 'We miss you' }, { when: 'Day 5', channel: 'fax', message: 'x' }], avoid: ['Discount spam'] }) } }] }) } } }) }));

function makeApp() {
  const router = require('../tools/customer-data-platform/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: 'cust-test.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/customer-data-platform', router);
  return app;
}
const B = '/api/customer-data-platform';

describe('customer-data-platform (Customer Intelligence)', () => {
  it('computes totals, stages and segments from real order data', async () => {
    const r = await request(makeApp()).get(B + '/overview');
    expect(r.body.ok).toBe(true);
    expect(r.body.totals).toMatchObject({ customers: 5, buyers: 4, revenue: 1200, currency: 'GBP', repeatRate: 75, avgLifetimeValue: 300 });
    expect(r.body.stages.find((s) => s.name === 'Signed up, no purchase').customers).toBe(1);
    expect(r.body.segments.find((s) => s.name === 'No purchase yet').customers).toBe(1);
    expect(r.body.segments.reduce((n, s) => n + s.customers, 0)).toBe(5);
  });

  it('flags churn from the customer\'s own buying rhythm', async () => {
    const r = await request(makeApp()).get(B + '/customers');
    const by = Object.fromEntries(r.body.customers.map((c) => [c.name, c]));
    expect(by.Ann.churnRisk).toBe('low');
    expect(by['=Bob'].churnRisk).toBe('high');
    expect(by.Cat.churnRisk).toBe('high');
    expect(by.Dan.churnRisk).toBeNull();
  });

  it('filters, exports CSV safely and writes a playbook', async () => {
    const app = makeApp();
    const hi = await request(app).get(B + '/customers?risk=high');
    expect(hi.body.customers.map((c) => c.name).sort()).toEqual(['=Bob', 'Cat']);
    const csv = await request(app).get(B + '/export');
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toContain('"\'=Bob"');
    const seg = (await request(app).get(B + '/overview')).body.segments.find((s) => s.name !== 'No purchase yet').name;
    const p = await request(app).post(B + '/playbook').send({ segment: seg });
    expect(p.body.playbook.goal).toBe('Win them back');
    expect(p.body.playbook.steps[1].channel).toBe('email');
    expect((await request(app).post(B + '/playbook').send({ segment: 'Nope' })).status).toBe(404);
  });
});
