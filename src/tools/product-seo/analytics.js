// Product SEO Engine: Analytics module
const storage = require("../../core/storageJson");

const STORAGE_KEY = "product-seo-analytics";

function load() {
  return storage.get(STORAGE_KEY, { events: [] });
}

function save(payload) {
  storage.set(STORAGE_KEY, payload);
}

function track(event, data = {}) {
  const now = new Date().toISOString();
  const current = load();
  current.events.unshift({ event, data, at: now });
  current.events = current.events.slice(0, 200);
  save(current);
  return { event, at: now };
}

function list(limit = 50) {
  const current = load();
  return current.events.slice(0, limit);
}

module.exports = { track, list };
