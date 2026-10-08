const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: async () => ({ choices: [{ message: { content: '1. Add SPF.' } }] }) } } }) }));
jest.mock('dns', () => ({
  promises: {
    resolveTxt: async (name) => {
      if (name === 'good.com') return [['v=spf1 include:x ~all']];
      if (name === '_dmarc.good.com') return [['v=DMARC1; p=reject']];
      if (name === 'google._domainkey.good.com') return [['v=DKIM1; k=rsa; p=abc']];
      throw Object.assign(new Error('nx'), { code: 'ENOTFOUND' });
    },
    resolveMx: async (name) => { if (name === 'good.com') return [{ exchange: 'mx.good.com', priority: 1 }]; throw new Error('nx'); },
  },
}));

let n = 0;
function makeApp() {
  const router = require('../tools/email-deliverability/router');
  const app = express();
  app.use(express.json());
  const shop = `deliv-${Date.now()}-${n++}.myshopify.com`;
  app.use((req, res, next) => { req.session = { shop, shopifyToken: 'tok' }; req.deductCredits = async () => {}; next(); });
  app.use('/api/email-deliverability', router);
  return app;
}

describe('email-deliverability', () => {
  it('scores a fully configured domain as healthy', async () => {
    const app = makeApp();
    const r = await request(app).post('/api/email-deliverability/check').send({ domain: 'https://www.good.com/' });
    expect(r.body.ok).toBe(true);
    expect(r.body.result.domain).toBe('good.com');
    expect(r.body.result.status).toBe('healthy');
    expect(r.body.result.dkim.selectors).toEqual(['google']);
    expect(r.body.result.issues).toEqual([]);
  });

  it('flags missing records on a bare domain and saves it', async () => {
    const app = makeApp();
    const r = await request(app).post('/api/email-deliverability/check').send({ domain: 'bare.com' });
    expect(r.body.result.status).toBe('critical');
    expect(r.body.result.issues.map((i) => i.issue)).toEqual(expect.arrayContaining(['No SPF record', 'No DMARC record']));
    const list = await request(app).get('/api/email-deliverability/domains');
    expect(list.body.domains).toHaveLength(1);
    const adv = await request(app).post('/api/email-deliverability/advise').send({ domain: 'bare.com' });
    expect(adv.body.advice).toContain('SPF');
  });

  it('rejects invalid domains', async () => {
    const r = await request(makeApp()).post('/api/email-deliverability/check').send({ domain: 'not a domain; rm -rf' });
    expect(r.status).toBe(400);
  });
});
