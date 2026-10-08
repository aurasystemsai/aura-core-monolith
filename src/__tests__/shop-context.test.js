jest.mock('../core/shopTokens', () => ({
  getToken: (s) => ({ 'a.myshopify.com': 'tok-a', 'b.myshopify.com': 'tok-b' }[s] || null),
}));
const { getShopContext } = require('../core/shopContext');

const env = process.env.NODE_ENV;
afterEach(() => { process.env.NODE_ENV = env; });

describe('getShopContext', () => {
  test('uses the verified session token shop and its own stored token', () => {
    const r = getShopContext({ shopify: { dest: 'https://a.myshopify.com' }, headers: {} });
    expect(r).toEqual({ shop: 'a.myshopify.com', token: 'tok-a' });
  });

  test('verified shop beats a spoofed header (403)', () => {
    const r = getShopContext({ shopify: { dest: 'https://a.myshopify.com' }, headers: { 'x-shopify-shop-domain': 'b.myshopify.com' } });
    expect(r.status).toBe(403);
  });

  test('cookie session shop beats a spoofed header (403)', () => {
    const r = getShopContext({ session: { shop: 'a.myshopify.com' }, headers: { 'x-shopify-shop-domain': 'b.myshopify.com' } });
    expect(r.status).toBe(403);
  });

  test('production never trusts a bare header', () => {
    process.env.NODE_ENV = 'production';
    const r = getShopContext({ headers: { 'x-shopify-shop-domain': 'b.myshopify.com' } });
    expect(r.status).toBe(401);
  });

  test('non-production still allows header-only for local development', () => {
    process.env.NODE_ENV = 'development';
    expect(getShopContext({ headers: { 'x-shopify-shop-domain': 'b.myshopify.com' } }).shop).toBe('b.myshopify.com');
  });

  test('rejects malformed destinations and shops without a stored token', () => {
    expect(getShopContext({ shopify: { dest: 'https://evil.example.com' }, headers: {} }).status).toBe(401);
    expect(getShopContext({ shopify: { dest: 'https://c.myshopify.com' }, headers: {} }).status).toBe(401);
  });

  test('session token for the same shop is preferred over the stored one', () => {
    const r = getShopContext({ session: { shop: 'a.myshopify.com', shopifyToken: 'fresh' }, headers: {} });
    expect(r.token).toBe('fresh');
  });
});
