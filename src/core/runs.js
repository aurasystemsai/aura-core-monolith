// src/core/runs.js
// ----------------------------------------
// Persistent storage for tool runs per project
// Backed by SQLite (better-sqlite3)
// ----------------------------------------

const db = require("./db");

// Create table on first load
db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    toolId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    market TEXT,
    device TEXT,
    score INTEGER,
    titleLength INTEGER,
    metaLength INTEGER,
    inputJson TEXT,
    outputJson TEXT
  );
`);

function recordRun({
  projectId,
  toolId,
  createdAt,
  market,
  device,
  score,
  titleLength,
  metaLength,
  input,
  output,
}) {
  const stmt = db.prepare(`
    INSERT INTO runs (
      projectId,
      toolId,
      createdAt,
      market,
      device,
      score,
      titleLength,
      metaLength,
      inputJson,
      outputJson
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    String(projectId),
    String(toolId),
    createdAt || new Date().toISOString(),
    market || null,
    device || null,
    typeof score === "number" ? score : null,
    typeof titleLength === "number" ? titleLength : null,
    typeof metaLength === "number" ? metaLength : null,
    input ? JSON.stringify(input) : null,
    output ? JSON.stringify(output) : null
  );
}

function listRuns({ projectId, limit = 50 }) {
  const stmt = db.prepare(`
    SELECT
      id,
      projectId,
      toolId,
      createdAt,
      market,
      device,
      score,
      titleLength,
      metaLength
    FROM runs
    WHERE projectId = ?
    ORDER BY datetime(createdAt) DESC
    LIMIT ?
  `);

  return stmt.all(String(projectId), limit);
}

module.exports = {
  recordRun,
  listRuns,
};
