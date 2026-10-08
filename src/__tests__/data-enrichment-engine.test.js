'use strict';

jest.mock('../core/storageJson', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const storageJson = require('../core/storageJson');
const engine = require('../tools/data-enrichment-suite/engines/data-enrichment-engine');

describe('data enrichment engine', () => {
  let records;

  beforeEach(() => {
    records = new Map();
    storageJson.get.mockImplementation(async (key, fallback) => records.has(key) ? records.get(key) : fallback);
    storageJson.set.mockImplementation(async (key, value) => { records.set(key, value); });
    storageJson.get.mockClear();
    storageJson.set.mockClear();
  });

  test('profiles supplied records using their actual field completeness', () => {
    const profile = engine.profileDataset('Customers', [
      { email: 'a@example.com', phone: '' },
      { email: 'b@example.com', phone: '+44123456789' },
    ]);

    expect(profile).toMatchObject({
      totalRecords: 2,
      fieldCount: 2,
      completeness: { overall: '75%', fields: { email: '100%', phone: '50%' } },
      qualityScore: 'C',
    });
    expect(profile.issues).toEqual([{ field: 'phone', problem: '50% of 2 records are missing this field', severity: 'high' }]);
  });

  test('persists mappings and history separately for each shop', async () => {
    const mapping = await engine.createMapping('shop-a.myshopify.com', { sourceField: 'first_name', targetField: 'given_name' });
    const history = await engine.addHistory('shop-a.myshopify.com', { action: 'Classify', summary: 'Done' });

    expect(await engine.getMappings('shop-a.myshopify.com')).toEqual([mapping]);
    expect(await engine.getHistory('shop-a.myshopify.com')).toEqual([history]);
    expect(await engine.getMappings('shop-b.myshopify.com')).toEqual([]);
    expect(await engine.getHistory('shop-b.myshopify.com')).toEqual([]);
  });

  test('deletes mappings and history entries and validates input', async () => {
    const mapping = await engine.createMapping('shop.myshopify.com', { sourceField: 'email', targetField: 'contact.email' });
    const history = await engine.addHistory('shop.myshopify.com', { action: 'Enrich' });

    await expect(engine.deleteMapping('shop.myshopify.com', mapping.id)).resolves.toBe(true);
    await expect(engine.deleteHistory('shop.myshopify.com', history.id)).resolves.toBe(true);
    await expect(engine.createMapping('shop.myshopify.com', { sourceField: 'x', targetField: 'y', fieldType: 'unknown' })).rejects.toThrow('unsupported fieldType');
    expect(() => engine.profileDataset('Customers', [])).toThrow('records must contain between 1 and 1,000 objects');
  });
});