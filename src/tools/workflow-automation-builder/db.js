// Persistent DB for Workflow Automation Builder
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../../data/workflow-automation-builder.sqlite');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  config TEXT,
  createdAt INTEGER
)`);
module.exports = {
  list: () => db.prepare('SELECT * FROM workflows').all(),
  get: id => db.prepare('SELECT * FROM workflows WHERE id = ?').get(id),
  create: data => {
    const info = db.prepare('INSERT INTO workflows (name, config, createdAt) VALUES (?, ?, ?)').run(data.name, data.config, Date.now());
    return module.exports.get(info.lastInsertRowid);
  },
  update: (id, data) => {
    db.prepare('UPDATE workflows SET name = ?, config = ? WHERE id = ?').run(data.name, data.config, id);
    return module.exports.get(id);
  },
  delete: id => db.prepare('DELETE FROM workflows WHERE id = ?').run(id).changes > 0,
  import: arr => {
    db.prepare('DELETE FROM workflows').run();
    arr.forEach(w => module.exports.create(w));
  }
};
