const key = "rank-visibility-tracker";

const exampleInput = {
  productTitle: "Gold Vermeil Huggie Earrings",
  handle: "gold-vermeil-huggie-earrings",
  tags: ["gold", "earrings", "jewellery"],
  collections: ["earrings", "best-sellers"],
  metafields: { "material": "gold vermeil", "feature": "hypoallergenic" },
  locale: "en-GB",
  keywords: ["gold earrings", "huggie hoops", "jewellery"]
};

async function run(input = {}, ctx = {}) {
  const env = (ctx.env && ctx.env.NODE_ENV) || "development";

  // Placeholder: echo input for now
  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Rank & Visibility Tracker ran successfully (placeholder implementation).",
    input,
    output: {
      trackedKeywords: input.keywords || [],
      currentRankings: [],
      notes: "Add real rank tracking integration here."
    }
  };
}

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--help') {
    console.log(`\nRank Visibility Tracker CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify product data\n--help      Show this help message\n`);
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
