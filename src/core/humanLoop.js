// Human-in-the-loop, crowdsourced, and community intelligence features
// Supports review queues, feedback capture, and community voting

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const notifications = require('./notifications');
const db = require('./db');

class HumanLoop extends EventEmitter {
  constructor() {
    super();
    this.ready = this._initTables();
  }

  async _initTables() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS human_loop_tasks (
        id TEXT PRIMARY KEY,
        type TEXT,
        payload TEXT,
        assignee TEXT,
        status TEXT,
        createdAt INTEGER
      );
      CREATE TABLE IF NOT EXISTS human_loop_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId TEXT,
        reviewer TEXT,
        decision TEXT,
        notes TEXT,
        ts INTEGER
      );
      CREATE TABLE IF NOT EXISTS human_loop_ideas (
        id TEXT PRIMARY KEY,
        text TEXT,
        votes INTEGER,
        createdAt INTEGER
      );
    `);
  }

  async createTask(type, payload = {}, { assignee } = {}) {
    await this.ready;
    const id = uuidv4();
    const task = { id, type, payload, assignee, status: 'pending', createdAt: Date.now() };
    await db.query('INSERT OR REPLACE INTO human_loop_tasks (id, type, payload, assignee, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)', [id, type, JSON.stringify(payload), assignee || null, task.status, task.createdAt]);
    notifications.addNotification({ type: 'hitl', message: `New HITL task: ${type}`, time: Date.now() });
    this.emit('task:new', task);
    return task;
  }

  async recordFeedback(taskId, { reviewer, decision, notes }) {
    await this.ready;
    const exists = await db.queryOne('SELECT id FROM human_loop_tasks WHERE id = ?', [taskId]);
    if (!exists) return { ok: false, error: 'task not found' };
    const entry = { reviewer, decision, notes, ts: Date.now() };
    await db.query('INSERT INTO human_loop_feedback (taskId, reviewer, decision, notes, ts) VALUES (?, ?, ?, ?, ?)', [taskId, reviewer, decision, notes || null, entry.ts]);
    this.emit('task:feedback', { taskId, entry });
    return { ok: true, entry };
  }

  async finalizeTask(taskId) {
    await this.ready;
    const task = await db.queryOne('SELECT id, status FROM human_loop_tasks WHERE id = ?', [taskId]);
    if (!task) return { ok: false, error: 'task not found' };
    const fb = await db.queryAll('SELECT decision FROM human_loop_feedback WHERE taskId = ?', [taskId]);
    const approvals = fb.filter(f => f.decision === 'approve').length;
    const rejects = fb.filter(f => f.decision === 'reject').length;
    const status = approvals >= rejects ? 'approved' : 'rejected';
    await db.query('UPDATE human_loop_tasks SET status = ? WHERE id = ?', [status, taskId]);
    this.emit('task:finalized', { taskId, status });
    return { ok: true, task: { ...task, status } };
  }

  async submitIdea(text) {
    await this.ready;
    const id = uuidv4();
    const idea = { id, text, votes: 0, createdAt: Date.now() };
    await db.query('INSERT OR REPLACE INTO human_loop_ideas (id, text, votes, createdAt) VALUES (?, ?, ?, ?)', [id, text, idea.votes, idea.createdAt]);
    return idea;
  }

  async voteIdea(id, delta = 1) {
    await this.ready;
    const idea = await db.queryOne('SELECT id, text, votes, createdAt FROM human_loop_ideas WHERE id = ?', [id]);
    if (!idea) return { ok: false, error: 'idea not found' };
    const votes = (idea.votes || 0) + delta;
    await db.query('UPDATE human_loop_ideas SET votes = ? WHERE id = ?', [votes, id]);
    return { ok: true, idea: { ...idea, votes } };
  }

  async topIdeas(limit = 10) {
    await this.ready;
    return (await db
      .queryAll('SELECT id, text, votes, createdAt FROM human_loop_ideas ORDER BY votes DESC LIMIT ?', [limit]))
      .map(r => ({ id: r.id, text: r.text, votes: r.votes, createdAt: r.createdAt }));
  }

  async reset() {
    await this.ready;
    await db.exec('DELETE FROM human_loop_tasks; DELETE FROM human_loop_feedback; DELETE FROM human_loop_ideas;');
  }
}

module.exports = new HumanLoop();
