// Persistent DB for Link Intersect Outreach campaigns
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../../data/link-intersect-outreach.sqlite');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  query TEXT,
  createdAt INTEGER
)`);
module.exports = {
  list: () => db.prepare('SELECT * FROM campaigns').all(),
  get: id => db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id),
  create: data => {
    const info = db.prepare('INSERT INTO campaigns (name, query, createdAt) VALUES (?, ?, ?)').run(data.name, data.query, Date.now());
    return module.exports.get(info.lastInsertRowid);
  },
  update: (id, data) => {
    db.prepare('UPDATE campaigns SET name = ?, query = ? WHERE id = ?').run(data.name, data.query, id);
    return module.exports.get(id);
  },
  delete: id => db.prepare('DELETE FROM campaigns WHERE id = ?').run(id).changes > 0,
  import: arr => {
    db.prepare('DELETE FROM campaigns').run();
    arr.forEach(c => module.exports.create(c));
  }
};
