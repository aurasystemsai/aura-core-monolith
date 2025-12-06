// src/tools/ai-alt-text-engine/index.js
// -------------------------------------
// Simple rules-based alt text generator (no AI)
// -------------------------------------------

function safe(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

module.exports = {
  key: "ai-alt-text-engine",
  name: "AURA Alt Text Engine",

  async run(input = {}, ctx = {}) {
    const productName = safe(input.product_name || input.name);
    const material = safe(input.material);
    const color = safe(input.color || input.colour);
    const useCase = safe(input.use_case || input.usage || input.occasion);
    const brand = safe(input.brand || input.store_name);

    const bits = [];

    if (brand) bits.push(brand);
    if (productName) bits.push(productName);
    if (color) bits.push(color);
    if (material) bits.push(material);
    if (useCase) bits.push(`for ${useCase}`);

    const coreAlt = bits.filter(Boolean).join(" – ") || "Product image";
    const variant = safe(input.variant || input.angle || input.view || "");

    const baseAlt = variant ? `${coreAlt} (${variant})` : coreAlt;

    // If multiple images: generate numbered variants.
    const count = Number(input.num_images || input.images_count || 1) || 1;
    const alts = [];

    for (let i = 1; i <= count; i += 1) {
      if (count === 1) {
        alts.push(baseAlt);
      } else {
        alts.push(`${baseAlt} – view ${i}`);
      }
    }

    return {
      ok: true,
      tool: "ai-alt-text-engine",
      alts,
      primary_alt: alts[0],
      meta: {
        productName,
        material,
        color,
        useCase,
        brand,
        count,
      },
    };
  },
};
