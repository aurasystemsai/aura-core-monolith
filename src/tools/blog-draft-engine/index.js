// Example Shopify blog draft input for testing
const exampleInput = {
  title: "How to Style Gold Huggie Earrings",
  summary: "A guide to styling gold huggie earrings for any occasion.",
  brand: "AURA Demo Store",
  tone: "modern, confident, UK English",
  topics: ["jewellery", "fashion", "earrings"],
  handle: "how-to-style-gold-huggie-earrings",
  tags: ["gold", "earrings", "jewellery"],
  collections: ["earrings", "style-guides"],
  metafields: { "material": "gold vermeil", "feature": "hypoallergenic" },
  locale: "en-GB"
};

// CLI/test runner
if (require.main === module) {
  const arg = process.argv[2];
  if (arg === '--help') {
    console.log(`\nBlog Draft Engine CLI\nUsage: node index.js [--help|--example]\n--example   Run with example Shopify blog draft data\n--help      Show this help message\n`);
    process.exit(0);
  }
  const testInput = arg === '--example' ? exampleInput : {};
  exports.run(testInput).then(res => {
    console.log(JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

exports.exampleInput = exampleInput;
// src/tools/blog-draft-engine/index.js
// ------------------------------------------------------
// Blog Draft Engine
// Takes a single blog idea (title + summary + topics etc.)
// and returns a full SEO-ready article draft.
// Also persists drafts to SQLite via src/core/db.js.
// ------------------------------------------------------

"use strict";

const OpenAI = require("openai");

// Shared Core DB (single SQLite file, shared across the API)
let db = null;
try {
  // Path: src/tools/blog-draft-engine -> ../../core/db
  db = require("../../core/db");
} catch (e) {
  // If DB isn't available for some reason, we still allow the tool to run.
  db = null;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "blog-draft-engine",
  name: "Blog Draft Engine",
  category: "Content · Drafts",
  description:
    "Generate a full SEO-focused blog article draft from a single blog idea.",
  version: "1.1.0",
};

// ------------------------------------------------------
// SQLite helpers
// ------------------------------------------------------

function ensureDraftsTable() {
  if (!db) return;

  db.prepare(`
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId TEXT,
      toolId TEXT NOT NULL,
      createdAt TEXT NOT NULL,

      title TEXT,
      slug TEXT,
      metaDescription TEXT,
      primaryKeyword TEXT,

      inputJson TEXT,
      outputJson TEXT,

      articleText TEXT,
      articleHtml TEXT
    )
  `).run();

  // Helpful index for listing by project/time later
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_drafts_project_createdAt
    ON drafts (projectId, createdAt)
  `).run();
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "";
  }
}

function persistDraft({
  projectId,
  toolId,
  createdAt,
  title,
  slug,
  metaDescription,
  primaryKeyword,
  input,
  output,
  articleText,
  articleHtml,
}) {
  if (!db) return;

  ensureDraftsTable();

  db.prepare(
    `
    INSERT INTO drafts (
      projectId, toolId, createdAt,
      title, slug, metaDescription, primaryKeyword,
      inputJson, outputJson,
      articleText, articleHtml
    ) VALUES (
      @projectId, @toolId, @createdAt,
      @title, @slug, @metaDescription, @primaryKeyword,
      @inputJson, @outputJson,
      @articleText, @articleHtml
    )
  `
  ).run({
    projectId: projectId || "",
    toolId: toolId || "blog-draft-engine",
    createdAt: createdAt || new Date().toISOString(),

    title: title || "",
    slug: slug || "",
    metaDescription: metaDescription || "",
    primaryKeyword: primaryKeyword || "",

    inputJson: safeJsonStringify(input),
    outputJson: safeJsonStringify(output),

    articleText: articleText || "",
    articleHtml: articleHtml || "",
  });
}

// ------------------------------------------------------
// Draft generation
// ------------------------------------------------------

/**
 * Single OpenAI call -> STRICT JSON
 */
async function generateDraftOnce(payload) {
  const {
    blogTitle,
    blogSummary,
    brand,
    tone,
    audience,
    primaryKeyword,
    targetWordCount,
    topics,
    market,
  } = payload;

  const safeWordCount =
    typeof targetWordCount === "number" && targetWordCount > 400
      ? targetWordCount
      : 1200;

  const topicsLine = Array.isArray(topics) && topics.length
    ? topics.join(", ")
    : "N/A";

  const prompt = `
You are an SEO content strategist and copywriter for a modern ecommerce brand.

Write a complete SEO-friendly blog post in clear, natural UK English.

Brand: ${brand || "N/A"}
Audience: ${audience || "N/A"}
Tone of voice: ${tone || "elevated, warm, UK English"}
Primary keyword: ${primaryKeyword || "N/A"}
Secondary topics / angles: ${topicsLine}
Market: ${market || "Worldwide"}
Target word count: around ${safeWordCount} words (do not go far above 1.3x this).

BLOG IDEA
---------
Title: ${blogTitle}
One-line summary / angle: ${blogSummary || "N/A"}

REQUIREMENTS
------------
- Make sure the primary keyword appears naturally in the H1 and early in the intro.
- Avoid clickbait, all caps and emojis.
- Use short paragraphs (2–4 sentences).
- Use subheadings that make sense for skimmers.
- End with a simple, helpful call-to-action that fits an ecommerce brand (not generic "subscribe to our newsletter").

OUTPUT FORMAT (STRICT JSON)
---------------------------
Return STRICT JSON only. No backticks, no prose, no comments.

{
  "title": "Exact article H1",
  "metaDescription": "Compelling search meta description (130–155 characters)",
  "slug": "url-slug-using-lowercase-hyphens",
  "primaryKeyword": "the main keyword you optimised for",
  "sections": [
    { "heading": "Intro heading (optional)", "body": "One or two paragraphs of text." },
    { "heading": "Next section heading", "body": "Body text for this section." }
  ],
  "cta": "Single short closing paragraph with a natural call-to-action",
  "estimatedWordCount": 1234
}
  `.trim();

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.3,
  });

  const text = response.output_text && response.output_text.trim();
  if (!text) {
    throw new Error("OpenAI response missing text payload");
  }

  // Guard if any leading/trailing junk appears
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
    console.error("Blog Draft Engine JSON parse failed:", text);
    throw new Error("Failed to parse JSON from OpenAI response");
  }

  return parsed;
}

/**
 * HTML helper (optional output)
 */
function assembleHtml(draft) {
  const parts = [];

  if (draft.title) {
    parts.push(`<h1>${draft.title}</h1>`);
  }

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;

      const heading = section.heading || "";
      const body = section.body || "";

      if (heading) parts.push(`<h2>${heading}</h2>`);

      if (body) {
        const paragraphs = String(body)
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paragraphs.forEach((p) => {
          parts.push(`<p>${p}</p>`);
        });
      }
    });
  }

  if (draft.cta) {
    parts.push(`<p><strong>${draft.cta}</strong></p>`);
  }

  return parts.join("\n");
}

/**
 * Plain text / Markdown-style helper (default output)
 */
function assembleText(draft) {
  const parts = [];

  if (draft.title) {
    parts.push(`# ${draft.title}`);
    parts.push("");
  }

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;

      const heading = section.heading || "";
      const body = section.body || "";

      if (heading) {
        parts.push(`## ${heading}`);
      }

      if (body) {
        const paragraphs = String(body)
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paragraphs.forEach((p) => {
          parts.push(p);
          parts.push("");
        });
      } else {
        parts.push("");
      }
    });
  }

  if (draft.cta) {
    parts.push("**CTA**");
    parts.push(draft.cta);
    parts.push("");
  }

  return parts.join("\n").trim();
}

