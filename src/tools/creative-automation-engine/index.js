// src/tools/creative-automation-engine/index.js
// ---------------------------------------------
// Generates simple ad creative outlines
// ---------------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "creative-automation-engine",
  name: "Creative Automation Engine",

  async run(input = {}, ctx = {}) {
    const product = safe(input.product_name || "your product");
    const angle = safe(input.angle || "conversion");
    const platform = safe(input.platform || "facebook");

    const hooks = [
      `Struggling with ${safe(input.problem || "X")}?`,
      `What if ${product} could solve it in 24 hours?`,
      `Why ${product} customers don’t worry about ${safe(
        input.problem || "that problem"
      )} anymore.`,
    ];

    const structures = [
      {
        format: "UGC talking head",
        steps: [
          "Hook line in first 3 seconds.",
          "Short problem story.",
          `Introduce ${product} as the solution.`,
          "Show 2–3 quick benefits.",
          "Strong CTA with offer.",
        ],
      },
      {
        format: "Product demo",
        steps: [
          "Visual before/after.",
          `Close-up of ${product} in use.`,
          "Overlay key benefits.",
          "Social proof (review screenshot).",
          "CTA frame.",
        ],
      },
    ];

    return {
      ok: true,
      tool: "creative-automation-engine",
      product_name: product,
      angle,
      platform,
      hooks,
      structures,
    };
  },
};
