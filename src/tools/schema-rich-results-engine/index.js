// src/tools/schema-rich-results-engine/index.js
// ===============================================
// AURA • Schema / Rich Results Engine (rule-based)
// ===============================================

const key = "schema-rich-results-engine";

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
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const type = input.type || "Product";
  const url = input.url || "https://example.com";
  const name = input.name || input.productTitle || "Item";

  const base = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#${type.toLowerCase()}`,
    "url": url,
    "name": name,
    "description": input.productDescription || "",
    "sku": input.handle || "",
    "tags": input.tags || [],
    "collections": input.collections || [],
    "metafields": input.metafields || {},
    "locale": input.locale || "en-GB",
  };

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Schema snippet generated (rule-based).",
    input,
    output: {
      jsonLd: base,
      pretty: JSON.stringify(base, null, 2),
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

// CLI/test runner
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--help') {
    console.log(`\nSchema Rich Results Engine CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify product data\n--help      Show this help message\n`);
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
