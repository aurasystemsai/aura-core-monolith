// src/tools/image-alt-media-seo/index.js
// ===============================================
// AURA • Image Alt / Media SEO (rule-based)
// ===============================================

const key = "image-alt-media-seo";

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

module.exports = { key, run };
