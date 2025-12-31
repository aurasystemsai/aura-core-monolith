// Activity log for Returns/RMA Automation
let logs = [];
module.exports = {
  logAction(entry) {
    const log = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: new Date().toISOString() };
    logs.push(log);
    return log;
  },
  listLogs({ rmaId, userId, action } = {}) {
    return logs.filter(l => (!rmaId || l.rmaId === rmaId) && (!userId || l.userId === userId) && (!action || l.action === action));
  },
};
