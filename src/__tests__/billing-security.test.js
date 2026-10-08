const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'billing-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
jest.mock('../core/creditLedger', () => ({
  updatePlan: jest.fn(async () => {}),
  addTopupCredits: jest.fn(async () => ({ ok: true })),
  getCreditStatus: jest.fn(async () => ({ ok: true, plan: 'free', balance: 10 })),
}));
jest.mock('../core/shopifyBillingService', () => ({
  getSubscription: jest.fn(),
  verifyCreditPackCharge: jest.fn(),
  createSubscription: jest.fn(),
  purchaseCreditPack: jest.fn(),
  cancelSubscription: jest.fn(),
  listPlans: () => [], listCreditPacks: () => [],
}));
const ledger = require('../core/creditLedger');
const svc = require('../core/shopifyBillingService');

const SHOP = 'victim.myshopify.com';
const env = process.env.NODE_ENV;

function app(identity = {}) {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { Object.assign(req, identity); next(); });
  a.use('/api/billing', require('../routes/billing'));
  return a;
}

beforeEach(() => { jest.clearAllMocks(); svc.getSubscription.mockResolvedValue({ plan_id: 'free', status: 'active' }); svc.verifyCreditPackCharge.mockResolvedValue(null); });
afterEach(() => { process.env.NODE_ENV = env; });

describe('billing cannot be self-granted', () => {
  test('/confirm with forged plan and credits and no charge grants nothing', async () => {
    const r = await request(app()).get(`/api/billing/confirm?shop=${SHOP}&plan=enterprise&credits=999999`);
    expect(r.status).toBe(302);
    expect(ledger.updatePlan).not.toHaveBeenCalled();
    expect(ledger.addTopupCredits).not.toHaveBeenCalled();
  });

  test('/confirm with a fake charge id still grants nothing when Shopify does not confirm it', async () => {
    await request(app()).get(`/api/billing/confirm?shop=${SHOP}&plan=enterprise&credits=999999&charge_id=1`);
    expect(ledger.updatePlan).not.toHaveBeenCalled();
    expect(ledger.addTopupCredits).not.toHaveBeenCalled();
  });

  test('/confirm applies the plan Shopify reports, not the one in the URL', async () => {
    svc.getSubscription.mockResolvedValue({ plan_id: 'growth', status: 'active' });
    await request(app()).get(`/api/billing/confirm?shop=${SHOP}&plan=enterprise&charge_id=7`);
    expect(ledger.updatePlan).toHaveBeenCalledWith(SHOP, 'growth');
  });

  test('/confirm credits come from the verified pack, once per charge', async () => {
    svc.verifyCreditPackCharge.mockResolvedValue({ pack: { id: 'credits-500', credits: 500 }, chargeId: 'gid://shopify/AppPurchaseOneTime/9' });
    await request(app()).get(`/api/billing/confirm?shop=${SHOP}&credits=999999&charge_id=9`);
    await request(app()).get(`/api/billing/confirm?shop=${SHOP}&credits=999999&charge_id=9`);
    expect(ledger.addTopupCredits).toHaveBeenCalledTimes(1);
    expect(ledger.addTopupCredits).toHaveBeenCalledWith(SHOP, 500, expect.any(Object));
  });

  test('/confirm ignores malformed shop values', async () => {
    const r = await request(app()).get('/api/billing/confirm?shop=evil.example.com&charge_id=1');
    expect(r.headers.location).toBe('https://admin.shopify.com');
    expect(svc.getSubscription).not.toHaveBeenCalled();
  });

  test('/sync-plan ignores a client-supplied planId', async () => {
    const r = await request(app({ shopify: { dest: `https://${SHOP}` } })).post('/api/billing/sync-plan').send({ planId: 'enterprise' });
    expect(r.body.ok).toBe(true);
    expect(ledger.updatePlan).not.toHaveBeenCalled();
  });

  test('/sync-plan applies only an active paid subscription from Shopify', async () => {
    svc.getSubscription.mockResolvedValue({ plan_id: 'pro', status: 'active' });
    await request(app({ shopify: { dest: `https://${SHOP}` } })).post('/api/billing/sync-plan').send({});
    expect(ledger.updatePlan).toHaveBeenCalledWith(SHOP, 'pro');
  });
});

describe('billing shop identity', () => {
  test('verified identity cannot be redirected to another shop via body or header', async () => {
    const r = await request(app({ shopify: { dest: 'https://mine.myshopify.com' } }))
      .post('/api/billing/sync-plan').set('x-shopify-shop-domain', SHOP).send({ shop: SHOP });
    expect(r.status).toBe(400);
    expect(ledger.updatePlan).not.toHaveBeenCalled();
  });

  test('production never trusts a bare header or body shop', async () => {
    process.env.NODE_ENV = 'production';
    const r = await request(app()).post('/api/billing/sync-plan').set('x-shopify-shop-domain', SHOP).send({ shop: SHOP });
    expect(r.status).toBe(400);
  });

  test('purchase and cancel need a resolvable shop', async () => {
    process.env.NODE_ENV = 'production';
    expect((await request(app()).post('/api/billing/purchase-credits').send({ packId: 'credits-500', shop: SHOP })).status).toBe(400);
    expect((await request(app()).post('/api/billing/cancel').send({ subscriptionId: 'x', shop: SHOP })).status).toBe(400);
    expect(svc.purchaseCreditPack).not.toHaveBeenCalled();
    expect(svc.cancelSubscription).not.toHaveBeenCalled();
  });
});
