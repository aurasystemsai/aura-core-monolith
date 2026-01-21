
// Analytics model for Returns/RMA Automation (persistent)
const db = require('../../core/db');

// Ensure analytics_events table exists
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rmaId TEXT,
  type TEXT,
  data TEXT,
  created_at INTEGER NOT NULL
)`;
db.prepare(INIT_SQL).run();

function recordEvent(event) {
  const now = Date.now();
  const stmt = db.prepare('INSERT INTO analytics_events (rmaId, type, data, created_at) VALUES (?, ?, ?, ?)');
  const info = stmt.run(event.rmaId || null, event.type || null, JSON.stringify(event), now);
  return { id: info.lastInsertRowid, ...event, created_at: now };
}

function listEvents({ rmaId, type } = {}) {
  let sql = 'SELECT * FROM analytics_events WHERE 1=1';
  const params = [];
  if (rmaId) { sql += ' AND rmaId = ?'; params.push(rmaId); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params).map(e => ({ ...e, ...JSON.parse(e.data) }));
}

module.exports = { recordEvent, listEvents };
