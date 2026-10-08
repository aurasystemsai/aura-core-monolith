const crypto = require('crypto');
const express = require('express');
const request = require('supertest');

const SECRET = 'test-secret-value';
const CLIENT = 'test-client-id';

function token(dest, over = {}) {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = { iss: `${dest}/admin`, dest, aud: CLIENT, sub: '1', exp: now + 60, nbf: now - 5, iat: now, jti: 'j' + Math.random(), sid: 's', ...over };
  const head = b({ alg: 'HS256', typ: 'JWT' });
  const sig = crypto.createHmac('sha256', SECRET).update(`${head}.${b(body)}`).digest('base64url');
  return `${head}.${b(body)}.${sig}`;
}

let app;
const saved = { ...process.env };

beforeAll(() => {
  process.env.NODE_ENV = 'development';
  process.env.SHOPIFY_CLIENT_ID = CLIENT;
  process.env.SHOPIFY_CLIENT_SECRET = SECRET;
  process.env.SHOPIFY_API_KEY = CLIENT;
  process.env.SHOPIFY_API_SECRET = SECRET;
  delete process.env.SHOPIFY_DEV_AUTH_BYPASS;
  jest.isolateModules(() => {
    const verify = require('../middleware/verifyShopifySession');
    app = express();
    app.use(express.json());
    app.use('/api', verify);
    app.use('/api', (req, res) => res.json({ ok: true, shop: req.headers['x-shopify-shop-domain'] }));
  });
});
afterAll(() => { process.env = saved; });

const SHOP = 'good.myshopify.com';
const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('session verification', () => {
  test.each([
    '/api/email-automation-builder/x', '/api/analytics/x', '/api/integration/x', '/api/blog-draft-engine/x',
    '/api/shopify/products', '/api/rank-tracker/x', '/api/review-ugc-engine/x', '/api/ai-content-image-gen/x',
  ])('%s needs a token', async (p) => {
    expect((await request(app).get(p).set('x-shopify-shop-domain', SHOP)).status).toBe(401);
  });

  test('forged token is rejected', async () => {
    const bad = token(`https://${SHOP}`).replace(/.$/, 'A');
    expect((await request(app).get('/api/analytics/x').set(auth(bad))).status).toBe(401);
  });

  test('valid token passes and pins the shop header', async () => {
    const r = await request(app).get('/api/analytics/x').set(auth(token(`https://${SHOP}`)));
    expect(r.status).toBe(200);
    expect(r.body.shop).toBe(SHOP);
  });

  test('header, query or body naming another shop is refused', async () => {
    const t = auth(token(`https://${SHOP}`));
    expect((await request(app).get('/api/analytics/x').set(t).set('x-shopify-shop-domain', 'victim.myshopify.com')).status).toBe(403);
    expect((await request(app).get('/api/analytics/x?shop=victim.myshopify.com').set(t)).status).toBe(403);
    expect((await request(app).post('/api/analytics/x').set(t).send({ shop: 'victim.myshopify.com' })).status).toBe(403);
  });

  test('matching claims are fine', async () => {
    const r = await request(app).post('/api/analytics/x?shop=' + SHOP).set(auth(token(`https://${SHOP}`))).set('x-shopify-shop-domain', SHOP).send({ shop: SHOP });
    expect(r.status).toBe(200);
  });

  test('/session stays reachable without a token', async () => {
    expect((await request(app).get('/api/session')).status).toBe(200);
  });
});
