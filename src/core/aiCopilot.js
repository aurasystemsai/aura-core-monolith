// Proactive, personalized AI Copilot/Agent for Aura Systems
// Provides next-best-actions, proactive pings, and conversational assistance leveraging OpenAI

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const { getOpenAIClient } = require('./openaiClient');
const notifications = require('./notifications');
const db = require('./db');

class AICopilot extends EventEmitter {
  constructor() {
    super();
    this.openai = getOpenAIClient();
    this.userState = new Map();
    this.ready = this._initTables();
    this.maxHistory = 50;
  }

  async _initTables() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ai_copilot_profiles (
        userId TEXT PRIMARY KEY,
        profile TEXT
      );
      CREATE TABLE IF NOT EXISTS ai_copilot_signals (
        id TEXT PRIMARY KEY,
        userId TEXT,
        ts INTEGER,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS ai_copilot_actions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        status TEXT,
        ts INTEGER,
        completedAt INTEGER,
        result TEXT,
        data TEXT
      );
      CREATE TABLE IF NOT EXISTS ai_copilot_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        role TEXT,
        message TEXT,
        ts INTEGER
      );
    `);
  }

  async _getState(userId) {
    await this.ready;
    if (this.userState.has(userId)) return this.userState.get(userId);

    const profileRow = await db.queryOne('SELECT profile FROM ai_copilot_profiles WHERE userId = ?', [userId]);
    const signalsRows = await db.queryAll('SELECT id, ts, data FROM ai_copilot_signals WHERE userId = ? ORDER BY ts ASC', [userId]);
    const actionsRows = await db.queryAll('SELECT id, status, ts, completedAt, result, data FROM ai_copilot_actions WHERE userId = ? ORDER BY ts ASC', [userId]);
    const chatsRows = await db.queryAll('SELECT role, message, ts FROM ai_copilot_chats WHERE userId = ? ORDER BY id ASC', [userId]);
    const signals = signalsRows.map(r => ({ id: r.id, ts: r.ts, ...safeParse(r.data) }));
    const actions = actionsRows.map(r => ({ id: r.id, status: r.status, ts: r.ts, completedAt: r.completedAt, result: safeParse(r.result), ...safeParse(r.data) }));
    const chats = chatsRows.map(r => ({ role: r.role, message: r.message, ts: r.ts }));

    const state = {
      profile: profileRow ? safeParse(profileRow.profile) : {},
      signals,
      actions,
      chats,
    };
    this.userState.set(userId, state);
    return state;
  }

  async upsertProfile(userId, profile = {}) {
    const state = await this._getState(userId);
    state.profile = { ...state.profile, ...profile };
    await db.query('INSERT OR REPLACE INTO ai_copilot_profiles (userId, profile) VALUES (?, ?)', [userId, JSON.stringify(state.profile)]);
    return state.profile;
  }

  async ingestSignals(userId, signals = {}) {
    const state = await this._getState(userId);
    const entry = { id: uuidv4(), ts: Date.now(), ...signals };
    state.signals.push(entry);
    if (state.signals.length > this.maxHistory) state.signals.shift();
    this.emit('signals:ingested', { userId, entry });
    await db.query('INSERT OR REPLACE INTO ai_copilot_signals (id, userId, ts, data) VALUES (?, ?, ?, ?)', [entry.id, userId, entry.ts, JSON.stringify(signals)]);
    return entry;
  }

  async enqueueAction(userId, action) {
    const state = await this._getState(userId);
    const item = { id: uuidv4(), status: 'pending', ts: Date.now(), ...action };
    state.actions.push(item);
    this.emit('action:queued', { userId, item });
    await db.query('INSERT OR REPLACE INTO ai_copilot_actions (id, userId, status, ts, data) VALUES (?, ?, ?, ?, ?)', [item.id, userId, item.status, item.ts, JSON.stringify(action)]);
    return item;
  }

  async completeAction(userId, actionId, result = {}) {
    const state = await this._getState(userId);
    const item = state.actions.find(a => a.id === actionId);
    if (!item) return { ok: false, error: 'action not found' };
    item.status = 'completed';
    item.result = result;
    item.completedAt = Date.now();
    this.emit('action:completed', { userId, item });
    await db.query('INSERT OR REPLACE INTO ai_copilot_actions (id, userId, status, ts, completedAt, result, data) VALUES (?, ?, ?, ?, ?, ?, ?)', [item.id, userId, item.status, item.ts, item.completedAt, JSON.stringify(result), JSON.stringify(item)]);
    return { ok: true, item };
  }

  async respondToQuery(userId, message, context = {}) {
    const state = await this._getState(userId);
    const history = state.chats.slice(-4).map(c => ({ role: c.role, content: c.message }));
    const systemPrompt = `You are Aura's proactive AI copilot. Be concise, action-oriented, and specific. Tailor guidance to marketing, commerce, and automation. If data is missing, ask for the smallest next fact.`;
    const userPrompt = JSON.stringify({ message, profile: state.profile, context });

    const completion = await this._chat([{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userPrompt }]);
    const reply = completion || 'AI copilot is not configured; please set OPENAI_API_KEY.';

    state.chats.push({ role: 'user', message });
    state.chats.push({ role: 'assistant', message: reply });
    if (state.chats.length > this.maxHistory) state.chats.shift();
    await db.query('INSERT INTO ai_copilot_chats (userId, role, message, ts) VALUES (?, ?, ?, ?)', [userId, 'user', message, Date.now()]);
    await db.query('INSERT INTO ai_copilot_chats (userId, role, message, ts) VALUES (?, ?, ?, ?)', [userId, 'assistant', reply, Date.now()]);

    return { ok: true, reply };
  }

  async nextBestActions(userId, options = {}) {
    const state = await this._getState(userId);
    const { signals, profile } = state;
    const latest = signals.slice(-5);
    const prompt = `Given the latest signals ${JSON.stringify(latest)} and profile ${JSON.stringify(profile)}, propose 3 next-best-actions with priority and rationale. Format: [{title, priority, rationale, impact, effort}].`;
    const reply = await this._chat([{ role: 'system', content: 'You are an operations copilot returning JSON only.' }, { role: 'user', content: prompt }]);
    return { ok: true, suggestions: reply };
  }

  async proactivePing(userId, reason = 'insight') {
    const state = this._getState(userId);
    const latest = state.signals[state.signals.length - 1];
    const message = `Proactive ping (${reason}): ${latest ? JSON.stringify(latest) : 'No recent signals'}`;
    notifications.addNotification({ type: 'copilot', message, time: Date.now() });
    this.emit('copilot:ping', { userId, message });
    return { ok: true, message };
  }

  async getUserState(userId) {
    return this._getState(userId);
  }

  async reset(userId) {
    await this.ready;
    if (userId) {
      this.userState.delete(userId);
      await db.query('DELETE FROM ai_copilot_profiles WHERE userId = ?', [userId]);
      await db.query('DELETE FROM ai_copilot_signals WHERE userId = ?', [userId]);
      await db.query('DELETE FROM ai_copilot_actions WHERE userId = ?', [userId]);
      await db.query('DELETE FROM ai_copilot_chats WHERE userId = ?', [userId]);
    } else {
      this.userState.clear();
      await db.exec('DELETE FROM ai_copilot_profiles; DELETE FROM ai_copilot_signals; DELETE FROM ai_copilot_actions; DELETE FROM ai_copilot_chats;');
    }
  }

  async _chat(messages) {
    if (!this.openai) return null;
    if (typeof this.openai.chat?.completions?.create === 'function') {
      const res = await this.openai.chat.completions.create({ model: 'gpt-4o-mini', messages, max_tokens: 200 });
      return res?.choices?.[0]?.message?.content?.trim();
    }
    if (typeof this.openai.createChatCompletion === 'function') {
      const res = await this.openai.createChatCompletion({ model: 'gpt-4o-mini', messages, max_tokens: 200 });
      return res?.data?.choices?.[0]?.message?.content?.trim();
    }
    return null;
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

module.exports = new AICopilot();
