// src/core/db.js
// ------------------------------
// Shared SQLite connection for AURA Core
// ------------------------------

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Decide where the DB lives:
// - In production (Render), we’ll set AURA_DB_PATH (e.g. /var/data/aura-core.sqlite)
// - Locally, fall back to src/data/aura-core.sqlite
const dbPath =
  process.env.AURA_DB_PATH ||
  path.join(__dirname, "..", "data", "aura-core.sqlite");

// Ensure directory exists for whatever path we’re using
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Open connection (will create file if it doesn't exist)
const db = new Database(dbPath);

// Turn on WAL mode for better concurrency (safe)
db.pragma("journal_mode = WAL");

// (Optional) small log so we can see where it’s writing
console.log(`[Core] SQLite DB path: ${dbPath}`);

// Export single shared instance
module.exports = db;
