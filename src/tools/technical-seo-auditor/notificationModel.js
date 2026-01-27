// Notification model for Technical SEO Auditor
const notifications = require("../../core/notifications");

async function send(to, message, meta = {}) {
  const now = Date.now();
  notifications.addNotification({
    type: meta.type || "technical-seo",
    message: `[${to || "unknown"}] ${message}`,
    time: now,
  });

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