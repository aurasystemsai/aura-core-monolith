// src/tools/advanced-personalization-engine/auditModel.js
// Compliance and audit utilities for Advanced Personalization Engine
const auditLogs = [];

function recordAudit(data) {
  const entry = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...data };
  auditLogs.push(entry);
  return entry;
}

function listAudits({ ruleId, userId, type } = {}) {
  let entries = auditLogs;
  if (ruleId) entries = entries.filter(e => e.ruleId === ruleId);
  if (userId) entries = entries.filter(e => e.userId === userId);
  if (type) entries = entries.filter(e => e.type === type);
  return entries;
}

module.exports = {
  recordAudit,
  listAudits,
};