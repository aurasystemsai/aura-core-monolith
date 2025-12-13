// src/tools/product-seo/index.js
// ----------------------------------------
// Product SEO Engine tool for AURA Core
// ----------------------------------------

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, descriptions, slugs and keyword sets for products.",
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
    useCases = [],
  } = input || {};

  if (!productTitle || !productDescription) {
    throw new Error("productTitle and productDescription are required");
  }

  const prompt = `
You are an ecommerce SEO specialist for a jewellery brand.

Write:
1) A product SEO title (aim for 48–58 characters).
2) A meta description (aim for 135–155 characters).
3) A URL slug/handle (kebab-case, lowercase).
4) A focused keyword set (5–10 phrases, comma-separated).

Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Use cases: ${Array.isArray(useCases) ? useCases.join(", ") : useCases}

Return STRICT JSON only in this shape (no extra text):

{
  "title": "…",
  "metaDescription": "…",
  "slug": "…",
  "keywords": ["…", "…"]
}
`.trim();

  // NOTE: Responses API now uses text.format instead of response_format
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.3,
    max_output_tokens: 400,
    text: {
      format: { type: "json_object" },
    },
  });

  // Try to pull the JSON string out of the Responses API structure
  const raw =
    response?.output?.[0]?.content?.[0]?.text?.value ||
    response?.output_text ||
    null;

  if (!raw) {
    throw new Error("OpenAI response missing text payload");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse JSON from OpenAI response:", raw);
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  return {
    input,
    output: {
      title: parsed.title || "",
      description: parsed.metaDescription || "",
      metaDescription: parsed.metaDescription || "",
      slug: parsed.slug || parsed.handle || "",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
