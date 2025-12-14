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
 *   useCases: string[]  // e.g. ["gym", "everyday wear", "gifting"]
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

  const useCasesList = Array.isArray(useCases)
    ? useCases.join(", ")
    : String(useCases || "");

  // Base prompt we’ll keep reusing if we need to repair lengths
  const basePrompt = `
You are an ecommerce SEO specialist for a jewellery brand.

Your job is to write finished, search-optimised product SEO that a beginner
can paste straight into Shopify.

Write in clear, natural UK English. Avoid clickbait, all-caps and emojis.
Optimise for: high click-through rate, strong keyword relevance and clear value.

You MUST respect the length rules below. If your draft is outside these ranges,
rewrite it until it fits BEFORE you respond.

HARD LENGTH RULES
-----------------
• Product SEO title: 45–60 characters (inclusive).
• Meta description: 130–155 characters (inclusive).
• Character count includes spaces and punctuation.
• Do NOT mention character counts in the text.
• Only respond when BOTH the title and meta description are within these bands.

GUIDELINES
----------
1) PRODUCT SEO TITLE
• Put the main product keyword near the beginning.
• Include 1–2 key benefits or materials
  (e.g. waterproof, sweat-proof, gold plated, adjustable, hypoallergenic).
• If a brand name is given, mention it near the end (e.g. "– DTP Jewellery").
• No quotation marks around the title.

2) META DESCRIPTION
• Summarise what it is, the main benefits and when to wear it.
• Mention materials, finish or special properties
  (e.g. sweat-proof, hypoallergenic, tarnish-resistant).
• Include at least one use case or occasion from the input
  (e.g. gym, everyday wear, gifting, date night).
• Encourage the click with natural language, not spammy phrases like
  "Click now" or "Best ever".

3) URL SLUG / HANDLE
• Lowercase.
• Hyphen separated.
• No brand name, no stop-words like "the" or "and" unless genuinely needed.
• Keep it short but descriptive (around 3–7 words).

4) KEYWORD SET
• 5–10 search phrases.
• Mix of short-tail and long-tail queries.
• Include material, style and use cases where relevant.
• Focus on how real shoppers would search for this product.

INPUT
-----
Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Use cases: ${useCasesList || "N/A"}

RESPONSE FORMAT
---------------
Return STRICT JSON only in this exact shape:

{
  "title": "…",              // 45–60 characters
  "metaDescription": "…",    // 130–155 characters
  "slug": "…",               // lowercase, hyphen-separated
  "keywords": ["…", "…"]     // 5–10 search phrases
}
`.trim();

  // Helper to call OpenAI Responses API with a given prompt
  async function callOpenAI(promptText) {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: promptText,
    });

    const raw =
      response &&
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
      console.error("Failed to parse JSON from OpenAI response:", err, raw);
      throw new Error("Failed to parse JSON from OpenAI response");
    }

    return { raw, parsed };
  }

  const TITLE_MIN = 45;
  const TITLE_MAX = 60;
  const META_MIN = 130;
  const META_MAX = 155;

  const maxAttempts = 3;
  let attempt = 1;
  let finalParsed = null;

  let promptToUse = basePrompt;

  while (attempt <= maxAttempts) {
    const { raw, parsed } = await callOpenAI(promptToUse);

    const title = parsed.title || "";
    const meta = parsed.metaDescription || "";

    const titleLen = title.length;
    const metaLen = meta.length;

    const titleOk = titleLen >= TITLE_MIN && titleLen <= TITLE_MAX;
    const metaOk = metaLen >= META_MIN && metaLen <= META_MAX;

    if (titleOk && metaOk) {
      finalParsed = parsed;
      break;
    }

    // If we got this far, lengths are wrong – build a repair prompt
    const repairPrompt = `
${basePrompt}

The last attempt produced this JSON:

${raw}

Its lengths were:
- title length: ${titleLen} characters
- metaDescription length: ${metaLen} characters

This does NOT meet the required bands.

Rewrite ONLY the JSON so that:
- "title" length is between ${TITLE_MIN} and ${TITLE_MAX} characters inclusive.
- "metaDescription" length is between ${META_MIN} and ${META_MAX} characters inclusive.

Keep the same general meaning, tone and keywords, just adjust wording to hit the lengths.
Return STRICT JSON only in the same shape.
`.trim();

    promptToUse = repairPrompt;
    attempt += 1;
  }

  if (!finalParsed) {
    throw new Error(
      "Failed to generate SEO fields with correct title/meta lengths after multiple attempts."
    );
  }

  return {
    input,
    output: {
      title: finalParsed.title || "",
      description: finalParsed.metaDescription || "",
      metaDescription: finalParsed.metaDescription || "",
      slug: finalParsed.slug || finalParsed.handle || "",
      keywords: Array.isArray(finalParsed.keywords) ? finalParsed.keywords : [],
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
