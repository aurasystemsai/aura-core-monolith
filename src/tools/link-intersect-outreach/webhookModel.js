const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  event TEXT NOT NULL,
  secret TEXT,
  active INTEGER DEFAULT 1,
  createdAt INTEGER
)`);
db.exec(`CREATE TABLE IF NOT EXISTS lio_webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhookId INTEGER,
  event TEXT,
  payload TEXT,
  status INTEGER,
  createdAt INTEGER
)`);
module.exports = {
  register: (url, event, secret = '') => {
    const info = db.prepare('INSERT INTO lio_webhooks (url, event, secret, createdAt) VALUES (?, ?, ?, ?)').run(url, event, secret, Date.now());
    return { id: info.lastInsertRowid, url, event };
  },
  list: () => db.prepare('SELECT * FROM lio_webhooks WHERE active = 1').all(),
  deactivate: (id) => db.prepare('UPDATE lio_webhooks SET active = 0 WHERE id = ?').run(id).changes > 0,
  trigger: async (data) => {
    const event = data.event || 'generic';
    const hooks = db.prepare('SELECT * FROM lio_webhooks WHERE active = 1 AND event IN (?, ?)').all(event, '*');
    const results = await Promise.allSettled(hooks.map(async (hook) => {
      try {
        const fetch = require('node-fetch');
        const res = await fetch(hook.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(hook.secret ? { 'X-Webhook-Secret': hook.secret } : {}) }, body: JSON.stringify(data), timeout: 5000 });
        db.prepare('INSERT INTO lio_webhook_logs (webhookId, event, payload, status, createdAt) VALUES (?, ?, ?, ?, ?)').run(hook.id, event, JSON.stringify(data), res.status, Date.now());
        return { hookId: hook.id, status: res.status };
      } catch (e) {
        db.prepare('INSERT INTO lio_webhook_logs (webhookId, event, payload, status, createdAt) VALUES (?, ?, ?, ?, ?)').run(hook.id, event, JSON.stringify(data), 0, Date.now());
        return { hookId: hook.id, error: e.message };
      }
    }));
    return { ok: true, triggered: hooks.length, results };
  },
  logs: (limit = 100) => db.prepare('SELECT * FROM lio_webhook_logs ORDER BY createdAt DESC LIMIT ?').all(limit).map(r => ({ ...r, payload: JSON.parse(r.payload || '{}') })),
};
