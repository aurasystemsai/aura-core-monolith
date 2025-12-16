// src/tools/blog-draft-engine/index.js
// ------------------------------------------------------
// Blog Draft Engine
// Takes a single blog idea (title + angle + keyword etc.)
// and returns a full SEO-ready article draft.
// Returns BOTH Markdown and HTML so the client can choose.
// ------------------------------------------------------

"use strict";

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "blog-draft-engine",
  name: "Blog Draft Engine",
  category: "Content · Drafts",
  description:
    "Generate a full SEO-focused blog article draft from a single blog idea (Markdown + HTML).",
  version: "1.1.0",
};

/**
 * Single OpenAI call -> JSON
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
  } = payload;

  const safeWordCount =
    typeof targetWordCount === "number" && targetWordCount > 400
      ? targetWordCount
      : 1200;

  const prompt = `
You are an SEO content strategist and copywriter for a modern ecommerce brand.

Write a complete SEO-friendly blog post in clear, natural UK English.

Brand: ${brand || "N/A"}
Audience: ${audience || "N/A"}
Tone of voice: ${tone || "elevated, warm, UK English"}
Primary keyword: ${primaryKeyword || "N/A"}
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
 * Basic HTML escaping so if users paste odd characters,
 * we don't accidentally generate broken HTML strings.
 * (We still show this HTML as text in the console.)
 */
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build Markdown from the draft JSON
 */
function assembleMarkdown(draft) {
  const lines = [];

  if (draft.title) {
    lines.push(`# ${String(draft.title).trim()}`);
    lines.push("");
  }

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;
      const heading = String(section.heading || "").trim();
      const body = String(section.body || "").trim();

      if (heading) {
        lines.push(`## ${heading}`);
        lines.push("");
      }

      if (body) {
        // keep paragraph breaks
        const paragraphs = body
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paragraphs.forEach((p) => {
          lines.push(p);
          lines.push("");
        });
      }
    });
  }

  if (draft.cta) {
    lines.push(`**${String(draft.cta).trim()}**`);
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}

/**
 * Simple HTML helper so the console can show a readable article.
 * NOTE: This is HTML-as-text in the UI (not rendered), so safe either way,
 * but we escape by default to avoid accidental HTML injection when copying.
 */
function assembleHtmlFromDraft(draft) {
  const parts = [];

  if (draft.title) {
    parts.push(`<h1>${escapeHtml(draft.title)}</h1>`);
  }

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;
      const heading = (section.heading || "").toString().trim();
      const body = (section.body || "").toString().trim();

      if (heading) {
        parts.push(`<h2>${escapeHtml(heading)}</h2>`);
      }

      if (body) {
        const paragraphs = body
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paragraphs.forEach((p) => {
          parts.push(`<p>${escapeHtml(p)}</p>`);
        });
      }
    });
  }

  if (draft.cta) {
    parts.push(`<p><strong>${escapeHtml(draft.cta)}</strong></p>`);
  }

  return parts.join("\n");
}

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
  };

  const draft = await generateDraftOnce(payload);

  const markdown = assembleMarkdown(draft);
  const html = assembleHtmlFromDraft(draft);

  const wordCount =
    typeof draft.estimatedWordCount === "number"
      ? draft.estimatedWordCount
      : (markdown || "")
          .replace(/[#*_`>\[\]\(\)]/g, " ")
          .split(/\s+/)
          .filter(Boolean).length;

  return {
    input,
    output: {
      title: draft.title || blogTitle,
      metaDescription: draft.metaDescription || "",
      description: draft.metaDescription || "", // helps the console reuse the same meta slot
      slug: draft.slug || "",
      primaryKeyword: draft.primaryKeyword || primaryKeyword || "",
      sections: Array.isArray(draft.sections) ? draft.sections : [],
      cta: draft.cta || "",
      estimatedWordCount: wordCount,

      // BOTH formats
      articleMarkdown: markdown,
      articleHtml: html,
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
