// Persistent DB for AB Testing Suite
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../../data/ab-testing-suite.sqlite');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  variants TEXT,
  status TEXT,
  createdAt INTEGER
);
CREATE TABLE IF NOT EXISTS auditLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT,
  ts INTEGER
);
CREATE TABLE IF NOT EXISTS apiKeys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT
);`);
module.exports = {
  list: () => db.prepare('SELECT * FROM tests').all(),
  get: id => db.prepare('SELECT * FROM tests WHERE id = ?').get(id),
  create: data => {
    const info = db.prepare('INSERT INTO tests (name, variants, status, createdAt) VALUES (?, ?, ?, ?)').run(data.name, JSON.stringify(data.variants), data.status, Date.now());
    return module.exports.get(info.lastInsertRowid);
  },
  update: (id, data) => {
    db.prepare('UPDATE tests SET name = ?, variants = ?, status = ? WHERE id = ?').run(data.name, JSON.stringify(data.variants), data.status, id);
    return module.exports.get(id);
  },
  delete: id => db.prepare('DELETE FROM tests WHERE id = ?').run(id).changes > 0,
  import: arr => {
    db.prepare('DELETE FROM tests').run();
    arr.forEach(t => module.exports.create(t));
  },
  auditLog: {
    add: event => db.prepare('INSERT INTO auditLog (event, ts) VALUES (?, ?)').run(event, Date.now()),
    list: () => db.prepare('SELECT * FROM auditLog').all()
  },
  apiKeys: {
    add: key => db.prepare('INSERT INTO apiKeys (key) VALUES (?)').run(key),
    remove: key => db.prepare('DELETE FROM apiKeys WHERE key = ?').run(key),
    list: () => db.prepare('SELECT key FROM apiKeys').all().map(r => r.key)
  }
};
