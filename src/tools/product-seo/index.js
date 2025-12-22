// src/tools/product-seo/index.js
// ----------------------------------------
// Product SEO Engine tool for AURA Core
// Auto-retry with graceful fallback (no user-visible errors)
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
    "Generate SEO titles, meta descriptions, slugs and keyword sets for products.",
  version: "1.3.1",
};

/**
 * Helper: how far are we from the ideal range?
 * Returns 0 when inside range, otherwise the distance in characters.
 */
function rangePenalty(len, min, max) {
  if (len < min) return min - len;
  if (len > max) return len - max;
  return 0;
}

/**
 * Call OpenAI once and parse JSON.
 */
async function generateSEOOnce(payload) {
  const {
    productTitle,
    productDescription,
    brand,
    tone,
    useCasesText,
    handle,
    tags,
    collections,
    metafields,
    locale,
  } = payload;

  const prompt = `
You are an ecommerce SEO specialist for a Shopify store.

Write search-optimised product SEO in clear, natural ${locale || "UK English"}.
Avoid clickbait, all-caps and emojis.

Your target scoring bands (ideal):
- Product SEO title: 45–60 characters.
- Meta description: 130–155 characters.

Try to land as close to the middle of each band as possible.
If you overshoot or undershoot, quickly correct yourself BEFORE finalising output.

INPUT
------
Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Use cases: ${useCasesText || "N/A"}
Shopify handle: ${handle || "N/A"}
Tags: ${Array.isArray(tags) ? tags.join(", ") : tags || "N/A"}
Collections: ${Array.isArray(collections) ? collections.join(", ") : collections || "N/A"}
Metafields: ${metafields ? JSON.stringify(metafields) : "N/A"}
Locale: ${locale || "en-GB"}

OUTPUT FORMAT
-------------
Return STRICT JSON only in this exact shape, nothing else:

{
  "title": "SEO product title",
  "metaDescription": "Meta description text",
  "slug": "url-slug-here",
  "keywords": ["keyword one", "keyword two"],
  "handle": "shopify-product-handle",
  "tags": ["tag1", "tag2"],
  "collections": ["collection1", "collection2"],
  "metafields": { "namespace.key": "value" },
  "locale": "en-GB"
}
  `.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.15,
  });

  const text = response.output_text && response.output_text.trim();
  if (!text) {
    throw new Error("OpenAI response missing text payload");
  }

  // In case the model wraps JSON in explanation text, strip to { ... }.
  let jsonText = text;
  if (!jsonText.startsWith("{")) {
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error("Failed to parse JSON from OpenAI response:", text);
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  return parsed;
}

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
    handle = "",
    tags = [],
    collections = [],
    metafields = {},
    locale = "en-GB",
  } = input || {};

  if (!productTitle || !productDescription) {
    throw new Error("productTitle and productDescription are required");
  }

  const useCasesText = Array.isArray(useCases)
    ? useCases.join(", ")
    : String(useCases || "");

  const payload = {
    productTitle,
    productDescription,
    brand,
    tone,
    useCasesText,
    handle,
    tags,
    collections,
    metafields,
    locale,
  };

  const maxAttempts = 4;
  let best = null; // { data, titleLen, metaLen, penalty }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let data;
    try {
      data = await generateSEOOnce(payload);
    } catch (err) {
      // If OpenAI itself breaks (rate limit etc.), bail out early.
      console.error(`Product SEO attempt ${attempt} failed:`, err.message);
      if (!best) {
        throw err;
      }
      // We already have a usable best attempt – break and return it.
      break;
    }

    const title = data.title || "";
    const meta = data.metaDescription || "";

    const tLen = title.length;
    const mLen = meta.length;

    const titlePenalty = rangePenalty(tLen, 45, 60);
    const metaPenalty = rangePenalty(mLen, 130, 155);
    const totalPenalty = titlePenalty + metaPenalty;

    const snapshot = {
      data,
      titleLen: tLen,
      metaLen: mLen,
      penalty: totalPenalty,
    };

    // First attempt or better than previous best
    if (!best || totalPenalty < best.penalty) {
      best = snapshot;
    }

    console.log(
      `[Product SEO] Attempt ${attempt}: titleLen=${tLen}, metaLen=${mLen}, penalty=${totalPenalty}`
    );

    // Perfect range hit – stop retrying.
    if (totalPenalty === 0) {
      break;
    }
  }

  if (!best) {
    throw new Error("Unable to generate SEO output");
  }

  const final = best.data;

  return {
    input,
    output: {
      title: final.title || "",
      description: final.metaDescription || "",
      metaDescription: final.metaDescription || "",
      slug: final.slug || final.handle || "",
      keywords: Array.isArray(final.keywords) ? final.keywords : [],
      handle: final.handle || handle || "",
      tags: Array.isArray(final.tags) ? final.tags : tags,
      collections: Array.isArray(final.collections) ? final.collections : collections,
      metafields: typeof final.metafields === "object" ? final.metafields : metafields,
      locale: final.locale || locale,
      // optional debug so *you* can see if it hit perfect; users never see this.
      _debug: {
        titleChars: best.titleLen,
        metaChars: best.metaLen,
        penalty: best.penalty,
      },
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
