// In-memory store for winback activity logs
const logs = [];

function logAction(data) {
  const entry = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...data };
  logs.push(entry);
  return entry;
}

function listLogs({ campaignId, userId, action } = {}) {
  let entries = logs;
  if (campaignId) entries = entries.filter(e => e.campaignId === campaignId);
  if (userId) entries = entries.filter(e => e.userId === userId);
  if (action) entries = entries.filter(e => e.action === action);
  return entries;
}

module.exports = {
  logAction,
  listLogs,
};
