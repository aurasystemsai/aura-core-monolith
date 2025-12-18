// src/core/fix-queue.js
// -------------------------------------
// AURA Fix Queue Core
// Stores "things to fix" (URLs + issues) per project.
// Includes server-side dedupe and a UNIQUE index to prevent duplicates.
// -------------------------------------

const db = require("./db");

db.exec(`
  CREATE TABLE IF NOT EXISTS fix_queue_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    url TEXT NOT NULL,
    issues TEXT,                 -- JSON array string
    status TEXT NOT NULL DEFAULT 'open',  -- open | done
    owner TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_fix_queue_project
    ON fix_queue_items(projectId);

  -- Prevent duplicates (this is the main fix for "3 times" long term)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_project_url_unique
    ON fix_queue_items(projectId, url);
`);

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function normaliseUrl(value) {
  const v = normaliseString(value);
  if (!v) return null;
  // Keep it simple: trim trailing spaces, do not rewrite protocol, etc.
  return v;
}

function safeIssues(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [];
}

/**
 * Add an item to fix queue.
 * Uses UNIQUE(projectId,url) to avoid duplicates.
 * If it already exists, we update issues + updatedAt (id stays the same).
 */
function addToFixQueue(projectId, { url, issues }) {
  const now = new Date().toISOString();
  const cleanUrl = normaliseUrl(url);
  if (!cleanUrl) {
    throw new Error("url is required");
  }

  const cleanIssues = safeIssues(issues);
  const issuesJson = JSON.stringify(cleanIssues);

  const stmt = db.prepare(`
    INSERT INTO fix_queue_items (
      projectId, url, issues, status, owner, notes, createdAt, updatedAt
    ) VALUES (
      @projectId, @url, @issues, 'open', NULL, NULL, @createdAt, @updatedAt
    )
    ON CONFLICT(projectId, url) DO UPDATE SET
      issues    = excluded.issues,
      status    = CASE
                    WHEN fix_queue_items.status IS NULL OR fix_queue_items.status = ''
                      THEN 'open'
                    ELSE fix_queue_items.status
                  END,
      updatedAt = excluded.updatedAt;
  `);

  stmt.run({
    projectId: String(projectId),
    url: cleanUrl,
    issues: issuesJson,
    createdAt: now,
    updatedAt: now,
  });

  const row = db
    .prepare(
      `SELECT * FROM fix_queue_items WHERE projectId = ? AND url = ? LIMIT 1`
    )
    .get(String(projectId), cleanUrl);

  return mapRow(row);
}

function listFixQueue(projectId, { status } = {}) {
  const params = [String(projectId)];
  let where = "projectId = ?";

  const cleanStatus = normaliseString(status);
  if (cleanStatus) {
    where += " AND status = ?";
    params.push(cleanStatus);
  }

  const rows = db
    .prepare(
      `
      SELECT *
      FROM fix_queue_items
      WHERE ${where}
      ORDER BY
        CASE WHEN status = 'open' THEN 0 ELSE 1 END,
        updatedAt DESC
    `
    )
    .all(...params);

  return rows.map(mapRow);
}

function markDone(projectId, id) {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE fix_queue_items
    SET status = 'done', updatedAt = ?
    WHERE projectId = ? AND id = ?
  `);

  const info = stmt.run(now, String(projectId), Number(id));
  return { updated: info.changes || 0 };
}

function removeItem(projectId, id) {
  const stmt = db.prepare(`
    DELETE FROM fix_queue_items
    WHERE projectId = ? AND id = ?
  `);

  const info = stmt.run(String(projectId), Number(id));
  return { deleted: info.changes || 0 };
}

/**
 * One-time cleanup for older data where duplicates already exist.
 * Keeps the lowest id per (projectId,url), deletes the rest.
 */
function dedupeFixQueue(projectId) {
  const pid = String(projectId);

  const duplicates = db
    .prepare(
      `
      SELECT url, COUNT(*) as c
      FROM fix_queue_items
      WHERE projectId = ?
      GROUP BY url
      HAVING c > 1
    `
    )
    .all(pid);

  let removed = 0;
  for (const d of duplicates) {
    const url = d.url;

    const ids = db
      .prepare(
        `
        SELECT id
        FROM fix_queue_items
        WHERE projectId = ? AND url = ?
        ORDER BY id ASC
      `
      )
      .all(pid, url)
      .map((r) => r.id);

    const keep = ids.shift(); // keep smallest id
    const toDelete = ids;

    if (toDelete.length) {
      const del = db.prepare(
        `DELETE FROM fix_queue_items WHERE projectId = ? AND url = ? AND id != ?`
      );
      const info = del.run(pid, url, keep);
      removed += info.changes || 0;
    }
  }

  return { removed, duplicateUrls: duplicates.length };
}

function mapRow(row) {
  if (!row) return null;

  let issues = [];
  try {
    issues = row.issues ? JSON.parse(row.issues) : [];
    if (!Array.isArray(issues)) issues = [];
  } catch {
    issues = [];
  }

  return {
    id: row.id,
    projectId: row.projectId,
    url: row.url,
    issues,
    status: row.status || "open",
    owner: row.owner || null,
    notes: row.notes || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

module.exports = {
  addToFixQueue,
  listFixQueue,
  markDone,
  removeItem,
  dedupeFixQueue,
};
