// src/tools/blog-draft-engine/index.js
// ------------------------------------------------------
// Blog Draft Engine (World-Class Standard)
// Deterministic multi-engine pipeline (no external AI dependency)
// Persists drafts to SQLite via src/core/db.js
// ------------------------------------------------------

"use strict";

const engines = require("./engines");

// Shared Core DB (single SQLite file, shared across the API)
let db = null;
try {
  // Path: src/tools/blog-draft-engine -> ../../core/db
  db = require("../../core/db");
} catch (e) {
  // If DB isn't available for some reason, we still allow the tool to run.
  db = null;
}

exports.meta = {
  id: "blog-draft-engine",
  name: "Blog Draft Engine",
  category: "Content · Drafts",
  description:
    "Generate a full SEO-focused blog article draft from a single blog idea with deterministic multi-engine orchestration.",
  version: "2.0.0-wc",
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
// Draft generation helpers
// ------------------------------------------------------

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

exports.run = async function run(input = {}, ctx = {}) {
  const {
    blogTitle = "Deterministic blog draft",
    blogSummary = "",
    audience = "Content teams",
    tone = "Practical",
    primaryKeyword = "blog drafting",
    targetWordCount = 1200,
    topics = [],
    market = "Worldwide",
    channels = null,
  } = input;

  if (!blogTitle) {
    throw new Error("blogTitle is required for Blog Draft Engine");
  }

  // Ideation & strategy
  const idea = engines.createIdea({
    topic: blogTitle,
    summary: blogSummary,
    primaryKeyword,
    audience,
  });
  const intent = engines.intentScore({ topic: blogTitle });

  // Brief & outline
  const brief = engines.createBrief({
    title: blogTitle,
    primaryKeyword,
    sections: [
      "Hook",
      "Problem",
      "Solution",
      "Proof",
      "CTA",
    ],
  });
  const outline = engines.createOutline({ briefId: brief.briefId });
  const outlineGrade = engines.gradeOutline(outline);

  // Draft
  const draft = engines.generateDraft({
    title: blogTitle,
    primaryKeyword,
    audience,
    sections: outline.sections,
    targetWordCount,
    topics,
    market,
  });

  // SEO & distribution
  const seo = engines.seoScore(draft);
  const distribution = engines.distributionPlan({ channels: channels || undefined });

  // Collaboration & performance
  const task = engines.createTask({ title: "Legal + SEO review" });
  const activities = engines.listActivities();
  const performance = engines.performanceSnapshot({ contentId: draft.draftId });

  // AI orchestration
  const aiRun = engines.orchestrateRun({ primaryKeyword });
  const aiEnsemble = engines.runEnsemble({ primaryKeyword });

  // Assemble outputs
  const articleText = assembleText(draft);
  const articleHtml = assembleHtml(draft);
  const wordCount =
    typeof draft.estimatedWordCount === "number"
      ? draft.estimatedWordCount
      : estimateWordCountFromText(articleText || articleHtml);

  const output = {
    idea,
    intent,
    brief,
    outline,
    outlineGrade,
    draft: {
      ...draft,
      articleText,
      articleHtml,
      estimatedWordCount: wordCount,
    },
    seo,
    distribution,
    collaboration: {
      tasks: [task],
      activities,
    },
    performance,
    ai: {
      primary: aiRun,
      ensemble: aiEnsemble,
    },
    stats: engines.statsSnapshot(),
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
      title: output.draft.title,
      slug: output.draft.slug,
      metaDescription: output.draft.metaDescription,
      primaryKeyword: output.draft.primaryKeyword,
      input,
      output,
      articleText: output.draft.articleText,
      articleHtml: output.draft.articleHtml,
    });
  } catch (persistErr) {
    console.error("[blog-draft-engine] Failed to persist draft:", persistErr);
  }

  return {
    input,
    output,
    model: "deterministic-v1",
    environment: ctx.environment || "unknown",
  };
};
