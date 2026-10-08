const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
const mockCalls = [];
jest.mock('../core/seoStoreData', () => ({
  gql: async (shop, token, q, v) => {
    mockCalls.push({ q, v });
    if (q.includes('tagsAdd')) return { tagsAdd: { userErrors: [] } };
    if (q.includes('products(')) return { products: { nodes: [{ id: 'gid://shopify/Product/1', title: 'Low', variants: { nodes: [{ inventoryQuantity: 1 }, { inventoryQuantity: 1 }] } }, { id: 'gid://shopify/Product/2', title: 'Fine', variants: { nodes: [{ inventoryQuantity: 50 }] } }] } };
    if (q.includes('customers(')) return { customers: { nodes: [{ id: 'gid://shopify/Customer/1', displayName: 'Old', lastOrder: { createdAt: new Date(Date.now() - 200 * 86400000).toISOString() } }, { id: 'gid://shopify/Customer/2', displayName: 'New', lastOrder: { createdAt: new Date().toISOString() } }, { id: 'gid://shopify/Customer/3', displayName: 'Never', lastOrder: null }] } };
    return { orders: { nodes: [] } };
  },
}));
jest.mock('../core/mailer', () => ({ isEmail: (e) => /@/.test(e), esc: (s) => s, sendEmail: async () => ({ sent: false, dryRun: true }) }));

const RUN = Date.now();
function makeApp(shop) {
  const router = require('../tools/workflow-automation-builder/router');
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop: `${shop}-${RUN}.myshopify.com`, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/workflow-automation-builder', router);
  return app;
}
const B = '/api/workflow-automation-builder';

describe('workflow-automation-builder (Automations)', () => {
  it('validates rules', async () => {
    const app = makeApp('auto-a');
    expect((await request(app).post(B + '/rules').send({ trigger: 'nope', action: 'tag' })).status).toBe(400);
    expect((await request(app).post(B + '/rules').send({ trigger: 'low_stock', action: 'email_me', email: 'bad' })).status).toBe(400);
    expect((await request(app).post(B + '/rules').send({ trigger: 'big_order', action: 'tag', tag: 'x' })).status).toBe(400);
  });

  it('runs a low-stock email rule against store data and logs it', async () => {
    const app = makeApp('auto-b');
    const rule = (await request(app).post(B + '/rules').send({ trigger: 'low_stock', threshold: 5, action: 'email_me', email: 'me@x.com' })).body.rule;
    const run = (await request(app).post(`${B}/rules/${rule.id}/run`)).body.run;
    expect(run.matched).toBe(1);
    expect(run.preview[0]).toContain('Low');
    expect(run.dryRun).toBe(true);
    expect((await request(app).get(B + '/rules')).body.runs).toHaveLength(1);
  });

  it('tags only lapsed customers who have ordered before, and deletes rules', async () => {
    const app = makeApp('auto-c');
    mockCalls.length = 0;
    const rule = (await request(app).post(B + '/rules').send({ trigger: 'lapsed_customers', threshold: 90, action: 'tag', tag: 'lapsed now' })).body.rule;
    const run = (await request(app).post(`${B}/rules/${rule.id}/run`)).body.run;
    expect(run.matched).toBe(1);
    const tagCalls = mockCalls.filter((c) => c.q.includes('tagsAdd'));
    expect(tagCalls).toHaveLength(1);
    expect(tagCalls[0].v).toEqual({ id: 'gid://shopify/Customer/1', tags: ['lapsed-now'] });
    expect((await request(app).delete(`${B}/rules/${rule.id}`)).body.ok).toBe(true);
    expect((await request(app).post(B + '/run-all')).status).toBe(400);
  });
});