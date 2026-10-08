'use strict';

const crypto = require('crypto');
const { getShopifyConfig, isValidShopDomain, verifyOAuthHmac } = require('../core/shopifyConfig');

describe('Shopify configuration and OAuth HMAC', () => {
  test('resolves standard Shopify env names and application URL', () => {
    expect(getShopifyConfig({
      SHOPIFY_API_KEY: 'public-key',
      SHOPIFY_API_SECRET: 'private-key',
      APP_URL: 'https://dev-tunnel.example',
      SHOPIFY_SCOPES: 'read_products',
    })).toEqual({
      clientId: 'public-key',
      clientSecret: 'private-key',
      appUrl: 'https://dev-tunnel.example',
      scopes: 'read_products',
    });
  });

  test('prefers explicit client aliases and accepts only Shopify shop domains', () => {
    expect(getShopifyConfig({
      SHOPIFY_CLIENT_ID: 'client-id',
      SHOPIFY_API_KEY: 'api-key',
      SHOPIFY_CLIENT_SECRET: 'client-secret',
      SHOPIFY_API_SECRET: 'api-secret',
      HOST_URL: 'https://host.example',
      SHOPIFY_APP_URL: 'https://app.example',
    })).toMatchObject({ clientId: 'client-id', clientSecret: 'client-secret', appUrl: 'https://host.example' });
    expect(isValidShopDomain('aurasystemsai.myshopify.com')).toBe(true);
    expect(isValidShopDomain('https://aurasystemsai.myshopify.com/path')).toBe(false);
    expect(isValidShopDomain('attacker.example')).toBe(false);
  });

  test('verifies OAuth HMAC and rejects modified query data', () => {
    const query = { code: 'temporary-code', shop: 'aurasystemsai.myshopify.com', state: 'random-state', timestamp: '12345' };
    const message = Object.keys(query).sort().map(key => `${key}=${query[key]}`).join('&');
    const hmac = crypto.createHmac('sha256', 'test-secret').update(message).digest('hex');

    expect(verifyOAuthHmac({ ...query, hmac }, 'test-secret')).toBe(true);
    expect(verifyOAuthHmac({ ...query, shop: 'other.myshopify.com', hmac }, 'test-secret')).toBe(false);
    expect(verifyOAuthHmac({ ...query, hmac }, '')).toBe(false);
  });
});