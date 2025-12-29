// src/tools/ai-alt-text-engine/index.js
// ===============================================
// AURA • AI Alt-Text Engine (rule-based)
// ===============================================

const key = "ai-alt-text-engine";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const imageUrl = input.imageUrl || input.url || "";
  const productTitle =
    input.productTitle || input.title || "Product photo";
  const handle = input.productHandle || input.slug || "";

  const altPieces = [
    productTitle,
    input.colour || input.color,
    input.material,
    input.style,
  ]
    .filter(Boolean)
    .join(", ");

  const altText =
    altPieces ||
    "High quality product image for ecommerce listing.";

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "AI Alt-Text Engine ran successfully (rule-based).",
    input,
    output: {
      imageUrl,
      altText,
      suggestions: [
        altText,
        `${productTitle} on neutral background`,
        `${productTitle} close-up product image`,
      ],
      handle,
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

const meta = { id: key, name: "AI Alt-Text Engine", description: "Generates alt text for product images." };
module.exports = { key, run, meta };
