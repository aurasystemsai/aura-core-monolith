const express = require('express');
const request = require('supertest');
const legal = require('../routes/legal');

describe('legal pages', () => {
  const app = express();
  app.use('/privacy', legal.privacy);
  app.use('/terms', legal.terms);
  test('privacy policy is public and covers customer data and sub-processors', async () => {
    const r = await request(app).get('/privacy');
    expect(r.status).toBe(200);
    expect(r.text).toMatch(/OpenAI/);
    expect(r.text).toMatch(/Orders, inventory and customer records/);
  });
  test('terms are public', async () => {
    const r = await request(app).get('/terms');
    expect(r.status).toBe(200);
    expect(r.text).toMatch(/Credits and billing/);
  });
});
