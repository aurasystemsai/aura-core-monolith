// src/tools/image-alt-media-seo/index.js
// ===============================================
// AURA • Image Alt / Media SEO (rule-based)
// ===============================================

const key = "image-alt-media-seo";

const exampleInput = {
  productTitle: "Gold Vermeil Huggie Earrings",
  items: [
    { imageUrl: "https://cdn.shopify.com/s/files/1/0000/0001/products/gold-huggie-1.jpg", title: "Gold Huggie Earrings", role: "gallery" },
    { imageUrl: "https://cdn.shopify.com/s/files/1/0000/0001/products/gold-huggie-2.jpg", title: "Gold Huggie Earrings Side", role: "gallery" }
  ],
  handle: "gold-vermeil-huggie-earrings",
  tags: ["gold", "earrings", "jewellery"],
  collections: ["earrings", "best-sellers"],
  metafields: { "material": "gold vermeil", "feature": "hypoallergenic" },
  locale: "en-GB"
};

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const items = Array.isArray(input.items) ? input.items : [input].filter(Boolean);

  const media = items.map((item, idx) => {
    const url = item.imageUrl || item.url || "";
    const title = item.title || input.productTitle || `Media asset ${idx + 1}`;
    const role = item.role || "gallery";
    const altText = `${title} – ecommerce product media (${role}).`;

    return {
      url,
      role,
      altText,
      recommendedFilename: url
        ? url.split("/").pop()
        : `media-${idx + 1}.jpg`,
    };
  });

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Image alt / media SEO recommendations generated.",
    input,
    output: {
      media,
      total: media.length,
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
    console.log(`\nImage Alt Media SEO CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify product media\n--help      Show this help message\n`);
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
