// src/core/fixQueue.js
// -------------------------------------
// AURA Fix Queue (SQLite)
// Stores a deduped queue of URLs/issues to fix, per project.
// -------------------------------------

const db = require("./db");

// Table + constraints
db.exec(`
  CREATE TABLE IF NOT EXISTS fix_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    url TEXT NOT NULL,
    issues TEXT,                -- JSON string array
    status TEXT NOT NULL,       -- open | done
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  -- IMPORTANT: this enforces server-side dedupe (one row per projectId+url)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_project_url
    ON fix_queue(projectId, url);

  CREATE INDEX IF NOT EXISTS idx_fix_queue_project_status_updated
    ON fix_queue(projectId, status, updatedAt);
`);

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function normaliseUrl(url) {
  const u = normaliseString(url);
  if (!u) return null;
  // strip trailing slashes for canonical dedupe
  return u.replace(/\/+$/, "");
}

function safeIssues(issues) {
  const arr = Array.isArray(issues)
    ? issues.map((x) => String(x || "").trim()).filter(Boolean)
    : [];
  // keep unique issues only
  return Array.from(new Set(arr));
}

/**
 * Add (or upsert) a fix queue item.
 * - Deduped by UNIQUE(projectId, url)
 * - If already exists, updates issues + updatedAt and keeps status open
 */
function addFixQueueItem(projectId, { url, issues }) {
  const now = new Date().toISOString();

  const project = normaliseString(projectId);
  const canonicalUrl = normaliseUrl(url);
  if (!project || !canonicalUrl) {
    throw new Error("projectId and url are required");
  }

  const issuesArr = safeIssues(issues);
  const issuesJson = JSON.stringify(issuesArr);

  const stmt = db.prepare(`
    INSERT INTO fix_queue (
      projectId,
      url,
      issues,
      status,
      createdAt,
      updatedAt
    )
    VALUES (
      @projectId,
      @url,
      @issues,
      'open',
      @createdAt,
      @updatedAt
    )
    ON CONFLICT(projectId, url) DO UPDATE SET
      issues    = excluded.issues,
      status    = 'open',
      updatedAt = excluded.updatedAt;
  `);

  stmt.run({
    projectId: project,
    url: canonicalUrl,
    issues: issuesJson,
    createdAt: now,
    updatedAt: now,
  });

  // Return the current row
  const row = db
    .prepare(
      `
      SELECT *
      FROM fix_queue
      WHERE projectId = ? AND url = ?
      LIMIT 1
    `
    )
    .get(project, canonicalUrl);

  return hydrateRow(row);
}

/**
 * List queue items (default: open).
 */
function listFixQueueItems(projectId, { status = "open", limit = 200 } = {}) {
  const project = normaliseString(projectId);
  if (!project) throw new Error("projectId is required");

  const st = normaliseString(status) || "open";
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) ? Math.min(Math.max(lim, 1), 1000) : 200;

  const rows = db
    .prepare(
      `
      SELECT *
      FROM fix_queue
      WHERE projectId = ? AND status = ?
      ORDER BY updatedAt DESC
      LIMIT ${safeLimit}
    `
    )
    .all(project, st);

  return rows.map(hydrateRow);
}

/**
 * Mark done by id (must match projectId).
 */
function markFixQueueDone(projectId, id) {
  const project = normaliseString(projectId);
  const rowId = Number(id);
  if (!project || !Number.isFinite(rowId)) {
    throw new Error("projectId and numeric id are required");
  }

  const now = new Date().toISOString();

  const res = db
    .prepare(
      `
      UPDATE fix_queue
      SET status = 'done', updatedAt = ?
      WHERE projectId = ? AND id = ?
    `
    )
    .run(now, project, rowId);

  return { updated: res.changes || 0 };
}

/**
 * Remove by id (must match projectId).
 */
function removeFixQueueItem(projectId, id) {
  const project = normaliseString(projectId);
  const rowId = Number(id);
  if (!project || !Number.isFinite(rowId)) {
    throw new Error("projectId and numeric id are required");
  }

  const res = db
    .prepare(
      `
      DELETE FROM fix_queue
      WHERE projectId = ? AND id = ?
    `
    )
    .run(project, rowId);

  return { deleted: res.changes || 0 };
}

/**
 * One-off cleanup for existing duplicates (from before unique index existed).
 * Keeps the newest row (max(updatedAt)) per url, deletes the rest.
 */
function dedupeFixQueue(projectId) {
  const project = normaliseString(projectId);
  if (!project) throw new Error("projectId is required");

  // Find duplicates by URL
  const dups = db
    .prepare(
      `
      SELECT url, COUNT(*) as cnt
      FROM fix_queue
      WHERE projectId = ?
      GROUP BY url
      HAVING cnt > 1
    `
    )
    .all(project);

  let deleted = 0;

  const delStmt = db.prepare(`DELETE FROM fix_queue WHERE id = ? AND projectId = ?`);

  const tx = db.transaction(() => {
    for (const d of dups) {
      const url = d.url;

      // Keep the newest row
      const keep = db
        .prepare(
          `
          SELECT id
          FROM fix_queue
          WHERE projectId = ? AND url = ?
          ORDER BY updatedAt DESC, id DESC
          LIMIT 1
        `
        )
        .get(project, url);

      // Delete all others
      const others = db
        .prepare(
          `
          SELECT id
          FROM fix_queue
          WHERE projectId = ? AND url = ? AND id != ?
        `
        )
        .all(project, url, keep.id);

      for (const o of others) {
        const r = delStmt.run(o.id, project);
        deleted += r.changes || 0;
      }
    }
  });

  tx();

  return { deleted, duplicateGroups: dups.length };
}

function hydrateRow(row) {
  if (!row) return null;
  let issues = [];
  try {
    issues = row.issues ? JSON.parse(row.issues) : [];
  } catch {
    issues = [];
  }

  return {
    id: row.id,
    projectId: row.projectId,
    url: row.url,
    issues: Array.isArray(issues) ? issues : [],
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

module.exports = {
  addFixQueueItem,
  listFixQueueItems,
  markFixQueueDone,
  removeFixQueueItem,
  dedupeFixQueue,
};
