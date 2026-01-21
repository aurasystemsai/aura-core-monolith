// Persistent DB layer for Internal Link Optimizer
const db = require('../../core/db');

// Ensure links table exists
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS internal_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`;
db.prepare(INIT_SQL).run();

function list() {
  const stmt = db.prepare('SELECT * FROM internal_links ORDER BY created_at DESC');
  return stmt.all().map(r => ({ ...r, ...JSON.parse(r.data) }));
}

function get(id) {
  const stmt = db.prepare('SELECT * FROM internal_links WHERE id = ?');
  const r = stmt.get(id);
  return r ? { ...r, ...JSON.parse(r.data) } : null;
}

function create(data) {
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO internal_links (data, created_at) VALUES (?, ?)');
  const info = stmt.run(JSON.stringify(data), now);
  return { id: info.lastInsertRowid, ...data, created_at: now };
}

function update(id, data) {
  const now = Date.now();
  const stmt = db.prepare('UPDATE internal_links SET data = ?, created_at = ? WHERE id = ?');
  stmt.run(JSON.stringify(data), now, id);
  return get(id);
}

function del(id) {
  const stmt = db.prepare('DELETE FROM internal_links WHERE id = ?');
  return stmt.run(id).changes > 0;
}

function importLinks(items) {
  if (!Array.isArray(items)) throw new Error('Invalid items');
  const stmt = db.prepare('INSERT INTO internal_links (data, created_at) VALUES (?, ?)');
  for (const item of items) {
    stmt.run(JSON.stringify(item), Date.now());
  }
}

module.exports = { list, get, create, update, delete: del, import: importLinks };