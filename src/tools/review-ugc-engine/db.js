// Persistent file-based storage for review-ugc-engine
const storage = require('../../core/storageJson');
const KEY = 'review-ugc-engine';

function getData() {
  return storage.get(KEY, {
    reviews: [],
    campaigns: [],
    templates: [],
    widgets: [],
    moderationRules: [],
    blockedWords: [],
    blockedEmails: [],
    socialProofRules: [],
    trustBadges: [],
    socialProofElements: [],
    abTests: [],
    analytics: [],
  });
}
function save(d) { storage.set(KEY, d); }

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Generic CRUD factory for any collection
function collectionCrud(collectionName, prefix) {
  return {
    async list() { return getData()[collectionName] || []; },
    async get(id) { return (getData()[collectionName] || []).find(i => i.id === id) || null; },
    async create(item) {
      const d = getData();
      item.id = item.id || makeId(prefix);
      item.createdAt = item.createdAt || new Date().toISOString();
      if (!d[collectionName]) d[collectionName] = [];
      d[collectionName].unshift(item);
      if (d[collectionName].length > 500) d[collectionName] = d[collectionName].slice(0, 500);
      save(d);
      return item;
    },
    async update(id, updates) {
      const d = getData();
      const arr = d[collectionName] || [];
      const idx = arr.findIndex(i => i.id === id);
      if (idx === -1) return null;
      arr[idx] = { ...arr[idx], ...updates, updatedAt: new Date().toISOString() };
      save(d);
      return arr[idx];
    },
    async delete(id) {
      const d = getData();
      const arr = d[collectionName] || [];
      const idx = arr.findIndex(i => i.id === id);
      if (idx === -1) return false;
      arr.splice(idx, 1);
      save(d);
      return true;
    },
  };
}

module.exports = {
  reviews: collectionCrud('reviews', 'rev'),
  campaigns: collectionCrud('campaigns', 'camp'),
  templates: collectionCrud('templates', 'tpl'),
  widgets: collectionCrud('widgets', 'wgt'),
  moderationRules: collectionCrud('moderationRules', 'rule'),
  socialProofRules: collectionCrud('socialProofRules', 'spr'),
  trustBadges: collectionCrud('trustBadges', 'badge'),
  socialProofElements: collectionCrud('socialProofElements', 'elem'),
  abTests: collectionCrud('abTests', 'abt'),

  // Simple key-value lists
  async getBlockedWords() { return getData().blockedWords || []; },
  async addBlockedWord(word) {
    const d = getData();
    if (!d.blockedWords.includes(word)) d.blockedWords.push(word);
    save(d);
  },
  async removeBlockedWord(word) {
    const d = getData();
    d.blockedWords = d.blockedWords.filter(w => w !== word);
    save(d);
  },
  async getBlockedEmails() { return getData().blockedEmails || []; },
  async addBlockedEmail(email) {
    const d = getData();
    if (!d.blockedEmails.includes(email)) d.blockedEmails.push(email);
    save(d);
  },
  async removeBlockedEmail(email) {
    const d = getData();
    d.blockedEmails = d.blockedEmails.filter(e => e !== email);
    save(d);
  },

  // Analytics
  async recordEvent(event) {
    const d = getData();
    const ev = { ...event, id: `ev-${Date.now()}`, ts: new Date().toISOString() };
    d.analytics.push(ev);
    if (d.analytics.length > 1000) d.analytics = d.analytics.slice(-1000);
    save(d);
    return ev;
  },
  async listEvents() { return getData().analytics || []; },
};