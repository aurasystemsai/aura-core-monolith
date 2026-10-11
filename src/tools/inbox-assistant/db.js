const storage = require('../../core/storageJson');
const KEY = 'inbox-assistant';

function load() { return storage.get(KEY, { conversations: [], feedback: [], analytics: [] }); }
function save(d) { storage.set(KEY, d); }

module.exports = {
  async listConversations() { return load().conversations; },
  async addConversation(data) {
    const d = load(); const item = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    d.conversations.push(item); if (d.conversations.length > 500) d.conversations = d.conversations.slice(-500); save(d); return item;
  },
  async saveFeedback(fb) {
    const d = load(); d.feedback.push({ ...fb, id: Date.now().toString(), createdAt: new Date().toISOString() });
    if (d.feedback.length > 200) d.feedback = d.feedback.slice(-200); save(d);
  },
  async recordEvent(evt) {
    const d = load(); d.analytics.push({ ...evt, ts: new Date().toISOString() });
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500); save(d);
  },
  async listEvents() { return load().analytics; },
};
