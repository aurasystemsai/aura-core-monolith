'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { createLoyaltyStorage } = require('../core/loyaltyStorage');

describe('loyalty shop storage', () => {
  let tempDir;
  let storage;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aura-loyalty-'));
    storage = createLoyaltyStorage(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('persists values while isolating shops', () => {
    storage.set('loyalty-referral-programs', [{ id: 'program-a' }], 'shop-a.myshopify.com');

    expect(storage.get('loyalty-referral-programs', 'shop-a.myshopify.com')).toEqual([{ id: 'program-a' }]);
    expect(storage.get('loyalty-referral-programs', 'shop-b.myshopify.com', [])).toEqual([]);
  });

  test('rejects an empty storage key or shop identifier', () => {
    expect(() => storage.set('valid-key', {}, '')).toThrow('shop id is required');
    expect(() => storage.set('', {}, 'shop.myshopify.com')).toThrow('storage key is required');
  });
});