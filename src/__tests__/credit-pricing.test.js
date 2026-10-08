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

  it('has no unlimited plan: enterprise gets a big allowance and is still charged', async () => {
    const os = require('os'); const path = require('path'); const fs = require('fs');
    expect(ledger.PLAN_CREDITS.enterprise).toBeGreaterThan(ledger.PLAN_CREDITS.pro);
    expect(Object.values(ledger.PLAN_CREDITS).every((n) => n > 0)).toBe(true);
    const shop = `ent-${Date.now()}.myshopify.com`;
    await ledger.updatePlan(shop, 'enterprise');
    const before = (await ledger.getCreditStatus(shop)).balance;
    const d = await ledger.deductCredits(shop, 'sms-send', { quantity: 10 });
    expect(d).toMatchObject({ ok: true, cost: 50, unlimited: false });
    expect((await ledger.getCreditStatus(shop)).balance).toBe(before - 50);
  });});