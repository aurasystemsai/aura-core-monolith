// Programmable API, webhooks, and custom AI model endpoints
// Provides registry for webhooks and lightweight custom model handlers

const { v4: uuidv4 } = require('uuid');
const db = require('./db');

class ProgrammableAPI {
  constructor() {
    this.customModels = new Map(); // name -> async handler (in-memory only)
    this.ready = this._initTables();
  }

  async _initTables() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS programmable_webhooks (
        id TEXT PRIMARY KEY,
        url TEXT,
        events TEXT,
        createdAt INTEGER
      );
      CREATE TABLE IF NOT EXISTS programmable_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhookId TEXT,
        event TEXT,
        payload TEXT,
        queuedAt INTEGER
      );
    `);
  }

  async registerWebhook(url, events = []) {
    await this.ready;
    const id = uuidv4();
    await db.query('INSERT OR REPLACE INTO programmable_webhooks (id, url, events, createdAt) VALUES (?, ?, ?, ?)', [id, url, JSON.stringify(events), Date.now()]);
    return { id, url, events };
  }

  async listWebhooks() {
    await this.ready;
    return (await db
      .queryAll('SELECT id, url, events, createdAt FROM programmable_webhooks ORDER BY createdAt DESC'))
      .map(r => ({ id: r.id, url: r.url, events: safeParse(r.events, []), createdAt: r.createdAt }));
  }

  async emitEvent(event, payload = {}) {
    await this.ready;
    const hooks = (await this.listWebhooks()).filter(w => !w.events.length || w.events.includes(event));
    const delivery = hooks.map(w => ({ webhookId: w.id, event, payload, queuedAt: Date.now() }));
    for (const d of delivery) {
      await db.query('INSERT INTO programmable_queue (webhookId, event, payload, queuedAt) VALUES (?, ?, ?, ?)', [d.webhookId, d.event, JSON.stringify(d.payload), d.queuedAt]);
    }
    return { ok: true, deliveries: delivery };
  }

  async pollQueue(limit = 20) {
    await this.ready;
    const items = (await db.queryAll('SELECT id, webhookId, event, payload, queuedAt FROM programmable_queue ORDER BY id ASC LIMIT ?', [limit]))
      .map(r => ({ id: r.id, webhookId: r.webhookId, event: r.event, payload: safeParse(r.payload), queuedAt: r.queuedAt }));
    if (items.length) {
      const ids = items.map(i => i.id);
      const placeholders = ids.map(() => '?').join(',');
      await db.query(`DELETE FROM programmable_queue WHERE id IN (${placeholders})`, ids);
    }
    return items;
  }

  registerCustomModel(name, handler) {
    this.customModels.set(name, handler);
    return { ok: true, name };
  }

  async invokeCustomModel(name, input) {
    const handler = this.customModels.get(name);
    if (!handler) return { ok: false, error: 'model not found' };
    const output = await handler(input);
    return { ok: true, output };
  }

  async reset() {
    await this.ready;
    await db.exec('DELETE FROM programmable_webhooks; DELETE FROM programmable_queue;');
    this.customModels.clear();
  }
}

function safeParse(str, fallback = {}) {
  try {
    const parsed = JSON.parse(str);
    return parsed === null ? fallback : parsed;
  } catch (_err) {
    return fallback;
  }
}

module.exports = new ProgrammableAPI();
