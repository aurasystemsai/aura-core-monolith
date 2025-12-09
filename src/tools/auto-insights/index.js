// src/tools/auto-insights/index.js
// ===============================================
// AURA • Auto Insights (rule-based)
// ===============================================

const key = "auto-insights";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const metric = input.metric || "revenue";
  const trend = input.trend || "flat";

  const insight =
    trend === "up"
      ? `${metric} is trending up – double down on what's working.`
      : trend === "down"
      ? `${metric} is trending down – investigate causes and run tests.`
      : `${metric} is flat – consider new tests or offers.`;

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "High-level insight generated.",
    input,
    output: {
      metric,
      trend,
      insight,
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

module.exports = { key, run };
