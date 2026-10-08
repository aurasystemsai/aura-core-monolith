const express = require('express');
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tr-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));
const mockCreate = jest.fn();
jest.mock('../core/openaiClient', () => ({ getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }) }));
const mockGql = jest.fn();
jest.mock('../core/seoStoreData', () => ({ gql: (...a) => mockGql(...a) }));

const SHOP = 'tr-demo-' + Date.now() + '.myshopify.com';
const ID = 'gid://shopify/Product/1';
const deduct = jest.fn();
function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.session = { shop: SHOP, shopifyToken: 'tok' }; req.deductCredits = deduct; next(); });
  a.use('/api/tr', require('../tools/translations/router'));
  return a;
}

const LOCALES = [{ locale: 'en', name: 'English', primary: true, published: true }, { locale: 'fr', name: 'French', primary: false, published: true }];
const RES = (translations = []) => ({ resourceId: ID, translatableContent: [
  { key: 'title', value: 'Blue Mug', digest: 'd-title' },
  { key: 'body_html', value: '<p>A <b>strong</b> mug</p>', digest: 'd-body' },
  { key: 'handle', value: 'blue-mug', digest: 'd-handle' },
  { key: 'meta_title', value: '', digest: 'd-mt' },
], translations });

let registered, removed, state;
beforeEach(() => {
  deduct.mockClear(); mockCreate.mockReset(); mockGql.mockReset();
  registered = []; removed = []; state = [];
  mockGql.mockImplementation(async (_s, _t, q, v) => {
    if (q.includes('shopLocales')) return { shopLocales: LOCALES };
    if (q.includes('translatableResources(')) return { translatableResources: { pageInfo: { hasNextPage: false }, nodes: [RES(state)] } };
    if (q.includes('translatableResource(')) return { translatableResource: v.id === ID ? RES(state) : null };
    if (q.includes('translationsRegister')) { registered.push(...v.t); state = v.t.map((t) => ({ key: t.key, value: t.value, outdated: false })); return { translationsRegister: { userErrors: [] } }; }
    if (q.includes('translationsRemove')) { removed.push(...v.k); state = []; return { translationsRemove: { userErrors: [] } }; }
    throw new Error('unexpected ' + q);
  });
});

const ai = (obj) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });

describe('translations', () => {
  test('lists only non-primary languages and counts real fields (handle and empty fields ignored)', async () => {
    expect((await request(app()).get('/api/tr/status')).body.locales.map((l) => l.locale)).toEqual(['fr']);
    const r = await request(app()).get('/api/tr/products?locale=fr');
    expect(r.body.products[0]).toMatchObject({ id: ID, total: 2, done: 0, title: 'Blue Mug' });
    state = [{ key: 'title', value: 'Tasse', outdated: false }, { key: 'body_html', value: 'x', outdated: true }];
    const r2 = await request(app()).get('/api/tr/products?locale=fr');
    expect(r2.body.products[0]).toMatchObject({ done: 1, outdated: 1 });
  });

  test('rejects languages the store has not enabled', async () => {
    expect((await request(app()).get('/api/tr/products?locale=de')).status).toBe(400);
    expect((await request(app()).get('/api/tr/products?locale=en')).status).toBe(400);
    expect((await request(app()).post('/api/tr/suggest').send({ id: ID, locale: 'xx' })).status).toBe(400);
  });

  test('suggest charges only when AI answers and strips unsafe html', async () => {
    mockCreate.mockRejectedValueOnce(new Error('down'));
    expect((await request(app()).post('/api/tr/suggest').send({ id: ID, locale: 'fr' })).status).toBe(502);
    expect(deduct).not.toHaveBeenCalled();
    mockCreate.mockResolvedValueOnce(ai({ title: 'Tasse bleue', body_html: '<p onclick="x()">Une tasse <script>alert(1)</script>solide</p>' }));
    const r = await request(app()).post('/api/tr/suggest').send({ id: ID, locale: 'fr' });
    expect(r.body.items.map((i) => i.key)).toEqual(['title', 'body_html']);
    expect(r.body.items[1].value).toBe('<p>Une tasse solide</p>');
    expect(deduct).toHaveBeenCalledTimes(1);
  });

  test('apply uses Shopify digests, ignores unknown fields, and revert removes new translations', async () => {
    expect((await request(app()).post('/api/tr/apply').send({ id: ID, locale: 'fr', items: [] })).status).toBe(400);
    const r = await request(app()).post('/api/tr/apply').send({ id: ID, locale: 'fr', items: [{ key: 'title', value: 'Tasse', digest: 'forged' }, { key: 'handle', value: 'hack' }, { key: 'body_html', value: '<p onclick="x">Oui</p>' }] });
    expect(r.status).toBe(200);
    expect(registered).toEqual([
      { locale: 'fr', key: 'title', value: 'Tasse', translatableContentDigest: 'd-title' },
      { locale: 'fr', key: 'body_html', value: '<p>Oui</p>', translatableContentDigest: 'd-body' },
    ]);
    const undo = await request(app()).post('/api/tr/revert').send({ id: r.body.entry.id });
    expect(undo.status).toBe(200);
    expect(removed.sort()).toEqual(['body_html', 'title']);
    expect((await request(app()).post('/api/tr/revert').send({ id: r.body.entry.id })).status).toBe(400);
  });

  test('revert restores an earlier translation instead of deleting it', async () => {
    state = [{ key: 'title', value: 'Ancienne', outdated: false }];
    const r = await request(app()).post('/api/tr/apply').send({ id: ID, locale: 'fr', items: [{ key: 'title', value: 'Nouvelle' }] });
    registered.length = 0;
    await request(app()).post('/api/tr/revert').send({ id: r.body.entry.id });
    expect(registered).toEqual([{ locale: 'fr', key: 'title', value: 'Ancienne', translatableContentDigest: 'd-title' }]);
    expect(removed).toEqual([]);
  });

  test('a Shopify user error is returned and nothing is logged', async () => {
    mockGql.mockImplementation(async (_s, _t, q) => {
      if (q.includes('shopLocales')) return { shopLocales: LOCALES };
      if (q.includes('translationsRegister')) return { translationsRegister: { userErrors: [{ message: 'nope' }] } };
      return { translatableResource: RES() };
    });
    const before = (await request(app()).get('/api/tr/log')).body.log.length;
    const r = await request(app()).post('/api/tr/apply').send({ id: ID, locale: 'fr', items: [{ key: 'title', value: 'T' }] });
    expect(r.status).toBe(422);
    expect((await request(app()).get('/api/tr/log')).body.log.length).toBe(before);
  });

  test('missing Shopify permissions give a clear 403 instead of a raw error', async () => {
    mockGql.mockRejectedValue(new Error('Access denied for shopLocales field. Required access: `read_locales` access scope.'));
    const r = await request(app()).get('/api/tr/status');
    expect(r.status).toBe(403);
    expect(r.body.needsScopes).toBe(true);
    expect(r.body.error).toMatch(/approve the updated permissions/);
  });
});