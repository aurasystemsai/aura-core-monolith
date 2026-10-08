const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gdpr-'));
process.env.AURA_DATA_DIR = dir;
process.env.SHOPIFY_API_SECRET = 'shh';
jest.mock('../core/shopTokens', () => ({ removeToken: jest.fn(() => true) }));

function app() {
  const a = express();
  a.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
  a.use('/api/webhooks', require('../routes/gdpr-webhooks'));
  return a;
}
const sign = (body) => crypto.createHmac('sha256', 'shh').update(JSON.stringify(body)).digest('base64');
const post = (path2, body, hmac) => request(app()).post('/api/webhooks' + path2).set('Content-Type', 'application/json').set('x-shopify-hmac-sha256', hmac === undefined ? sign(body) : hmac).send(JSON.stringify(body));

describe('gdpr webhooks', () => {
  beforeEach(() => {
    fs.writeFileSync(path.join(dir, 'returns-rma-automation-a.myshopify.com.json'), JSON.stringify([{ id: 1, order: { email: 'Bob@x.com' } }, { id: 2, order: { email: 'keep@x.com' } }]));
    fs.writeFileSync(path.join(dir, 'returns-rma-automation-b.myshopify.com.json'), JSON.stringify([{ id: 3, order: { email: 'bob@x.com' } }]));
  });

  it('rejects missing or wrong signatures', async () => {
    expect((await post('/shop/redact', { shop_domain: 'a.myshopify.com' }, 'bad')).status).toBe(401);
    expect((await post('/shop/redact', { shop_domain: 'a.myshopify.com' }, '')).status).toBe(401);
  });

  it('exports and redacts only that customer in that shop', async () => {
    const body = { shop_domain: 'a.myshopify.com', customer: { email: 'bob@x.com' } };
    expect((await post('/customers/data-request', body)).body).toMatchObject({ data_held: true });
    await post('/customers/redact', body);
    const a = JSON.parse(fs.readFileSync(path.join(dir, 'returns-rma-automation-a.myshopify.com.json'), 'utf8'));
    expect(a.map((r) => r.id)).toEqual([2]);
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'returns-rma-automation-b.myshopify.com.json'), 'utf8'))).toHaveLength(1);
  });

  it('deletes a shop\'s files and token on shop/redact', async () => {
    const r = (await post('/shop/redact', { shop_domain: 'a.myshopify.com' })).body;
    expect(r).toMatchObject({ files_deleted: 1, token_removed: true });
    expect(fs.existsSync(path.join(dir, 'returns-rma-automation-a.myshopify.com.json'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'returns-rma-automation-b.myshopify.com.json'))).toBe(true);
  });
});