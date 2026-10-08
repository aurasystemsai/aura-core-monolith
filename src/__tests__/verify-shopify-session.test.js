'use strict';

const verifyShopifySession = require('../middleware/verifyShopifySession');

describe('Shopify session middleware local configuration', () => {
  const originalEnv = {};

  beforeEach(() => {
    originalEnv.nodeEnv = process.env.NODE_ENV;
    originalEnv.clientId = process.env.SHOPIFY_CLIENT_ID;
    originalEnv.clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  });

  afterEach(() => {
    if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv.nodeEnv;
    if (originalEnv.clientId === undefined) delete process.env.SHOPIFY_CLIENT_ID;
    else process.env.SHOPIFY_CLIENT_ID = originalEnv.clientId;
    if (originalEnv.clientSecret === undefined) delete process.env.SHOPIFY_CLIENT_SECRET;
    else process.env.SHOPIFY_CLIENT_SECRET = originalEnv.clientSecret;
  });

  test('allows local API requests when Shopify credentials are not configured', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SHOPIFY_CLIENT_ID;
    delete process.env.SHOPIFY_CLIENT_SECRET;
    const next = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await verifyShopifySession({ path: '/api/loyalty-referral/programs', headers: {} }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('does not allow a missing token in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SHOPIFY_CLIENT_ID;
    delete process.env.SHOPIFY_CLIENT_SECRET;
    const next = jest.fn();
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await verifyShopifySession({ path: '/api/loyalty-referral/programs', headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: No Authorization header');
    expect(next).not.toHaveBeenCalled();
  });
});