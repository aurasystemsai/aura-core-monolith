// src/core/notifications.js
// Persistent notifications store using SQLite
const db = require('./db');

// Ensure notifications table exists
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  time INTEGER NOT NULL
)`;
db.prepare(INIT_SQL).run();

function addNotification({ type, message, time }) {
  const stmt = db.prepare('INSERT INTO notifications (type, message, time) VALUES (?, ?, ?)');
  stmt.run(type, message, time || Date.now());
}

function listNotifications(limit = 20) {
  const stmt = db.prepare('SELECT * FROM notifications ORDER BY time DESC LIMIT ?');
  return stmt.all(limit);
}

module.exports = { addNotification, listNotifications };