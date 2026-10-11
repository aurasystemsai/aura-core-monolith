const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_compliance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  value TEXT,
  updatedAt INTEGER
)`);
// Seed defaults
const defaults = { gdpr: 'true', ccpa: 'true', dataRetentionDays: '365', allowAnalytics: 'true', allowNotifications: 'true' };
Object.entries(defaults).forEach(([key, value]) => {
  db.prepare('INSERT OR IGNORE INTO lio_compliance (key, value, updatedAt) VALUES (?, ?, ?)').run(key, value, Date.now());
});
module.exports = {
  get: () => {
    const rows = db.prepare('SELECT key, value, updatedAt FROM lio_compliance').all();
    return rows.reduce((acc, r) => {
      acc[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : isNaN(r.value) ? r.value : Number(r.value);
      return acc;
    }, { updatedAt: rows[0] ? new Date(rows[0].updatedAt).toISOString() : null });
  },
  set: (key, value) => {
    db.prepare('INSERT OR REPLACE INTO lio_compliance (key, value, updatedAt) VALUES (?, ?, ?)').run(key, String(value), Date.now());
    return module.exports.get();
  },
};
