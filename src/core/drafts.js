// src/core/drafts.js
"use strict";

const db = require("./db");

function ensureDraftsTable() {
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

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_drafts_project_createdAt
    ON drafts (projectId, createdAt)
  `).run();
}

function listDraftsByProject(projectId, limit = 50, offset = 0) {
  ensureDraftsTable();

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);

  // summary list only (no huge article body)
  const rows = db.prepare(`
    SELECT
      id,
      projectId,
      toolId,
      createdAt,
      title,
      slug,
      metaDescription,
      primaryKeyword
    FROM drafts
    WHERE projectId = ?
    ORDER BY datetime(createdAt) DESC
    LIMIT ? OFFSET ?
  `).all(projectId || "", safeLimit, safeOffset);

  return rows || [];
}

function getDraftById(projectId, draftId) {
  ensureDraftsTable();

  const row = db.prepare(`
    SELECT
      id,
      projectId,
      toolId,
      createdAt,
      title,
      slug,
      metaDescription,
      primaryKeyword,
      inputJson,
      outputJson,
      articleText,
      articleHtml
    FROM drafts
    WHERE projectId = ? AND id = ?
    LIMIT 1
  `).get(projectId || "", Number(draftId));

  if (!row) return null;

  // Parse JSON safely (optional)
  let input = null;
  let output = null;
  try {
    input = row.inputJson ? JSON.parse(row.inputJson) : null;
  } catch {}
  try {
    output = row.outputJson ? JSON.parse(row.outputJson) : null;
  } catch {}

  return {
    ...row,
    input,
    output,
  };
}

function createDraft(projectId, body) {
  ensureDraftsTable();

  const safeProjectId = String(projectId || "").trim();
  if (!safeProjectId) {
    const err = new Error("projectId is required");
    err.statusCode = 400;
    throw err;
  }

  const toolId = String(body?.toolId || "").trim();
  if (!toolId) {
    const err = new Error("toolId is required");
    err.statusCode = 400;
    throw err;
  }

  const createdAt = body?.createdAt ? String(body.createdAt) : new Date().toISOString();

  const title = body?.title != null ? String(body.title) : null;
  const slug = body?.slug != null ? String(body.slug) : null;
  const metaDescription = body?.metaDescription != null ? String(body.metaDescription) : null;
  const primaryKeyword = body?.primaryKeyword != null ? String(body.primaryKeyword) : null;

  const inputJson =
    body?.input != null ? JSON.stringify(body.input) : null;

  const outputJson =
    body?.output != null ? JSON.stringify(body.output) : null;

  const articleText = body?.articleText != null ? String(body.articleText) : null;
  const articleHtml = body?.articleHtml != null ? String(body.articleHtml) : null;

  const info = db.prepare(`
    INSERT INTO drafts (
      projectId,
      toolId,
      createdAt,
      title,
      slug,
      metaDescription,
      primaryKeyword,
      inputJson,
      outputJson,
      articleText,
      articleHtml
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    safeProjectId,
    toolId,
    createdAt,
    title,
    slug,
    metaDescription,
    primaryKeyword,
    inputJson,
    outputJson,
    articleText,
    articleHtml
  );

  return {
    id: info.lastInsertRowid,
    projectId: safeProjectId,
    toolId,
    createdAt,
    title,
    slug,
    metaDescription,
    primaryKeyword,
  };
}

module.exports = {
  ensureDraftsTable,
  listDraftsByProject,
  getDraftById,
  createDraft,
};
