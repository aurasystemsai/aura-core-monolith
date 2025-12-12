// src/tools/product-seo/index.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Product SEO Engine
 * Generate SEO title, description, slug, and keywords for a product.
 * Input example:
 * {
 *   "productTitle": "Waterproof layered necklace",
 *   "brand": "DTP Jewellry",
 *   "collections": ["Necklaces", "Gold", "Waterproof"],
 *   "toneOfVoice": "confident, modern, UK English"
 * }
 */
export async function run(input) {
  const {
    productTitle = "",
    brand = "",
    collections = [],
    toneOfVoice = "professional, UK English"
  } = input || {};

  const prompt = `
Generate SEO content for a Shopify product page in ${toneOfVoice} tone.
Product: ${productTitle}
Brand: ${brand}
Collections: ${collections.join(", ")}

Return a valid JSON object with keys:
- "title": 70–80 characters max, keyword-rich and compelling
- "description": around 150–160 characters, persuasive and natural
- "slug": a short SEO-friendly slug (lowercase, hyphen-separated)
- "keywords": a comma-separated list of top SEO keywords
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert SEO content generator for Shopify products." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const text = completion.choices[0]?.message?.content?.trim() || "{}";

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return {
      ok: true,
      input,
      output: data
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || "OpenAI request failed"
    };
  }
}
