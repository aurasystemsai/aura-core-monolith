// src/tools/product-seo/index.js
// ===============================================
// AURA • Product SEO Engine (rule-based)
// ===============================================

function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function truncate(str = "", max = 155) {
  const s = String(str).trim();
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

const key = "product-seo";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const title =
    input.productTitle || input.title || input.name || "Untitled product";
  const brand = input.brand || "Your brand";
  const collection = input.collection || input.category || "";
  const baseDesc =
    input.productDescription ||
    input.description ||
    "High quality product from " + brand + ".";
  const handle =
    input.handle ||
    input.productHandle ||
    slugify(`${brand} ${title}`) ||
    "product";

  // SEO title (keep ~60 chars)
  let seoTitle = `${title} | ${brand}`;
  if (seoTitle.length > 60) seoTitle = `${title} – ${brand}`;

  // Meta description (~155 chars)
  const benefitKeywords =
    (input.keywords && input.keywords.join(", ")) ||
    [collection, brand, "online"].filter(Boolean).join(", ");

  const metaDescription = truncate(
    `${baseDesc.replace(/\s+/g, " ")} ` +
      (benefitKeywords ? `Perfect for ${benefitKeywords}.` : ""),
    155
  );

  const canonicalUrl =
    input.url ||
    input.productUrl ||
    `https://example.com/products/${handle}`;

  const searchKeywords = Array.from(
    new Set(
      (input.keywords || [])
        .concat([
          title,
          brand,
          collection,
          "buy online",
          "free shipping",
          "best price",
        ])
        .filter(Boolean)
        .map((k) => String(k).toLowerCase())
    )
  );

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Product SEO recommendations generated (rule-based).",
    input,
    output: {
      handle,
      seoTitle,
      metaTitle: seoTitle,
      metaDescription,
      h1: title,
      canonicalUrl,
      searchKeywords,
      breadcrumb: [
        "Home",
        collection || "Collection",
        title,
      ].filter(Boolean),
      schema: {
        "@type": "Product",
        "name": title,
        "brand": brand,
        "url": canonicalUrl,
      },
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

module.exports = { key, run };
