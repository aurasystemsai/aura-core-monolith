const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_plugins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  description TEXT,
  code TEXT,
  enabled INTEGER DEFAULT 1,
  createdAt INTEGER
)`);
db.exec(`CREATE TABLE IF NOT EXISTS lio_plugin_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pluginName TEXT,
  input TEXT,
  output TEXT,
  success INTEGER,
  createdAt INTEGER
)`);
module.exports = {
  register: (name, description, code) => {
    db.prepare('INSERT OR REPLACE INTO lio_plugins (name, description, code, enabled, createdAt) VALUES (?, ?, ?, 1, ?)').run(name, description, code, Date.now());
    return { name, description, enabled: true };
  },
  list: () => db.prepare('SELECT id, name, description, enabled, createdAt FROM lio_plugins').all(),
  enable: (name) => db.prepare('UPDATE lio_plugins SET enabled = 1 WHERE name = ?').run(name).changes > 0,
  disable: (name) => db.prepare('UPDATE lio_plugins SET enabled = 0 WHERE name = ?').run(name).changes > 0,
  run: (data) => {
    const name = data.plugin || 'default';
    const plugin = db.prepare('SELECT * FROM lio_plugins WHERE name = ? AND enabled = 1').get(name);
    let output = null, success = true;
    if (plugin && plugin.code) {
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('data', plugin.code);
        output = fn(data);
      } catch (e) {
        output = { error: e.message };
        success = false;
      }
    }
    db.prepare('INSERT INTO lio_plugin_runs (pluginName, input, output, success, createdAt) VALUES (?, ?, ?, ?, ?)').run(name, JSON.stringify(data), JSON.stringify(output), success ? 1 : 0, Date.now());
    return { ok: success, plugin: name, output };
  },
  runHistory: (limit = 50) => db.prepare('SELECT * FROM lio_plugin_runs ORDER BY createdAt DESC LIMIT ?').all(limit).map(r => ({ ...r, input: JSON.parse(r.input || '{}'), output: JSON.parse(r.output || 'null') })),
};
