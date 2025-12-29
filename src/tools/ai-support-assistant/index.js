// src/tools/ai-support-assistant/index.js
// ===============================================
// AURA • AI Support Assistant (rule-based)
// ===============================================

const key = "ai-support-assistant";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const commonTopics = [
    "shipping",
    "returns",
    "order status",
    "product care",
  ];

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Support macros & FAQ topics generated.",
    input,
    output: {
      faqTopics: commonTopics,
      macros: [
        {
          id: "shipping-times",
          title: "Shipping times",
          body: "Orders are processed within 1–2 business days...",
        },
      ],
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

const meta = { id: key, name: "AI Support Assistant", description: "Generates support macros and FAQ topics." };
module.exports = { key, run, meta };
