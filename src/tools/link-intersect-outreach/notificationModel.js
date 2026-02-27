const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  recipient TEXT,
  read INTEGER DEFAULT 0,
  createdAt INTEGER
)`);
module.exports = {
  send: (data) => {
    const info = db.prepare('INSERT INTO lio_notifications (type, message, recipient, createdAt) VALUES (?, ?, ?, ?)').run(data.type || 'info', data.message || '', data.recipient || '', Date.now());
    return { id: info.lastInsertRowid, ...data, sent: true };
  },
  list: () => db.prepare('SELECT * FROM lio_notifications ORDER BY createdAt DESC').all(),
  markRead: (id) => db.prepare('UPDATE lio_notifications SET read = 1 WHERE id = ?').run(id).changes > 0,
};
