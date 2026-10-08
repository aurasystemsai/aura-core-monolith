const { randomUUID } = require('crypto');

const allocations = new Map();
const assignments = new Map();
const armStats = new Map();

function createAllocator(experimentId, config = {}) {
  const allocator = {
    id: randomUUID(),
    experimentId,
    type: config.type || 'fixed',
    method: config.method || 'weighted',
    variants: Array.isArray(config.variants) ? config.variants.map(v => ({ ...v })) : [],
    updatedAt: new Date().toISOString(),
  };
  allocations.set(experimentId, allocator);
  return allocator;
}

function assignVariant(experimentId, visitorId) {
  const key = `${experimentId}:${visitorId}`;
  if (assignments.has(key)) return assignments.get(key);
  const allocator = allocations.get(experimentId);
  if (!allocator?.variants.length) throw new Error('No traffic allocator or variants configured');
  const variants = allocator.variants;
  const totalWeight = variants.reduce((sum, v) => sum + Math.max(0, Number(v.trafficWeight) || 0), 0);
  let draw = Math.random() * (totalWeight || variants.length);
  const selected = variants.find(v => {
    draw -= totalWeight ? Math.max(0, Number(v.trafficWeight) || 0) : 1;
    return draw < 0;
  }) || variants[variants.length - 1];
  const assignment = { id: randomUUID(), experimentId, visitorId, variantId: selected.id, variantName: selected.name, assignedAt: new Date().toISOString() };
  assignments.set(key, assignment);
  return assignment;
}

function initializeArmStats(experimentId, variantId) {
  const key = `${experimentId}:${variantId}`;
  if (!armStats.has(key)) armStats.set(key, { experimentId, variantId, impressions: 0, conversions: 0 });
  return armStats.get(key);
}

function updateArmStats(experimentId, variantId, conversion = 0) {
  const stats = initializeArmStats(experimentId, variantId);
  if (conversion) stats.conversions += 1;
  else stats.impressions += 1;
  return stats;
}

function getDistribution(experimentId) {
  const allocator = allocations.get(experimentId);
  if (!allocator) return [];
  const assigned = [...assignments.values()].filter(item => item.experimentId === experimentId);
  return allocator.variants.map(variant => ({
    variantId: variant.id,
    variantName: variant.name,
    assigned: assigned.filter(item => item.variantId === variant.id).length,
    weight: Number(variant.trafficWeight) || 0,
  }));
}

function calculateRegret(experimentId) {
  const stats = [...armStats.values()].filter(item => item.experimentId === experimentId);
  const rates = stats.map(item => ({ ...item, rate: item.impressions ? item.conversions / item.impressions : 0 }));
  const best = rates.reduce((winner, item) => !winner || item.rate > winner.rate ? item : winner, null);
  const totalRegret = rates.reduce((sum, item) => sum + ((best?.rate || 0) - item.rate) * item.impressions, 0);
  return { totalRegret, bestVariantId: best?.variantId || null };
}

function selectArm(experimentId, method) {
  const stats = [...armStats.values()].filter(item => item.experimentId === experimentId);
  if (!stats.length) throw new Error('Initialize variant arm statistics first');
  const selected = stats.sort((a, b) => {
    const aRate = a.conversions / (a.impressions || 1);
    const bRate = b.conversions / (b.impressions || 1);
    return bRate - aRate;
  })[0];
  return { id: randomUUID(), experimentId, variantId: selected.variantId, method };
}

function updateAllocator(experimentId, updates = {}) {
  const current = allocations.get(experimentId);
  if (!current) return null;
  Object.assign(current, updates, { updatedAt: new Date().toISOString() });
  return current;
}

module.exports = { allocations, assignments, armStats, createAllocator, assignVariant, initializeArmStats, updateArmStats, getDistribution, calculateRegret, selectArm, updateAllocator };
