// src/core/db.js
// ------------------------------
// Shared SQLite connection for AURA Core
// ------------------------------

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Ensure data directory exists
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// SQLite file will live in /src/data/aura-core.sqlite
const dbPath = path.join(dataDir, "aura-core.sqlite");

// Open connection (will create file if it doesn't exist)
const db = new Database(dbPath);

// Turn on WAL mode for better concurrency (safe)
db.pragma("journal_mode = WAL");

// Export single shared instance
module.exports = db;
