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

  const payload = body || {};
  const toolId = String(payload.toolId || "").trim();
  if (!toolId) {
    const err = new Error("toolId is required");
    err.statusCode = 400;
    throw err;
  }

  const createdAt = payload.createdAt
    ? new Date(payload.createdAt).toISOString()
    : new Date().toISOString();

  const title = payload.title != null ? String(payload.title) : null;
  const slug = payload.slug != null ? String(payload.slug) : null;
  const metaDescription =
    payload.metaDescription != null ? String(payload.metaDescription) : null;
  const primaryKeyword =
    payload.primaryKeyword != null ? String(payload.primaryKeyword) : null;

  const inputJson =
    payload.input != null ? safeStringify(payload.input) : null;
  const outputJson =
    payload.output != null ? safeStringify(payload.output) : null;

  const articleText =
    payload.articleText != null ? String(payload.articleText) : null;
  const articleHtml =
    payload.articleHtml != null ? String(payload.articleHtml) : null;

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
    projectId || "",
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

  const id = info.lastInsertRowid;
  return getDraftById(projectId, id);
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

module.exports = {
  ensureDraftsTable,
  listDraftsByProject,
  getDraftById,
  createDraft,
};
