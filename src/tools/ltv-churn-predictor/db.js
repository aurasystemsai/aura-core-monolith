// Persistent file-based storage for ltv-churn-predictor
const storage = require('../../core/storageJson');
const KEY = 'ltv-churn-predictor';

function getData() {
  return storage.get(KEY, { predictions: [], feedback: [] });
}
function save(d) { storage.set(KEY, d); }

module.exports = {
  async savePrediction(entry) {
    const d = getData();
    entry.id = entry.id || `pred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    entry.createdAt = new Date().toISOString();
    d.predictions.unshift(entry);
    if (d.predictions.length > 300) d.predictions = d.predictions.slice(0, 300);
    save(d);
    return entry;
  },
  async listPredictions() { return getData().predictions; },
  async saveFeedback(fb) {
    const d = getData();
    const entry = { ...fb, id: `fb-${Date.now()}`, ts: new Date().toISOString() };
    d.feedback.push(entry);
    if (d.feedback.length > 100) d.feedback = d.feedback.slice(-100);
    save(d);
    return entry;
  },
};