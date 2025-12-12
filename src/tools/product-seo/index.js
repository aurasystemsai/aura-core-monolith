// src/tools/product-seo/index.js
// Product SEO Engine (CommonJS + OpenAI v4 via dynamic import)

let cachedClient = null;

// Lazy-load the ESM OpenAI client so it works in CommonJS
async function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  const OpenAI = (await import("openai")).default;

  cachedClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return cachedClient;
}

/**
 * Product SEO Engine
 * Generate SEO title, description, slug, and keywords for a product.
 *
 * Expected input JSON:
 * {
 *   "productTitle": "Waterproof layered necklace",
 *   "brand": "DTP Jewellry",
 *   "collections": ["Necklaces", "Waterproof"],
 *   "toneOfVoice": "confident, modern, UK English"
 * }
 */
async function run(input = {}) {
  const {
    productTitle = "",
    brand = "",
    collections = [],
    toneOfVoice = "confident, modern, UK English",
  } = input;

  const openai = await getOpenAIClient();

  const prompt = `
Generate SEO content for a Shopify jewellery product in ${toneOfVoice} tone.

Product: ${productTitle}
Brand: ${brand}
Collections: ${collections.join(", ") || "none specified"}

Return a VALID JSON object ONLY, with these keys:

- "title": 65–70 chars max, keyword-rich but natural
- "description": around 150–160 chars, persuasive, UK English
- "slug": short, lowercase, hyphen-separated, no brand name
- "keywords": array of 6–10 short SEO keyword phrases

DO NOT include any extra commentary or text outside the JSON.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert ecommerce SEO copywriter for Shopify stores.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // If model didn’t give perfect JSON, fall back but still return something
      parsed = { parseError: err.message, raw };
    }

    return {
      ok: true,
      input,
      output: parsed,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || "OpenAI request failed",
    };
  }
}

module.exports = { run };
