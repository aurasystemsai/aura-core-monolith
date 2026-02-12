const sampleRule = {
  name: 'Set base price',
  scope: 'global',
  status: 'published',
  priority: 10,
  actions: [{ type: 'set-price', value: 100 }]
};

const sampleSignals = [
  { type: 'demand', value: 1.1 },
  { type: 'inventory', value: 120 }
];

const priceRequest = {
  basePrice: 100,
  currency: 'USD',
  rounding: 'none',
  guardrails: { floor: 80, ceiling: 120 }
};

module.exports = {
  sampleRule,
  sampleSignals,
  priceRequest
};
