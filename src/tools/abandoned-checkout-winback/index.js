// src/tools/abandoned-checkout-winback/index.js
// ===============================================
// AURA • Abandoned Checkout Winback (rule-based)
// ===============================================

const key = "abandoned-checkout-winback";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const store = input.storeName || "our store";

  const flow = [
    {
      step: 1,
      delayHours: 1,
      channel: "email",
      subject: "You left something behind",
      angle: "soft reminder",
    },
    {
      step: 2,
      delayHours: 24,
      channel: "email",
      subject: "Still thinking it over?",
      angle: "social proof",
    },
    {
      step: 3,
      delayHours: 72,
      channel: "email",
      subject: "Your cart at " + store,
      angle: "final reminder / scarcity",
    },
  ];

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Abandoned checkout flow outline generated.",
    input,
    output: {
      flow,
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

module.exports = { key, run };
