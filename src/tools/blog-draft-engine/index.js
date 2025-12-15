// src/tools/blog-draft-engine/index.js
// ------------------------------------------------------
// Blog Draft Engine
// Given a title + summary + context, generate a full
// blog article draft in UK English with SEO-ready fields.
// ------------------------------------------------------

"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "blog-draft-engine",
  name: "Blog Draft Engine",
  category: "SEO",
  description:
    "Generate full blog article drafts with SEO title, meta description, slug and outline.",
  version: "1.0.0",
};

/**
 * Single call to OpenAI that returns JSON.
 */
async function generateDraftOnce(payload) {
  const {
    title,
    summary,
    brand,
    niche,
    audience,
    tone,
    primaryKeyword,
    wordCount,
  } = payload;

  const prompt = `
You are a senior content strategist and SEO copywriter for an ecommerce / DTC brand.

Write a FULL blog article draft in clear, natural UK English.

Brand: ${brand || "N/A"}
Niche / topic: ${niche || "N/A"}
Target audience: ${audience || "N/A"}
Tone of voice: ${tone || "elevated, warm, UK English"}
Primary keyword: ${primaryKeyword || "N/A"}

Working title:
${title}

Short brief / summary of the article:
${summary || "N/A"}

Writing rules:
- Target length: roughly ${wordCount || 900} words (it is OK if you are a bit under or over).
- Use H2 and H3 style section headings in the OUTLINE, but NOT in the body text (we only include headings as plain text labels in the outline array).
- Body should be written as paragraphs separated by blank lines.
- Use British spelling.
- Do NOT use clickbait, all caps or emojis.
- Article must be genuinely helpful, not waffle.

SEO rules:
- Create a search-optimised page title (45–60 characters).
- Create a meta description (130–155 characters) that clearly sells the click.
- Create a clean slug (lowercase, hyphen-separated, no stop words if possible).

OUTPUT FORMAT
-------------
Return STRICT JSON only in this exact shape, nothing else:

{
  "title": "Improved article title (for the H1)",
  "seoTitle": "SEO page title for search results",
  "metaDescription": "Meta description text",
  "slug": "url-slug-here",
  "outline": [
    "Section 1 heading",
    "Section 2 heading",
    "Section 3 heading"
  ],
  "body": "Full article body as plain text with paragraphs separated by blank lines.",
  "keyPoints": [
    "Bullet one",
    "Bullet two"
  ]
}
`.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.4,
  });

  const text = response.output_text && response.output_text.trim();
  if (!text) {
    throw new Error("OpenAI response missing text payload");
  }

  // If the model wrapped JSON in extra text, slice down to the first { ... } block.
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
    console.error("Failed to parse JSON from Blog Draft Engine:", text);
    throw new Error("Failed to parse JSON from Blog Draft Engine");
  }

  return parsed;
}

exports.run = async function run(input = {}, ctx = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your Render environment."
    );
  }

  const {
    title,
    summary = "",
    brand = "",
    niche = "",
    audience = "",
    tone = "",
    primaryKeyword = "",
    wordCount = 900,
  } = input;

  if (!title) {
    throw new Error("title is required for Blog Draft Engine");
  }

  const payload = {
    title,
    summary,
    brand,
    niche,
    audience,
    tone,
    primaryKeyword,
    wordCount,
  };

  // You can add retry logic later if we want; for now, single clean attempt.
  const draft = await generateDraftOnce(payload);

  return {
    input,
    output: {
      title: draft.title || title,
      seoTitle: draft.seoTitle || draft.title || title,
      metaDescription: draft.metaDescription || "",
      slug: draft.slug || "",
      outline: Array.isArray(draft.outline) ? draft.outline : [],
      body: draft.body || "",
      keyPoints: Array.isArray(draft.keyPoints) ? draft.keyPoints : [],
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
