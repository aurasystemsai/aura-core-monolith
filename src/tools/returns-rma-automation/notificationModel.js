// Notification model for Returns/RMA Automation
let notifications = [];
module.exports = {
  addNotification(entry) {
    const notification = { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: new Date().toISOString(), read: false };
    notifications.push(notification);
    return notification;
  },
  listNotifications({ userId, read } = {}) {
    return notifications.filter(n => (!userId || n.userId === userId) && (read === undefined || n.read === read));
  },
  markAsRead(id) {
    const n = notifications.find(n => n.id === id);
    if (!n) return false;
    n.read = true;
    return true;
  },
};
