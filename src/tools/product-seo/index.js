// src/tools/product-seo/index.js
// ----------------------------------------
// Product SEO Engine tool for AURA Core
// Auto-retry with graceful fallback (no user-visible errors)

const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
  throw new Error('[product-seo] OPENAI_API_KEY is required in production');
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.meta = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description: "Generate SEO titles, meta descriptions, slugs and keyword sets for products.",
  version: "1.3.1",
};

function rangePenalty(len, min, max) {
  if (len < min) return min - len;
  if (len > max) return len - max;
  return 0;
}

const slugify = value =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';

const clamp = (str = '', max = 155) => (str.length > max ? str.slice(0, max) : str);

async function generateSEOOnce(payload) {
  const { productTitle, productDescription, brand, tone, useCasesText } = payload;

  const prompt = `
You are an ecommerce SEO specialist for a jewellery brand.

Write search-optimised product SEO in clear, natural UK English.
Avoid clickbait, all-caps, emojis, and forbidden words (free, cheap, best, guarantee, 100%).

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

OUTPUT FORMAT
-------------
Return STRICT JSON only in this exact shape, nothing else:
{
  "title": "SEO product title",
  "metaDescription": "Meta description text",
  "slug": "url-slug-here",
  "keywords": ["keyword one", "keyword two"],
  "h1": "Main H1 heading for the product page",
  "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
  "canonicalUrl": "https://yourstore.com/products/slug",
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- The primary keyword (first in keywords) must appear in the title, metaDescription, and H1.
- Do not use forbidden words: free, cheap, best, guarantee, 100%.
- No explanation, only valid JSON.
  `.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content: "You are an ecommerce SEO specialist returning strictly valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = completion?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI response missing text payload");
  }

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

  const forbidden = ["free", "cheap", "best", "guarantee", "100%"];
  const primaryKeyword = Array.isArray(parsed.keywords) && parsed.keywords[0] ? parsed.keywords[0].toLowerCase() : null;
  const fieldsToCheck = [parsed.title, parsed.metaDescription, parsed.h1];
  for (const word of forbidden) {
    for (const field of fieldsToCheck) {
      if (field && field.toLowerCase().includes(word)) {
        throw new Error(`Forbidden word '${word}' found in output`);
      }
    }
  }
  if (primaryKeyword) {
    for (const field of fieldsToCheck) {
      if (field && !field.toLowerCase().includes(primaryKeyword)) {
        throw new Error(`Primary keyword '${primaryKeyword}' missing in one or more required fields`);
      }
    }
  }
  return parsed;
}

exports.run = async function run(input, ctx = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Add it in your Render environment.");
  }

  const { productTitle = "", productDescription = "", brand = "", tone = "", useCases = [] } = input || {};

  if (!productTitle || !productDescription) {
    throw new Error("productTitle and productDescription are required");
  }

  const useCasesText = Array.isArray(useCases) ? useCases.join(", ") : String(useCases || "");

  const payload = { productTitle, productDescription, brand, tone, useCasesText };

  const maxAttempts = 4;
  let best = null; // { data, titleLen, metaLen, penalty }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let data;
    try {
      data = await generateSEOOnce(payload);
    } catch (err) {
      console.error(`Product SEO attempt ${attempt} failed:`, err.message);
      if (!best) {
        throw err;
      }
      break;
    }

    const title = data.title || "";
    const meta = data.metaDescription || "";

    const tLen = title.length;
    const mLen = meta.length;

    const titlePenalty = rangePenalty(tLen, 45, 60);
    const metaPenalty = rangePenalty(mLen, 130, 155);
    const totalPenalty = titlePenalty + metaPenalty;

    const snapshot = { data, titleLen: tLen, metaLen: mLen, penalty: totalPenalty };

    if (!best || totalPenalty < best.penalty) {
      best = snapshot;
    }

    console.log(
      `[Product SEO] Attempt ${attempt}: titleLen=${tLen}, metaLen=${mLen}, penalty=${totalPenalty}`
    );

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
      h1: final.h1 || "",
      bullets: Array.isArray(final.bullets) ? final.bullets : [],
      canonicalUrl: final.canonicalUrl || "",
      tags: Array.isArray(final.tags) ? final.tags : [],
      _debug: {
        titleChars: best.titleLen,
        metaChars: best.metaLen,
        penalty: best.penalty,
      },
    },
    model: "gpt-4o-mini",
    environment: ctx.environment || "unknown",
  };
};
