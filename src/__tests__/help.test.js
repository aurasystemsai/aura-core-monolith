const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'help-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));

const SHOP = 'help-demo.myshopify.com';
const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/help', (req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; next(); }, require('../routes/help'));
  return a;
};

describe('help', () => {
  test('contact form saves the request and rejects short messages', async () => {
    const ok = await request(app()).post('/api/help/contact').send({ message: 'My alt text job did not finish', email: 'a@b.co' });
    expect(ok.body.ok).toBe(true);
    expect((await request(app()).post('/api/help/contact').send({ message: 'hi' })).status).toBe(400);
    expect((await request(app()).post('/api/help/contact').send({ message: 'long enough message', email: 'nope' })).status).toBe(400);
  });
  test('contact form is limited per hour', async () => {
    let last;
    for (let i = 0; i < 6; i++) last = await request(app()).post('/api/help/contact').send({ message: 'another long message ' + i });
    expect(last.status).toBe(429);
  });
  test('setup progress is worked out from saved data', async () => {
    const before = await request(app()).get('/api/help/setup');
    expect(before.body.steps).toEqual({ connected: true, seoFix: false, storefront: false });
    fs.writeFileSync(path.join(process.env.AURA_DATA_DIR, `popups-${SHOP}.json`), '[]');
    const after = await request(app()).get('/api/help/setup');
    expect(after.body.steps.storefront).toBe(true);
    fs.unlinkSync(path.join(process.env.AURA_DATA_DIR, `popups-${SHOP}.json`));
  });
  test('export leaves out credentials, delete needs the shop name', async () => {
    fs.writeFileSync(path.join(process.env.AURA_DATA_DIR, `size-guides-${SHOP}.json`), JSON.stringify([{ name: 'Tees', accessToken: 'secret' }]));
    const ex = await request(app()).get('/api/help/my-data');
    expect(JSON.stringify(ex.body)).toContain('Tees');
    expect(JSON.stringify(ex.body)).not.toContain('secret');
    expect((await request(app()).post('/api/help/delete-my-data').send({ confirm: 'wrong' })).status).toBe(400);
    const del = await request(app()).post('/api/help/delete-my-data').send({ confirm: SHOP });
    expect(del.body.files_deleted).toBeGreaterThan(0);
  });
});
