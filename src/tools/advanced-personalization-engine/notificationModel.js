// src/tools/advanced-personalization-engine/notificationModel.js
// In-memory store for notifications
const notifications = [];

function addNotification(data) {
  const notification = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...data };
  notifications.push(notification);
  return notification;
}

function listNotifications({ userId, read } = {}) {
  let items = notifications;
  if (userId) items = items.filter(n => n.userId === userId);
  if (typeof read === 'boolean') items = items.filter(n => n.read === read);
  return items;
}

function markAsRead(id) {
  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return false;
  notifications[idx].read = true;
  return true;
}

module.exports = {
  addNotification,
  listNotifications,
  markAsRead,
};