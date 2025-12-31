// Audit logging for Returns/RMA Automation
let audits = [];
module.exports = {
  recordAudit(entry) {
    const log = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: new Date().toISOString() };
    audits.push(log);
    return log;
  },
  listAudits({ rmaId, userId, type } = {}) {
    return audits.filter(a => (!rmaId || a.rmaId === rmaId) && (!userId || a.userId === userId) && (!type || a.type === type));
  },
};
