// src/tools/review-ugc-engine/index.js
// ===============================================
// AURA • Review & UGC Engine (rule-based)
// ===============================================

const key = "review-ugc-engine";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const product = input.productTitle || "this product";
  const store = input.storeName || "our store";

  const prompts = [
    `What do you love most about ${product}?`,
    `How does ${product} fit into your everyday routine?`,
    `Would you recommend ${product} from ${store} to a friend? Why?`,
  ];

  const subjectLines = [
    `Quick favour? Review your ${product}`,
    `How are you getting on with ${product}?`,
  ];

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Review & UGC prompts generated.",
    input,
    output: {
      reviewEmailSubjectLines: subjectLines,
      reviewQuestions: prompts,
      discountIncentive: input.discountIncentive || "10% off next order",
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

const meta = { id: key, name: "Review UGC Engine", description: "Generates review prompts and UGC questions." };
module.exports = { key, run, meta };
