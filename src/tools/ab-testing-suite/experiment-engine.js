const { randomUUID } = require('crypto');

const fs = require('fs');
const path = require('path');

const experiments = new Map();
const results = new Map();

// Experiments survive restarts; tests stay in memory.
const FILE = process.env.NODE_ENV === 'test' ? null : path.join(process.env.AURA_DATA_DIR || path.join(__dirname, '..', '..', '..', 'data'), 'ab-experiments.json');
function persist() {
  if (!FILE) return;
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify([...experiments.values()]));
  } catch (e) { console.error('[ab-testing] could not save experiments:', e.message); }
}
if (FILE && fs.existsSync(FILE)) {
  try {
    for (const e of JSON.parse(fs.readFileSync(FILE, 'utf8'))) { experiments.set(e.id, e); results.set(e.id, e.events || []); }
  } catch (e) { console.error('[ab-testing] could not load experiments:', e.message); }
}

function createExperiment(input = {}) {
  const experiment = {
    id: randomUUID(),
    shop: input.shop || 'local',
    name: String(input.name || 'Untitled experiment').trim(),
    description: input.description || '',
    type: input.type || 'ab',
    status: 'draft',
    variants: Array.isArray(input.variants) ? input.variants.map(v => ({ ...v })) : [],
    goals: Array.isArray(input.goals) ? input.goals.map(g => ({ ...g })) : [],
    sampleSize: Number.isFinite(Number(input.sampleSize)) ? Number(input.sampleSize) : null,
    confidenceLevel: Number.isFinite(Number(input.confidenceLevel)) ? Number(input.confidenceLevel) : 0.95,
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  experiments.set(experiment.id, experiment);
  results.set(experiment.id, []);
  persist();
  return experiment;
}

function listExperiments() {
  return [...experiments.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getExperiment(id) {
  return experiments.get(id) || null;
}

function updateExperiment(id, updates = {}) {
  const experiment = getExperiment(id);
  if (!experiment) return null;
  Object.assign(experiment, updates, { id, shop: experiment.shop, updatedAt: new Date().toISOString() });
  persist();
  return experiment;
}

function deleteExperiment(id) {
  results.delete(id);
  const removed = experiments.delete(id);
  persist();
  return removed;
}

function startExperiment(id) {
  const experiment = updateExperiment(id, { status: 'running', startedAt: new Date().toISOString() });
  return experiment;
}

function pauseExperiment(id) {
  return updateExperiment(id, { status: 'paused', pausedAt: new Date().toISOString() });
}

function stopExperiment(id) {
  return updateExperiment(id, { status: 'stopped', stoppedAt: new Date().toISOString() });
}

function trackEvent(id, event = {}) {
  const experiment = getExperiment(id);
  if (!experiment) return null;
  if (!event.variantId || !event.type || !event.visitorId) {
    throw new Error('variantId, type, and visitorId are required');
  }
  const tracked = { ...event, id: randomUUID(), timestamp: new Date().toISOString() };
  experiment.events.push(tracked);
  results.get(id).push(tracked);
  persist();
  return tracked;
}

module.exports = {
  experiments, results, createExperiment, listExperiments, getExperiment,
  updateExperiment, deleteExperiment, startExperiment, pauseExperiment,
  stopExperiment, trackEvent,
};
