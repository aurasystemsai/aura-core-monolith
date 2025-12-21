// src/core/projects.js
// ----------------------------------------
// AURA Core • Projects storage (SQLite)
// ----------------------------------------
//
// Responsible for:
// - Creating projects when a store is connected from the console
// - Listing projects for the ProjectSwitcher
//
// Uses the shared SQLite connection from src/core/db.js
//

const db = require("./db");

// --- Initialise table on first require -----------------------------

db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    platform TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`).run();

// --- Helpers --------------------------------------------------------

// simple id generator, no extra deps
function generateId() {
  return (
    "proj_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

// --- Public API -----------------------------------------------------

/**
 * Create a new project row.
 * Called from POST /projects in src/server.js
 */
function createProject({ name, domain, platform }) {
  const now = new Date().toISOString();
  const id = generateId();

  const project = {
    id,
    name,
    domain,
    platform,
    created_at: now,
    updated_at: now,
  };

  const stmt = db.prepare(`
    INSERT INTO projects (id, name, domain, platform, created_at, updated_at)
    VALUES (@id, @name, @domain, @platform, @created_at, @updated_at)
  `);

  stmt.run(project);

  // Return object in the shape the console expects
  return {
    id,
    name,
    domain,
    platform,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * List all projects (newest first).
 * Used by GET /projects in src/server.js
 */
function listProjects() {
  const rows = db
    .prepare(
      `
      SELECT id, name, domain, platform, created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `
    )
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    domain: row.domain,
    platform: row.platform,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

module.exports = {
  createProject,
  listProjects,
  // find a project by domain (returns null if not found)
  getProjectByDomain: (domain) => {
    const d = String(domain || "").trim();
    if (!d) return null;
    const row = db
      .prepare(
        `SELECT id, name, domain, platform, created_at, updated_at FROM projects WHERE domain = ? LIMIT 1`
      )
      .get(d);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      platform: row.platform,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};
