const ledger = require('../core/creditLedger');

describe('credit pricing follows real model cost', () => {
  it('keeps the cheapest model at 1x and scales dearer models by real price', () => {
    expect(ledger.MODEL_MULTIPLIERS['gpt-4o-mini']).toBe(1);
    expect(ledger.MODEL_MULTIPLIERS['gpt-4o']).toBeGreaterThan(10);
    expect(ledger.MODEL_MULTIPLIERS['gpt-4']).toBeGreaterThan(ledger.MODEL_MULTIPLIERS['gpt-4o']);
    expect(ledger.MODEL_MULTIPLIERS['dall-e-3']).toBe(1);
  });
  it('charges more credits for dearer models and knows its own cost', () => {
    expect(ledger.getEffectiveCost('blog-draft', 'gpt-4o-mini')).toBe(3);
    expect(ledger.getEffectiveCost('blog-draft', 'gpt-4o')).toBeGreaterThan(30);
    expect(ledger.getEffectiveCost('blog-draft', 'gpt-4o-2024-08-06')).toBe(ledger.getEffectiveCost('blog-draft', 'gpt-4o'));
    expect(ledger.estimateCostUsd('blog-draft', 'gpt-4o-mini')).toBeGreaterThan(0);
    expect(ledger.estimateCostUsd('blog-draft', 'unknown-model')).toBeNull();
  });
});