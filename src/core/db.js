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

  function normalizeSql(text) {
    let idx = 0;
    return text.replace(/\?/g, () => `$${++idx}`);
  }

  async function query(text, params = []) {
    const sql = normalizeSql(text);
    return pgPool.query(sql, params);
  }

  async function queryAll(text, params = []) {
    const res = await query(text, params);
    return res.rows;
  }

  async function queryOne(text, params = []) {
    const res = await query(text, params);
    return res.rows[0] || null;
  }

  async function exec(text) {
    // Allow multiple statements separated by semicolons while preserving order
    const statements = text
      .split(/;\s*/)
      .map(s => s.trim())
      .filter(Boolean);
    const results = [];
    for (const stmt of statements) {
      results.push(await query(stmt));
    }
    return results;
  }

  function prepare(text) {
    const normalized = normalizeSql(text);
    return {
      run: async (...params) => query(normalized, params),
      all: async (...params) => queryAll(normalized, params),
      get: async (...params) => queryOne(normalized, params),
    };
  }

  module.exports = {
    type: 'postgres',
    pool: pgPool,
    query,
    queryAll,
    queryOne,
    exec,
    prepare,
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

  const query = (sql, params = []) => {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  };

  const queryAll = (sql, params = []) => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  };

  const queryOne = (sql, params = []) => {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  };

  const exec = (...args) => db.exec(...args);

  module.exports = {
    type: 'sqlite',
    db,
    prepare: (...args) => db.prepare(...args),
    exec,
    close: () => db.close(),
    query,
    queryAll,
    queryOne,
  };
}
