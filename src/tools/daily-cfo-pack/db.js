// Persistent DB layer for Daily CFO Pack
const db = require('../../core/db');

// Ensure reports table exists
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS cfo_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`;
db.prepare(INIT_SQL).run();

function list() {
  const stmt = db.prepare('SELECT * FROM cfo_reports ORDER BY created_at DESC');
  return stmt.all().map(r => ({ ...r, ...JSON.parse(r.data) }));
}

function get(id) {
  const stmt = db.prepare('SELECT * FROM cfo_reports WHERE id = ?');
  const r = stmt.get(id);
  return r ? { ...r, ...JSON.parse(r.data) } : null;
}

function create(data) {
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO cfo_reports (data, created_at) VALUES (?, ?)');
  const info = stmt.run(JSON.stringify(data), now);
  return { id: info.lastInsertRowid, ...data, created_at: now };
}

function update(id, data) {
  const now = Date.now();
  const stmt = db.prepare('UPDATE cfo_reports SET data = ?, created_at = ? WHERE id = ?');
  stmt.run(JSON.stringify(data), now, id);
  return get(id);
}

function del(id) {
  const stmt = db.prepare('DELETE FROM cfo_reports WHERE id = ?');
  return stmt.run(id).changes > 0;
}

function importReports(items) {
  if (!Array.isArray(items)) throw new Error('Invalid items');
  const stmt = db.prepare('INSERT INTO cfo_reports (data, created_at) VALUES (?, ?)');
  for (const item of items) {
    stmt.run(JSON.stringify(item), Date.now());
  }
}

module.exports = { list, get, create, update, delete: del, import: importReports };