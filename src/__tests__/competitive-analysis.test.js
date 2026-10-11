const express = require('express');
const request = require('supertest');

jest.mock('../core/shopTokens', () => ({ getToken: (s) => (s === 'a.myshopify.com' ? 'tok' : null) }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockFetch = jest.fn();
jest.mock('../core/safeFetch', () => ({ safeFetchText: (...a) => mockFetch(...a) }));

const deduct = jest.fn();
const app = () => {
  const a = express();
  a.use(express.json());
  a.use('/api/ca', (req, _res, next) => { req.session = { shop: 'a.myshopify.com', shopifyToken: 'tok' }; req.deductCredits = deduct; next(); }, require('../tools/competitive-analysis/router'));
  return a;
};
const page = (extra = '', words = 20) => `<html><head><title>Shoes</title><meta name="description" content="Good shoes"></head><body><h1>Shoes</h1>${extra}<p>${'word '.repeat(words)}</p><img src="a.jpg" alt="a shoe"><img src="b.jpg"></body></html>`;
const ld = '<script type="application/ld+json">{"@type":"Product"}</script>';

beforeEach(() => { mockFetch.mockReset(); mockCreate.mockReset(); deduct.mockReset(); });

test('compares two real pages and notes what they have that you lack', async () => {
  mockFetch.mockImplementation(async (url) => (url.includes('rival') ? { status: 200, text: page(ld + '<h2>A</h2><h2>B</h2>', 400), finalUrl: url, ms: 100 } : { status: 200, text: page('', 20), finalUrl: url, ms: 120 }));
  const r = await request(app()).post('/api/ca/compare').send({ competitor: 'rival.com/p' });
  expect(r.status).toBe(200);
  expect(r.body.theirs.schemaTypes).toEqual(['Product']);
  expect(r.body.mine.url).toBe('https://a.myshopify.com');
  const t = r.body.observations.map((o) => o.text).join(' ');
  expect(t).toMatch(/Product/);
  expect(t).toMatch(/words/);
  expect(t).toMatch(/1 of your 2 images/);
  expect(deduct).not.toHaveBeenCalled();
});

test('rejects a missing address and reports unreadable pages plainly', async () => {
  expect((await request(app()).post('/api/ca/compare').send({})).status).toBe(400);
  mockFetch.mockResolvedValue({ status: 404, text: '', finalUrl: 'https://rival.com/', ms: 5 });
  const r = await request(app()).post('/api/ca/compare').send({ competitor: 'rival.com' });
  expect(r.status).toBe(422);
  expect(r.body.error).toMatch(/Competitor/);
});

test('a password-protected page of yours is explained', async () => {
  mockFetch.mockImplementation(async (url) => (url.includes('rival') ? { status: 200, text: page(), finalUrl: url, ms: 1 } : { status: 200, text: page(), finalUrl: 'https://a.myshopify.com/password', ms: 1 }));
  const r = await request(app()).post('/api/ca/compare').send({ competitor: 'rival.com' });
  expect(r.status).toBe(422);
  expect(r.body.error).toMatch(/password/);
});

test('advice charges only after usable tips', async () => {
  const side = { title: 'T', description: 'd', h1: ['x'], h2: [], schemaTypes: [], words: 10 };
  expect((await request(app()).post('/api/ca/advice').send({})).status).toBe(400);
  mockCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });
  expect((await request(app()).post('/api/ca/advice').send({ mine: side, theirs: side })).status).toBe(502);
  expect(deduct).not.toHaveBeenCalled();
  mockCreate.mockResolvedValue({ choices: [{ message: { content: '- Add Product markup to the page\n- Write a longer description' } }] });
  const ok = await request(app()).post('/api/ca/advice').send({ mine: side, theirs: side });
  expect(ok.body.tips).toHaveLength(2);
  expect(deduct).toHaveBeenCalledTimes(1);
});
