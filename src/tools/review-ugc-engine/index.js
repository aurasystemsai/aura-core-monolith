// src/tools/review-ugc-engine/index.js
// ===============================================
// AURA • Review & UGC Engine (rule-based)
// ===============================================

const key = "review-ugc-engine";

const exampleInput = {
  productTitle: "Gold Vermeil Huggie Earrings",
  storeName: "AURA Demo Store",
  handle: "gold-vermeil-huggie-earrings",
  tags: ["gold", "earrings", "jewellery"],
  collections: ["earrings", "best-sellers"],
  metafields: { "material": "gold vermeil", "feature": "hypoallergenic" },
  locale: "en-GB",
  discountIncentive: "15% off next order"
};

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

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--help') {
    console.log(`\nReview UGC Engine CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify product data\n--help      Show this help message\n`);
    process.exit(0);
  }
  const testInput = arg === '--example' ? exampleInput : {};
  run(testInput).then(res => {
    console.log(JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { key, run, exampleInput };
