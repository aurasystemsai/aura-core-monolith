// src/core/projects.js
// ----------------------------------------
// AURA Core • Projects storage (SQLite/Postgres)
// ----------------------------------------
//
// Responsible for:
// - Creating projects when a store is connected from the console
// - Listing projects for the ProjectSwitcher
//
// Uses the shared DB connection from src/core/db.js (sqlite by default, postgres in cloud)
//

const db = require("./db");

// --- Initialise table on first require -----------------------------
// Works in both sqlite (sync) and postgres (async via await db.exec)
const initPromise = (async () => {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        platform TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  } catch (err) {
    console.error("[projects] Failed to initialize projects table", err);
    throw err;
  }
})();

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
async function createProject({ name, domain, platform }) {
  await initPromise;
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

  await db.query(
    `
      INSERT INTO projects (id, name, domain, platform, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [id, name, domain, platform, now, now]
  );

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
async function listProjects() {
  await initPromise;
  const rows = await db.queryAll(
    `
      SELECT id, name, domain, platform, created_at, updated_at
      FROM projects
      ORDER BY created_at DESC
    `
  );

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
  getProjectByDomain: async (domain) => {
    await initPromise;
    const d = String(domain || "").trim();
    if (!d) return null;
    const row = await db.queryOne(
      `SELECT id, name, domain, platform, created_at, updated_at FROM projects WHERE domain = ? LIMIT 1`,
      [d]
    );
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
