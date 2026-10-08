'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-loyalty-router-'));
process.env.AURA_LOYALTY_DATA_DIR = tempDir;
const loyaltyRouter = require('../routes/loyalty-referral');

const app = express();
app.use(express.json());
app.use('/api/loyalty-referral', loyaltyRouter);

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  delete process.env.AURA_LOYALTY_DATA_DIR;
});

describe('Loyalty & Referral routes', () => {
  test('creates and lists programs without leaking them across shops', async () => {
    const create = await request(app)
      .post('/api/loyalty-referral/programs')
      .set('x-shopify-shop-domain', 'shop-a.myshopify.com')
      .send({ name: 'Smoke Test Rewards', description: 'Local route test' });

    expect(create.status).toBe(200);
    expect(create.body.success).toBe(true);
    expect(create.body.program.name).toBe('Smoke Test Rewards');

    const sameShop = await request(app)
      .get('/api/loyalty-referral/programs')
      .set('x-shopify-shop-domain', 'shop-a.myshopify.com');
    const otherShop = await request(app)
      .get('/api/loyalty-referral/programs')
      .set('x-shopify-shop-domain', 'shop-b.myshopify.com');

    expect(sameShop.body.programs.map(program => program.id)).toContain(create.body.program.id);
    expect(otherShop.body.programs).toEqual([]);
  });
});