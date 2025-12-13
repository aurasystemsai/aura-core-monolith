// src/tools/product-seo/index.js
// ----------------------------------------
// Product SEO Engine tool for AURA Core
// ----------------------------------------

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.meta = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, descriptions, slugs and keyword sets for products."
};

/**
 * input: {
 *   productTitle: string
 *   productDescription: string
 *   brand: string
 *   tone: string
 *   useCases: string[]
 * }
 */
exports.run = async function run(input, ctx = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in your Render environment."
    );
  }

  const {
    productTitle = "",
    productDescription = "",
    brand = "",
    tone = "",
    useCases = []
  } = input || {};

  if (!productTitle || !productDescription) {
    throw new Error("productTitle and productDescription are required");
  }

  const prompt = `
You are an ecommerce SEO specialist for a jewellery brand.

Write:
1) A product SEO title (max ~60 chars)
2) A meta description (130–155 chars)
3) A URL slug/handle
4) A focused keyword set (5–10 phrases, comma-separated)

Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Use cases: ${Array.isArray(useCases) ? useCases.join(", ") : useCases}

Return STRICT JSON only in this shape:

{
  "title": "…",
  "metaDescription": "…",
  "slug": "…",
  "keywords": ["…", "…"]
}
`.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    response_format: { type: "json_object" }
  });

  const raw =
    response.output &&
    response.output[0] &&
    response.output[0].content &&
    response.output[0].content[0] &&
    response.output[0].content[0].text &&
    response.output[0].content[0].text.value;

  if (!raw) {
    throw new Error("OpenAI response missing text payload");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  return {
    input,
    output: {
      title: parsed.title || "",
      description: parsed.metaDescription || "",
      metaDescription: parsed.metaDescription || "",
      slug: parsed.slug || parsed.handle || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : []
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown"
  };
};
