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
    "Generate SEO titles, meta descriptions, slugs and keyword sets for ecommerce products.",
  version: "1.1.0",
};

/**
 * input: {
 *   productTitle: string
 *   productDescription: string
 *   brand: string
 *   tone: string
 *   useCases: string[] | string
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

  // Normalise useCases into a comma-separated string for the prompt
  const useCasesText = Array.isArray(useCases)
    ? useCases.join(", ")
    : String(useCases || "");

  // -------------------------------------------------
  // Prompt tuned to drive towards 100/100 in our UI:
  // Title: 45–60 chars (ideally 52–58)
  // Meta: 130–155 chars (ideally 140–150)
  // -------------------------------------------------
  const prompt = `
You are an ecommerce SEO specialist for a modern jewellery brand.

Your job is to write search-optimised product SEO for organic Google results.
Write in clear, natural UK English. Avoid clickbait, all-caps and emojis.

The client's internal scoring system rewards:
- Product SEO title between 45–60 characters, best around 52–58.
- Meta description between 130–155 characters, best around 140–150.

Optimise for: high click-through rate, strong keyword relevance and clear value.
Focus on realistic, human-sounding copy that would win clicks in Google results.

Follow these rules carefully:

1) PRODUCT SEO TITLE
- Aim for 52–58 characters where possible (always between 45–60).
- Put the main product keyword near the beginning.
- Include 1–2 key benefits or materials (e.g. waterproof, gold plated, adjustable).
- If a brand name is given, mention it at the end (e.g. "– DTP Jewellery").
- Do NOT use quotation marks around the title.
- Do NOT stuff random keywords; it must read like a real title.

2) META DESCRIPTION
- Aim for 140–150 characters where possible (always between 130–155).
- Summarise what it is, main benefits and when to wear it.
- Mention materials, finish or special properties (e.g. sweat-proof, hypoallergenic).
- Include at least one use case or occasion from the input (gym, gifting, everyday wear, etc.).
- Encourage the click with calm, confident language – no spammy phrases like
  "Click now", "Best ever", "Limited time only", etc.

3) URL SLUG / HANDLE
- Lowercase.
- Hyphen separated.
- No brand name.
- Avoid stop words like "the" or "and" unless they are really needed.
- Keep it short but descriptive (about 3–7 words).

4) KEYWORD SET
- 5–10 realistic search phrases.
- Mix of short-tail and long-tail queries.
- Include material, style and use cases where relevant.
- Focus on how real shoppers would actually search for this product.

INPUT:
Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Use cases: ${useCasesText || "N/A"}

Return STRICT JSON only in this exact shape, with no extra text:

{
  "title": "SEO product title here",
  "metaDescription": "Meta description here",
  "slug": "url-slug-here",
  "keywords": ["keyword one", "keyword two", "keyword three"]
}
`.trim();

  // -------------------------------------------------
  // Call OpenAI Responses API
  // Use output_text helper so we don't depend on internal structure.
  // -------------------------------------------------
  let raw;
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    // New SDKs expose a convenience string with all text output merged.
    raw = response.output_text;

    if (!raw || typeof raw !== "string") {
      throw new Error("OpenAI response missing text payload");
    }
  } catch (err) {
    // Surface a cleaner error message to the console UI
    console.error("Product SEO Engine — OpenAI error:", err);
    throw new Error(
      `Failed to call OpenAI for Product SEO Engine: ${
        err?.message || "unknown error"
      }`
    );
  }

  // -------------------------------------------------
  // Parse JSON from the model
  // -------------------------------------------------
  let parsed;
  try {
    // In case the model wraps JSON with explanation (it shouldn't, but be safe),
    // try to extract the first JSON object substring.
    let jsonText = raw.trim();

    if (!jsonText.startsWith("{")) {
      const firstBrace = jsonText.indexOf("{");
      const lastBrace = jsonText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }
    }

    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error("Product SEO Engine — JSON parse error. Raw text:", raw);
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  // Normalise output so the console is always safe to render
  const normalised = {
    title: parsed.title || "",
    metaDescription: parsed.metaDescription || "",
    slug: parsed.slug || parsed.handle || "",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
  };

  return {
    input,
    output: {
      title: normalised.title,
      description: normalised.metaDescription,
      metaDescription: normalised.metaDescription,
      slug: normalised.slug,
      keywords: normalised.keywords,
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
