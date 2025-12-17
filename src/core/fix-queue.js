"use strict";

const db = require("./db");

function ensureFixQueueTable() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS fix_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId TEXT NOT NULL,
      url TEXT NOT NULL,
      issue TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open', -- open | fixed | ignored
      createdAt TEXT NOT NULL,
      resolvedAt TEXT
    )
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_fix_queue_project_status
    ON fix_queue (projectId, status)
  `).run();
}

function addToFixQueue(projectId, url, issues) {
  ensureFixQueueTable();

  if (!projectId || !url || !Array.isArray(issues) || !issues.length) {
    const err = new Error("projectId, url and issues[] are required");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO fix_queue (
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
      stmt.run(projectId, url, String(issue), now);
    }
  });

  tx();

  return { added: issues.length };
}

function listFixQueue(projectId, status) {
  ensureFixQueueTable();

  let sql = `
    SELECT *
    FROM fix_queue
    WHERE projectId = ?
  `;
  const params = [projectId];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY createdAt DESC";

  return db.prepare(sql).all(...params);
}

function updateFixStatus(projectId, id, status) {
  ensureFixQueueTable();

  if (!["open", "fixed", "ignored"].includes(status)) {
    const err = new Error("Invalid status");
    err.statusCode = 400;
    throw err;
  }

  const resolvedAt = status === "open" ? null : new Date().toISOString();

  const result = db.prepare(`
    UPDATE fix_queue
    SET status = ?, resolvedAt = ?
    WHERE projectId = ? AND id = ?
  `).run(status, resolvedAt, projectId, Number(id));

  return { updated: result.changes };
}

module.exports = {
  addToFixQueue,
  listFixQueue,
  updateFixStatus,
};
