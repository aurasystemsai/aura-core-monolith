// Notification model for Klaviyo Flow Automation
const notifications = require("../../core/notifications");

function send(to, message, meta = {}) {
  const time = Date.now();
  notifications.addNotification({ type: meta.type || "klaviyo-flow", message: `[${to || "unknown"}] ${message}`, time });
  return { ok: true, to, message, at: new Date(time).toISOString(), meta };
}

module.exports = { send };
