const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  role TEXT,
  createdAt INTEGER
)`);
const DEFAULT_PERMISSIONS = {
  admin: ['read', 'write', 'delete', 'export', 'import', 'manage'],
  editor: ['read', 'write', 'export'],
  viewer: ['read'],
};
module.exports = {
  check: (user, action) => {
    if (!user || !action) return false;
    const row = db.prepare('SELECT role FROM lio_roles WHERE user = ?').get(user);
    const role = row ? row.role : 'viewer';
    return (DEFAULT_PERMISSIONS[role] || []).includes(action);
  },
  assign: (user, role) => {
    const existing = db.prepare('SELECT id FROM lio_roles WHERE user = ?').get(user);
    if (existing) { db.prepare('UPDATE lio_roles SET role = ? WHERE user = ?').run(role, user); }
    else { db.prepare('INSERT INTO lio_roles (user, role, createdAt) VALUES (?, ?, ?)').run(user, role, Date.now()); }
    return { user, role };
  },
  listRoles: () => db.prepare('SELECT * FROM lio_roles').all(),
  permissions: DEFAULT_PERMISSIONS,
};
