const key = "on-page-seo-engine";

// Example Shopify product input for testing
const exampleInput = {
  productTitle: "Gold Vermeil Huggie Earrings",
  productDescription: "Classic gold huggie hoops, perfect for everyday wear. Hypoallergenic, water-safe, and tarnish-resistant.",
  handle: "gold-vermeil-huggie-earrings",
  tags: ["gold", "earrings", "jewellery"],
  collections: ["earrings", "best-sellers"],
  metafields: { "material": "gold vermeil", "feature": "hypoallergenic" },
  locale: "en-GB"
};

async function run(input = {}, ctx = {}) {
  const env = (ctx.env && ctx.env.NODE_ENV) || "development";

  // Placeholder: echo input for now
  return {
    ok: true,
    tool: key,
    message: "On-Page SEO Engine ran successfully (placeholder implementation).",
    environment: env,
    input,
    output: {
      recommendedImprovements: [
        "Add more internal links to related products.",
        "Ensure all images have descriptive alt text.",
        "Optimize headings for target keywords."
      ],
      ...input
    }
  };
}

// CLI/test runner
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--help') {
    console.log(`\nOn-Page SEO Engine CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify product data\n--help      Show this help message\n`);
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
