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

module.exports = {
  ensureDraftsTable,
  listDraftsByProject,
  getDraftById,
};
