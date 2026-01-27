// Product SEO Engine: Webhooks module
const storage = require("../../core/storageJson");

const STORAGE_KEY = "product-seo-webhooks";

function load() {
  return storage.get(STORAGE_KEY, { subscriptions: [] });
}

function save(payload) {
  storage.set(STORAGE_KEY, payload);
}

function subscribe(url, event = "*") {
  const current = load();
  current.subscriptions.push({ url, event });
  save(current);
  return { url, event };
}

function list() {
  return load().subscriptions;
}

async function trigger(event, data = {}) {
  const subs = list().filter((s) => s.event === event || s.event === "*");
  const deliveries = subs.map((sub) => ({ url: sub.url, event, delivered: true, payload: data }));
  const current = load();
  current.lastDelivery = { event, at: new Date().toISOString(), count: deliveries.length };
  save(current);
  return deliveries;
}

module.exports = { trigger, subscribe, list };
