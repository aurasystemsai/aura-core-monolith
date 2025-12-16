// src/tools/blog-draft-engine/index.js
// ------------------------------------------------------
// Blog Draft Engine
// Takes a single blog idea (title + summary + topics)
// and returns a full SEO-ready article draft.
// Outputs BOTH Markdown + HTML so the console can copy either.
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
    "Generate a full SEO-focused blog article draft from a single blog idea.",
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
    topics,
  } = payload;

  const safeWordCount =
    typeof targetWordCount === "number" && targetWordCount > 400
      ? targetWordCount
      : 1200;

  const safeTopics = Array.isArray(topics) ? topics.filter(Boolean) : [];

  const prompt = `
You are an SEO content strategist and copywriter for a modern ecommerce brand.

Write a complete SEO-friendly blog post in clear, natural UK English.

Brand: ${brand || "N/A"}
Audience: ${audience || "N/A"}
Tone of voice: ${tone || "elevated, warm, UK English"}
Primary keyword: ${primaryKeyword || "N/A"}
Topics / angles (optional): ${safeTopics.length ? safeTopics.join(", ") : "N/A"}
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
- Do NOT output HTML. Body text should be plain text with normal punctuation.

OUTPUT FORMAT (STRICT JSON)
---------------------------
Return STRICT JSON only. No backticks, no prose, no comments.

{
  "title": "Exact article H1",
  "metaDescription": "Compelling search meta description (130–155 characters)",
  "slug": "url-slug-using-lowercase-hyphens",
  "primaryKeyword": "the main keyword you optimised for",
  "sections": [
    { "heading": "Section heading", "body": "Plain text body. Use newlines to separate paragraphs if helpful." }
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
 * Markdown helper (preferred for most CMS editors)
 */
function assembleMarkdown(draft) {
  const parts = [];

  const title = (draft.title || "").trim();
  if (title) parts.push(`# ${title}`, "");

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;

      const heading =
        typeof section === "string"
          ? section
          : (section.heading || section.title || "").trim();

      const body =
        typeof section === "string"
          ? ""
          : String(section.body || section.content || section.text || "").trim();

      if (heading) parts.push(`## ${heading}`, "");

      if (body) {
        const paras = body
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paras.forEach((p) => parts.push(p, ""));
      }
    });
  }

  const cta = String(draft.cta || "").trim();
  if (cta) {
    parts.push("---", "", `**${cta}**`, "");
  }

  return parts.join("\n").trim();
}

/**
 * Simple HTML helper so the console can show HTML if needed.
 * (We still generate from the plain-text sections.)
 */
function assembleHtmlFromSections(draft) {
  const parts = [];

  const title = (draft.title || "").trim();
  if (title) parts.push(`<h1>${escapeHtml(title)}</h1>`);

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;

      const heading =
        typeof section === "string"
          ? section
          : (section.heading || section.title || "").trim();

      const body =
        typeof section === "string"
          ? ""
          : String(section.body || section.content || section.text || "").trim();

      if (heading) parts.push(`<h2>${escapeHtml(heading)}</h2>`);

      if (body) {
        const paras = body
          .split(/\n+/)
          .map((p) => p.trim())
          .filter(Boolean);

        paras.forEach((p) => {
          parts.push(`<p>${escapeHtml(p)}</p>`);
        });
      }
    });
  }

  const cta = String(draft.cta || "").trim();
  if (cta) parts.push(`<p><strong>${escapeHtml(cta)}</strong></p>`);

  return parts.join("\n");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function countWordsFromText(text) {
  const clean = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return 0;
  return clean.split(" ").length;
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
    topics = [],
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
    topics,
  };

  const draft = await generateDraftOnce(payload);

  const articleMarkdown = assembleMarkdown(draft);
  const articleHtml = assembleHtmlFromSections(draft);

  const wordCount =
    typeof draft.estimatedWordCount === "number"
      ? draft.estimatedWordCount
      : countWordsFromText(articleMarkdown || articleHtml);

  return {
    input,
    output: {
      title: (draft.title || blogTitle || "").trim(),
      metaDescription: (draft.metaDescription || "").trim(),
      slug: (draft.slug || "").trim(),
      primaryKeyword: (draft.primaryKeyword || primaryKeyword || "").trim(),
      sections: Array.isArray(draft.sections) ? draft.sections : [],
      cta: (draft.cta || "").trim(),
      articleMarkdown,
      articleHtml,
      estimatedWordCount: wordCount,
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
