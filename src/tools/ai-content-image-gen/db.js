// File-based storage for AI Content & Image Gen tool
const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '../../../data/ai-content-image-gen.json');

function read() {
  try {
    if (!fs.existsSync(DATA_FILE)) return defaultData();
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch { return defaultData(); }
}
function write(d) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}
function defaultData() {
  return { brandVoice: null, history: [], saved: [], loraJobs: [], analytics: [] };
}

module.exports = {
  // Brand Voice
  getBrandVoice() { return read().brandVoice; },
  saveBrandVoice(profile) {
    const d = read();
    d.brandVoice = { ...profile, updatedAt: new Date().toISOString() };
    write(d);
    return d.brandVoice;
  },
  clearBrandVoice() {
    const d = read(); d.brandVoice = null; write(d);
  },

  // History
  addHistory(entry) {
    const d = read();
    entry.id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    entry.createdAt = new Date().toISOString();
    d.history.unshift(entry);
    if (d.history.length > 500) d.history = d.history.slice(0, 500);
    write(d);
    return entry;
  },
  listHistory(type, limit = 50) {
    const d = read();
    const items = type ? d.history.filter(h => h.type === type) : d.history;
    return items.slice(0, limit);
  },
  deleteHistory(id) {
    const d = read();
    d.history = d.history.filter(h => h.id !== id);
    write(d);
  },

  // Saved outputs
  saveOutput(entry) {
    const d = read();
    entry.id = `saved-${Date.now()}`;
    entry.savedAt = new Date().toISOString();
    d.saved.unshift(entry);
    if (d.saved.length > 200) d.saved = d.saved.slice(0, 200);
    write(d);
    return entry;
  },
  listSaved() { return read().saved; },
  deleteSaved(id) {
    const d = read(); d.saved = d.saved.filter(s => s.id !== id); write(d);
  },

  // LoRA training jobs
  addLoraJob(job) {
    const d = read();
    job.id = `lora-${Date.now()}`;
    job.status = 'queued';
    job.createdAt = new Date().toISOString();
    d.loraJobs.unshift(job);
    write(d);
    return job;
  },
  updateLoraJob(id, updates) {
    const d = read();
    const idx = d.loraJobs.findIndex(j => j.id === id);
    if (idx !== -1) { d.loraJobs[idx] = { ...d.loraJobs[idx], ...updates }; write(d); }
    return d.loraJobs[idx];
  },
  listLoraJobs() { return read().loraJobs; },

  // Analytics
  recordEvent(ev) {
    const d = read();
    d.analytics.push({ ...ev, ts: new Date().toISOString() });
    if (d.analytics.length > 1000) d.analytics = d.analytics.slice(-1000);
    write(d);
  },
};
