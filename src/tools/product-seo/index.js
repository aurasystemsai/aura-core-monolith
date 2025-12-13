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

  // Use the Responses API – no response_format, just strict JSON via prompt
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  // Try to safely extract the text payload from different possible shapes
  let raw = "";

  try {
    const output0 = response.output && response.output[0];

    if (
      output0 &&
      Array.isArray(output0.content) &&
      output0.content[0] != null
    ) {
      const content0 = output0.content[0];

      // Newer SDKs: content0.text may be a string
      if (typeof content0.text === "string") {
        raw = content0.text;
      }
      // Older / current shape: content0.text.value is the string
      else if (
        content0.text &&
        typeof content0.text.value === "string"
      ) {
        raw = content0.text.value;
      }
      // Fallback: content0 itself is a string
      else if (typeof content0 === "string") {
        raw = content0;
      }
    }

    // Some SDKs expose a convenience field
    if (!raw && typeof response.output_text === "string") {
      raw = response.output_text;
    }
  } catch (e) {
    // Leave raw as "" – we'll throw a clear error below
  }

  if (!raw || !raw.trim()) {
    throw new Error("OpenAI response missing text payload");
  }

  raw = raw.trim();

  // Ensure we are parsing a clean JSON object (defensive in case of stray text)
  let jsonString = raw;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = raw.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
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
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
