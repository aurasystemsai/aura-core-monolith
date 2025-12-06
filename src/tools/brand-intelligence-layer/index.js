// src/tools/brand-intelligence-layer/index.js
// -------------------------------------------
// Stores a lightweight brand profile and guidelines
// -------------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "brand-intelligence-layer",
  name: "Brand Intelligence Layer",

  async run(input = {}, ctx = {}) {
    const brand = safe(input.brand || input.store_name || "Brand");
    const tone = safe(input.tone || "friendly, direct");
    const audience = safe(input.audience || "modern ecommerce shoppers");
    const valueProps =
      input.value_props ||
      input.value_propositions || [
        "High quality",
        "Fast shipping",
        "Great support",
      ];

    return {
      ok: true,
      tool: "brand-intelligence-layer",
      brand,
      tone,
      audience,
      value_props: valueProps,
      guidelines: [
        `Write in a ${tone} tone.`,
        "Keep sentences clear and concise.",
        "Highlight 1–3 key benefits, not just features.",
        "Always include a clear call to action.",
      ],
    };
  },
};
