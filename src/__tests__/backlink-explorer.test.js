const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-'));
jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok' : null) }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));
const mockFetch = jest.fn();
jest.mock('../core/safeFetch', () => ({ safeFetchText: (...a) => mockFetch(...a) }));

const deduct = jest.fn();
const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/lb', (req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = deduct; next(); }, require('../tools/backlink-explorer/router'));
  return a;
};
const html = (a) => ({ status: 200, finalUrl: 'https://blog.example.com/post', text: `<html><body>${a}</body></html>` });

beforeEach(() => {
  mockGql.mockReset(); mockCreate.mockReset(); mockFetch.mockReset(); deduct.mockReset();
  mockGql.mockResolvedValue({ shop: { name: 'Shoes', primaryDomain: { host: 'www.shoes.com', url: 'https://www.shoes.com' } } });
  for (const f of fs.readdirSync(process.env.AURA_DATA_DIR)) fs.unlinkSync(path.join(process.env.AURA_DATA_DIR, f));
});

test('finds a live link, reads its anchor text, and lists it', async () => {
  mockFetch.mockResolvedValue(html('<a href="https://shoes.com/products/x" class="y">Great shoes</a>'));
  const r = await request(app()).post('/api/lb/links').send({ source: 'blog.example.com/post' });
  expect(r.body.link.status).toBe('live');
  expect(r.body.link.anchor).toBe('Great shoes');
  const list = await request(app()).get('/api/lb/links');
  expect(list.body.summary.live).toBe(1);
});

test('tells nofollow, missing and unreachable apart', async () => {
  mockFetch.mockResolvedValueOnce(html('<a rel="nofollow" href="https://www.shoes.com/">x</a>'));
  expect((await request(app()).post('/api/lb/links').send({ source: 'one.com/a' })).body.link.status).toBe('nofollow');
  mockFetch.mockResolvedValueOnce(html('<a href="https://other.com">x</a>'));
  expect((await request(app()).post('/api/lb/links').send({ source: 'two.com/a' })).body.link.status).toBe('missing');
  mockFetch.mockResolvedValueOnce({ status: 404, text: '', finalUrl: 'https://three.com/a' });
  expect((await request(app()).post('/api/lb/links').send({ source: 'three.com/a' })).body.link.status).toBe('unreachable');
});

test('rejects bad input, own pages and duplicates', async () => {
  expect((await request(app()).post('/api/lb/links').send({ source: 'nope' })).status).toBe(400);
  expect((await request(app()).post('/api/lb/links').send({ source: 'shoes.com/blog' })).status).toBe(400);
  mockFetch.mockResolvedValue(html(''));
  await request(app()).post('/api/lb/links').send({ source: 'one.com/a' });
  expect((await request(app()).post('/api/lb/links').send({ source: 'one.com/a' })).status).toBe(400);
  expect((await request(app()).post('/api/lb/links').send({ source: 'two.com/a', target: 'other.com/x' })).status).toBe(400);
});

test('re-check notices a link that has been removed, and a link can be deleted', async () => {
  mockFetch.mockResolvedValueOnce(html('<a href="https://shoes.com/">x</a>'));
  const id = (await request(app()).post('/api/lb/links').send({ source: 'one.com/a' })).body.link.id;
  mockFetch.mockResolvedValueOnce(html('<p>gone</p>'));
  const c = await request(app()).post('/api/lb/links/check').send({ id });
  expect(c.body.links[0].status).toBe('missing');
  expect((await request(app()).delete('/api/lb/links/' + id)).body.ok).toBe(true);
  expect((await request(app()).delete('/api/lb/links/' + id)).status).toBe(404);
});

test('outreach validates, and charges only after a usable email', async () => {
  const ok = { kind: 'supplier', site: 'Acme', pageUrl: 'https://shoes.com/', pageTitle: 'Home' };
  expect((await request(app()).post('/api/lb/outreach').send({ ...ok, kind: 'x' })).status).toBe(400);
  expect((await request(app()).post('/api/lb/outreach').send({ ...ok, site: '' })).status).toBe(400);
  mockCreate.mockResolvedValue({ choices: [{ message: { content: '{"subject":"","body":"hi"}' } }] });
  expect((await request(app()).post('/api/lb/outreach').send(ok)).status).toBe(502);
  expect(deduct).not.toHaveBeenCalled();
  mockCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ subject: 'Stockist listing', body: 'Hi Acme, we sell your shoes and would love to be listed on your stockists page. Thanks, [Your name]' }) } }] });
  const r = await request(app()).post('/api/lb/outreach').send(ok);
  expect(r.body.subject).toBe('Stockist listing');
  expect(deduct).toHaveBeenCalledTimes(1);
});

test('lists real pages to promote, skipping drafts', async () => {
  mockGql.mockResolvedValue({ shop: { name: 'Shoes', primaryDomain: { url: 'https://www.shoes.com' } }, collections: { nodes: [{ title: 'Boots', handle: 'boots' }] }, products: { nodes: [{ title: 'Runner', handle: 'runner', onlineStoreUrl: null, status: 'ACTIVE' }, { title: 'Hidden', handle: 'h', status: 'DRAFT' }] } });
  const r = await request(app()).get('/api/lb/pages');
  expect(r.body.pages.map((p) => p.url)).toEqual(['https://www.shoes.com', 'https://www.shoes.com/collections/boots', 'https://www.shoes.com/products/runner']);
});
