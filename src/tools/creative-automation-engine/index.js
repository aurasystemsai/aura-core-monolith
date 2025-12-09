// src/tools/creative-automation-engine/index.js
// ===============================================
// AURA • Creative Automation Engine (rule-based)
// ===============================================

const key = "creative-automation-engine";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const product = input.productTitle || input.offer || "your offer";
  const audience = input.targetAudience || "your ideal customer";

  const hooks = [
    `Stop scrolling if you love ${product}`,
    `${product} without the usual compromise`,
    `The ${product} upgrade ${audience} have been asking for`,
  ];

  const angles = [
    "Pain / problem focused",
    "Lifestyle / aspiration",
    "Proof / results driven",
  ];

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Creative hooks & angles generated.",
    input,
    output: {
      hooks,
      angles,
      shortCaptions: hooks.map((h) => h + ". Tap to learn more."),
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

module.exports = { key, run };
