// src/core/fixQueue.js
// -------------------------------------
// AURA Fix Queue (SQLite)
// Dedupes by (projectId + url) and merges issues on re-add.
// -------------------------------------

const db = require("./db");

// Create table + unique constraint
db.exec(`
  CREATE TABLE IF NOT EXISTS fix_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    url TEXT NOT NULL,
    issues TEXT,              -- JSON array of strings
    status TEXT NOT NULL,     -- open | done
    owner TEXT,               -- optional
    notes TEXT,               -- optional
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_project_url
    ON fix_queue(projectId, url);
`);

// One-time cleanup: remove duplicates already stored (keep the earliest id)
db.exec(`
  DELETE FROM fix_queue
  WHERE id NOT IN (
    SELECT MIN(id)
    FROM fix_queue
    GROUP BY projectId, url
  );
`);

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function normaliseUrl(url) {
  const u = normaliseString(url);
  if (!u) return null;
  return u.replace(/\/+$/, ""); // remove trailing slash to reduce dupes
}

function parseIssues(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [];
  const cleaned = arr
    .map((x) => normaliseString(x))
    .filter(Boolean);

  // Unique + stable order
  const seen = new Set();
  const out = [];
  for (const i of cleaned) {
    if (!seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  }
  return out;
}

function safeJsonParseArray(text) {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * Add (or update) a Fix Queue item.
 * - Enforces uniqueness by (projectId + url)
 * - Merges issues if the item already exists
 * - If it was "done", re-opening is allowed when re-added (status becomes open)
 */
function addOrMergeFixItem({ projectId, url, issues, owner, notes }) {
  const now = new Date().toISOString();
  const pid = normaliseString(projectId);
  const u = normaliseUrl(url);

  if (!pid || !u) {
    return { ok: false, error: "projectId and url are required" };
  }

  const incomingIssues = parseIssues(issues);
  const incomingOwner = normaliseString(owner);
  const incomingNotes = normaliseString(notes);

  const selectStmt = db.prepare(`
    SELECT id, issues, status, owner, notes, createdAt, updatedAt
    FROM fix_queue
    WHERE projectId = ? AND url = ?
    LIMIT 1
  `);

  const insertStmt = db.prepare(`
    INSERT INTO fix_queue (
      projectId, url, issues, status, owner, notes, createdAt, updatedAt
    ) VALUES (
      @projectId, @url, @issues, @status, @owner, @notes, @createdAt, @updatedAt
    )
  `);

  const updateStmt = db.prepare(`
    UPDATE fix_queue
    SET
      issues    = @issues,
      status    = @status,
      owner     = @owner,
      notes     = @notes,
      updatedAt = @updatedAt
    WHERE id = @id
  `);

  const tx = db.transaction(() => {
    const existing = selectStmt.get(pid, u);

    if (!existing) {
      insertStmt.run({
        projectId: pid,
        url: u,
        issues: JSON.stringify(incomingIssues),
        status: "open",
        owner: incomingOwner,
        notes: incomingNotes,
        createdAt: now,
        updatedAt: now,
      });

      const created = selectStmt.get(pid, u);
      return {
        ok: true,
        action: "inserted",
        item: toPublicRow(pid, u, created),
      };
    }

    const existingIssues = safeJsonParseArray(existing.issues || "[]");
    const merged = parseIssues([...existingIssues, ...incomingIssues]);

    // Re-add => always open (so you can re-queue something)
    const nextStatus = "open";

    // Only overwrite owner/notes if provided; otherwise preserve existing
    const nextOwner = incomingOwner !== null ? incomingOwner : existing.owner || null;
    const nextNotes = incomingNotes !== null ? incomingNotes : existing.notes || null;

    updateStmt.run({
      id: existing.id,
      issues: JSON.stringify(merged),
      status: nextStatus,
      owner: nextOwner,
      notes: nextNotes,
      updatedAt: now,
    });

    const updated = selectStmt.get(pid, u);
    return {
      ok: true,
      action: "merged",
      item: toPublicRow(pid, u, updated),
    };
  });

  return tx();
}

function toPublicRow(projectId, url, row) {
  const issues = safeJsonParseArray(row.issues || "[]");
  return {
    id: row.id,
    projectId,
    url,
    issues,
    status: row.status,
    owner: row.owner || null,
    notes: row.notes || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * List Fix Queue items for a project.
 * Defaults to status=open.
 */
function listFixQueue({ projectId, status = "open", limit = 200 }) {
  const pid = normaliseString(projectId);
  if (!pid) return [];

  const st = normaliseString(status) || "open";
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) ? Math.min(Math.max(lim, 1), 500) : 200;

  const stmt = db.prepare(`
    SELECT *
    FROM fix_queue
    WHERE projectId = ? AND status = ?
    ORDER BY createdAt DESC
    LIMIT ${safeLimit}
  `);

  const rows = stmt.all(pid, st);

  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    url: r.url,
    issues: safeJsonParseArray(r.issues || "[]"),
    status: r.status,
    owner: r.owner || null,
    notes: r.notes || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Mark an item done (or open).
 */
function setFixQueueStatus({ projectId, id, status }) {
  const pid = normaliseString(projectId);
  const st = normaliseString(status);
  const numericId = Number(id);

  if (!pid || !Number.isFinite(numericId)) {
    return { ok: false, error: "projectId and numeric id are required" };
  }

  const nextStatus = st === "done" ? "done" : "open";
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE fix_queue
    SET status = ?, updatedAt = ?
    WHERE projectId = ? AND id = ?
  `);

  const info = stmt.run(nextStatus, now, pid, numericId);

  return { ok: true, updated: info.changes || 0 };
}

module.exports = {
  addOrMergeFixItem,
  listFixQueue,
  setFixQueueStatus,
};
