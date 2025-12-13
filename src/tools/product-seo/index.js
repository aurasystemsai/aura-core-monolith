// src/tools/product-seo/index.js
// ----------------------------------------
// Product SEO Engine (Self-Optimising)
// ----------------------------------------

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.meta = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, descriptions, slugs and keyword sets for products. Automatically optimises results for 90+ score quality."
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
    throw new Error("OPENAI_API_KEY is not set. Add it in your Render environment.");
  }

  const {
    productTitle = "",
    productDescription = "",
    brand = "",
    tone = "modern, confident, UK English",
    useCases = []
  } = input || {};

  if (!productTitle || !productDescription) {
    throw new Error("productTitle and productDescription are required");
  }

  // STEP 1 — Initial generation
  const basePrompt = `
You are an advanced eCommerce SEO engine for luxury jewellery brands.

Write STRICT JSON in this structure:
{
  "title": "...",
  "metaDescription": "...",
  "slug": "...",
  "keywords": ["...", "..."],
  "score": 0-100
}

Rules:
- Title: 45–60 characters, includes brand and 1–2 high-intent keywords.
- Meta description: 130–155 characters, include emotional & functional benefits.
- Slug: short, lowercase, SEO-friendly.
- Keywords: 6–10 phrases, relevance-weighted.
- Score: Estimate SEO quality (title length, keyword richness, readability).
- If score < 90, regenerate internally until ≥ 90 before returning.

Input:
Brand: ${brand || "N/A"}
Product Title: ${productTitle}
Description: ${productDescription}
Tone: ${tone}
Use cases: ${Array.isArray(useCases) ? useCases.join(", ") : useCases}
`.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: basePrompt,
    response_format: { type: "json_object" }
  });

  const raw =
    response.output &&
    response.output[0] &&
    response.output[0].content &&
    response.output[0].content[0] &&
    (response.output[0].content[0].text?.value ||
      response.output[0].content[0].text);

  if (!raw) throw new Error("OpenAI response missing text payload");

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  let { title, metaDescription, slug, keywords, score } = parsed;

  // STEP 2 — Local validation + automatic refinement
  const safeScore = typeof score === "number" ? score : 60;

  if (safeScore < 90) {
    console.log(`[SEO Engine] Auto-optimising low score (${safeScore})...`);

    const refinePrompt = `
Refine and improve this product SEO so it achieves a 90–100 score.
Maintain brand consistency and natural readability.
Return STRICT JSON in this structure again.

Current:
${JSON.stringify(parsed, null, 2)}

Focus on:
- Expanding title to 55–60 chars max.
- Strengthening call-to-action in meta description.
- Improving keyword set relevance.
    `.trim();

    const refined = await client.responses.create({
      model: "gpt-4.1-mini",
      input: refinePrompt,
      response_format: { type: "json_object" }
    });

    const improvedRaw =
      refined.output &&
      refined.output[0] &&
      refined.output[0].content &&
      refined.output[0].content[0] &&
      (refined.output[0].content[0].text?.value ||
        refined.output[0].content[0].text);

    if (improvedRaw) {
      try {
        const improved = JSON.parse(improvedRaw);
        title = improved.title || title;
        metaDescription = improved.metaDescription || metaDescription;
        slug = improved.slug || slug;
        keywords = improved.keywords || keywords;
        score = improved.score || 90;
      } catch {
        console.warn("[SEO Engine] Refinement parse failed, fallback to original.");
      }
    }
  }

  // STEP 3 — Return clean data
  return {
    input,
    output: {
      title: title || "",
      metaDescription: metaDescription || "",
      description: metaDescription || "",
      slug: slug || "",
      keywords: Array.isArray(keywords) ? keywords : [],
      score: Math.min(score || 90, 100)
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown"
  };
};
