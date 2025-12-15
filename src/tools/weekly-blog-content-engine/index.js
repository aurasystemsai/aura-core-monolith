// src/tools/weekly-blog-content-engine/index.js
// ------------------------------------------------------
// Weekly Blog Content Engine for AURA Core
// Generates a simple weekly content plan (summary + posts[])
// Designed to be consumed by the SEO Command Centre console.
// ------------------------------------------------------

"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "weekly-blog-content-engine",
  name: "Weekly Blog Content Engine",
  category: "SEO / Content",
  description:
    "Generate a simple weekly content plan with SEO-ready blog titles, meta descriptions, slugs and primary keywords.",
  version: "1.0.0",
};

/**
 * Call OpenAI once and parse JSON.
 */
async function generatePlanOnce(payload) {
  const {
    brand,
    niche,
    audience,
    cadence,
    themes,
    tone,
    market,
  } = payload;

  const prompt = `
You are an ecommerce and content marketing strategist.

Your job is to create a simple, realistic weekly blog content plan
for a brand, with **SEO-ready** titles and meta descriptions in clear UK English.

The plan should be easy for beginners to plug directly into their CMS.

INPUT
------
Brand / site: ${brand || "N/A"}
Niche / topic: ${niche || "N/A"}
Target audience: ${audience || "N/A"}
Cadence: ${cadence || "N/A"}
Main themes / angles: ${themes || "N/A"}
Primary market: ${market || "Worldwide"}
Tone of voice: ${tone || "Elevated, modern, UK English"}

REQUIREMENTS
------------
- Create between 3 and 6 posts for one batch (e.g. one week or two weeks).
- Titles must be natural, non-clickbait, and optimised for search.
- Meta descriptions should be 130–155 characters where possible.
- Slugs should be URL-safe (lowercase, hyphens, no special characters).
- Primary keyword should be a realistic search term, not a full sentence.
- SuggestedDate can be simple (e.g. "Monday", "Wednesday", or "Week 1, Post 1").

OUTPUT FORMAT
-------------
Return STRICT JSON ONLY in exactly this shape:

{
  "summary": "Short paragraph describing the focus of this week's content plan.",
  "posts": [
    {
      "title": "SEO-ready blog post title",
      "metaDescription": "Meta description of 130–155 characters.",
      "slug": "url-friendly-slug-here",
      "primaryKeyword": "primary keyword phrase",
      "angle": "short line on the main angle or story",
      "suggestedDate": "e.g. Monday, Week 1"
    }
  ]
}

Do not include any extra commentary before or after the JSON.
  `.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.25,
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
    console.error("Failed to parse JSON from OpenAI weekly plan:", text);
    throw new Error("Failed to parse JSON from OpenAI weekly plan");
  }

  return parsed;
}

exports.run = async function run(input = {}, ctx = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in your Render environment."
    );
  }

  const {
    brand = "",
    niche = "",
    audience = "",
    cadence = "",
    themes = "",
    tone = "",
    market = "Worldwide",
  } = input || {};

  if (!brand && !niche) {
    throw new Error(
      "At least brand or niche is required for Weekly Blog Content Engine"
    );
  }

  const payload = {
    brand,
    niche,
    audience,
    cadence,
    themes,
    tone,
    market,
  };

  // Single attempt is usually enough here – we do not need strict length perfect.
  const plan = await generatePlanOnce(payload);

  const posts = Array.isArray(plan.posts) ? plan.posts : [];

  // Normalise posts fields so the React console can rely on them.
  const normalisedPosts = posts.map((p, idx) => {
    const title = String(p.title || "").trim();
    const metaDescription = String(p.metaDescription || p.description || "").trim();
    const slug = String(p.slug || p.handle || "").trim();
    const primaryKeyword = String(
      p.primaryKeyword || p.keyword || ""
    ).trim();
    const angle = String(p.angle || p.summary || "").trim();
    const suggestedDate = String(
      p.suggestedDate || p.date || `Post ${idx + 1}`
    ).trim();

    return {
      title,
      metaDescription,
      slug,
      primaryKeyword,
      angle,
      suggestedDate,
    };
  });

  // Basic scoring metrics for the console (average lengths)
  const titleLens = normalisedPosts.map((p) => p.title.length);
  const metaLens = normalisedPosts.map((p) => p.metaDescription.length);
  const avg = (arr) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const avgTitleLen = avg(titleLens);
  const avgMetaLen = avg(metaLens);

  return {
    input,
    output: {
      summary: plan.summary || "",
      posts: normalisedPosts,
      stats: {
        avgTitleLength: avgTitleLen,
        avgMetaLength: avgMetaLen,
        postCount: normalisedPosts.length,
      },
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
