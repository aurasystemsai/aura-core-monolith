'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

describe('local Shopify token storage', () => {
  const originalPath = process.env.SHOP_TOKENS_PATH;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-shop-tokens-'));

  beforeAll(() => {
    process.env.SHOP_TOKENS_PATH = path.join(tempDir, 'tokens.json');
  });

  afterAll(() => {
    if (originalPath === undefined) delete process.env.SHOP_TOKENS_PATH;
    else process.env.SHOP_TOKENS_PATH = originalPath;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('stores and retrieves a token by shop domain', () => {
    const shopTokens = require('../core/shopTokens');
    shopTokens.upsertToken('aurasystemsai.myshopify.com', 'local-test-token');

    expect(shopTokens.getToken('aurasystemsai.myshopify.com')).toBe('local-test-token');
    expect(shopTokens.getToken('another-shop.myshopify.com')).toBeNull();
  });
});