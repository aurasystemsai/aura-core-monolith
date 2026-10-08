'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-loyalty-compat-'));
process.env.AURA_LOYALTY_DATA_DIR = tempDir;

const loyaltyRouter = require('../routes/loyalty-referral-engine');
const app = express();
app.use(express.json());
app.use('/api/loyalty-referral', loyaltyRouter);

const shopHeader = { 'x-shopify-shop-domain': 'legacy-compat.myshopify.com' };

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env.AURA_LOYALTY_DATA_DIR;
});

describe('Loyalty API compatibility and lifecycle', () => {
  test('supports legacy loyalty-program URLs while using the current shop-scoped store', async () => {
    const created = await request(app)
      .post('/api/loyalty-referral/loyalty/programs')
      .set(shopHeader)
      .send({ name: 'Legacy URL Program', description: 'Compatibility path' });
    expect(created.status).toBe(200);
    expect(created.body.program.name).toBe('Legacy URL Program');

    const listed = await request(app)
      .get('/api/loyalty-referral/loyalty/programs')
      .set(shopHeader);
    expect(listed.body.programs.map(program => program.id)).toContain(created.body.program.id);

    const otherShop = await request(app)
      .get('/api/loyalty-referral/loyalty/programs')
      .set('x-shopify-shop-domain', 'different-shop.myshopify.com');
    expect(otherShop.body.programs).toEqual([]);
  });

  test('supports legacy referral campaign collection URLs', async () => {
    const created = await request(app)
      .post('/api/loyalty-referral/referral/campaigns')
      .set(shopHeader)
      .send({ name: 'Legacy Referral Campaign', description: 'Compatibility path' });
    expect(created.status).toBe(200);
    expect(created.body.campaign.name).toBe('Legacy Referral Campaign');

    const listed = await request(app)
      .get('/api/loyalty-referral/referral/campaigns')
      .set(shopHeader);
    expect(listed.body.campaigns.map(campaign => campaign.id)).toContain(created.body.campaign.id);
  });

  test('supports member points awards and redemption through the current API', async () => {
    const memberResponse = await request(app)
      .post('/api/loyalty-referral/members')
      .set(shopHeader)
      .send({ email: 'lifecycle@example.test', customerId: 'lifecycle-customer' });
    expect(memberResponse.status).toBe(201);

    const rewardResponse = await request(app)
      .post('/api/loyalty-referral/rewards')
      .set(shopHeader)
      .send({ name: 'Starter Reward', type: 'discount', pointsCost: 100 });
    expect(rewardResponse.status).toBe(201);

    const award = await request(app)
      .post('/api/loyalty-referral/points/award')
      .set(shopHeader)
      .send({ customerId: 'lifecycle-customer', points: 250, reason: 'Test purchase' });
    expect(award.body.newBalance).toBe(250);

    const redemption = await request(app)
      .post('/api/loyalty-referral/points/redeem')
      .set(shopHeader)
      .send({
        customerId: 'lifecycle-customer',
        rewardId: rewardResponse.body.reward.id,
      });
    expect(redemption.status).toBe(200);

    const balance = await request(app)
      .get('/api/loyalty-referral/points/lifecycle-customer')
      .set(shopHeader);
    expect(balance.body.pointsBalance).toBe(150);
  });

  test('creates and lists loyalty workflows using implemented workflow routes', async () => {
    const created = await request(app)
      .post('/api/loyalty-referral/ai/workflows')
      .set(shopHeader)
      .send({
        name: 'Welcome workflow',
        trigger: { event: 'member_created' },
        actions: [{ type: 'award_bonus_points', value: 50 }],
      });
    expect(created.status).toBe(200);
    expect(created.body.workflow.name).toBe('Welcome workflow');

    const listed = await request(app)
      .get('/api/loyalty-referral/ai/workflows')
      .set(shopHeader);
    expect(listed.body.workflows.map(workflow => workflow.id)).toContain(created.body.workflow.id);
  });
});
