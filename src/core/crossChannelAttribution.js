// Cross-Channel Attribution & Unified Data Model Engine for Aura Systems
// Extensible module for fusing multi-source marketing/commerce data and attributing outcomes

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

class CrossChannelAttribution extends EventEmitter {
  constructor() {
    super();
    this.channels = ['email', 'ads', 'organic', 'social', 'sms', 'push', 'referral', 'direct'];
    this.attributionModels = ['last-touch', 'first-touch', 'linear', 'time-decay', 'custom'];
    this.ready = this._initTables();
  }

  async _initTables() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cross_channel_events (
        id TEXT PRIMARY KEY,
        channel TEXT,
        userId TEXT,
        timestamp INTEGER,
        type TEXT,
        meta TEXT
      );
    `);
  }

  /**
   * Ingests a raw event from any channel, normalizes, and stores in unified model
   * @param {Object} event - { channel, userId, timestamp, type, meta }
   */
  async ingestEvent(event) {
    await this.ready;
    const normalized = {
      id: uuidv4(),
      channel: event.channel,
      userId: event.userId,
      timestamp: event.timestamp || Date.now(),
      type: event.type,
      meta: event.meta || {},
    };
    await db.query('INSERT OR REPLACE INTO cross_channel_events (id, channel, userId, timestamp, type, meta) VALUES (?, ?, ?, ?, ?, ?)', [
      normalized.id,
      normalized.channel,
      normalized.userId,
      normalized.timestamp,
      normalized.type,
      JSON.stringify(normalized.meta),
    ]);
    this.emit('eventIngested', normalized);
    return normalized;
  }

  /**
   * Returns all unified events, optionally filtered
   */
  async getEvents(filter = {}) {
    await this.ready;
    const clauses = [];
    const params = [];
    Object.entries(filter).forEach(([k, v]) => {
      clauses.push(`${k} = ?`);
      params.push(v);
    });
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await db.queryAll(`SELECT id, channel, userId, timestamp, type, meta FROM cross_channel_events ${where} ORDER BY timestamp ASC`, params);
    return rows.map(r => ({ id: r.id, channel: r.channel, userId: r.userId, timestamp: r.timestamp, type: r.type, meta: safeParse(r.meta) }));
  }

  /**
   * Computes attribution for a given user and conversion event
   * @param {String} userId
   * @param {String} conversionType
   * @param {String} model - Attribution model
   * @returns {Object} Attribution breakdown
   */
  async attribute(userId, conversionType, model = 'last-touch') {
    const events = await this.getEvents({ userId });
    const conversions = events.filter(e => e.type === conversionType);
    if (!conversions.length) return { ok: false, error: 'No conversion events' };
    const conversion = conversions[conversions.length - 1];
    const preConversion = events.filter(e => e.timestamp <= conversion.timestamp && e.type !== conversionType);
    let attribution = {};
    switch (model) {
      case 'last-touch': {
        const last = preConversion[preConversion.length - 1];
        if (last) attribution[last.channel] = 1;
        break;
      }
      case 'first-touch': {
        const first = preConversion[0];
        if (first) attribution[first.channel] = 1;
        break;
      }
      case 'linear': {
        preConversion.forEach(e => {
          attribution[e.channel] = (attribution[e.channel] || 0) + 1;
        });
        const total = Object.values(attribution).reduce((a, b) => a + b, 0);
        Object.keys(attribution).forEach(k => attribution[k] /= total);
        break;
      }
      case 'time-decay': {
        const now = conversion.timestamp;
        preConversion.forEach(e => {
          const decay = Math.exp(-(now - e.timestamp) / (1000 * 60 * 60 * 24));
          attribution[e.channel] = (attribution[e.channel] || 0) + decay;
        });
        const sum = Object.values(attribution).reduce((a, b) => a + b, 0);
        Object.keys(attribution).forEach(k => attribution[k] /= sum);
        break;
      }
      case 'custom': {
        // Placeholder for custom model logic
        attribution = { custom: 1 };
        break;
      }
      default:
        return { ok: false, error: 'Unknown attribution model' };
    }
    return { ok: true, attribution, conversion };
  }

  /**
   * Returns a unified data model for a user (all events, all channels)
   */
  async getUserJourney(userId) {
    const events = await this.getEvents({ userId });
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Resets all stored events (for testing/demo)
   */
  async reset() {
    await this.ready;
    await db.exec('DELETE FROM cross_channel_events;');
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

module.exports = new CrossChannelAttribution();
