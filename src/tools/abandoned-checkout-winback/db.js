// Persistent DB layer for winback tool (PostgreSQL example)
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.WINBACK_DB_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
