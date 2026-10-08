const express = require('express');
const request = require('supertest');
const { rateLimit } = require('../core/rateLimit');

function app(opts) {
  const a = express();
  a.use(rateLimit(opts));
  a.get('/x', (req, res) => res.json({ ok: true }));
  return a;
}

describe('rateLimit', () => {
  it('blocks a shop over its limit without affecting other shops', async () => {
    const a = app({ max: 3 });
    for (let i = 0; i < 3; i++) expect((await request(a).get('/x').set('x-shopify-shop-domain', 'a.myshopify.com')).status).toBe(200);
    const blocked = await request(a).get('/x').set('x-shopify-shop-domain', 'a.myshopify.com');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.body.ok).toBe(false);
    expect((await request(a).get('/x').set('x-shopify-shop-domain', 'b.myshopify.com')).status).toBe(200);
  });

  it('can skip paths', async () => {
    const a = app({ max: 1, skip: () => true });
    for (let i = 0; i < 3; i++) expect((await request(a).get('/x')).status).toBe(200);
  });
});
