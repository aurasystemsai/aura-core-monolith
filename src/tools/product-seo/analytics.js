// Product SEO Engine: Analytics module
const storage = require("../../core/storageJson");

const STORAGE_KEY = "product-seo-analytics";

function load() {
  return storage.get(STORAGE_KEY, { events: [] });
}

function save(payload) {
  storage.set(STORAGE_KEY, payload);
}

// Track a single event
function track(event, data = {}) {
  const now = new Date().toISOString();
  const current = load();
  current.events.unshift({ event, data, at: now });
  current.events = current.events.slice(0, 200);
  save(current);
  return { event, at: now };
}

// Record event from arbitrary payloads (backward compatible)
function recordEvent(payload = {}) {
  const eventName = payload.event || payload.type || 'event';
  const data = payload.data || payload;
  return track(eventName, data);
}

// List events with optional type filter
function list(limit = 50) {
  const current = load();
  const events = Array.isArray(current.events) ? current.events : [];
  return events.slice(0, limit);
}

function listEvents({ type, limit = 50 } = {}) {
  const events = list(limit);
  if (!type) return events;
  return events.filter(e => e.event === type).slice(0, limit);
}

module.exports = { track, list, recordEvent, listEvents };
