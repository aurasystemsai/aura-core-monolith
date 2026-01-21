// Persistent DB for inventory forecasting queries/results
const Database = require('better-sqlite3');
const db = new Database('inventory-forecasting.sqlite');

db.exec(`CREATE TABLE IF NOT EXISTS queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

function list() {
  return db.prepare('SELECT * FROM queries ORDER BY created_at DESC').all();
}
function get(id) {
  return db.prepare('SELECT * FROM queries WHERE id = ?').get(id);
}
function create({ query, result }) {
  const info = db.prepare('INSERT INTO queries (query, result) VALUES (?, ?)').run(query, result);
  return get(info.lastInsertRowid);
}
function update(id, { query, result }) {
  db.prepare('UPDATE queries SET query = ?, result = ? WHERE id = ?').run(query, result, id);
  return get(id);
}
function remove(id) {
  return db.prepare('DELETE FROM queries WHERE id = ?').run(id).changes > 0;
}
function importItems(items) {
  const insert = db.prepare('INSERT INTO queries (query, result) VALUES (?, ?)');
  const tx = db.transaction((arr) => { arr.forEach(i => insert.run(i.query, i.result)); });
  tx(items);
}

module.exports = { list, get, create, update, delete: remove, import: importItems };
