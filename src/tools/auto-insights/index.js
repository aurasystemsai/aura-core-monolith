// src/tools/auto-insights/index.js
// ---------------------------------
// Turns simple metric inputs into quick insights
// ---------------------------------

function num(n, fallback = null) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

module.exports = {
  key: "auto-insights",
  name: "AURA Auto Insights",

  async run(input = {}, ctx = {}) {
    const sessions = num(input.sessions);
    const revenue = num(input.revenue);
    const spend = num(input.ad_spend || input.spend);
    const orders = num(input.orders);

    const insights = [];

    if (sessions && orders) {
      const conv = (orders / sessions) * 100;
      insights.push(`Conversion rate: ${conv.toFixed(2)}%`);
      if (conv < 1.0) {
        insights.push("Conversion is low – focus on product page and checkout UX.");
      } else if (conv > 3) {
        insights.push("Conversion looks healthy – test increasing traffic and AOV.");
      }
    }

    if (revenue && orders) {
      const aov = revenue / orders;
      insights.push(`Average order value: ${aov.toFixed(2)}`);
    }

    if (revenue && spend) {
      const roas = revenue / spend;
      insights.push(`Blended ROAS: ${roas.toFixed(2)}x`);
    }

    if (insights.length === 0) {
      insights.push("Not enough numeric data to generate insights.");
    }

    return {
      ok: true,
      tool: "auto-insights",
      metrics: { sessions, revenue, spend, orders },
      insights,
    };
  },
};
