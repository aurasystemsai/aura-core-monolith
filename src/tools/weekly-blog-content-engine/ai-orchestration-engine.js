const crypto = require('crypto');

const runs = new Map();
const providers = [
  { id: 'gpt-4', name: 'OpenAI GPT-4', strength: 'reasoning', latencyMs: 1100 },
  { id: 'claude-3', name: 'Claude 3', strength: 'context', latencyMs: 920 },
  { id: 'gemini-pro', name: 'Gemini Pro', strength: 'multimodal', latencyMs: 880 },
];

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function orchestrateRun(payload = {}) {
  const runId = id('run');
  const route = providers.map((p) => p.id).slice(0, 2);
  const run = {
    id: runId,
    strategy: payload.strategy || 'best-of-n',
    primaryKeyword: payload.primaryKeyword || 'weekly blog content',
    posts: payload.posts || 4,
    route,
    status: 'completed',
    qualityScore: 93,
    createdAt: new Date().toISOString(),
  };
  runs.set(runId, run);
  return run;
}

function runEnsemble(payload = {}) {
  const base = orchestrateRun(payload);
  return { ...base, strategy: 'ensemble', qualityScore: 95 };
}

function listProviders() {
  return providers;
}

function captureFeedback(runId, feedback) {
  const run = runs.get(runId) || orchestrateRun({});
  const updated = { ...run, feedback: feedback || 'No feedback provided' };
  runs.set(run.id, updated);
  return updated;
}

function getRun(runId) {
  if (!runs.has(runId)) throw new Error('Run not found');
  return runs.get(runId);
}

function getStats() {
  return {
    totalRuns: runs.size,
    avgQuality: runs.size ? 93 : 0,
    providers: providers.length,
  };
}

module.exports = {
  orchestrateRun,
  runEnsemble,
  listProviders,
  captureFeedback,
  getRun,
  getStats,
};
