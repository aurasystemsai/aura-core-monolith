// Product SEO Engine: Notifications module
const notifications = require("../../core/notifications");

function notify(type, message) {
  const time = Date.now();
  notifications.addNotification({ type, message, time });
  return { ok: true, type, message, at: new Date(time).toISOString() };
}

module.exports = { notify };
