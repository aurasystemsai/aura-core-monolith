// Compliance and audit utilities for winback tool
const auditLogs = [];

function recordAudit(data) {
  const entry = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...data };
  auditLogs.push(entry);
  return entry;
}

function listAudits({ campaignId, userId, type } = {}) {
  let entries = auditLogs;
  if (campaignId) entries = entries.filter(e => e.campaignId === campaignId);
  if (userId) entries = entries.filter(e => e.userId === userId);
  if (type) entries = entries.filter(e => e.type === type);
  return entries;
}

module.exports = {
  recordAudit,
  listAudits,
};
