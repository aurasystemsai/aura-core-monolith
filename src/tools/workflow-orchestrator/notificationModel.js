// Notification model for Workflow Orchestrator
const notifications = require("../../core/notifications");

async function send(to, message, meta = {}) {
  const now = Date.now();
  const payload = {
    type: meta.type || "workflow",
    message: `[${to || "unknown"}] ${message}`,
    time: now,
  };

  notifications.addNotification(payload);

  return {
    ok: true,
    delivered: true,
    to,
    message,
    at: new Date(now).toISOString(),
    meta,
  };
}

module.exports = { send };