function estimateWordCountFromText(text) {
  const clean = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return 0;
  return clean.split(" ").length;
}

// ------------------------------------------------------
// Tool entrypoint
// ------------------------------------------------------

exports.run = async function run(input, ctx = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in your Render environment."
    );
  }

  const {
    blogTitle = "",
    blogSummary = "",
    brand = "",
    tone = "",
    audience = "",
    primaryKeyword = "",
    targetWordCount = 1200,
    topics = [],
    market = "Worldwide",
  } = input || {};

  if (!blogTitle) {
    throw new Error("blogTitle is required for Blog Draft Engine");
  }

  const payload = {
    blogTitle,
    blogSummary,
    brand,
    tone,
    audience,
    primaryKeyword,
    targetWordCount,
    topics: Array.isArray(topics) ? topics : [],
    market,
  };

  const draft = await generateDraftOnce(payload);

  const articleText = assembleText(draft);
  const articleHtml = assembleHtml(draft);

  const wordCount =
    typeof draft.estimatedWordCount === "number"
      ? draft.estimatedWordCount
      : estimateWordCountFromText(articleText || articleHtml);

  const output = {
    title: draft.title || blogTitle,
    metaDescription: draft.metaDescription || "",
    slug: draft.slug || "",
    primaryKeyword: draft.primaryKeyword || primaryKeyword || "",
    sections: Array.isArray(draft.sections) ? draft.sections : [],
    cta: draft.cta || "",
    articleText,   // non-HTML default
    articleHtml,   // optional HTML
    estimatedWordCount: wordCount,
  };

  // Attempt to persist draft (same SQLite DB via core/db.js)
  try {
    const projectId =
      ctx.projectId ||
      (ctx.project && ctx.project.id) ||
      (ctx.request && ctx.request.projectId) ||
      input.projectId ||
      "";

    persistDraft({
      projectId,
      toolId: exports.meta.id,
      createdAt: new Date().toISOString(),
      title: output.title,
      slug: output.slug,
      metaDescription: output.metaDescription,
      primaryKeyword: output.primaryKeyword,
      input,
      output,
      articleText: output.articleText,
      articleHtml: output.articleHtml,
    });
  } catch (persistErr) {
    console.error("[blog-draft-engine] Failed to persist draft:", persistErr);
  }

  return {
    input,
    output,
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
