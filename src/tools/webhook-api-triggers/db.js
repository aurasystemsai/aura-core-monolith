// Persistent DB for Webhook API Triggers
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../../data/webhook-api-triggers.sqlite');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS triggers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  config TEXT,
  createdAt INTEGER
)`);
module.exports = {
  list: () => db.prepare('SELECT * FROM triggers').all(),
  get: id => db.prepare('SELECT * FROM triggers WHERE id = ?').get(id),
  create: data => {
    const info = db.prepare('INSERT INTO triggers (name, config, createdAt) VALUES (?, ?, ?)').run(data.name, data.config, Date.now());
    return module.exports.get(info.lastInsertRowid);
  },
  update: (id, data) => {
    db.prepare('UPDATE triggers SET name = ?, config = ? WHERE id = ?').run(data.name, data.config, id);
    return module.exports.get(id);
  },
  delete: id => db.prepare('DELETE FROM triggers WHERE id = ?').run(id).changes > 0,
  import: arr => {
    db.prepare('DELETE FROM triggers').run();
    arr.forEach(t => module.exports.create(t));
  }
};
