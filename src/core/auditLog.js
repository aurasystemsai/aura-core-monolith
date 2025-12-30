// src/core/auditLog.js
// Simple audit log utility for critical actions
const fs = require('fs');
const path = require('path');
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || path.join(__dirname, '../data/audit.log');

function logAudit({ action, user, target, details }) {
  const entry = {
    ts: new Date().toISOString(),
    action,
    user: user || null,
    target: target || null,
    details: details || null
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n');
}

module.exports = { logAudit };
