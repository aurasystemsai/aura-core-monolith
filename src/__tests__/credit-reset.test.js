const { _needsReset } = require('../core/creditLedger');

describe('credit period reset', () => {
  const old = new Date(Date.now() - 40 * 86400000).toISOString();
  test('free credits never refill', () => { expect(_needsReset({ plan: 'free', period_start: old })).toBe(false); });
  test('paid plans refill after 30 days', () => { expect(_needsReset({ plan: 'professional', period_start: old })).toBe(true); });
  test('fresh paid period does not refill', () => { expect(_needsReset({ plan: 'professional', period_start: new Date().toISOString() })).toBe(false); });
});
