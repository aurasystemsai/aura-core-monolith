const { randomUUID } = require('crypto');

const variants = new Map();
const changes = new Map();

function createVariant(input = {}) {
  if (!input.experimentId || !String(input.name || '').trim()) {
    throw new Error('experimentId and name are required');
  }
  const variant = {
    id: randomUUID(),
    experimentId: input.experimentId,
    name: String(input.name).trim(),
    description: input.description || '',
    trafficWeight: Number.isFinite(Number(input.trafficWeight)) ? Number(input.trafficWeight) : 0,
    isControl: Boolean(input.isControl),
    createdAt: new Date().toISOString(),
  };
  variants.set(variant.id, variant);
  changes.set(variant.id, []);
  return variant;
}

function getVariant(id) {
  return variants.get(id) || null;
}

function updateVariant(id, updates = {}) {
  const variant = getVariant(id);
  if (!variant) return null;
  Object.assign(variant, updates, { id });
  return variant;
}

function addChange(id, change) {
  if (!variants.has(id)) return null;
  if (!change?.type) throw new Error('Change type is required');
  const record = { id: randomUUID(), ...change, createdAt: new Date().toISOString() };
  changes.get(id).push(record);
  return record;
}

function duplicateVariant(id, name) {
  const original = getVariant(id);
  if (!original) return null;
  const duplicate = createVariant({
    ...original,
    id: undefined,
    name: name || `${original.name} copy`,
    isControl: false,
  });
  changes.set(duplicate.id, changes.get(id).map(item => ({ ...item })));
  return duplicate;
}

function validateVariant(id) {
  const variant = getVariant(id);
  if (!variant) return null;
  const errors = [];
  if (!variant.name.trim()) errors.push('Variant name is required');
  if (variant.trafficWeight < 0 || variant.trafficWeight > 100) errors.push('Traffic weight must be between 0 and 100');
  return { valid: errors.length === 0, errors };
}

function listVariants(experimentId) {
  return [...variants.values()].filter(variant => variant.experimentId === experimentId);
}

function previewVariant(id, baseUrl) {
  const variant = getVariant(id);
  if (!variant) return null;
  return {
    previewUrl: `${String(baseUrl || '').replace(/\/$/, '')}?ab_variant=${encodeURIComponent(id)}`,
    applyChangesScript: `window.__AURA_AB_VARIANT__=${JSON.stringify(id)};`,
  };
}

module.exports = { variants, changes, createVariant, getVariant, updateVariant, addChange, duplicateVariant, validateVariant, listVariants, previewVariant };
