// src/tools/product-seo/index.js
// ===============================================
// AURA • Product SEO Engine  (dummy implementation)
// - Takes product info and returns SEO copy
// - No OpenAI required (pure template logic)
// ===============================================

function safeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}

module.exports = {
  key: "product-seo",
  name: "AURA • Product SEO Engine",

  /**
   * run(input, ctx)
   * input: {
   *   product_name,
   *   collection,
   *   features: string[] | string,
   *   tone,
   *   target_keywords: string[] | string
   * }
   */
  async run(input = {}, ctx = {}) {
    const productName = (input.product_name || input.name || "").trim() || "Your Product";
    const collection = (input.collection || "").trim();
    const tone = (input.tone || "neutral, ecommerce").trim();

    const features = safeArray(input.features);
    const keywords = safeArray(input.target_keywords);

    const titleParts = [productName];
    if (keywords[0]) titleParts.push(`– ${keywords[0]}`);
    const metaTitle = titleParts.join(" ");

    const metaDescription = [
      collection ? `${collection}:` : "",
      productName,
      features.length ? `featuring ${features.join(", ")}.` : "",
      keywords.length ? ` Optimised for: ${keywords.join(", ")}.` : "",
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const h1 = productName;

    const bulletPoints = [
      ...features.map((f) => `• ${f}`),
      keywords.length ? `• Optimised for searches like: ${keywords.join(", ")}` : null,
      `• Tone: ${tone}`,
    ].filter(Boolean);

    const bodyCopy = [
      `${productName} is designed for modern customers who expect style **and** performance.`,
      features.length
        ? `Key benefits include ${features
            .map((f) => f.toLowerCase())
            .join(", ")} – making this an ideal choice for daily wear.`
        : "",
      keywords.length
        ? `This description is tuned around search phrases such as ${keywords.join(", ")} to help you attract more qualified traffic.`
        : "",
      "Update your product gallery with lifestyle imagery and clear close-ups to maximise conversion.",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ok: true,
      engine: "product-seo",
      meta: {
        title: metaTitle,
        description: metaDescription,
        h1,
        tone,
      },
      seo: {
        title: metaTitle,
        description: metaDescription,
        h1,
        keywords,
      },
      bullets: bulletPoints,
      body: bodyCopy,
      raw_input: input,
    };
  },
};
