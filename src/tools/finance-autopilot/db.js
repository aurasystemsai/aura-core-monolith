// Persistent DB for Finance Autopilot
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../../data/finance-autopilot.sqlite');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS autopilots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  config TEXT,
  createdAt INTEGER
)`);
module.exports = {
  list: () => db.prepare('SELECT * FROM autopilots').all(),
  get: id => db.prepare('SELECT * FROM autopilots WHERE id = ?').get(id),
  create: data => {
    const info = db.prepare('INSERT INTO autopilots (name, config, createdAt) VALUES (?, ?, ?)').run(data.name, data.config, Date.now());
    return module.exports.get(info.lastInsertRowid);
  },
  update: (id, data) => {
    db.prepare('UPDATE autopilots SET name = ?, config = ? WHERE id = ?').run(data.name, data.config, id);
    return module.exports.get(id);
  },
  delete: id => db.prepare('DELETE FROM autopilots WHERE id = ?').run(id).changes > 0,
  import: arr => {
    db.prepare('DELETE FROM autopilots').run();
    arr.forEach(a => module.exports.create(a));
  }
};
