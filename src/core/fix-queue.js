// src/core/fix-queue.js
// -------------------------------------
// AURA Fix Queue Core
// Tracks SEO issues that need fixing
// -------------------------------------

const db = require("./db");

// Ensure table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS fix_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    url TEXT NOT NULL,
    issue TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- open | fixed | ignored
    createdAt TEXT NOT NULL,
    resolvedAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_fix_queue_project
    ON fix_queue(projectId);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_unique
    ON fix_queue(projectId, url, issue);
`);

function addIssues(projectId, url, issues = []) {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO fix_queue (
      projectId,
      url,
      issue,
      status,
      createdAt
    )
    VALUES (?, ?, ?, 'open', ?)
  `);

  const tx = db.transaction(() => {
    for (const issue of issues) {
      stmt.run(projectId, url, issue, now);
    }
  });

  tx();

  return { added: issues.length };
}

function listFixQueue(projectId) {
  return db
    .prepare(
      `
    SELECT *
    FROM fix_queue
    WHERE projectId = ?
    ORDER BY createdAt DESC
  `
    )
    .all(projectId);
}

function updateStatus(projectId, id, status) {
  const resolvedAt = status === "fixed" ? new Date().toISOString() : null;

  const res = db
    .prepare(
      `
    UPDATE fix_queue
    SET status = ?, resolvedAt = ?
    WHERE projectId = ? AND id = ?
  `
    )
    .run(status, resolvedAt, projectId, Number(id));

  return res.changes > 0;
}

module.exports = {
  addIssues,
  listFixQueue,
  updateStatus,
};
