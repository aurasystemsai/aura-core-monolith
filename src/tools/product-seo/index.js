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

Your job is to write search-optimised product SEO for organic Google results.
Write in clear, natural UK English. Avoid clickbait, all-caps and emojis.

Optimise for: high click-through rate, strong keyword relevance and clear value.

Follow these rules carefully:

1) PRODUCT SEO TITLE
- Aim for roughly 45–60 characters.
- Put the main product keyword near the beginning.
- Include 1–2 key benefits or materials (e.g. waterproof, gold plated, adjustable).
- If a brand name is given, mention it near the end (e.g. "– DTP Jewellery").
- Do NOT include quotation marks around the title.

2) META DESCRIPTION
- Aim for roughly 130–155 characters.
- Summarise what it is, the main benefits and when to wear it.
- Mention materials, finish or special properties (e.g. sweat-proof, hypoallergenic).
- Include at least one use case or occasion from the input (gym, gifting, everyday wear, etc.).
- Encourage the click but do NOT use spammy phrases like "Click now" or "Best ever".

3) URL SLUG / HANDLE
- Lowercase.
- Hyphen separated.
- No brand name, no stop-words like "the" or "and" unless needed.
- Keep it short but descriptive (3–7 words).

4) KEYWORD SET
- 5–10 search phrases.
- Mix of short-tail and long-tail.
- Include material, style and use cases where relevant.
- Focus on how real shoppers would search for this product.

INPUT:
Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Use cases: ${Array.isArray(useCases) ? useCases.join(", ") : useCases}

Return STRICT JSON only in this exact shape:

{
  "title": "…",
  "metaDescription": "…",
  "slug": "…",
  "keywords": ["…", "…"]
}
`.trim();

  // -------------------------------
  // OpenAI call with safe fallback
  // -------------------------------
  let raw;

  try {
    // Try modern Responses API with JSON mode
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json_object" },
    });

    raw =
      resp &&
      resp.output &&
      resp.output[0] &&
      resp.output[0].content &&
      resp.output[0].content[0] &&
      resp.output[0].content[0].text &&
      resp.output[0].content[0].text.value;
  } catch (err) {
    // Fallback for environments / SDK versions where Responses API
    // or response_format is not supported
    console.warn(
      "[product-seo] Responses API failed, falling back to chat.completions:",
      err.message
    );

    const legacy = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    raw =
      legacy &&
      legacy.choices &&
      legacy.choices[0] &&
      legacy.choices[0].message &&
      legacy.choices[0].message.content;
  }

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
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
