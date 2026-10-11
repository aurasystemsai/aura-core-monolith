const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lseo-'));
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok' : null) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const mockFetch = jest.fn();
jest.mock('../core/safeFetch', () => ({ safeFetchText: (...a) => mockFetch(...a) }));

const LOC = 'gid://shopify/Location/1';
const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/l', (req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; next(); }, require('../tools/local-seo-toolkit/router'));
  return a;
};

beforeEach(() => {
  mockFetch.mockReset();
  mockGql.mockReset();
  for (const f of fs.readdirSync(process.env.AURA_DATA_DIR)) fs.unlinkSync(path.join(process.env.AURA_DATA_DIR, f));
  mockGql.mockResolvedValue({
    shop: { name: 'Shoes Ltd', primaryDomain: { url: 'https://shoes.example' } },
    locations: { nodes: [
      { id: LOC, name: 'High St', isActive: true, address: { address1: '1 High St', address2: null, city: 'Leeds', zip: 'LS1 1AA', province: null, provinceCode: null, countryCode: 'GB', phone: null, latitude: null, longitude: null } },
      { id: 'gid://shopify/Location/2', name: 'Old', isActive: false, address: {} },
    ] },
  });
});

test('lists active locations with schema built only from real data and honest checks', async () => {
  const r = await request(app()).get('/api/l/overview');
  expect(r.status).toBe(200);
  expect(r.body.locations).toHaveLength(1);
  const l = r.body.locations[0];
  expect(l.schema.address.streetAddress).toBe('1 High St');
  expect(l.schema.telephone).toBeUndefined();
  expect(l.schema.openingHoursSpecification).toBeUndefined();
  expect(l.checks.find((c) => /Phone/.test(c.label)).ok).toBe(false);
  expect(l.checks.find((c) => /street address/.test(c.label)).ok).toBe(true);
});

test('saves phone, type and valid hours, dropping bad hours', async () => {
  const put = await request(app()).put('/api/l/locations/' + encodeURIComponent(LOC)).send({ type: 'ShoeStore', phone: '+44 113 496 0000', hours: { Monday: { open: '09:00', close: '17:30' }, Tuesday: { open: '18:00', close: '09:00' }, Funday: { open: '09:00', close: '10:00' } } });
  expect(put.status).toBe(200);
  const l = (await request(app()).get('/api/l/overview')).body.locations[0];
  expect(l.schema['@type']).toBe('ShoeStore');
  expect(l.schema.telephone).toBe('+44 113 496 0000');
  expect(l.schema.openingHoursSpecification).toEqual([{ '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '09:00', closes: '17:30' }]);
});

test('rejects bad ids, phones, types and locations that are not in the store', async () => {
  const u = (id) => '/api/l/locations/' + encodeURIComponent(id);
  expect((await request(app()).put(u('nope')).send({})).status).toBe(400);
  expect((await request(app()).put(u('gid://shopify/Location/9')).send({})).status).toBe(404);
  expect((await request(app()).put(u(LOC)).send({ phone: 'abc' })).status).toBe(400);
  expect((await request(app()).put(u(LOC)).send({ type: 'Spaceship' })).status).toBe(400);
});

test('site check finds LocalBusiness data in a graph and reports password-protected stores', async () => {
  mockFetch.mockResolvedValueOnce({ finalUrl: 'https://shoes.example/', status: 200, text: '<script type="application/ld+json">{"@graph":[{"@type":"Organization"},{"@type":"ShoeStore"}]}</script>' });
  let r = await request(app()).get('/api/l/site-check');
  expect(r.body).toMatchObject({ ok: true, found: true, localTypes: ['ShoeStore'] });
  mockFetch.mockResolvedValueOnce({ finalUrl: 'https://shoes.example/', status: 200, text: '<html></html>' });
  r = await request(app()).get('/api/l/site-check');
  expect(r.body.found).toBe(false);
  mockFetch.mockResolvedValueOnce({ finalUrl: 'https://shoes.example/password', status: 200, text: '' });
  r = await request(app()).get('/api/l/site-check');
  expect(r.status).toBe(422);
});
