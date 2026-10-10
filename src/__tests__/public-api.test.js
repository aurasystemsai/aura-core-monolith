const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-api-'));
const mockInstalled = new Set(['one.myshopify.com', 'two.myshopify.com']);
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (mockInstalled.has(s) ? 'tok' : null) }), { virtual: true });
jest.mock('../core/creditLedger', () => ({ getCreditStatus: async () => ({ plan: 'starter', balance: 42, used: 8, plan_credits: 50 }) }));

const merchant = (shop) => {
  const app = express(); app.use(express.json());
  app.use((req, res, next) => { req.session = { shop, shopifyToken: 'tok' }; next(); });
  app.use('/api/settings', require('../routes/api-key-settings'));
  return app;
};
const pub = () => { const app = express(); app.use('/v1', require('../routes/public-api')); return app; };

describe('public API keys', () => {
  it('makes a key once, stores only its hash, and the key opens a read-only API', async () => {
    const m = merchant('one.myshopify.com');
    expect((await request(m).get('/api/settings/api-key')).body.exists).toBe(false);
    const made = (await request(m).post('/api/settings/api-key/regenerate')).body;
    expect(made.key).toMatch(/^aura_live_/);
    const status = (await request(m).get('/api/settings/api-key')).body;
    expect(status).toMatchObject({ exists: true, hint: made.key.slice(-4) });
    expect(JSON.stringify(status)).not.toContain(made.key);
    const onDisk = fs.readdirSync(process.env.AURA_DATA_DIR).map((f) => fs.readFileSync(path.join(process.env.AURA_DATA_DIR, f), 'utf8')).join('');
    expect(onDisk).not.toContain(made.key);

    const me = await request(pub()).get('/v1/me').set('Authorization', `Bearer ${made.key}`);
    expect(me.body).toMatchObject({ ok: true, shop: 'one.myshopify.com', credits: { balance: 42 } });
    const ch = await request(pub()).get('/v1/changes').set('Authorization', `Bearer ${made.key}`);
    expect(ch.body).toMatchObject({ ok: true, productSeo: [], altText: [] });
    expect((await request(pub()).post('/v1/me').set('Authorization', `Bearer ${made.key}`)).status).toBe(404);
  });

  it('rejects missing, wrong and replaced keys, and keys of uninstalled shops', async () => {
    expect((await request(pub()).get('/v1/me')).status).toBe(401);
    expect((await request(pub()).get('/v1/me').set('Authorization', 'Bearer aura_live_nope')).status).toBe(401);
    const m = merchant('two.myshopify.com');
    const first = (await request(m).post('/api/settings/api-key/regenerate')).body.key;
    const second = (await request(m).post('/api/settings/api-key/regenerate')).body.key;
    expect((await request(pub()).get('/v1/me').set('Authorization', `Bearer ${first}`)).status).toBe(401);
    expect((await request(pub()).get('/v1/me').set('Authorization', `Bearer ${second}`)).status).toBe(200);
    mockInstalled.delete('two.myshopify.com');
    expect((await request(pub()).get('/v1/me').set('Authorization', `Bearer ${second}`)).status).toBe(401);
  });

  it('revoking stops the key working', async () => {
    const m = merchant('one.myshopify.com');
    const key = (await request(m).post('/api/settings/api-key/regenerate')).body.key;
    await request(m).delete('/api/settings/api-key');
    expect((await request(pub()).get('/v1/me').set('Authorization', `Bearer ${key}`)).status).toBe(401);
    expect((await request(m).get('/api/settings/api-key')).body.exists).toBe(false);
  });
});
