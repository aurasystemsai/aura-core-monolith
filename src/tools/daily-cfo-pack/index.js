// src/tools/daily-cfo-pack/index.js
// ---------------------------------
// Simple finance summary helper
// ---------------------------------

function num(n, fallback = null) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

module.exports = {
  key: "daily-cfo-pack",
  name: "Daily CFO Pack",

  async run(input = {}, ctx = {}) {
    const revenue = num(input.revenue);
    const adSpend = num(input.ad_spend || input.spend);
    const cogs = num(input.cogs);
    const overheads = num(input.overheads);

    const grossProfit =
      revenue != null && cogs != null ? revenue - cogs : null;
    const netProfit =
      grossProfit != null && overheads != null
        ? grossProfit - overheads
        : null;

    return {
      ok: true,
      tool: "daily-cfo-pack",
      metrics: {
        revenue,
        ad_spend: adSpend,
        cogs,
        overheads,
        gross_profit: grossProfit,
        net_profit: netProfit,
      },
    };
  },
};
