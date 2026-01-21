// src/core/emailAutomation.js
// Persistent store for email automation builder
const db = require('./db');

// Ensure emails table exists
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`;
db.prepare(INIT_SQL).run();

function addEmail({ subject, body }) {
  const stmt = db.prepare('INSERT INTO emails (subject, body, created_at) VALUES (?, ?, ?)');
  const info = stmt.run(subject, body, Date.now());
  return { id: info.lastInsertRowid, subject, body, created_at: Date.now() };
}

function listEmails(limit = 100) {
  const stmt = db.prepare('SELECT * FROM emails ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit);
}

function getEmail(id) {
  const stmt = db.prepare('SELECT * FROM emails WHERE id = ?');
  return stmt.get(id);
}

function updateEmail(id, { subject, body }) {
  const stmt = db.prepare('UPDATE emails SET subject = ?, body = ? WHERE id = ?');
  stmt.run(subject, body, id);
  return getEmail(id);
}

function deleteEmail(id) {
  const stmt = db.prepare('DELETE FROM emails WHERE id = ?');
  stmt.run(id);
}

function importEmails(data) {
  if (!Array.isArray(data)) throw new Error('Invalid data');
  const stmt = db.prepare('INSERT INTO emails (subject, body, created_at) VALUES (?, ?, ?)');
  let count = 0;
  for (const e of data) {
    if (e.subject && e.body) {
      stmt.run(e.subject, e.body, Date.now());
      count++;
    }
  }
  return count;
}

function exportEmails(limit = 1000) {
  return listEmails(limit);
}

function totalEmails() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM emails');
  return stmt.get().count;
}

module.exports = { addEmail, listEmails, getEmail, updateEmail, deleteEmail, importEmails, exportEmails, totalEmails };