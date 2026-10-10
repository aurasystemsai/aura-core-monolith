const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AURA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'psnap-'));
jest.mock('../core/shopTokens', () => ({ getToken: () => 'tok' }));

const snap = require('../core/productSnapshot');
const SHOP = 'snap-demo.myshopify.com';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
afterEach(() => jest.restoreAllMocks());

describe('product SEO undo', () => {
  test('saves the old text and puts it back on undo', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok({ product: { title: 'Old', body_html: '<p>old</p>', tags: 'a', handle: 'old' } }))
      .mockResolvedValueOnce(ok({ data: { product: { seo: { title: 'Old SEO', description: null } } } }));
    const before = await snap.snapshot(SHOP, 'gid://shopify/Product/55');
    expect(before).toMatchObject({ title: 'Old', seoTitle: 'Old SEO', metaDescription: '' });

    const entry = snap.record(SHOP, '55', before, { title: 'New', seoTitle: 'New SEO' });
    expect(snap.history(SHOP)).toHaveLength(1);
    expect(entry.changed).toEqual(['title', 'seoTitle']);

    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok({}))
      .mockResolvedValueOnce(ok({ data: { productUpdate: { userErrors: [] } } }));
    const undone = await snap.undo(SHOP, entry.id);
    expect(undone.reverted).toBe(true);
    const put = JSON.parse(global.fetch.mock.calls[2][1].body);
    expect(put.product).toMatchObject({ title: 'Old', body_html: '<p>old</p>', handle: 'old' });
    const seo = JSON.parse(global.fetch.mock.calls[3][1].body).variables.product.seo;
    expect(seo).toEqual({ title: 'Old SEO', description: null });
  });

  test('cannot undo twice or an unknown change', async () => {
    const [done] = snap.history(SHOP);
    await expect(snap.undo(SHOP, done.id)).rejects.toThrow('already undone');
    await expect(snap.undo(SHOP, 'nope')).rejects.toThrow('not found');
  });
});
