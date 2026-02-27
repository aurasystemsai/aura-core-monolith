const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  data TEXT,
  timestamp INTEGER
)`);
module.exports = {
  recordEvent: (data) => {
    const ts = Date.now();
    const info = db.prepare('INSERT INTO lio_analytics (type, data, timestamp) VALUES (?, ?, ?)').run(data.type || 'event', JSON.stringify(data), ts);
    return { id: info.lastInsertRowid, ...data, timestamp: ts };
  },
  list: () => db.prepare('SELECT * FROM lio_analytics ORDER BY timestamp DESC LIMIT 500').all().map(r => ({ ...r, data: JSON.parse(r.data || '{}') })),
};
