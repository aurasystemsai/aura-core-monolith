// src/tools/daily-cfo-pack/index.js
// ===============================================
// AURA • Daily CFO Pack (rule-based)
// ===============================================

const key = "daily-cfo-pack";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Daily CFO summary generated (template).",
    input,
    output: {
      kpis: [
        { name: "Revenue (yesterday)", value: input.revenueYesterday || 0 },
        { name: "Orders (yesterday)", value: input.ordersYesterday || 0 },
        { name: "AOV (yesterday)", value: input.aovYesterday || 0 },
      ],
      alerts: [],
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

const meta = { id: key, name: "Daily CFO Pack", description: "Daily CFO summary and KPIs." };
module.exports = { key, run, meta };
