// src/core/db.js
// ------------------------------
// Shared SQLite connection for AURA Core
// ------------------------------

"use strict";


const fs = require("fs");
const path = require("path");
let db = null;
let pgPool = null;

const DB_TYPE = process.env.AURA_DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'

if (DB_TYPE === 'postgres') {
  // --- Postgres mode ---
  const { Pool } = require('pg');
  const pgConfig = {
    connectionString: process.env.AURA_PG_URL || 'postgres://postgres:postgres@localhost:5432/aura',
    max: 10,
    idleTimeoutMillis: 30000,
  };
  pgPool = new Pool(pgConfig);
  console.log('[Core] Using Postgres at', pgConfig.connectionString);
  module.exports = {
    type: 'postgres',
    pool: pgPool,
    query: (text, params) => pgPool.query(text, params),
    close: () => pgPool.end(),
  };
} else {
  // --- SQLite mode (default) ---
  const Database = require("better-sqlite3");
  const dbPath =
    process.env.AURA_DB_PATH ||
    path.join(__dirname, "..", "data", "aura-core.sqlite");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  console.log(`[Core] SQLite DB path: ${dbPath}`);
  module.exports = {
    type: 'sqlite',
    db,
    prepare: (...args) => db.prepare(...args),
    exec: (...args) => db.exec(...args),
    close: () => db.close(),
    // Added for compatibility with model.js
    query: (sql, params=[]) => {
      const stmt = db.prepare(sql);
      return stmt.run(...params);
    },
    queryAll: (sql, params=[]) => {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    },
    queryOne: (sql, params=[]) => {
      const stmt = db.prepare(sql);
      return stmt.get(...params);
    },
  };
}
