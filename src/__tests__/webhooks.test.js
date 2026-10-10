const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-wh-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }), { virtual: true });
jest.mock('dns', () => {
  const real = jest.requireActual('dns');
  const table = { 'hooks.example.com': '93.184.216.34', 'sneaky.example.com': '10.0.0.5' };
  return { ...real, lookup: (host, opts, cb) => (table[host] ? cb(null, [{ address: table[host], family: 4 }]) : real.lookup(host, opts, cb)) };
});

const webhooks = require('../core/webhooks');
const SHOP = 'wh.myshopify.com';
const app = () => {
  const a = express(); a.use(express.json());
  a.use((req, res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; next(); });
  a.use('/api/settings', require('../routes/api-key-settings'));
  return a;
};
const wait = () => new Promise((r) => setImmediate(r));

describe('outbound webhooks', () => {
  it('refuses unsafe addresses', async () => {
    const bad = ['http://hooks.example.com/x', 'https://127.0.0.1/x', 'https://169.254.169.254/latest', 'https://localhost/x', 'https://user:pw@hooks.example.com/x', 'https://hooks.example.com:8443/x', 'https://sneaky.example.com/x', 'not a url', 'https://[::1]/x', 'https://192.168.1.5/x'];
    for (const url of bad) {
      const r = await request(app()).post('/api/settings/webhooks').send({ url });
      expect({ url, status: r.status }).toEqual({ url, status: 400 });
    }
    expect(webhooks.isPrivateIp('::ffff:10.1.2.3')).toBe(true);
    expect(webhooks.isPrivateIp('8.8.8.8')).toBe(false);
  });

  it('adds a webhook (secret shown once), sends signed events, and logs them', async () => {
    const sent = [];
    webhooks.transport.send = async (url, headers, body) => { sent.push({ url, headers, body }); return 200; };
    const made = (await request(app()).post('/api/settings/webhooks').send({ url: 'https://hooks.example.com/in', events: ['change.applied'] })).body.webhook;
    expect(made.secret).toMatch(/^whsec_/);
    expect(JSON.stringify((await request(app()).get('/api/settings/webhooks')).body)).not.toContain(made.secret);
    expect(fs.readdirSync(process.env.AURA_DATA_DIR).join('')).toContain('webhooks');

    webhooks.emit(SHOP, 'draft.created', {});
    webhooks.emit(SHOP, 'change.applied', { tool: 'product-seo' });
    await wait();
    expect(sent).toHaveLength(1);
    const h = sent[0].headers;
    const [, t, sig] = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(h['X-Aura-Signature']);
    expect(sig).toBe(webhooks.sign(made.secret, t, sent[0].body));
    expect(h['X-Aura-Event']).toBe('change.applied');
    expect(JSON.parse(sent[0].body)).toMatchObject({ event: 'change.applied', shop: SHOP, data: { tool: 'product-seo' } });
    expect((await request(app()).get('/api/settings/webhooks')).body.log[0]).toMatchObject({ ok: true, status: 200 });

    const ping = (await request(app()).post(`/api/settings/webhooks/${made.id}/test`)).body;
    expect(ping.ok).toBe(true);
    await request(app()).post(`/api/settings/webhooks/${made.id}/active`).send({ active: false });
    webhooks.emit(SHOP, 'change.applied', {});
    await wait();
    expect(sent).toHaveLength(2);
    expect((await request(app()).delete(`/api/settings/webhooks/${made.id}`)).body.ok).toBe(true);
    expect((await request(app()).delete(`/api/settings/webhooks/${made.id}`)).status).toBe(404);
  });

  it('records failures without throwing, and limits how many you can add', async () => {
    jest.useFakeTimers();
    webhooks.transport.send = async () => 500;
    const made = (await request(app()).post('/api/settings/webhooks').send({ url: 'https://hooks.example.com/fail' })).body.webhook;
    expect(() => webhooks.emit(SHOP, 'change.applied', {})).not.toThrow();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    jest.useRealTimers();
    const log = (await request(app()).get('/api/settings/webhooks')).body.log;
    expect(log[0]).toMatchObject({ ok: false, status: 500, endpointId: made.id });
    for (let i = 0; i < 6; i += 1) await request(app()).post('/api/settings/webhooks').send({ url: `https://hooks.example.com/${i}` });
    expect((await request(app()).get('/api/settings/webhooks')).body.endpoints.length).toBe(5);
  });
});
