'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-loyalty-api-'));
process.env.AURA_LOYALTY_DATA_DIR = tempDir;

const loyaltyRouter = require('../routes/loyalty-referral');
const app = express();
app.use(express.json());
app.use('/api/loyalty-referral', loyaltyRouter);

const shop = name => `${name}.myshopify.com`;
const atShop = (method, endpoint, shopName = 'loyalty-tests') =>
  request(app)[method](endpoint).set('x-shopify-shop-domain', shop(shopName));

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env.AURA_LOYALTY_DATA_DIR;
});

describe('Loyalty & Referral API', () => {
  test('overview and ledger reflect real shop data, with no placeholder numbers', async () => {
    const shopName = 'real-stats';
    const empty = await atShop('get', '/api/loyalty-referral/analytics/engagement/overview', shopName);
    expect(empty.body).toMatchObject({ activeMembers: 0, totalMembers: 0, pointsEarnedToday: 0, pointsRedeemedToday: 0 });
    expect((await atShop('get', '/api/loyalty-referral/points/transactions', shopName)).body.transactions).toEqual([]);

    await atShop('post', '/api/loyalty-referral/members', shopName).send({
      email: 'stats@example.test', firstName: 'Sam', customerId: 'stats-customer',
    });
    await atShop('post', '/api/loyalty-referral/points/award', shopName).send({ customerId: 'stats-customer', points: 300 });
    await atShop('post', '/api/loyalty-referral/points/deduct', shopName).send({ customerId: 'stats-customer', points: 120 });

    const overview = await atShop('get', '/api/loyalty-referral/analytics/engagement/overview', shopName);
    expect(overview.body).toMatchObject({
      activeMembers: 1, totalMembers: 1, pointsEarnedToday: 300, pointsRedeemedToday: 120,
    });

    const ledger = await atShop('get', '/api/loyalty-referral/points/transactions', shopName);
    expect(ledger.body.transactions).toHaveLength(2);
    expect(ledger.body.transactions[0]).toMatchObject({ memberName: 'Sam', points: -120, balance: 180 });

    const base = '/api/loyalty-referral/analytics';
    const segments = await atShop('get', `${base}/clv/segments`, shopName);
    expect(segments.body.segments.find(s => s.segment === 'Bronze')).toMatchObject({ memberCount: 1, avgCLV: 300 });
    expect((await atShop('get', `${base}/clv/trends`, shopName)).body.trends).toHaveLength(12);
    expect((await atShop('get', `${base}/engagement/by-tier`, shopName)).body.tiers).toHaveLength(4);

    const emptyShop = 'no-referrals';
    const funnel = await atShop('get', `${base}/referrals/conversion-funnel`, emptyShop);
    expect(funnel.body.funnel.stages[0]).toMatchObject({ stage: 'Invited', count: 0 });
    expect((await atShop('get', `${base}/referrals/overview`, emptyShop)).body).toMatchObject({ totalReferrals: 0, totalReferralRevenue: 0 });
    expect((await atShop('get', `${base}/referrals/viral-loop`, emptyShop)).body.kFactor).toBe(0);
    expect((await atShop('get', '/api/loyalty-referral/apm/metrics/real-time', shopName)).body)
      .toMatchObject({ activeMembers: 1, pointsEarnedLastMinute: 300, requestsPerSecond: null });
  });

  test('creates, reads, updates, filters, and deletes a shop-scoped program', async () => {
    const created = await atShop('post', '/api/loyalty-referral/programs').send({
      name: 'Test Rewards',
      description: 'Rewards for repeat customers',
      type: 'points',
      pointsPerDollar: 10,
    });
    expect(created.status).toBe(200);
    expect(created.body).toMatchObject({ success: true, program: { name: 'Test Rewards' } });

    const id = created.body.program.id;
    const listed = await atShop('get', '/api/loyalty-referral/programs').query({ search: 'test' });
    expect(listed.body.programs.map(program => program.id)).toContain(id);

    const updated = await atShop('put', `/api/loyalty-referral/programs/${id}`).send({
      name: 'Updated Rewards',
      pointsPerDollar: 15,
    });
    expect(updated.body.program).toMatchObject({ name: 'Updated Rewards', pointsPerDollar: 15 });

    const otherShop = await atShop('get', '/api/loyalty-referral/programs', 'another-shop');
    expect(otherShop.body.programs).toEqual([]);

    const removed = await atShop('delete', `/api/loyalty-referral/programs/${id}`);
    expect(removed.body.success).toBe(true);
    expect((await atShop('get', `/api/loyalty-referral/programs/${id}`)).status).toBe(404);
  });

  test('creates and lists a referral campaign', async () => {
    const created = await atShop('post', '/api/loyalty-referral/referrals').send({
      name: 'Customer Invite',
      description: 'Refer a friend campaign',
    });
    expect(created.status).toBe(200);
    expect(created.body.campaign).toMatchObject({ name: 'Customer Invite', status: 'active' });

    const list = await atShop('get', '/api/loyalty-referral/referrals');
    expect(list.body.campaigns.map(campaign => campaign.id)).toContain(created.body.campaign.id);
  });

  test('creates members, rewards, and tiers used by the console', async () => {
    const member = await atShop('post', '/api/loyalty-referral/members').send({
      email: 'member@example.test',
      firstName: 'Avery',
      lastName: 'Example',
    });
    expect(member.status).toBe(201);
    expect(member.body.member).toMatchObject({
      email: 'member@example.test',
      pointsBalance: 0,
      lifetimePoints: 0,
    });

    const duplicate = await atShop('post', '/api/loyalty-referral/members').send({
      email: 'MEMBER@example.test',
    });
    expect(duplicate.status).toBe(409);

    const listedMembers = await atShop('get', '/api/loyalty-referral/members');
    expect(listedMembers.body.members.map(item => item.id)).toContain(member.body.member.id);
    expect((await atShop('get', `/api/loyalty-referral/members/${member.body.member.id}`)).body.member.email)
      .toBe('member@example.test');

    const reward = await atShop('post', '/api/loyalty-referral/rewards').send({
      name: 'Welcome reward',
      type: 'discount',
      pointsCost: 100,
    });
    expect(reward.status).toBe(201);
    expect((await atShop('get', '/api/loyalty-referral/rewards')).body.rewards)
      .toContainEqual(expect.objectContaining({ id: reward.body.reward.id }));

    const tier = await atShop('post', '/api/loyalty-referral/tiers').send({
      name: 'Silver',
      threshold: 500,
      pointsMultiplier: 1.25,
    });
    expect(tier.status).toBe(201);
    expect((await atShop('get', '/api/loyalty-referral/tiers')).body.tiers)
      .toContainEqual(expect.objectContaining({ id: tier.body.tier.id, name: 'Silver' }));
  });

  test('awards and deducts points and reports the resulting balance', async () => {
    const member = await atShop('post', '/api/loyalty-referral/members').send({
      email: 'points@example.test',
      customerId: 'points-customer',
    });
    expect(member.status).toBe(201);

    const award = await atShop('post', '/api/loyalty-referral/points/award').send({
      customerId: 'points-customer',
      points: 250,
      reason: 'Purchase',
    });
    expect(award.body).toMatchObject({ success: true, newBalance: 250 });

    const deduction = await atShop('post', '/api/loyalty-referral/points/deduct').send({
      customerId: 'points-customer',
      points: 50,
      reason: 'Adjustment',
    });
    expect(deduction.body).toMatchObject({ success: true, newBalance: 200 });

    const balance = await atShop('get', '/api/loyalty-referral/points/points-customer');
    expect(balance.body).toMatchObject({ pointsBalance: 200, lifetimePoints: 250 });
  });

  test('rejects malformed core resource input explicitly', async () => {
    expect((await atShop('post', '/api/loyalty-referral/members').send({})).status).toBe(400);
    expect((await atShop('post', '/api/loyalty-referral/rewards').send({
      name: 'Invalid reward',
      pointsCost: -10,
    })).status).toBe(400);
    expect((await atShop('post', '/api/loyalty-referral/tiers').send({})).status).toBe(400);
  });
});
