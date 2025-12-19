// src/core/fixQueueStore.js
const path = require("path");
const crypto = require("crypto");
const { readJson, writeJson } = require("./storageJson");

const DATA_PATH = path.join(__dirname, "..", "data", "fix-queue.json");

function nowIso() {
  return new Date().toISOString();
}

function addMs(iso, ms) {
  const d = iso ? new Date(iso) : new Date();
  return new Date(d.getTime() + ms).toISOString();
}

function newId() {
  return crypto.randomUUID();
}

async function load() {
  return readJson(DATA_PATH, { items: [] });
}

async function save(db) {
  return writeJson(DATA_PATH, db);
}

async function createItem(payload) {
  const db = await load();

  const item = {
    id: newId(),
    ...payload,

    status: "pending", // pending | in_flight | sent | failed | dead
    attempts: 0,
    lastError: null,
    nextAttemptAt: nowIso(),

    createdAt: nowIso(),
    updatedAt: nowIso(),
    sentAt: null,
  };

  db.items.unshift(item);
  await save(db);

  return item;
}

async function listItems({ projectId, status, limit = 200 } = {}) {
  const db = await load();
  let items = db.items.slice();

  if (projectId) items = items.filter((i) => i.projectId === projectId);
  if (status) items = items.filter((i) => i.status === status);

  return items.slice(0, Number(limit) || 200);
}

async function getItem(id) {
  const db = await load();
  return db.items.find((i) => i.id === id) || null;
}

async function updateItem(id, patch) {
  const db = await load();
  const idx = db.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;

  const next = {
    ...db.items[idx],
    ...patch,
    updatedAt: nowIso(),
  };

  db.items[idx] = next;
  await save(db);
  return next;
}

async function markInFlight(id) {
  return updateItem(id, { status: "in_flight" });
}

async function markSent(id) {
  return updateItem(id, { status: "sent", sentAt: nowIso(), lastError: null });
}

async function markFailed(id, errorMessage, nextAttemptAt) {
  return updateItem(id, {
    status: "failed",
    lastError: String(errorMessage || "Unknown error"),
    nextAttemptAt: nextAttemptAt || nowIso(),
  });
}

async function incrementAttempts(id) {
  const item = await getItem(id);
  if (!item) return null;
  return updateItem(id, { attempts: Number(item.attempts || 0) + 1 });
}

async function markDead(id, errorMessage) {
  return updateItem(id, {
    status: "dead",
    lastError: String(errorMessage || "Dead-lettered"),
    nextAttemptAt: null,
  });
}

async function dueItems(limit = 25) {
  const db = await load();
  const now = new Date();

  const due = db.items
    .filter((i) => {
      if (!i) return false;
      if (i.status !== "pending" && i.status !== "failed") return false;
      if (!i.nextAttemptAt) return false;
      return new Date(i.nextAttemptAt).getTime() <= now.getTime();
    })
    .sort((a, b) => {
      // higher priority first, then oldest
      const pa = Number(a.priority || 3);
      const pb = Number(b.priority || 3);
      if (pb !== pa) return pb - pa;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, limit);

  return due;
}

function computeBackoffMs(attempt) {
  // Exponential-ish backoff with ceiling
  // attempt: 1 => 30s, 2 => 60s, 3 => 120s, 4 => 240s, 5 => 480s, 6 => 900s
  const table = [30000, 60000, 120000, 240000, 480000, 900000];
  return table[Math.max(0, Math.min(table.length - 1, attempt - 1))];
}

module.exports = {
  nowIso,
  addMs,
  createItem,
  listItems,
  getItem,
  updateItem,
  markInFlight,
  markSent,
  markFailed,
  incrementAttempts,
  markDead,
  dueItems,
  computeBackoffMs,
};
