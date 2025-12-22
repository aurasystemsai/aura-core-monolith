// src/tools/internal-link-optimizer/index.js
// ===============================================
// AURA • Internal Link Optimiser (rule-based)
// ===============================================

const key = "internal-link-optimizer";

const exampleInput = {
  url: "https://shopify-demo.myshopify.com/products/gold-vermeil-huggie-earrings",
  productTitle: "Gold Vermeil Huggie Earrings",
  relatedUrls: [
    "https://shopify-demo.myshopify.com/products/silver-huggie-earrings",
    "https://shopify-demo.myshopify.com/products/diamond-huggie-earrings"
  ],
  topic: "Gold Huggie Earrings",
  handle: "gold-vermeil-huggie-earrings",
  tags: ["gold", "earrings", "jewellery"],
  collections: ["earrings", "best-sellers"],
  metafields: { "material": "gold vermeil", "feature": "hypoallergenic" },
  locale: "en-GB"
};

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const pageUrl = input.url || input.pageUrl || "https://example.com/page";
  const related = Array.isArray(input.relatedUrls)
    ? input.relatedUrls
    : [];

  const links = related.slice(0, 10).map((url) => ({
    url,
    anchor: input.topic
      ? `${input.topic} – learn more`
      : "Related product",
    position: "body",
  }));

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Internal link suggestions generated.",
    input,
    output: {
      pageUrl,
      suggestedLinks: links,
      summary: `Suggest linking to ${links.length} related pages from this page.`,
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
    console.log(`\nInternal Link Optimizer CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify product/page data\n--help      Show this help message\n`);
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
