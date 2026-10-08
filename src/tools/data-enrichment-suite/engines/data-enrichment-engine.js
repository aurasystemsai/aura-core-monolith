'use strict';

const { randomUUID } = require('crypto');
const storageJson = require('../../../core/storageJson');

const FIELD_TYPES = ['Text', 'Number', 'Date', 'Boolean', 'Enum', 'Email', 'Phone', 'URL', 'JSON', 'Computed'];
const PROFILE_TYPES = ['Customers', 'Products', 'Orders', 'Email Subscribers', 'Abandoned Checkouts', 'Inventory'];

function keyFor(kind, shop) {
  const safeShop = String(shop || '').toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  if (!safeShop) throw new Error('shop is required');
  return `data-enrichment-${kind}-${safeShop}`;
}

async function getMappings(shop) {
  return storageJson.get(keyFor('mappings', shop), []);
}

async function createMapping(shop, input = {}) {
  const sourceField = typeof input.sourceField === 'string' ? input.sourceField.trim() : '';
  const targetField = typeof input.targetField === 'string' ? input.targetField.trim() : '';
  const fieldType = typeof input.fieldType === 'string' ? input.fieldType : 'Text';
  if (!sourceField || !targetField) throw new Error('sourceField and targetField are required');
  if (sourceField.length > 160 || targetField.length > 160) throw new Error('field names must be 160 characters or fewer');
  if (!FIELD_TYPES.includes(fieldType)) throw new Error('unsupported fieldType');

  const mapping = {
    id: randomUUID(),
    sourceField,
    targetField,
    fieldType,
    transform: typeof input.transform === 'string' ? input.transform.trim().slice(0, 500) : '',
    createdAt: new Date().toISOString(),
  };
  const key = keyFor('mappings', shop);
  const mappings = await storageJson.get(key, []);
  mappings.push(mapping);
  await storageJson.set(key, mappings);
  return mapping;
}

async function deleteMapping(shop, id) {
  const key = keyFor('mappings', shop);
  const mappings = await storageJson.get(key, []);
  const remaining = mappings.filter(mapping => mapping.id !== id);
  if (remaining.length === mappings.length) return false;
  await storageJson.set(key, remaining);
  return true;
}

async function getHistory(shop) {
  return storageJson.get(keyFor('history', shop), []);
}

async function addHistory(shop, input = {}) {
  const action = typeof input.action === 'string' ? input.action.trim() : '';
  if (!action) throw new Error('action is required');
  const entry = {
    id: randomUUID(),
    action: action.slice(0, 200),
    summary: typeof input.summary === 'string' ? input.summary.trim().slice(0, 2000) : '',
    ranAt: typeof input.ranAt === 'string' && !Number.isNaN(Date.parse(input.ranAt)) ? input.ranAt : new Date().toISOString(),
  };
  const key = keyFor('history', shop);
  const history = await storageJson.get(key, []);
  history.unshift(entry);
  await storageJson.set(key, history.slice(0, 100));
  return entry;
}

async function deleteHistory(shop, id) {
  const key = keyFor('history', shop);
  const history = await storageJson.get(key, []);
  const remaining = history.filter(entry => entry.id !== id);
  if (remaining.length === history.length) return false;
  await storageJson.set(key, remaining);
  return true;
}

function profileDataset(type, records) {
  if (!PROFILE_TYPES.includes(type)) throw new Error('unsupported dataset type');
  if (!Array.isArray(records) || records.length < 1 || records.length > 1000) {
    throw new Error('records must contain between 1 and 1,000 objects');
  }
  if (records.some(record => !record || typeof record !== 'object' || Array.isArray(record))) {
    throw new Error('each record must be an object');
  }

  const fieldNames = [...new Set(records.flatMap(record => Object.keys(record)))];
  if (fieldNames.length === 0) throw new Error('records must contain at least one field');
  if (fieldNames.length > 100) throw new Error('records may contain no more than 100 distinct fields');

  const fieldCompleteness = Object.fromEntries(fieldNames.map(field => {
    const present = records.filter(record => record[field] != null && String(record[field]).trim() !== '').length;
    return [field, `${Math.round((present / records.length) * 100)}%`];
  }));
  const percentages = Object.values(fieldCompleteness).map(value => Number.parseInt(value, 10));
  const overall = Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
  const qualityScore = overall >= 95 ? 'A' : overall >= 80 ? 'B' : overall >= 65 ? 'C' : overall >= 50 ? 'D' : 'F';
  const issues = Object.entries(fieldCompleteness)
    .map(([field, value]) => ({ field, missing: 100 - Number.parseInt(value, 10) }))
    .filter(issue => issue.missing >= 20)
    .sort((a, b) => b.missing - a.missing)
    .map(issue => ({
      field: issue.field,
      problem: `${issue.missing}% of ${records.length} records are missing this field`,
      severity: issue.missing >= 50 ? 'high' : 'medium',
    }));

  return {
    type,
    totalRecords: records.length,
    fieldCount: fieldNames.length,
    completeness: { overall: `${overall}%`, fields: fieldCompleteness },
    qualityScore,
    issues,
    recommendations: issues.slice(0, 5).map(issue => `Improve ${issue.field} completeness; ${issue.problem.toLowerCase()}.`),
    enrichmentOpportunities: issues.slice(0, 5).map(issue => `Enrich or collect ${issue.field} for records where it is missing.`),
  };
}

module.exports = {
  FIELD_TYPES,
  PROFILE_TYPES,
  getMappings,
  createMapping,
  deleteMapping,
  getHistory,
  addHistory,
  deleteHistory,
  profileDataset,
};