// src/tools/dynamic-pricing-engine/index.js
// -----------------------------------------
// Basic pricing suggestions based on margin targets
// -----------------------------------------

function num(n, fallback = null) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

module.exports = {
  key: "dynamic-pricing-engine",
  name: "Dynamic Pricing Engine",

  async run(input = {}, ctx = {}) {
    const cost = num(input.unit_cost);
    const targetMargin = num(input.target_margin_pct || 70);
    const currentPrice = num(input.current_price);

    let suggestedPrice = null;
    if (cost != null && targetMargin != null) {
      suggestedPrice = cost / (1 - targetMargin / 100);
    }

    return {
      ok: true,
      tool: "dynamic-pricing-engine",
      input: { cost, target_margin_pct: targetMargin, current_price: currentPrice },
      suggestion: {
        suggested_price: suggestedPrice,
      },
    };
  },
};
