
// Notification model for Returns/RMA Automation (persistent)
const db = require('../../core/db');

// Ensure notifications table exists
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS rma_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
)`;
db.prepare(INIT_SQL).run();

function addNotification(entry) {
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO rma_notifications (userId, message, read, created_at) VALUES (?, ?, ?, ?)');
  const info = stmt.run(entry.userId || null, entry.message, 0, now);
  return { id: info.lastInsertRowid, ...entry, read: false, created_at: now };
}

function listNotifications({ userId, read } = {}) {
  let sql = 'SELECT * FROM rma_notifications WHERE 1=1';
  const params = [];
  if (userId) { sql += ' AND userId = ?'; params.push(userId); }
  if (read !== undefined) { sql += ' AND read = ?'; params.push(read ? 1 : 0); }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

function markAsRead(id) {
  const stmt = db.prepare('UPDATE rma_notifications SET read = 1 WHERE id = ?');
  return stmt.run(id).changes > 0;
}

module.exports = { addNotification, listNotifications, markAsRead };
