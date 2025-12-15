// src/tools/blog-seo/index.js
// ----------------------------------------
// Blog SEO Engine tool for AURA Core
// Very similar pattern to Product SEO Engine
// ----------------------------------------

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "blog-seo",
  name: "Blog SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, meta descriptions, slugs and keyword sets for blog posts and articles.",
  version: "1.0.0",
};

/**
 * Helper: how far are we from the ideal range?
 * Returns 0 when inside range, otherwise the distance in characters.
 * We use the same bands as the console:
 * - Title: 45–60
 * - Meta: 130–155
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
  const { postTitle, postSummary, brand, tone, topicsText } = payload;

  const prompt = `
You are an SEO specialist for long-form content and ecommerce brands.

Write search-optimised BLOG SEO in clear, natural UK English.
Avoid clickbait, all-caps and emojis.

Target scoring bands (ideal):
- Blog SEO title: 45–60 characters.
- Meta description: 130–155 characters.

Aim to land near the middle of the band for both. If you overshoot
or undershoot, correct yourself BEFORE finalising output.

INPUT
------
Blog post title: ${postTitle}
Short summary / intro: ${postSummary}
Brand: ${brand || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Main topics / angles: ${topicsText || "N/A"}

OUTPUT FORMAT
-------------
Return STRICT JSON only in this exact shape, nothing else:

{
  "title": "SEO blog post title",
  "metaDescription": "Meta description text",
  "slug": "url-slug-here",
  "keywords": ["keyword one", "keyword two"],
  "outline": ["H2 or H3 heading 1", "heading 2", "heading 3"]
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

  // Reuse the same input shape as product-seo so the console
  // can call both tools in the same way.
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

  const topicsText = Array.isArray(useCases)
    ? useCases.join(", ")
    : String(useCases || "");

  const payload = {
    postTitle: productTitle,
    postSummary: productDescription,
    brand,
    tone,
    topicsText,
  };

  const maxAttempts = 4;
  let best = null; // { data, titleLen, metaLen, penalty }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let data;
    try {
      data = await generateSEOOnce(payload);
    } catch (err) {
      console.error(`[Blog SEO] attempt ${attempt} failed:`, err.message);
      if (!best) {
        // If the first call already fails (key wrong etc.), bubble up.
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

    if (!best || totalPenalty < best.penalty) {
      best = snapshot;
    }

    console.log(
      `[Blog SEO] Attempt ${attempt}: titleLen=${tLen}, metaLen=${mLen}, penalty=${totalPenalty}`
    );

    if (totalPenalty === 0) {
      break;
    }
  }

  if (!best) {
    throw new Error("Unable to generate blog SEO output");
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
      outline: Array.isArray(final.outline) ? final.outline : [],
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
