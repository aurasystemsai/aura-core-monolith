// db.js — file-based storage for AI Visibility Tracker
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../../data');
const DB_FILE = path.join(DATA_DIR, 'ai-visibility-tracker.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { trackedPrompts: [], citations: [], audits: [], events: [], feedback: [] };
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch { return { trackedPrompts: [], citations: [], audits: [], events: [], feedback: [] }; }
}

function writeDB(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const db = {
  // Tracked prompts
  listPrompts() { return readDB().trackedPrompts || []; },
  getPrompt(id) { return (readDB().trackedPrompts || []).find(p => p.id === id) || null; },
  savePrompt(data) {
    const d = readDB();
    const existing = (d.trackedPrompts || []).findIndex(p => p.id === data.id);
    const entry = { id: data.id || crypto.randomUUID(), createdAt: new Date().toISOString(), ...data, updatedAt: new Date().toISOString() };
    if (existing >= 0) d.trackedPrompts[existing] = entry;
    else (d.trackedPrompts = d.trackedPrompts || []).push(entry);
    writeDB(d); return entry;
  },
  deletePrompt(id) {
    const d = readDB();
    const before = (d.trackedPrompts || []).length;
    d.trackedPrompts = (d.trackedPrompts || []).filter(p => p.id !== id);
    writeDB(d); return d.trackedPrompts.length < before;
  },

  // Citation records
  saveCitation(data) {
    const d = readDB();
    const entry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    (d.citations = d.citations || []).unshift(entry);
    if (d.citations.length > 500) d.citations = d.citations.slice(0, 500);
    writeDB(d); return entry;
  },
  listCitations(limit = 100) { return (readDB().citations || []).slice(0, limit); },

  // Audits (robots, crawlability, llms.txt)
  saveAudit(data) {
    const d = readDB();
    const entry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    (d.audits = d.audits || []).unshift(entry);
    if (d.audits.length > 200) d.audits = d.audits.slice(0, 200);
    writeDB(d); return entry;
  },
  listAudits(limit = 50) { return (readDB().audits || []).slice(0, limit); },

  // Events
  recordEvent(data) {
    const d = readDB();
    const entry = { id: crypto.randomUUID(), ts: new Date().toISOString(), ...data };
    (d.events = d.events || []).unshift(entry);
    if (d.events.length > 1000) d.events = d.events.slice(0, 1000);
    writeDB(d); return entry;
  },
  listEvents(limit = 100) { return (readDB().events || []).slice(0, limit); },

  // Feedback
  saveFeedback(data) {
    const d = readDB();
    const entry = { id: crypto.randomUUID(), ts: new Date().toISOString(), ...data };
    (d.feedback = d.feedback || []).push(entry);
    writeDB(d); return entry;
  },
};

module.exports = db;
