// src/tools/finance-autopilot/index.js
// ===============================================
// AURA • Finance Autopilot (rule-based)
// ===============================================

const key = "finance-autopilot";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const revenue = Number(input.revenue || 10000);
  const cogs = Number(input.cogs || revenue * 0.4);
  const marketing = Number(input.marketing || revenue * 0.15);
  const overheads = Number(input.overheads || revenue * 0.2);

  const grossProfit = revenue - cogs;
  const operatingProfit = grossProfit - marketing - overheads;
  const margin = revenue ? Math.round((operatingProfit / revenue) * 100) : 0;

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Finance snapshot generated.",
    input,
    output: {
      revenue,
      cogs,
      marketing,
      overheads,
      grossProfit,
      operatingProfit,
      operatingMarginPercent: margin,
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

const meta = { id: key, name: "Finance Autopilot", description: "Automated finance snapshot and margin analysis." };
module.exports = { key, run, meta };
