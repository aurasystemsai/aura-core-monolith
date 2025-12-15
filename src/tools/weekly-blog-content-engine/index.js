// src/tools/weekly-blog-content-engine/index.js
// ------------------------------------------------------
// Weekly Blog Content Engine
// Generates a small content calendar of blog posts
// for ecommerce / content sites, tuned for UK English.
// ------------------------------------------------------

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "weekly-blog-content-engine",
  name: "Weekly Blog Content Engine",
  category: "Content",
  description:
    "Generate a simple weekly blog content calendar with SEO-ready titles, angles and target keywords.",
  version: "1.0.0",
};

/**
 * Single OpenAI call that returns a calendar JSON object.
 */
async function generateCalendarOnce(payload) {
  const {
    brand,
    niche,
    audience,
    tone,
    mainProducts,
    coreKeywords,
    market,
    weeks,
  } = payload;

  const prompt = `
You are a senior content strategist and SEO specialist in ecommerce.

Your job is to propose a short, practical blog content calendar for a brand.

Write in clear, natural UK English.
Avoid clickbait, all-caps and emojis.

BRAND CONTEXT
-------------
Brand / store: ${brand || "N/A"}
Niche / category: ${niche || "N/A"}
Primary audience: ${audience || "N/A"}
Tone of voice: ${tone || "modern, confident, UK English"}
Flagship products / offers: ${mainProducts || "N/A"}
Core keywords to lean on: ${coreKeywords || "N/A"}
Primary market: ${market || "Worldwide"}

CALENDAR REQUIREMENTS
---------------------
- Plan for ${weeks} week(s).
- Assume 1 blog post per week.
- Posts should be genuinely useful, not just product plug articles.
- Mix awareness (education), consideration (guides / comparisons) and conversion (buying guides, styling ideas).
- Each idea MUST be different and non-duplicated.

For each post, provide:
- clear SEO blog title (45–60 characters if possible)
- short meta description (130–155 characters if possible)
- short angle / summary of the article
- single primary SEO keyword or keyphrase
- suggested URL slug (lowercase, hyphen-separated, no domain)

OUTPUT FORMAT
-------------
Return STRICT JSON ONLY in this exact shape, nothing else:

{
  "weeks": [
    {
      "weekNumber": 1,
      "post": {
        "title": "SEO blog title",
        "metaDescription": "Meta description text",
        "angle": "What this article focuses on",
        "primaryKeyword": "keyword string",
        "slug": "url-slug-here"
      }
    }
  ],
  "notes": "Optional notes for the marketer"
}
  `.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.35,
  });

  const text = response.output_text && response.output_text.trim();
  if (!text) {
    throw new Error("OpenAI response missing text payload");
  }

  // In case model wraps JSON, slice down to { ... }
  let jsonText = text;
  if (!jsonText.startsWith("{")) {
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }
  }

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error(
      "Failed to parse JSON from Weekly Blog Content Engine:",
      text
    );
    throw new Error("Failed to parse JSON from OpenAI response");
  }
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
    tone = "",
    mainProducts = "",
    coreKeywords = "",
    market = "Worldwide",
    weeks = 4,
  } = input || {};

  if (!brand && !niche) {
    throw new Error("At least one of 'brand' or 'niche' must be provided");
  }

  const payload = {
    brand,
    niche,
    audience,
    tone,
    mainProducts,
    coreKeywords,
    market,
    weeks: Number.isFinite(weeks) && weeks > 0 ? Math.min(weeks, 12) : 4,
  };

  // Simple single-shot for now – calendar doesn't need retries like strict length tools
  const calendar = await generateCalendarOnce(payload);

  const weeksOut = Array.isArray(calendar.weeks) ? calendar.weeks : [];

  return {
    input,
    output: {
      weeks: weeksOut,
      notes: calendar.notes || "",
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
