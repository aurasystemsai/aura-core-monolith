// src/tools/blog-draft-engine/index.js
// ------------------------------------------------------
// Blog Draft Engine
// Generates a full SEO-ready blog article
// Outputs BOTH Markdown (primary) and HTML (derived)
// ------------------------------------------------------

"use strict";

const OpenAI = require("openai");
const { marked } = require("marked");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.meta = {
  id: "blog-draft-engine",
  name: "Blog Draft Engine",
  category: "Content · Drafts",
  description:
    "Generate a full SEO-focused blog article draft with sections, CTA, Markdown and HTML.",
  version: "1.1.0",
};

/**
 * Single OpenAI call → strict JSON
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

Write a COMPLETE blog article in clear, natural UK English.

Brand: ${brand || "N/A"}
Audience: ${audience || "N/A"}
Tone of voice: ${tone || "elevated, warm, UK English"}
Primary keyword: ${primaryKeyword || "N/A"}
Target word count: around ${safeWordCount} words

BLOG IDEA
---------
Title: ${blogTitle}
Summary / angle: ${blogSummary || "N/A"}

REQUIREMENTS
------------
- Primary keyword must appear naturally in the H1 and early in the introduction.
- No clickbait, no emojis, no all-caps.
- Short paragraphs (2–4 sentences).
- Logical H2/H3 structure for skimmers.
- Finish with a soft ecommerce-style CTA (not newsletter spam).

OUTPUT FORMAT (STRICT JSON ONLY)
--------------------------------
Return STRICT JSON. No prose. No comments.

{
  "title": "Exact H1 title",
  "metaDescription": "SEO meta description (130–155 characters)",
  "slug": "url-slug-lowercase-hyphens",
  "primaryKeyword": "main keyword",
  "sections": [
    {
      "heading": "Section heading",
      "body": "Paragraph text for this section."
    }
  ],
  "cta": "Closing CTA paragraph",
  "estimatedWordCount": 1234
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

  // Strip to JSON if model wraps output
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
    console.error("Blog Draft Engine JSON parse failed:", text);
    throw new Error("Failed to parse JSON from OpenAI response");
  }
}

/**
 * Build Markdown article (PRIMARY FORMAT)
 */
function buildMarkdown(draft) {
  const lines = [];

  if (draft.title) {
    lines.push(`# ${draft.title}\n`);
  }

  if (Array.isArray(draft.sections)) {
    draft.sections.forEach((section) => {
      if (!section) return;

      if (section.heading) {
        lines.push(`## ${section.heading}\n`);
      }

      if (section.body) {
        lines.push(`${section.body}\n`);
      }
    });
  }

  if (draft.cta) {
    lines.push(`---\n**${draft.cta}**\n`);
  }

  return lines.join("\n").trim();
}

/**
 * Convert Markdown → HTML (SECONDARY FORMAT)
 */
function markdownToHtml(markdown) {
  if (!markdown) return "";
  return marked.parse(markdown);
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

  // Build outputs
  const articleMarkdown = buildMarkdown(draft);
  const articleHtml = markdownToHtml(articleMarkdown);

  const estimatedWordCount =
    typeof draft.estimatedWordCount === "number"
      ? draft.estimatedWordCount
      : articleMarkdown.split(/\s+/).length;

  return {
    input,
    output: {
      title: draft.title || blogTitle,
      metaDescription: draft.metaDescription || "",
      slug: draft.slug || "",
      primaryKeyword: draft.primaryKeyword || primaryKeyword || "",
      sections: Array.isArray(draft.sections) ? draft.sections : [],
      cta: draft.cta || "",
      articleMarkdown,
      articleHtml,
      estimatedWordCount,
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};
